import { WS, rng } from '../WorldState.js';
import { biome as getBiome, roomDef as getRoomDef, allOrgans, organResolver, mob as getMobDef, balance as getBalance } from '../registry.js';
import { pick, shuffle } from '../rng.js';
import { Body, ORGAN_SLOTS } from '../entities/Body.js';
import { TYPE_NOUN } from '../labels.js';

const TIER_RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };

// Which tiers may appear, by depth (tuning: balance.json tierUnlockFloor).
function _tierAllowed(tier, floorIdx) {
  return floorIdx >= (getBalance().tierUnlockFloor[tier] ?? 0);
}

const THEME_NAMES = {
  putrid:      { adj: ['Putride','Nécrotique','Fétide','Ranci'],        noun: 'de Chair'     },
  crawling:    { adj: ['Rampant','Grouillant','Traçant','Infect'],       noun: 'des Galeries' },
  flying:      { adj: ['Suspendu','Errant','Ailé','Flottant'],           noun: 'des Airs'     },
  spore:       { adj: ['Sporeux','Pulvérulent','Émetteur','Sporal'],     noun: 'Fongique'     },
  crystalline: { adj: ['Cristallin','Prismatique','Fracturé','Éclat'],   noun: 'de Pierre'    },
  burning:     { adj: ['Ardent','Embrasé','Consumé','Incandescent'],     noun: 'de Braise'    },
};

// Spawn procedural mobs for a hostile room on first entry.
export function spawnForRoom(room, floor, floorIdx) {
  const biome = getBiome(floor.biomeId);
  if (!biome) return;

  const def = getRoomDef(room.defId);
  if (!def?.spawns) return;

  const { minMobs, maxMobs, elite = false } = def.spawns;
  if (maxMobs === 0) return;

  const B     = getBalance().mob;
  const count = _spawnCount(minMobs, maxMobs, floorIdx);

  // At most ONE strong mob per pack. A room may force elites (combat_elite);
  // otherwise we roll a single elite chance for the whole group and pick one
  // member to be it. The other members are built on a reduced budget so a pack
  // is never three heavyweights at once — the elite leads, the rest support.
  const hasElite = elite || rng() < (B.eliteChance ?? 0.04);
  const eliteIdx = hasElite ? Math.floor(rng() * count) : -1;

  for (let i = 0; i < count; i++) {
    const isElite    = elite ? true : (i === eliteIdx);
    const budgetMult = (hasElite && !isElite) ? (B.supportBudgetMult ?? 0.55) : 1;
    const theme      = pick(rng, biome.themes);
    const mob        = _createMob(biome, theme, floorIdx, room, i, isElite, budgetMult);
    WS.mobs.set(mob.id, mob);
    room.addMob(mob.id);
  }
}

// How many mobs to spawn within [minMobs, maxMobs]. Each slot above the minimum
// fills with a probability that climbs with depth, so early floors stay sparse
// (mostly 1) while deep floors lean toward full packs. Groups of 3+ only appear
// from `mob.packFloor` onward (tunable in balance.json) — before that the count
// is capped at 2. Difficulty is still driven mainly by the organ BUDGET each mob
// is built with; this only decides how many of them show up.
function _spawnCount(minMobs, maxMobs, floorIdx) {
  const B   = getBalance().mob;
  const fi  = floorIdx ?? 0;
  let   cap = maxMobs;
  if (fi < (B.packFloor ?? 3)) cap = Math.min(maxMobs, 2);
  if (cap <= minMobs) return cap;

  const addChance = Math.min(0.85, (B.extraMobChanceBase ?? 0.32) + fi * (B.extraMobChancePerFloor ?? 0.05));
  let count = minMobs;
  for (let i = minMobs; i < cap; i++) {
    if (rng() < addChance) count++;
    else break;
  }
  return count;
}

// Spawn a named boss from registry into a boss room.
export function spawnBoss(bossId, room, floorIdx) {
  const def = getMobDef(bossId);
  if (!def) {
    console.warn(`MobGen: boss "${bossId}" not in registry`);
    return;
  }

  const mobId = `boss_${bossId}_${floorIdx}`;
  const body  = Body.empty(mobId);

  for (const { slot, organId, hp } of (def.organs ?? [])) {
    if (ORGAN_SLOTS[slot]) {
      const organDef = organResolver(organId);
      body.setOrgan(slot, organId, hp ?? organDef?.maxHp ?? 5);
    }
  }

  // Extract room grid position from id (format: r_X_Y)
  const parts = room.id.split('_');
  const rx = parseInt(parts[1] ?? '0', 10);
  const ry = parseInt(parts[2] ?? '0', 10);

  const mob = {
    id:              mobId,
    defId:           bossId,
    name:            def.name,
    theme:           'boss',
    biomeId:         def.biomeId ?? 'gorge',
    behavior:        'boss',
    lifecycle:       'active',
    intent:          'Attend · approche-toi',
    isBoss:          true,
    isElite:         true,
    pattern:         def.pattern ?? null,
    phase2Threshold: def.phase2Threshold ?? 0.5,
    phase2Active:    false,
    dropOrganId:     def.dropOrganId ?? null,
    body,
    pos: { floorIdx, x: rx, y: ry },
  };

  WS.mobs.set(mob.id, mob);
  room.addMob(mob.id);
  return mob;
}

