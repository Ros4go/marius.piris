// First-person room view. Reads WS + floor geometry — never writes.

import { WS, currentFloor, currentRoom } from '../WorldState.js';

const _app   = document.querySelector('.game');
const _end   = document.getElementById('scene-end');
const _wl    = document.getElementById('scene-wl');
const _wr    = document.getElementById('scene-wr');
const _exitL = document.getElementById('exit-l');
const _exitR = document.getElementById('exit-r');
const _exitF = document.getElementById('exit-f');
const _exitB = document.getElementById('exit-b');
const _pit   = document.getElementById('floor-pit');
const _gore  = document.getElementById('gore');

function _hash(s) {
  let h = 0;
  for (let i = 0; i < (s?.length ?? 0); i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

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
  const hasBack  = !!floor.cell(x - fwd.dx,   y - fwd.dy);

  // Walls stay solid; passages are shown as explicit glowing archways instead.
  _wl.style.opacity = '1';
  _wr.style.opacity = '1';
  _exitL?.classList.toggle('open', hasLeft);
  _exitR?.classList.toggle('open', hasRight);
  _exitF?.classList.toggle('open', hasFwd);
  // a passage behind you (you can step back) → warm light spilling from the bottom
  _exitB?.classList.toggle('open', hasBack);
  // the descent room → an irradiating pit in the floor
  _pit?.classList.toggle('open', room.defId === 'exit');

  // Gore is rare and ONLY on La Gorge: ~1 room in 3 gets a single prop
  // (hanging guts / spike / bone pile / skeleton / blood splatter), chosen
  // deterministically from the room id so a room always looks the same.
  if (_gore) {
    let prop = 'none';
    if (floor.biomeId === 'gorge') {
      const h = _hash(room.id);
      if (h % 3 === 0) {
        const PROPS = ['guts', 'spike', 'bones', 'skeleton', 'splatter'];
        prop = PROPS[Math.floor(h / 3) % PROPS.length];
      }
      _gore.style.setProperty('--gore-x', `${(h % 7) - 3}px`);
      // keep the corpse OFF the doorways: hug a doorless side, else sit on the floor centre
      _gore.style.setProperty('--gore-left', !hasLeft ? '5%' : !hasRight ? '66%' : '36%');
    }
    _gore.dataset.prop = prop;
  }

  // Back wall stays a plain textured wall; the forward door is the exit-f overlay.
  // (No red combat tint here — it read as a glowing path, not a wall.)
  _end.style.opacity = '1';
  _end.style.filter = '';
}

function _rotate(dir, step) {
  return DIR_ORDER[(DIR_ORDER.indexOf(dir) + step + 4) % 4];
}
