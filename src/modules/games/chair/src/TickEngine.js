import { WS, currentFloor } from './WorldState.js';
import { emit, flush, PRIORITY } from './TriggerBus.js';
import { generateFloor } from './systems/DungeonGen.js';
import { roomDef as getRoomDef, biome as getBiome } from './registry.js';
import * as HarvestSystem       from './systems/HarvestSystem.js';
import * as GraftSystem         from './systems/GraftSystem.js';
import * as MobGen              from './systems/MobGen.js';
import * as AbilitySystem       from './systems/AbilitySystem.js';
import * as CurseSystem         from './systems/CurseSystem.js';
import * as RoomEffectSystem    from './systems/RoomEffectSystem.js';
import * as RelicSystem         from './systems/RelicSystem.js';
import * as LoreSystem          from './systems/LoreSystem.js';

// SPEC tick costs: GRAFT=5 ticks in dungeon, REMOVE_ORGAN=0 (amputation gratuite), else=1
// relic_suture_noire reduces GRAFT to 3. MOVE without legs costs 2.
function _actionCost(action) {
  if (action.type === 'GRAFT')           return RelicSystem.graftCost();
  if (action.type === 'REMOVE_ORGAN')    return 0;
  if (action.type === 'SACRIFICE_ORGAN') return 0;
  if (action.type === 'MOVE') {
    const legs = WS.player.body?.slots?.['legs'];
    if (!legs || (legs.hp !== null && legs.hp <= 0)) return 2;
  }
  return 1;
}

// Advance exploration ticks after combat ends (called by BattleEngine).
// Must reset WS.phase to 'idle' because _advance leaves it at 'mob_turn'.
export function advanceTicks(n) {
  if (n > 0) _advance(n);
  WS.phase = 'idle';
}

// Drive one full turn. Returns { ok: bool, reason?: string }.
export function processTick(action) {
  if (WS.phase !== 'idle') return { ok: false, reason: 'busy' };
  if (WS.battle?.active) return { ok: false, reason: 'in_combat' };

  WS.phase = 'player_turn';
  const result = _resolveAction(action);
  if (!result.ok) { WS.phase = 'idle'; return result; }
  flush(PRIORITY.ACTION);

  const cost = _actionCost(action);
  _advance(cost);

  WS.save.dirty = true;
  WS.phase = 'idle';
  return { ok: true };
}

// Generate a new floor and move the player to its entrance.
export function descend(biomeId, floorIndex) {
  const floor = generateFloor(biomeId, floorIndex);
  WS.floors[floorIndex] = floor;
  WS.player.floorIdx    = floorIndex;
  WS.player.pos         = { ...floor.entrance };
  WS.player.dir         = 'N';

  const { x: ex, y: ey } = floor.entrance;
  const startRoom = floor.cell(ex, ey);
  if (startRoom) {
    floor.reveal(ex, ey);
    startRoom.markVisited();
    for (const n of floor.neighbors(ex, ey)) floor.reveal(n.x, n.y);
  }

  _scheduleTorchBurn();
}

// Flush all events whose atTick <= upToTick
function _flushEvents(upToTick) {
  while (WS.tickEvents.length && WS.tickEvents[0].atTick <= upToTick) {
    WS.tickEvents.shift().fn();
  }
}

// Advance time by n ticks; each tick runs mob attacks + maintenance
function _advance(n) {
  WS.phase = 'mob_turn';
  for (let i = 0; i < n; i++) {
    WS.tick++;
    flush(PRIORITY.MOB);

    WS.phase = 'maintenance';
    if (WS.tick % 10 === 0) _tickInfected();
    RelicSystem.tick();
    CurseSystem.tick();
    RoomEffectSystem.tick();
    _flushEvents(WS.tick);
    flush(PRIORITY.TICK);
    WS.phase = 'mob_turn';
  }
}

// --- Phase A ---

