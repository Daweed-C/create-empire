// ============================================================
// Create: Empire — The Charter (colony simulation) v0.1
// Design: sources/charter/DESIGN.md
//
// Found a colony: place a Bell on top of a Barrel, then sneak +
// right-click the bell holding an Emerald. The barrel is the tribute
// depot — keep it stocked with simple food (Create can feed it via
// funnels/chutes/trains). A bossbar near the bell shows colony state.
//
// EXPERIMENTAL: v0.1 simulates Tier I (Settlers) only. Errors are
// logged to logs/kubejs/server.log — report them, don't suffer them.
// ============================================================

// ---- balance constants (tune freely) ----
const CYCLE_TICKS = 1000;        // one sim step per in-game hour (~50s)
const RADIUS = 48;               // colony radius around the bell
const FOOD_PER_CAPITA = 0.5;     // items eaten per villager per step
const HAPPY_GAIN = 4;            // happiness per fully-fed step
const HAPPY_LOSS = 7;            // happiness lost per underfed step
const THRIVE_AT = 70;            // >= this: growth + celebration
const STRUGGLE_AT = 40;          // < this: decline + tolling bell
const GROWTH_CHANCE = 0.35;      // per thriving step, if below pop cap
const POP_CAP = 20;              // v0.1 hard cap on spawned growth
const SIMPLE_FOOD = [
  'minecraft:bread', 'minecraft:baked_potato', 'minecraft:carrot',
  'minecraft:cooked_beef', 'minecraft:cooked_porkchop', 'minecraft:cooked_chicken',
  'minecraft:cooked_mutton', 'minecraft:cooked_cod', 'minecraft:cooked_salmon',
  'minecraft:beetroot_soup', 'minecraft:pumpkin_pie'
];

let tickCounter = 0;

function charterKey(i) { return 'charter_' + i }

function getCharterCount(data) {
  return data.contains('charterCount') ? data.getInt('charterCount') : 0
}

// ---- founding: sneak + right-click a bell with an emerald ----
BlockEvents.rightClicked('minecraft:bell', event => {
  try {
    const { player, block, item, level } = event
    if (!player || !player.isCrouching()) return
    if (item.id !== 'minecraft:emerald') return
    if (block.down.id !== 'minecraft:barrel') {
      player.tell(Text.red('The town charter needs a Barrel (tribute depot) directly under the Bell.'))
      return
    }
    const data = event.server.persistentData
    const count = getCharterCount(data)
    // refuse duplicate charters on the same bell
    for (let i = 0; i < count; i++) {
      const t = data.getCompound(charterKey(i))
      if (t.getInt('x') === block.pos.x && t.getInt('y') === block.pos.y && t.getInt('z') === block.pos.z) {
        player.tell(Text.yellow('This settlement already has a charter.'))
        return
      }
    }
    const name = 'Colony ' + (count + 1)
    const tag = new $CompoundTag()
    tag.putInt('x', block.pos.x); tag.putInt('y', block.pos.y); tag.putInt('z', block.pos.z)
    tag.putString('dim', level.dimension.toString())
    tag.putString('name', name)
    tag.putInt('happiness', 50)
    data.put(charterKey(count), tag)
    data.putInt('charterCount', count + 1)
    item.count-- // the emerald seals the charter
    event.server.runCommandSilent(`bossbar add charter:c${count} "${name}"`)
    player.tell(Text.green(`The charter of ${name} is sealed! Keep the tribute barrel stocked with simple food.`))
    event.server.runCommandSilent(`execute in ${level.dimension} positioned ${block.pos.x} ${block.pos.y} ${block.pos.z} run particle minecraft:happy_villager ~ ~1 ~ 1.5 1.5 1.5 0.05 60`)
  } catch (err) {
    console.error('[charter] founding failed: ' + err)
  }
})

// ---- the simulation cycle ----
ServerEvents.tick(event => {
  tickCounter++
  if (tickCounter % CYCLE_TICKS !== 0) return
  const server = event.server
  const data = server.persistentData
  const count = getCharterCount(data)
  for (let i = 0; i < count; i++) {
    try {
      simStep(server, data, i)
    } catch (err) {
      console.error('[charter] sim step failed for colony ' + i + ': ' + err)
    }
  }
})

