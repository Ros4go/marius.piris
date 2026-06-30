// Turn-based combat engine (Slay-the-Spire-like). Glues the pure combatRules
// to the WorldState. The UI drives it: read hand()/enemies()/telegraphs(),
// call play() to spend Blood on a card, endTurn() to let enemies act.
//
// Replaces the old real-time BattleEngine. Kill = drop the enemy's vital organ.

import { WS, currentRoom, rng } from './WorldState.js';
import { organResolver } from './registry.js';
import * as CR from './systems/combatRules.js';

let _onChange = null;   // UI refresh callback
let _onEnd    = null;   // called when combat ends
let _onLog    = null;   // (text, cls) => void

export const state = {
  active:    false,
  pstate:    null,       // { blood, guard, dodgeCharges, empower, onceUsed, meat, onOrganKillBlood }
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
    blood: CR.bloodPool(body, organResolver),
    guard: 0, dodgeCharges: 0, empower: 0,
    onceUsed: new Set(),
    meat: WS.player.gold ?? 0,
    onOrganKillBlood: _hasInstinct(body) ? 1 : 0,
  };
  for (const m of _activeMobs()) { m._bleeds = {}; }
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
export function guard() { return state.pstate?.guard ?? 0; }

// Player's playable cards this turn, from living organs that have skills.
export function hand() {
  const body = WS.player.body;
  const out = [];
  for (const key of CR.livingSlots(body)) {
    const def = organResolver(body.slots[key].organId);
    for (const sk of def?.skills ?? []) {
      const blocked =
        (sk.once && state.pstate?.onceUsed?.has(sk.id)) ? 'used'
        : ((sk.cost ?? 0) > blood()) ? 'no_blood'
        : (sk.effect?.costMeat && meat() < sk.effect.costMeat) ? 'no_meat'
        : null;
      out.push({ organKey: key, organId: def.id, skill: sk, playable: !blocked, blocked });
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
  _emitEvents(r.events, sk);

  // self-harm can drop your own vital organ → you die
  if (!CR.vitalAlive(WS.player.body)) { _lose(mob); return true; }

  if (mob && !CR.vitalAlive(mob.body)) _killMob(mob);
  if (_combatWon()) { _win(); return true; }
  _onChange?.();
  return true;
}

export function endTurn() {
  if (!state.active) return;
  // bleeds tick on every enemy
  for (const m of _activeMobs()) { _emitEvents(CR.tickBleeds(m, organResolver)); if (!CR.vitalAlive(m.body)) _killMob(m); }
  if (_combatWon()) { _win(); return; }

  // enemies resolve their telegraphed plans (each may chain several attacks)
  for (const m of _activeMobs()) {
    const plan = state.plans[m.id];
    const evs = CR.resolveMobPlan(plan, m, WS.player.body, state.pstate, organResolver, rng);
    _emitEvents(evs);
    if (!CR.vitalAlive(WS.player.body)) { _lose(m); return; }
  }
  // new player turn
  state.turn++;
  state.pstate.blood = CR.bloodPool(WS.player.body, organResolver);
  state.pstate.guard = 0;
  _retelegraphAll();
  _onChange?.();
}

// --- Internals -------------------------------------------------------------

function _retelegraphAll() {
  state.plans = {};
  for (const m of _activeMobs()) {
    state.plans[m.id] = CR.chooseMobPlan(m, WS.player.body, organResolver, rng);
  }
}

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
        if (e.who === 'self')      _log(`⚠ Tu te mutiles · ton ${e.name ?? e.key} −${e.dmg}${e.dead ? ' ✗ DÉTRUIT' : ''}`, e.dead ? 'death' : 'damage');
        else if (e.who === 'bleed') _log(`∴ Saignement · ${e.name ?? e.key} −${e.dmg}${e.dead ? ' ✗' : ''}`, 'damage');
        else                        _log(`${e.name ?? e.key} −${e.dmg}${e.dead ? ' ✗' : ''}`, 'damage');
        break;
      case 'mob_action':
        _log(`☣ Ennemi · ${e.label} → ton ${e.target} : −${e.dmg}${e.guarded ? ' (garde)' : ''}${e.dead ? ' ✗ DÉTRUIT' : ''}`, e.dead ? 'death' : 'damage');
        break;
      case 'heal':     _log(`✦ +${e.amount} PV ${e.who === 'enemy' ? '(ennemi !)' : '(toi)'} · ${e.key}`, e.who === 'enemy' ? 'damage' : 'sys'); break;
      case 'heal_all': _log(`✦ +${e.amount} PV ${e.who === 'enemy' ? "à l'ennemi !" : 'à tes organes blessés'}`, e.who === 'enemy' ? 'damage' : 'sys'); break;
      case 'guard':    _log(`◈ Garde +${e.amount} ce tour`, 'sys'); break;
      case 'dodge':    _log(`★ Tu esquives ${e.label ?? 'cette attaque'} !`, 'sys'); break;
      case 'dodge_set':_log(`★ Esquive prête (${e.charges})`, 'sys'); break;
      case 'retrigger':_log(`↻ Sursaut redéclenche ${e.label}.`, 'sys'); break;
      case 'meat':     _log(`+${e.amount} viande`, 'harvest'); break;
      case 'blood':    _log(`+${e.amount} Sang (frénésie)`, 'sys'); break;
      case 'interrupted': _log(`✗ ${e.label} — interrompu !`, 'sys'); break;
    }
  }
}

function _log(t, cls) { _onLog?.(t, cls); }
function _reason(r) {
  return { no_blood: 'pas assez de Sang', no_meat: 'pas assez de viande', used: 'déjà utilisé',
           no_target: 'aucune cible', unknown_effect: '?' }[r] ?? r;
}
