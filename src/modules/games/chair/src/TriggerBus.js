import { WS } from './WorldState.js';

const BUDGET            = 64;
const DEPTH_MAX         = 8;
const SAME_TYPE_PER_SOURCE = 3;

const _handlers = new Map(); // type → fn[]

export const PRIORITY = { ACTION: 0, MOB: 1, TICK: 2 };

export function on(type, handler) {
  if (!_handlers.has(type)) _handlers.set(type, []);
  _handlers.get(type).push(handler);
}

export function off(type, handler) {
  if (!_handlers.has(type)) return;
  _handlers.set(type, _handlers.get(type).filter(fn => fn !== handler));
}

export function emit(event) {
  WS.triggerBus.queue.push({
    ...event,
    depth:          event.depth    ?? 0,
    emittedAtTick:  WS.tick,
    priority:       event.priority ?? PRIORITY.ACTION,
  });
}

function _extractAndSort(priority) {
  const eligible = WS.triggerBus.queue.filter(e => e.priority === priority);
  WS.triggerBus.queue = WS.triggerBus.queue.filter(e => e.priority !== priority);
  eligible.sort((a, b) =>
    a.emittedAtTick !== b.emittedAtTick ? a.emittedAtTick - b.emittedAtTick :
    a.depth         !== b.depth         ? a.depth - b.depth :
    a.type < b.type ? -1 : a.type > b.type ? 1 : 0
  );
  return eligible;
}

// Flush one priority level.
// Re-entrant events (handlers emit same priority) are captured on the next iteration.
// Budget cap, DEPTH_MAX, and dedup SAME_TYPE_PER_SOURCE are enforced globally per flush.
export function flush(priority) {
  const counts = new Map(); // `${source}:${type}` → calls this flush
  WS.triggerBus.budget = 0;

  while (true) {
    const batch = _extractAndSort(priority);
    if (!batch.length) break;

    // Budget may have been consumed by a previous batch (re-entrant scenario)
    if (WS.triggerBus.budget >= BUDGET) {
      _overflow(priority, batch.length);
      WS.triggerBus.queue = WS.triggerBus.queue.filter(e => e.priority !== priority);
      break;
    }

    let overflowed = false;
    for (let i = 0; i < batch.length; i++) {
      if (WS.triggerBus.budget >= BUDGET) {
        // Budget hit mid-batch: count unprocessed items + anything still in queue
        const queueCount = WS.triggerBus.queue.filter(e => e.priority === priority).length;
        WS.triggerBus.queue = WS.triggerBus.queue.filter(e => e.priority !== priority);
        _overflow(priority, (batch.length - i) + queueCount);
        overflowed = true;
        break;
      }

      const event = batch[i];
      if (event.depth > DEPTH_MAX) continue;        // silently drop: depth limit

      const deduKey = `${event.source}:${event.type}`;
      const count   = counts.get(deduKey) ?? 0;
      if (count >= SAME_TYPE_PER_SOURCE) continue;  // silently drop: dedup limit
      counts.set(deduKey, count + 1);

      const handlers = _handlers.get(event.type) ?? [];
      for (const h of handlers) h(event);
      WS.triggerBus.budget++;
    }

    if (overflowed) break;
    // Loop: pick up any re-entrant events emitted by handlers during this batch
  }
}

function _overflow(priority, dropped) {
  const handlers = _handlers.get('TRIGGER_OVERFLOW') ?? [];
  for (const h of handlers) h({ type: 'TRIGGER_OVERFLOW', priority, dropped });
}

// 3-flush cycle per tick: ACTION → MOB → TICK
export function flushAll() {
  flush(PRIORITY.ACTION);
  flush(PRIORITY.MOB);
  flush(PRIORITY.TICK);
}

export function clear() {
  WS.triggerBus.queue = [];
  WS.triggerBus.budget = 0;
}
