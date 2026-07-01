// Ambient room effects. For now: water drips — some rooms randomly drip; each
// drop falls in the scene and makes a "ploc" on the sound bar. Rarity is on par
// with the rare scene props (deterministic per room, ~1 in 3).

import { currentRoom } from '../WorldState.js';
import { balance as getBalance } from '../registry.js';
import * as SoundBar from './SoundBar.js';

let _running = false, _last = 0, _timer = 0, _next = 0, _roomKey = null;

const _cfg = () => getBalance().ambient ?? { dripDivisor: 3, dripMatch: 1, dripMinMs: 1600, dripRangeMs: 3600 };

function _hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < String(s).length; i++) { h ^= String(s).charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Deterministic per room, offset from the gore-prop roll so they don't always coincide.
function _dripping(room) { const c = _cfg(); return !!room && _hash('drip_' + room.id) % c.dripDivisor === c.dripMatch; }

export function init() {
  if (_running) return;
  _running = true;
  requestAnimationFrame(_loop);
}

function _loop(ts) {
  const dt = _last ? ts - _last : 16; _last = ts;
  const room = currentRoom();
  const key = room?.id ?? null;
  if (key !== _roomKey) { _roomKey = key; _timer = 0; _next = 800 + Math.random() * 2500; }

  if (_dripping(room)) {
    const c = _cfg();
    _timer += dt;
    if (_timer >= _next) { _spawnDrop(); _next = _timer + c.dripMinMs + Math.random() * c.dripRangeMs; }
  }
  requestAnimationFrame(_loop);
}

function _spawnDrop() {
  const scene = document.querySelector('.scene') ?? document.querySelector('.viewport');
  if (!scene) return;
  const x = 0.18 + Math.random() * 0.64;   // 18–82% across
  const drop = document.createElement('div');
  drop.className = 'water-drop';
  drop.style.left = `${(x * 100).toFixed(1)}%`;
  scene.appendChild(drop);

  const FALL = 720;
  setTimeout(() => {
    drop.remove();
    SoundBar.ping(x, 'ploc', 0.5, 850);     // the little "ploc"
    const splash = document.createElement('div');
    splash.className = 'water-splash';
    splash.style.left = `${(x * 100).toFixed(1)}%`;
    scene.appendChild(splash);
    setTimeout(() => splash.remove(), 520);
  }, FALL);
}
