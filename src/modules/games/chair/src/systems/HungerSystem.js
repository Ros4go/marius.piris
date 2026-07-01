import { WS, rng, inventoryCapacity } from '../WorldState.js';
import { organResolver, balance as getBalance } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';
import { addLog } from '../render/HUDRenderer.js';
import * as Faculties from './Faculties.js';

// Hunger — a bell curve with a narrow sweet spot (see TDD §3). Satiety decays each
// exploration tick; both extremes punish you. Combat reads damageModifier()/
// bloodPenalty()/regenBonus(); the sound bar (later) will read noise().

const DEFAULTS = {
  start: 90, max: 120, decayPerTick: 1,
  thresholds: { gave: 106, rassasie: 76, creux: 56, faim: 36, affame: 16 },
  famineDamageEvery: 4, famineDamage: 1,
  vomitEvery: 5, vomitChance: 0.55, dechetChance: 0.1, dechetValue: 45,
  eatSatiety: 34, eatRegen: 4,
  dmgMod: { gave: 0, rassasie: 1, creux: 0, faim: -1, affame: -1, famine: -2 },
  bloodPen: { affame: 1, famine: 2 },
  noise: { rassasie: 0, gave: 0, creux: 0.3, faim: 0.5, affame: 0.75, famine: 1 },
  regenBonus: 1, digestBase: 0.4, digestPerLevel: 0.3,
};
function cfg() {
  const h = getBalance().hunger ?? {};
  return { ...DEFAULTS, ...h, thresholds: { ...DEFAULTS.thresholds, ...(h.thresholds ?? {}) } };
}

export const STAGE_FR = {
  gave: 'Gavé', rassasie: 'Rassasié', creux: 'Creux', faim: 'Faim', affame: 'Affamé', famine: 'Famine',
};

export function satiety() { return WS.player?.satiety ?? cfg().start; }

export function stage() {
  const s = satiety(), t = cfg().thresholds;
  if (s >= t.gave)     return 'gave';
  if (s >= t.rassasie) return 'rassasie';
  if (s >= t.creux)    return 'creux';
  if (s >= t.faim)     return 'faim';
  if (s >= t.affame)   return 'affame';
  return 'famine';
}

// --- Combat hooks ----------------------------------------------------------
// All tuning lives in balance.json → hunger. Flat damage modifier on YOUR attacks:
// well-fed = + (mirror of Frénésie), hunger = Fringale (−). Rassasié also regens.
export function damageModifier() { return cfg().dmgMod[stage()] ?? 0; }
export function regenBonus()     { return stage() === 'rassasie' ? (cfg().regenBonus ?? 0) : 0; }
export function bloodPenalty()   { return cfg().bloodPen[stage()] ?? 0; }
export function noise()          { return cfg().noise[stage()] ?? 0; }
export function isDeaf()         { return stage() === 'famine'; }   // own din drowns everything

// --- Tick (exploration) ----------------------------------------------------
function _clamp(v) { const c = cfg(); return Math.max(0, Math.min(c.max + 20, v)); }

export function tick() {
  const c = cfg();
  if (WS.player.satiety == null) WS.player.satiety = c.start;
  WS.player.satiety = _clamp(WS.player.satiety - c.decayPerTick);
  const st = stage();

  if (st === 'gave' && WS.tick % c.vomitEvery === 0) {
    if (rng() < c.dechetChance)      _produceDechet(c);
    else if (rng() < c.vomitChance)  _vomit(c);
  }
  if (st === 'famine' && WS.tick % c.famineDamageEvery === 0) _famineDamage(c.famineDamage);

  WS.player.noise = noise();
}

function _vomit(c) {
  // land back toward Rassasié, but the purge is uncertain — may overshoot
  let target = c.thresholds.rassasie + 2;
  const r = rng();
  if (r < 0.12)      target = c.thresholds.faim + 2;    // rare big overshoot → hungry
  else if (r < 0.40) target = c.thresholds.creux + 2;   // overshoot to Creux
  WS.player.satiety = Math.min(WS.player.satiety, target);
  addLog('🤮 Tu vomis — ça résonne dans la salle.', 'sys');
  emit({ type: 'PLAYER_NOISE', source: 'hunger', target: 'player', data: { loud: true }, priority: PRIORITY.TICK });
}

function _produceDechet(c) {
  WS.player.satiety = c.thresholds.rassasie + 4;
  if ((WS.player.inventory?.length ?? 0) < inventoryCapacity()) {
    WS.player.inventory.push({ id: `dechet_${WS.tick}_${Math.floor(rng() * 1e4)}`, dechet: true, value: c.dechetValue });
    addLog('💩 Tu expulses un déchet organique — ça se revend cher.', 'harvest');
  } else {
    addLog('💩 Un déchet organique se forme… mais ta besace est pleine, il est perdu.', 'sys');
  }
}

function _famineDamage(amt) {
  const body = WS.player.body; if (!body) return;
  const living = Object.keys(body.slots).filter((k) => {
    const s = body.slots[k]; return s?.organId && (s.hp == null || s.hp > 0);
  });
  if (!living.length) return;
  const k = living[Math.floor(rng() * living.length)];
  const s = body.slots[k], def = organResolver(s.organId);
  s.hp = Math.max(0, (s.hp ?? def?.maxHp ?? 1) - amt);
  addLog(`⚠ Famine — ta chair se nécrose (${def?.name ?? k} −${amt}).`, 'damage');
  emit({ type: 'ORGAN_DAMAGED', source: 'famine', target: 'player', data: { slotKey: k, dmg: amt }, priority: PRIORITY.TICK });
}

// --- Eating ----------------------------------------------------------------
// Digestion faculty (stomach + mouth/tongue) drives nourishment & regen. Human
// stomach+tongue = 2 → ×1.0; nothing = ×digestBase; special organs push it higher.
function digestionMult() {
  const c = cfg();
  return c.digestBase + c.digestPerLevel * Faculties.digestion();
}

// Eat an organ (by id, for the log name). Fills hunger + repairs your worst organ.
export function eat(organId) {
  const c = cfg(), mult = digestionMult();
  const gain = Math.round(c.eatSatiety * mult);
  const heal = Math.round(c.eatRegen * mult);
  WS.player.satiety = _clamp((WS.player.satiety ?? c.start) + gain);
  const healed = _healWorst(heal);
  const name = organResolver(organId)?.name ?? 'cet organe';
  addLog(`🍖 Tu dévores ${name} — faim comblée${healed ? ` (+${healed} PV)` : ''}.`, 'harvest');
  WS.player.noise = noise();
}

function _healWorst(amount) {
  const body = WS.player.body; if (!body || amount <= 0) return 0;
  let worst = null, worstRatio = 1;
  for (const [k, s] of Object.entries(body.slots)) {
    if (!s?.organId || (s.hp ?? 1) <= 0) continue;
    const def = organResolver(s.organId); if (!def) continue;
    const r = (s.hp ?? def.maxHp) / def.maxHp;
    if (r < worstRatio && r < 1) { worstRatio = r; worst = k; }
  }
  if (!worst) return 0;
  const def = organResolver(body.slots[worst].organId);
  const healed = Math.min(amount, def.maxHp - (body.slots[worst].hp ?? def.maxHp));
  body.slots[worst].hp = (body.slots[worst].hp ?? def.maxHp) + healed;
  return healed;
}
