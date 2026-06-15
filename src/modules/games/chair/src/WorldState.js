import { mulberry32 } from './rng.js';
import { deepCopy }    from './utils.js';
import { Body }        from './entities/Body.js';
import { Floor }       from './entities/Floor.js';
import { Room }        from './entities/Room.js';
import { organResolver } from './registry.js';

// --- WorldState singleton ---
// All systems read and write this object directly.
// No system imports another system — only WorldState.

export const WS = {
  // Meta
  seed:      0,
  humeur:    'balanced',  // run humeur / difficulty modifier
  tick:      0,
  phase:     'idle',      // 'idle' | 'player_turn' | 'mob_turn' | 'maintenance'
  runId:     null,        // uuid-ish string for save slot disambiguation

  // Player
  player: {
    body:           null,
    pos:            { x: 0, y: 0 },
    floorIdx:       0,
    gold:           0,
    satiete:        50,
    torches:        3,
    inventory:      [],
    relics:         [],
    statusIds:      [],
    lastAction:      null,
    lastActionType:  null,
    biomePath:       null,
    runStats:        { kills: 0, harvests: 0, floorReached: 0 },
    usedHeartAbility: false,
  },

  // Scheduled tick events (sorted by atTick ascending)
  tickEvents: [],       // { atTick, fn }[]

  // World
  floors:    [],         // Floor instances indexed by floorIdx
  mobs:      new Map(),  // mobId → MobInstance (managed by MobGen/MobAI)
  cadavers:  new Map(),  // cadaverId → CadaverInstance
  lootPiles: new Map(),  // pileId → [{ organId, hp }]

  // Subsystem state (owned by their respective systems, read-only to others)
  light: {
    current: 1.0,      // 0.0–1.0
    sources: [],
  },
  ligne: {
    events: [],        // { tick, channel, text, once, id }
  },
  triggerBus: {
    queue:  [],        // pending TriggerEvent[]
    budget: 0,         // events processed this flush
  },
  combat: {
    active:      false,
    roundMobs:   [],   // mobIds queued for this round
    log:         [],   // { tick, type, actor, target, dmg, organ }
  },
  battle: {
    active:         false,
    bloodPool:      0,      // total blood available (derived from RYT at combat start)
    bloodAlloc:     {},     // slotKey → blood allocated to that organ
    organProgress:  {},     // slotKey → { chargedMs, totalMs, ready }
    buffDodge:      0,      // mob attacks to dodge (consumed on use)
    buffAbsorb:     0,      // flat damage absorbed on next mob hit
    aimedSlot:      null,   // next player skill targets this slot (cleared after use)
    targetSlotKey:  null,   // player's skill aim on the enemy
    explCost:       0,      // exploration ticks to consume when combat ends
    _lastTs:        null,   // last rAF timestamp for delta-time
  },
  save: {
    lastCheckpoint: null,   // ISO timestamp
    dirty: false,
  },
};

// --- RNG accessor ---
// Systems must call rng() — never Math.random().
// _rng is the mulberry32 closure; its internal state is saved/restored for checkpoints.
let _rng = null;
export function rng() {
  if (!_rng) throw new Error('WorldState: RNG not initialized (call initRun first)');
  return _rng();
}
export function _rngState() { return _rng ? _rng.getState() : 0; }

// --- Init ---

const HUMEURS = ['fievre', 'frissons', 'bile_montante', 'rigor_mortis', 'insomnie'];

export function initRun(seed, humeur = null) {
  WS.seed   = seed >>> 0;
  WS.tick   = 0;
  WS.phase  = 'idle';
  _rng = mulberry32(WS.seed);
  WS.humeur = humeur ?? HUMEURS[Math.floor(_rng() * HUMEURS.length)];
  WS.runId  = `${WS.seed}_${Date.now()}`;

  WS.player = {
    body:           Body.human('player'),
    pos:            { x: 0, y: 0 },
    dir:            'S',
    floorIdx:       0,
    gold:           0,
    satiete:        50,
    torches:        3,
    inventory:      [],
    relics:         [],
    statusIds:      [],
    lastAction:       null,
    lastActionType:   null,
    biomePath:        null,
    runStats:         { kills: 0, harvests: 0, floorReached: 0 },
    usedHeartAbility: false,
  };
  WS.tickEvents = [];
  // Resolve slot HPs from registry now that registry is loaded
  _resolveBodyHps(WS.player.body);

  WS.floors     = [];
  WS.mobs       = new Map();
  WS.cadavers   = new Map();
  WS.lootPiles  = new Map();
  WS.light      = { current: 1.0, sources: [] };
  WS.ligne      = { events: [] };
  WS.triggerBus = { queue: [], budget: 0 };
  WS.combat     = { active: false, roundMobs: [], log: [] };
  WS.battle     = { active: false, bloodPool: 0, bloodAlloc: {}, organProgress: {}, buffDodge: 0, buffAbsorb: 0, aimedSlot: null, targetSlotKey: null, explCost: 0, _lastTs: null };
  WS.save       = { lastCheckpoint: null, dirty: false };
}

