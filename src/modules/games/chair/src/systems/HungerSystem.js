import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';
import * as CurseSystem from './CurseSystem.js';
import * as RelicSystem from './RelicSystem.js';

// Called once per tick (from TickEngine._advance maintenance step).
// SPEC: satiété/tick = -0.04 × FAM × curseHungerMult
// Autophagy at satiete=0: -1 PV on the most monstrous organ (lowest humanity) every tick.
// Infected organs: -1 HP every 10 ticks (from La Flore / infect pattern).
export function tick() {
  const body = WS.player.body;
  if (!body) return;

  const stats      = body.statsWith(organResolver);
  const FAM        = stats.fam ?? 3;
  const hungerMult = CurseSystem.hungerMult();

  // Humeur modifiers: bile_montante × 1.5 drain, fievre × 1.25
  const moodMult = WS.humeur === 'bile_montante' ? 1.5 : WS.humeur === 'fievre' ? 1.25 : 1;
  WS.player.satiete = Math.max(0, (WS.player.satiete ?? 50) - 0.04 * FAM * hungerMult * moodMult);

  if (WS.player.satiete <= 0) {
    _autophagy(body);
  }

  if (WS.tick % 10 === 0) {
    _tickInfected(body);
  }

  RelicSystem.tick();
  CurseSystem.tick();
}

function _tickInfected(body) {
  for (const [slotKey, slot] of Object.entries(body.slots)) {
    if (!slot?.infected || (slot.hp ?? 1) <= 0) continue;
    slot.hp = Math.max(0, (slot.hp ?? 1) - 1);
    emit({
      type:     'ORGAN_DAMAGED',
      source:   'infection',
      target:   'player',
      data:     { slotKey, dmg: 1 },
      priority: PRIORITY.TICK,
    });
  }
}

function _autophagy(body) {
  let worstSlot      = null;
  let lowestHumanity = Infinity;

  for (const [slotKey, slot] of Object.entries(body.slots)) {
    if (!slot || (slot.hp ?? 1) <= 0) continue;
    const def = organResolver(slot.organId);
    if (!def) continue;
    const hum = def.humanity ?? 0;
    if (hum < lowestHumanity) {
      lowestHumanity = hum;
      worstSlot = slotKey;
    }
  }

  if (!worstSlot) return;

  const slot = body.slots[worstSlot];
  slot.hp = Math.max(0, (slot.hp ?? 1) - 1);

  emit({
    type:     'ORGAN_DAMAGED',
    source:   'hunger',
    target:   'player',
    data:     { slotKey: worstSlot, dmg: 1 },
    priority: PRIORITY.TICK,
  });
}
