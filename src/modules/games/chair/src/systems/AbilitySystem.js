import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';

// Returns true if any equipped arm has pierce_layer (ARM reduction = 0 on attack).
export function playerHasPierceLayer(body) {
  for (const key of ['arm_l', 'arm_r']) {
    const slot = body.slots[key];
    if (!slot) continue;
    const def = organResolver(slot.organId);
    if (def?.abilities?.includes('pierce_layer')) return true;
  }
  return false;
}

// Returns true if any equipped ear has echolocate (reveals neighbors on move).
export function playerHasEcholocate(body) {
  for (const key of ['ear_l', 'ear_r']) {
    const slot = body.slots[key];
    if (!slot) continue;
    const def = organResolver(slot.organId);
    if (def?.abilities?.includes('echolocate')) return true;
  }
  return false;
}

// Returns true if any equipped eye has see_invisible.
export function playerCanSeeInvisible(body) {
  for (const key of ['eye_l', 'eye_r']) {
    const slot = body.slots[key];
    if (!slot) continue;
    const def = organResolver(slot.organId);
    if (def?.abilities?.includes('see_invisible')) return true;
  }
  return false;
}

// Called when player body.isAlive() returns false.
// Returns true if death was prevented (heart ability triggered).
export function checkHeartAbility(body) {
  if (WS.player.usedHeartAbility) return false;

  const heart = body.slots['heart'];
  if (!heart) return false;
  const def = organResolver(heart.organId);
  if (!def) return false;

  if (def.abilities?.includes('lich_revive')) {
    // Revive: restore all organs to 50% max HP
    for (const slot of Object.values(body.slots)) {
      if (!slot) continue;
      const oDef = organResolver(slot.organId);
      if (oDef) slot.hp = Math.ceil(oDef.maxHp * 0.5);
    }
    WS.player.usedHeartAbility = true;
    emit({ type: 'LICH_REVIVE', source: 'ability', target: 'player',
           data: {}, priority: PRIORITY.MOB });
    return true;
  }

  if (def.abilities?.includes('heart_ultimate')) {
    // Last stand: survive at 1 HP on the heart slot
    body.setSlotHp('heart', 1);
    WS.player.usedHeartAbility = true;
    emit({ type: 'HEART_ULTIMATE', source: 'ability', target: 'player',
           data: {}, priority: PRIORITY.MOB });
    return true;
  }

  return false;
}
