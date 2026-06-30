import { Organ } from './entities/Organ.js';

// Registry is a module-level singleton populated by loadData().
// All lookups are O(1) Map access.

const _organs  = new Map();
const _biomes  = new Map();
const _rooms   = new Map();
const _relics  = new Map();
const _lore    = new Map();
const _mobs    = new Map();
const _sets    = new Map();

// Colour used for set-less organs/cards. Per-set colours live in sets.json.
const DEFAULT_SET_COLOR = '#8a7a5c';

// Balance/tuning knobs — overwritten by content/balance.json on load. The values
// here are only a pre-load safety fallback; balance.json is the editable source.
const DEFAULT_BALANCE = {
  tierCost:        { common: 1, rare: 2, epic: 4, legendary: 8 },
  tierUnlockFloor: { common: 0, rare: 1, epic: 4, legendary: 8 },
  mob:    { budgetBase: 5, budgetPerFloor: 2, eliteMult: 1.7, eliteChance: 0.04,
            packFloor: 3, extraMobChanceBase: 0.32, extraMobChancePerFloor: 0.05, supportBudgetMult: 0.55 },
};
let _balance = DEFAULT_BALANCE;

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
  const [organs, biomes, rooms, relics, lore, mobs, balance, sets] = await Promise.all([
    _fetchJSON(`${base}/content/organs.json`),
    _fetchJSON(`${base}/content/biomes.json`),
    _fetchJSON(`${base}/content/rooms.json`),
    _fetchJSON(`${base}/content/relics.json`),
    _fetchJSON(`${base}/content/lore.json`),
    _fetchJSON(`${base}/content/mobs.json`),
    _fetchJSON(`${base}/content/balance.json`),
    _fetchJSON(`${base}/content/sets.json`),
  ]);
  // clear before populating to stay idempotent after hot reloads
  _organs.clear(); _biomes.clear(); _rooms.clear();
  _relics.clear(); _lore.clear();   _mobs.clear(); _sets.clear();

  for (const def of organs)  { _validateOrgan(def);  _organs.set(def.id,  new Organ(def)); }
  for (const def of biomes)  { _validateBiome(def);  _biomes.set(def.id,  def); }
  for (const def of rooms)   { _validateRoom(def);   _rooms.set(def.id,   def); }
  for (const def of relics)  { _relics.set(def.id, def); }
  for (const def of lore)    { _lore.set(def.id,   def); }
  for (const def of mobs)    { _mobs.set(def.id,   def); }
  for (const def of (sets ?? [])) { _sets.set(def.id, def); }
  if (balance) _balance = balance;

  _loaded = true;
}

// For test harness: inject data directly without fetch
export function loadDataRaw({ organs = [], biomes = [], rooms = [], relics = [], lore = [], mobs = [], balance = null, sets = [] } = {}) {
  _organs.clear(); _biomes.clear(); _rooms.clear();
  _relics.clear(); _lore.clear();   _mobs.clear(); _sets.clear();

  for (const def of organs)  { _organs.set(def.id,  new Organ(def)); }
  for (const def of biomes)  { _biomes.set(def.id,  def); }
  for (const def of rooms)   { _rooms.set(def.id,   def); }
  for (const def of relics)  { _relics.set(def.id, def); }
  for (const def of lore)    { _lore.set(def.id,   def); }
  for (const def of mobs)    { _mobs.set(def.id,   def); }
  for (const def of sets)    { _sets.set(def.id, def); }
  if (balance) _balance = balance;

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
export function balance()  { return _balance; }

// --- Set / organ colours (cards + mob organ rendering share one colour) ---
export function setDef(id)   { return _sets.get(id) ?? null; }
export function setColor(id) { return _sets.get(id)?.color ?? DEFAULT_SET_COLOR; }
// One colour per organ: explicit organ.color override, else its set's colour.
export function organColor(organId) {
  const o = _organs.get(organId);
  if (!o) return DEFAULT_SET_COLOR;
  return o.color ?? setColor(o.set);
}

export function allOrgans() { return [..._organs.values()]; }
export function allBiomes() { return [..._biomes.values()]; }
export function allRooms()  { return [..._rooms.values()]; }
export function allRelics() { return [..._relics.values()]; }
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
  const req = ['id','name','strateIndex','floorRange','themes','gridSize'];
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
