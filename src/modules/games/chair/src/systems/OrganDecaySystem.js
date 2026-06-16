import { WS, scheduleAt } from '../WorldState.js';
import { organResolver } from '../registry.js';

// SPEC: inventory organ quality drops 1 tier after N ticks
// common: 60t, rare: 90t, épique: 140t
const TIER_DECAY = { common: 60, rare: 90, epic: 140, legendary: 200 };

// Quality degradation order
const QUALITY_ORDER = ['parfait', 'intact', 'abîmé', 'cuit', 'pourri'];

// SPEC tier threshold ratios (matching Organ.js QUALITY_THRESHOLDS)
const RATIO_FLOOR = {
  parfait: 0.99,
  intact:  0.70,
  'abîmé': 0.40,
  cuit:    0.01,
  pourri:  0,
};

// Schedule the first decay event for an inventory item (call after harvest/graft-out).
export function scheduleDecay(itemId) {
  const item = WS.player.inventory.find(i => i.id === itemId);
  if (!item) return;

  const def = organResolver(item.organId);
  if (!def) return;

  const delay = TIER_DECAY[def.tier] ?? 60;
  scheduleAt(WS.tick + delay, () => _decayItem(itemId));
}

function _decayItem(itemId) {
  const item = WS.player.inventory.find(i => i.id === itemId);
  if (!item) return; // already consumed or grafted

  const def = organResolver(item.organId);
  if (!def) return;

  const currentQuality = def.getQuality(item.hp).name;
  if (currentQuality === 'destroyed' || currentQuality === 'pourri') return;

  const qIdx = QUALITY_ORDER.indexOf(currentQuality);
  if (qIdx < 0 || qIdx >= QUALITY_ORDER.length - 1) return;

  const nextQuality = QUALITY_ORDER[qIdx + 1];
  const nextRatio   = RATIO_FLOOR[nextQuality] ?? 0;

  // Drop HP just inside the next quality tier
  item.hp      = Math.max(0, Math.floor(def.maxHp * (nextRatio + 0.005)));
  item.quality = nextQuality;

  // Schedule the next decay step unless fully rotten
  if (nextQuality !== 'pourri') {
    scheduleDecay(itemId);
  }
}
