// Pure turn-based combat rules for CHAIR. No DOM, no WorldState, no registry
// import — everything is passed in (organResolver, rng, bodies, state). This
// makes it fully unit-testable (see _tests) and deterministic.
//
// Model: player spends Blood (from heart) each turn on organ skill "cards".
// Enemies telegraph one action; it resolves on their turn. Kill = drop the
// VITAL organ (heart, else brain, else last organ). Reaching a deep organ
// needs a BREACH: destroying ≥1 organ in the layer above opens a hole (or a
// pierce skill ignores walls). Damaging non-vital organs lowers their harvest
// quality — so a clean kill (minimal collateral) preserves the loot.

import { ORGAN_SLOTS } from '../entities/Body.js';

export const LAYERS = ['outer', 'mid', 'deep'];

// --- Body inspection -------------------------------------------------------

export function organAlive(body, key) {
  const s = body.slots[key];
  return !!s && s.organId && (s.hp == null || s.hp > 0);
}
function organExists(body, key) {
  const s = body.slots[key];
  return !!s && !!s.organId;
}
export function livingSlots(body) {
  return Object.keys(ORGAN_SLOTS).filter((k) => organAlive(body, k));
}
function slotsInLayer(layer) {
  return Object.keys(ORGAN_SLOTS).filter((k) => ORGAN_SLOTS[k].layer === layer);
}

// The combatant is alive while its vital organ lives.
// Vital = heart if present, else brain, else any living organ.
export function vitalAlive(body) {
  if (organExists(body, 'heart')) return organAlive(body, 'heart');
  if (organExists(body, 'brain')) return organAlive(body, 'brain');
  return livingSlots(body).length > 0;
}

// --- Passives (armor / dodge / blood pool) ---------------------------------

function passivesOf(body, organResolver, pid) {
  let total = 0;
  for (const key of livingSlots(body)) {
    const def = organResolver(body.slots[key].organId);
    for (const p of def?.passives ?? []) if (p.id === pid) total += p.value ?? 0;
  }
  return total;
}
export function armorOf(body, organResolver) { return passivesOf(body, organResolver, 'armor'); }
export function dodgePct(body, organResolver) {
  // best dodge organ wins (legs), capped
  let best = 0;
  for (const key of livingSlots(body)) {
    const def = organResolver(body.slots[key].organId);
    for (const p of def?.passives ?? []) if (p.id === 'dodge') best = Math.max(best, p.value ?? 0);
  }
  return Math.min(80, best);
}
export function bloodPool(body, organResolver) {
  const h = body.slots['heart'];
  if (h?.organId && (h.hp == null || h.hp > 0)) return organResolver(h.organId)?.pool ?? 3;
  return 3; // a pulse remains even with a wrecked heart
}

// --- Targeting & breach ----------------------------------------------------

// A layer above is a "wall" if it still has a living organ and none destroyed.
function layerHasWall(body, layer) {
  const slots = slotsInLayer(layer);
  let living = 0, destroyed = 0, exists = 0;
  for (const k of slots) {
    if (!organExists(body, k)) continue;
    exists++;
    if (organAlive(body, k)) living++; else destroyed++;
  }
  return living > 0 && destroyed === 0 && exists > 0;
}
export function layerAccessible(body, layer, pierce = false) {
  if (pierce) return true;
  const idx = LAYERS.indexOf(layer);
  for (let i = 0; i < idx; i++) if (layerHasWall(body, LAYERS[i])) return false;
  return true;
}
// All enemy organ slots the player may currently target.
export function targetableSlots(body, pierce = false) {
  return livingSlots(body).filter((k) => layerAccessible(body, ORGAN_SLOTS[k].layer, pierce));
}
function adjacentSlots(body, key) {
  const layer = ORGAN_SLOTS[key].layer;
  return livingSlots(body).filter((k) => k !== key && ORGAN_SLOTS[k].layer === layer);
}

// --- Damage application ----------------------------------------------------

