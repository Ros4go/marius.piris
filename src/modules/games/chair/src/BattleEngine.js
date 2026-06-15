// Real-time combat loop using requestAnimationFrame.
// Each organ charges independently based on blood allocation; player activates ready organs manually.
// Mob organs auto-fire when fully charged. No auto-attack, no beat rhythm.

import { WS, currentRoom } from './WorldState.js';
import { emit, flush, PRIORITY } from './TriggerBus.js';
import { organResolver } from './registry.js';
import { ORGAN_SLOTS } from './entities/Body.js';
import * as CombatSystem from './systems/CombatSystem.js';

// Charge config per organ type.
// effectiveMs = baseMs − (allocatedBlood − minBlood) × scaleMs   (min 500ms)
// Organs with allocatedBlood < minBlood are inactive (progress frozen).
export const ORGAN_CD = {
  arm:     { baseMs: 4000, minBlood: 1, maxBlood: 3, scaleMs: 800 },
  tongue:  { baseMs: 3000, minBlood: 1, maxBlood: 2, scaleMs: 600 },
  legs:    { baseMs: 6000, minBlood: 1, maxBlood: 2, scaleMs: 1000 },
  skin:    { baseMs: 7000, minBlood: 2, maxBlood: 2, scaleMs: 0 },
  brain:   { baseMs: 4000, minBlood: 1, maxBlood: 2, scaleMs: 800 },
  eye:     { baseMs: 2000, minBlood: 1, maxBlood: 1, scaleMs: 0 },
  ear:     { baseMs: 4000, minBlood: 1, maxBlood: 2, scaleMs: 800 },
  stomach: { baseMs: 8000, minBlood: 2, maxBlood: 3, scaleMs: 1200 },
  heart:   { baseMs: 0,    minBlood: 0, maxBlood: 0, scaleMs: 0 },
};

// Per-brain charge speed multiplier for mobs (higher = fires faster).
const MOB_SPEED = {
  brain_lich:  1.4,
  brain_titan: 0.7,
};

let _rafId      = null;
let _onRender   = null;  // called to refresh UI (~10fps during combat)
let _onEnd      = null;  // called with explCost when combat ends
let _lastRender = 0;     // throttle UI updates

// --- Blood helpers ---

function _bloodPool() {
  const ryt = WS.player.body?.statsWith(organResolver)?.ryt ?? 1;
  return Math.max(3, ryt + 3);
}

// Effective charge time in ms for a given organ type + blood allocation.
// Returns Infinity when blood < minBlood (organ inactive).
function _chargeMs(type, blood) {
  const cfg = ORGAN_CD[type];
  if (!cfg || !cfg.baseMs) return Infinity;
  if (blood < cfg.minBlood) return Infinity;
  const extra = Math.min(blood - cfg.minBlood, cfg.maxBlood - cfg.minBlood);
  return Math.max(500, cfg.baseMs - extra * cfg.scaleMs);
}

// --- Public API ---

export function start(onRender, onEnd) {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  _onRender = onRender;
  _onEnd    = onEnd;

  const pool = _bloodPool();
  WS.battle.bloodPool     = pool;
  WS.battle.bloodAlloc    = {};
  WS.battle.organProgress = {};
  WS.battle.active        = true;
  WS.battle.explCost      = 0;
  WS.battle.buffDodge     = 0;
  WS.battle.buffAbsorb    = 0;
  WS.battle.aimedSlot     = null;
  WS.battle.targetSlotKey = null;
  WS.battle._lastTs       = null;

  _defaultBloodAlloc();
  _initPlayerProgress();

  const room = currentRoom();
  for (const mobId of (room?.mobIds ?? [])) {
    const m = WS.mobs.get(mobId);
    if (!m || m.lifecycle !== 'active') continue;
    m.organProgress   = {};
    m.buffDodge       = 0;
    m.buffArm         = 0;
    m.buffArmExpiry   = 0;
    m.aimedSlot       = null;
    m.aimedSlotExpiry = 0;
    m.intent          = '';
    _initMobProgress(m);
  }

  emit({ type: 'BATTLE_STARTED', source: 'engine', target: 'all',
         data: { bloodPool: pool }, priority: PRIORITY.ACTION });
  flush(PRIORITY.ACTION);

  _lastRender = 0;
  _rafId = requestAnimationFrame(_loop);
}

