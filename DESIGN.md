# Create: Empire — Design Document

## Fantasy

You found a hamlet, govern it, industrialise it with Create, and grow it into
an empire of specialised colonies trading with each other over rail and air
routes you built by hand. Minecraft stays Minecraft — the pack adds a
*management* layer (MineColonies) and an *automation* layer (Create), and the
game is the interplay between them.

## Platform decision

**Minecraft 1.21.1 + NeoForge**, because:

- **Create: Aeronautics only exists there** (released 2026 on the Sable
  physics engine, 1.21.1 NeoForge). Aeronautics was a named requirement.
- Create 6, MineColonies, Farmer's Delight, FTB Quests and the performance
  stack are all first-class on 1.21.1 NeoForge.
- Steam 'n' Rails has a maintained 1.21.1 NeoForge port.
- The addon ecosystem's active development moved to NeoForge; 1.20.1 Forge
  has a larger *legacy* addon pool but is frozen and lacks Aeronautics.

Trade-off accepted: a few long-tail Create addons never left 1.20.1. The
bootstrap script treats those as optional and reports them.

## The three pillars

### 1. Govern (MineColonies)

Town Hall, citizens with jobs/needs/happiness, builders that construct from
schematics, guards, raids, research. Two known objections, both solved in the
data layer:

- **"Citizens can't eat modded food"** → the *MineColonies Compatibility*
  addon plus the *MineColonies/Farmer's Delight compat patch* datapack
  register modded foods and fix food-tier rejection. Our own
  `create-empire-compat` datapack is the extension point for anything they
  miss.
- **"Structures aren't vanilla-friendly"** → building styles are pure
  schematic packs. We ship extra styles (Stylecolonies) and, crucially, the
  **scan tool** workflow: build your own vanilla-style structures, scan them,
  and the colony uses *your* architecture.

Raid difficulty is tuned up in `defaultconfigs/minecolonies-server.toml` so
the defense pillar (guard towers, walls, Create Big Cannons) is load-bearing.

### 2. Industrialise (Create 6 + addons)

Standard Create progression (andesite → brass) reframed as civic
infrastructure: the water wheel is the town mill, the press is the town
forge, Farmer's Delight + kitchen addons make food automation a real
discipline. The colony consumes what the machines produce (via warehouse and
restaurant), closing the loop.

### 3. Connect (trains, airships, packages)

Create 6's logistics network (Packagers, Stock Tickers, package items) is the
trade mechanic; Steam 'n' Rails trains and Aeronautics airships are the
transport mechanic. Colonies specialise, surpluses move physically. Nothing
teleports.

## Progression (FTB Quests, 5 chapters)

| Chapter | Theme | Gate |
| --- | --- | --- |
| I · The Hamlet | Found colony, first huts, first guard tower | MineColonies basics |
| II · Foundry & Fields | Water wheel → press → automated kitchen feeding the restaurant | Andesite + food loop |
| III · The Rail Age | Precision mechanisms, first railway, second colony, freight line | Brass + trains |
| IV · The Air Age | First airship, remote sky-harbor colony, defended empire | Aeronautics |
| V · The Empire | Packager/Stock Ticker trade network, university, five colonies | Create 6 logistics |

Quests use item-detection tasks where item ids are certain and checkmark
tasks for milestone achievements (e.g. "second colony connected by rail")
that no task type can detect.

## Mod list

The authoritative list is `scripts/bootstrap.sh` (required vs optional, with
fallback slugs). Summary:

- **Core**: Create, Steam 'n' Rails (NeoForge port), Aeronautics (+Sable),
  MineColonies (+Structurize stack)
- **Compat**: MineColonies Compatibility, MCFD compat datapack, Paxi,
  create-empire-compat (bundled)
- **Create addons (optional tier)**: Big Cannons, Connected, Copycats+,
  Structures, Bells & Whistles, Enchantment Industry, Diesel Generators,
  Blocks & Bogies, Central Kitchen, Slice & Dice
- **Food**: Farmer's Delight
- **Quests**: FTB Quests / Teams / Library
- **QoL**: JEI, Jade, JourneyMap, AppleSkin, Mouse Tweaks, Sophisticated
  Backpacks/Storage
- **Performance**: Sodium, FerriteCore, Lithium, ModernFix, Entity Culling,
  ImmediatelyFast, Iris
- **Worldgen/threat**: Terralith, Towns & Towers, YUNG's structures, Guard
  Villagers

## Roadmap

- **v0.2** — in-game smoke test: verify quest item ids, MineColonies config
  keys, Flywheel/Sodium interplay; pin exact mod versions in packwiz metadata
  and commit them for reproducible builds.
- **v0.3** — recipe gating: advanced hut blocks require Create industrial
  goods (brass, precision mechanisms) via verified `data/minecolonies/recipe/`
  overrides; expand the compat datapack with Create food registrations.
- **v0.4** — custom vanilla-style MineColonies style pack ("Empire" style)
  built with the scan tool; ship as a Structurize style pack.
- **v1.0** — full quest pass (rewards economy, reward tables), balancing,
  server files, pack publishing on Modrinth/CurseForge.
