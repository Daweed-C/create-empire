# The "Empire" style — our own vanilla/Create colony architecture

The goal: a MineColonies building style made of **pure vanilla + Create
blocks** (oak, stone brick, deepslate, copper, andesite casing) — no Domum
Ornamentum shingles, nothing that doesn't look like Minecraft. Building
styles are data (blueprint files), so this needs no Java: we author it
together and ship it through the pack like any other update.

## The workflow (per building)

1. **Build it in game** (creative test world recommended — keep your survival
   colony pristine). Any size, any blocks. Place the matching **hut block**
   (e.g. the Builder's Hut block) where the building's anchor should be.
2. **Scan it**: grab the **Scan Tool** (search JEI). Right-click one corner,
   left-click the opposite corner, open the tool GUI, name the scan (e.g.
   `builderhut1` — the trailing number is the building level), and confirm.
3. The scan lands in your instance folder under
   `minecraft/blueprints/<your name>/scans/` as a `.blueprint` file.
4. **Send the file(s) to Claude in chat.** They get committed under
   `pack/blueprints/empire/`, wired into the style pack metadata, and the
   auto-sync delivers the updated style to every instance.
5. In the build tool, pick the **Empire** style for that building.

## Rules of thumb

- Hut buildings want one blueprint per level (`name1` … `name5`). Start with
  level 1 — we can reuse it for higher levels until you design upgrades.
- MineColonies lets you mix styles per building, so Empire can grow one
  building at a time while other styles fill the gaps.
- Keep footprints modest (Littleton uses 11×11 as its unit — a good target)
  and leave door/path access on the anchor side.

## Status

- [ ] Town Hall
- [ ] Builder's Hut
- [ ] Tavern
- [ ] Farmer's Hut
- [ ] Restaurant / Cook
- [ ] Warehouse + Courier
- [ ] Guard Tower
- [ ] University