export function stop(callOnEnd = true) {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  WS.battle.active = false;
  if (callOnEnd && _onEnd) _onEnd(WS.battle.explCost);
}

export function setTarget(slotKey) {
  WS.battle.targetSlotKey = slotKey;
}

// Activate a fully-charged player organ skill.
export function activateSkill(slotKey) {
  if (!WS.battle.active) return false;
  const prog = WS.battle.organProgress[slotKey];
  if (!prog?.ready) return false;

  const room = currentRoom();
  const mob  = _activeMob(room);
  if (!mob) return false;

  const result = CombatSystem.playerSkill(slotKey, mob.id, WS.battle.targetSlotKey);
  flush(PRIORITY.ACTION);

  if (result?.ok) {
    prog.chargedMs = 0;
    prog.ready     = false;
  }

  if (_combatOver()) {
    stop(!WS.player.body?.isAlive() ? false : true);
    return true;
  }

  _onRender?.();
  return !!result?.ok;
}

// Reallocate blood between organs. Rejects if total would exceed bloodPool.
// Preserves relative charge progress when totalMs changes.
export function allocateBlood(slotKey, amount) {
  if (!WS.battle.active || amount < 0) return false;
  const prev  = WS.battle.bloodAlloc[slotKey] ?? 0;
  const total = Object.values(WS.battle.bloodAlloc).reduce((s, n) => s + n, 0);
  if (total - prev + amount > WS.battle.bloodPool) return false;

  WS.battle.bloodAlloc[slotKey] = amount;
  _refreshPlayerOrganProgress(slotKey);
  return true;
}

// --- Initialisation helpers ---

const _BLOOD_PRIORITY = ['arm_l','arm_r','legs','tongue','brain','eye_l','eye_r','ear_l','ear_r','stomach','skin'];

function _defaultBloodAlloc() {
  const body      = WS.player.body;
  let   remaining = WS.battle.bloodPool;
  const alloc     = {};

  for (const slotKey of _BLOOD_PRIORITY) {
    if (remaining <= 0) break;
    const slot = body.slots[slotKey];
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const def = organResolver(slot.organId);
    if (!def) continue;
    // Common non-arm/legs organs have no action button — skip them in default alloc
    const slotType = ORGAN_SLOTS[slotKey]?.type;
    if (slotType !== 'arm' && slotType !== 'legs' && def.tier === 'common') continue;
    const cfg = ORGAN_CD[def.type];
    if (!cfg || !cfg.minBlood) continue;
    if (remaining >= cfg.minBlood) {
      alloc[slotKey] = cfg.minBlood;
      remaining      -= cfg.minBlood;
    }
  }
  WS.battle.bloodAlloc = alloc;
}

function _initPlayerProgress() {
  const body = WS.player.body;
  const prog = {};
  for (const [slotKey, slot] of Object.entries(body.slots)) {
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const def = organResolver(slot.organId);
    if (!def) continue;
    const totalMs = _chargeMs(def.type, WS.battle.bloodAlloc[slotKey] ?? 0);
    if (totalMs === Infinity) continue;
    prog[slotKey] = { chargedMs: 0, totalMs, ready: false };
  }
  WS.battle.organProgress = prog;
}

function _refreshPlayerOrganProgress(slotKey) {
  const slot = WS.player.body?.slots?.[slotKey];
  if (!slot) return;
  const def = organResolver(slot.organId);
  if (!def) return;
  const totalMs = _chargeMs(def.type, WS.battle.bloodAlloc[slotKey] ?? 0);
  if (totalMs === Infinity) {
    delete WS.battle.organProgress[slotKey];
    return;
  }
  const prev = WS.battle.organProgress[slotKey];
  if (prev) {
    const ratio    = prev.totalMs > 0 ? prev.chargedMs / prev.totalMs : 0;
    prev.chargedMs = ratio * totalMs;
    prev.totalMs   = totalMs;
  } else {
    WS.battle.organProgress[slotKey] = { chargedMs: 0, totalMs, ready: false };
  }
}

