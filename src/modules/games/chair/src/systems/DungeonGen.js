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
// Le PEUPLEMENT est 100% data (biomes.json "salles") :
//   salles.poids  — { roomId: poids } : le pool pondéré des salles normales
//   salles.regles — [{ salle, position?, etage?, min?, max?, chance? }]
//     position : entree | sortie | impasse (bout de branche) | chemin (colonne
//                vertébrale) — entree/sortie PLACENT la salle ; pour min/max/
//                chance, position restreint la zone (défaut : partout)
//     etage    : premier | dernier | numéro absolu — filtre la règle
//                (deux règles "sortie" : la plus spécifique gagne, ex. boss au
//                dernier étage remplace la sortie normale)
//     min/max  : nombre garanti / plafonné par étage · chance : proba d'UNE
//                apparition par étage
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

  const table  = biome.salles ?? {};
  const poids  = table.poids ?? {};
  const regles = table.regles ?? [];
  const defOf  = (id) => allRooms().find((d) => d.id === id) ?? null;
  const matchEtage = (r) => r.etage == null
    || (r.etage === 'dernier' && floorIndex === biome.floorRange[1] - 1)
    || (r.etage === 'premier' && floorIndex === biome.floorRange[0] - 1)
    || (typeof r.etage === 'number' && floorIndex === r.etage);
  // entrée / sortie : parmi les règles qui matchent l'étage, la plus SPÉCIFIQUE
  // (étage défini) gagne — c'est ainsi que le boss remplace la sortie au dernier.
  const pick = (position) => {
    const c = regles.filter((r) => r.position === position && matchEtage(r) && defOf(r.salle));
    c.sort((a, b) => (b.etage != null) - (a.etage != null));
    return c.length ? defOf(c[0].salle) : null;
  };
  const entranceDef = pick('entree');
  const exitDef     = pick('sortie');

  const eligibleDefs = Object.entries(poids)
    .map(([id, w]) => ({ weight: w, def: defOf(id) }))
    .filter((e) => e.weight > 0 && e.def);

  for (const cell of allCells) {
    const isEntrance = cell.x === floor.entrance.x && cell.y === floor.entrance.y;
    const isExit     = cell.x === floor.exit.x     && cell.y === floor.exit.y;

    let def;
    if (isEntrance) def = entranceDef;
    else if (isExit) def = exitDef;
    else if (eligibleDefs.length) def = weighted(rng, eligibleDefs)?.def;

    if (!def) continue;
    floor.setCell(cell.x, cell.y, new Room(def, `r_${cell.x}_${cell.y}`));
  }

  // ── règles de quantité (min / max / chance), zone optionnelle ──
  const spine = new Set(cells.map((c) => `${c.x},${c.y}`));
  const isFixed = (c) => (c.x === floor.entrance.x && c.y === floor.entrance.y)
                      || (c.x === floor.exit.x && c.y === floor.exit.y);
  const normal = allCells.filter((c) => !isFixed(c) && floor.cell(c.x, c.y));
  const zoneDe = (position) =>
    position === 'impasse' ? normal.filter((c) => !spine.has(`${c.x},${c.y}`))
    : position === 'chemin' ? normal.filter((c) => spine.has(`${c.x},${c.y}`))
    : normal;
  const place = (cell, def) => floor.setCell(cell.x, cell.y, new Room(def, `r_${cell.x}_${cell.y}`));

  for (const r of regles) {
    if (r.position === 'entree' || (r.position === 'sortie' && r.min == null && r.max == null && r.chance == null)) continue;
    if (!matchEtage(r)) continue;
    const def = defOf(r.salle);
    if (!def) continue;
    const zone = zoneDe(r.position);
    const compte = () => normal.filter((c) => floor.cell(c.x, c.y)?.defId === def.id).length;

    if (r.chance != null && compte() === 0 && zone.length && rng() < r.chance) {
      place(zone[Math.floor(rng() * zone.length)], def);
    }
    if (r.min != null) {
      const libres = zone.filter((c) => floor.cell(c.x, c.y)?.defId !== def.id);
      while (compte() < r.min && libres.length) {
        place(libres.splice(Math.floor(rng() * libres.length), 1)[0], def);
      }
    }
    if (r.max != null && compte() > r.max) {
      const pool = eligibleDefs.filter((e) => e.def.id !== def.id);
      const extra = normal.filter((c) => floor.cell(c.x, c.y)?.defId === def.id).slice(r.max);
      for (const c of extra) {
        const alt = pool.length ? weighted(rng, pool)?.def : null;
        if (alt) place(c, alt);
      }
    }
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
