import { WS, rng } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';
import { ORGAN_SLOTS } from '../entities/Body.js';
import * as BossSystem    from './BossSystem.js';
import * as AbilitySystem from './AbilitySystem.js';

// New model: organs are self-contained. The magnitude of a skill/passive comes
// from organ.skill.values[blood-1] (player: allocated blood; mob: full tier).
// No aggregate stats. No attacker precision — the only evasion is the DEFENDER's
// passive "dodge" (legs), FTL-style.

// Value of an organ's skill or passive at its current blood level.
function _value(def, slotKey, isPlayer, src) {
  const node = src === 'skill' ? def?.skill : def?.passive;
  if (!node || !node.values || !node.values.length) return 0;
  const blood = isPlayer ? (WS.player.bloodAlloc?.[slotKey] ?? 0) : (def.maxBlood || node.values.length);
  if (blood < 1) return 0;
  const idx = Math.min(blood, node.values.length) - 1;
  return node.values[idx] ?? 0;
}

// Sum of a passive id across a body (e.g. armor from skin).
function _passiveSum(body, isPlayer, pid) {
  let total = 0;
  for (const [slotKey, slot] of Object.entries(body.slots)) {
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const def = organResolver(slot.organId);
    if (def?.passive?.id === pid) total += _value(def, slotKey, isPlayer, 'passive');
  }
  return total;
}

export function armorOf(body, isPlayer)   { return _passiveSum(body, isPlayer, 'armor'); }
export function evasionOf(body, isPlayer) { return Math.min(0.85, _passiveSum(body, isPlayer, 'dodge') / 100); }

function _healWorst(body, amount, source) {
  let worstSlot = null, worstHp = Infinity;
  for (const [key, s] of Object.entries(body.slots)) {
    if (!s || (s.hp !== null && s.hp <= 0)) continue;
    const d = organResolver(s.organId); if (!d) continue;
    const hp = s.hp ?? d.maxHp;
    if (hp >= d.maxHp) continue;
    if (hp < worstHp) { worstHp = hp; worstSlot = key; }
  }
  if (!worstSlot) return;
  const s = body.slots[worstSlot], d = organResolver(s.organId);
  const healed = Math.min(amount, d.maxHp - (s.hp ?? d.maxHp));
  s.hp = Math.min(d.maxHp, (s.hp ?? d.maxHp) + amount);
  emit({ type: 'ORGAN_HEALED', source: 'ability', target: 'player',
         data: { slotKey: worstSlot, amount: healed, source }, priority: PRIORITY.ACTION });
}

