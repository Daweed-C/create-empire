# The Charter — Simulation Specification (v3, pre-implementation)

*Co-authored design contract for Charter v0.3+. Every mechanic is decided
here before a line of it is implemented. Supersedes the sketch-level
sections of DESIGN.md as the implementation reference.*

Status: **in progress — sections are being decided one by one.**

## 1. The Citizen

*Decided 2026-08-18.*

- **Identity**: every counted villager gets a persistent name (visible
  nametag) from the name pool; events are personal, by name.
- **Lifecycle — children first (1b)**: births produce *children* (vanilla
  baby villagers) born into a household. **Children do not work and pay no
  taxes** — population growth is an investment that matures, not instant
  workforce. Maturation is vanilla-timed for now; the School service may
  later accelerate or improve it. **No old-age death yet** — elders,
  natural death and inheritance are reserved as a later chapter (the data
  makes room for it: birth-cycle recorded per citizen).
- **Households (2b, light)**: citizens assigned to the same registered
  House form a named household. The household takes its name from the
  House board's sign — **line 2 of the sign names the house** ("House"
  on line 1, "Millbrook" on line 2 → *the Millbrook household*); unnamed
  houses get a name from the pool. Births happen in households with room;
  reports speak in families: "The Millbrooks work the North Farm."
- **Happiness (3)**: one colony-level happiness value drives all mechanics
  (Anno's ledger); per-citizen **story flags** — homeless, idle, hungry —
  personalize reports without simulating individual moods ("Greta sleeps
  under the stars"). Flags also pick event victims (homeless emigrate
  first, hungry die first).
- **Death & memory (4)**: the **Cemetery guild board**. When a citizen
  dies, the sim raises a gravestone — a sign placed near the cemetery
  board, auto-written with their name and fate. A colony's history becomes
  legible in its churchyard. The dead lying unhonored (no cemetery
  registered) costs happiness for several cycles; honored dead cost only a
  one-cycle mourning. Graves persist forever — they are world history.
- **Skills (5)**: deferred past v0.4. The per-citizen data slot is
  reserved now (entity tags already carry identity) so veteran-worker
  mechanics can arrive without migration.

## 2. Housing & the Town

[To be decided]

## 3. The Work System

[Core model per DESIGN v2 §3b (deterministic ledger yield, family
assignment, mechanization). Details to be decided in this session.]

*Decided 2026-08-18:* **visible labor is a v0.4 EntityJS experiment** —
v0.3 ships the ledger with vanilla ambience; v0.4 prototypes one scripted
AI goal (walk-to-registered-workplace) and expands only if stable. The
ledger remains the source of truth regardless. Recruits/Workers staffing
bonus stays a dormant provision until 1.21.1 ports exist.

## 4. Goods & the Economy

*Decided 2026-08-18: the empire runs on real money.*

- **Currency**: Lightman's Currency coins are the imperial money. Each
  colony has a **treasury** (colony bank account); the governor has their
  own. The emerald-in-a-barrel abstraction is retired when this lands.
- **Taxes**: collected at the dawn report — per housed *and* purposeful
  citizen (workers + service staff; the homeless and idle pay nothing),
  scaled by tier. Deposited to the colony treasury; the governor draws from
  it (withdrawals are a governor's right; an empty treasury is a warning
  sign in itself).
- **Consumption matrix**: per DESIGN v2 — each tier consumes lower tiers'
  goods plus its own (simple food → FD meals + wool → paper + bricks →
  Create luxuries + clockworks), from the tribute depot, deterministically.
- **Markets**: the Market guild board (Tier II+ service) gains teeth via
  Lightman's trader blocks near the board — citizens' shops. v0.3 checks
  presence; v0.4 wires trade volume into happiness/tax bonuses.
- **Inter-colony trade**: physical only. Geography drives specialization
  (a mesa colony makes bricks cheaply; a plains colony grows grain), so
  higher tiers force goods movement: scheduled trains (Steam 'n' Rails),
  autonomous air freight (Aeronautics: Automated Logistics), Create 6
  packages. No teleportation, ever.

## 4b. Later: bandit economy

Raids that breach a colony can loot its treasury; bounties (Bountiful
boards) let the governor pay for protection. Deferred past v0.4.

## 5. Tiers & Promotion

[To be decided]

## 6. Threats & Events

*Decided 2026-08-18: enemy content is flavor now, simulated rivals later.*

- **Raid meter**: cumulative taxes collected raise it; thresholds trigger
  vanilla raids at the colony bell. Illager Invasion enriches the raid
  roster (a dozen new illager types) with zero integration work. Guard
  boards / golems / walls / Big Cannons mitigate (v0.3 checks presence;
  damage odds scale with defenses).
- **Bandit settlements** (Villages & Pillages, Hostile Villages): worldgen
  threat content — raid targets, reclaimable ruins that can be cleared and
  re-chartered as colonies. **Rival charters** — enemy settlements that
  grow, tax and raid like an opposing empire — are a designed-later chapter
  (v0.5+), not scenery-forever: the door stays open by decision.
- **Festivals**: ring the town bell holding a festival good (cake?) →
  spend stocked goods for a happiness surge + fireworks. v0.3.
- **Starvation** (shipped in v0.2): consecutive fully-unfed cycles kill
  named citizens. Misfortune events (fire, disease) deferred until the
  base loop is proven fun.

## 7. Reading the Simulation

[To be decided]

## 8. Simulation Mechanics

*Away rule decided 2026-08-18; remaining defaults adopted as recommended
(overridable on request).*

- **The away rule — capped ledger accrual.** A colony whose bell chunk is
  unloaded accrues cycles (cap: 12). On the first loaded cycle it **settles
  up** in one batch — accumulated consumption from the barrel, accumulated
  production into output chests, growth/decline/hunger applied — and the
  governor receives a *"While you were away…"* report. The cap means
  absence can hurt a colony but never silently annihilate it. Population
  entity changes (spawns, deaths) apply at settlement, when entities exist.
- **Two rhythms**: the hourly **cycle** (consumption, production, moods)
  and the **dawn report** (taxes, net food, population delta, warnings —
  delivered to the governor wherever they are).
- **Randomness policy**: zero RNG in yields and consumption — pure ledger.
  Dice allowed only for event *timing* (when a raid fires), name
  assignment, and flavor.
- **Time base**: the in-game clock, not raw server ticks — cycles anchor to
  world hours, the report to dawn. Night can feel different from day in
  later versions.
- **Scale**: no colony cap; colonies process staggered (one per tick-slice)
  so an empire can't lag a server.
- **State & recovery**: colony state in server persistentData keyed to the
  bell; `/charter` command family (`ledger`, `audit`, `abandon`) for
  inspection and repair.

## 9. Balance Sheet

[To be decided]

## 10. Implementation Plan

[To be decided]
