# Prior-art survey — building blocks for the Empire systems

*Research pass 2026-08-18. Principle: never rebuild what a maintained mod
already does well. Each entry: what it is, its status on our platform
(1.21.1 NeoForge), and what we would use it for. "In pack" = already
shipping in Create: Empire.*

## 1. Programmable NPCs & citizen behavior

| Mod | Status | Use for us |
| --- | --- | --- |
| **Easy NPC** (Core + UI split) | ✅ 1.21.1 NeoForge, active | Scriptable NPCs: conditional dialogs (item/health/tag/team conditions), SNBT presets we can ship in the pack. Perfect for **notable citizens** — a governor's advisor at the town hall, tutorial characters, quest-giving mayors. The Charter names the crowd; Easy NPC gives speaking roles. |
| **EntityJS** (KubeJS addon) | ✅ 1.21.1 NeoForge | **The sleeper hit**: register custom entities AND custom AI goals from JavaScript — same scripting layer as the Charter. This is the bridge to *visible labor*: walk-to-workplace goals, loiter-at-field behaviors, carry-item flourishes — the "animation layer" we cut, recoverable without Java. Also animation via LioLib (GeckoLib fork). |
| Smarter Farmers, Guard Villagers, Create: Better Villagers | ✅ in pack | Ambient villager competence (better farming AI, self-defense, Create trades). |
| **SmartBrainLib** | ✅ 1.21.1 NeoForge (dev library) | Not a pack mod — the **foundation library for the eventual Java mod**: overhauls Mojang's brain/AI system into something usable. When "Create: Charter" goes Java, citizen brains are built on this. GeckoLib (animation) already ships in the pack. |

## 2. Raids, illagers & enemies

| Mod | Status | Use for us |
| --- | --- | --- |
| **Illager Invasion** | ✅ 1.21.1 NeoForge, active | ~12 new illager types that **join vanilla raids** — and our raid meter *triggers* vanilla raids, so this is free escalation content: richer sieges at zero integration cost. Top candidate to add. |
| **Villages & Pillages** | ✅ 1.21.1 NeoForge | **Bandit villages**: hostile settlements (pillager villages, witch villages) generated in the world — natural "rival settlements" to raid, liberate, or one day conquer. Seeds the enemy-faction fantasy. |
| Hostile Villages | ✅ 1.21.1 NeoForge | Mob-overrun villages — ruins to reclaim and re-charter. Thematic fit with colony founding. |
| The Pillager Legion | verify version | Illager faction structures + new enemies; check 1.21.1 before adopting. |
| Create: Pillagers Arise | ✅ in pack | Create-themed pillager structures — already ours. |

## 3. Economy & money

| Mod | Status | Use for us |
| --- | --- | --- |
| **Lightman's Currency** | ✅ 1.21.1 NeoForge, active | Full monetary system: coin tiers (copper→netherite), **trader blocks** (player- and admin-run shops), personal/team **bank accounts**, trade rules. Could upgrade the Charter's economy from "emeralds appear in a barrel" to a real imperial treasury: taxes in coin, Market boards backed by trader blocks, colony bank accounts, trade route settlements. Major SPEC §4 decision. |
| Bountiful | ✅ in pack | Bounty boards — citizen job-requests aesthetic; can post colony needs as bounties. |

## 4. Territory & organizations

| Mod | Status | Use for us |
| --- | --- | --- |
| Open Parties and Claims | ✅ maintained | Chunk claims + parties API; formal colony borders. Multiplayer-oriented — likely overkill for now; note for a server era. |
| Argonauts (guilds) | 1.21.x branch | Guilds/parties; overlaps FTB Teams (already in for quests). Skip unless multiplayer. |

## 5. Structures & construction (already solved)

Create Schematicannon + shipped `.nbt` blueprints (prebuilds), Create
Pattern Schematics + Schematic Helper (in pack via Create+), the guild-board
registration system (ours), `/place template` for spawning references.
No gap here.

## Strategic synthesis

- **Now (pack additions to consider in conceptualization):** Illager
  Invasion, Villages & Pillages, Hostile Villages — the threat/enemy
  content pillar, nearly free. Lightman's Currency — if we adopt real money.
  Easy NPC — speaking roles for the Charter's world.
- **Next (scripting era):** EntityJS opens visible-labor behaviors and
  custom empire entities (a courier who physically walks the road between
  colonies) while staying in KubeJS land.
- **Later (Java era):** SmartBrainLib + GeckoLib is the canonical AI +
  animation stack for "Create: Charter" the mod. Both proven, both on our
  platform.

## Questions this raises for the concept (feed into SPEC)

1. **Money**: adopt Lightman's coins as the imperial currency (taxes, wages,
   markets, banks) or keep abstract emeralds? Coins are deeply thematic and
   mechanical; also more systems to balance.
2. **Enemy factions**: are bandit villages just worldgen flavor, or do they
   become simulated rivals (their own "charters" that grow and raid — an
   enemy empire)? The latter is a major SPEC addition.
3. **EntityJS ambition**: visible labor via scripted AI goals — worth the
   complexity in v0.4, or hold for the Java era?
4. **Easy NPC roles**: which characters deserve dialog? (Advisor at the
   town hall reporting colony status is the obvious first.)