function _resolveAction(action) {
  switch (action.type) {
    case 'MOVE':
      return _movePlayer(action.direction);
    case 'HARVEST':
      return HarvestSystem.harvest(action.cadaverId, action.slotKey);
    case 'GRAFT':
      return GraftSystem.graft(action.inventoryIndex, action.slotKey);
    case 'REMOVE_ORGAN':
      return GraftSystem.removeOrgan(action.slotKey);
    case 'SACRIFICE_ORGAN':
      return GraftSystem.sacrificeOrgan(action.slotKey);
    case 'TURN':
      if (['N', 'E', 'S', 'W'].includes(action.direction)) {
        WS.player.dir = action.direction;
        return { ok: true };
      }
      return { ok: false, reason: 'bad_direction' };
    case 'WAIT':
      return { ok: true };
    default:
      return { ok: false, reason: `unknown_action:${action.type}` };
  }
}

function _movePlayer(dir) {
  const floor = currentFloor();
  if (!floor) return { ok: false, reason: 'no_floor' };

  const deltas = { N:{dx:0,dy:-1}, E:{dx:1,dy:0}, S:{dx:0,dy:1}, W:{dx:-1,dy:0} };
  const delta = deltas[dir];
  if (!delta) return { ok: false, reason: 'bad_direction' };

  const { x, y } = WS.player.pos;
  const nx = x + delta.dx;
  const ny = y + delta.dy;
  const target = floor.cell(nx, ny);
  if (!target) return { ok: false, reason: 'no_room' };

  WS.player.pos = { x: nx, y: ny };
  floor.reveal(nx, ny);
  target.markVisited();

  // Lore: first room entry
  LoreSystem.checkOnMove();

  // Rest room lore
  const rDef = getRoomDef(target.defId);
  if (rDef?.family === 'safe') LoreSystem.checkRestFound();

  // Always reveal adjacent rooms ("deviné" — player senses nearby corridors)
  for (const n of floor.neighbors(nx, ny)) {
    floor.reveal(n.x, n.y);
  }

  // Echolocate: bat ears reveal 2-step radius (neighbors of neighbors)
  if (AbilitySystem.playerHasEcholocate(WS.player.body)) {
    for (const n of floor.neighbors(nx, ny)) {
      for (const n2 of floor.neighbors(n.x, n.y)) {
        floor.reveal(n2.x, n2.y);
      }
    }
  }

  // Lazy mob spawn: combat/boss/grave rooms on first entry
  if (target.isHostile() && !target.cleared && target.mobIds.length === 0) {
    if (rDef?.spawns?.graveyard) {
      MobGen.spawnGraveyardMob(target, WS.player.floorIdx);
    } else if (rDef?.spawns?.boss) {
      const biomeDef = getBiome(floor.biomeId);
      if (biomeDef?.bossId) MobGen.spawnBoss(biomeDef.bossId, target, WS.player.floorIdx);
    } else {
      MobGen.spawnForRoom(target, floor, WS.player.floorIdx);
    }
    // Intent telegraphs are computed by BattleEngine once combat starts.
  }

  return { ok: true };
}

// --- Infection (organs infected by La Flore boss lose 1 HP every 10 ticks) ---

function _tickInfected() {
  const body = WS.player.body;
  if (!body) return;
  for (const [slotKey, slot] of Object.entries(body.slots)) {
    if (!slot?.infected || (slot.hp ?? 1) <= 0) continue;
    slot.hp = Math.max(0, (slot.hp ?? 1) - 1);
    emit({ type: 'ORGAN_DAMAGED', source: 'infection', target: 'player',
           data: { slotKey, dmg: 1 }, priority: PRIORITY.TICK });
  }
}

// --- Torch timer ---

function _scheduleTorchBurn() {
  const interval = 40;
  const nextTick = WS.tick + interval;
  WS.tickEvents = WS.tickEvents.filter(e => e._isTorch !== true);

  const event = { atTick: nextTick, _isTorch: true, fn: _burnTorch };
  WS.tickEvents.push(event);
  WS.tickEvents.sort((a, b) => a.atTick - b.atTick);
}

function _burnTorch() {
  if (WS.player.torches > 0) {
    WS.player.torches--;
  }
  WS.light.current = WS.player.torches > 0 ? 1.0 : 0.0;
  _scheduleTorchBurn();
}
