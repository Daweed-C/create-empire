// ============================================================
// Create: Empire — The Charter (colony simulation) v0.3a  (Slice A: Society)
// Contract: sources/charter/SPEC.md
//
// Found a colony:   Bell on a Barrel, sneak + right-click bell with Emerald.
// Register a board: hang a sign ("House"/"Cemetery"/"Farm"/... on line 1,
//                   a name on line 2 if you like), sneak + right-click it
//                   holding Paper. House beds add housing; a Cemetery gives
//                   your dead gravestones; production boards awaken in
//                   Slice B.
//
// New in Slice A: births are CHILDREN (half rations, not workforce),
// houses form named HOUSEHOLDS, deaths raise gravestones at the Cemetery
// (unburied dead sadden the colony), lightless houses are SQUALID, and a
// campfire burns by the bell while anyone is homeless.
//
// Rhino-safe JS. Errors log to logs/kubejs/server.log with [charter].
// ============================================================

// ---- balance constants (SPEC §9) ----
var CYCLE_TICKS = 1000;
var RADIUS = 48;
var FOOD_PER_ADULT = 0.5;
var FOOD_PER_CHILD = 0.25;
var HAPPY_GAIN = 4;
var HAPPY_LOSS = 7;
var HOMELESS_PENALTY = 2;   var HOMELESS_PENALTY_CAP = 10;
var SQUALID_PENALTY = 1;    var SQUALID_PENALTY_CAP = 5;
var UNBURIED_PENALTY = 3;   var UNBURIED_CYCLES = 3;
var THRIVE_AT = 70;
var STRUGGLE_AT = 40;
var BIRTH_CHANCE = 0.30;
var IMMIGRATION_CHANCE = 0.15;
var EMIGRATION_CHANCE = 0.25;
var STARVE_AFTER = 3;
var BASE_CAPACITY = 2;
var BEDS_PER_HOUSE_CAP = 4;
var HOUSE_SCAN = 6;
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
var HOUSE_POOL = [
  'Oakrest', 'Millbrook', 'Stonegate', 'Fernway', 'Copperhill', 'Bellview',
  'Ashford', 'Rookery', 'Lindenhall', 'Wrenfield'
];
var LIGHT_HINTS = ['torch', 'lantern', 'glowstone', 'sea_lantern', 'candle', 'campfire', 'shroomlight'];
var BOARD_KINDS = ['house', 'cemetery', 'farm', 'pasture', 'woodlot', 'school', 'workshop', 'guard', 'market'];
var CAMPFIRE_SPOTS = [[2, 0, 2], [-2, 0, 2], [2, 0, -2], [-2, 0, -2], [3, 0, 0], [-3, 0, 0], [0, 0, 3], [0, 0, -3]];

var tickCounter = 0;

// persistentData layout (flat primitives — Rhino-safe):
//   charterCount:int
//   c<i>_x/_y/_z:int  c<i>_dim/_name:string
//   c<i>_hap/_hunger/_namecursor/_housecursor/_unburied:int
//   c<i>_cfx/_cfy/_cfz:int (campfire; y=-99999 means none)
//   c<i>_hcount:int   c<i>_h<j>_x/_y/_z:int  _kind/_name:string

function getCount(data) { return data.contains('charterCount') ? data.getInt('charterCount') : 0; }
function getIntOr(data, key, dflt) { return data.contains(key) ? data.getInt(key) : dflt; }
function getStrOr(data, key, dflt) { return data.contains(key) ? data.getString(key) : dflt; }

function tellNearby(server, dim, x, y, z, jsonText) {
  server.runCommandSilent('execute in ' + dim + ' positioned ' + x + ' ' + y + ' ' + z
    + ' run tellraw @a[distance=..' + (RADIUS + 16) + '] ' + jsonText);
}

// crude sign text extraction: returns array of quoted strings found in the snbt
function signLines(block) {
  var lines = [];
  try {
    var snbt = String(block.getEntityData());
    var m = snbt.match(/'"([^"]*)"'/g);
    if (m) {
      for (var i = 0; i < m.length; i++) {
        lines.push(m[i].replace(/^'"|"'$/g, ''));
      }
    }
  } catch (e) { }
  return lines;
}

