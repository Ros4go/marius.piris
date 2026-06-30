import { rng } from '../WorldState.js';
import { biome as getBiome, allRooms } from '../registry.js';
import { weighted, shuffle } from '../rng.js';
import { Floor } from '../entities/Floor.js';
import { Room }  from '../entities/Room.js';

// Layout tunables. Each biome may override any of these via a `gen` block in
// biomes.json; anything omitted falls back to these defaults. Keeping the knobs
// in data lets each strate feel different (tight winding gorge vs. sprawling
// branchy depths) without touching this file.
const DEFAULT_GEN = {
  pathBias:    0.55,   // chance each step heads toward the exit (lower = windier spine)
  branchSeeds: 0.6,    // number of side-branch roots, as a fraction of the spine length
  branchLen:   [1, 3], // each side branch grows this many cells (inclusive range)
};

function _gen(biome) {
  const g = biome.gen ?? {};
  return {
    pathBias:    g.pathBias    ?? DEFAULT_GEN.pathBias,
    branchSeeds: g.branchSeeds ?? DEFAULT_GEN.branchSeeds,
    branchLen:   g.branchLen   ?? DEFAULT_GEN.branchLen,
  };
}

// Generate a complete Floor from a biome definition.
// On boss floors (last floor of biome strate), the exit is replaced by a boss room.
export function generateFloor(biomeId, floorIndex) {
  const biome = getBiome(biomeId);
  if (!biome) throw new Error(`DungeonGen: unknown biome "${biomeId}"`);

  const size  = biome.gridSize;
  const gen   = _gen(biome);
  const floor = new Floor(size, floorIndex, biomeId);

  const ex = Math.floor(size / 2);
  floor.entrance = { x: ex, y: size - 1 };
  floor.exit     = { x: Math.floor(rng() * size), y: 0 };

  // The spine is the critical path entrance → exit; branches are optional
  // dead-end side corridors the player may explore or skip.
  const { cells, visited } = _carvePath(ex, size - 1, floor.exit.x, floor.exit.y, size, gen.pathBias);
  const seedCount = Math.max(1, Math.round(cells.length * gen.branchSeeds));
  const branches  = _addBranches(cells, visited, size, seedCount, gen.branchLen);
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

function _carvePath(sx, sy, ex, ey, size, pathBias) {
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

    const pool = (rng() < pathBias && primary.length) ? primary : all;
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

// Grow optional side branches off the spine. Each seed cell sprouts a short
// corridor that winds into unvisited cells, creating real dead ends the player
// can choose to explore rather than a single straight line of rooms.
function _addBranches(spine, visited, size, seedCount, lenRange) {
  const branches = [];
  const dirs     = [{ dx:0,dy:-1 },{ dx:1,dy:0 },{ dx:0,dy:1 },{ dx:-1,dy:0 }];
  const seeds    = shuffle(rng, spine).slice(0, seedCount);
  const [lmin, lmax] = lenRange;

  for (const seed of seeds) {
    let cx = seed.x, cy = seed.y;
    const len = lmin + Math.floor(rng() * (lmax - lmin + 1));
    for (let step = 0; step < len; step++) {
      const opts = shuffle(rng, dirs)
        .map(d => ({ x: cx + d.dx, y: cy + d.dy }))
        .filter(p => p.x >= 0 && p.y >= 0 && p.x < size && p.y < size && !visited.has(`${p.x},${p.y}`));
      if (!opts.length) break;
      const next = opts[0];
      visited.add(`${next.x},${next.y}`);
      branches.push(next);
      cx = next.x; cy = next.y;
    }
  }
  return branches;
}
