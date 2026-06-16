// Combat: renders the enemy as a parallel "reactor" inside #foe-panel — every
// organ shows its charge filling in real time (FTL-style threat table), its HP,
// and is click-to-target. Cells are built once and updated in place so clicks
// aren't lost to the ~10×/s combat re-render.

import { WS } from '../../WorldState.js';
import { organResolver } from '../../registry.js';
import { ORGAN_SLOTS } from '../../entities/Body.js';
import * as AbilitySystem from '../../systems/AbilitySystem.js';

const _foe       = document.getElementById('foe-panel');
const _foeName   = document.getElementById('foe-name');
const _foeSeg    = document.getElementById('foe-seg');
const _foeIntent = document.getElementById('foe-intent');

const TYPE_LABEL = {
  skin: 'PEAU', arm: 'BRAS', legs: 'JAMBES', eye: 'ŒIL', ear: 'OUÏE',
  stomach: 'ESTOMAC', tongue: 'LANGUE', heart: 'CŒUR', brain: 'CERVEAU',
};

let _sig    = null;
let _cells  = {};     // slotKey → { root, charge, hpFill }
let _onAim  = null;
let _mobId  = null;

export function render(container, room, options = {}) {
  const { targetedMobId, targetedSlot, onAimMob } = options;

  const active = (room.mobIds ?? [])
    .map(id => WS.mobs.get(id))
    .filter(m => m?.lifecycle === 'active');

  if (!active.length) {
    _foe.classList.remove('active');
    _sig = null;
    const msg = room.cleared ? 'Salle vidée.' : (room.description ?? '');
    container.innerHTML = msg
      ? `<div class="room-body" style="margin-top:auto"><p class="insp-dim">${msg}</p></div>`
      : '';
    return;
  }

  const mob = active.find(m => m.id === targetedMobId) ?? active[0];
  _onAim = onAimMob;
  _mobId = mob.id;

  _foe.classList.add('active');
  const isInvis = mob.invisible && !AbilitySystem.playerCanSeeInvisible(WS.player.body);
  _foeName.textContent = (mob.isElite ? '★ ' : '') + mob.name + (isInvis ? ' [?]' : '');

  const order = _displayOrder(mob.body);
  const sig   = mob.id + '|' + order.map(k => `${k}:${mob.body.slots[k]?.organId}`).join('|');
  if (sig !== _sig) _rebuild(mob, order, sig);

  // Layer gating: outer alive → mid locked, mid alive → deep locked.
  const outerAlive = _layerAlive(mob.body, 'outer');
  const midAlive   = _layerAlive(mob.body, 'mid');

  let charging = 0, readyName = null;
  for (const slotKey of order) {
    const lock = (ORGAN_SLOTS[slotKey].layer === 'mid' && outerAlive)
              || (ORGAN_SLOTS[slotKey].layer === 'deep' && (outerAlive || midAlive));
    const st = _updateCell(slotKey, mob, lock, targetedMobId === mob.id ? targetedSlot : null, isInvis);
    if (st.ready) readyName = st.name;
    else if (st.charging) charging++;
  }

  const parts = [];
  if (readyName)        parts.push(`<b>⚠ ${readyName} PRÊT</b>`);
  else if (charging)    parts.push(`${charging} organe${charging > 1 ? 's' : ''} en charge`);
  if (isInvis)          parts.push(`<span style="color:var(--whisper);opacity:.8">invisible</span>`);
  if (active.length > 1) parts.push(`<span style="opacity:.6">${active.length} entités</span>`);
  _foeIntent.innerHTML = parts.join(' · ');

  container.innerHTML = '';
}

function _displayOrder(body) {
  const order = [];
  for (const layer of ['outer', 'mid', 'deep']) {
    for (const slotKey of Object.keys(ORGAN_SLOTS)) {
      if (ORGAN_SLOTS[slotKey].layer === layer && body.slots[slotKey]) order.push(slotKey);
    }
  }
  return order;
}

function _layerAlive(body, layer) {
  return Object.keys(ORGAN_SLOTS).some(k => {
    if (ORGAN_SLOTS[k].layer !== layer) return false;
    const s = body.slots[k];
    return s && (s.hp == null || s.hp > 0);
  });
}

function _rebuild(mob, order, sig) {
  _sig   = sig;
  _cells = {};
  _foeSeg.className = 'foe-reactor';
  _foeSeg.innerHTML = '';

  for (const slotKey of order) {
    const root = document.createElement('div');
    root.className = 'fcell';

    const bar = document.createElement('div');
    bar.className = 'fbar';
    const charge = document.createElement('span');
    charge.className = 'fcharge';
    bar.appendChild(charge);
    root.appendChild(bar);

    const name = document.createElement('div');
    name.className = 'fname';
    name.textContent = TYPE_LABEL[ORGAN_SLOTS[slotKey].type] ?? slotKey;
    root.appendChild(name);

    const hp = document.createElement('div');
    hp.className = 'fhp';
    const hpFill = document.createElement('span');
    hp.appendChild(hpFill);
    root.appendChild(hp);

    const _click = () => {
      const c = _cells[slotKey];
      if (!c || c._locked || c._dead) return;
      _onAim?.(_mobId, slotKey);
    };
    root.addEventListener('click', _click);
    root.addEventListener('touchstart', (e) => { e.preventDefault(); _click(); }, { passive: false });

    _cells[slotKey] = { root, charge, hpFill, _locked: false, _dead: false };
    _foeSeg.appendChild(root);
  }
}

function _updateCell(slotKey, mob, locked, targetedSlot, isInvis) {
  const cell = _cells[slotKey];
  const slot = mob.body.slots[slotKey];
  const def  = organResolver(slot?.organId);
  const maxHp = def?.maxHp ?? 1;
  const hp   = slot ? (slot.hp ?? maxHp) : 0;
  const dead = hp <= 0;

  const prog = mob.organProgress?.[slotKey];
  const ratio = prog ? prog.chargedMs / Math.max(1, prog.totalMs) : 0;
  const ready = !!prog?.ready && !dead;
  const charging = !!prog && !ready && !dead;

  cell._locked = locked && !dead;
  cell._dead   = dead;

  cell.root.className = 'fcell'
    + (dead ? ' dead' : '')
    + (locked && !dead ? ' locked' : '')
    + (ready ? ' ready' : '')
    + (slotKey === targetedSlot ? ' targeted' : '');

  // Hide exact organ identity while the mob is invisible to the player.
  cell.charge.style.height = (isInvis || dead) ? '0%' : `${Math.round(ratio * 100)}%`;
  cell.hpFill.style.width  = `${Math.max(0, Math.round((hp / maxHp) * 100))}%`;
  cell.root.title = def ? `${def.name} — ${hp}/${maxHp} PV` : slotKey;

  return { ready, charging, name: TYPE_LABEL[ORGAN_SLOTS[slotKey].type] ?? slotKey };
}