// ---- founding ----
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
    data.putInt('c' + count + '_housecursor', 0);
    data.putInt('c' + count + '_unburied', 0);
    data.putInt('c' + count + '_cfy', -99999);
    data.putInt('charterCount', count + 1);
    try { player.getMainHandItem().shrink(1); } catch (e1) { }
    event.getServer().runCommandSilent('bossbar add charter:c' + count + ' "' + name + '"');
    event.getServer().runCommandSilent('execute in ' + String(level.getDimension()) + ' positioned ' + x + ' ' + y + ' ' + z + ' run particle minecraft:happy_villager ~ ~1 ~ 1.5 1.5 1.5 0.05 60');
    player.tell(Text.green('The charter of ' + name + ' is sealed! Stock the barrel; register Houses (and one day, a Cemetery) with signs + paper.'));
  } catch (err) {
    console.error('[charter] founding failed: ' + err);
  }
});

// ---- guild boards ----
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

    var lines = signLines(block);
    var kind = 'house';
    var boardName = '';
    for (var li = 0; li < lines.length; li++) {
      var low = lines[li].toLowerCase();
      var matched = false;
      for (var ki = 0; ki < BOARD_KINDS.length; ki++) {
        if (low.indexOf(BOARD_KINDS[ki]) >= 0) { kind = BOARD_KINDS[ki]; matched = true; break; }
      }
      if (low.indexOf('home') >= 0) { kind = 'house'; matched = true; }
      if (!matched && lines[li].length > 0 && boardName === '') boardName = lines[li];
    }
    if (kind === 'house' && boardName === '') {
      var hc0 = getIntOr(data, 'c' + best + '_housecursor', 0);
      boardName = HOUSE_POOL[hc0 % HOUSE_POOL.length];
      data.putInt('c' + best + '_housecursor', hc0 + 1);
    }

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
    data.putString('c' + best + '_h' + hc + '_name', boardName);
    data.putInt('c' + best + '_hcount', hc + 1);
    try { player.getMainHandItem().shrink(1); } catch (e3) { }
    event.getServer().runCommandSilent('execute in ' + String(level.getDimension()) + ' positioned ' + x + ' ' + y + ' ' + z + ' run particle minecraft:happy_villager ~ ~ ~ 1 1 1 0.05 30');
    var colonyName = data.getString('c' + best + '_name');
    if (kind === 'house') {
      player.tell(Text.green('The ' + boardName + ' house is registered with ' + colonyName + '. Its beds now count toward housing.'));
    } else if (kind === 'cemetery') {
      player.tell(Text.green('The cemetery of ' + colonyName + ' is consecrated. The dead will be honored here.'));
    } else if (kind === 'farm' || kind === 'pasture' || kind === 'woodlot') {
      player.tell(Text.green('The ' + kind + ' board is registered with ' + colonyName + '. Production awakens in the next age (Slice B).'));
    } else {
      player.tell(Text.green('The ' + kind + ' board is registered with ' + colonyName + '. (This service awakens in a coming update.)'));
    }
  } catch (err) {
    console.error('[charter] board registration failed: ' + err);
  }
});

// ---- simulation cycle ----
ServerEvents.tick(function (event) {
  tickCounter++;
  if (tickCounter % CYCLE_TICKS !== 0) return;
  var server = event.getServer();
  var data = server.getPersistentData();
  var count = getCount(data);
  for (var i = 0; i < count; i++) {
    try { simStep(server, data, i); }
    catch (err) { console.error('[charter] sim step failed for colony ' + i + ': ' + err); }
  }
});

