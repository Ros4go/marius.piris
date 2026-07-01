// Turn-based combat engine (Slay-the-Spire-like). Glues the pure combatRules
// to the WorldState. The UI drives it: read hand()/enemies()/telegraphs(),
// call play() to spend Blood on a card, endTurn() to let enemies act.
//
// Replaces the old real-time BattleEngine. Kill = drop the enemy's vital organ.

import { WS, currentRoom, rng } from './WorldState.js';
import { organResolver, balance as getBalance } from './registry.js';
import * as CR from './systems/combatRules.js';
import * as HungerSystem from './systems/HungerSystem.js';
import * as Faculties from './systems/Faculties.js';

const _weak = () => getBalance().weakPoint ?? { revealPalier: 3, bonus: 3 };

let _onChange = null;   // UI refresh callback
let _onEnd    = null;   // called when combat ends
let _onLog    = null;   // (text, cls) => void

export const state = {
  active:    false,
  pstate:    null,       // { blood, protection, regen, frenesie, empower, onceUsed, usedThisTurn, meat, onOrganKillBlood }
  plans:     {},         // mobId → [ telegraphed actions ]
  targetMobId: null,
  targetSlot:  null,
  turn:        0,
};

function _activeMobs() {
  const room = currentRoom();
  return (room?.mobIds ?? []).map((id) => WS.mobs.get(id)).filter((m) => m && m.lifecycle === 'active');
}
function _hasInstinct(body) {
  return CR.livingSlots(body).some((k) => organResolver(body.slots[k].organId)?.passives?.some((p) => p.id === 'instinct'));
}

export function isActive() { return state.active; }

export function start(onChange, onEnd, onLog) {
  _onChange = onChange; _onEnd = onEnd; _onLog = onLog;
  const body = WS.player.body;
  state.active = true;
  state.turn = 1;
  state.pstate = {
    blood: Math.max(0, CR.bloodPool(body, organResolver) - HungerSystem.bloodPenalty()),
    protection: 0, regen: HungerSystem.regenBonus(), frenesie: 0,
    hungerDmg: HungerSystem.damageModifier(),   // Fringale (−) / well-fed (+) flat mod
    weakBonus: weakRevealed() ? _weak().bonus : 0,
    empower: 0,
    onceUsed: new Set(),
    usedThisTurn: new Set(),
    meat: WS.player.gold ?? 0,
    onOrganKillBlood: _hasInstinct(body) ? 1 : 0,
  };
  CR.produceTurnResources(body, state.pstate, organResolver);   // Protection from skin, Régé (incl. well-fed)
  for (const m of _activeMobs()) { m._bleeds = {}; m._bile = {}; m._vuln = {}; }
  _retelegraphAll();
  _log(`⚔ Combat — ${state.pstate.blood} Sang.`, 'sys');
  _onChange?.();
}

export function stop(callEnd = true) {
  state.active = false;
  WS.player.gold = state.pstate?.meat ?? WS.player.gold;
  if (callEnd) _onEnd?.();
}

// --- Queries for the UI ----------------------------------------------------

export function blood() { return state.pstate?.blood ?? 0; }
export function meat()  { return state.pstate?.meat ?? 0; }
export function protection() { return state.pstate?.protection ?? 0; }
export function frenesie()   { return state.pstate?.frenesie ?? 0; }
export function regen()      { return state.pstate?.regen ?? 0; }
export function guard() { return state.pstate?.protection ?? 0; }   // legacy alias

// Your HAND this turn: one card per organ skill. A skill is playable ONCE per
// turn — once played its card leaves the hand (to the discard) and comes back
// next turn; `once` skills (Sursaut) leave for the whole combat.
export function hand() {
  const body = WS.player.body;
  const out = [];
  const used = state.pstate?.usedThisTurn ?? new Set();
  for (const key of CR.livingSlots(body)) {
    const def = organResolver(body.slots[key].organId);
    for (const sk of def?.skills ?? []) {
      const cardId = `${key}:${sk.id}`;
      if (used.has(cardId)) continue;                                // played this turn → discarded
      if (sk.once && state.pstate?.onceUsed?.has(sk.id)) continue;   // once-per-combat, spent
      const blocked =
        ((sk.cost ?? 0) > blood()) ? 'no_blood'
        : (sk.effect?.costMeat && meat() < sk.effect.costMeat) ? 'no_meat'
        : null;
      out.push({ organKey: key, organId: def.id, skill: sk, cardId, playable: !blocked, blocked });
    }
  }
  return out;
}

