import { WS, currentRoom, rng, inventoryCapacity } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';

let _counter = 0;

// Harvest ONE organ from a cadaver. SPEC: un seul organe récoltable par cadavre.
// Marks cadaver as 'harvested' immediately after the first successful harvest.
export function harvest(cadaverId, slotKey) {
  const cadaver = WS.cadavers.get(cadaverId);
  if (!cadaver) return { ok: false, reason: 'no_cadaver' };
  if (cadaver.lifecycle === 'harvested' || cadaver.lifecycle === 'gone') {
    return { ok: false, reason: 'already_gone' };
  }

  const room = currentRoom();
  if (!room) return { ok: false, reason: 'no_room' };
  const cadaverRoom = _getCadaverRoom(cadaver);
  if (cadaverRoom !== room) return { ok: false, reason: 'not_in_room' };

  const slot = cadaver.body.slots[slotKey];
  if (!slot) return { ok: false, reason: 'empty_slot' };

  const organDef = organResolver(slot.organId);
  if (!organDef) return { ok: false, reason: 'unknown_organ' };

  if (WS.player.inventory.length >= inventoryCapacity()) {
    return { ok: false, reason: 'besace pleine' };
  }

  const currentHp = slot.hp ?? organDef.maxHp;

  // Remove organ from cadaver
  cadaver.body.removeOrgan(slotKey);

  // SPEC: mark harvested after the first organ taken (1 organ per cadaver)
  cadaver.lifecycle = 'harvested';

  const quality = organDef.getQuality(currentHp).name;
  const id = `inv_${WS.tick}_${++_counter}`;
  WS.player.inventory.push({ id, organId: slot.organId, hp: currentHp, quality });

  emit({
    type:     'ORGAN_HARVESTED',
    source:   'player',
    target:   cadaverId,
    data:     { organId: slot.organId, hp: currentHp, slotKey, quality, invId: id },
    priority: PRIORITY.ACTION,
  });

  return { ok: true, organId: slot.organId, hp: currentHp, quality, id };
}

// Convenience: cadavers present in the player's current room, harvestable
export function cadaversInRoom() {
  const room = currentRoom();
  if (!room) return [];
  return [...WS.cadavers.values()].filter(c =>
    (c.lifecycle === 'fresh' || c.lifecycle === 'decaying') && _getCadaverRoom(c) === room
  );
}

function _getCadaverRoom(cadaver) {
  const floor = WS.floors[cadaver.pos?.floorIdx];
  if (!floor) return null;
  return floor.cell(cadaver.pos.x, cadaver.pos.y);
}
