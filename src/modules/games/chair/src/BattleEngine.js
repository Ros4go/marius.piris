// Real-time auto-battler loop, separate from the exploration tick.
// Starts when the player enters a hostile room; fires beats at heart rhythm.
// Each beat: player auto-attacks, all mobs attack back, cooldowns decay.
// Skills fire immediately when activated (not waiting for the next beat).
// When combat ends, calls onEnd(explCost) so TickEngine can advance exploration ticks.

import { WS, currentRoom } from './WorldState.js';
import { emit, flush, PRIORITY } from './TriggerBus.js';
import { organResolver } from './registry.js';
import * as CombatSystem from './systems/CombatSystem.js';

let _timer  = null;
let _onBeat = null;  // called each beat to re-render the UI
let _onEnd  = null;  // called with explCost when combat ends

const SKILL_LABELS = {
  arm:'FRAPPE LOURDE', tongue:'LANCER', legs:'ESQUIVE', skin:'DURCIR',
  heart:'SOINS', stomach:'RÉGÉNÈRE', brain:'ANALYSE', eye:'VISER', ear:'ÉCOUTER',
};

// Beat interval: 1200ms base, −60ms per RYT point, min 400ms.
function _interval() {
  const ryt = WS.player.body?.statsWith(organResolver)?.ryt ?? 1;
  return Math.max(400, 1200 - ryt * 60);
}

export function start(onBeat, onEnd) {
  if (_timer) clearInterval(_timer);
  _onBeat = onBeat;
  _onEnd  = onEnd;

  WS.battle.beatInterval   = _interval();
  WS.battle.active         = true;
  WS.battle.beatTick       = 0;
  WS.battle.explCost       = 0;
  WS.battle.skillCooldowns = {};
  WS.battle.buffDodge      = 0;
  WS.battle.buffAbsorb     = 0;
  WS.battle.aimedSlot      = null;
  WS.battle.targetSlotKey  = 'skin';

  // Reset mob scheduling state for each active mob
  const startRoom = currentRoom();
  for (const mobId of (startRoom?.mobIds ?? [])) {
    const m = WS.mobs.get(mobId);
    if (!m || m.lifecycle !== 'active') continue;
    m.scheduledSkill = null;
    m.intent         = '';
    m.buffDodge      = 0;
    m.buffArm        = 0;
    m.buffArmBeats   = 0;
    m.aimedSlot      = null;
    m.aimedSlotBeats = 0;
  }

  emit({ type: 'BATTLE_STARTED', source: 'engine', target: 'all',
         data: { interval: WS.battle.beatInterval }, priority: PRIORITY.ACTION });
  flush(PRIORITY.ACTION);

  _timer = setInterval(_beat, WS.battle.beatInterval);
}

export function stop(callOnEnd = true) {
  if (_timer) { clearInterval(_timer); _timer = null; }
  WS.battle.active = false;
  if (callOnEnd && _onEnd) _onEnd(WS.battle.explCost);
}

export function setTarget(slotKey) {
  WS.battle.targetSlotKey = slotKey;
}

// Fire a skill immediately (outside the beat rhythm).
// Returns false if the skill is still on cooldown.
export function activateSkill(slotKey) {
  if (!WS.battle.active) return false;
  const cd = WS.battle.skillCooldowns[slotKey] ?? 0;
  if (cd > 0) return false;

  const room = currentRoom();
  const mob  = _activeMob(room);
  if (!mob) return false;

  const result = CombatSystem.playerSkill(slotKey, mob.id, WS.battle.targetSlotKey);
  flush(PRIORITY.ACTION);

  if (result?.cooldown) WS.battle.skillCooldowns[slotKey] = result.cooldown;

  if (_combatOver()) {
    stop(!WS.player.body?.isAlive() ? false : true);
    return true;
  }

  _onBeat?.();
  return true;
}

// --- Internal ---

function _beat() {
  if (!WS.battle.active) return;

  WS.battle.beatTick++;

  // Decay skill cooldowns by 1 each beat
  for (const key of Object.keys(WS.battle.skillCooldowns)) {
    if (WS.battle.skillCooldowns[key] > 0) WS.battle.skillCooldowns[key]--;
  }

  const room = currentRoom();
  const mob  = _activeMob(room);
  if (!mob) { stop(true); return; }

  // Player auto-attack
  CombatSystem.playerAutoAttack(mob.id);
  flush(PRIORITY.ACTION);

  if (_combatOver()) {
    stop(!WS.player.body?.isAlive() ? false : true);
    return;
  }

  // Mob skill scheduling — tick countdown or schedule next skill, then fire auto-attack
  for (const mobId of [...(room.mobIds ?? [])]) {
    const m = WS.mobs.get(mobId);
    if (m?.lifecycle !== 'active') continue;

    // Decay buffArmBeats
    if ((m.buffArmBeats ?? 0) > 0) {
      m.buffArmBeats--;
      if (m.buffArmBeats <= 0) m.buffArm = 0;
    }

    if (m.scheduledSkill) {
      m.scheduledSkill.countdown--;
      if (m.scheduledSkill.countdown <= 0) {
        CombatSystem.executeMobScheduledSkill(m);
        flush(PRIORITY.MOB);
        m.intent = '';
      } else {
        const s = m.scheduledSkill;
        m.intent = `⚔ ${s.organName} [${s.countdown}▸] ${s.skillName}`;
      }
    } else {
      const picked = CombatSystem.pickMobSkillOrgan(m);
      if (picked) {
        const beats = CombatSystem.mobSkillCountdown(m);
        m.scheduledSkill = {
          slotKey:   picked.slotKey,
          type:      picked.type,
          organName: picked.name,
          skillName: SKILL_LABELS[picked.type] ?? 'ACTION',
          countdown: beats,
        };
        m.intent = `⚔ ${m.scheduledSkill.organName} [${beats}▸] ${m.scheduledSkill.skillName}`;
      }
    }
  }

  flush(PRIORITY.MOB);

  if (_combatOver()) {
    stop(!WS.player.body?.isAlive() ? false : true);
    return;
  }

  _onBeat?.();
}

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
