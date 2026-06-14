// chair_sim.mjs — Headless balance simulation for CHAIR
// Run: node chair_sim.mjs
//
// Replicates the exact formulas from CombatSystem.js + BattleEngine.js:
//   auto-attack dmg = max(1, round((dgt - armRed) * armQuality * 0.5))
//   mob dmg         = max(0, round((dgt - armRed) * armQuality * 1.0))
//   dodge chance    = min(40%, 5% + vit * 2.5%)
//   beat interval   = max(400, 1200 - ryt * 60) ms

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir  = dirname(fileURLToPath(import.meta.url));
const organs = JSON.parse(readFileSync(join(__dir, 'src/modules/games/chair/content/organs.json'), 'utf8'));
const byId   = Object.fromEntries(organs.map(o => [o.id, o]));

// ─── Slot layout (mirrors ORGAN_SLOTS in Body.js) ───────────────────────────
const SLOTS = {
  arm_l:   { type: 'arm',     layer: 'outer' },
  arm_r:   { type: 'arm',     layer: 'outer' },
  legs:    { type: 'legs',    layer: 'outer' },
  skin:    { type: 'skin',    layer: 'outer' },
  eye_l:   { type: 'eye',     layer: 'mid'   },
  eye_r:   { type: 'eye',     layer: 'mid'   },
  ear_l:   { type: 'ear',     layer: 'mid'   },
  ear_r:   { type: 'ear',     layer: 'mid'   },
  stomach: { type: 'stomach', layer: 'mid'   },
  tongue:  { type: 'tongue',  layer: 'mid'   },
  heart:   { type: 'heart',   layer: 'deep'  },
  brain:   { type: 'brain',   layer: 'deep'  },
};

const TIER_COST  = { common: 1, rare: 2, epic: 4, legendary: 8 };
const BIOME_CAPS = { gorge: 5, poumons: 12, estomac: 12, coeur: 18, entrailles: 22, 'le-fond': 28 };