function maxHp(def) { return def?.maxHp ?? 1; }
function curHp(body, key, organResolver) {
  const s = body.slots[key];
  return s.hp == null ? maxHp(organResolver(s.organId)) : s.hp;
}
function dealDamage(body, key, dmg, organResolver, ev, who) {
  if (!organAlive(body, key)) return false;
  const before = curHp(body, key, organResolver);
  const after = Math.max(0, before - dmg);
  body.slots[key].hp = after;
  const def = organResolver(body.slots[key].organId);
  ev.push({ t: 'damage', who, key, dmg, organId: body.slots[key].organId, dead: after <= 0, name: def?.name });
  return after <= 0; // returns true if it killed the organ
}
function healOrgan(body, key, amount, organResolver, ev, who) {
  if (!organAlive(body, key)) return 0;
  const def = organResolver(body.slots[key].organId);
  const healed = Math.min(amount, maxHp(def) - curHp(body, key, organResolver));
  if (healed <= 0) return 0;
  body.slots[key].hp = curHp(body, key, organResolver) + healed;
  ev.push({ t: 'heal', who, key, amount: healed });
  return healed;
}
function healWorst(body, amount, organResolver, ev, who) {
  let worst = null, worstRatio = Infinity;
  for (const k of livingSlots(body)) {
    const def = organResolver(body.slots[k].organId);
    const hp = curHp(body, k, organResolver), mx = maxHp(def);
    if (hp >= mx) continue;
    const r = hp / mx;
    if (r < worstRatio) { worstRatio = r; worst = k; }
  }
  if (!worst) return 0;
  const def = organResolver(body.slots[worst].organId);
  const healed = Math.min(amount, maxHp(def) - curHp(body, worst, organResolver));
  body.slots[worst].hp = curHp(body, worst, organResolver) + healed;
  ev.push({ t: 'heal', who, key: worst, amount: healed });
  return healed;
}
function healAll(body, amount, organResolver, ev, who) {
  let total = 0;
  for (const k of livingSlots(body)) {
    const def = organResolver(body.slots[k].organId);
    const hp = curHp(body, k, organResolver), mx = maxHp(def);
    if (hp >= mx) continue;
    const healed = Math.min(amount, mx - hp);
    body.slots[k].hp = hp + healed; total += healed;
  }
  if (total) ev.push({ t: 'heal_all', who, amount });
  return total;
}