// ── Player skill (click-triggered, organ fully charged) ───────────────────────
export function playerSkill(slotKey, mobId, targetSlotKey) {
  const slot = WS.player.body?.slots?.[slotKey];
  if (!slot || (slot.hp !== null && slot.hp <= 0)) return { ok: false };
  const def = organResolver(slot.organId);
  const sk  = def?.skill;
  if (!sk || !sk.kind) return { ok: false };

  const mob = WS.mobs.get(mobId);
  if (!mob || mob.lifecycle !== 'active') return { ok: false };

  const playerBody = WS.player.body;
  const value = _value(def, slotKey, true, 'skill');

  const _resolveTarget = (preferred) => {
    if (preferred && mob.body.slots[preferred] && (mob.body.slots[preferred].hp ?? 1) > 0) return preferred;
    return _autoTarget(mob.body);
  };

  switch (sk.kind) {
    case 'attack': {
      const pierce = !!sk.pierce || (def.abilities ?? []).includes('pierce_layer');
      const aimed  = pierce ? _targetDeepOrMid(mob.body) : _resolveTarget(targetSlotKey);
      if (!aimed) return { ok: false };

      // Defender evasion (mob legs)
      if (rng() < evasionOf(mob.body, false)) {
        emit({ type: 'ATTACK_MISSED', source: 'player', target: mobId,
               data: { slotKey: aimed }, priority: PRIORITY.ACTION });
        return { ok: true, miss: true };
      }

      const armApplies   = !pierce && ORGAN_SLOTS[aimed].layer === 'outer';
      const armReduction = armApplies ? (armorOf(mob.body, false) + (mob.buffArm ?? 0)) : 0;
      const dmg = Math.max(1, value - armReduction);

      _applyDamage(mob.body, aimed, dmg);
      if (mob.isBoss) BossSystem.checkPhase2(mob);
      emit({ type: 'ORGAN_DAMAGED', source: 'player', target: mobId,
             data: { slotKey: aimed, dmg, organId: mob.body.slots[aimed]?.organId, skill: slotKey },
             priority: PRIORITY.ACTION });

      if (sk.lifesteal && dmg > 0) _healWorst(playerBody, dmg, 'life_steal');

      const s = mob.body.slots[aimed];
      if (s && s.hp <= 0) _onOrganDestroyed(mob, aimed);
      if (!_isMobAlive(mob)) _onMobDied(mob);
      return { ok: true, dmg };
    }

    case 'dodge': {
      WS.battle.buffDodge += Math.max(1, value);
      emit({ type: 'SKILL_DODGE', source: 'player', target: 'player',
             data: { slotKey, charges: Math.max(1, value) }, priority: PRIORITY.ACTION });
      return { ok: true };
    }

    case 'shield': {
      WS.battle.buffAbsorb += value;
      emit({ type: 'SKILL_HARDEN', source: 'player', target: 'player',
             data: { absorb: value }, priority: PRIORITY.ACTION });
      return { ok: true };
    }

    case 'heal': {
      _healWorst(playerBody, value, 'heal');
      return { ok: true };
    }

    case 'aim': {
      const aimAt = _resolveTarget(targetSlotKey);
      WS.battle.aimedSlot = aimAt;
      emit({ type: 'SKILL_AIM', source: 'player', target: 'player',
             data: { slotKey, aimedSlot: aimAt }, priority: PRIORITY.ACTION });
      return { ok: true };
    }

    case 'analyse': {
      let weakest = null, weakestRatio = 1.1;
      for (const [key, s] of Object.entries(mob.body.slots)) {
        if (!s || (s.hp !== null && s.hp <= 0)) continue;
        const oDef = organResolver(s.organId); if (!oDef) continue;
        const ratio = (s.hp ?? oDef.maxHp) / oDef.maxHp;
        if (ratio < weakestRatio) { weakestRatio = ratio; weakest = key; }
      }
      if (weakest) WS.battle.aimedSlot = weakest;
      emit({ type: 'ANALYSE', source: 'player', target: mobId,
             data: { slotKey: weakest, ratio: weakestRatio }, priority: PRIORITY.ACTION });
      return { ok: true };
    }

    case 'stall': {
      const prog = mob.organProgress ?? {};
      let stalledKey = null, bestRatio = -1;
      for (const [key, p] of Object.entries(prog)) {
        if (!p) continue;
        const ratio = p.chargedMs / Math.max(1, p.totalMs);
        if (ratio > bestRatio) { bestRatio = ratio; stalledKey = key; }
      }
      if (stalledKey && prog[stalledKey]) { prog[stalledKey].chargedMs = 0; prog[stalledKey].ready = false; }
      emit({ type: 'SKILL_LISTEN', source: 'player', target: mobId,
             data: { stalled: stalledKey }, priority: PRIORITY.ACTION });
      return { ok: true };
    }

    default:
      return { ok: false };
  }
}

// ── Mob organ skills (auto-fire at full charge, full tier) ────────────────────
export function fireMobOrganSkill(mob, slotKey) {
  const slot = mob.body.slots[slotKey];
  if (!slot || (slot.hp !== null && slot.hp <= 0)) return;
  const def = organResolver(slot.organId);
  if (!def?.skill || mob.lifecycle !== 'active') return;
  _doMobSkillEffect(mob, slotKey, def);
}

