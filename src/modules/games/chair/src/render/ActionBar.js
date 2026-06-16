// Context-sensitive action bar — at most 6 .act buttons.
// Rebuilt on every render call (cheap, 6 elements max).
// During combat: organ-derived slots (bras=FRAPPER, jambes=ESQUIVER, ···=slot perdu).
// Outside combat: context buttons (récolter, greffer, descendre…).

import { WS, currentRoom } from '../WorldState.js';
import { organResolver } from '../registry.js';

const _bar    = document.getElementById('action-bar');
let _onAction = null;

export function setCallback(fn) { _onAction = fn; }

let _btns = [];    // current button elements (parallel to last actions)
let _sig  = null;  // structural signature of the current layout

export function render() {
  const room    = currentRoom();
  const actions = _derive(room);

  // Structural signature — changes only when the *set* of buttons changes.
  const sig = actions.map((a) =>
    `${a.action}:${a.slotKey ?? ''}:${a.label}:${a.heart ? 1 : 0}`).join('|');

  // Same structure as last render → update buttons in place.
  // Combat re-renders ~10×/s; a full teardown would replace a button between
  // mousedown and mouseup, swallowing the click (and flickering the bar).
  if (sig === _sig && _btns.length === actions.length) {
    actions.forEach((act, i) => _updateBtn(_btns[i], act, i));
    return;
  }

  // Structure changed → full rebuild.
  _sig  = sig;
  _btns = [];
  _bar.innerHTML = '';
  actions.forEach((act, i) => {
    const btn = _buildBtn(act, i);
    _btns.push(btn);
    _bar.appendChild(btn);
  });
}

// Fire the button's *current* action (read live, never via stale closure).
function _fire(btn) {
  const act = btn._act;
  if (!act) return;
  if (WS.battle?.active && act.action === 'SKILL' && !act.ready) return;
  _onAction?.(act);
}

function _buildBtn(act, i) {
  const btn = document.createElement('button');

  const key = document.createElement('span');
  key.className = 'key';
  key.textContent = `${i + 1}`;

  const label = document.createElement('b');
  label.textContent = act.label;

  const sub = document.createElement('em');

  btn.append(key, label, sub);
  btn._sub = sub;

  btn.addEventListener('click', () => _fire(btn));
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); _fire(btn); }, { passive: false });

  _updateBtn(btn, act, i);
  return btn;
}

function _updateBtn(btn, act) {
  btn._act = act;
  const isBattleSkill = WS.battle?.active && act.action === 'SKILL';

  btn.className = 'act'
    + (act.heart ? ' heartact' : '')
    + (act.disabled && !isBattleSkill ? ' empty' : '')
    + (isBattleSkill ? ' charging' : '')
    + (isBattleSkill && act.ready ? ' ready' : '');

  btn.disabled = !!(act.disabled && !isBattleSkill);
  btn.dataset.action = act.action;

  if (isBattleSkill) btn.style.setProperty('--charge', `${act.chargePct ?? 0}%`);
  if (btn._sub) btn._sub.textContent = act.sub ?? '';
}

// --- Battle skill derivation ---
// The skill is fully defined per organ (organ.skill = { kind, label, … }).

// Priority order of organ slots to show as skill buttons during battle.
const BATTLE_SLOT_ORDER = ['arm_l','arm_r','legs','tongue','brain','eye_l','eye_r','ear_l','ear_r','stomach','skin'];

function _deriveBattle() {
  const body = WS.player.body;
  const acts = [];

  for (const slotKey of BATTLE_SLOT_ORDER) {
    if (acts.length >= 6) break;
    const slot = body?.slots?.[slotKey];
    if (!slot) continue;
    if (slot.hp !== null && slot.hp <= 0) continue;  // dead organ

    const def = organResolver(slot.organId);
    const sk  = def?.skill;
    if (!sk?.kind) continue;  // no active skill (purely passive organ)

    const prog      = WS.battle?.organProgress?.[slotKey];
    const chargePct = prog ? Math.round((prog.chargedMs / Math.max(1, prog.totalMs)) * 100) : 0;
    const ready     = prog?.ready ?? false;
    const sub       = !prog ? 'inactif' : ready ? '▶ PRÊT' : `${chargePct}%`;

    acts.push({ action: 'SKILL', slotKey, label: sk.label || sk.kind.toUpperCase(), sub, disabled: !ready, ready, chargePct });
  }

  return acts;
}

// --- Action derivation ---

function _derive(room) {
  // Combat is real-time: as soon as a room has active mobs, BattleEngine starts
  // and WS.battle.active drives the skill bar. This branch handles exploration only.
  if (WS.battle?.active) return _deriveBattle();

  const acts = [];
  const { floorIdx, pos } = WS.player;

  const hasCadavers = [...WS.cadavers.values()].some(c =>
    (c.lifecycle === 'fresh' || c.lifecycle === 'decaying') &&
    c.pos?.floorIdx === floorIdx && c.pos?.x === pos.x && c.pos?.y === pos.y
  );
  if (hasCadavers) acts.push({ label: 'RÉCOLTER', sub: 'cadavre', action: 'HARVEST_OPEN' });

  if (WS.player.inventory.length > 0) {
    const graftCost = (WS.player?.relics ?? []).includes('relic_suture_noire') ? 3 : 5;
    acts.push({ label: 'GREFFER', sub: `${graftCost} ticks`, action: 'GRAFT_OPEN' });
    acts.push({ label: 'AMPUTER', sub: '0 tick', action: 'AMPUTATE_OPEN' });
  }

  if (room?.defId === 'exit') {
    acts.push({ label: 'DESCENDRE', sub: '↓', action: 'DESCEND' });
  }

  acts.push({ label: 'ATTENDRE', sub: '1 tick', action: 'WAIT' });

  return acts.slice(0, 6);
}
