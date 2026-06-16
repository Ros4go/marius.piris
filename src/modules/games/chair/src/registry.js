import { Organ } from './entities/Organ.js';

// Registry is a module-level singleton populated by loadData().
// All lookups are O(1) Map access.

const _organs  = new Map();
const _biomes  = new Map();
const _rooms   = new Map();
const _relics  = new Map();
const _lore    = new Map();
const _mobs    = new Map();

let _loaded = false;
let _loadPromise = null;

// --- Loaders ---

async function _fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Registry: failed to fetch ${url} (${r.status})`);
  return r.json();
}

// basePath: e.g. '/src/modules/games/chair'
export function loadData(basePath = '') {
  if (_loaded) return Promise.resolve();
  if (_loadPromise) return _loadPromise;
  const base = basePath.replace(/\/$/, '');
  _loadPromise = _doLoad(base).finally(() => { _loadPromise = null; });
  return _loadPromise;
}

async function _doLoad(base) {
  const [organs, biomes, rooms, relics, lore, mobs] = await Promise.all([
    _fetchJSON(`${base}/content/organs.json`),
    _fetchJSON(`${base}/content/biomes.json`),
    _fetchJSON(`${base}/content/rooms.json`),
    _fetchJSON(`${base}/content/relics.json`),
    _fetchJSON(`${base}/content/lore.json`),
    _fetchJSON(`${base}/content/mobs.json`),
  ]);
  // clear before populating to stay idempotent after hot reloads
  _organs.clear(); _biomes.clear(); _rooms.clear();
  _relics.clear(); _lore.clear();   _mobs.clear();

  for (const def of organs)  { _validateOrgan(def);  _organs.set(def.id,  new Organ(def)); }
  for (const def of biomes)  { _validateBiome(def);  _biomes.set(def.id,  def); }
  for (const def of rooms)   { _validateRoom(def);   _rooms.set(def.id,   def); }
  for (const def of relics)  { _relics.set(def.id, def); }
  for (const def of lore)    { _lore.set(def.id,   def); }
  for (const def of mobs)    { _mobs.set(def.id,   def); }

  _loaded = true;
}

// For test harness: inject data directly without fetch
export function loadDataRaw({ organs = [], biomes = [], rooms = [], relics = [], lore = [], mobs = [] } = {}) {
  _organs.clear(); _biomes.clear(); _rooms.clear();
  _relics.clear(); _lore.clear();   _mobs.clear();

  for (const def of organs)  { _organs.set(def.id,  new Organ(def)); }
  for (const def of biomes)  { _biomes.set(def.id,  def); }
  for (const def of rooms)   { _rooms.set(def.id,   def); }
  for (const def of relics)  { _relics.set(def.id, def); }
  for (const def of lore)    { _lore.set(def.id,   def); }
  for (const def of mobs)    { _mobs.set(def.id,   def); }

  _loaded = true;
}

export function isLoaded() { return _loaded; }

// --- Accessors ---

export function organ(id)  { return _organs.get(id)  ?? null; }
export function biome(id)  { return _biomes.get(id)  ?? null; }
export function roomDef(id){ return _rooms.get(id)   ?? null; }
export function relic(id)  { return _relics.get(id)  ?? null; }
export function loreEntry(id){ return _lore.get(id)  ?? null; }
export function mob(id)    { return _mobs.get(id)    ?? null; }

export function allOrgans() { return [..._organs.values()]; }
export function allBiomes() { return [..._biomes.values()]; }
export function allRooms()  { return [..._rooms.values()]; }
export function loreAll()   { return [..._lore.values()]; }

// Convenience resolver: organId → Organ instance.
export function organResolver(id) { return organ(id); }

// --- Validators (throw on missing required fields) ---

function _validateOrgan(def) {
  const req = ['id','type','name','tier','hp','layer','price'];
  for (const f of req) {
    if (def[f] === undefined) throw new Error(`Organ "${def.id}" missing field: ${f}`);
  }
}

function _validateBiome(def) {
  const req = ['id','name','strateIndex','floorRange','arcanaCap','themes','gridSize'];
  for (const f of req) {
    if (def[f] === undefined) throw new Error(`Biome "${def.id}" missing field: ${f}`);
  }
}

function _validateRoom(def) {
  const req = ['id','family','ui','weight'];
  for (const f of req) {
    if (def[f] === undefined) throw new Error(`Room "${def.id}" missing field: ${f}`);
  }
}
