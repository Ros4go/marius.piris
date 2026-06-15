import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';
import * as CurseSystem from './CurseSystem.js';

export function playerHasRelic(relicId) {
  return (WS.player.relics ?? []).includes(relicId);
}

// relic_suture_noire: graft costs 3 ticks instead of 5
export function graftCost() {
  return playerHasRelic('relic_suture_noire') ? 3 : 5;
}

// relic_cartilage_fossile: ARM applies on mid+deep layers too
export function armAppliesToLayer(layer) {
  if (layer === 'outer') return true;
  return playerHasRelic('relic_cartilage_fossile');
}

// relic_membrane_epaisse: -1 dmg on outer layer attacks
export function outerDamageReduction() {
  return playerHasRelic('relic_membrane_epaisse') ? 1 : 0;
}

// Called each maintenance tick
export function tick() {
  const body = WS.player.body;
  if (!body) return;
  _tickSangCristal(body);
}

function _tickSangCristal(body) {
  if (!playerHasRelic('relic_sang_cristal')) return;
  if (WS.tick % 20 !== 0) return;

  if (CurseSystem.healHurts()) {
    // heal_hurts active: repair becomes damage
    let worst = null, worstRatio = 1.0;
    for (const [slotKey, slot] of Object.entries(body.slots)) {
      if (!slot || (slot.hp ?? 1) <= 0) continue;
      const def = organResolver(slot.organId);
      if (!def) continue;
      const ratio = (slot.hp ?? def.maxHp) / def.maxHp;
      if (ratio < worstRatio) { worstRatio = ratio; worst = slotKey; }
    }
    if (worst) {
      const slot = body.slots[worst];
      slot.hp = Math.max(0, (slot.hp ?? 1) - 1);
      emit({ type: 'ORGAN_DAMAGED', source: 'relic_curse', target: 'player',
             data: { slotKey: worst, dmg: 1 }, priority: PRIORITY.TICK });
    }
    return;
  }

  // Normal: heal most-damaged organ by 1
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
    emit({ type: 'ORGAN_HEALED', source: 'relic', target: 'player',
           data: { slotKey: worst, amount: 1 }, priority: PRIORITY.TICK });
  }
}
