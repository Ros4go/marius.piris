import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';

// Returns Set of all curse IDs active from equipped organs.
export function getActiveCurses() {
  const body = WS.player.body;
  if (!body) return new Set();
  const curses = new Set();
  for (const slot of Object.values(body.slots)) {
    if (!slot || (slot.hp ?? 1) <= 0) continue;
    const def = organResolver(slot.organId);
    for (const c of (def?.curses ?? [])) curses.add(c);
  }
  return curses;
}

export function playerHasCurse(curseId) {
  return getActiveCurses().has(curseId);
}

// Called by HungerSystem — multiply hunger drain when hunger_x2 is active.
export function hungerMult() {
  return playerHasCurse('hunger_x2') ? 2 : 1;
}

// Called by RelicSystem / RestPanel — healing becomes damage when active.
export function healHurts() {
  return playerHasCurse('heal_hurts');
}

// Called each maintenance tick — fires PARANOIA_EVENT if curse is active.
export function tick() {
  if (!playerHasCurse('paranoia')) return;
  if (Math.random() < 0.04) {
    emit({ type: 'PARANOIA_EVENT', source: 'curse', target: 'player',
           data: {}, priority: PRIORITY.TICK });
  }
}
