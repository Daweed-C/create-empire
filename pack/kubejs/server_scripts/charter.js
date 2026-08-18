// ============================================================
// Create: Empire — The Charter (colony simulation) v0.1.1
// Design: sources/charter/DESIGN.md
//
// Found a colony: place a Bell on top of a Barrel, then sneak +
// right-click the bell holding an Emerald. The barrel is the tribute
// depot — keep it stocked with simple food (Create can feed it via
// funnels/chutes/trains). A bossbar near the bell shows colony state.
//
// Written in deliberately conservative JS: KubeJS runs on the Rhino
// engine, which rejects some modern syntax (destructuring broke v0.1).
// Errors are logged to logs/kubejs/server.log with a [charter] prefix.
// ============================================================

// ---- balance constants (tune freely) ----
var CYCLE_TICKS = 1000;        // one sim step per in-game hour (~50s)
var RADIUS = 48;               // colony radius around the bell
var FOOD_PER_CAPITA = 0.5;     // items eaten per villager per step
var HAPPY_GAIN = 4;            // happiness per fully-fed step
var HAPPY_LOSS = 7;            // happiness lost per underfed step
var THRIVE_AT = 70;            // >= this: growth + celebration
var STRUGGLE_AT = 40;          // < this: decline + tolling bell
var GROWTH_CHANCE = 0.35;      // per thriving step, if below pop cap
var POP_CAP = 20;              // v0.1 hard cap on spawned growth
var SIMPLE_FOOD = [
  'minecraft:bread', 'minecraft:baked_potato', 'minecraft:carrot',
  'minecraft:cooked_beef', 'minecraft:cooked_porkchop', 'minecraft:cooked_chicken',
  'minecraft:cooked_mutton', 'minecraft:cooked_cod', 'minecraft:cooked_salmon',
  'minecraft:beetroot_soup', 'minecraft:pumpkin_pie'
];

var tickCounter = 0;

// persistentData layout (flat primitives only — Rhino-safe):
//   charterCount: int
//   c<i>_x, c<i>_y, c<i>_z: int   c<i>_dim, c<i>_name: string   c<i>_hap: int

function getCount(data) {
  return data.contains('charterCount') ? data.getInt('charterCount') : 0;
}

// ---- founding: sneak + right-click a bell with an emerald ----
BlockEvents.rightClicked('minecraft:bell', function (event) {
  try {
    var player = event.getPlayer();
    var block = event.getBlock();
    if (!player || !player.isCrouching()) return;
    if (String(event.getItem().getId()) !== 'minecraft:emerald') return;

    var level = event.getLevel();
    var x = block.getPos().getX(), y = block.getPos().getY(), z = block.getPos().getZ();
    var below = level.getBlock(x, y - 1, z);
    if (String(below.getId()) !== 'minecraft:barrel') {
      player.tell(Text.red('The town charter needs a Barrel (tribute depot) directly under the Bell.'));
      return;
    }

    var data = event.getServer().getPersistentData();
    var count = getCount(data);
    for (var i = 0; i < count; i++) {
      if (data.getInt('c' + i + '_x') === x && data.getInt('c' + i + '_y') === y && data.getInt('c' + i + '_z') === z) {
        player.tell(Text.yellow('This settlement already has a charter.'));
        return;
      }
    }

    var name = 'Colony ' + (count + 1);
    data.putInt('c' + count + '_x', x);
    data.putInt('c' + count + '_y', y);
    data.putInt('c' + count + '_z', z);
    data.putString('c' + count + '_dim', String(level.getDimension()));
    data.putString('c' + count + '_name', name);
    data.putInt('c' + count + '_hap', 50);
    data.putInt('charterCount', count + 1);

    try { player.getMainHandItem().shrink(1); } catch (e1) { /* the emerald survives; charters are cheap today */ }

    event.getServer().runCommandSilent('bossbar add charter:c' + count + ' "' + name + '"');
    event.getServer().runCommandSilent('execute in ' + String(level.getDimension()) + ' positioned ' + x + ' ' + y + ' ' + z + ' run particle minecraft:happy_villager ~ ~1 ~ 1.5 1.5 1.5 0.05 60');
    player.tell(Text.green('The charter of ' + name + ' is sealed! Keep the tribute barrel stocked with simple food.'));
  } catch (err) {
    console.error('[charter] founding failed: ' + err);
  }
});

// ---- the simulation cycle ----
ServerEvents.tick(function (event) {
  tickCounter++;
  if (tickCounter % CYCLE_TICKS !== 0) return;
  var server = event.getServer();
  var data = server.getPersistentData();
  var count = getCount(data);
  for (var i = 0; i < count; i++) {
    try {
      simStep(server, data, i);
    } catch (err) {
      console.error('[charter] sim step failed for colony ' + i + ': ' + err);
    }
  }
});