// --- Player plays a card ---------------------------------------------------
// pstate: { blood, guard, dodgeCharges, empower, onceUsed:Set, meat, onOrganKillBlood }
// ctx:    { enemy, target } — `enemy` is the focused mob (routes damage and
//         default targeting); `target = { body, slotKey, isSelf }` is the organ
//         the card was dropped on. ANY effect can be aimed at an enemy organ OR
//         at one of your own organs — same effect either way. Self-targeting
//         ignores layers, dodge and armor (you can strike your own heart).
// Returns { ok, events[] }. Mutates pstate and the relevant bodies.
export function playCard(pstate, playerBody, organ, skill, ctx, organResolver, rng, _depth = 0) {
  const ev = [];
  if (!skill) return { ok: false, events: ev };
  const cost = skill.cost ?? 0;
  if (skill.once && pstate.onceUsed?.has(skill.id)) return { ok: false, reason: 'used', events: ev };
  if (cost > pstate.blood) return { ok: false, reason: 'no_blood', events: ev };
  const eff    = skill.effect ?? {};
  const target = ctx?.target ?? null;
  const enemy  = ctx?.enemy ?? null;

  if (eff.costMeat && (pstate.meat ?? 0) < eff.costMeat) return { ok: false, reason: 'no_meat', events: ev };

  switch (eff.kind) {
    case 'damage': {
      const r = _resolveOrganTarget(eff, target, enemy, organResolver);
      if (!r) return { ok: false, reason: 'no_target', events: ev };
      const { body: tbody, key, isSelf } = r;
      const who = isSelf ? 'self' : 'player';
      let dmg = eff.amount ?? 0;
      if (pstate.empower) { dmg = Math.round(dmg * (1 + pstate.empower)); pstate.empower = 0; }
      if (!eff.pierce && !isSelf) dmg = Math.max(1, dmg - armorOf(tbody, organResolver));
      const killed = dealDamage(tbody, key, dmg, organResolver, ev, who);
      if (eff.splash) for (const adj of adjacentSlots(tbody, key)) dealDamage(tbody, adj, eff.splash, organResolver, ev, who);
      if (eff.bleed && !isSelf && enemy) { enemy._bleeds = enemy._bleeds ?? {}; enemy._bleeds[key] = (enemy._bleeds[key] ?? 0) + eff.bleed; }
      if (eff.lifesteal) healWorst(playerBody, eff.lifesteal, organResolver, ev, 'player');
      if (killed && !isSelf && eff.meatOnKill) { pstate.meat = (pstate.meat ?? 0) + eff.meatOnKill; ev.push({ t: 'meat', amount: eff.meatOnKill }); }
      if (killed && !isSelf && pstate.onOrganKillBlood) { pstate.blood += pstate.onOrganKillBlood; ev.push({ t: 'blood', amount: pstate.onOrganKillBlood }); }
      break;
    }
    case 'heal': {
      const body = target?.isSelf ? playerBody : (enemy?.body ?? playerBody);
      const who  = target?.isSelf ? 'self' : 'enemy';
      if (eff.costMeat) pstate.meat -= eff.costMeat;
      if (eff.target === 'all') healAll(body, eff.amount ?? 0, organResolver, ev, who);
      else if (target?.slotKey && organAlive(body, target.slotKey)) healOrgan(body, target.slotKey, eff.amount ?? 0, organResolver, ev, who);
      else healWorst(body, eff.amount ?? 0, organResolver, ev, who);
      break;
    }
    case 'retrigger': {
      if (_depth > 0) return { ok: false, reason: 'no_effect', events: ev };
      const body = target?.isSelf ? playerBody : enemy?.body;
      const key  = target?.slotKey;
      if (!body || !key || !organAlive(body, key)) return { ok: false, reason: 'no_target', events: ev };
      const sub = (organResolver(body.slots[key].organId)?.skills ?? [])[0];
      if (!sub?.effect || sub.effect.kind === 'retrigger') return { ok: false, reason: 'no_effect', events: ev };
      ev.push({ t: 'retrigger', label: sub.label, key });
      // Re-fire the copied skill for free, on its obvious recipient.
      const subTarget = sub.effect.kind === 'damage' && enemy
        ? { body: enemy.body, slotKey: enemy._target ?? null, isSelf: false }
        : { body: playerBody, slotKey: target?.isSelf ? key : null, isSelf: true };
      const sr = playCard(pstate, playerBody, organ, { ...sub, cost: 0, once: false },
        { enemy, target: subTarget }, organResolver, rng, _depth + 1);
      for (const e of sr.events) ev.push(e);
      break;
    }
    case 'guard':  pstate.guard = (pstate.guard ?? 0) + (eff.amount ?? 0); ev.push({ t: 'guard', amount: eff.amount }); break;
    case 'dodge':  pstate.dodgeCharges = (pstate.dodgeCharges ?? 0) + (eff.charges ?? 1);
                   if (eff.empower) pstate.empower = eff.empower; ev.push({ t: 'dodge_set', charges: eff.charges ?? 1 }); break;
    case 'blood':  pstate.blood += eff.amount ?? 0; break;
    default: return { ok: false, reason: 'unknown_effect', events: ev };
  }

  pstate.blood -= cost;
  if (skill.once) { pstate.onceUsed = pstate.onceUsed ?? new Set(); pstate.onceUsed.add(skill.id); }
  return { ok: true, events: ev };
}

// Resolve where an organ-targeting effect lands. Self → the dropped organ (any
// layer, no wall). Enemy → the dropped slot if reachable, else the focused
// target, else the first reachable slot. Returns { body, key, isSelf } or null.
function _resolveOrganTarget(eff, target, enemy, organResolver) {
  if (target?.isSelf) {
    const body = target.body;
    const key  = target.slotKey && organAlive(body, target.slotKey) ? target.slotKey : null;
    return key ? { body, key, isSelf: true } : null;
  }
  const body = enemy?.body;
  if (!body) return null;
  const reachable = targetableSlots(body, !!eff.pierce);
  let key = target?.slotKey && reachable.includes(target.slotKey) ? target.slotKey
          : (enemy._target && reachable.includes(enemy._target) ? enemy._target : reachable[0]);
  return key ? { body, key, isSelf: false } : null;
}

// --- Enemy AI: choose & resolve --------------------------------------------

// All attack skills a mob can perform from its living organs.
function mobAttackSkills(mob, organResolver) {
  const out = [];
  for (const key of livingSlots(mob.body)) {
    const def = organResolver(mob.body.slots[key].organId);
    for (const sk of def?.skills ?? []) if (sk.effect?.kind === 'damage') out.push({ key, skill: sk });
  }
  return out;
}