function simStep(server, data, i) {
  var dim = data.getString('c' + i + '_dim');
  var level = server.getLevel(dim);
  if (!level) return;
  var x = data.getInt('c' + i + '_x');
  var y = data.getInt('c' + i + '_y');
  var z = data.getInt('c' + i + '_z');
  if (String(level.getBlock(x, y, z).getId()) !== 'minecraft:bell') return;

  var name = data.getString('c' + i + '_name');
  var at = 'execute in ' + dim + ' positioned ' + x + ' ' + y + ' ' + z + ' run ';

  // census
  var adults = [], children = [];
  var found = level.getEntitiesWithin(AABB.of(x - RADIUS, y - 16, z - RADIUS, x + RADIUS, y + 32, z + RADIUS));
  found.forEach(function (e) {
    if (String(e.getType()) !== 'minecraft:villager') return;
    var baby = false;
    try { baby = e.isBaby(); } catch (e4) { }
    if (baby) children.push(e); else adults.push(e);
  });
  var pop = adults.length + children.length;

  // naming
  var cursor = getIntOr(data, 'c' + i + '_namecursor', 0);
  found.forEach(function (v) {
    try {
      if (String(v.getType()) !== 'minecraft:villager') return;
      if (!v.getCustomName()) {
        var newName = NAME_POOL[cursor % NAME_POOL.length];
        cursor++;
        v.setCustomName(Text.of(newName));
        v.setCustomNameVisible(true);
        tellNearby(server, dim, x, y, z, '{"text":"' + newName + ' has joined ' + name + '.","color":"gray","italic":true}');
      }
    } catch (e5) { }
  });
  data.putInt('c' + i + '_namecursor', cursor);

  // housing audit (+ quality-lite + cemetery lookup)
  var capacity = BASE_CAPACITY;
  var squalidCount = 0;
  var squalidName = '';
  var houseNames = [];
  var cemX = 0, cemY = -99999, cemZ = 0;
  var hc = getIntOr(data, 'c' + i + '_hcount', 0);
  for (var j = 0; j < hc; j++) {
    var kind = data.getString('c' + i + '_h' + j + '_kind');
    var hx = data.getInt('c' + i + '_h' + j + '_x');
    var hy = data.getInt('c' + i + '_h' + j + '_y');
    var hz = data.getInt('c' + i + '_h' + j + '_z');
    if (String(level.getBlock(hx, hy, hz).getId()).indexOf('sign') < 0) continue; // board gone
    if (kind === 'cemetery') { cemX = hx; cemY = hy; cemZ = hz; continue; }
    if (kind !== 'house') continue;
    var scan = scanHouse(level, hx, hy, hz);
    capacity += Math.min(BEDS_PER_HOUSE_CAP, scan.beds);
    houseNames.push(getStrOr(data, 'c' + i + '_h' + j + '_name', 'a'));
    if (scan.beds > 0 && scan.lights === 0) {
      squalidCount++;
      if (squalidName === '') squalidName = getStrOr(data, 'c' + i + '_h' + j + '_name', 'a house');
    }
  }
  var homeless = Math.max(0, pop - capacity);
  var freeBeds = Math.max(0, capacity - pop);

  // consumption (children eat half)
  var demand = Math.max(1, Math.ceil(adults.length * FOOD_PER_ADULT + children.length * FOOD_PER_CHILD));
  var eaten = pop > 0 ? consumeFood(level.getBlock(x, y - 1, z), demand) : 0;
  var fed = pop > 0 && eaten >= demand;
  var starvingHard = pop > 0 && eaten === 0;

  // happiness
  var happiness = data.getInt('c' + i + '_hap');
  happiness += fed ? HAPPY_GAIN : -HAPPY_LOSS;
  happiness -= Math.min(HOMELESS_PENALTY_CAP, homeless * HOMELESS_PENALTY);
  happiness -= Math.min(SQUALID_PENALTY_CAP, squalidCount * SQUALID_PENALTY);
  var unburied = getIntOr(data, 'c' + i + '_unburied', 0);
  if (unburied > 0) {
    happiness -= UNBURIED_PENALTY;
    data.putInt('c' + i + '_unburied', unburied - 1);
  }
  happiness = Math.max(0, Math.min(100, happiness));
  data.putInt('c' + i + '_hap', happiness);
  if (squalidCount > 0 && tickCounter % (CYCLE_TICKS * 6) === 0) {
    tellNearby(server, dim, x, y, z, '{"text":"The ' + squalidName + ' house is squalid — no light warms it.","color":"gray"}');
  }

  // hunger & death (with gravestones)
  var hunger = getIntOr(data, 'c' + i + '_hunger', 0);
  hunger = starvingHard ? hunger + 1 : 0;
  data.putInt('c' + i + '_hunger', hunger);
  if (hunger >= STARVE_AFTER && pop > 0) {
    var victim = adults.length > 0 ? adults[0] : children[0];
    var victimName = 'A citizen';
    try { if (victim.getCustomName()) victimName = String(victim.getCustomName().getString()); } catch (e6) { }
    try {
      victim.kill();
      tellNearby(server, dim, x, y, z, '{"text":"' + victimName + ' has starved in ' + name + '.","color":"dark_red"}');
      server.runCommandSilent(at + 'playsound minecraft:block.bell.resonate block @a[distance=..' + (RADIUS * 2) + '] ~ ~ ~ 1 0.5');
      if (cemY > -99999) {
        raiseGravestone(server, level, dim, cemX, cemY, cemZ, victimName, 'starved');
      } else {
        data.putInt('c' + i + '_unburied', UNBURIED_CYCLES);
        tellNearby(server, dim, x, y, z, '{"text":"The dead lie unhonored — ' + name + ' has no cemetery.","color":"dark_gray","italic":true}');
      }
    } catch (e7) { console.error('[charter] starvation event failed: ' + e7); }
  }

  // demographics
  if (pop > 0 && fed && happiness >= THRIVE_AT) {
    server.runCommandSilent(at + 'particle minecraft:happy_villager ~ ~1 ~ 3 2 3 0.05 ' + (10 + pop));
    if (freeBeds >= 1 && Math.random() < BIRTH_CHANCE) {
      var household = houseNames.length > 0 ? houseNames[Math.floor(Math.random() * houseNames.length)] : 'the town';
      spawnCitizen(server, data, level, i, x, y, z, dim, name, true, ' was born to the ' + household + ' household in ');
    }
    if (freeBeds >= 2 && Math.random() < IMMIGRATION_CHANCE) {
      spawnCitizen(server, data, level, i, x, y, z, dim, name, false, ' has settled in ');
      spawnCitizen(server, data, level, i, x, y, z, dim, name, false, ' has settled in ');
      server.runCommandSilent(at + 'playsound minecraft:entity.villager.celebrate neutral @a[distance=..' + RADIUS + '] ~ ~ ~ 1 1');
    }
  } else if (happiness < STRUGGLE_AT) {
    server.runCommandSilent(at + 'particle minecraft:angry_villager ~ ~1 ~ 3 2 3 0.05 ' + (5 + pop));
    server.runCommandSilent(at + 'playsound minecraft:block.bell.use block @a[distance=..' + (RADIUS * 2) + '] ~ ~ ~ 1 0.6');
    if (adults.length > 2 && Math.random() < EMIGRATION_CHANCE) {
      var leaver = adults[adults.length - 1];
      var leaverName = 'A citizen';
      try { if (leaver.getCustomName()) leaverName = String(leaver.getCustomName().getString()); } catch (e8) { }
      try {
        leaver.discard();
        tellNearby(server, dim, x, y, z, '{"text":"' + leaverName + ' has left ' + name + '.","color":"gray"}');
      } catch (e9) { }
    }
  }

  // homeless campfire
  updateCampfire(server, data, level, i, x, y, z, homeless);

  // bossbar
  var mood = happiness >= THRIVE_AT ? 'Thriving' : (happiness < STRUGGLE_AT ? 'Struggling' : 'Content');
  var extra = '';
  if (homeless > 0) extra += ' — Homeless: ' + homeless;
  if (children.length > 0) extra += ' — Children: ' + children.length;
  var color = happiness >= THRIVE_AT ? 'green' : (happiness < STRUGGLE_AT ? 'red' : 'yellow');
  server.runCommandSilent('bossbar add charter:c' + i + ' "' + name + '"');
  server.runCommandSilent('bossbar set charter:c' + i + ' name "' + name + ' — Settlers: ' + pop + '/' + capacity + extra + ' — ' + mood + '"');
  server.runCommandSilent('bossbar set charter:c' + i + ' max 100');
  server.runCommandSilent('bossbar set charter:c' + i + ' value ' + happiness);
  server.runCommandSilent('bossbar set charter:c' + i + ' color ' + color);
  server.runCommandSilent(at + 'bossbar set charter:c' + i + ' players @a[distance=..' + (RADIUS + 16) + ']');
}

