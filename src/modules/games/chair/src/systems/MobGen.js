import { WS, rng } from '../WorldState.js';
import { biome as getBiome, roomDef as getRoomDef, allOrgans, organResolver, mob as getMobDef, balance as getBalance } from '../registry.js';
import { pick, shuffle } from '../rng.js';
import { Body, ORGAN_SLOTS } from '../entities/Body.js';
import { TYPE_NOUN } from '../labels.js';

const TIER_RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };
const TIERS = ['common', 'rare', 'epic', 'legendary'];

// ── Tout l'équilibrage des mobs est PAR BIOME (biomes.json mobs) — pas de ──
// courbe globale. Fonctions pures du biome : partagées avec l'atelier.
const TIERS_DEFAUT = { common: 70, rare: 20, epic: 8, legendary: 2 };

// Budget d'organes d'un mob : biome.mobs.budget = [au 1er étage du biome, au
// dernier], interpolé linéairement sur son floorRange (étage humain, 1-based).
export function budgetFor(biome, floorIdx) {
  const [f0, f1] = biome?.floorRange ?? [1, 1];
  const [b0, b1] = biome?.mobs?.budget ?? [5, 10];
  const t = f1 > f0 ? Math.min(1, Math.max(0, (floorIdx + 1 - f0) / (f1 - f0))) : 0;
  return b0 + (b1 - b0) * t;
}
// Taux d'apparition des tiers du biome (biomes.json mobs.tiers), NORMALISÉS —
// les tiers ne sont pas des paliers à débloquer, juste des poids de tirage.
export function tierTauxFor(biome) {
  const t = biome?.mobs?.tiers ?? {};
  const brut = Object.fromEntries(TIERS.map((k) => [k, Math.max(0, t[k] ?? TIERS_DEFAUT[k])]));
  const tot = Object.values(brut).reduce((s, v) => s + v, 0) || 1;
  return Object.fromEntries(TIERS.map((k) => [k, brut[k] / tot]));
}

// Pool d'organes d'un biome : ses SETS (biomes.json mobs.sets) ± exceptions —
// mobs.plus ajoute des organes précis hors sets, mobs.moins en exclut.
// Exporté pour l'atelier (qui passe ses brouillons en `organs`).
export function poolFor(biome, organs = allOrgans()) {
  const m = biome?.mobs ?? {};
  const sets  = m.sets ?? [];
  const plus  = new Set(m.plus ?? []);
  const moins = new Set(m.moins ?? []);
  return organs.filter((o) => (plus.has(o.id) || sets.includes(o.set)) && !moins.has(o.id));
}
// `intrusion` = chance, à chaque tirage d'organe, de piocher HORS du pool.
function _pools(biome) {
  const dedans = poolFor(biome);
  const ids    = new Set(dedans.map((o) => o.id));
  const dehors = allOrgans().filter((o) => !ids.has(o.id));
  return { dedans, dehors, intrusion: biome?.mobs?.intrusion ?? 0 };
}

// Tire UN organe : source (pool/intrus), puis TIER selon les taux du biome
// (parmi les tiers abordables), puis organe uniforme dans ce tier.
function _tireOrgane(pools, biome, budget, tierCost) {
  const source = (pools.dehors.length && rng() < pools.intrusion) ? pools.dehors : pools.dedans;
  const abordables = source.filter((o) => (tierCost[o.tier] ?? 1) <= budget);
  if (!abordables.length) return null;
  const taux = tierTauxFor(biome);
  const parTier = TIERS.filter((t) => abordables.some((o) => o.tier === t));
  let r = rng() * parTier.reduce((s, t) => s + taux[t], 0);
  let tier = parTier[parTier.length - 1];
  for (const t of parTier) { if (r < taux[t]) { tier = t; break; } r -= taux[t]; }
  return pick(rng, abordables.filter((o) => o.tier === tier));
}

const THEME_NAMES = {
  putrid:      { adj: ['Putride','Nécrotique','Fétide','Ranci'],        noun: 'de Chair'     },
  crawling:    { adj: ['Rampant','Grouillant','Traçant','Infect'],       noun: 'des Galeries' },
  flying:      { adj: ['Suspendu','Errant','Ailé','Flottant'],           noun: 'des Airs'     },
  spore:       { adj: ['Sporeux','Pulvérulent','Émetteur','Sporal'],     noun: 'Fongique'     },
  crystalline: { adj: ['Cristallin','Prismatique','Fracturé','Éclat'],   noun: 'de Pierre'    },
  burning:     { adj: ['Ardent','Embrasé','Consumé','Incandescent'],     noun: 'de Braise'    },
};