// How many cards are in the discard right now (played this turn + spent once-cards).
export function discardCount() {
  const body = WS.player.body;
  let total = 0;
  for (const key of CR.livingSlots(body)) {
    total += organResolver(body.slots[key].organId)?.skills?.length ?? 0;
  }
  return Math.max(0, total - hand().length);
}

// The cards currently sitting in the discard (for the click-to-view panel).
export function discardedCards() {
  const body = WS.player.body;
  const used = state.pstate?.usedThisTurn ?? new Set();
  const once = state.pstate?.onceUsed ?? new Set();
  const out = [];
  for (const key of CR.livingSlots(body)) {
    const def = organResolver(body.slots[key].organId);
    for (const sk of def?.skills ?? []) {
      const inDiscard = used.has(`${key}:${sk.id}`) || (sk.once && once.has(sk.id));
      if (inDiscard) out.push({ label: sk.label, organName: def.name, desc: sk.desc ?? '', once: !!sk.once });
    }
  }
  return out;
}

// Targetable enemy organ slots on a given mob (respecting breach/pierce).
export function targetable(mobId, pierce = false) {
  const m = WS.mobs.get(mobId);
  if (!m) return [];
  return CR.targetableSlots(m.body, pierce);
}

export function enemies() { return _activeMobs(); }
// The mob's full telegraphed plan for next turn (array of actions; [] if none).
export function telegraphOf(mobId) { return state.plans[mobId] ?? []; }

export function setTarget(mobId, slotKey) {
  state.targetMobId = mobId;
  state.targetSlot  = slotKey;
  _onChange?.();
}

// --- Actions ---------------------------------------------------------------

export function play(organKey, skillId, mobId, targetSlot, isSelf = false) {
  if (!state.active) return false;
  const body = WS.player.body;
  const def  = organResolver(body.slots[organKey]?.organId);
  const sk   = (def?.skills ?? []).find((s) => s.id === skillId);
  if (!sk) return false;

  const mob = WS.mobs.get(mobId) ?? WS.mobs.get(state.targetMobId) ?? _activeMobs()[0];
  // even a self-cast keeps the focused enemy as the routing default (e.g. a
  // retriggered arm still strikes the enemy you're aiming at).
  if (mob) mob._target = (isSelf ? state.targetSlot : (targetSlot ?? state.targetSlot)) ?? null;

  const target = isSelf
    ? { body, slotKey: targetSlot ?? null, isSelf: true }
    : { body: mob?.body, slotKey: targetSlot ?? state.targetSlot ?? null, isSelf: false };

  const r = CR.playCard(state.pstate, body, def, sk, { enemy: mob, target }, organResolver, rng);
  if (!r.ok) { if (r.reason) _log(`✗ ${sk.label} : ${_reason(r.reason)}`, 'sys'); return false; }
  WS.player.gold = state.pstate.meat;
  (state.pstate.usedThisTurn ??= new Set()).add(`${organKey}:${skillId}`);   // card → discard for this turn
  _emitEvents(r.events, sk);

  // self-harm can drop your own vital organ → you die
  if (!CR.vitalAlive(WS.player.body)) { _lose(mob); return true; }

  if (mob && !CR.vitalAlive(mob.body)) _killMob(mob);
  if (_combatWon()) { _win(); return true; }
  _onChange?.();
  return true;
}

