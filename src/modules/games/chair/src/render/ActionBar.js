// Context-sensitive action bar — at most 6 .act buttons.
// Rebuilt on every render call (cheap, 6 elements max).
// During combat: organ-derived slots (bras=FRAPPER, jambes=ESQUIVER, ···=slot perdu).
// Outside combat: context buttons (récolter, greffer, descendre…).

import { WS, currentRoom } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { ORGAN_SLOTS } from '../entities/Body.js';
import { ORGAN_CD } from '../BattleEngine.js';

const _bar      = document.getElementById('action-bar');
const _bloodBar = document.getElementById('blood-pool-bar');
let _onAction = null;

export function setCallback(fn) { _onAction = fn; }

export function render() {
  const room    = currentRoom();
  const actions = _derive(room);

  _bar.innerHTML = '';

  if (WS.battle?.active) {
    _updateBloodBar();
    _bloodBar.style.display = '';
  } else {
    _bloodBar.style.display = 'none';
    _bloodBar.innerHTML = '';
  }

  actions.forEach((act, i) => {
    const isBattleSkill = WS.battle?.active && act.action === 'SKILL';

    const btn = document.createElement('button');
    btn.className = 'act'
      + (act.heart ? ' heartact' : '')
      + (act.disabled && !isBattleSkill ? ' empty' : '')
      + (isBattleSkill ? ' charging' : '')
      + (isBattleSkill && act.ready ? ' ready' : '');

    if (act.disabled && !isBattleSkill) btn.disabled = true;
    btn.dataset.action = act.action;

    if (isBattleSkill) {
      btn.style.setProperty('--charge', `${act.chargePct ?? 0}%`);
    }

    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = `${i + 1}`;

    const label = document.createElement('b');
    label.textContent = act.label;

    const sub = document.createElement('em');
    sub.textContent = act.sub ?? '';

    btn.append(key, label, sub);

    if (isBattleSkill) {
      btn.appendChild(_renderBloodCtrl(act));
    }

    btn.addEventListener('click', () => {
      if (isBattleSkill && !act.ready) return;  // can't fire if not charged
      _onAction?.(act);
    });
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (isBattleSkill && !act.ready) return;
      _onAction?.(act);
    }, { passive: false });

    _bar.appendChild(btn);
  });
}

function _updateBloodBar() {
  const pool  = WS.battle.bloodPool ?? 0;
  const alloc = Object.values(WS.battle.bloodAlloc ?? {}).reduce((s, n) => s + n, 0);
  const free  = pool - alloc;

  const pips = Array.from({ length: pool }, (_, i) =>
    `<span class="blood-pip${i < alloc ? ' used' : ''}"></span>`
  ).join('');

  _bloodBar.className = 'blood-pool-bar';
  _bloodBar.innerHTML = `<span class="blood-label">💉</span>${pips}<span class="blood-free${free <= 0 ? ' empty' : ''}">${free}</span>`;
}

function _renderBloodCtrl(act) {
  const ctrl = document.createElement('div');
  ctrl.className = 'blood-ctrl';

  const minus = document.createElement('button');
  minus.className = 'blood-btn';
  minus.textContent = '−';
  minus.disabled = (act.blood ?? 0) <= 0;
  minus.addEventListener('click', (e) => {
    e.stopPropagation();
    _onAction?.({ action: 'BLOOD_DEC', slotKey: act.slotKey });
  });
  minus.addEventListener('touchstart', (e) => {
    e.stopPropagation(); e.preventDefault();
    _onAction?.({ action: 'BLOOD_DEC', slotKey: act.slotKey });
  }, { passive: false });

  const count = document.createElement('span');
  count.className = 'blood-count';
  count.textContent = `${act.blood ?? 0}💉`;

  const plus = document.createElement('button');
  plus.className = 'blood-btn';
  plus.textContent = '+';
  plus.disabled = (act.freeBlood ?? 0) <= 0 || (act.blood ?? 0) >= (act.maxBlood ?? 1);
  plus.addEventListener('click', (e) => {
    e.stopPropagation();
    _onAction?.({ action: 'BLOOD_INC', slotKey: act.slotKey });
  });
  plus.addEventListener('touchstart', (e) => {
    e.stopPropagation(); e.preventDefault();
    _onAction?.({ action: 'BLOOD_INC', slotKey: act.slotKey });
  }, { passive: false });

  ctrl.append(minus, count, plus);
  return ctrl;
}

// --- Helpers ---

function _slotAlive(slotKey) {
  const slot = WS.player.body?.slots?.[slotKey];
  return slot !== null && slot !== undefined && (slot.hp === null || slot.hp > 0);
}

function _organName(slotKey) {
  const slot = WS.player.body?.slots?.[slotKey];
  if (!slot) return null;
  return organResolver(slot.organId)?.name ?? null;
}

// --- Battle skill derivation ---

// Returns the active skill for a given slot during battle.
// Arms and legs always get a skill. Secondary organs (eye, ear, brain, stomach,
// tongue, skin) only unlock a skill when the organ is at least rare — common
// variants are too basic to grant an active power.
function _skillForSlot(slotKey, def) {
  const type      = ORGAN_SLOTS[slotKey]?.type;
  const abilities = def.abilities ?? [];

  if (type !== 'arm' && type !== 'legs' && def.tier === 'common') return null;
  switch (type) {
    case 'arm':
      return abilities.includes('pierce_layer') ? { label: 'ESTOC' } : { label: 'FRAPPER' };
    case 'legs':    return { label: 'ESQUIVER' };
    case 'tongue':
      return def.triggers?.some(t => t.do === 'life_steal')
        ? { label: 'VAMPIRISER' }
        : { label: 'MORDRE' };
    case 'brain':   return { label: 'ANALYSER' };
    case 'eye':     return { label: 'VISER' };
    case 'ear':     return { label: 'ÉCOUTER' };
    case 'stomach': return { label: 'DIGÉRER' };
    case 'skin':    return { label: 'DURCIR' };
    case 'heart':   return null;  // passive — no clickable skill
    default:        return null;
  }
}