function _initMobProgress(mob) {
  const brainId   = mob.body.slots['brain']?.organId;
  const speedMult = MOB_SPEED[brainId] ?? 1.0;

  for (const [slotKey, slot] of Object.entries(mob.body.slots)) {
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const def = organResolver(slot.organId);
    if (!def) continue;
    const cfg = ORGAN_CD[def.type];
    if (!cfg || !cfg.baseMs) continue;
    const totalMs = Math.max(500, Math.round(cfg.baseMs / speedMult));
    mob.organProgress[slotKey] = { chargedMs: 0, totalMs, ready: false };
  }
}

// --- rAF loop ---

function _loop(ts) {
  if (!WS.battle.active) return;
  const lastTs = WS.battle._lastTs ?? ts;
  const delta  = Math.min(ts - lastTs, 500);  // cap delta to avoid large jumps on tab switch
  WS.battle._lastTs = ts;

  _tick(delta, ts);

  _rafId = requestAnimationFrame(_loop);
}

function _tick(deltaMs, ts) {
  // Advance player organ progress
  const playerProg = WS.battle.organProgress;
  for (const prog of Object.values(playerProg)) {
    if (prog.ready) continue;
    prog.chargedMs = Math.min(prog.totalMs, prog.chargedMs + deltaMs);
    if (prog.chargedMs >= prog.totalMs) prog.ready = true;
  }

  // Advance mob organ progress + auto-fire when fully charged
  const now  = Date.now();
  const room = currentRoom();

  for (const mobId of [...(room?.mobIds ?? [])]) {
    const mob = WS.mobs.get(mobId);
    if (!mob || mob.lifecycle !== 'active') continue;

    // Expire timed buffs
    if (mob.buffArmExpiry && now > mob.buffArmExpiry)     { mob.buffArm = 0; mob.buffArmExpiry = 0; }
    if (mob.aimedSlotExpiry && now > mob.aimedSlotExpiry) { mob.aimedSlot = null; mob.aimedSlotExpiry = 0; }

    const mobProg = mob.organProgress ?? {};
    for (const [slotKey, prog] of Object.entries(mobProg)) {
      const slot = mob.body.slots[slotKey];
      if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
      if (prog.ready) continue;

      prog.chargedMs = Math.min(prog.totalMs, prog.chargedMs + deltaMs);
      if (prog.chargedMs >= prog.totalMs) {
        CombatSystem.fireMobOrganSkill(mob, slotKey);
        flush(PRIORITY.MOB);
        // Reset for next charge (even if organ died: fireMobOrganSkill handles that)
        if (mob.organProgress[slotKey]) {
          mob.organProgress[slotKey].chargedMs = 0;
          mob.organProgress[slotKey].ready     = false;
        }
      }
    }

    _updateMobIntent(mob);
  }

  if (_combatOver()) {
    stop(!WS.player.body?.isAlive() ? false : true);
    return;
  }

  // Throttle UI re-renders to ~10fps
  if (ts - _lastRender >= 100) {
    _lastRender = ts;
    _onRender?.();
  }
}

function _updateMobIntent(mob) {
  const prog = mob.organProgress ?? {};
  let bestKey = null, bestRatio = -1;
  for (const [key, p] of Object.entries(prog)) {
    const slot = mob.body.slots[key];
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const ratio = p.chargedMs / Math.max(1, p.totalMs);
    if (ratio > bestRatio) { bestRatio = ratio; bestKey = key; }
  }
  if (bestKey) {
    const def  = organResolver(mob.body.slots[bestKey]?.organId);
    const name = def?.name ?? bestKey;
    mob.intent = `⚠ ${name} · ${Math.round(bestRatio * 100)}%`;
  } else {
    mob.intent = '';
  }
}

// --- Internal ---

function _activeMob(room) {
  return (room?.mobIds ?? [])
    .map(id => WS.mobs.get(id))
    .find(m => m?.lifecycle === 'active') ?? null;
}

function _combatOver() {
  if (!WS.player.body?.isAlive()) return true;
  const room = currentRoom();
  return !(room?.mobIds ?? []).some(id => WS.mobs.get(id)?.lifecycle === 'active');
}