function simStep(server, data, i) {
  const tag = data.getCompound(charterKey(i))
  const level = server.getLevel(tag.getString('dim'))
  if (!level) return
  const x = tag.getInt('x'), y = tag.getInt('y'), z = tag.getInt('z')
  const bell = level.getBlock(x, y, z)
  if (bell.id !== 'minecraft:bell') return // town center destroyed; colony dormant

  // census
  const villagers = level.getEntitiesWithin(AABB.of(x - RADIUS, y - 16, z - RADIUS, x + RADIUS, y + 32, z + RADIUS))
    .filter(e => String(e.type) === 'minecraft:villager')
  const pop = villagers.length

  // consumption from the tribute barrel
  const demand = Math.max(1, Math.ceil(pop * FOOD_PER_CAPITA))
  const eaten = pop > 0 ? consumeFood(bell.down, demand) : 0
  const fed = pop === 0 ? false : eaten >= demand

  // happiness
  let happiness = tag.getInt('happiness')
  happiness = fed ? Math.min(100, happiness + HAPPY_GAIN) : Math.max(0, happiness - HAPPY_LOSS)
  tag.putInt('happiness', happiness)
  data.put(charterKey(i), tag)

  // outcomes
  const dim = tag.getString('dim')
  const at = `execute in ${dim} positioned ${x} ${y} ${z} run`
  if (pop > 0 && happiness >= THRIVE_AT) {
    server.runCommandSilent(`${at} particle minecraft:happy_villager ~ ~1 ~ 3 2 3 0.05 ${10 + pop}`)
    if (pop < POP_CAP && Math.random() < GROWTH_CHANCE) {
      const spot = bell.offset(1, 1, 1)
      const settler = spot.createEntity('minecraft:villager')
      if (settler) { settler.spawn() }
      server.runCommandSilent(`${at} playsound minecraft:entity.villager.celebrate neutral @a[distance=..${RADIUS}] ~ ~ ~ 1 1`)
    }
  } else if (happiness < STRUGGLE_AT) {
    server.runCommandSilent(`${at} particle minecraft:angry_villager ~ ~1 ~ 3 2 3 0.05 ${5 + pop}`)
    server.runCommandSilent(`${at} playsound minecraft:block.bell.use block @a[distance=..${RADIUS * 2}] ~ ~ ~ 1 0.6`)
    if (pop > 2 && Math.random() < 0.25) {
      // emigration: the unhappiest walk away (despawn one villager)
      villagers[0].discard()
      server.runCommandSilent(`${at} playsound minecraft:entity.villager.no neutral @a[distance=..${RADIUS}] ~ ~ ~ 1 0.8`)
    }
  }

  // bossbar for players near the colony
  const name = tag.getString('name')
  const mood = happiness >= THRIVE_AT ? 'Thriving' : (happiness < STRUGGLE_AT ? 'Struggling' : 'Content')
  server.runCommandSilent(`bossbar set charter:c${i} name "${name} — Settlers: ${pop} — ${mood}"`)
  server.runCommandSilent(`bossbar set charter:c${i} max 100`)
  server.runCommandSilent(`bossbar set charter:c${i} value ${happiness}`)
  server.runCommandSilent(`bossbar set charter:c${i} color ${happiness >= THRIVE_AT ? 'green' : (happiness < STRUGGLE_AT ? 'red' : 'yellow')}`)
  server.runCommandSilent(`${at} bossbar set charter:c${i} players @a[distance=..${RADIUS + 16}]`)
}

function consumeFood(barrel, demand) {
  const inv = barrel.inventory
  if (!inv) return 0
  let eaten = 0
  for (let slot = 0; slot < inv.slots && eaten < demand; slot++) {
    const stack = inv.getStackInSlot(slot)
    if (stack.empty) continue
    if (SIMPLE_FOOD.indexOf(String(stack.id)) < 0) continue
    const take = Math.min(demand - eaten, stack.count)
    inv.extractItem(slot, take, false)
    eaten += take
  }
  return eaten
}
