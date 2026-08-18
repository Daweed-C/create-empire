# The Charter — colony simulation for Create: Empire (design v2)

A demand-side economy and demographics simulation over vanilla villagers, in
the spirit of Anno 1800 and Manor Lords. Create factories are the supply
side; the Charter is the demand side. Vanilla visuals only. Implemented in
KubeJS (Rhino-safe JS) shipped inside the pack.

Decisions locked with the Governor (2026-08-18): realistic housing with
homelessness · guild-sign building registration · structure/service needs ·
full stakes (decline, raids, AND starvation deaths) · named citizens.

## 1. Buildings: the Guild Board system

The player builds (or prints) **anything, anywhere, freely**. A building
becomes real to the simulation when the Governor hangs a **sign on it and
registers it**: sneak + right-click the sign holding **Paper** (the deed).
The sign's first line declares the function — like the painted boards of
old taverns and merchant guilds:

| Sign says (1st line contains) | Building | Simulation effect |
| --- | --- | --- |
| `House` / `Home` | Dwelling | Adds housing capacity = beds found near the sign (max 4 per house) |
| `Workshop` | Workplace | (v0.3) employment: villagers with professions near workshops earn taxes |
| `School` | Service | (v0.3) required for Tier III; educates faster promotion |
| `Guard` | Service | (v0.3) reduces raid damage odds; wants an iron golem or armed stand nearby |
| `Market` | Service | (v0.3) required for Tier II+; wants item frames / trade stalls nearby |

Registration is per-colony (nearest charter bell). Destroyed signs silently
retire the building. The sign IS the building's soul — renovate freely
behind it.

**Prebuilds** need no separate system: the pack ships **Create schematic
files** (`schematics/*.nbt`). Governor workflow: Schematic Table → print the
blueprint → Schematicannon + materials builds it → hang the board → done.
Hand-built and cannon-built structures are indistinguishable to the sim, by
design. Prebuild library grows the same way as the Empire style: the
Governor saves a design with Create's Schematic & Quill and sends the .nbt
for inclusion in the pack.

## 2. Demographics (realistic, per colony)

- **Housing capacity** = Σ beds of registered Houses (each capped at 4).
  The charter itself grants +2 (tents around the town bell).
- **Homelessness**: population above capacity is homeless. Homeless citizens
  generate unhappiness (per head), pay no taxes (v0.3), emigrate first, and
  are the first victims of raids/winter events (later).
- **Growth (births)**: only when fed AND free housing exists AND happiness
  is Thriving. One birth at a time.
- **Immigration**: a thriving colony with ≥2 free beds occasionally attracts
  a family (2 arrivals) — prosperity pulls people in even faster than
  births.
- **Emigration**: struggling colonies lose citizens (homeless first).
- **Starvation deaths**: consecutive fully-unfed cycles raise a hunger
  counter; past the threshold, citizens begin to die — by name, with a
  tolling bell. Recovery resets the counter. Manor Lords winter-dread: real.

## 3. Named citizens

Every counted villager receives a persistent name (visible nametag) drawn
from the colony name pool. Events are personal: "Greta has joined Colony 1",
"Bjorn has starved." Names live on the entity itself, so they survive
restarts and travel with the villager.

## 3b. The Work System (v0.3 — deterministic labor)

Production is ledger-driven, Frostpunk/Anno-style: no vanilla randomness.

- **Production boards**: `Farm`, `Pasture`, `Woodlot` (later Mine/Quarry)
  registered like houses. Each needs a **physical prerequisite** near its
  board — farmland blocks, penned animals, logs — which sets its **rating**,
  and an **output container** (chest/barrel by the board) where goods appear
  each cycle. Create funnels/trains collect from it like any inventory.
- **Deterministic yield**: `output = base × assigned families × rating`.
  Two farms with two farmer families each ⇒ known wheat per cycle, always.
- **Assignment**: unemployed citizens are auto-assigned to workplaces
  (nearest-first, families of 2). The ledger names them: "Greta and Bjorn
  work the North Farm." Job-site blocks make villagers loiter plausibly at
  their workplace — vanilla ambience as theater over ledger truth.
- **Mechanization**: powered Create kinetic blocks detected at a workplace
  reduce its family requirement / raise its yield. Freed families staff
  service buildings (School/Market/Guard) — the tier ladder's real cost.
  The empire arc: manual farming villages → machine-fed society where
  citizens teach, trade and govern.
- **Idleness matters**: citizens without workplace assignment or service
  role drag happiness — every head needs a bed *and a purpose*.

## 4. Needs & tiers (unchanged from v1, phased in v0.3)

Tier ladder Settlers → Citizens → Burghers → Industrialists; each tier
consumes lower tiers' goods plus its own (simple food → FD meals + wool →
paper + bricks → Create luxuries + clockworks). Structure needs join goods
needs per tier (Market for II, School for III...). Promotion by token at the
bell when happiness held ≥ 70 and next-tier goods are stocked. Taxes
(emeralds into the tribute barrel) scale with tier and housed/employed
population. Cumulative wealth raises a **raid meter** that triggers vanilla
raids at the bell.

## 5. Simulation cycle (current implementation)

Every in-game hour per colony: census (name new citizens) → housing audit
(registered houses, bed count, homeless calc) → feed from tribute barrel →
happiness update (fed/unfed, homeless penalty) → hunger/death check →
births / immigration / emigration → bossbar + world feedback (particles,
bells, chat events to nearby players).

## 6. Implementation phases

- **v0.1** ✅ charter, census, Tier I food, happiness, bossbar, growth/decline.
- **v0.2** ✅ (this build) guild-sign Houses + housing capacity + homelessness,
  named citizens, starvation deaths, immigration/emigration, richer events.
- **v0.3** Workshops/School/Market/Guard services, tier matrix + promotion
  tokens, taxes, employment. **MineColonies removed from the pack** (concept
  decision 2026-08-18 — the Charter is the sole colony system); quest
  chapters I–II rewritten around the Charter.
- **v0.4** Raid meter, festivals, `/charter ledger`, colony specialization,
  quest chapters III–V rewritten, first shipped prebuild schematics.
- **v1.0** Coronation win event (Tier IV capital + satellite colonies at
  Tier II+ + active trade → scripted celebration), balance pass.
- **vNext** Port to a real NeoForge addon if the loop outgrows scripting.

## Files

- `pack/kubejs/server_scripts/charter.js` — the simulation (server-side).
- `pack/schematics/` — shipped prebuild blueprints (Create schematic .nbt).
- Balance constants at the top of the script.