function simStep(server, data, i) {
  var dim = data.getString('c' + i + '_dim');
  var level = server.getLevel(dim);
  if (!level) return;
  var x = data.getInt('c' + i + '_x');
  var y = data.getInt('c' + i + '_y');
  var z = data.getInt('c' + i + '_z');
  var bell = level.getBlock(x, y, z);
  if (String(bell.getId()) !== 'minecraft:bell') return; // town center destroyed; colony dormant

  // census — collect villagers into a plain JS array
  var villagers = [];
  var found = level.getEntitiesWithin(AABB.of(x - RADIUS, y - 16, z - RADIUS, x + RADIUS, y + 32, z + RADIUS));
  found.forEach(function (e) {
    if (String(e.getType()) === 'minecraft:villager') villagers.push(e);
  });
  var pop = villagers.length;

  // consumption from the tribute barrel
  var demand = Math.max(1, Math.ceil(pop * FOOD_PER_CAPITA));
  var eaten = pop > 0 ? consumeFood(level.getBlock(x, y - 1, z), demand) : 0;
  var fed = pop > 0 && eaten >= demand;

  // happiness
  var happiness = data.getInt('c' + i + '_hap');
  happiness = fed ? Math.min(100, happiness + HAPPY_GAIN) : Math.max(0, happiness - HAPPY_LOSS);
  data.putInt('c' + i + '_hap', happiness);

  // outcomes
  var at = 'execute in ' + dim + ' positioned ' + x + ' ' + y + ' ' + z + ' run ';
  if (pop > 0 && happiness >= THRIVE_AT) {
    server.runCommandSilent(at + 'particle minecraft:happy_villager ~ ~1 ~ 3 2 3 0.05 ' + (10 + pop));
    if (pop < POP_CAP && Math.random() < GROWTH_CHANCE) {
      try {
        var settler = level.getBlock(x + 1, y, z + 1).createEntity('minecraft:villager');
        if (settler) settler.spawn();
        server.runCommandSilent(at + 'playsound minecraft:entity.villager.celebrate neutral @a[distance=..' + RADIUS + '] ~ ~ ~ 1 1');
      } catch (e2) {
        console.error('[charter] growth spawn failed: ' + e2);
      }
    }
  } else if (happiness < STRUGGLE_AT) {
    server.runCommandSilent(at + 'particle minecraft:angry_villager ~ ~1 ~ 3 2 3 0.05 ' + (5 + pop));
    server.runCommandSilent(at + 'playsound minecraft:block.bell.use block @a[distance=..' + (RADIUS * 2) + '] ~ ~ ~ 1 0.6');
    if (pop > 2 && Math.random() < 0.25) {
      try {
        villagers[0].discard(); // emigration: the unhappiest walk away
        server.runCommandSilent(at + 'playsound minecraft:entity.villager.no neutral @a[distance=..' + RADIUS + '] ~ ~ ~ 1 0.8');
      } catch (e3) {
        console.error('[charter] emigration failed: ' + e3);
      }
    }
  }

  // bossbar for players near the colony
  var name = data.getString('c' + i + '_name');
  var mood = happiness >= THRIVE_AT ? 'Thriving' : (happiness < STRUGGLE_AT ? 'Struggling' : 'Content');
  var color = happiness >= THRIVE_AT ? 'green' : (happiness < STRUGGLE_AT ? 'red' : 'yellow');
  server.runCommandSilent('bossbar add charter:c' + i + ' "' + name + '"'); // no-op if it exists
  server.runCommandSilent('bossbar set charter:c' + i + ' name "' + name + ' — Settlers: ' + pop + ' — ' + mood + '"');
  server.runCommandSilent('bossbar set charter:c' + i + ' max 100');
  server.runCommandSilent('bossbar set charter:c' + i + ' value ' + happiness);
  server.runCommandSilent('bossbar set charter:c' + i + ' color ' + color);
  server.runCommandSilent(at + 'bossbar set charter:c' + i + ' players @a[distance=..' + (RADIUS + 16) + ']');
}

function consumeFood(barrel, demand) {
  var inv = barrel.getInventory();
  if (!inv) return 0;
  var eaten = 0;
  var slots = inv.getSlots();
  for (var slot = 0; slot < slots && eaten < demand; slot++) {
    var stack = inv.getStackInSlot(slot);
    if (stack.isEmpty()) continue;
    if (SIMPLE_FOOD.indexOf(String(stack.getId())) < 0) continue;
    var take = Math.min(demand - eaten, stack.getCount());
    inv.extractItem(slot, take, false);
    eaten += take;
  }
  return eaten;
}
