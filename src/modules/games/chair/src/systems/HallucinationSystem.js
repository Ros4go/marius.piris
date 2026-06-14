import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';
import * as LoreSystem from './LoreSystem.js';

// Called once per tick from TickEngine maintenance phase.
// 4 escalating tiers based on HUM level.
export function tick() {
  const hum = WS.player.body?.humanityWith(organResolver) ?? 100;

  // Check lore thresholds
  LoreSystem.checkHumanity(hum);

  // Insomnie: god murmurs start at HUM<60 instead of HUM<75
  const tier1Threshold = WS.humeur === 'insomnie' ? 60 : 75;

  // Tier 1: sensory drift, faint sounds
  if (hum < tier1Threshold && Math.random() < 0.015) {
    emit({ type: 'HALLUCINATION', source: 'psyche', target: 'player',
           data: { tier: 1, intensity: 75 - hum, hum }, priority: PRIORITY.TICK });
  }

  // Tier 2: HUM < 50 — fake events, false loot pings
  if (hum < 50 && Math.random() < 0.03) {
    emit({ type: 'HALLUCINATION', source: 'psyche', target: 'player',
           data: { tier: 2, intensity: 50 - hum, hum }, priority: PRIORITY.TICK });
  }

  // Tier 3: HUM < 25 — screamers, intense flashes
  if (hum < 25 && Math.random() < 0.06) {
    emit({ type: 'HALLUCINATION', source: 'psyche', target: 'player',
           data: { tier: 3, intensity: 25 - hum, hum }, priority: PRIORITY.TICK });
  }

  // L'Écho du dieu: divine murmur at HUM < 30 (insomnie triggers earlier)
  const echoThreshold = WS.humeur === 'insomnie' ? 60 : 30;
  if (hum < echoThreshold && Math.random() < 0.012) {
    emit({ type: 'ECHO_DU_DIEU', source: 'god', target: 'player',
           data: { hum }, priority: PRIORITY.TICK });
  }

  // Tier 4: HUM < 5 — tangible, costs real HP
  if (hum < 5 && Math.random() < 0.1) {
    const body = WS.player.body;
    if (body) {
      const keys = Object.keys(body.slots).filter(k => body.slots[k] && (body.slots[k].hp ?? 1) > 0);
      if (keys.length) {
        const slotKey = keys[Math.floor(Math.random() * keys.length)];
        const slot = body.slots[slotKey];
        slot.hp = Math.max(0, (slot.hp ?? 1) - 1);
        emit({ type: 'ORGAN_DAMAGED', source: 'hallucination', target: 'player',
               data: { slotKey, dmg: 1 }, priority: PRIORITY.TICK });
      }
    }
    emit({ type: 'HALLUCINATION', source: 'psyche', target: 'player',
           data: { tier: 4, intensity: 5 - hum, hum }, priority: PRIORITY.TICK });
  }
}
