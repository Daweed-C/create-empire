# Create: Empire

A Minecraft **1.21.1 (NeoForge)** modpack about founding a village, becoming its
governor, industrialising it with **Create**, and growing it into an empire of
colonies connected by **trains** and **airships**.

- **Govern** — [MineColonies](https://minecolonies.com): claim land, recruit
  citizens, assign jobs, keep them fed and safe, survive raids.
- **Industrialise** — [Create 6](https://modrinth.com/mod/create) + addons:
  automate food, materials and logistics with rotational machinery.
- **Connect** — Steam 'n' Rails trains and **Create: Aeronautics** airships
  carry Create 6 logistics packages between your colonies: physical trade
  routes, not magic item teleportation.

A five-chapter FTB Quests line (Hamlet → Foundry & Fields → Rail Age → Air Age
→ Empire) teaches the loop. Vanilla-friendly throughout: no magic tech, no HUD
clutter, and MineColonies' scan tool lets you use your **own vanilla-style
buildings** as colony schematics.

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
