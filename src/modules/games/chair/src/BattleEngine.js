// Real-time combat loop using requestAnimationFrame.
// Each organ charges independently based on blood allocation; player activates ready organs manually.
// Mob organs auto-fire when fully charged. No auto-attack, no beat rhythm.

import { WS, currentRoom } from './WorldState.js';
import { emit, flush, PRIORITY } from './TriggerBus.js';
import { organResolver } from './registry.js';
import * as CombatSystem from './systems/CombatSystem.js';

let _rafId      = null;
let _onRender   = null;  // called to refresh UI (~10fps during combat)
let _onEnd      = null;  // called with explCost when combat ends
let _lastRender = 0;     // throttle UI updates

// --- Blood helpers (persistent: WS.player.bloodAlloc is the source of truth) ---

// The heart produces the blood pool.
export function bloodPool() {
  const heart = WS.player.body?.slots?.heart;
  if (heart && (heart.hp === null || heart.hp > 0)) {
    return organResolver(heart.organId)?.pool ?? 3;
  }
  return 3;
}

function _slotAlive(slotKey) {
  const slot = WS.player.body?.slots?.[slotKey];
  return slot && (slot.hp === null || slot.hp > 0);
}

// Total blood currently committed to living organs.
export function bloodSpent() {
  const alloc = WS.player.bloodAlloc ?? {};
  let sum = 0;
  for (const [k, n] of Object.entries(alloc)) if (_slotAlive(k)) sum += n;
  return sum;
}

export function bloodFree() {
  return bloodPool() - bloodSpent();
}

// Max blood an organ can hold (0 = takes no blood, e.g. heart).
export function organMaxBlood(slotKey) {
  const slot = WS.player.body?.slots?.[slotKey];
  if (!slot) return 0;
  return organResolver(slot.organId)?.maxBlood ?? 0;
}

// Effective charge time in ms for an organ at a given blood level.
// Only organs with an active skill charge; needs ≥1 blood to be active.
// charge may be a fixed number or an array (per blood level).
function _chargeMs(def, blood) {
  const skill = def?.skill;
  if (!skill || blood < 1) return Infinity;
  const ch = skill.charge;
  const idx = Math.min(blood, (def.maxBlood || 1)) - 1;
  const v = Array.isArray(ch) ? (ch[idx] ?? ch[ch.length - 1]) : ch;
  return Math.max(500, v ?? 4000);
}

// --- Public API ---

export function start(onRender, onEnd) {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
  _onRender = onRender;
  _onEnd    = onEnd;

  WS.battle.organProgress = {};
  WS.battle.active        = true;
  WS.battle.explCost      = 0;
  WS.battle.buffDodge     = 0;
  WS.battle.buffAbsorb    = 0;
  WS.battle.aimedSlot     = null;
  WS.battle.targetSlotKey = null;
  WS.battle._lastTs       = null;

  ensureDefaultAlloc();        // seed allocation once; respects the player's prior choices
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
         data: { bloodPool: bloodPool() }, priority: PRIORITY.ACTION });
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

// Set an organ's blood to `amount`, clamped to its max and to the free pool.
// Works in AND out of combat (persistent). Refreshes charge if a fight is live.
export function allocateBlood(slotKey, amount) {
  if (amount < 0) amount = 0;
  const max = organMaxBlood(slotKey);
  if (max <= 0) return false;            // organ takes no blood (heart / passive)

  const alloc = WS.player.bloodAlloc ?? (WS.player.bloodAlloc = {});
  const prev  = alloc[slotKey] ?? 0;
  // Most this slot can hold given its cap and what's free elsewhere.
  const maxAffordable = Math.min(max, Math.max(0, prev + bloodFree()));
  amount = Math.min(amount, maxAffordable);

  if (amount <= 0) delete alloc[slotKey];
  else             alloc[slotKey] = amount;

  if (WS.battle.active) _refreshPlayerOrganProgress(slotKey);
  return true;
}

// --- Initialisation helpers ---

const _BLOOD_PRIORITY = ['arm_l','arm_r','legs','tongue','brain','eye_l','eye_r','ear_l','ear_r','stomach','skin'];

// Seed a sensible default allocation ONCE — leaves the player's choices intact.
// Gives 1 blood to each blood-capable organ by priority until the pool runs out.
export function ensureDefaultAlloc() {
  const alloc = WS.player.bloodAlloc ?? (WS.player.bloodAlloc = {});
  if (Object.keys(alloc).some(k => _slotAlive(k) && alloc[k] > 0)) return;  // already configured

  const body = WS.player.body;
  if (!body) return;
  let remaining = bloodPool();
  for (const slotKey of _BLOOD_PRIORITY) {
    if (remaining <= 0) break;
    if (!_slotAlive(slotKey)) continue;
    if (organMaxBlood(slotKey) < 1) continue;
    alloc[slotKey] = 1;
    remaining -= 1;
  }
}

function _initPlayerProgress() {
  const body = WS.player.body;
  const prog = {};
  for (const [slotKey, slot] of Object.entries(body.slots)) {
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const def = organResolver(slot.organId);
    if (!def) continue;
    const totalMs = _chargeMs(def, WS.player.bloodAlloc[slotKey] ?? 0);
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
  const totalMs = _chargeMs(def, WS.player.bloodAlloc[slotKey] ?? 0);
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

// Mob organs charge at their skill's full-tier charge (mobs don't allocate blood).
function _initMobProgress(mob) {
  for (const [slotKey, slot] of Object.entries(mob.body.slots)) {
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const def = organResolver(slot.organId);
    if (!def?.skill) continue;
    const totalMs = _chargeMs(def, def.maxBlood || 1);
    if (totalMs === Infinity) continue;
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
