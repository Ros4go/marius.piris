import { loreAll } from '../registry.js';
import { on as onTrigger, emit, PRIORITY } from '../TriggerBus.js';

const LORE_KEY = 'chair_lore_v1';
let _seen = new Set();

// Wire trigger-based lore entries. Call once after boot.
export function init() {
  try {
    const raw = localStorage.getItem(LORE_KEY);
    if (raw) _seen = new Set(JSON.parse(raw));
  } catch (_) {}

  onTrigger('ORGAN_GRAFTED',   ()  => _check('firstOrganEquipped'));
  onTrigger('ORGAN_HARVESTED', ()  => _check('firstHarvest'));
  onTrigger('MOB_DIED',        ()  => _check('firstKill'));
  onTrigger('PLAYER_DIED',     ()  => _check('firstDeath'));
  onTrigger('ORGAN_DAMAGED',   (e) => {
    if (e.source !== 'infection' && e.source !== 'hunger') _check('firstCombat');
  });
}

// Call on first move into any room.
export function checkOnMove() { _check('firstRoom'); }

// Call when entering a new biome.
export function checkBiomeEntry(biomeId) { _check(`biomeEntry:${biomeId}`); }

// Call when entering a rest room for the first time.
export function checkRestFound() { _check('firstRestRoom'); }

// Call from HallucinationSystem or BodyFX tick after computing HUM.
export function checkHumanity(hum) {
  if (hum < 50) _check('humanityBelow50');
  if (hum < 20) _check('humanityBelow20');
  if (hum < 5)  _check('humanityBelow5');
}

function _check(triggerType) {
  for (const entry of loreAll()) {
    if (entry.trigger !== triggerType) continue;
    if (entry.once && _seen.has(entry.id)) continue;
    _fire(entry);
  }
}

function _fire(entry) {
  if (entry.once) {
    _seen.add(entry.id);
    try { localStorage.setItem(LORE_KEY, JSON.stringify([..._seen])); } catch (_) {}
  }
  emit({ type: 'LORE_FIRED', source: 'lore', target: 'player',
         data: { id: entry.id, text: entry.text }, priority: PRIORITY.TICK });
}