// Pre-populate an ENTIRE floor with its mobs at generation time, so we know
// upfront WHERE every mob is and WHICH mob it is (needed for future room-to-room
// movement). Called once when a floor is generated — never on load.
export function populateFloor(floor, floorIdx) {
  const biome = getBiome(floor.biomeId);
  for (const room of floor.rooms.values()) {
    if (!room || room.cleared || (room.mobIds?.length ?? 0) > 0) continue;
    if (!room.isHostile?.()) continue;
    const def = getRoomDef(room.defId);
    if (def?.spawns?.graveyard) spawnGraveyardMob(room, floorIdx);
    else if (def?.spawns?.boss) { if (biome?.bossId) spawnBoss(biome.bossId, room, floorIdx); }
    else spawnForRoom(room, floor, floorIdx);
  }
}

// Spawn procedural mobs for a single hostile room.
export function spawnForRoom(room, floor, floorIdx) {
  const biome = getBiome(floor.biomeId);
  if (!biome) return;

  const def = getRoomDef(room.defId);
  if (!def?.spawns) return;

  const { minMobs, maxMobs, elite = false } = def.spawns;
  if (maxMobs === 0) return;

  const B     = getBalance().mob;
  // 3 emplacements par salle (gauche/centre/droite) → jamais plus de 3 mobs,
  // spawns périodiques (Nid) compris.
  const count = Math.min(_spawnCount(minMobs, maxMobs, floorIdx),
                         Math.max(0, 3 - (room.mobIds?.length ?? 0)));
  if (count <= 0) return;

  // At most ONE strong mob per pack. A room may force elites (combat_elite);
  // otherwise we roll a single elite chance for the whole group and pick one
  // member to be it. The other members are built on a reduced budget so a pack
  // is never three heavyweights at once — the elite leads, the rest support.
  const plan = _packPlan(count, elite, elite || rng() < (B.eliteChance ?? 0.04));
  plan.forEach((p, i) => {
    const theme = pick(rng, biome.themes);
    const mob   = _createMob(biome, theme, floorIdx, room, i, p.isElite, p.budgetMult);
    WS.mobs.set(mob.id, mob);
    room.addMob(mob.id);
  });
}

// Composition d'une meute : au plus UNE élite (index tiré), les autres en
// soutien à budget réduit. forceAll = salle combat_elite (tous élites).
function _packPlan(count, forceAll, hasElite) {
  const B = getBalance().mob;
  const eliteIdx = hasElite && !forceAll ? Math.floor(rng() * count) : -1;
  return Array.from({ length: count }, (_, i) => {
    const isElite = forceAll || i === eliteIdx;
    return { isElite, budgetMult: (hasElite && !isElite) ? (B.supportBudgetMult ?? 0.55) : 1 };
  });
}

// ── Outillage (atelier « Équilibrage ») : générer hors salle réelle ──
export function rollMob(biomeId, floorIdx, { elite = false } = {}) {
  const biome = getBiome(biomeId);
  if (!biome) return null;
  return _createMob(biome, pick(rng, biome.themes), floorIdx, { id: 'r_0_0' }, 0, elite, 1);
}
export function rollPack(biomeId, floorIdx, { count = 3, elite = false } = {}) {
  const biome = getBiome(biomeId);
  if (!biome) return [];
  return _packPlan(count, false, elite).map((p, i) =>
    _createMob(biome, pick(rng, biome.themes), floorIdx, { id: 'r_0_0' }, i, p.isElite, p.budgetMult));
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
  // budget = entrée→sortie du biome (interpolé) × élite × rôle dans la meute
  let budget = Math.max(1, Math.floor(budgetFor(biome, floorIdx)
    * (isElite ? B.mob.eliteMult : 1) * budgetMult));

  const pools = _pools(biome);
  const pool  = pools.dedans;   // pour les organes vitaux forcés (cœur/cerveau)
  const body  = Body.empty(id);

  let attempts = 0;
  while (budget > 0 && attempts < 30) {
    attempts++;
    const organDef = _tireOrgane(pools, biome, budget, B.tierCost);
    if (!organDef) break;
    const cost = B.tierCost[organDef.tier] ?? 1;

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

  // Entity property tags (TDD §2.7). Flying mobs at floor 3+ may be FULLY
  // invisible (10 × `invisible` = opacity 0) — needs vue-invisible/echolocation.
  const tags = [];
  if (theme === 'flying' && floorIdx >= 2 && rng() < 0.25) tags.push(...Array(10).fill('invisible'));

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
    tags,
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