function scanHouse(level, sx, sy, sz) {
  var bedBlocks = 0, lights = 0;
  for (var bx = sx - HOUSE_SCAN; bx <= sx + HOUSE_SCAN; bx++) {
    for (var by = sy - 3; by <= sy + 3; by++) {
      for (var bz = sz - HOUSE_SCAN; bz <= sz + HOUSE_SCAN; bz++) {
        var id = String(level.getBlock(bx, by, bz).getId());
        if (id.indexOf('_bed') >= 0) { bedBlocks++; continue; }
        for (var li = 0; li < LIGHT_HINTS.length; li++) {
          if (id.indexOf(LIGHT_HINTS[li]) >= 0) { lights++; break; }
        }
      }
    }
  }
  return { beds: Math.floor(bedBlocks / 2), lights: lights };
}

function raiseGravestone(server, level, dim, cx, cy, cz, victimName, cause) {
  try {
    for (var gx = cx - 4; gx <= cx + 4; gx++) {
      for (var gz = cz - 4; gz <= cz + 4; gz++) {
        for (var gy = cy - 2; gy <= cy + 1; gy++) {
          var here = String(level.getBlock(gx, gy, gz).getId());
          var below = String(level.getBlock(gx, gy - 1, gz).getId());
          if (here === 'minecraft:air' && below !== 'minecraft:air' && below.indexOf('sign') < 0 && below !== 'minecraft:water') {
            server.runCommandSilent('execute in ' + dim + ' run setblock ' + gx + ' ' + gy + ' ' + gz
              + " minecraft:oak_sign{front_text:{messages:['\"" + victimName + "\"','\"" + cause + "\"','\"\"','\"\"']}}");
            return;
          }
        }
      }
    }
    console.log('[charter] no room for a gravestone near the cemetery board');
  } catch (e) {
    console.error('[charter] gravestone failed: ' + e);
  }
}

