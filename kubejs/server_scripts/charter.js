// ============================================================
// Create: Empire — The Charter (colony simulation) v0.2
// Design: sources/charter/DESIGN.md
//
// Found a colony:  Bell on a Barrel, sneak + right-click bell with an
//                  Emerald. The barrel is the tribute depot.
// Register a house: hang a sign on any building, write "House" on it,
//                  sneak + right-click the sign holding Paper (the deed).
//                  Housing capacity = beds near the sign (max 4/house).
//
// Citizens are named. They are born, immigrate, emigrate — and starve —
// based on food and housing. Keep the barrel full, keep beds ahead of
// population, and the colony thrives.
//
// Rhino-safe JS (no destructuring, explicit getters, flat data keys).
// Errors log to logs/kubejs/server.log with a [charter] prefix.
// ============================================================

// ---- balance constants (tune freely) ----
var CYCLE_TICKS = 1000;        // one sim step per in-game hour (~50s)
var RADIUS = 48;               // colony radius around the bell
var FOOD_PER_CAPITA = 0.5;     // items eaten per villager per step
var HAPPY_GAIN = 4;            // happiness per fully-fed step
var HAPPY_LOSS = 7;            // happiness lost per underfed step
var HOMELESS_PENALTY = 2;      // extra happiness lost per homeless citizen (capped)
var HOMELESS_PENALTY_CAP = 10;
var THRIVE_AT = 70;
var STRUGGLE_AT = 40;
var BIRTH_CHANCE = 0.30;       // per thriving step with free housing
var IMMIGRATION_CHANCE = 0.15; // per thriving step with 2+ free beds: a family (2) arrives
var EMIGRATION_CHANCE = 0.25;  // per struggling step
var STARVE_AFTER = 3;          // consecutive fully-unfed steps before deaths begin
var BASE_CAPACITY = 2;         // tents by the town bell
var BEDS_PER_HOUSE_CAP = 4;
var HOUSE_SCAN = 6;            // beds counted within this range of the house sign
var SIMPLE_FOOD = [
  'minecraft:bread', 'minecraft:baked_potato', 'minecraft:carrot',
  'minecraft:cooked_beef', 'minecraft:cooked_porkchop', 'minecraft:cooked_chicken',
  'minecraft:cooked_mutton', 'minecraft:cooked_cod', 'minecraft:cooked_salmon',
  'minecraft:beetroot_soup', 'minecraft:pumpkin_pie'
];
var NAME_POOL = [
  'Greta', 'Bjorn', 'Elsa', 'Otto', 'Ingrid', 'Klaus', 'Astrid', 'Henrik',
  'Freya', 'Gustav', 'Sigrid', 'Emil', 'Helga', 'Lars', 'Runa', 'Sven',
  'Tilda', 'Anders', 'Ylva', 'Nils', 'Marta', 'Oskar', 'Liv', 'Erik',
  'Hedda', 'Torsten', 'Alva', 'Magnus', 'Selma', 'Viggo', 'Dagny', 'Rolf',
  'Edith', 'Casimir', 'Wilhelmina', 'Barnaby', 'Ottoline', 'Percival'
];

var tickCounter = 0;

// persistentData layout (flat primitives only — Rhino-safe):
//   charterCount: int
//   c<i>_x/_y/_z: int   c<i>_dim/_name: string   c<i>_hap/_hunger/_namecursor: int
//   c<i>_hcount: int    c<i>_h<j>_x/_y/_z: int (registered house signs)

function getCount(data) {
  return data.contains('charterCount') ? data.getInt('charterCount') : 0;
}
function getIntOr(data, key, dflt) {
  return data.contains(key) ? data.getInt(key) : dflt;
}

