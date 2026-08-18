# The Charter — colony simulation for Create: Empire

A demand-side economy simulation over vanilla villagers, in the spirit of
Anno 1800 and Manor Lords: tiered populations with escalating consumption
needs. Create factories are the supply side; the Charter is the demand side.
No custom blocks, no custom entities, no textures — vanilla visuals only
(villagers, bells, barrels, bossbars). Implemented in KubeJS (JavaScript)
shipped inside the pack.

## Why demand simulation is the right cut

Anno's magic loop: population tiers consume goods → higher tiers demand
manufactured goods → you build supply chains to promote them → promotion
raises consumption and unlocks new tech. In our pack the supply chains are
**Create contraptions the player physically builds** — strictly better than
Anno's abstract production buildings. The sim only needs to generate demand,
verify supply, and translate the result into visible colony life.

## Core objects

- **Charter**: a vanilla **Bell placed on top of a Barrel**, registered by
  sneak + right-clicking the bell with an emerald. The bell is the town
  center (vanilla raids already ring bells); the barrel is the **tribute
  depot** — the inventory the colony eats from. Create can fill it (chutes,
  funnels, trains) like any inventory: that's the whole integration.
- **Population**: villagers within the charter radius (48 blocks). Counted,
  not owned — housing/breeding stays pure vanilla.
- **Happiness** (0–100 per colony): rises when the last cycle's needs were
  met, falls when they weren't.
- **Tier** (per colony, like Anno's population classes — themed to the
  pack's tech ages):

| Tier | Name | Needs (consumed per capita per cycle) | Supply chain implied |
| --- | --- | --- | --- |
| I | Settlers | simple food (bread, baked potato, cooked meats) | vanilla farming |
| II | Citizens | + varied meals (Farmer's Delight cooked dishes), + wool | FD kitchen, sheep |
| III | Burghers | + paper goods (paper/books), + building materials (bricks/stone) | Create presses, mills |
| IV | Industrialists | + luxuries (Create chocolate, cake), + clockworks (vanilla clocks/spyglasses) | full brass-age automation |

Each tier consumes its own needs **plus all lower tiers'** (Anno rule).
Higher tiers = more demanding, richer taxes, better bonuses.

## The cycle

Every sim step (default: 1 in-game hour ≈ 50s real time):

1. Count population; compute demand per need from tier + population.
2. Withdraw goods from the tribute barrel (partial fulfillment allowed).
3. Fulfillment ratio → happiness delta (weighted: food > comfort > luxury).
4. Apply outcomes:
   - **Thriving** (happiness ≥ 70): happy particles, slow population growth
     (spawns capped by beds/housing), tax income (emeralds appear in the
     tribute barrel — the colony pays you).
   - **Content** (40–69): stable; nothing dramatic.
   - **Struggling** (< 40): bell tolls, angry particles, population decline
     (villagers emigrate), no taxes.
5. Update the colony **bossbar** (name, population, tier, happiness) shown
   to players near the colony.

**Promotion** is player-triggered, like Anno: when happiness has been ≥ 70
for N consecutive cycles and the next tier's goods are stocked in the
barrel, sneak-click the bell with the tier's promotion token (I: emerald →
II: emerald block → III: brass ingot → IV: precision mechanism). Promotion
raises the consumption matrix — your factories must keep up or the colony
slides back.

**Threat** scales with wealth: cumulative taxes paid raise a raid meter;
crossing thresholds triggers vanilla raids at the colony (guards, walls,
Guard Villagers and Big Cannons become load-bearing).

**Trade/empire**: each charter is independent; different colonies will sit
in different biomes with different local resources, so meeting Tier III+
needs everywhere requires **moving goods between colonies** — the Create
trains/airships/packages layer, exactly as the pack intends. A later
version adds per-colony specialization bonuses (a colony near a mesa gets a
brick-production tax bonus, etc.).

## What this deliberately does NOT simulate

Individual villager job AI (Manor Lords' visible laborers). Vanilla villager
AI provides ambient life (workstations, gossip, sleep, iron golems); real
labor simulation is either the Recruits/Workers mods (if their 1.21.1 ports
materialize) or the eventual Java addon. The Charter keeps colony *state*
alive; bodies-at-work is a separate layer.

## Implementation phases

- **v0.1 (shipped)**: charter registration, population census, Tier I food
  consumption, happiness, bossbar, thriving/struggling effects, growth and
  decline. Single tier, overworld only.
- **v0.2**: full tier matrix + promotion tokens + per-need weighting.
- **v0.3**: taxes, raid meter, festival (ring the bell manually → spend
  goods for a happiness burst).
- **v0.4**: multi-colony ledger command (`/charter ledger`), per-colony
  specialization, quest chapter rewritten around the Charter loop.
- **vNext**: if the loop proves fun and outgrows scripting, port to a real
  NeoForge addon ("Create: Charter") reusing the proven design.

## Files

- `pack/kubejs/server_scripts/charter.js` — the simulation (server-side).
- Balance constants live at the top of the script, clearly labeled.