function updateCampfire(server, data, level, i, x, y, z, homeless) {
  try {
    var dim = data.getString('c' + i + '_dim');
    var cfy = getIntOr(data, 'c' + i + '_cfy', -99999);
    if (homeless > 0 && cfy === -99999) {
      for (var s = 0; s < CAMPFIRE_SPOTS.length; s++) {
        var px = x + CAMPFIRE_SPOTS[s][0], py = y + CAMPFIRE_SPOTS[s][1], pz = z + CAMPFIRE_SPOTS[s][2];
        var here = String(level.getBlock(px, py, pz).getId());
        var below = String(level.getBlock(px, py - 1, pz).getId());
        if (here === 'minecraft:air' && below !== 'minecraft:air' && below !== 'minecraft:water') {
          server.runCommandSilent('execute in ' + dim + ' run setblock ' + px + ' ' + py + ' ' + pz + ' minecraft:campfire[lit=true]');
          data.putInt('c' + i + '_cfx', px);
          data.putInt('c' + i + '_cfy', py);
          data.putInt('c' + i + '_cfz', pz);
          return;
        }
      }
    } else if (homeless === 0 && cfy > -99999) {
      var ox = data.getInt('c' + i + '_cfx'), oz = data.getInt('c' + i + '_cfz');
      if (String(level.getBlock(ox, cfy, oz).getId()) === 'minecraft:campfire') {
        server.runCommandSilent('execute in ' + dim + ' run setblock ' + ox + ' ' + cfy + ' ' + oz + ' minecraft:air');
      }
      data.putInt('c' + i + '_cfy', -99999);
    }
  } catch (e) {
    console.error('[charter] campfire failed: ' + e);
  }
}

function spawnCitizen(server, data, level, i, x, y, z, dim, colonyName, asChild, verb) {
  try {
    var settler = level.getBlock(x + 1, y, z + 1).createEntity('minecraft:villager');
    if (!settler) return;
    var cursor = getIntOr(data, 'c' + i + '_namecursor', 0);
    var newName = NAME_POOL[cursor % NAME_POOL.length];
    data.putInt('c' + i + '_namecursor', cursor + 1);
    settler.setCustomName(Text.of(newName));
    settler.setCustomNameVisible(true);
    settler.spawn();
    if (asChild) {
      try { settler.setBaby(true); } catch (eB) {
        try { settler.setAge(-24000); } catch (eB2) { }
      }
    }
    tellNearby(server, dim, x, y, z, '{"text":"' + newName + verb + colonyName + '.","color":"gray","italic":true}');
  } catch (e) {
    console.error('[charter] citizen spawn failed: ' + e);
  }
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
