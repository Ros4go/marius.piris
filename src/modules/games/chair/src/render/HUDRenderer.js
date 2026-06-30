// HUD strip + combat log. Diff-based: only writes to DOM when data changed.

import { WS, currentFloor } from '../WorldState.js';

const _elFloor   = document.getElementById('hud-floor');
const _elGold    = document.getElementById('val-gold');
const _elTorches = document.getElementById('val-torches');
const _elLog     = document.getElementById('combat-log');

let _prev = { floor: null, gold: null, torches: null };

function _blocks(n, max, filled, empty) {
  const f = Math.max(0, Math.min(max, Math.round(n)));
  return `<b>${filled.repeat(f)}</b><span class="dim">${empty.repeat(max - f)}</span>`;
}

export function render() {
  const floor     = currentFloor();
  const biomeName = (floor?.biomeId ?? 'gorge').replace(/-/g, ' ').toUpperCase();
  const floorNum  = (WS.player.floorIdx ?? 0) + 1;
  const key       = `${biomeName}/${floorNum}/${WS.tick}`;

  if (_prev.floor !== key) {
    _elFloor.innerHTML = `${biomeName} · ÉTAGE <b>${floorNum}</b> · TICK <b>${WS.tick}</b>`;
    _prev.floor = key;
  }

  const gold = WS.player.gold ?? 0;
  if (_prev.gold !== gold) {
    _elGold.textContent = gold;
    _prev.gold = gold;
  }

  const torches = WS.player.torches ?? 3;
  if (_prev.torches !== torches) {
    _elTorches.innerHTML = _blocks(torches, 5, '▮', '▮');
    _prev.torches = torches;
  }

}

export function addLog(text, cls = '') {
  const line = document.createElement('div');
  line.className = cls ? `log-line ${cls}` : 'log-line';
  line.textContent = text;
  _elLog.appendChild(line);
  while (_elLog.children.length > 30) _elLog.firstChild.remove();
  _elLog.scrollTop = _elLog.scrollHeight;
}
