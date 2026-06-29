// Balance sim for the new turn-based combat. Runs the first-floor fight many
// times with a reasonable player AI and reports winrate / turns / end-HP.
//   node src/modules/games/chair/_tests/turncombat.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { ORGAN_SLOTS } from '../src/entities/Body.js';
import * as CR from '../src/systems/combatRules.js';

const here = dirname(fileURLToPath(import.meta.url));
const ORGANS = JSON.parse(readFileSync(resolve(here, '../content/organs.json'), 'utf8'));
const DEFS = new Map(ORGANS.map((d) => [d.id, {
  id: d.id, type: d.type, name: d.name, layer: d.layer, maxHp: d.hp,
  pool: d.pool ?? 0, skills: d.skills ?? [], passives: d.passives ?? [], harvest: d.harvest ?? {},
}]));
const organResolver = (id) => DEFS.get(id) ?? null;

// simple seeded rng (mulberry32)
function mulberry(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function emptyBody(id) { const slots = {}; for (const k of Object.keys(ORGAN_SLOTS)) slots[k] = null; return { id, slots }; }
function humanBody() {
  const b = emptyBody('player');
  for (const k of Object.keys(ORGAN_SLOTS)) { const t = ORGAN_SLOTS[k].type; b.slots[k] = { organId: `${t}_human`, hp: DEFS.get(`${t}_human`).maxHp }; }
  return b;
}
const COMMON = ORGANS.filter((o) => o.tier === 'common');
function genMob(rng) {
  const b = emptyBody('mob');
  const n = 2 + Math.floor(rng() * 2); // 2-3 organs
  let placed = 0, tries = 0;
  while (placed < n && tries < 30) {
    tries++;
    const o = COMMON[Math.floor(rng() * COMMON.length)];
    const key = Object.keys(ORGAN_SLOTS).find((k) => ORGAN_SLOTS[k].type === o.type && b.slots[k] === null);
    if (key) { b.slots[key] = { organId: o.id, hp: o.hp }; placed++; }
  }
  if (rng() < 0.6 && !b.slots['heart']) b.slots['heart'] = { organId: 'heart_human', hp: DEFS.get('heart_human').maxHp };
  return { id: 'mob', body: b, _bleeds: {} };
}

// --- player AI for one combat. returns { win, turns, playerHpPct } ---
function runCombat(seed) {
  const rng = mulberry(seed);
  const player = humanBody();
  const mob = genMob(rng);
  const FLOOR_SCALE = 1; // floor 0

  const pstate = { blood: 0, guard: 0, dodgeCharges: 0, empower: 0, onceUsed: new Set(), meat: 0,
    onOrganKillBlood: CR.livingSlots(player).some((k) => organResolver(player.slots[k].organId).passives.some((p) => p.id === 'instinct')) ? 1 : 0 };

  const BUDGET = 1; // floor 0 → 1 action (see TurnCombat._mobBudget)
  let plan = CR.chooseMobPlan(mob, player, organResolver, rng, FLOOR_SCALE, BUDGET);
  let turns = 0;
  while (turns < 40) {
    turns++;
    // ----- player turn -----
    pstate.blood = CR.bloodPool(player, organResolver);
    pstate.guard = 0;
    // choose target: heart if reachable else shallowest wall organ to breach
    const reach = CR.targetableSlots(mob.body, false);
    let target = reach.find((k) => k === 'heart');
    if (!target) {
      // pick the lowest-hp targetable non-heart organ to breach fastest
      target = reach.sort((a, bk) => {
        const ha = (mob.body.slots[a].hp), hb = (mob.body.slots[bk].hp); return ha - hb;
      })[0];
    }
    mob._target = target;
    // play attack cards greedily; keep Sursaut for emergencies
    let guard = false;
    let safety = 0;
    while (pstate.blood > 0 && safety++ < 12) {
      // gather playable attack skills from living organs
      let played = false;
      for (const k of CR.livingSlots(player)) {
        const def = organResolver(player.slots[k].organId);
        for (const sk of def.skills) {
          if (sk.effect?.kind !== 'damage') continue;
          if ((sk.cost ?? 0) > pstate.blood) continue;
          const r = CR.playCard(pstate, player, def, sk,
            { enemy: mob, target: { body: mob.body, slotKey: mob._target, isSelf: false } }, organResolver, rng);
          if (r.ok) { played = true; break; }
        }
        if (played) break;
      }
      if (!played) break;
      mob._target = (CR.targetableSlots(mob.body, false).find((x) => x === 'heart')) || mob._target;
      if (!CR.vitalAlive(mob.body)) break;
    }
    CR.tickBleeds(mob, organResolver);
    if (!CR.vitalAlive(mob.body)) {
      const liv = CR.livingSlots(player);
      const pct = liv.reduce((s, k) => s + player.slots[k].hp, 0) / liv.reduce((s, k) => s + organResolver(player.slots[k].organId).maxHp, 0);
      return { win: true, turns, playerHpPct: pct };
    }
    // ----- mob turn -----
    CR.resolveMobPlan(plan, mob, player, pstate, organResolver, rng);
    if (!CR.vitalAlive(player)) return { win: false, turns, playerHpPct: 0 };
    plan = CR.chooseMobPlan(mob, player, organResolver, rng, FLOOR_SCALE, BUDGET);
  }
  return { win: false, turns, playerHpPct: 0, timeout: true };
}

const N = 2000;
let wins = 0, turnsSum = 0, hpSum = 0, timeouts = 0;
for (let i = 0; i < N; i++) {
  const r = runCombat(i + 1);
  if (r.win) { wins++; hpSum += r.playerHpPct; }
  if (r.timeout) timeouts++;
  turnsSum += r.turns;
}
console.log(`1er combat (étage 0) — ${N} essais :`);
console.log(`  winrate : ${(100 * wins / N).toFixed(1)}%`);
console.log(`  tours moyens : ${(turnsSum / N).toFixed(1)}`);
console.log(`  PV restants moyens (victoires) : ${(100 * hpSum / Math.max(1, wins)).toFixed(0)}%`);
console.log(`  timeouts : ${timeouts}`);