// ─── RNG (mulberry32, deterministic) ────────────────────────────────────────
function rng32(seed) {
  let s = seed | 0;
  return () => {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ─── Body helpers ────────────────────────────────────────────────────────────
function qualMult(hp, maxHp) {
  if (!maxHp || hp <= 0) return 0;
  const r = hp / maxHp;
  if (r >= 0.75) return 1.2;
  if (r >= 0.5)  return 1.0;
  if (r >= 0.25) return 0.7;
  if (r > 0)     return 0.4;
  return 0;
}

function sumStats(slots) {
  const s = { dgt: 0, vit: 0, arm: 0, ryt: 0, prc: 0 };
  for (const sl of Object.values(slots)) {
    if (!sl || sl.hp <= 0) continue;
    for (const [k, v] of Object.entries(sl.stats ?? {})) if (k in s) s[k] += v;
  }
  return s;
}

function bestArmQ(slots) {
  const candidates = ['arm_l', 'arm_r']
    .map(k => slots[k])
    .filter(s => s && s.hp > 0);
  if (!candidates.length) return 0.5;
  const best = candidates.reduce((a, b) => a.hp >= b.hp ? a : b);
  return qualMult(best.hp, best.maxHp);
}

function autoTarget(slots, rng) {
  for (const layer of ['outer', 'mid', 'deep']) {
    const cands = Object.entries(slots)
      .filter(([, s]) => s && s.layer === layer && s.hp > 0)
      .map(([k]) => k);
    if (cands.length) return cands[Math.floor(rng() * cands.length)];
  }
  return null;
}

function alive(slots) {
  // Heart = primary vital organ
  if ('heart' in slots) return (slots.heart?.hp ?? 0) > 0;
  // Brain = secondary vital organ (mirrors new _isMobAlive in CombatSystem)
  if ('brain' in slots) return (slots.brain?.hp ?? 0) > 0;
  // Fully heartless+brainless: dies when any organ reaches 0
  return Object.values(slots).every(s => !s || s.hp > 0);
}

function totalHp(slots) {
  return Object.values(slots).reduce((s, sl) => s + (sl ? Math.max(0, sl.hp) : 0), 0);
}

function copy(slots) {
  const out = {};
  for (const [k, v] of Object.entries(slots)) out[k] = v ? { ...v } : null;
  return out;
}

// ─── Mob generation (mirrors MobGen.spawnForRoom logic) ─────────────────────
function genMob(floorIdx, biomeId, isElite, rng) {
  const cap    = BIOME_CAPS[biomeId] ?? 5;
  let   budget = Math.floor((5 + floorIdx * 2) * (isElite ? 1.7 : 1));
  const pool   = organs.filter(o => o.arcana <= cap);
  const slots  = Object.fromEntries(Object.keys(SLOTS).map(k => [k, null]));

  for (let attempt = 0; attempt < 30 && budget > 0; attempt++) {
    const cands = pool.filter(o => (TIER_COST[o.tier] ?? 1) <= budget);
    if (!cands.length) break;
    const def  = cands[Math.floor(rng() * cands.length)];
    const cost = TIER_COST[def.tier] ?? 1;
    const slot = Object.entries(SLOTS).find(([k, s]) => s.type === def.type && slots[k] === null)?.[0];
    if (slot) {
      slots[slot] = { hp: def.hp, maxHp: def.hp, stats: def.stats ?? {}, layer: SLOTS[slot].layer };
      budget -= cost;
    }
  }

  // Fallback
  if (Object.values(slots).every(s => s === null))
    slots['skin'] = { hp: 2, maxHp: 2, stats: {}, layer: 'outer' };

  // Elite: force best available heart
  if (isElite && slots['heart'] === null) {
    const h = pool.filter(o => o.type === 'heart').sort((a, b) => b.arcana - a.arcana)[0];
    if (h) slots['heart'] = { hp: h.hp, maxHp: h.hp, stats: h.stats ?? {}, layer: 'deep' };
  }

  // Floor 1+ commun: force brain as secondary vital if no heart/brain
  if (floorIdx >= 1 && !isElite && slots['heart'] === null && slots['brain'] === null) {
    const b = pool.filter(o => o.type === 'brain')[0];
    if (b) slots['brain'] = { hp: b.hp, maxHp: b.hp, stats: b.stats ?? {}, layer: 'deep' };
  }

  // Strip nulls
  for (const k of Object.keys(slots)) if (slots[k] === null) delete slots[k];
  return slots;
}

// ─── Player profiles ─────────────────────────────────────────────────────────
function slot(key, organId) {
  const def = byId[organId];
  if (!def) throw new Error(organId);
  return { hp: def.hp, maxHp: def.hp, stats: def.stats ?? {}, layer: SLOTS[key].layer };
}

function human() {
  return {
    arm_l:   slot('arm_l',   'arm_human'),
    arm_r:   slot('arm_r',   'arm_human'),
    legs:    slot('legs',    'legs_human'),
    skin:    slot('skin',    'skin_human'),
    eye_l:   slot('eye_l',   'eye_human'),
    eye_r:   slot('eye_r',   'eye_human'),
    ear_l:   slot('ear_l',   'ear_human'),
    ear_r:   slot('ear_r',   'ear_human'),
    stomach: slot('stomach', 'stomach_human'),
    tongue:  slot('tongue',  'tongue_human'),
    heart:   slot('heart',   'heart_human'),
    brain:   slot('brain',   'brain_human'),
  };
}

const PROFILES = [
  {
    label: 'P0 · Starter     (tous humains, dgt=2, ryt=1)',
    slots: human(),
  },
  {
    label: 'P1 · Gorge fin   (troll×2+beast legs, dgt=10+2)',
    slots: { ...human(),
      arm_l: slot('arm_l','arm_troll'), arm_r: slot('arm_r','arm_troll'),
      legs:  slot('legs','legs_beast'), skin:  slot('skin','skin_beast') },
  },
  {
    label: 'P2 · Poumons     (tentacule+pierre, legs_void, skin_stone, heart_beast)',
    slots: { ...human(),
      arm_l:  slot('arm_l','arm_tentacle'), arm_r: slot('arm_r','arm_stone'),
      legs:   slot('legs','legs_void'),     skin:  slot('skin','skin_stone'),
      heart:  slot('heart','heart_beast') },
  },
  {
    label: 'P3 · Coeur/Build VITESSE (tentacule+lich, heart_void, brain_lich)',
    slots: { ...human(),
      arm_l:  slot('arm_l','arm_tentacle'), arm_r: slot('arm_r','arm_lich'),
      legs:   slot('legs','legs_void'),     skin:  slot('skin','skin_alchimique'),
      heart:  slot('heart','heart_void'),   brain: slot('brain','brain_lich') },
  },
  {
    label: 'P4 · Coeur/Build TANK   (carapace, arm_stone×2, stomach_acid, heart_titan)',
    slots: { ...human(),
      arm_l:   slot('arm_l','arm_stone'),    arm_r:   slot('arm_r','arm_stone'),
      legs:    slot('legs','legs_spider'),   skin:    slot('skin','skin_carapace'),
      stomach: slot('stomach','stomach_acid'), heart: slot('heart','heart_titan') },
  },
];

// ─── Combat simulation ───────────────────────────────────────────────────────
const MAX_BEATS = 300;

function fight(pTemplate, mTemplate, rng) {
  const p = copy(pTemplate);
  const m = copy(mTemplate);

  const pHpStart = totalHp(p);
  let beats = 0;

  while (beats < MAX_BEATS && alive(p) && alive(m)) {
    beats++;
    const ps = sumStats(p);
    const ms = sumStats(m);

    // ── Player auto-attack ──────────────────────────────────────
    const mt = autoTarget(m, rng);
    if (mt) {
      const layer  = m[mt].layer;
      const armRed = layer === 'outer' ? Math.max(0, ms.arm) : 0;
      const aq     = bestArmQ(p);
      const dmg    = Math.max(1, Math.round((ps.dgt - armRed) * aq * 0.5));
      m[mt].hp     = Math.max(0, m[mt].hp - dmg);
    }

    if (!alive(m)) break;

    // ── Mob attack ───────────────────────────────────────────────
    const pt = autoTarget(p, rng);
    if (pt) {
      const dodge = Math.min(0.4, 0.05 + (ps.vit ?? 0) * 0.025);
      if (rng() < dodge) continue;

      const layer  = p[pt].layer;
      const armRed = layer === 'outer' ? Math.max(0, ps.arm) : 0;
      const mq     = bestArmQ(m);
      // Mobs always deal at least 1 damage — same formula as player (×0.5, ×quality)
      const dmg    = Math.max(1, Math.round((ms.dgt - armRed) * mq * 0.5));
      p[pt].hp     = Math.max(0, p[pt].hp - dmg);
    }
  }

  return {
    win:       alive(p) && !alive(m),
    beats,
    hpLostPct: Math.round((1 - totalHp(p) / pHpStart) * 100),
  };
}

// ─── Scenarios ───────────────────────────────────────────────────────────────
const SCENARIOS = [
  { label: 'Floor 0 – Gorge    commun', floor: 0,  biome: 'gorge',      elite: false },
  { label: 'Floor 0 – Gorge    élite',  floor: 0,  biome: 'gorge',      elite: true  },
  { label: 'Floor 2 – Gorge    commun', floor: 2,  biome: 'gorge',      elite: false },
  { label: 'Floor 2 – Gorge    élite',  floor: 2,  biome: 'gorge',      elite: true  },
  { label: 'Floor 5 – Poumons  commun', floor: 5,  biome: 'poumons',    elite: false },
  { label: 'Floor 5 – Poumons  élite',  floor: 5,  biome: 'poumons',    elite: true  },
  { label: 'Floor 8 – Poumons  commun', floor: 8,  biome: 'poumons',    elite: false },
  { label: 'Floor 8 – Poumons  élite',  floor: 8,  biome: 'poumons',    elite: true  },
  { label: 'Floor 11 – Cœur    commun', floor: 11, biome: 'coeur',      elite: false },
  { label: 'Floor 11 – Cœur    élite',  floor: 11, biome: 'coeur',      elite: true  },
  { label: 'Floor 14 – Cœur    commun', floor: 14, biome: 'coeur',      elite: false },
  { label: 'Floor 14 – Cœur    élite',  floor: 14, biome: 'coeur',      elite: true  },
];

const N = 2000;

// ─── Mob stats sampling ──────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════════════════╗');
console.log('║         CHAIR – Balance Simulation  (N=' + N + ' / scénario)        ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

console.log('── Stats moyennes des mobs par scénario ────────────────────────────');
console.log(`${'Scénario'.padEnd(30)} ${'DGT'.padStart(5)} ${'ARM'.padStart(5)} ${'HP tot'.padStart(7)} ${'Organes'.padStart(8)}`);
console.log('─'.repeat(60));

for (const sc of SCENARIOS) {
  const rng = rng32(999);
  let tDgt = 0, tArm = 0, tHp = 0, tOrg = 0;
  const SAMPLE = 500;
  for (let i = 0; i < SAMPLE; i++) {
    const m = genMob(sc.floor, sc.biome, sc.elite, rng);
    const s = sumStats(m);
    tDgt += s.dgt; tArm += s.arm;
    tHp  += totalHp(m);
    tOrg += Object.keys(m).length;
  }
  const avg = x => (x / SAMPLE).toFixed(1);
  console.log(`${sc.label.padEnd(30)} ${avg(tDgt).padStart(5)} ${avg(tArm).padStart(5)} ${avg(tHp).padStart(7)} ${avg(tOrg).padStart(8)}`);
}

// ─── Main simulation ─────────────────────────────────────────────────────────
console.log('\n── Résultats de combat ─────────────────────────────────────────────\n');

for (let pi = 0; pi < PROFILES.length; pi++) {
  const prof  = PROFILES[pi];
  const ps    = sumStats(prof.slots);
  const beatMs = Math.max(400, 1200 - ps.ryt * 60);
  const bpm    = Math.round(60000 / beatMs);
  const pHp    = totalHp(prof.slots);

  console.log(`▌ ${prof.label}`);
  console.log(`  dgt=${ps.dgt}  vit=${ps.vit}  arm=${ps.arm}  ryt=${ps.ryt}  HP=${pHp}  BPM=${bpm} (${(beatMs/1000).toFixed(1)}s/beat)`);
  console.log(`  ${'Scénario'.padEnd(30)} ${'Victoire'.padStart(8)} ${'Beats'.padStart(7)} ${'HP perdu'.padStart(9)} ${'Durée'.padStart(7)} ${'Note'.padStart(8)}`);
  console.log(`  ${'─'.repeat(75)}`);

  for (const sc of SCENARIOS) {
    let wins = 0, tBeats = 0, tHpLost = 0;

    for (let i = 0; i < N; i++) {
      const seed = (i * 2654435761 + pi * 997 + sc.floor * 37 + (sc.elite ? 1000003 : 0)) >>> 0;
      const rng  = rng32(seed);
      const mob  = genMob(sc.floor, sc.biome, sc.elite, rng);
      const res  = fight(prof.slots, mob, rng);
      if (res.win) wins++;
      tBeats  += res.beats;
      tHpLost += res.hpLostPct;
    }

    const wr  = (wins / N * 100).toFixed(0);
    const ab  = (tBeats / N).toFixed(1);
    const ahl = (tHpLost / N).toFixed(0);
    const dur = ((tBeats / N) * beatMs / 1000).toFixed(1);
    const note = +wr >= 90 ? '✓ ok'
               : +wr >= 70 ? '△ tendu'
               : +wr >= 50 ? '⚠ dur'
               :             '✖ fatal';

    console.log(`  ${sc.label.padEnd(30)} ${(wr + '%').padStart(8)} ${ab.padStart(7)} ${(ahl + '%').padStart(9)} ${(dur + 's').padStart(7)} ${note.padStart(8)}`);
  }
  console.log();
}
