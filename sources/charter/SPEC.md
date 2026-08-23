# The Charter — Simulation Specification (v3, pre-implementation)

*Co-authored design contract for Charter v0.3+. Every mechanic is decided
here before a line of it is implemented. Supersedes the sketch-level
sections of DESIGN.md as the implementation reference.*

Status: **COMPLETE — all sections decided with the governor, 2026-08-18.
This document is the implementation contract for v0.3.**

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

*Decided 2026-08-18.*

- **Capacity**: beds near registered House boards (max 4/house) + 2 base
  tents at the bell, as shipped in v0.2.
- **Quality-lite (Q6b)**: a house with at least one light source in its
  scan radius counts fully; a lightless house still counts but is
  **squalid** — small happiness drain, named in reports ("the Millbrook
  house is squalid"). No complex scoring.
- **Prebuilds are first-class (governor's mandate)**: nobody has to
  hand-build. The pack ships a **starter blueprint set** (house, farm,
  market stall, guard post, cemetery) as Create schematics — Schematic
  Table → Schematicannon builds them, hang the board, done. The set grows
  via the scan-and-send co-op pipeline; quests teach the cannon workflow
  as the "order construction" verb.
- **Visible homelessness (Q7b)**: while anyone is homeless, a campfire
  burns near the town bell (placed/removed by the sim, only on safe empty
  ground) — the tent-camp read at a glance.

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

*Decided 2026-08-18.*

- **Per-colony tier (Q8a)**: the whole settlement promotes at once;
  per-household tiers noted as a possible v0.5+ deepening.
- **Promotion (Q9)**: sneak-click the bell with the token when happiness
  has held ≥ 70 for the streak requirement and next-tier goods are stocked.
  **Costs token + coins** (paid from held coins or the treasury):
  I→II emerald block + coin fee; II→III brass ingot + larger fee;
  III→IV precision mechanism + largest fee. Nobility is bought and earned.
- **Service gates (Q10, rearranged for the early-raids doctrine)**:
  - Tier I: none required — but raids and monsters exist from the start,
    so a **Guard post is wanted early** by pressure, not by gate.
  - Tier II: **Guard** + **Market** boards.
  - Tier III: + **School**.
  - Tier IV: + **Cemetery** (a great city honors its dead) and a second
    Market (commerce district).
- **Demotion (Q11a)**: sustained failure to meet tier needs (prolonged
  struggling streak) demotes the colony one tier, with a somber event.
  Wealth is maintained, not just reached.

## 6. Threats & Events

*Decided 2026-08-18: enemy content is flavor now, simulated rivals later.*

- **Raid rhythm (amended per governor, 2026-08-18)**: raids are a periodic
  fact of life from the early game — the first arrives within the first
  week, small and beatable; thereafter on an irregular cadence. **Wealth
  and tier scale raid *size*, not raid *existence*.** Guards matter from
  day one — against raiders and ordinary monsters alike. Illager Invasion
  enriches the roster with zero integration work. Guard boards (golem or
  armed presence nearby), walls and Big Cannons reduce citizen-loss odds;
  an undefended raid costs citizens and coins.
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

*Decided 2026-08-18 — three layers, all vanilla/Create-native surfaces,
no custom rendering (governor's mandate: easy, Minecraft-style, reuse
existing methods).*

1. **Ambient (glance)**: the colony bossbar (name · pop/capacity ·
   homeless · mood), particles, tolling bells, the homeless campfire.
2. **Narrative (story)**: chat events by name and household, the **dawn
   report** (taxes, net food, population delta, warnings), gravestones,
   the "While you were away…" settlement report.
3. **Interactive (governing) — the Town Ledger**: right-click the town
   bell (no sneak) to open a **chest-style GUI** (KubeJS server-driven
   menu — the most Minecraft-native surface there is): slots are icon
   tiles — player head (population, hover: names & flags), bread (food
   stock & burn rate), bed (housing & squalid list), coin (treasury),
   banner (tier & promotion requirements checklist), sword (raid outlook),
   one tile per registered building with its status. Hover = detail;
   click = act where sensible (e.g. promotion when eligible). Fallback if
   the chest-GUI API disappoints: `/charter ledger` renders the same as
   hoverable chat. The **Advisor** (Easy NPC at the town hall) is the
   diegetic doorway to the same information for players who prefer talking
   to people over reading menus.

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

## 9. Balance Sheet (v0.3 starting values — tuned by play, all constants
live at the top of the scripts)

| Constant | Value | Note |
| --- | --- | --- |
| Cycle | 1 in-game hour (~50s) | anchored to world clock |
| Dawn report | daily at sunrise | taxes, deltas, warnings |
| Away accrual cap | 12 cycles | settle-up on return |
| Food, Tier I | 0.5 items/adult/cycle; children eat half | simple food list |
| Tier consumption growth | ×1.25 per tier + that tier's goods | Anno curve |
| Happiness | +4 fed / −7 unfed / −2 per homeless (cap −10) / −1 per idle adult (cap −5) / −1 per squalid house (cap −5) / −3 unburied dead | |
| Growth | birth 30%/thriving cycle (needs free bed + household with room); immigration 15% (family of 2, needs 2 beds) | |
| Starvation | deaths after 3 fully-unfed cycles | hungry flagged first |
| Work yield | base × families × rating; farm rating = farmland/16 (cap 4), pasture = animals/6 (cap 4), woodlot = logs/24 (cap 4) | deterministic |
| Mechanization | powered Create kinetics at workplace: −1 family required or +50% yield | |
| Taxes | 2 copper/purposeful adult/day at Tier I; ×2.5 per tier | to colony treasury |
| Promotion fees | I→II emerald block + 16 iron coins; II→III brass ingot + 16 gold coins; III→IV precision mechanism + 16 emerald coins | held or treasury |
| Promotion streak | happiness ≥ 70 for 12 consecutive cycles + goods stocked + services present | |
| Demotion | tier needs unmet for 20 consecutive cycles | somber event |
| Raids | first between day 4–7, then every 8–14 days; base 1 wave, +1 per tier above I, +1 per wealth threshold | Guard presence halves citizen-loss odds |

## 10. Implementation Plan (v0.3, in testable slices)

Each slice ships alone, syncs via deploy, and gets a governor field test
before the next begins — the loop that built v0.1/v0.2.

- **A — Society**: children (births as babies, half rations, no work),
  named households from House-board signs, Cemetery board + gravestones +
  unburied malus, quality-lite housing, homeless campfire.
- **B — Work**: Farm/Pasture/Woodlot boards, deterministic yield into
  output containers, family assignment, mechanization detection, idle
  flags.
- **C — Economy**: Lightman's coins as taxes into a treasury container at
  the Town Hall (direct bank-API integration is stretch; physical coins in
  a strongbox is the honest fallback), Market board service checks.
- **D — Tiers**: consumption matrix, promotion (token + fee + streak +
  services), demotion, per-tier bossbar styling.
- **E — Threats**: raid scheduler (early small raids, scaling waves),
  guard mitigation checks, festival at the bell.
- **F — The Ledger**: chest-GUI town dashboard on bell right-click
  (fallback: hoverable chat ledger), dawn report, away settlement report.
- **G — The Cut**: MineColonies + its compat/style mods removed from the
  manifest; quests I–II rewritten around the Charter; starter prebuild
  blueprint set shipped.

Risks logged: Lightman's scripting surface unknown (fallback chosen);
sign-text parsing (proven crude-but-works in v0.2); chest-GUI API
(fallback chosen); block-scan cost (staggered, cached between cycles).

## 10. Implementation Plan

[To be decided]