// Resolve the enemy phase and RETURN a timeline for the UI to animate. The state
// is fully mutated here; the caller plays the timeline, then calls finalizeTurn().
// `_activeMobs()` is already in left-to-right order (DOM/flex order = mobIds order),
// so the leftmost enemy attacks first.
export function endTurn() {
  if (!state.active) return { timeline: [], outcome: null };
  const timeline = [];

  // enemy end-of-turn statuses: Bile ticks (+ spreads on kill), Vulnérabilité decays
  for (const m of _activeMobs()) {
    const evs = CR.tickEnemyStatus(m, organResolver, rng);
    if (evs.length) timeline.push({ mobId: m.id, kind: 'status', events: evs });
    if (!CR.vitalAlive(m.body)) _killMob(m);
  }
  if (_combatWon()) { state.outcome = 'win'; return { timeline, outcome: 'win' }; }

  // enemies resolve their telegraphed plans (each may chain several attacks)
  for (const m of _activeMobs()) {
    const plan = state.plans[m.id];
    const evs = CR.resolveMobPlan(plan, m, WS.player.body, state.pstate, organResolver, rng);
    timeline.push({ mobId: m.id, kind: 'attack', events: evs });
    if (!CR.vitalAlive(WS.player.body)) { state.outcome = 'lose'; state.killer = m; return { timeline, outcome: 'lose' }; }
    if (!CR.vitalAlive(m.body)) _killMob(m);   // Saignement can kill a mob mid-attack
  }
  if (_combatWon()) { state.outcome = 'win'; return { timeline, outcome: 'win' }; }

  // prepare the next player turn (values only; retelegraph happens in finalizeTurn)
  state.turn++;
  state.pstate.usedThisTurn = new Set();   // all cards return to hand
  state.pstate.blood = Math.max(0, CR.bloodPool(WS.player.body, organResolver) - HungerSystem.bloodPenalty());
  state.pstate.hungerDmg = HungerSystem.damageModifier();
  state.pstate.weakBonus = weakRevealed() ? _weak().bonus : 0;
  state.pstate.regen = (state.pstate.regen ?? 0) + HungerSystem.regenBonus();
  const prod = CR.produceTurnResources(WS.player.body, state.pstate, organResolver);  // Protection + Régénération
  timeline.push({ mobId: null, kind: 'produce', events: prod });
  state.outcome = null;
  return { timeline, outcome: null };
}

// Called by the UI after the enemy-phase animation finishes.
export function finalizeTurn() {
  if (state.outcome === 'win')  { state.outcome = null; _win();  return; }
  if (state.outcome === 'lose') { state.outcome = null; _lose(state.killer); return; }
  _retelegraphAll();
  _onChange?.();
}

// Emit combat-log lines for a batch of events (used by the animation playback).
export function logEvents(events) { _emitEvents(events); }

// --- Internals -------------------------------------------------------------

function _retelegraphAll() {
  state.plans = {};
  for (const m of _activeMobs()) {
    state.plans[m.id] = CR.chooseMobPlan(m, WS.player.body, organResolver, rng);
    m._weakSpot = _pickWeakSpot(m);   // rotates each turn
  }
}

function _pickWeakSpot(mob) {
  const t = CR.targetableSlots(mob.body, false);
  return t.length ? t[Math.floor(rng() * t.length)] : null;
}

// The weak point is only revealed (and only deals its bonus) at high Lucidité.
export function weakRevealed() { return Faculties.luciditePalier() >= _weak().revealPalier; }
export function weakSpotOf(mobId) { return WS.mobs.get(mobId)?._weakSpot ?? null; }

function _killMob(mob) {
  if (mob.lifecycle === 'dead') return;
  mob.lifecycle = 'dead';
  if (WS.player.runStats) WS.player.runStats.kills++;
  const floor = WS.floors[mob.pos?.floorIdx ?? WS.player.floorIdx];
  const room = floor?.cell?.(mob.pos.x, mob.pos.y);
  if (room) { room.removeMob(mob.id); if (room.mobIds.length === 0) room.markCleared?.(); }
  const cadId = `cad_${mob.id}`;
  WS.cadavers.set(cadId, { id: cadId, mobId: mob.id, body: mob.body, lifecycle: 'fresh', pos: { ...mob.pos } });
  _log(`${mob.name} s'effondre.`, 'death');
  delete state.plans[mob.id];
}

