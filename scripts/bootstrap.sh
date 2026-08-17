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

add_mod() {
  local level="$1" source="$2" slugs="$3" name="$4"
  local slug ok=0
  IFS='|' read -ra candidates <<< "$slugs"
  for slug in "${candidates[@]}"; do
    if [ "$source" = mr ]; then
      "$PACKWIZ" modrinth add "$slug" -y >/dev/null 2>&1 && ok=1 && break
    else
      "$PACKWIZ" curseforge add "$slug" -y >/dev/null 2>&1 && ok=1 && break
    fi
  done
  if [ "$ok" = 1 ]; then
    echo "OK       $name ($source:$slug)" | tee -a "$REPORT"
  elif [ "$level" = required ]; then
    echo "MISSING  $name ($source:$slugs) — REQUIRED" | tee -a "$REPORT"
    failures_required=$((failures_required + 1))
  else
    echo "skipped  $name ($source:$slugs) — no 1.21.1 NeoForge build found (optional)" | tee -a "$REPORT"
  fi
}

req() { add_mod required "$@"; }
opt() { add_mod optional "$@"; }

echo "== Core: Create =="
req mr "create"                          "Create"
req mr "create-steam-n-rails-1.21.1|steam-n-rails" "Create: Steam 'n' Rails (NeoForge port)"
req mr "create-aeronautics"              "Create: Aeronautics (pulls in Sable)"

echo "== Core: Colony =="
req mr "minecolonies"                    "MineColonies (pulls in Structurize/BlockUI/Domum/Multi-Piston)"
opt cf "minecolonies-compatibility"      "MineColonies Compatibility addon (modded food & crops)"
opt cf "stylecolonies"                   "Stylecolonies (extra building style packs)"

echo "== Quests =="
req mr "ftb-quests|ftb-quests-forge"     "FTB Quests"
req mr "ftb-teams|ftb-teams-forge"       "FTB Teams"
req mr "ftb-library|ftb-library-forge"   "FTB Library"

echo "== Food & farming =="
req mr "farmers-delight"                 "Farmer's Delight"
opt mr "create-central-kitchen"          "Create: Central Kitchen"
opt mr "slice-and-dice|create-slice-and-dice" "Create: Slice & Dice"

echo "== Create addons: rails, sky, defense, factory =="
opt mr "create-big-cannons"              "Create Big Cannons"
opt mr "create-connected"                "Create: Connected"
opt mr "copycats|copycats-plus"          "Create: Copycats+"
opt mr "create-structures"               "Create: Structures"
opt mr "bells-and-whistles|bellsandwhistles" "Create: Bells & Whistles"
opt mr "create-enchantment-industry"     "Create: Enchantment Industry"
opt mr "create-diesel-generators"        "Create: Diesel Generators"
opt mr "create-blocks-and-bogies|blocks-and-bogies" "Create: Blocks & Bogies"

echo "== Storage & QoL =="
req mr "jei"                             "JEI"
req mr "jade"                            "Jade"
opt mr "journeymap"                      "JourneyMap"
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
opt mr "yungs-better-mineshafts"         "YUNG's Better Mineshafts"
opt mr "yungs-better-strongholds"        "YUNG's Better Strongholds"
opt mr "yungs-better-desert-temples"     "YUNG's Better Desert Temples"
opt mr "guard-villagers"                 "Guard Villagers"

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

"$PACKWIZ" refresh

echo
echo "==== bootstrap summary (bootstrap-report.txt) ===="
cat "$REPORT"

if [ "$failures_required" -gt 0 ]; then
  echo "ERROR: $failures_required required mod(s) could not be resolved." >&2
  exit 1
fi
