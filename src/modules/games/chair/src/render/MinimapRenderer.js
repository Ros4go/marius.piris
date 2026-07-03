// CSS-grid minimap, driven LIVE by the map/memoire/detection tags (TDD §2.5) —
// no persistent "revealed" set: what you see is what your brain senses NOW.
//   map absent → LOCKED: the grid is there but greyed, you can't even place self.
//   map-1 → player + current room only (no memory).
//   map-2 → + door-adjacent rooms.       map-3 → + predict dist ≤2.
//   map-4 → + predict dist ≤3.           memoire → + visited rooms.
//   ouie-detection-N → enemy rooms flagged RED (see _detectRange), and at 4/5
//   unpredicted rooms are drawn as red DOTTED outlines (5 works even locked).
// Cell classes: .p player · .e enemy(red) · .q hostile · .r/.r.v shown/visited ·
//               .g greyed(locked) · .dq red-dotted (detection ghost) · .x exit

import { WS, currentFloor } from '../WorldState.js';
import * as Faculties from '../systems/Faculties.js';

const _grid    = document.getElementById('minimap-grid');
const _compass = document.getElementById('compass-dir');

const DIR_ARROW = { N: 'N ▴', E: 'E ►', S: 'S ▾', W: 'W ◄' };

// BFS distances from (px,py) through doors, up to maxDist.
function _distances(floor, px, py, maxDist) {
  const dist = new Map([[`${px},${py}`, 0]]);
  let ring = [{ x: px, y: py }];
  for (let d = 1; d <= maxDist; d++) {
    const next = [];
    for (const c of ring) for (const n of floor.neighbors(c.x, c.y)) {
      const k = `${n.x},${n.y}`;
      if (!dist.has(k)) { dist.set(k, d); next.push(n); }
    }
    ring = next;
  }
  return dist;
}

// How far detection reaches, given the detection tier and the map state.
// d1..d3 need the map to PREDICT that far; d4 needs the map merely unlocked;
// d5 works even on a locked map. Reach is capped at 3 (TDD §2.3).
function _detectRange(dLevel, mapLevel, predictRange) {
  if (dLevel >= 5) return 3;
  if (dLevel >= 4) return mapLevel >= 1 ? 3 : 0;
  let r = 0;
  for (let n = 1; n <= Math.min(dLevel, 3); n++) if (predictRange >= n) r = n;
  return r;
}

export function render() {
  const floor = currentFloor();
  if (!floor) { _grid.innerHTML = ''; return; }

  const sz = floor.size;
  _grid.style.gridTemplateColumns = `repeat(${sz}, 1fr)`;
  _grid.style.gridTemplateRows    = `repeat(${sz}, 1fr)`;

  const mapLevel = Faculties.mapLevel();
  const memoire  = Faculties.remembers();
  const dLevel   = Faculties.detectionLevel();
  const locked   = mapLevel < 1;
  _grid.classList.toggle('map-locked', locked);

  const { x: px, y: py } = WS.player.pos;
  const dist = _distances(floor, px, py, 3);

  // What the map itself shows: dist ≤ senseRange (0=current only), by level.
  const senseRange = mapLevel >= 4 ? 3 : mapLevel >= 3 ? 2 : mapLevel >= 2 ? 1 : mapLevel >= 1 ? 0 : -1;
  const detectReach = _detectRange(dLevel, mapLevel, Faculties.mapPredictRange());

  // Enemy positions
  const enemyPos = new Set();
  for (const mob of WS.mobs.values()) {
    if (mob.lifecycle !== 'active') continue;
    if (mob.pos?.floorIdx !== WS.player.floorIdx) continue;
    enemyPos.add(`${mob.pos.x},${mob.pos.y}`);
  }

  _grid.innerHTML = '';
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const cell = document.createElement('div');
      cell.className = 'mc';
      const room = floor.cell(x, y);
      const k = `${x},${y}`;
      const d = dist.get(k);

      const isPlayer = !locked && x === px && y === py;
      const shown = !locked && room &&
        ((d != null && d <= senseRange) || (memoire && room.visited));
      const detected = room && enemyPos.has(k) && d != null && d <= detectReach && detectReach > 0;

      if (isPlayer) {
        cell.classList.add('p', WS.player.dir ?? 'S');
      } else if (detected) {
        cell.classList.add('e');                    // enemy heard → RED
        if (!shown) cell.classList.add('dq');       // unpredicted → dotted ghost
      } else if (shown) {
        // Content is NOT revealed by the map (nobody grants it — §2.5); a shown
        // room is just a shape. Only your memory of a VISITED room adds detail.
        cell.classList.add('r');
        if (room.visited) cell.classList.add('v');
        if (room.defId === 'exit' && room.visited) cell.classList.add('x');
      } else if (room) {
        cell.classList.add('g');                    // greyed: there but unsensed
      }
      _grid.appendChild(cell);
    }
  }

  if (_compass) _compass.textContent = locked ? '?' : DIR_ARROW[WS.player.dir ?? 'S'];
}
