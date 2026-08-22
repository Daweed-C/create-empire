#!/usr/bin/env bash
# Resolves the Create: Empire mod list into packwiz metadata files.
#
# Run from the repo root on any machine with internet access (or let the
# GitHub Actions workflow run it). Requires: packwiz on PATH, curl.
#
#   ./scripts/bootstrap.sh
#
# Mods are declared below as "<source> <slug>[|<fallback-slug>...]".
# REQUIRED mods abort the build when they cannot be resolved for the pack's
# Minecraft/loader version; OPTIONAL mods only produce a warning, because the
# 1.21.1 NeoForge ports of some Create addons move fast and occasionally lag
# behind. A summary is written to bootstrap-report.txt.

set -uo pipefail

cd "$(dirname "$0")/../pack"

PACKWIZ="${PACKWIZ:-packwiz}"
REPORT="../bootstrap-report.txt"
: > "$REPORT"

command -v "$PACKWIZ" >/dev/null || { echo "packwiz not found on PATH" >&2; exit 1; }

# --- Pin NeoForge to the latest 21.1.x release ------------------------------
latest_neoforge=$(curl -sSf "https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml" \
  | grep -o '<version>21\.1\.[0-9]*</version>' | grep -o '21\.1\.[0-9]*' | sort -t. -k3 -n | tail -1 || true)
if [ -n "$latest_neoforge" ]; then
  sed -i.bak "s/^neoforge = \".*\"/neoforge = \"$latest_neoforge\"/" pack.toml && rm -f pack.toml.bak
  echo "NeoForge pinned to $latest_neoforge" | tee -a "$REPORT"
else
  echo "WARN: could not query NeoForge maven; keeping pinned version from pack.toml" | tee -a "$REPORT"
fi

failures_required=0

# Dependency slugs that packwiz is allowed to auto-install alongside the
# manifest (MineColonies stack, Sable for Aeronautics, etc.). Anything
# resolved that is neither a manifest candidate nor listed here gets pruned —
# packwiz's search fallback has pulled in unrelated mods before.
# kotlin-for-forge: Slice & Dice. minecolonies-tweaks: MineColonies
# Compatibility. create-dragons-plus: Central Kitchen + Enchantment Industry.
# (All three confirmed by in-game dependency errors after being pruned.)
KNOWN_DEPS="structurize blockui domum-ornamentum multi-piston sable sophisticated-core yungs-api architectury-api rpl cristel-lib flywheel ponder kotlin-for-forge minecolonies-tweaks create-dragons-plus rhino architectury"

ALLOWED=""
REQ_CHECKS=()
OPT_CHECKS=()

