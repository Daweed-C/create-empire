# Create: Empire

A Minecraft **1.21.1 (NeoForge)** modpack where **you are the
Governor-Engineer: the machines are your workforce, the people are your
purpose.** An engineering sandbox × colony sim hybrid — Anno 1800's demand
economy running inside Minecraft's freedom, with Create as the production
layer. See [DESIGN.md](DESIGN.md) for the full concept.

- **Govern** — **The Charter**, this pack's own simulation over vanilla
  villagers: named citizens with needs, housing and homelessness, guild-board
  building registration, growth, migration — and starvation, if you fail
  them.
- **Industrialise** — [Create 6](https://modrinth.com/mod/create) + addons:
  your supply chains answer the colony's demand curve.
- **Connect** — Steam 'n' Rails trains and **Create: Aeronautics** airships
  carry goods between specialized colonies: physical trade routes, not magic
  item teleportation.

A five-chapter FTB Quests line retells the three acts (Homestead → Industry
→ Empire, ending in Coronation). Vanilla-friendly throughout: vanilla
visuals only, total building freedom, no custom UI. (MineColonies currently
ships as transitional content and retires in v0.3 — the Charter is the
pack's colony system.)

## Getting the pack

The pack is defined as a [packwiz](https://packwiz.infra.link/) project in
[`pack/`](pack/). GitHub Actions resolves the mod list and exports installable
packs on every push:

1. Go to **Actions → Build modpack → latest run → Artifacts** and download
   `create-empire-modpack`. It contains:
   - `Create-Empire.mrpack` — import directly into Prism Launcher, ATLauncher
     or Modrinth App.
   - `Create-Empire-curseforge.zip` — import into the CurseForge launcher.
   - `bootstrap-report.txt` — which mods resolved and which optional addons
     had no 1.21.1 NeoForge build yet.

Tagging a commit `v*` publishes the same files as a GitHub Release.

## Keeping your Prism instance up to date automatically

Every push also publishes the fully resolved pack to the **`deploy`** branch.
[packwiz-installer](https://packwiz.infra.link/tutorials/installing/packwiz-installer/)
can sync a Prism instance against it on every launch, downloading only files
that changed. Requires the repository to be **public**.

One-time setup:

1. Download `packwiz-installer-bootstrap.jar` from
   [packwiz-installer-bootstrap releases](https://github.com/packwiz/packwiz-installer-bootstrap/releases/latest)
   and drop it into the instance's `minecraft` folder
   (Prism: right-click instance → **Folder**).
2. Prism: right-click instance → **Settings → Custom commands**, enable
   custom commands, and set the **pre-launch command** to:

   ```
   "$INST_JAVA" -jar packwiz-installer-bootstrap.jar https://raw.githubusercontent.com/Daweed-C/create-empire/deploy/pack.toml
   ```

From then on, pressing Play checks the repo and applies any changes before
the game starts. Note: if the pack ever moves to a new NeoForge/Minecraft
version, update the instance's loader version in Prism (**Version** page)
by hand — the sync updates mods and configs, not the loader itself.

## Optional manual add-ons

Two style extras can't ship inside the pack but are a one-minute personal
install (the auto-sync never touches files it didn't install, so they
survive updates):

- **[SmallColonies](https://www.curseforge.com/minecraft/mc-mods/smallcolonies)
  and [SmallColonies ME](https://www.curseforge.com/minecraft/mc-mods/smallcolonies-me)**
  (Littleton — compact vanilla-look colony styles; both have 1.21.1 builds) —
  author opted out of automated downloads; download the 1.21.1 jars and drop
  them into the instance's `minecraft/mods/` folder.
- **[MineColonies Vanillafied](https://www.curseforge.com/minecraft/texture-packs/minecolonies-vanillafied)**
  (retextures MineColonies' shingle roofs / decorative blocks to look
  vanilla) — made for 1.20.1, untested on 1.21: drop the zip into
  `minecraft/resourcepacks/`, enable it in Options → Resource Packs, and
  judge with your own eyes.

The long-term answer to vanilla-looking colonies is the home-grown **Empire
style** — see [`sources/empire-style/README.md`](sources/empire-style/README.md).

## Building locally

Requires [packwiz](https://packwiz.infra.link/installation/) and `curl`:

```sh
./scripts/bootstrap.sh              # resolve mods into pack/mods/*.pw.toml
cd pack
packwiz modrinth export             # → .mrpack
# or: packwiz curseforge export
```

To test in a dev instance, `packwiz serve` in `pack/` plus the
[packwiz-installer](https://packwiz.infra.link/tutorials/installing/packwiz-installer/)
bootstrap works well.

## Repository layout

| Path | Purpose |
| --- | --- |
| `pack/` | The packwiz pack: `pack.toml`, configs, quests |
| `pack/config/ftbquests/quests/` | The five-chapter questline (SNBT) |
| `pack/defaultconfigs/minecolonies-server.toml` | Tuned colony/raid defaults for new worlds |
| `sources/datapack/create-empire-compat/` | Bundled MineColonies↔Create datapack (zipped into Paxi at build time) |
| `scripts/bootstrap.sh` | The mod manifest — resolves every mod against Modrinth/CurseForge |
| `DESIGN.md` | The full design document |

## Status

**v0.1.0 — playable skeleton.** The mod list, configs and questline are in
place; item ids in quests and config keys should be smoke-tested in-game and
optional addons re-checked as their 1.21.1 ports mature. See `DESIGN.md` for
the roadmap.
