import { WS, inventoryCapacity } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';

let _counter = 0;

// Graft an organ from the player's inventory into a body slot.
// Returns the displaced organ (if any) back into inventory with a fresh id.
export function graft(inventoryIndex, slotKey) {
  const inventory = WS.player.inventory;
  if (inventoryIndex < 0 || inventoryIndex >= inventory.length) {
    return { ok: false, reason: 'bad_index' };
  }

  const { id: itemId, organId, hp } = inventory[inventoryIndex];
  const body = WS.player.body;

  if (!body.canFitOrgan(slotKey, organId, organResolver)) {
    return { ok: false, reason: 'type_mismatch' };
  }

  // Remove from inventory first (splice before setOrgan to preserve correct indices)
  inventory.splice(inventoryIndex, 1);

  // Install organ; get displaced organ back
  const displaced = body.setOrgan(slotKey, organId, hp);

  if (displaced) {
    const dispOrganDef = organResolver(displaced.organId);
    const dispHp       = displaced.hp ?? (dispOrganDef?.maxHp ?? 0);
    const dispQuality  = dispOrganDef ? dispOrganDef.getQuality(dispHp).name : 'intact';
    const dispId       = `inv_${WS.tick}_${++_counter}`;
    inventory.push({ id: dispId, organId: displaced.organId, hp: dispHp, quality: dispQuality });
  }

  emit({
    type:     'ORGAN_GRAFTED',
    source:   'player',
    target:   slotKey,
    data:     { organId, hp, itemId, displaced: displaced?.organId ?? null },
    priority: PRIORITY.ACTION,
  });

  return { ok: true, organId, slotKey, displaced: displaced?.organId ?? null };
}

// Remove an organ from a slot and put it into inventory.
export function removeOrgan(slotKey) {
  const body       = WS.player.body;
  const displaced  = body.removeOrgan(slotKey);
  if (!displaced) return { ok: false, reason: 'slot_empty' };

  if (WS.player.inventory.length >= inventoryCapacity()) {
    return { ok: false, reason: 'besace pleine' };
  }

  const organDef  = organResolver(displaced.organId);
  const hp        = displaced.hp ?? (organDef?.maxHp ?? 0);
  const quality   = organDef ? organDef.getQuality(hp).name : 'intact';
  const id        = `inv_${WS.tick}_${++_counter}`;
  WS.player.inventory.push({ id, organId: displaced.organId, hp, quality });

  emit({
    type:     'ORGAN_REMOVED',
    source:   'player',
    target:   slotKey,
    data:     { organId: displaced.organId, hp, id },
    priority: PRIORITY.ACTION,
  });

  return { ok: true, organId: displaced.organId, hp, id };
}
