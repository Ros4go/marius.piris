import { WS } from '../WorldState.js';
import { organResolver, relic as getRelic } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';
import * as CurseSystem from './CurseSystem.js';

// Relics live in the BESACE (inventory) — an inventory item is a relic when it
// carries a `relicId`. Their effects apply only while the relic is carried.
//
// Effects are DATA-DRIVEN: each relic def in relics.json declares
//   "effects": [{ "kind": "<known kind>", ...params }]
// The code below understands a fixed VOCABULARY of effect kinds. Adding a relic
// that reuses an existing kind is pure JSON — no code change. A brand-new mechanic
// is the only thing that needs a new handler here.

const GRAFT_BASE = 5;

// Relic defs currently in the besace.
export function carriedRelicDefs() {
  const out = [];
  for (const item of WS.player.inventory ?? []) {
    if (!item?.relicId) continue;
    const def = getRelic(item.relicId);
    if (def) out.push(def);
  }
  return out;
}

export function playerHasRelic(relicId) {
  return (WS.player.inventory ?? []).some((it) => it?.relicId === relicId);
}

// Every effect of a given kind across all carried relics (multiple relics stack).
function _effects(kind) {
  const out = [];
  for (const def of carriedRelicDefs()) {
    for (const e of def.effects ?? []) if (e.kind === kind) out.push(e);
  }
  return out;
}

// --- Effect kind: graft_cost — cheapest carried value wins ---
export function graftCost() {
  let cost = GRAFT_BASE;
  for (const e of _effects('graft_cost')) cost = Math.min(cost, e.value ?? GRAFT_BASE);
  return cost;
}

// --- Maintenance tick: run periodic effects (auto_repair) ---
export function tick() {
  const body = WS.player.body;
  if (!body) return;
  for (const e of _effects('auto_repair')) {
    const every = e.everyTicks ?? 20;
    if (every <= 0 || WS.tick % every !== 0) continue;
    _autoRepair(body, e.amount ?? 1);
  }
}

function _autoRepair(body, amount) {
  // Find the most-damaged living organ.
  let worst = null, worstRatio = 1.0;
  for (const [slotKey, slot] of Object.entries(body.slots)) {
    if (!slot || (slot.hp ?? 1) <= 0) continue;
    const def = organResolver(slot.organId);
    if (!def) continue;
    const ratio = (slot.hp ?? def.maxHp) / def.maxHp;
    if (ratio < worstRatio) { worstRatio = ratio; worst = slotKey; }
  }
  if (!worst || worstRatio >= 1.0) return;

  const slot = body.slots[worst];
  const def  = organResolver(slot.organId);

  if (CurseSystem.healHurts()) {
    // heal_hurts curse: the "repair" becomes damage instead.
    slot.hp = Math.max(0, (slot.hp ?? 1) - amount);
    emit({ type: 'ORGAN_DAMAGED', source: 'relic_curse', target: 'player',
           data: { slotKey: worst, dmg: amount }, priority: PRIORITY.TICK });
    return;
  }

  slot.hp = Math.min(def.maxHp, (slot.hp ?? def.maxHp) + amount);
  emit({ type: 'ORGAN_HEALED', source: 'relic', target: 'player',
         data: { slotKey: worst, amount }, priority: PRIORITY.TICK });
}