function _doMobSkillEffect(mob, slotKey, def) {
  const sk = def.skill;
  if (!sk?.kind) return;
  const playerBody = WS.player.body;
  const value = _value(def, slotKey, false, 'skill');

  switch (sk.kind) {
    case 'attack': {
      let tk;
      if (mob.aimedSlot && (mob.aimedSlotExpiry ?? 0) > Date.now() &&
          playerBody.slots[mob.aimedSlot] && (playerBody.slots[mob.aimedSlot].hp ?? 1) > 0) {
        tk = mob.aimedSlot;
      } else {
        tk = _autoTarget(playerBody);
      }
      if (!tk) break;

      // ESQUIVER charges (guaranteed dodge) then passive evasion
      if ((WS.battle?.buffDodge ?? 0) > 0) {
        WS.battle.buffDodge--;
        emit({ type: 'DODGE', source: 'player', target: mob.id, data: { slotKey: tk, skill: true }, priority: PRIORITY.MOB });
        break;
      }
      if (rng() < evasionOf(playerBody, true)) {
        emit({ type: 'DODGE', source: 'player', target: mob.id, data: { slotKey: tk }, priority: PRIORITY.MOB });
        break;
      }

      const pierce     = !!sk.pierce || (def.abilities ?? []).includes('pierce_layer');
      const armApplies = !pierce && ORGAN_SLOTS[tk].layer === 'outer';
      let dmg = Math.max(1, value - (armApplies ? armorOf(playerBody, true) : 0));

      if (dmg > 0 && (WS.battle?.buffAbsorb ?? 0) > 0) {
        const ab = Math.min(WS.battle.buffAbsorb, dmg);
        WS.battle.buffAbsorb -= ab;
        dmg = Math.max(0, dmg - ab);
      }
      if (sk.lifesteal && dmg > 0) {
        // mob heals its worst organ
        let w = null, wr = 1.0;
        for (const [k, s] of Object.entries(mob.body.slots)) {
          if (!s || (s.hp !== null && s.hp <= 0)) continue;
          const d = organResolver(s.organId); if (!d) continue;
          const r = (s.hp ?? d.maxHp) / d.maxHp; if (r < wr) { wr = r; w = k; }
        }
        if (w) { const s = mob.body.slots[w], d = organResolver(s.organId); s.hp = Math.min(d.maxHp, (s.hp ?? d.maxHp) + dmg); }
      }

      if (dmg > 0) {
        _applyDamage(playerBody, tk, dmg);
        emit({ type: 'ORGAN_DAMAGED', source: mob.id, target: 'player',
               data: { slotKey: tk, dmg, skill: true, organId: playerBody.slots[tk]?.organId }, priority: PRIORITY.MOB });
        if ((playerBody.slots[tk]?.hp ?? 1) <= 0) _onPlayerOrganDestroyed(tk);
      }
      if (!playerBody.isAlive() && !AbilitySystem.checkHeartAbility(playerBody)) {
        emit({ type: 'PLAYER_DIED', source: 'combat', target: 'player', data: { killedBy: mob.id }, priority: PRIORITY.MOB });
      }
      break;
    }
    case 'dodge': {
      mob.buffDodge = (mob.buffDodge ?? 0) + 1;
      emit({ type: 'MOB_SKILL_FIRED', source: mob.id, target: mob.id, data: { type: 'dodge', mobId: mob.id }, priority: PRIORITY.MOB });
      break;
    }
    case 'shield': {
      mob.buffArm = (mob.buffArm ?? 0) + Math.max(1, value);
      mob.buffArmExpiry = Date.now() + 9000;
      emit({ type: 'MOB_SKILL_FIRED', source: mob.id, target: mob.id, data: { type: 'harden', mobId: mob.id }, priority: PRIORITY.MOB });
      break;
    }
    case 'heal': {
      let w = null, wr = 1.0;
      for (const [k, s] of Object.entries(mob.body.slots)) {
        if (!s || (s.hp !== null && s.hp <= 0)) continue;
        const d = organResolver(s.organId); if (!d) continue;
        const r = (s.hp ?? d.maxHp) / d.maxHp; if (r < wr) { wr = r; w = k; }
      }
      if (w) {
        const s = mob.body.slots[w], d = organResolver(s.organId);
        s.hp = Math.min(d.maxHp, (s.hp ?? d.maxHp) + Math.max(1, value));
        emit({ type: 'MOB_SKILL_FIRED', source: mob.id, target: mob.id, data: { type: 'heal', mobId: mob.id, slotKey: w }, priority: PRIORITY.MOB });
      }
      break;
    }
    case 'analyse': {
      let w = null, wr = 1.0;
      for (const [k, s] of Object.entries(playerBody.slots)) {
        if (!s || (s.hp !== null && s.hp <= 0)) continue;
        const d = organResolver(s.organId); if (!d) continue;
        const r = (s.hp ?? d.maxHp) / d.maxHp; if (r < wr) { wr = r; w = k; }
      }
      mob.aimedSlot = w; mob.aimedSlotExpiry = Date.now() + 9000;
      emit({ type: 'MOB_SKILL_FIRED', source: mob.id, target: 'player', data: { type: 'analyse', mobId: mob.id, slotKey: w }, priority: PRIORITY.MOB });
      break;
    }
    // 'aim' and 'stall' from mobs: no-op for now
  }
}

