// Context-sensitive action bar — at most 6 .act buttons.
// Rebuilt on every render call (cheap, 6 elements max).
// During combat: organ-derived slots (bras=FRAPPER, jambes=ESQUIVER, ···=slot perdu).
// Outside combat: context buttons (récolter, greffer, descendre…).

import { WS, currentRoom } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { ORGAN_SLOTS } from '../entities/Body.js';

const _bar = document.getElementById('action-bar');
let _onAction = null;

export function setCallback(fn) { _onAction = fn; }

export function render() {
  const room    = currentRoom();
  const actions = _derive(room);

  _bar.innerHTML = '';
  actions.forEach((act, i) => {
    const btn = document.createElement('button');
    btn.className = 'act' + (act.heart ? ' heartact' : '') + (act.disabled ? ' empty' : '');
    if (act.disabled) btn.disabled = true;
    btn.dataset.action = act.action;

    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = `${i + 1}`;

    const label = document.createElement('b');
    label.textContent = act.label;

    const sub = document.createElement('em');
    sub.textContent = act.sub ?? '';

    btn.append(key, label, sub);

    btn.addEventListener('click', () => _onAction?.(act));
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      _onAction?.(act);
    }, { passive: false });

    _bar.appendChild(btn);
  });
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
  const body = WS.player.body;
  const acts = [];

  for (const slotKey of BATTLE_SLOT_ORDER) {
    if (acts.length >= 6) break;
    const slot = body?.slots?.[slotKey];
    if (!slot) continue;
    if (slot.hp !== null && slot.hp <= 0) continue;  // dead organ

    const def = organResolver(slot.organId);
    if (!def) continue;

    const skill = _skillForSlot(slotKey, def);
    if (!skill) continue;

    const cd  = WS.battle?.skillCooldowns?.[slotKey] ?? 0;
    const hp  = slot.hp ?? def.maxHp;
    acts.push({
      action:   'SKILL',
      slotKey,
      label:    skill.label,
      sub:      cd > 0 ? `${cd}♥` : `${hp}/${def.maxHp} HP`,
      disabled: cd > 0,
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

    // Jambes → ESQUIVER = WAIT avec chance de riposte/esquive
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
