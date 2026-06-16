// Reactor panel (FTL-inspired) — the HEART is the reactor on the left (it makes
// the blood), and the other organs are laid out as an anatomical body map so you
// can locate them at a glance. Each organ shows a vertical segmented BLOOD bar
// (click to allocate), its NAME, and an HP bar.
//
// Blood is a persistent pool (WS.player.bloodAlloc) editable in AND out of combat.
// During combat each organ also shows its charge fill + a "ready" glow.
//
// Built once per body-layout; later renders update in place so clicks survive
// the ~10×/s combat re-render (a teardown would drop the click mid-press).

import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import * as Blood from '../BattleEngine.js';

// Non-heart organs, positioned via CSS grid-areas (see hud.css .rbody).
const BODY_SLOTS = ['brain', 'eye_l', 'eye_r', 'ear_l', 'ear_r', 'tongue', 'arm_l', 'arm_r', 'skin', 'stomach', 'legs'];

const NAME = {
  brain: 'Cerveau', eye_l: 'Œil G', eye_r: 'Œil D',
  ear_l: 'Oreille G', ear_r: 'Oreille D', tongue: 'Langue',
  arm_l: 'Bras G', arm_r: 'Bras D', skin: 'Peau',
  stomach: 'Estomac', legs: 'Jambes', heart: 'Cœur',
};

const AREA = {
  brain: 'brain', eye_l: 'eyeL', eye_r: 'eyeR', ear_l: 'earL', ear_r: 'earR',
  tongue: 'tong', arm_l: 'armL', arm_r: 'armR', skin: 'skin', stomach: 'stom', legs: 'legs',
};

let _el        = null;
let _heart      = null;  // { root, pool, hpFill, name }
let _cells      = {};    // slotKey → { root, segs[], charge, hpFill, name }
let _sig        = null;
let _onAlloc    = null;  // (slotKey, amount)
let _onInspect  = null;  // (slotKey)

export function init(el, { onAlloc, onInspect } = {}) {
  _el        = el ?? document.getElementById('reactor');
  _onAlloc   = onAlloc;
  _onInspect = onInspect;
}

export function render() {
  if (!_el) return;
  const body = WS.player.body;
  if (!body) { _el.innerHTML = ''; _sig = null; return; }

  const sig = ['heart', ...BODY_SLOTS].map(k => body.slots[k]?.organId ?? '∅').join('|');
  if (sig !== _sig) _rebuild(body, sig);

  _updateHeart(body);
  for (const k of BODY_SLOTS) _updateCell(k, body);
}

function _rebuild(body, sig) {
  _sig   = sig;
  _cells = {};
  _el.innerHTML = '';

  _el.appendChild(_buildHeart(body));

  const grid = document.createElement('div');
  grid.className = 'rbody';
  for (const slotKey of BODY_SLOTS) grid.appendChild(_buildCell(slotKey, body));
  _el.appendChild(grid);
}

// ── Heart reactor (left) ───────────────────────────────────────────────────────

function _buildHeart(body) {
  const root = document.createElement('div');
  root.className = 'rheart';

  const icon = document.createElement('button');
  icon.className = 'rheart-icon';
  icon.textContent = '♥';
  icon.title = 'Cœur — produit le sang';
  icon.addEventListener('click', () => _onInspect?.('heart'));
  root.appendChild(icon);

  const pool = document.createElement('div');   // vertical pip stack (the pool)
  pool.className = 'rpool-v';
  root.appendChild(pool);

  const name = document.createElement('div');
  name.className = 'rname';
  name.textContent = 'Cœur';
  root.appendChild(name);

  const hp = document.createElement('div');
  hp.className = 'rhp';
  const hpFill = document.createElement('span');
  hp.appendChild(hpFill);
  root.appendChild(hp);

  _heart = { root, pool, hpFill, icon };
  return root;
}