# ID-based adds (mrid/cfid) resolve exactly and cannot fuzzy-match, so the
# files they create — dependencies included — are whitelisted automatically
# by diffing mods/ around the add.
autoAllowNew() {
  local pre="$1" f base
  for f in mods/*.pw.toml; do
    [ -e "$f" ] || continue
    base=$(basename "$f")
    case "$pre" in
      *" $base "*) ;;
      *) ALLOWED="$ALLOWED ${base%.pw.toml}" ;;
    esac
  done
}
snapshotMods() {
  local f out=" "
  for f in mods/*.pw.toml; do
    [ -e "$f" ] && out="$out$(basename "$f") "
  done
  printf '%s' "$out"
}

# Candidates are separated by "|". Each candidate may carry an explicit
# source prefix ("mr:slug" for Modrinth, "cf:slug" for CurseForge,
# "cfid:<numeric id>" / "mrid:<project id>" for exact store IDs); without a
# prefix it uses the mod's default source. This lets any mod fall back to the
# other store, e.g. "minecolonies|cf:minecolonies".
add_mod() {
  local level="$1" default_source="$2" slugs="$3" name="$4"
  local token slug src ok=0 out last_err="" expected="" pre=""
  IFS='|' read -ra candidates <<< "$slugs"
  # Register every slug candidate for the prune allowlist and verify pass UP
  # FRONT, not as candidates get tried: when an ID candidate succeeds first,
  # the untried slug candidates are still the names the resolved files carry
  # (learned the hard way — the prune once deleted FTB Quests that the ID
  # add had just correctly installed).
  for token in "${candidates[@]}"; do
    case "$token" in
      cfid:*|mrid:*|cftx:*) ;;  # ids resolve to other slugs; texture packs don't land in mods/
      mr:*|cf:*) ALLOWED="$ALLOWED ${token#*:}"; expected="$expected ${token#*:}" ;;
      *)         ALLOWED="$ALLOWED $token"; expected="$expected $token" ;;
    esac
  done
  for token in "${candidates[@]}"; do
    case "$token" in
      mr:*)   src=mr;   slug="${token#mr:}" ;;
      cf:*)   src=cf;   slug="${token#cf:}" ;;
      cfid:*) src=cfid; slug="${token#cfid:}" ;;
      mrid:*) src=mrid; slug="${token#mrid:}" ;;
      cftx:*) src=cftx; slug="${token#cftx:}" ;;
      *)      src="$default_source"; slug="$token" ;;
    esac
    case "$src" in
      # Packwiz falls back to fuzzy search for names AND urls it can't
      # resolve exactly, and -y silently takes the first hit — that has
      # pulled entirely unrelated mods into the pack twice. IDs are immune;
      # slug/url misses are caught by the prune + verify pass below.
      mr)   out=$("$PACKWIZ" modrinth add "https://modrinth.com/mod/$slug" -y 2>&1) && ok=1 && break ;;
      mrid)
        pre=$(snapshotMods)
        if out=$("$PACKWIZ" modrinth add --project-id "$slug" -y 2>&1); then
          ok=1; autoAllowNew "$pre"; break
        fi ;;
      cf)   out=$("$PACKWIZ" curseforge add "https://www.curseforge.com/minecraft/mc-mods/$slug" -y 2>&1) && ok=1 && break ;;
      cfid)
        pre=$(snapshotMods)
        if out=$("$PACKWIZ" curseforge add --addon-id "$slug" -y 2>&1); then
          ok=1; autoAllowNew "$pre"; break
        fi ;;
      cftx) out=$("$PACKWIZ" curseforge add "https://www.curseforge.com/minecraft/texture-packs/$slug" -y 2>&1) && ok=1 && break ;;
    esac
    last_err=$(printf '%s' "$out" | tail -1)
  done
  if [ "$level" = required ]; then
    REQ_CHECKS+=("$name::$expected")
  else
    OPT_CHECKS+=("$name::$expected")
  fi
  if [ "$ok" = 1 ]; then
    echo "OK       $name ($src:$slug)" | tee -a "$REPORT"
  elif [ "$level" = required ]; then
    echo "MISSING  $name ($slugs) — REQUIRED — last error: $last_err" | tee -a "$REPORT"
    failures_required=$((failures_required + 1))
  else
    echo "skipped  $name ($slugs) — no 1.21.1 NeoForge build found (optional) — last error: $last_err" | tee -a "$REPORT"
  fi
}

req() { add_mod required "$@"; }
opt() { add_mod optional "$@"; }

echo "== Core: Create =="
req mr "create"                          "Create"
req mr "create-steam-n-rails-1.21.1|steam-n-rails" "Create: Steam 'n' Rails (NeoForge port)"
req mr "create-aeronautics"              "Create: Aeronautics (pulls in Sable)"

echo "== Core: Colony =="
req mr "minecolonies|cf:minecolonies"    "MineColonies (pulls in Structurize/BlockUI/Domum/Multi-Piston)"
opt cf "minecolonies-compatibility"      "MineColonies Compatibility addon (modded food & crops)"
opt cf "stylecolonies"                   "Stylecolonies (extra building style packs incl. Create-themed Steampunk)"
# SmallColonies & SmallColonies ME (Littleton styles) both have 1.21.1
# builds, but their author opted out of third-party API downloads, which
# blocks .mrpack export. Manual install only — see README "Optional manual
# add-ons". Do not re-add here.
opt cf "cftx:minecolonies-vanillafied"   "MineColonies Vanillafied (vanilla-look retexture, resource pack)"

echo "== Simulation =="
req mr "kubejs"                          "KubeJS (runs the Charter colony simulation)"

echo "== Quests =="
# FTB publishes on CurseForge, not Modrinth. Resolved by numeric project ID
# because even the URL form fuzzy-matched wrong projects; the slug candidate
# after each ID is what the verify pass expects to find on disk.
req cf "cfid:289412|ftb-quests-forge"    "FTB Quests"
req cf "cfid:404468|ftb-teams-forge"     "FTB Teams"
req cf "cfid:404465|ftb-library-forge"   "FTB Library"

echo "== Food & farming =="
req mr "farmers-delight"                 "Farmer's Delight"
opt mr "create-central-kitchen"          "Create: Central Kitchen"
opt mr "slice-and-dice|create-slice-and-dice" "Create: Slice & Dice"

echo "== Create addons: rails, sky, defense, factory =="
opt mr "create-big-cannons"              "Create Big Cannons"
opt mr "create-connected"                "Create: Connected"
opt mr "copycats|copycats-plus"          "Create: Copycats+"
# Modrinth only: the CurseForge slug "create-structures" is an unrelated
# "Create Structure" mod (needs createdeco/bits_n_bobs). Stays skipped until
# the real Create: Structures ships a 1.21.1 NeoForge build.
opt mr "create-structures"               "Create: Structures"
opt mr "bells-and-whistles|bellsandwhistles" "Create: Bells & Whistles"
opt mr "create-enchantment-industry"     "Create: Enchantment Industry"
opt mr "create-diesel-generators"        "Create: Diesel Generators"
opt mr "create-blocks-and-bogies|blocks-and-bogies|cf:create-blocks-and-bogies" "Create: Blocks & Bogies"

echo "== Storage & QoL =="
# JEI replaced by EMI, JourneyMap by Xaero's (both arrive via the absorbed
# Create+ list) — curation decisions 2026-08-18.
req mr "jade"                            "Jade"
opt mr "appleskin"                       "AppleSkin"
opt mr "mouse-tweaks"                    "Mouse Tweaks"
opt mr "sophisticated-backpacks"         "Sophisticated Backpacks"
opt mr "sophisticated-storage"           "Sophisticated Storage"

echo "== Performance =="
req mr "sodium"                          "Sodium"
req mr "ferrite-core"                    "FerriteCore"
opt mr "lithium"                         "Lithium"
opt mr "modernfix"                       "ModernFix"
opt mr "entityculling"                   "Entity Culling"
opt mr "immediatelyfast"                 "ImmediatelyFast"
opt mr "iris"                            "Iris (shader support)"

echo "== Worldgen & threat =="
req mr "paxi"                            "Paxi (loads the bundled compat datapack; pulls in YUNG's API)"
opt mr "terralith"                       "Terralith"
opt mr "towns-and-towers"                "Towns & Towers"
opt mr "ct-overhaul-village"             "ChoiceTheorem's Overhauled Villages (CTOV)"
opt mr "yungs-better-mineshafts"         "YUNG's Better Mineshafts"
opt mr "yungs-better-strongholds"        "YUNG's Better Strongholds"
opt mr "yungs-better-desert-temples"     "YUNG's Better Desert Temples"
opt mr "guard-villagers"                 "Guard Villagers"
# talhanation's hireable-humans suite — availability probe for 1.21.1
# NeoForge (confirmed builds were 1.20.1 Forge; CI is the arbiter).
opt mr "recruits|cf:recruits"            "Villager Recruits (soldiers, patrols, sieges)"
opt mr "workers|cf:workers"              "Villager Workers 2 (hireable laborers)"

# --- Mods absorbed from the Create+ pack (see scripts/createplus-mods.sh) ---
source ../scripts/createplus-mods.sh

# --- MineColonies x Farmer's Delight compat datapack ------------------------
# Fetched into Paxi's global datapack folder so it applies to every world.
if command -v jq >/dev/null; then
  dp_url=$(curl -sSf 'https://api.modrinth.com/v2/project/mcfd-compat-patch/version?game_versions=%5B%221.21.1%22%5D' \
    | jq -r '.[0].files[0].url // empty' || true)
  if [ -n "$dp_url" ]; then
    mkdir -p config/paxi/datapacks
    curl -sSfL "$dp_url" -o config/paxi/datapacks/mcfd-compat-patch.zip \
      && echo "OK       MineColonies/Farmer's Delight compat datapack" | tee -a "$REPORT" \
      || echo "skipped  mcfd-compat-patch download failed" | tee -a "$REPORT"
  else
    echo "skipped  mcfd-compat-patch — no 1.21.1 build published yet (MineColonies Compatibility addon covers most of it)" | tee -a "$REPORT"
  fi
fi

# --- Bundle our own compat datapack (source lives in sources/datapack) ------
if [ -d ../sources/datapack/create-empire-compat ]; then
  mkdir -p config/paxi/datapacks
  (cd ../sources/datapack/create-empire-compat && zip -qr ../../../pack/config/paxi/datapacks/create-empire-compat.zip .) \
    && echo "OK       bundled create-empire-compat datapack" | tee -a "$REPORT"
fi

# --- Prune: whitelist enforcement -------------------------------------------
# Delete every resolved metafile that is neither a manifest candidate nor a
# known dependency. This is the hard backstop against packwiz's fuzzy-search
# fallback silently substituting the wrong project.
for f in mods/*.pw.toml; do
  [ -e "$f" ] || continue
  base=$(basename "$f" .pw.toml)
  case " $ALLOWED $KNOWN_DEPS " in
    *" $base "*) ;;
    *) rm -f "$f"
       echo "PRUNED   $base — resolved but not in manifest or known dependencies" | tee -a "$REPORT" ;;
  esac
done

"$PACKWIZ" refresh

# --- Verify: required mods must exist on disk under an expected name --------
# An add can exit 0 while having installed the wrong project (now pruned), so
# "OK" lines alone prove nothing — presence of the expected file does.
for entry in "${REQ_CHECKS[@]}"; do
  name="${entry%%::*}"; expected="${entry#*::}"
  [ -z "${expected// /}" ] && continue  # id-only entries are tracked by autoAllowNew
  found=0
  for s in $expected; do
    [ -f "mods/$s.pw.toml" ] && found=1 && break
  done
  if [ "$found" = 0 ]; then
    echo "VERIFY FAIL  required '$name' has no resolved file (expected one of:$expected)" | tee -a "$REPORT"
    failures_required=$((failures_required + 1))
  fi
done
for entry in "${OPT_CHECKS[@]}"; do
  name="${entry%%::*}"; expected="${entry#*::}"
  [ -z "${expected// /}" ] && continue  # id-only entries are tracked by autoAllowNew
  found=0
  for s in $expected; do
    [ -f "mods/$s.pw.toml" ] && found=1 && break
  done
  [ "$found" = 0 ] && echo "note     optional '$name' not present after verification" | tee -a "$REPORT"
done

# Full manifest of what actually got resolved — every jar the pack will
# install must correspond to a line here. Anything unexpected means a lookup
# matched the wrong project.
{
  echo
  echo "-- resolved mod files --"
  ls mods/*.pw.toml 2>/dev/null | sed 's|^mods/||; s|\.pw\.toml$||' | sort
} >> "$REPORT"

echo
echo "==== bootstrap summary (bootstrap-report.txt) ===="
cat "$REPORT"

if [ "$failures_required" -gt 0 ]; then
  echo "ERROR: $failures_required required mod(s) could not be resolved." >&2
  exit 1
fi