function _combatWon()  { return _activeMobs().length === 0; }
function _win()  { _log('Salle vidée.', 'sys'); stop(true); }
function _lose(mob) {
  state.active = false;
  WS.player.gold = state.pstate.meat;
  _log('VOUS ÊTES MORT.', 'death');
  // PLAYER_DIED is emitted by the caller via the death flow; signal via onEnd
  _onEnd?.('dead');
}

function _emitEvents(events, skill) {
  for (const e of events ?? []) {
    switch (e.t) {
      case 'damage':
        if (e.who === 'self')            _log(`⚠ Tu te mutiles · ton ${e.name ?? e.key} −${e.dmg}${e.dead ? ' ✗ DÉTRUIT' : ''}`, e.dead ? 'death' : 'damage');
        else if (e.who === 'bile')       _log(`☣ Bile · ${e.name ?? e.key} −${e.dmg}${e.dead ? ' ✗' : ''}`, 'damage');
        else if (e.who === 'saignement') _log(`∴ Saignement · ${e.name ?? e.key} −${e.dmg}${e.dead ? ' ✗' : ''}`, 'damage');
        else                             _log(`${e.name ?? e.key} −${e.dmg}${e.dead ? ' ✗' : ''}`, 'damage');
        break;
      case 'mob_action':
        _log(`☣ Ennemi · ${e.label} → ton ${e.target} : −${e.dmg}${e.soaked ? ` (🛡 ${e.soaked} bloqués)` : ''}${e.dead ? ' ✗ DÉTRUIT' : ''}`, e.dead ? 'death' : 'damage');
        break;
      case 'heal':     _log(`✦ +${e.amount} PV ${e.who === 'enemy' ? '(ennemi !)' : '(toi)'} · ${e.key}`, e.who === 'enemy' ? 'damage' : 'sys'); break;
      case 'heal_all': _log(`✦ +${e.amount} PV ${e.who === 'enemy' ? "à l'ennemi !" : 'à tes organes blessés'}`, e.who === 'enemy' ? 'damage' : 'sys'); break;
      case 'guard':
      case 'protect':  _log(`🛡 Protection +${e.amount}`, 'sys'); break;
      case 'regen_set':_log(`✚ Régénération +${e.amount}`, 'sys'); break;
      case 'frenesie': _log(`🔥 Frénésie +${e.amount} (dégâts)`, 'sys'); break;
      case 'convert':  _log(`⇄ ${e.from} → +${e.amount} ${e.to}`, 'sys'); break;
      case 'bile':     _log(`☣ Bile +${e.amount} sur ${e.key}`, 'sys'); break;
      case 'saignement':   _log(`∴ Saignement +${e.amount} sur ${e.key}`, 'sys'); break;
      case 'vulnerabilite':_log(`◎ Vulnérabilité +${e.amount} sur ${e.key}`, 'sys'); break;
      case 'bile_spread':  _log(`☣ La Bile se propage sur ${e.key} (+${e.amount})`, 'sys'); break;
      case 'weak':     _log('✦ Point faible touché !', 'sys'); break;
      case 'retrigger':_log(`↻ Sursaut redéclenche ${e.label}.`, 'sys'); break;
      case 'meat':     _log(`+${e.amount} viande`, 'harvest'); break;
      case 'blood':    _log(`+${e.amount} Sang`, 'sys'); break;
      case 'interrupted': _log(`✗ ${e.label} — interrompu !`, 'sys'); break;
    }
  }
}

function _log(t, cls) { _onLog?.(t, cls); }
function _reason(r) {
  return { no_blood: 'pas assez de Sang', no_meat: 'pas assez de viande', used: 'déjà utilisé',
           no_target: 'aucune cible', unknown_effect: '?' }[r] ?? r;
}
