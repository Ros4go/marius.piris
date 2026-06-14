// CSS-grid minimap. Replaces canvas approach.
// Classes per cell: .p (player), .e (enemy), .q (hostile unvisited), .r/.r.v (revealed), .x (exit)
// Classes are mutually exclusive (proto semantics): player > enemy > hostile > visited > revealed

import { WS, currentFloor } from '../WorldState.js';
import { organResolver } from '../registry.js';

const _grid    = document.getElementById('minimap-grid');
const _compass = document.getElementById('compass-dir');

const DIR_ARROW = { N: 'N ▴', E: 'E ►', S: 'S ▾', W: 'W ◄' };

export function render() {
  const floor = currentFloor();
  if (!floor) { _grid.innerHTML = ''; return; }

  const sz = floor.size;
  _grid.style.gridTemplateColumns = `repeat(${sz}, 1fr)`;
  _grid.style.gridTemplateRows    = `repeat(${sz}, 1fr)`;

  // Track enemy positions for fast lookup
  const enemyPos = new Set();
  for (const mob of WS.mobs.values()) {
    if (mob.lifecycle !== 'active') continue;
    if (mob.pos.floorIdx !== WS.player.floorIdx) continue;
    enemyPos.add(`${mob.pos.x},${mob.pos.y}`);
  }

  const { x: px, y: py } = WS.player.pos;

  _grid.innerHTML = '';
  for (let y = 0; y < sz; y++) {
    for (let x = 0; x < sz; x++) {
      const cell = document.createElement('div');
      cell.className = 'mc';

      if (x === px && y === py) {
        // Player cell: BRT glow (noise radius) — higher brt = bigger orange halo
        const brt = Math.max(0, WS.player.body?.statsWith(organResolver)?.brt ?? 0);
        if (brt > 0) {
          const px_ = Math.min(40, brt * 5);
          cell.style.boxShadow = `0 0 ${px_}px ${Math.ceil(px_ * 0.4)}px rgba(196,127,51,${Math.min(0.45, 0.1 + brt * 0.025)})`;
        }
        // .p wins visually (avoids .r.v specificity conflict)
        cell.classList.add('p', WS.player.dir ?? 'S');
      } else {
        const revealed = floor.isRevealed(x, y);
        const room     = floor.cell(x, y);

        if (revealed && room) {
          const hasEnemy  = enemyPos.has(`${x},${y}`);
          const isHostile = !room.visited && !room.cleared && room.isHostile();

          if (hasEnemy) {
            cell.classList.add('e');
          } else if (isHostile) {
            cell.classList.add('q');
          } else {
            cell.classList.add('r');
            if (room.visited) cell.classList.add('v');
          }
          if (room.defId === 'exit') cell.classList.add('x');
        }
      }

      _grid.appendChild(cell);
    }
  }

  if (_compass) _compass.textContent = DIR_ARROW[WS.player.dir ?? 'S'];
}
