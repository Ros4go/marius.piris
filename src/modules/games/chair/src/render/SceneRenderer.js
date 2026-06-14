// First-person room view. Reads WS + floor geometry — never writes.

import { WS, currentFloor, currentRoom } from '../WorldState.js';

const _app   = document.querySelector('.game');
const _end   = document.getElementById('scene-end');
const _wl    = document.getElementById('scene-wl');
const _wr    = document.getElementById('scene-wr');

const DIR_ORDER = ['N', 'E', 'S', 'W'];
const DIR_DELTA = { N:{dx:0,dy:-1}, E:{dx:1,dy:0}, S:{dx:0,dy:1}, W:{dx:-1,dy:0} };

export function render() {
  const floor = currentFloor();
  const room  = currentRoom();

  if (floor?.biomeId) _app.dataset.biome = floor.biomeId;
  if (!floor || !room) return;

  const { x, y } = WS.player.pos;
  const dir   = WS.player.dir ?? 'S';
  const fwd   = DIR_DELTA[dir];
  const left  = DIR_DELTA[_rotate(dir, -1)];
  const right = DIR_DELTA[_rotate(dir, +1)];

  const hasFwd   = !!floor.cell(x + fwd.dx,   y + fwd.dy);
  const hasLeft  = !!floor.cell(x + left.dx,  y + left.dy);
  const hasRight = !!floor.cell(x + right.dx, y + right.dy);

  // Side walls: fully visible when no passage, dimmed when passage exists
  _wl.style.opacity = hasLeft  ? '0.18' : '1';
  _wr.style.opacity = hasRight ? '0.18' : '1';

  // Back wall: door arch when forward passage exists
  _end.classList.toggle('has-door', hasFwd);
  _end.style.opacity = '1';

  // Combat rooms: red tint on back wall
  _end.style.filter = room.family === 'combat' && !room.cleared
    ? 'brightness(0.65) saturate(1.5)'
    : '';
}

function _rotate(dir, step) {
  return DIR_ORDER[(DIR_ORDER.indexOf(dir) + step + 4) % 4];
}
