# Create: Empire — Game Design Document

*Concept locked with the Governor, 2026-08-18. Supersedes the original
MineColonies-centered design. The Charter simulation spec lives in
[`sources/charter/DESIGN.md`](sources/charter/DESIGN.md).*

## The fantasy

**You are the Governor-Engineer. The machines are your workforce; the
people are your purpose.**

An engineering sandbox × colony sim hybrid: Anno 1800's demand economy
running inside Minecraft's freedom, with Create as the production layer.
Every contraption exists for someone — the mill feeds Greta and Bjorn, the
night train keeps a mountain colony alive. Automation with a heartbeat.

## Design pillars

Every addition must serve at least one pillar. Anything serving none is cut.

1. **People are the purpose** — the Charter: named citizens with needs,
   growth, homelessness, and death. The demand side of the economy.
2. **Machines are the means** — Create supply chains answer the Charter's
   demand curve. The supply side. One-way coupling, by decision: colonies
   *consume* Create goods but never gate Create tech. Engineers are always
   free to build; the sim provides purpose, not permission.
   **Labor is deterministic** (decision 2026-08-18): production buildings
   yield by ledger math — workers × building rating, no vanilla randomness.
   Mechanizing a workplace with Create frees families for service roles;
   the empire's arc is manual labor → machine-fed society.
3. **Distance is the challenge** — colonies specialize by geography; rails,
   airships, and Create's package logistics bridge them. Nothing teleports.
4. **It stays Minecraft** — vanilla visuals only, total building freedom,
   guild boards instead of prescribed structures, bossbars and chat instead
   of custom UI.

## Core loops

- **Minute**: build and engineer — Create contraptions, houses, rails.
- **Hour**: keep the cycle fed — respond to demand, register buildings,
  handle events (a family arrives, a raid brews, a larder runs dry).
- **Session**: promote a colony tier, open a trade route, found a colony.
- **Campaign**: the three acts below, ending in Coronation.

## Three acts

- **Act I — The Homestead.** Found a charter, feed Settlers with farms and
  a water wheel. Intimacy: a dozen named villagers you know personally.
- **Act II — The Industry.** Brass age. Citizens and Burghers demand
  manufactured goods; the first railway; the second colony. The management
  plate starts spinning.
- **Act III — The Empire.** An Industrialist capital, specialized satellite
  colonies, air links to impossible places, wealth-scaled raids — and the
  **Coronation**: a scripted celebration event when the empire criteria are
  met (Tier IV capital, satellite colonies at Tier II+, trade active).
  Fireworks, titles, the quest book's final page. Play continues after.

## Difficulty

One tuned, authored experience (starvation is real, raids scale with
wealth, homelessness bites). All balance constants sit at the top of
`charter.js`, editable by anyone who wants a different game.

## The stack

- **Simulation**: the Charter (KubeJS) — sole colony system.
  **MineColonies is retired as of Charter v0.3** (decision 2026-08-18):
  removed from the manifest along with its compat addons and style packs,
  quests rewritten around the Charter. Structurize-based tools go with it;
  building delivery is Create's Schematicannon + shipped blueprints.
- **Production**: Create 6 + addons (Steam 'n' Rails, Aeronautics, Big
  Cannons, Connected, kitchen/deco addons), Farmer's Delight.
- **World**: CTOV + Towns & Towers + Terralith + YUNG's — vanilla-plus
  places worth settling; generated houses are legitimate scanning stock for
  personal use (license-check anything shipped).
- **Guidance**: FTB Quests — five chapters retelling the three acts.
- **Foundation**: NeoForge 1.21.1, packwiz repo, CI-verified builds,
  auto-sync via packwiz-installer. Server-side sim = multiplayer-ready.

## Roadmap

| Version | Content |
| --- | --- |
| v0.2 ✅ | Charter demographics: guild boards, housing/homelessness, named citizens, starvation, migration |
| v0.3 | **The Work System**: Farm/Pasture/Woodlot production boards with deterministic ledger yield into physical output chests, automatic family assignment, Create-mechanization bonus; services (School/Market/Guard), tier matrix + promotion tokens, taxes; **MineColonies removed**; quest chapters I–II rewritten |
| v0.4 | Raid meter, festivals, `/charter ledger`, colony specialization; quests III–V rewritten; first shipped prebuild schematics |
| v1.0 | Coronation event, balance pass from real playthroughs, Empire style pack v1, merge to main, public release |

## Cut list (deliberate non-goals)

- Individual villager labor *animation* (watching a worker physically till
  and haul, Manor Lords-style). The labor *simulation* is in — deterministic
  workforce ledger, assignments, output — while vanilla villager ambience
  (professions at job sites) provides the theater. Animation is the Java-mod
  frontier, crossed only for a proven economy.
- Custom textures/models of any kind.
- Two-way tech gating, difficulty presets, seasons — revisit only after v1.0.
- A Java mod — only if the Charter outgrows scripting, and then as a port
  of a proven design, not a rewrite of an unproven one.