// Spawn the player's previous run body as a mob in a grave room.
// Reads graveyard JSON directly from localStorage.
// If no graveyard data exists, clears the room immediately (no fight).
export function spawnGraveyardMob(room, floorIdx) {
  let graveyard;
  try {
    const raw = localStorage.getItem('chair_grave_v1');
    graveyard = raw ? JSON.parse(raw) : null;
  } catch (_) {}

  if (!graveyard?.body) {
    room.markCleared();
    return;
  }

  const body  = Body.fromJSON(graveyard.body);
  const parts = room.id.split('_');
  const rx    = parseInt(parts[1] ?? '0', 10);
  const ry    = parseInt(parts[2] ?? '0', 10);

  const mob = {
    id:          `grave_boss_${floorIdx}`,
    defId:       'graveyard_boss',
    name:        'Ton Ancien Corps',
    theme:       'boss',
    biomeId:     'le-fond',
    behavior:    'boss',
    lifecycle:   'active',
    intent:      '...te reconnaît',
    isBoss:      false,
    isElite:     true,
    pattern:     null,
    dropOrganId: null,
    body,
    pos: { floorIdx, x: rx, y: ry },
  };

  WS.mobs.set(mob.id, mob);
  room.addMob(mob.id);
  return mob;
}

// --- Procedural mob creation ---

function _createMob(biome, theme, floorIdx, room, idx, isElite, budgetMult = 1) {
  const id = `mob_${floorIdx}_${room.id}_${idx}`;

  const B = getBalance();
  let budget = Math.max(1, Math.floor((B.mob.budgetBase + floorIdx * B.mob.budgetPerFloor) * (isElite ? B.mob.eliteMult : 1) * budgetMult));

  const pool = allOrgans().filter(o => _tierAllowed(o.tier, floorIdx));
  const body = Body.empty(id);

  let attempts = 0;
  while (budget > 0 && attempts < 30) {
    attempts++;
    const candidates = pool.filter(o => (B.tierCost[o.tier] ?? 1) <= budget);
    if (!candidates.length) break;

    const organDef = pick(rng, candidates);
    const cost     = B.tierCost[organDef.tier] ?? 1;

    const slotKey = Object.keys(ORGAN_SLOTS).find(k =>
      ORGAN_SLOTS[k].type === organDef.type && body.slots[k] === null
    );
    if (slotKey) {
      body.setOrgan(slotKey, organDef.id, organDef.maxHp);
      budget -= cost;
    }
  }

  if (body.equippedOrgans().length === 0) {
    body.setOrgan('skin', 'skin_human', 2);
  }

  // Elite: force the best available heart as vital organ
  if (isElite && !body.slots['heart']) {
    const hearts = pool.filter(o => o.type === 'heart');
    if (hearts.length) {
      const h = hearts.reduce((b, o) => (TIER_RANK[o.tier] ?? 0) > (TIER_RANK[b.tier] ?? 0) ? o : b, hearts[0]);
      body.setOrgan('heart', h.id, h.maxHp);
    }
  }

  // Floor 1+: force brain as secondary vital organ on non-elite mobs that lack both heart and brain.
  // Brain in the deep layer means the player must fight through all layers to kill the mob.
  if (floorIdx >= 1 && !isElite && !body.slots['heart'] && !body.slots['brain']) {
    const brains = pool.filter(o => o.type === 'brain');
    if (brains.length) {
      const b = brains[0]; // weakest brain available (brain_human)
      body.setOrgan('brain', b.id, b.maxHp);
    }
  }

  const themeInfo = biome.themeDetails?.[theme] ?? {};
  const behavior  = pick(rng, themeInfo.behaviors ?? ['stalker']);
  const name      = _mobName(theme, body);

  const [rx, ry] = room.id.split('_').slice(1).map(Number);

  // Flying mobs at floor 3+ may be invisible — requires see_invisible to fight reliably
  const invisible = theme === 'flying' && floorIdx >= 2 && rng() < 0.25;

  return {
    id,
    defId:     null,
    name,
    theme,
    biomeId:   biome.id,
    behavior,
    lifecycle: 'active',
    intent:    null,
    isElite,
    isBoss:    false,
    invisible,
    body,
    pos: { floorIdx, x: rx, y: ry },
  };
}

function _mobName(theme, body) {
  const info      = THEME_NAMES[theme] ?? { adj: ['Inconnu'], noun: 'de Chair' };
  const adj       = pick(rng, info.adj);
  const firstOrgan = body.equippedOrgans()[0];
  const organType  = firstOrgan ? organResolver(firstOrgan.organId)?.type : null;
  const noun       = (organType && TYPE_NOUN[organType]) ? TYPE_NOUN[organType] : info.noun;
  // Noun first, then the qualifier in lowercase → "Œil nécrotique", not "Nécrotique Œil".
  return `${noun} ${adj.toLowerCase()}`;
}
