import { WS, currentFloor, currentRoom } from './WorldState.js';
import { emit, flush, PRIORITY } from './TriggerBus.js';
import { generateFloor } from './systems/DungeonGen.js';
import { roomDef as getRoomDef, biome as getBiome, organResolver } from './registry.js';
import * as CombatSystem        from './systems/CombatSystem.js';
import * as HarvestSystem       from './systems/HarvestSystem.js';
import * as GraftSystem         from './systems/GraftSystem.js';
import * as MobGen              from './systems/MobGen.js';
import * as HungerSystem        from './systems/HungerSystem.js';
import * as AbilitySystem       from './systems/AbilitySystem.js';
import * as HallucinationSystem from './systems/HallucinationSystem.js';
import * as RoomEffectSystem    from './systems/RoomEffectSystem.js';
import * as RelicSystem         from './systems/RelicSystem.js';
import * as LoreSystem          from './systems/LoreSystem.js';

// SPEC tick costs: GRAFT=5 ticks in dungeon, REMOVE_ORGAN=0 (amputation gratuite), else=1
// relic_suture_noire reduces GRAFT to 3. MOVE without legs costs 2.
function _actionCost(action) {
  if (action.type === 'GRAFT')        return RelicSystem.graftCost();
  if (action.type === 'REMOVE_ORGAN') return 0;
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
    _mobPhase();
    flush(PRIORITY.MOB);

    WS.phase = 'maintenance';
    HungerSystem.tick();       // also calls RelicSystem.tick() + CurseSystem.tick()
    HallucinationSystem.tick();
    RoomEffectSystem.tick();
    _flushEvents(WS.tick);
    flush(PRIORITY.TICK);
    WS.phase = 'mob_turn';
  }
}

// --- Phase A ---

function _resolveAction(action) {
  WS.player.lastActionType = action.type;   // stored for boss patterns + telegraph
  switch (action.type) {
    case 'ATTACK':
      return CombatSystem.playerAttack(action.mobId, action.slotKey ?? null);
    case 'MOVE':
      return _movePlayer(action.direction);
    case 'HARVEST':
      return HarvestSystem.harvest(action.cadaverId, action.slotKey);
    case 'GRAFT':
      return GraftSystem.graft(action.inventoryIndex, action.slotKey);
    case 'REMOVE_ORGAN':
      return GraftSystem.removeOrgan(action.slotKey);
    case 'TURN':
      if (['N', 'E', 'S', 'W'].includes(action.direction)) {
        WS.player.dir = action.direction;
        return { ok: true };
      }
      return { ok: false, reason: 'bad_direction' };
    case 'EAT':
      return _eatOrgan(action.inventoryIndex, action.targetSlotKey ?? null);
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
    // Show intent immediately on entry so player can plan
    for (const mobId of target.mobIds) {
      const mob = WS.mobs.get(mobId);
      if (mob?.lifecycle === 'active') _setMobIntent(mob);
    }
  }

  return { ok: true };
}

// --- Phase B ---

function _mobPhase() {
  const room = currentRoom();
  if (!room) return;

  for (const mobId of [...room.mobIds]) {
    const mob = WS.mobs.get(mobId);
    if (!mob || mob.lifecycle !== 'active') continue;
    CombatSystem.mobAttack(mobId);
    // Set telegraph intent after attacking, if mob is still alive
    if (WS.mobs.get(mobId)?.lifecycle === 'active') {
      _setMobIntent(mob);
    }
  }
}