function tellNearby(server, dim, x, y, z, jsonText) {
  server.runCommandSilent('execute in ' + dim + ' positioned ' + x + ' ' + y + ' ' + z
    + ' run tellraw @a[distance=..' + (RADIUS + 16) + '] ' + jsonText);
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
    if (String(level.getBlock(x, y - 1, z).getId()) !== 'minecraft:barrel') {
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
    data.putInt('c' + count + '_hunger', 0);
    data.putInt('c' + count + '_hcount', 0);
    data.putInt('c' + count + '_namecursor', 0);
    data.putInt('charterCount', count + 1);

    try { player.getMainHandItem().shrink(1); } catch (e1) { }

    event.getServer().runCommandSilent('bossbar add charter:c' + count + ' "' + name + '"');
    event.getServer().runCommandSilent('execute in ' + String(level.getDimension()) + ' positioned ' + x + ' ' + y + ' ' + z + ' run particle minecraft:happy_villager ~ ~1 ~ 1.5 1.5 1.5 0.05 60');
    player.tell(Text.green('The charter of ' + name + ' is sealed! Stock the tribute barrel, and register houses: hang a sign saying "House", sneak + right-click it with Paper.'));
  } catch (err) {
    console.error('[charter] founding failed: ' + err);
  }
});

// ---- guild board: sneak + right-click any sign with paper ----
BlockEvents.rightClicked(function (event) {
  try {
    var block = event.getBlock();
    if (String(block.getId()).indexOf('sign') < 0) return;
    var player = event.getPlayer();
    if (!player || !player.isCrouching()) return;
    if (String(event.getItem().getId()) !== 'minecraft:paper') return;

    var level = event.getLevel();
    var x = block.getPos().getX(), y = block.getPos().getY(), z = block.getPos().getZ();
    var data = event.getServer().getPersistentData();

    // nearest charter in range
    var count = getCount(data);
    var best = -1, bestD = RADIUS * RADIUS + 1;
    for (var i = 0; i < count; i++) {
      if (data.getString('c' + i + '_dim') !== String(level.getDimension())) continue;
      var dx = data.getInt('c' + i + '_x') - x, dz = data.getInt('c' + i + '_z') - z;
      var d = dx * dx + dz * dz;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best < 0) {
      player.tell(Text.red('No chartered colony within range of this board.'));
      return;
    }

    // building type from the sign's first line (v0.2: only House matters)
    var kind = 'house';
    try {
      var snbt = String(block.getEntityData());
      var lower = snbt.toLowerCase();
      if (lower.indexOf('house') >= 0 || lower.indexOf('home') >= 0) kind = 'house';
      else if (lower.indexOf('school') >= 0) kind = 'school';
      else if (lower.indexOf('workshop') >= 0) kind = 'workshop';
      else if (lower.indexOf('guard') >= 0) kind = 'guard';
      else if (lower.indexOf('market') >= 0) kind = 'market';
    } catch (e2) { }

    // dedup + register
    var hc = getIntOr(data, 'c' + best + '_hcount', 0);
    for (var j = 0; j < hc; j++) {
      if (data.getInt('c' + best + '_h' + j + '_x') === x && data.getInt('c' + best + '_h' + j + '_y') === y && data.getInt('c' + best + '_h' + j + '_z') === z) {
        player.tell(Text.yellow('This board is already registered.'));
        return;
      }
    }
    data.putInt('c' + best + '_h' + hc + '_x', x);
    data.putInt('c' + best + '_h' + hc + '_y', y);
    data.putInt('c' + best + '_h' + hc + '_z', z);
    data.putString('c' + best + '_h' + hc + '_kind', kind);
    data.putInt('c' + best + '_hcount', hc + 1);

    try { player.getMainHandItem().shrink(1); } catch (e3) { }
    event.getServer().runCommandSilent('execute in ' + String(level.getDimension()) + ' positioned ' + x + ' ' + y + ' ' + z + ' run particle minecraft:happy_villager ~ ~ ~ 1 1 1 0.05 30');
    var colonyName = data.getString('c' + best + '_name');
    if (kind === 'house') {
      player.tell(Text.green('Dwelling registered with ' + colonyName + '. Its beds now count toward housing.'));
    } else {
      player.tell(Text.green('The ' + kind + ' board is registered with ' + colonyName + '. (This building type awakens in a future update.)'));
    }
  } catch (err) {
    console.error('[charter] board registration failed: ' + err);
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
  if (String(level.getBlock(x, y, z).getId()) !== 'minecraft:bell') return; // dormant

  var name = data.getString('c' + i + '_name');
  var at = 'execute in ' + dim + ' positioned ' + x + ' ' + y + ' ' + z + ' run ';

  // ---- census + naming ----
  var villagers = [];
  var found = level.getEntitiesWithin(AABB.of(x - RADIUS, y - 16, z - RADIUS, x + RADIUS, y + 32, z + RADIUS));
  found.forEach(function (e) {
    if (String(e.getType()) === 'minecraft:villager') villagers.push(e);
  });
  var pop = villagers.length;

  var cursor = getIntOr(data, 'c' + i + '_namecursor', 0);
  villagers.forEach(function (v) {
    try {
      if (!v.getCustomName()) {
        var newName = NAME_POOL[cursor % NAME_POOL.length];
        cursor++;
        v.setCustomName(Text.of(newName));
        v.setCustomNameVisible(true);
        tellNearby(server, dim, x, y, z, '{"text":"' + newName + ' has joined ' + name + '.","color":"gray","italic":true}');
      }
    } catch (e4) { }
  });
  data.putInt('c' + i + '_namecursor', cursor);

  // ---- housing audit ----
  var capacity = BASE_CAPACITY;
  var hc = getIntOr(data, 'c' + i + '_hcount', 0);
  for (var j = 0; j < hc; j++) {
    if (data.getString('c' + i + '_h' + j + '_kind') !== 'house') continue;
    var hx = data.getInt('c' + i + '_h' + j + '_x');
    var hy = data.getInt('c' + i + '_h' + j + '_y');
    var hz = data.getInt('c' + i + '_h' + j + '_z');
    if (String(level.getBlock(hx, hy, hz).getId()).indexOf('sign') < 0) continue; // board destroyed
    capacity += Math.min(BEDS_PER_HOUSE_CAP, countBeds(level, hx, hy, hz));
  }
  var homeless = Math.max(0, pop - capacity);
  var freeBeds = Math.max(0, capacity - pop);

  // ---- consumption ----
  var demand = Math.max(1, Math.ceil(pop * FOOD_PER_CAPITA));
  var eaten = pop > 0 ? consumeFood(level.getBlock(x, y - 1, z), demand) : 0;
  var fed = pop > 0 && eaten >= demand;
  var starvingHard = pop > 0 && eaten === 0;

  // ---- happiness ----
  var happiness = data.getInt('c' + i + '_hap');
  happiness += fed ? HAPPY_GAIN : -HAPPY_LOSS;
  happiness -= Math.min(HOMELESS_PENALTY_CAP, homeless * HOMELESS_PENALTY);
  happiness = Math.max(0, Math.min(100, happiness));
  data.putInt('c' + i + '_hap', happiness);

  // ---- hunger & death ----
  var hunger = getIntOr(data, 'c' + i + '_hunger', 0);
  hunger = starvingHard ? hunger + 1 : 0;
  data.putInt('c' + i + '_hunger', hunger);
  if (hunger >= STARVE_AFTER && pop > 0) {
    var victim = villagers[0];
    var victimName = 'A citizen';
    try { if (victim.getCustomName()) victimName = String(victim.getCustomName().getString()); } catch (e5) { }
    try {
      victim.kill();
      tellNearby(server, dim, x, y, z, '{"text":"' + victimName + ' has starved in ' + name + '.","color":"dark_red"}');
      server.runCommandSilent(at + 'playsound minecraft:block.bell.resonate block @a[distance=..' + (RADIUS * 2) + '] ~ ~ ~ 1 0.5');
    } catch (e6) {
      console.error('[charter] starvation event failed: ' + e6);
    }
  }

  // ---- demographics ----
  if (pop > 0 && fed && happiness >= THRIVE_AT) {
    server.runCommandSilent(at + 'particle minecraft:happy_villager ~ ~1 ~ 3 2 3 0.05 ' + (10 + pop));
    if (freeBeds >= 1 && Math.random() < BIRTH_CHANCE) {
      spawnCitizen(server, data, level, i, x, y, z, dim, name, ' was born in ');
    }
    if (freeBeds >= 2 && Math.random() < IMMIGRATION_CHANCE) {
      spawnCitizen(server, data, level, i, x, y, z, dim, name, ' has settled in ');
      spawnCitizen(server, data, level, i, x, y, z, dim, name, ' has settled in ');
      server.runCommandSilent(at + 'playsound minecraft:entity.villager.celebrate neutral @a[distance=..' + RADIUS + '] ~ ~ ~ 1 1');
    }
  } else if (happiness < STRUGGLE_AT) {
    server.runCommandSilent(at + 'particle minecraft:angry_villager ~ ~1 ~ 3 2 3 0.05 ' + (5 + pop));
    server.runCommandSilent(at + 'playsound minecraft:block.bell.use block @a[distance=..' + (RADIUS * 2) + '] ~ ~ ~ 1 0.6');
    if (pop > 2 && Math.random() < EMIGRATION_CHANCE) {
      var leaver = villagers[villagers.length - 1];
      var leaverName = 'A citizen';
      try { if (leaver.getCustomName()) leaverName = String(leaver.getCustomName().getString()); } catch (e7) { }
      try {
        leaver.discard();
        tellNearby(server, dim, x, y, z, '{"text":"' + leaverName + ' has left ' + name + '.","color":"gray"}');
      } catch (e8) { }
    }
  }

  // ---- bossbar ----
  var mood = happiness >= THRIVE_AT ? 'Thriving' : (happiness < STRUGGLE_AT ? 'Struggling' : 'Content');
  var homelessNote = homeless > 0 ? ' — Homeless: ' + homeless : '';
  var color = happiness >= THRIVE_AT ? 'green' : (happiness < STRUGGLE_AT ? 'red' : 'yellow');
  server.runCommandSilent('bossbar add charter:c' + i + ' "' + name + '"');
  server.runCommandSilent('bossbar set charter:c' + i + ' name "' + name + ' — Settlers: ' + pop + '/' + capacity + homelessNote + ' — ' + mood + '"');
  server.runCommandSilent('bossbar set charter:c' + i + ' max 100');
  server.runCommandSilent('bossbar set charter:c' + i + ' value ' + happiness);
  server.runCommandSilent('bossbar set charter:c' + i + ' color ' + color);
  server.runCommandSilent(at + 'bossbar set charter:c' + i + ' players @a[distance=..' + (RADIUS + 16) + ']');
}

function spawnCitizen(server, data, level, i, x, y, z, dim, colonyName, verb) {
  try {
    var settler = level.getBlock(x + 1, y, z + 1).createEntity('minecraft:villager');
    if (!settler) return;
    var cursor = getIntOr(data, 'c' + i + '_namecursor', 0);
    var newName = NAME_POOL[cursor % NAME_POOL.length];
    data.putInt('c' + i + '_namecursor', cursor + 1);
    settler.setCustomName(Text.of(newName));
    settler.setCustomNameVisible(true);
    settler.spawn();
    tellNearby(server, dim, x, y, z, '{"text":"' + newName + verb + colonyName + '.","color":"gray","italic":true}');
  } catch (e) {
    console.error('[charter] citizen spawn failed: ' + e);
  }
}

function countBeds(level, sx, sy, sz) {
  var bedBlocks = 0;
  for (var bx = sx - HOUSE_SCAN; bx <= sx + HOUSE_SCAN; bx++) {
    for (var by = sy - 3; by <= sy + 3; by++) {
      for (var bz = sz - HOUSE_SCAN; bz <= sz + HOUSE_SCAN; bz++) {
        var id = String(level.getBlock(bx, by, bz).getId());
        if (id.indexOf('_bed') >= 0) bedBlocks++;
      }
    }
  }
  return Math.floor(bedBlocks / 2); // each bed occupies two block positions
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