function _resolveBodyHps(body) {
  for (const key of Object.keys(body.slots)) {
    const slot = body.slots[key];
    if (slot && slot.hp === null) {
      const organ = organResolver(slot.organId);
      if (organ) slot.hp = organ.maxHp;
    }
  }
}

// --- Current floor accessor ---

export function currentFloor() {
  return WS.floors[WS.player.floorIdx] ?? null;
}

export function currentRoom() {
  const floor = currentFloor();
  if (!floor) return null;
  return floor.cell(WS.player.pos.x, WS.player.pos.y);
}

// Besace capacity: 2 base + 2 per living arm. Min 2, max 6.
export function inventoryCapacity() {
  const slots = WS.player.body?.slots;
  const armOk = key => { const s = slots?.[key]; return s && (s.hp === null || s.hp > 0); };
  return 2 + (armOk('arm_l') ? 2 : 0) + (armOk('arm_r') ? 2 : 0);
}

// --- Serialization ---

// Schedule a callback to fire when WS.tick reaches atTick.
// Imported by systems to avoid circular deps with TickEngine.
export function scheduleAt(atTick, fn) {
  WS.tickEvents.push({ atTick, fn });
  WS.tickEvents.sort((a, b) => a.atTick - b.atTick);
}

export function toJSON() {
  return {
    seed:     WS.seed,
    humeur:   WS.humeur,
    tick:     WS.tick,
    runId:    WS.runId,
    rngState: _rngState(),
    player: {
      body:           WS.player.body.toJSON(),
      pos:            { ...WS.player.pos },
      dir:            WS.player.dir ?? 'S',
      floorIdx:       WS.player.floorIdx,
      gold:           WS.player.gold,
      satiete:        WS.player.satiete,
      torches:        WS.player.torches,
      inventory:      deepCopy(WS.player.inventory),
      relics:         [...(WS.player.relics ?? [])],
      statusIds:      [...WS.player.statusIds],
      lastActionType:   WS.player.lastActionType,
      biomePath:        WS.player.biomePath,
      runStats:         { ...WS.player.runStats },
      usedHeartAbility: WS.player.usedHeartAbility ?? false,
    },
    floors:    WS.floors.map(f => f.toJSON()),
    mobs:      [...WS.mobs.entries()].map(([id, m]) => ({ id, mob: m })),
    cadavers:  [...WS.cadavers.entries()].map(([id, c]) => ({ id, cad: c })),
    lootPiles: [...WS.lootPiles.entries()].map(([id, p]) => ({ id, pile: p })),
    ligne:     { events: deepCopy(WS.ligne.events) },
    combat:    deepCopy(WS.combat),
  };
}

export function fromJSON(data) {
  WS.seed     = data.seed;
  WS.humeur   = data.humeur;
  WS.tick     = data.tick;
  WS.runId    = data.runId;
  WS.phase    = 'idle';

  _rng = mulberry32(WS.seed);
  // Restore exact RNG state from the checkpoint (saved in toJSON as rngState).
  // This is correct and O(1) — no need to replay ticks.
  if (data.rngState !== undefined) _rng.setState(data.rngState);

  WS.player = {
    body:           Body.fromJSON(data.player.body),
    pos:            { ...data.player.pos },
    dir:            data.player.dir ?? 'S',
    floorIdx:       data.player.floorIdx,
    gold:           data.player.gold,
    satiete:        data.player.satiete ?? 50,
    torches:        data.player.torches ?? 3,
    inventory:      deepCopy(data.player.inventory),
    relics:         [...(data.player.relics ?? [])],
    statusIds:      [...data.player.statusIds],
    lastAction:       null,
    lastActionType:   data.player.lastActionType ?? null,
    biomePath:        data.player.biomePath ?? null,
    runStats:         data.player.runStats ?? { kills: 0, harvests: 0, floorReached: 0 },
    usedHeartAbility: data.player.usedHeartAbility ?? false,
  };
  WS.tickEvents = [];

  WS.floors = data.floors.map(f => Floor.fromJSON(f, Room));

  WS.mobs      = new Map(data.mobs.map(({ id, mob }) => [id, mob]));
  WS.cadavers  = new Map(data.cadavers.map(({ id, cad }) => [id, cad]));
  WS.lootPiles = new Map(data.lootPiles.map(({ id, pile }) => [id, pile]));

  WS.ligne      = { events: deepCopy(data.ligne.events) };
  WS.combat     = deepCopy(data.combat);
  WS.triggerBus = { queue: [], budget: 0 };
  WS.light      = { current: 1.0, sources: [] };
  WS.battle     = { active: false, bloodPool: 0, bloodAlloc: {}, organProgress: {}, buffDodge: 0, buffAbsorb: 0, aimedSlot: null, targetSlotKey: null, explCost: 0, _lastTs: null };
  WS.save       = { lastCheckpoint: null, dirty: false };
}
