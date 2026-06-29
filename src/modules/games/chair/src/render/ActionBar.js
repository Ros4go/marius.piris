// Context-sensitive action bar — at most 6 .act buttons.
// Rebuilt on every render call (cheap, 6 elements max).
// During combat: organ-derived slots (bras=FRAPPER, jambes=ESQUIVER, ···=slot perdu).
// Outside combat: context buttons (récolter, greffer, descendre…).

import { WS, currentRoom } from '../WorldState.js';
import { organResolver } from '../registry.js';
import * as TurnCombat from '../TurnCombat.js';

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
  if (!act || act.disabled) return;
  _onAction?.(act);
}

function _buildBtn(act, i) {
  const btn = document.createElement('button');

  const key = document.createElement('span');
  key.className = 'key';

  const label = document.createElement('b');
  const sub = document.createElement('em');

  btn.append(key, label, sub);
  btn._key = key; btn._lbl = label; btn._sub = sub;

  btn.addEventListener('click', () => _fire(btn));
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); _fire(btn); }, { passive: false });

  _updateBtn(btn, act, i);
  return btn;
}

function _updateBtn(btn, act, i) {
  btn._act = act;
  btn.className = 'act'
    + (act.combat ? ' cbt' : '')
    + (act.action === 'END_TURN' ? ' endturn' : '')
    + (act.heart ? ' heartact' : '')
    + (act.disabled ? ' empty' : '');
  btn.disabled = !!act.disabled;
  btn.dataset.action = act.action;
  btn.title = act.desc ?? act.label ?? '';
  if (btn._key) btn._key.textContent = act.keyText ?? `${(i ?? 0) + 1}`;
  if (btn._lbl) btn._lbl.textContent = act.label ?? '';
  if (btn._sub) btn._sub.textContent = act.sub ?? '';
}

// --- Battle skill derivation ---
// The skill is fully defined per organ (organ.skill = { kind, label, … }).

// Turn-based hand: one button per playable organ skill (card) + END TURN.
function _deriveBattle() {
  const acts = [];
  for (const c of TurnCombat.hand()) {
    if (acts.length >= 5) break;
    const cost = c.skill.cost ?? 0;
    const note = c.blocked === 'no_meat' ? ' (pas de viande)' : c.blocked === 'used' ? ' (épuisé)' : '';
    acts.push({
      action: 'CARD', organKey: c.organKey, skillId: c.skill.id,
      label: c.skill.label, keyText: `${cost}💉`,
      sub: (c.skill.desc ?? '') + note, desc: c.skill.desc ?? '',
      disabled: !c.playable, combat: true,
    });
  }
  acts.push({
    action: 'END_TURN', label: 'FIN DU TOUR', keyText: '⏎',
    sub: `${TurnCombat.blood()}💉 restant — l'ennemi joue`,
    desc: 'Termine ton tour : les ennemis exécutent leur action télégraphiée.', combat: true,
  });
  return acts;
}

// --- Action derivation ---

function _derive(room) {
  // During combat the bottom bar is empty — the drag-and-drop card hand
  // (CombatHand) takes over. This bar is exploration-only.
  if (TurnCombat.isActive()) return [];

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
