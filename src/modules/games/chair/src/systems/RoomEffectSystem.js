import { WS, currentRoom, currentFloor } from '../WorldState.js';
import { roomDef as getRoomDef, organResolver } from '../registry.js';
import { ORGAN_SLOTS } from '../entities/Body.js';
import { emit, PRIORITY } from '../TriggerBus.js';
import * as MobGen from './MobGen.js';

// Called each maintenance tick. Applies effects based on the room the player occupies.
export function tick() {
  const room = currentRoom();
  if (!room) return;
  const def = getRoomDef(room.defId);
  const effect = def?.roomEffect;
  if (!effect) return;

  switch (effect) {
    case 'acid_baths':   _acidBaths(room); break;
    case 'pulse_damage': _pulseDamage();   break;
    case 'wind_dmg':     _windDmg();       break;
    case 'nid':          _nid(room);       break;
  }
}

// Estomac / Entrailles: acid corrodes outer layer unless acid_resist
function _acidBaths(room) {
  const body = WS.player.body;
  if (!body) return;
  // immunity: skin or stomach with acid_resist
  for (const slot of Object.values(body.slots)) {
    if (!slot || (slot.hp ?? 1) <= 0) continue;
    const def = organResolver(slot.organId);
    if (def?.abilities?.includes('acid_resist')) return;
  }
  for (const [slotKey, slot] of Object.entries(body.slots)) {
    if (!slot || (slot.hp ?? 1) <= 0) continue;
    if (ORGAN_SLOTS[slotKey]?.layer !== 'outer') continue;
    slot.hp = Math.max(0, (slot.hp ?? 1) - 1);
    emit({ type: 'ORGAN_DAMAGED', source: 'room_acid', target: 'player',
           data: { slotKey, dmg: 1 }, priority: PRIORITY.TICK });
  }
}

// Cœur ventricules: pulse of 2 dmg to random slot every 5 ticks
function _pulseDamage() {
  if (WS.tick % 5 !== 0) return;
  const body = WS.player.body;
  if (!body) return;
  const keys = Object.keys(body.slots).filter(k => body.slots[k] && (body.slots[k].hp ?? 1) > 0);
  if (!keys.length) return;
  const slotKey = keys[Math.floor(Math.random() * keys.length)];
  const slot = body.slots[slotKey];
  slot.hp = Math.max(0, (slot.hp ?? 1) - 2);
  emit({ type: 'ORGAN_DAMAGED', source: 'room_pulse', target: 'player',
         data: { slotKey, dmg: 2 }, priority: PRIORITY.TICK });
}

// Poumons alvéoles: wind deals 1 dmg to a random outer slot per tick (33% chance)
function _windDmg() {
  if (Math.random() > 0.33) return;
  const body = WS.player.body;
  if (!body) return;
  const keys = Object.keys(ORGAN_SLOTS)
    .filter(k => ORGAN_SLOTS[k].layer === 'outer' && body.slots[k] && (body.slots[k].hp ?? 1) > 0);
  if (!keys.length) return;
  const slotKey = keys[Math.floor(Math.random() * keys.length)];
  const slot = body.slots[slotKey];
  slot.hp = Math.max(0, (slot.hp ?? 1) - 1);
  emit({ type: 'ORGAN_DAMAGED', source: 'room_wind', target: 'player',
         data: { slotKey, dmg: 1 }, priority: PRIORITY.TICK });
}

// Nid: spawns 1 mob every 10 ticks, max 3 periodic spawns
function _nid(room) {
  if (room.cleared) return;
  if ((room._nidSpawns ?? 0) >= 3) return;
  if (WS.tick % 10 !== 0) return;
  const floor = currentFloor();
  if (!floor) return;
  MobGen.spawnForRoom(room, floor, WS.player.floorIdx);
  room._nidSpawns = (room._nidSpawns ?? 0) + 1;
}