// Priority order of organ slots to show as skill buttons during battle.
const BATTLE_SLOT_ORDER = ['arm_l','arm_r','legs','tongue','brain','eye_l','eye_r','ear_l','ear_r','stomach','skin'];

function _deriveBattle() {
  const body      = WS.player.body;
  const acts      = [];
  const allocSum  = Object.values(WS.battle?.bloodAlloc ?? {}).reduce((s, n) => s + n, 0);
  const freeBlood = (WS.battle?.bloodPool ?? 0) - allocSum;

  for (const slotKey of BATTLE_SLOT_ORDER) {
    if (acts.length >= 6) break;
    const slot = body?.slots?.[slotKey];
    if (!slot) continue;
    if (slot.hp !== null && slot.hp <= 0) continue;  // dead organ

    const def = organResolver(slot.organId);
    if (!def) continue;

    const skill = _skillForSlot(slotKey, def);
    if (!skill) continue;

    const prog      = WS.battle?.organProgress?.[slotKey];
    const blood     = WS.battle?.bloodAlloc?.[slotKey] ?? 0;
    const chargePct = prog ? Math.round((prog.chargedMs / Math.max(1, prog.totalMs)) * 100) : 0;
    const ready     = prog?.ready ?? false;
    const slotType  = ORGAN_SLOTS[slotKey]?.type;
    const maxBlood  = ORGAN_CD[slotType]?.maxBlood ?? 1;

    const sub = !prog ? 'inactif' : ready ? '▶ PRÊT' : `${chargePct}%`;

    acts.push({
      action:    'SKILL',
      slotKey,
      label:     skill.label,
      sub,
      disabled:  !ready,
      ready,
      chargePct,
      blood,
      maxBlood,
      freeBlood,
    });
  }

  if (acts.length < 6 && (WS.player.inventory?.length ?? 0) > 0) {
    acts.push({ action: 'MANGER_OPEN', label: 'MANGER', sub: 'organe · combat' });
  }

  return acts;
}

// --- Action derivation ---

function _derive(room) {
  if (WS.battle?.active) return _deriveBattle();

  const acts = [];
  const hasMobs = room?.mobIds?.some(id => WS.mobs.get(id)?.lifecycle === 'active');

  if (hasMobs) {
    // ── Combat slots ──────────────────────────────────────────────────────────
    // Bras gauche → FRAPPER (ou ··· si perdu)
    if (_slotAlive('arm_l')) {
      acts.push({ label: 'FRAPPER', sub: _organName('arm_l') ?? 'bras G', action: 'ATTACK_AUTO' });
    } else {
      acts.push({ label: '···', sub: 'bras gauche perdu', action: 'NOOP', disabled: true });
    }

    // Bras droit → FRAPPER (ou ···)
    if (_slotAlive('arm_r')) {
      acts.push({ label: 'FRAPPER', sub: _organName('arm_r') ?? 'bras D', action: 'ATTACK_AUTO' });
    } else {
      acts.push({ label: '···', sub: 'bras droit perdu', action: 'NOOP', disabled: true });
    }

    // Jambes → ESQUIVER (consomme une charge au combat)
    if (_slotAlive('legs')) {
      acts.push({ label: 'ESQUIVER', sub: _organName('legs') ?? 'jambes', action: 'WAIT' });
    } else {
      acts.push({ label: '···', sub: 'sans jambes', action: 'NOOP', disabled: true });
    }

    // Cœur → ULTIME (passif — s'active à la mort imminente ; WAIT en attendant)
    if (_slotAlive('heart')) {
      acts.push({ label: 'ULTIME', sub: _organName('heart') ?? 'cœur', action: 'WAIT', heart: true });
    } else {
      acts.push({ label: '···', sub: 'sans cœur', action: 'NOOP', disabled: true });
    }

    acts.push({ label: 'ATTENDRE', sub: '1 tick', action: 'WAIT' });

  } else {
    // ── Hors combat : boutons contextuels ────────────────────────────────────
    const { floorIdx, pos } = WS.player;

    const hasCadavers = [...WS.cadavers.values()].some(c =>
      (c.lifecycle === 'fresh' || c.lifecycle === 'decaying') &&
      c.pos?.floorIdx === floorIdx && c.pos?.x === pos.x && c.pos?.y === pos.y
    );
    if (hasCadavers) acts.push({ label: 'RÉCOLTER', sub: 'cadavre', action: 'HARVEST_OPEN' });

    if (WS.player.inventory.length > 0) {
      const graftCost = (WS.player?.relics ?? []).includes('relic_suture_noire') ? 3 : 5;
      acts.push({ label: 'GREFFER', sub: `${graftCost} ticks`, action: 'GRAFT_OPEN' });
      acts.push({ label: 'MANGER', sub: 'organe · satiété', action: 'MANGER_OPEN' });
      acts.push({ label: 'AMPUTER', sub: '0 tick', action: 'AMPUTATE_OPEN' });
    }

    if (room?.defId === 'exit') {
      acts.push({ label: 'DESCENDRE', sub: '↓', action: 'DESCEND' });
    }

    acts.push({ label: 'ATTENDRE', sub: '1 tick', action: 'WAIT' });
  }

  return acts.slice(0, 6);
}
