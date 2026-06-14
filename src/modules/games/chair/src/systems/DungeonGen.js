import { rng } from '../WorldState.js';
import { biome as getBiome, allRooms } from '../registry.js';
import { weighted, shuffle } from '../rng.js';
import { Floor } from '../entities/Floor.js';
import { Room }  from '../entities/Room.js';

// Generate a complete Floor from a biome definition.
// On boss floors (last floor of biome strate), the exit is replaced by a boss room.
export function generateFloor(biomeId, floorIndex) {
  const biome = getBiome(biomeId);
  if (!biome) throw new Error(`DungeonGen: unknown biome "${biomeId}"`);

  const size  = biome.gridSize;
  const floor = new Floor(size, floorIndex, biomeId);

  const ex = Math.floor(size / 2);
  floor.entrance = { x: ex, y: size - 1 };
  floor.exit     = { x: Math.floor(rng() * size), y: 0 };

  const { cells, visited } = _carvePath(ex, size - 1, floor.exit.x, floor.exit.y, size);
  const branches  = _addBranches(cells, visited, size, Math.floor(size * 0.7));
  const allCells  = [...cells, ...branches];

  const eligibleDefs = allRooms()
    .filter(d => d.weight > 0 && (!d.biomeOnly || d.biomeOnly === biomeId))
    .map(d => ({ weight: d.weight, def: d }));

  const entranceDef = allRooms().find(d => d.id === 'entrance');
  const exitDef     = allRooms().find(d => d.id === 'exit');

  // Boss floor: last floor of this biome's range gets a boss room at the exit
  const isBossFloor = !!biome.bossId && floorIndex === biome.floorRange[1] - 1;
  const bossDef     = isBossFloor ? allRooms().find(d => d.id === 'boss') : null;

  for (const cell of allCells) {
    const isEntrance = cell.x === floor.entrance.x && cell.y === floor.entrance.y;
    const isExit     = cell.x === floor.exit.x     && cell.y === floor.exit.y;

    let def;
    if (isEntrance) def = entranceDef;
    else if (isExit) def = bossDef ?? exitDef;
    else if (eligibleDefs.length) def = weighted(rng, eligibleDefs)?.def;

    if (!def) continue;
    floor.setCell(cell.x, cell.y, new Room(def, `r_${cell.x}_${cell.y}`));
  }

  return floor;
}

// --- Path carving ---

function _carvePath(sx, sy, ex, ey, size) {
  const visited = new Set();
  const cells   = [];
  let cx = sx, cy = sy;

  visited.add(`${cx},${cy}`);
  cells.push({ x: cx, y: cy });

  const maxIter = size * size * 4;
  for (let i = 0; i < maxIter && !(cx === ex && cy === ey); i++) {
    const dx = Math.sign(ex - cx);
    const dy = Math.sign(ey - cy);

    const primary = [];
    if (dx !== 0) primary.push({ x: cx + dx, y: cy });
    if (dy !== 0) primary.push({ x: cx, y: cy + dy });

    const all = [
      { x: cx, y: cy - 1 }, { x: cx + 1, y: cy },
      { x: cx, y: cy + 1 }, { x: cx - 1, y: cy },
    ];

    const pool = (rng() < 0.65 && primary.length) ? primary : all;
    const valid = pool.filter(p =>
      p.x >= 0 && p.y >= 0 && p.x < size && p.y < size && !visited.has(`${p.x},${p.y}`)
    );
    const fallback = all.filter(p =>
      p.x >= 0 && p.y >= 0 && p.x < size && p.y < size && !visited.has(`${p.x},${p.y}`)
    );

    const chosen = valid.length ? valid : fallback;
    if (!chosen.length) break;

    const next = chosen[Math.floor(rng() * chosen.length)];
    visited.add(`${next.x},${next.y}`);
    cells.push(next);
    cx = next.x; cy = next.y;
  }

  if (cx !== ex || cy !== ey) {
    while (cx !== ex) {
      cx += Math.sign(ex - cx);
      const k = `${cx},${cy}`;
      if (!visited.has(k)) { visited.add(k); cells.push({ x: cx, y: cy }); }
    }
    while (cy !== ey) {
      cy += Math.sign(ey - cy);
      const k = `${cx},${cy}`;
      if (!visited.has(k)) { visited.add(k); cells.push({ x: cx, y: cy }); }
    }
  }

  return { cells, visited };
}

function _addBranches(path, visited, size, maxCount) {
  const branches = [];
  const dirs     = [{ dx:0,dy:-1 },{ dx:1,dy:0 },{ dx:0,dy:1 },{ dx:-1,dy:0 }];
  const pathCopy = shuffle(rng, path);

  for (const cell of pathCopy) {
    if (branches.length >= maxCount) break;
    for (const d of shuffle(rng, dirs)) {
      const nx = cell.x + d.dx;
      const ny = cell.y + d.dy;
      const k  = `${nx},${ny}`;
      if (nx >= 0 && ny >= 0 && nx < size && ny < size && !visited.has(k)) {
        visited.add(k);
        branches.push({ x: nx, y: ny });
        break;
      }
    }
  }
  return branches;
}
