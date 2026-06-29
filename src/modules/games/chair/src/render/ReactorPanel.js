// "Ton corps" — a humanoid silhouette with the organs placed anatomically inside
// it. Each organ is a node showing its HP at a glance (a colored ring + number),
// clickable to inspect it. The nodes double as the self-cast drop targets during
// combat (they carry data-organ / data-self; dead organs are rejected).
//
// Built once per body-layout; later renders update HP/state in place so a click
// survives the ~10×/s combat re-render.

import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { SLOT_SHORT as NAME } from '../labels.js';

const BODY_SLOTS = ['brain', 'eye_l', 'eye_r', 'ear_l', 'ear_r', 'tongue', 'heart', 'stomach', 'skin', 'arm_l', 'arm_r', 'legs'];

// position (x%, y%) inside the body container, tuned to the silhouette drawn below
const POS = {
  eye_l: [24, 9], brain: [50, 8], eye_r: [76, 9],
  ear_l: [24, 19], tongue: [50, 19], ear_r: [76, 19],
  arm_l: [13, 42], heart: [36, 42], stomach: [64, 42], arm_r: [87, 42],
  skin: [50, 60], legs: [50, 84],
};

let _el = null, _onInspect = null, _sig = null, _nodes = {};

export function init(el, { onInspect } = {}) {
  _el = el ?? document.getElementById('reactor');
  _onInspect = onInspect;
}

export function render() {
  if (!_el) return;
  const body = WS.player.body;
  if (!body) { _el.innerHTML = ''; _sig = null; return; }

  const sig = BODY_SLOTS.map((k) => body.slots[k]?.organId ?? '∅').join('|');
  if (sig !== _sig) _rebuild(body, sig);
  for (const k of BODY_SLOTS) _update(k, body);
}

function _rebuild(body, sig) {
  _sig = sig;
  _nodes = {};
  // a fixed-aspect frame keeps the silhouette from stretching with the panel
  const map = document.createElement('div');
  map.className = 'bodymap';
  map.innerHTML = _silhouette();
  const layer = document.createElement('div');
  layer.className = 'bodymap-nodes';
  for (const k of BODY_SLOTS) layer.appendChild(_buildNode(k));
  map.appendChild(layer);
  _el.innerHTML = '';
  _el.appendChild(map);
}

// A smooth filled humanoid silhouette (head + tapered torso, arms out then down,
// two legs), with a fleshy vertical gradient and a soft rim.
function _silhouette() {
  return `<svg class="sil" viewBox="0 0 100 132" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs>
      <linearGradient id="silg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#3c211b"/>
        <stop offset="1" stop-color="#170c09"/>
      </linearGradient>
    </defs>
    <g fill="url(#silg)" stroke="#4d281f" stroke-width="0.9" stroke-linejoin="round">
      <ellipse cx="50" cy="12" rx="10" ry="11"/>
      <path d="M50,22 C43,22 38,24 36,30 C33,31 30,33 28,39
        C25,47 23,57 22,67 C21,71 20,74 24,74 C27,74 28,70 30,64
        C32,57 34,52 37,48 C37,58 36,68 35,77 C34,90 33,104 34,122
        C34,126 40,126 41,122 C43,106 45,93 47,86 C49,84 51,84 53,86
        C55,93 57,106 59,122 C60,126 66,126 66,122 C67,104 66,90 65,77
        C64,68 63,58 63,48 C66,52 68,57 70,64 C72,70 73,74 76,74
        C80,74 79,71 78,67 C77,57 75,47 72,39 C70,33 67,31 64,30
        C62,24 57,22 50,22 Z"/>
    </g>
  </svg>`;
}

function _buildNode(slotKey) {
  const [x, y] = POS[slotKey] ?? [50, 50];
  const node = document.createElement('button');
  node.className = 'organ-node';
  node.style.left = `${x}%`;
  node.style.top = `${y}%`;
  node.dataset.self = '1';
  node.innerHTML = '<span class="on-bead"><b class="on-hp"></b></span><span class="on-name"></span>';
  node.addEventListener('click', () => _onInspect?.(slotKey));
  node._hp   = node.querySelector('.on-hp');
  node._name = node.querySelector('.on-name');
  _nodes[slotKey] = node;
  return node;
}

// HP color comes from the active biome palette (set on .game[data-biome]) so the
// body map always matches the scene — bright torch = healthy, blood = critical.
function _hpVar(r) {
  if (r <= 0)    return 'var(--bone-dark)';
  if (r > 0.66)  return 'var(--torch-hot)';
  if (r > 0.33)  return 'var(--torch)';
  return 'var(--blood)';
}

function _update(slotKey, body) {
  const node = _nodes[slotKey];
  if (!node) return;
  const slot = body.slots[slotKey];

  const label = NAME[slotKey] ?? slotKey;
  node.title = label;
  node._name.textContent = label;

  if (!slot?.organId) {
    node.className = 'organ-node empty';
    delete node.dataset.organ;
    node.style.removeProperty('--hpcol');
    node._hp.textContent = '';
    return;
  }

  node.dataset.organ = slotKey;   // → self-cast drop target in combat
  const def   = organResolver(slot.organId);
  const maxHp = def?.maxHp ?? 1;
  const hp    = slot.hp ?? maxHp;
  const r     = Math.max(0, Math.min(1, hp / maxHp));
  const dead  = hp <= 0;

  node.className = 'organ-node'
    + (dead ? ' dead' : '')
    + (slotKey === 'heart' ? ' vital' : '')
    + (!dead && r < 1 ? ' hurt' : '');
  node.style.setProperty('--hpcol', _hpVar(r));
  node._hp.textContent = `${Math.max(0, hp)}/${maxHp}`;
}
