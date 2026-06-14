import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { on as onTrigger, emit, PRIORITY } from '../TriggerBus.js';

// Fires organ.triggers[] on matching TriggerBus events.
// Supported on-events: "onKill", "onDamageReceived"
// Supported do-effects: "purge_infection", "life_steal"

export function init() {
  onTrigger('MOB_DIED', (e) => {
    if (e.source !== 'combat') return;
    _fireOrganTriggers('onKill');
  });

  onTrigger('ORGAN_DAMAGED', (e) => {
    if (e.target !== 'player') return;
    _fireOrganTriggers('onDamageReceived');
  });
}

function _fireOrganTriggers(eventName) {
  const body = WS.player.body;
  if (!body) return;
  for (const slot of Object.values(body.slots)) {
    if (!slot || (slot.hp ?? 1) <= 0) continue;
    const def = organResolver(slot.organId);
    if (!def?.triggers?.length) continue;
    for (const trigger of def.triggers) {
      if (trigger.on === eventName) _executeEffect(trigger.do);
    }
  }
}

function _executeEffect(effect) {
  const body = WS.player.body;
  switch (effect) {
    case 'purge_infection': {
      let purged = 0;
      for (const slot of Object.values(body.slots)) {
        if (slot?.infected) { slot.infected = false; purged++; }
      }
      if (purged > 0) {
        emit({ type: 'INFECTION_PURGED', source: 'organ_trigger', target: 'player',
               data: { purged }, priority: PRIORITY.MOB });
      }
      break;
    }
    case 'life_steal': {
      let worst = null, worstRatio = 1.0;
      for (const [slotKey, slot] of Object.entries(body.slots)) {
        if (!slot || (slot.hp ?? 1) <= 0) continue;
        const def = organResolver(slot.organId);
        if (!def) continue;
        const ratio = (slot.hp ?? def.maxHp) / def.maxHp;
        if (ratio < worstRatio) { worstRatio = ratio; worst = slotKey; }
      }
      if (worst && worstRatio < 1.0) {
        const slot = body.slots[worst];
        const def = organResolver(slot.organId);
        slot.hp = Math.min(def.maxHp, (slot.hp ?? def.maxHp) + 1);
        emit({ type: 'ORGAN_HEALED', source: 'organ_trigger', target: 'player',
               data: { slotKey: worst, amount: 1 }, priority: PRIORITY.MOB });
      }
      break;
    }
  }
}