function _shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Pick a player organ to hit: brainy mobs aim the weakest accessible, else random.
function _pickPlayerTarget(playerBody, organResolver, rng, hasBrain, pierce) {
  const targetable = targetableSlots(playerBody, pierce);
  if (!targetable.length) return null;
  if (hasBrain) {
    return targetable.reduce((a, b) =>
      (curHp(playerBody, b, organResolver) < curHp(playerBody, a, organResolver) ? b : a), targetable[0]);
  }
  return targetable[Math.floor(rng() * targetable.length)];
}

// Build the mob's PLAN for next turn: a sequence of attacks. A mob is exactly
// like the player — its Blood budget is its own heart pool (residual pulse of 3
// if it has no heart), and it spends that Blood firing its attacking organs,
// one skill per organ, biggest first if it has a brain. So two arms + enough
// Blood = two strikes. Damage is whatever the organ's skill deals — no floor
// multiplier. Difficulty scales only through the organ BUDGET mobs are built
// with (deeper floors → more / better organs → bigger heart → more attacks).
export function chooseMobPlan(mob, playerBody, organResolver, rng, budget = null) {
  const atks = mobAttackSkills(mob, organResolver);
  if (!atks.length) return [];
  const hasBrain = organAlive(mob.body, 'brain');
  let pool = budget == null ? bloodPool(mob.body, organResolver) : budget;
  const order = hasBrain
    ? atks.slice().sort((a, b) => (b.skill.effect.amount ?? 0) - (a.skill.effect.amount ?? 0))
    : _shuffle(atks, rng);

  const plan = [];
  for (const a of order) {
    const cost = a.skill.cost ?? 0;
    if (cost > pool) continue;            // can't afford → skip, try a cheaper organ
    const target = _pickPlayerTarget(playerBody, organResolver, rng, hasBrain, !!a.skill.effect.pierce);
    if (!target) break;                   // nothing reachable on the player
    pool -= cost;
    const amount = a.skill.effect.amount ?? 1;
    plan.push({ organKey: a.key, skillId: a.skill.id, target, amount, label: a.skill.label, pierce: !!a.skill.effect.pierce });
    if (pool <= 0) break;
  }
  return plan;
}

// Resolve a mob's whole telegraphed plan against the player, in order.
export function resolveMobPlan(plan, mob, playerBody, pstate, organResolver, rng) {
  const ev = [];
  for (const tel of plan ?? []) {
    // the firing organ may have died this turn → that hit is interrupted
    if (!organAlive(mob.body, tel.organKey)) { ev.push({ t: 'interrupted', label: tel.label }); continue; }
    // retarget if the telegraphed player organ is already gone
    let key = tel.target;
    if (!organAlive(playerBody, key)) {
      const tt = targetableSlots(playerBody, tel.pierce);
      if (!tt.length) continue;
      key = tt[Math.floor(rng() * tt.length)];
    }
    // guaranteed dodge charges, then passive dodge (per hit)
    if ((pstate.dodgeCharges ?? 0) > 0) { pstate.dodgeCharges--; ev.push({ t: 'dodge', key, label: tel.label }); continue; }
    if (rng() * 100 < dodgePct(playerBody, organResolver)) { ev.push({ t: 'dodge', key, label: tel.label }); continue; }
    let dmg = tel.amount;
    const raw = dmg;
    if (!tel.pierce) dmg = Math.max(1, dmg - armorOf(playerBody, organResolver));
    const guarded = pstate.guard > 0;
    if (pstate.guard) dmg = Math.max(0, dmg - pstate.guard);
    let dead = false;
    if (dmg > 0) {
      const before = curHp(playerBody, key, organResolver);
      playerBody.slots[key].hp = Math.max(0, before - dmg);
      dead = playerBody.slots[key].hp <= 0;
    }
    ev.push({ t: 'mob_action', label: tel.label, organKey: tel.organKey, target: key, dmg, raw, guarded, dead });
    if (!vitalAlive(playerBody)) break;   // player down → stop the onslaught
  }
  return ev;
}

// Bleeds tick on an enemy (player-inflicted) — call at end of player turn.
export function tickBleeds(enemy, organResolver) {
  const ev = [];
  if (!enemy._bleeds) return ev;
  for (const [key, amt] of Object.entries(enemy._bleeds)) {
    if (organAlive(enemy.body, key)) dealDamage(enemy.body, key, amt, organResolver, ev, 'bleed');
  }
  enemy._bleeds = {};
  return ev;
}