// Set the mob's intent (displayed as telegraph for the player's next turn)
function _setMobIntent(mob) {
  if (!mob || mob.lifecycle !== 'active') return;
  if (mob.isBoss && mob.pattern === 'read_ahead') {
    const last = WS.player.lastActionType;
    if (last === 'WAIT')        mob.intent = 'Charge · tu te reposes';
    else if (last === 'ATTACK') mob.intent = 'Contre-frappe prévue';
    else if (last === 'MOVE')   mob.intent = 'Repositionnement';
    else                        mob.intent = 'Guette';
  } else if (!mob.isBoss) {
    switch (mob.behavior) {
      case 'charger':  mob.intent = 'Charge · dmg×1.5 · imparable'; break;
      case 'fleer':    mob.intent = 'Fuit · frappe légère'; break;
      case 'ranged':   mob.intent = 'Vise profond · couches internes'; break;
      case 'ambusher': mob.intent = mob.ambushUsed ? 'Frappe · 1 tick' : 'Embuscade · premier coup×2'; break;
      case 'swarm':    mob.intent = 'Nuée · 2 frappes légères'; break;
      default:         mob.intent = 'Frappe · 1 tick'; break;
    }
  } else {
    mob.intent = 'Frappe · 1 tick';
  }

  // Broadcast telegraph so La Ligne can display it
  emit({ type: 'MOB_TELEGRAPH', source: mob.id, target: 'player',
         data: { intent: mob.intent, mobId: mob.id }, priority: PRIORITY.MOB });
}

// --- Eat organ ---

const _SAT_GAIN = { parfait: 30, intact: 25, 'abîmé': 18, cuit: 10, pourri: 4 };

// Eat in combat: bypasses tick guard. Both satiété and HP transfer fire together.
export function eatInCombat(idx, targetSlotKey) {
  const result = _eatOrgan(idx, targetSlotKey);
  if (result.ok) flush(PRIORITY.ACTION);
  return result;
}

function _eatOrgan(idx, targetSlotKey) {
  const item = WS.player.inventory[idx];
  if (!item) return { ok: false, reason: 'no_item' };

  const def = organResolver(item.organId);
  if (!def) return { ok: false, reason: 'unknown_organ' };

  const quality    = def.getQuality(item.hp);
  const satGain    = _SAT_GAIN[quality.name] ?? 15;
  const hpTransfer = item.hp ?? def.maxHp;

  WS.player.inventory.splice(idx, 1);
  WS.player.satiete = Math.min(100, (WS.player.satiete ?? 0) + satGain);

  const body = WS.player.body;
  let hpTarget = null;

  if (targetSlotKey) {
    // HP transfer to player-chosen organ slot
    const tSlot = body.slots[targetSlotKey];
    const tDef  = tSlot ? organResolver(tSlot.organId) : null;
    if (tSlot && tDef && (tSlot.hp === null || tSlot.hp > 0)) {
      tSlot.hp = Math.min(tDef.maxHp, (tSlot.hp ?? tDef.maxHp) + hpTransfer);
      hpTarget = targetSlotKey;
    }
  } else {
    // Fallback: repair worst living organ +1 HP
    let worstSlot = null, worstRatio = 1.0;
    for (const [slotKey, slot] of Object.entries(body.slots)) {
      if (!slot || (slot.hp ?? 1) <= 0) continue;
      const sdef = organResolver(slot.organId);
      if (!sdef) continue;
      const ratio = (slot.hp ?? sdef.maxHp) / sdef.maxHp;
      if (ratio < worstRatio) { worstRatio = ratio; worstSlot = slotKey; }
    }
    if (worstSlot && worstRatio < 1.0) {
      const slot = body.slots[worstSlot];
      const sdef = organResolver(slot.organId);
      slot.hp = Math.min(sdef.maxHp, (slot.hp ?? sdef.maxHp) + 1);
      hpTarget = worstSlot;
    }
  }

  emit({ type: 'ORGAN_EATEN', source: 'player', target: 'player',
         data: { organId: item.organId, satGain, quality: quality.name,
                 hpTransfer, hpTarget }, priority: PRIORITY.ACTION });
  return { ok: true };
}

// --- Torch timer ---

function _scheduleTorchBurn() {
  // Frissons: torches burn every 25 ticks instead of 40
  const interval = WS.humeur === 'frissons' ? 25 : 40;
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