function _updateHeart(body) {
  if (!_heart) return;
  const pool  = Blood.bloodPool();
  const spent = Blood.bloodSpent();
  const free  = pool - spent;

  // The heart holds the FREE blood: pips fill from the bottom with what's still
  // in the heart, and drain as blood is dispatched to organs (empty = all spent).
  _heart.pool.innerHTML = Array.from({ length: pool }, (_, i) =>
    `<span class="rpip${i < free ? ' on' : ''}"></span>`).join('')
    + `<span class="rpool-free${free <= 0 ? ' empty' : ''}">${free}</span>`;

  const slot  = body.slots['heart'];
  const def   = slot ? organResolver(slot.organId) : null;
  const maxHp = def?.maxHp ?? 1;
  const hp    = slot ? (slot.hp ?? maxHp) : 0;
  _heart.root.classList.toggle('dead', hp <= 0 || !slot);
  _heart.hpFill.style.width = `${Math.max(0, Math.round((hp / maxHp) * 100))}%`;
}

// ── Organ cells (anatomical body map) ──────────────────────────────────────────

function _buildCell(slotKey, body) {
  const root = document.createElement('div');
  root.className = 'rcell';
  root.style.gridArea = AREA[slotKey];

  const slot = body.slots[slotKey];
  const max  = Blood.organMaxBlood(slotKey);

  const bar = document.createElement('div');
  bar.className = 'rbar';
  const segs = [];
  if (slot && max > 0) {
    const charge = document.createElement('span');
    charge.className = 'rcharge';
    bar.appendChild(charge);
    root._charge = charge;

    for (let lvl = max; lvl >= 1; lvl--) {
      const seg = document.createElement('span');
      seg.className = 'rseg';
      seg.dataset.lvl = lvl;
      const _set = () => {
        const cur = WS.player.bloodAlloc?.[slotKey] ?? 0;
        _onAlloc?.(slotKey, cur >= lvl ? lvl - 1 : lvl);
      };
      seg.addEventListener('click', _set);
      seg.addEventListener('touchstart', (e) => { e.preventDefault(); _set(); }, { passive: false });
      bar.appendChild(seg);
      segs.push(seg);
    }
  } else {
    bar.classList.add('nobar');
  }
  root.appendChild(bar);

  const name = document.createElement('button');
  name.className = 'rname';
  name.textContent = NAME[slotKey] ?? slotKey;
  if (slot) name.addEventListener('click', () => _onInspect?.(slotKey));
  else      name.disabled = true;
  root.appendChild(name);

  const hp = document.createElement('div');
  hp.className = 'rhp';
  const hpFill = document.createElement('span');
  hp.appendChild(hpFill);
  root.appendChild(hp);
  root._hpFill = hpFill;

  _cells[slotKey] = { root, segs };
  return root;
}

function _updateCell(slotKey, body) {
  const cell = _cells[slotKey];
  if (!cell) return;
  const { root, segs } = cell;

  const slot = body.slots[slotKey];
  if (!slot) {
    root.className = 'rcell empty';
    root.style.gridArea = AREA[slotKey];
    if (root._hpFill) root._hpFill.style.width = '0%';
    return;
  }

  const def   = organResolver(slot.organId);
  const maxHp = def?.maxHp ?? 1;
  const hp    = slot.hp ?? maxHp;
  const dead  = hp <= 0;
  const mut   = def?.visual?.dot === 'mut';
  const hurt  = !dead && hp < maxHp;

  root.className = 'rcell' + (dead ? ' dead' : '') + (mut ? ' mut' : '') + (hurt ? ' hurt' : '');
  root.style.gridArea = AREA[slotKey];

  const alloc = WS.player.bloodAlloc?.[slotKey] ?? 0;
  segs.forEach((seg) => seg.classList.toggle('on', alloc >= (+seg.dataset.lvl) && !dead));

  if (root._charge) {
    const prog = WS.battle?.active ? WS.battle.organProgress?.[slotKey] : null;
    const pct  = prog ? Math.min(100, Math.round((prog.chargedMs / Math.max(1, prog.totalMs)) * 100)) : 0;
    root._charge.style.height = `${pct}%`;
    root.classList.toggle('ready', !!prog?.ready);
    root.classList.toggle('charging', !!prog && !prog.ready);
  }

  if (root._hpFill) root._hpFill.style.width = `${Math.max(0, Math.round((hp / maxHp) * 100))}%`;
}