// --- Internals ---

function _isMobAlive(mob) {
  const heartSlot = mob.body.slots['heart'];
  if (heartSlot !== null) return heartSlot.hp === null || heartSlot.hp > 0;
  const brainSlot = mob.body.slots['brain'];
  if (brainSlot !== null) return brainSlot.hp === null || brainSlot.hp > 0;
  const organs = mob.body.equippedOrgans();
  if (!organs.length) return false;
  return organs.every(o => o.hp === null || o.hp > 0);
}

function _autoTarget(body) {
  for (const layer of ['outer', 'mid', 'deep']) {
    const candidates = Object.keys(ORGAN_SLOTS).filter(key => {
      const slot = body.slots[key];
      return slot && ORGAN_SLOTS[key].layer === layer && (slot.hp === null || slot.hp > 0);
    });
    if (candidates.length) return candidates[Math.floor(rng() * candidates.length)];
  }
  return null;
}

function _targetDeepOrMid(body) {
  for (const layer of ['mid', 'deep', 'outer']) {
    const candidates = Object.keys(ORGAN_SLOTS).filter(key => {
      const slot = body.slots[key];
      return slot && ORGAN_SLOTS[key].layer === layer && (slot.hp === null || slot.hp > 0);
    });
    if (candidates.length) return candidates[Math.floor(rng() * candidates.length)];
  }
  return null;
}

function _applyDamage(body, slotKey, dmg) {
  const slot = body.slots[slotKey];
  if (!slot) return;
  const organDef  = organResolver(slot.organId);
  const currentHp = slot.hp ?? (organDef?.maxHp ?? 0);
  body.setSlotHp(slotKey, Math.max(0, currentHp - dmg));
}

function _onOrganDestroyed(mob, slotKey) {
  if (mob.organProgress?.[slotKey]) {
    mob.organProgress[slotKey].chargedMs = 0;
    mob.organProgress[slotKey].ready     = false;
    const orgName = organResolver(mob.body.slots[slotKey]?.organId)?.name ?? slotKey;
    mob.intent = `✗ ${orgName} — interrompu`;
    emit({ type: 'SKILL_CANCELLED', source: 'player', target: mob.id, data: { slotKey }, priority: PRIORITY.ACTION });
  }
  emit({ type: 'ORGAN_DESTROYED', source: 'combat', target: mob.id,
         data: { slotKey, organId: mob.body.slots[slotKey]?.organId }, priority: PRIORITY.ACTION });
}

function _onPlayerOrganDestroyed(slotKey) {
  emit({ type: 'ORGAN_DESTROYED', source: 'combat', target: 'player',
         data: { slotKey, organId: WS.player.body.slots[slotKey]?.organId }, priority: PRIORITY.MOB });
}

function _onMobDied(mob) {
  mob.lifecycle = 'dead';
  if (WS.battle?.active) WS.battle.explCost++;

  const floor = WS.floors[mob.pos.floorIdx];
  if (floor) {
    const room = floor.cell(mob.pos.x, mob.pos.y);
    if (room) { room.removeMob(mob.id); if (room.mobIds.length === 0) room.markCleared(); }
  }

  const cadaverId = `cad_${mob.id}`;
  WS.cadavers.set(cadaverId, { id: cadaverId, mobId: mob.id, body: mob.body, lifecycle: 'fresh', pos: { ...mob.pos } });
  emit({ type: 'MOB_DIED', source: 'combat', target: mob.id, data: { cadaverId }, priority: PRIORITY.ACTION });
}
