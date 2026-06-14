import { WS, rng } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { emit, PRIORITY } from '../TriggerBus.js';
import { ORGAN_SLOTS } from '../entities/Body.js';
import * as BossSystem   from './BossSystem.js';
import * as AbilitySystem from './AbilitySystem.js';
import * as RelicSystem   from './RelicSystem.js';

// HP drained from the firing organ each time a skill is used (player AND mobs)
const SKILL_COST_BY_TYPE = {
  arm:     1,
  tongue:  1,
  legs:    1,
  eye:     1,
  ear:     1,
  brain:   1,
  stomach: 2,
  skin:    2,
  heart:   0,  // heart abilities are passive death-triggers, not manual skills
};
const PIERCE_COST = 2;  // pierce_layer costs one extra HP

// Mob skill names displayed in intent countdown
const MOB_SKILL_NAME = {
  arm:     'FRAPPE LOURDE',
  tongue:  'LANCER',
  legs:    'ESQUIVE',
  skin:    'DURCIR',
  heart:   'SOINS',
  stomach: 'RÉGÉNÈRE',
  brain:   'ANALYSE',
  eye:     'VISER',
  ear:     'ÉCOUTER',
};

// Hit-chance formula (SPEC): aimed = 0.5 + 0.05×PRC (capped at 0.95)
// Unaimed: random reachable organ (first non-empty layer), no PRC check.
// ARM only reduces damage when the targeted slot is in the outer layer (or cartilage_fossile).
// pierce_layer ability negates ARM reduction entirely.

// Auto-attack fired by BattleEngine each beat.
// Uses WS.battle.aimedSlot (set by VISER skill) if present, then clears it.
export function playerAutoAttack(mobId) {
  const mob = WS.mobs.get(mobId);
  if (!mob || mob.lifecycle !== 'active') return { ok: false, reason: 'no_target' };

  if (mob.invisible && !AbilitySystem.playerCanSeeInvisible(WS.player.body)) {
    if (rng() > 0.3) {
      emit({ type: 'ATTACK_MISSED', source: 'player', target: mobId,
             data: { invisible: true }, priority: PRIORITY.ACTION });
      return { ok: true, miss: true };
    }
  }

  // Mob esquive buff (from ESQUIVE skill)
  if ((mob.buffDodge ?? 0) > 0) {
    mob.buffDodge--;
    emit({ type: 'DODGE', source: mob.id, target: mobId,
           data: { mobDodge: true }, priority: PRIORITY.ACTION });
    return { ok: true, dodged: true };
  }

  const aimed = WS.battle?.aimedSlot ?? null;
  if (aimed) WS.battle.aimedSlot = null;

  const slotKey = aimed ?? _autoTarget(mob.body);
  if (!slotKey) return { ok: false, reason: 'no_targetable_organ' };

  const playerBody  = WS.player.body;
  const playerStats = playerBody.statsWith(organResolver);

  if (aimed) {
    const hitChance = Math.min(0.95, 0.5 + 0.05 * (playerStats.prc ?? 0));
    if (rng() > hitChance) {
      emit({ type: 'ATTACK_MISSED', source: 'player', target: mobId,
             data: { slotKey: aimed }, priority: PRIORITY.ACTION });
      return { ok: true, miss: true };
    }
  }

  const targetSlotDef = ORGAN_SLOTS[slotKey];
  const mobStats      = mob.body.statsWith(organResolver);
  const pierces       = AbilitySystem.playerHasPierceLayer(playerBody);
  const armApplies    = !pierces && RelicSystem.armAppliesToLayer(targetSlotDef.layer);
  const armReduction  = armApplies
    ? (mobStats.arm + (mob.buffArm ?? 0) + (WS.humeur === 'rigor_mortis' ? 2 : 0))
    : 0;
  const quality = _armQuality(playerBody);
  // Auto-attacks deal half damage — skills provide the burst
  const dmg = Math.max(1, Math.round((playerStats.dgt - armReduction) * quality * 0.5));

  _applyDamage(mob.body, slotKey, dmg);
  if (mob.isBoss) BossSystem.checkPhase2(mob);

  emit({ type: 'ORGAN_DAMAGED', source: 'player', target: mobId,
         data: { slotKey, dmg, organId: mob.body.slots[slotKey]?.organId },
         priority: PRIORITY.ACTION });

  const s = mob.body.slots[slotKey];
  if (s && s.hp <= 0) _onOrganDestroyed(mob, slotKey);
  if (!_isMobAlive(mob)) _onMobDied(mob);

  return { ok: true, dmg, slotKey };
}

// Skill activated by the player during battle (click-triggered, immediate).
// Returns { ok, cooldown?, dmg? } — BattleEngine stores the cooldown.
export function playerSkill(slotKey, mobId, targetSlotKey) {
  const slot = WS.player.body?.slots?.[slotKey];
  if (!slot || (slot.hp !== null && slot.hp <= 0)) return { ok: false };
  const def = organResolver(slot.organId);
  if (!def) return { ok: false };

  const type      = ORGAN_SLOTS[slotKey]?.type;
  const abilities = def.abilities ?? [];
  const mob       = WS.mobs.get(mobId);
  if (!mob || mob.lifecycle !== 'active') return { ok: false };

  const playerBody  = WS.player.body;
  const playerStats = playerBody.statsWith(organResolver);
  const mobStats    = mob.body.statsWith(organResolver);

  // Helper: resolve the target slot on the enemy body
  const _resolveTarget = (preferred) => {
    if (preferred && mob.body.slots[preferred] && (mob.body.slots[preferred].hp ?? 1) > 0)
      return preferred;
    return _autoTarget(mob.body);
  };

  switch (type) {
    case 'arm': {
      const pierce = abilities.includes('pierce_layer');
      const aimed  = pierce ? _targetDeepOrMid(mob.body) : _resolveTarget(targetSlotKey);
      if (!aimed) return { ok: false };

      const hitChance = Math.min(0.95, 0.5 + 0.05 * (playerStats.prc ?? 0));
      if (rng() > hitChance) {
        emit({ type: 'ATTACK_MISSED', source: 'player', target: mobId,
               data: { slotKey: aimed }, priority: PRIORITY.ACTION });
        _applySelfDamage(playerBody, slotKey, pierce ? PIERCE_COST : SKILL_COST_BY_TYPE.arm);
        return { ok: true, miss: true, cooldown: pierce ? 4 : 3 };
      }

      const targetDef    = ORGAN_SLOTS[aimed];
      const armApplies   = !pierce && RelicSystem.armAppliesToLayer(targetDef.layer);
      const armReduction = armApplies
        ? (mobStats.arm + (mob.buffArm ?? 0) + (WS.humeur === 'rigor_mortis' ? 2 : 0))
        : 0;
      const quality = _armQuality(playerBody);
      const mult    = pierce ? 2.0 : 3.0;
      const dmg     = Math.max(1, Math.round((playerStats.dgt - armReduction) * quality * mult));

      _applyDamage(mob.body, aimed, dmg);
      if (mob.isBoss) BossSystem.checkPhase2(mob);

      emit({ type: 'ORGAN_DAMAGED', source: 'player', target: mobId,
             data: { slotKey: aimed, dmg, organId: mob.body.slots[aimed]?.organId, skill: slotKey },
             priority: PRIORITY.ACTION });

      const s = mob.body.slots[aimed];
      if (s && s.hp <= 0) _onOrganDestroyed(mob, aimed);
      if (!_isMobAlive(mob)) _onMobDied(mob);

      _applySelfDamage(playerBody, slotKey, pierce ? PIERCE_COST : SKILL_COST_BY_TYPE.arm);
      return { ok: true, dmg, cooldown: 3 };
    }

    case 'legs': {
      WS.battle.buffDodge += 2;
      emit({ type: 'SKILL_DODGE', source: 'player', target: 'player',
             data: { slotKey, charges: 2 }, priority: PRIORITY.ACTION });
      _applySelfDamage(playerBody, slotKey, SKILL_COST_BY_TYPE.legs);
      return { ok: true, cooldown: 4 };
    }

    case 'brain': {
      let weakest = null, weakestRatio = 1.1;
      for (const [key, s] of Object.entries(mob.body.slots)) {
        if (!s || (s.hp !== null && s.hp <= 0)) continue;
        const oDef = organResolver(s.organId);
        if (!oDef) continue;
        const ratio = (s.hp ?? oDef.maxHp) / oDef.maxHp;
        if (ratio < weakestRatio) { weakestRatio = ratio; weakest = key; }
      }
      // Also aims the auto-attack at the weakest organ (brain = aim + analyse combo)
      if (weakest) WS.battle.aimedSlot = weakest;
      emit({ type: 'ANALYSE', source: 'player', target: mobId,
             data: { slotKey: weakest, ratio: weakestRatio }, priority: PRIORITY.ACTION });
      _applySelfDamage(playerBody, slotKey, SKILL_COST_BY_TYPE.brain);
      return { ok: true, cooldown: 3 };
    }

    case 'eye': {
      const aimAt = _resolveTarget(targetSlotKey);
      WS.battle.aimedSlot = aimAt;
      emit({ type: 'SKILL_AIM', source: 'player', target: 'player',
             data: { slotKey, aimedSlot: aimAt }, priority: PRIORITY.ACTION });
      _applySelfDamage(playerBody, slotKey, SKILL_COST_BY_TYPE.eye);
      return { ok: true, cooldown: 1 };
    }

    case 'ear': {
      // Stall the mob's telegraphed skill by 2 beats
      if (mob.scheduledSkill) {
        mob.scheduledSkill.countdown += 2;
        mob.intent = `⚔ ${mob.scheduledSkill.organName} [${mob.scheduledSkill.countdown}▸] ${mob.scheduledSkill.skillName}`;
      }
      emit({ type: 'SKILL_LISTEN', source: 'player', target: mobId,
             data: { intent: mob.intent ?? '?' }, priority: PRIORITY.ACTION });
      _applySelfDamage(playerBody, slotKey, SKILL_COST_BY_TYPE.ear);
      return { ok: true, cooldown: 3 };
    }

    case 'stomach': {
      const body = WS.player.body;
      let worstSlot = null, worstHp = Infinity;
      for (const [key, s] of Object.entries(body.slots)) {
        if (!s || (s.hp !== null && s.hp <= 0)) continue;
        const hp = s.hp ?? Infinity;
        if (hp < worstHp) { worstHp = hp; worstSlot = key; }
      }
      if (worstSlot) {
        const s    = body.slots[worstSlot];
        const oDef = organResolver(s.organId);
        if (oDef) {
          s.hp = Math.min(oDef.maxHp, (s.hp ?? oDef.maxHp) + 4);
          emit({ type: 'ORGAN_HEALED', source: 'ability', target: 'player',
                 data: { slotKey: worstSlot, amount: 4 }, priority: PRIORITY.ACTION });
        }
      }
      _applySelfDamage(playerBody, slotKey, SKILL_COST_BY_TYPE.stomach);
      return { ok: true, cooldown: 5 };
    }

    case 'tongue': {
      const aimed = _resolveTarget(targetSlotKey);
      if (!aimed) return { ok: false };

      const hitChance = Math.min(0.95, 0.5 + 0.05 * (playerStats.prc ?? 0));
      if (rng() > hitChance) {
        emit({ type: 'ATTACK_MISSED', source: 'player', target: mobId,
               data: { slotKey: aimed }, priority: PRIORITY.ACTION });
        _applySelfDamage(playerBody, slotKey, SKILL_COST_BY_TYPE.tongue);
        return { ok: true, miss: true, cooldown: 2 };
      }

      const targetLayer  = ORGAN_SLOTS[aimed]?.layer;
      const armApplies   = RelicSystem.armAppliesToLayer(targetLayer);
      const armReduction = armApplies
        ? (mobStats.arm + (mob.buffArm ?? 0) + (WS.humeur === 'rigor_mortis' ? 2 : 0))
        : 0;
      const quality = _armQuality(playerBody);
      const dmg     = Math.max(1, Math.round((playerStats.dgt - armReduction) * quality * 2.5));

      _applyDamage(mob.body, aimed, dmg);

      emit({ type: 'ORGAN_DAMAGED', source: 'player', target: mobId,
             data: { slotKey: aimed, dmg, organId: mob.body.slots[aimed]?.organId, skill: slotKey },
             priority: PRIORITY.ACTION });

      if (dmg > 0 && def.triggers?.some(t => t.do === 'life_steal')) {
        // Life steal: heal worst organ by the amount of damage dealt
        let worstSlot = null, worstHp = Infinity;
        for (const [key, s] of Object.entries(playerBody.slots)) {
          if (!s || (s.hp !== null && s.hp <= 0)) continue;
          const hp = s.hp ?? Infinity;
          if (hp < worstHp) { worstHp = hp; worstSlot = key; }
        }
        if (worstSlot) {
          const s    = playerBody.slots[worstSlot];
          const oDef = organResolver(s.organId);
          if (oDef) {
            const healed = Math.min(dmg, oDef.maxHp - (s.hp ?? oDef.maxHp));
            s.hp = Math.min(oDef.maxHp, (s.hp ?? oDef.maxHp) + dmg);
            emit({ type: 'ORGAN_HEALED', source: 'ability', target: 'player',
                   data: { slotKey: worstSlot, amount: healed, source: 'life_steal' }, priority: PRIORITY.ACTION });
          }
        }
      }

      const s = mob.body.slots[aimed];
      if (s && s.hp <= 0) _onOrganDestroyed(mob, aimed);
      if (!_isMobAlive(mob)) _onMobDied(mob);

      _applySelfDamage(playerBody, slotKey, SKILL_COST_BY_TYPE.tongue);
      return { ok: true, dmg, cooldown: 2 };
    }

    case 'skin': {
      WS.battle.buffAbsorb += 8;
      emit({ type: 'SKILL_HARDEN', source: 'player', target: 'player',
             data: { absorb: 8 }, priority: PRIORITY.ACTION });
      _applySelfDamage(playerBody, slotKey, SKILL_COST_BY_TYPE.skin);
      return { ok: true, cooldown: 5 };
    }

    default:
      return { ok: false };
  }
}

export function playerAttack(mobId, targetSlotKey = null) {
  const mob = WS.mobs.get(mobId);
  if (!mob || mob.lifecycle !== 'active') return { ok: false, reason: 'no_target' };

  // Invisible mob: 70% miss without see_invisible ability
  if (mob.invisible && !AbilitySystem.playerCanSeeInvisible(WS.player.body)) {
    if (rng() > 0.3) {
      emit({ type: 'ATTACK_MISSED', source: 'player', target: mobId,
             data: { slotKey: null, invisible: true }, priority: PRIORITY.ACTION });
      return { ok: true, miss: true };
    }
  }

  const playerBody  = WS.player.body;
  const playerStats = playerBody.statsWith(organResolver);

  const slotKey = targetSlotKey ?? _autoTarget(mob.body);
  if (!slotKey) return { ok: false, reason: 'no_targetable_organ' };

  // Aimed attack: apply PRC-based hit chance
  if (targetSlotKey !== null) {
    const prc      = playerStats.prc ?? 0;
    const hitChance = Math.min(0.95, 0.5 + 0.05 * prc);
    if (rng() > hitChance) {
      emit({ type: 'ATTACK_MISSED', source: 'player', target: mobId,
             data: { slotKey }, priority: PRIORITY.ACTION });
      return { ok: true, miss: true };
    }
  }

  const targetSlotDef = ORGAN_SLOTS[slotKey];
  const mobStats      = mob.body.statsWith(organResolver);
  const pierces       = AbilitySystem.playerHasPierceLayer(playerBody);
  const armApplies    = !pierces && RelicSystem.armAppliesToLayer(targetSlotDef.layer);
  // Rigor mortis: mobs have ARM +2
  const mobArmBonus  = WS.humeur === 'rigor_mortis' ? 2 : 0;
  const armReduction = armApplies ? (mobStats.arm + mobArmBonus) : 0;
  const quality       = _armQuality(playerBody);
  const dmg           = Math.max(1, Math.round((playerStats.dgt - armReduction) * quality));

  _applyDamage(mob.body, slotKey, dmg);

  if (mob.isBoss) BossSystem.checkPhase2(mob);

  emit({
    type:     'ORGAN_DAMAGED',
    source:   'player',
    target:   mobId,
    data:     { slotKey, dmg, organId: mob.body.slots[slotKey]?.organId },
    priority: PRIORITY.ACTION,
  });

  const slot = mob.body.slots[slotKey];
  if (slot && slot.hp <= 0) _onOrganDestroyed(mob, slotKey);
  if (!_isMobAlive(mob))    _onMobDied(mob);

  return { ok: true, dmg, slotKey };
}

export function mobAttack(mobId) {
  const mob = WS.mobs.get(mobId);
  if (!mob || mob.lifecycle !== 'active') return;

  const patternResult = BossSystem.handlePattern(mob);
  if (patternResult.skip) return;

  // Behavior modifier (non-bosses only)
  const behaviorMod = BossSystem.handleBehavior(mob);
  const dmgMult     = patternResult.dmgMult * behaviorMod.dmgMult;
  const extraAttacks = (patternResult.extraAttacks ?? 0) + (behaviorMod.extraAttacks ?? 0);
  const { hungerPenalty = 0, infects = false } = patternResult;
  const skipDodge  = behaviorMod.skipDodge ?? false;

  const playerBody = WS.player.body;
  const targetDeep = behaviorMod.targetDeep ?? false;

  // brain ANALYSE skill: mob targets a specific player slot for N beats
  let slotKey;
  if (mob.aimedSlot && playerBody.slots[mob.aimedSlot] && (playerBody.slots[mob.aimedSlot].hp ?? 1) > 0) {
    slotKey = mob.aimedSlot;
    mob.aimedSlotBeats = (mob.aimedSlotBeats ?? 1) - 1;
    if (mob.aimedSlotBeats <= 0) mob.aimedSlot = null;
  } else {
    slotKey = targetDeep ? _targetDeepOrMid(playerBody) : _autoTarget(playerBody);
  }
  if (!slotKey) return;

  // ESQUIVER buff: consume 1 dodge charge → mob attack misses entirely
  if ((WS.battle?.buffDodge ?? 0) > 0) {
    WS.battle.buffDodge--;
    emit({ type: 'DODGE', source: 'player', target: mobId,
           data: { slotKey, skill: true }, priority: PRIORITY.MOB });
    return;
  }

  // RYT riposte: if player waited last tick, parry is possible
  if (WS.player.lastActionType === 'WAIT') {
    const playerStats = playerBody.statsWith(organResolver);
    const rytStat     = (playerStats.ryt ?? 0) + RelicSystem.rytBonus();
    const parryChance = Math.min(0.6, 0.05 + rytStat * 0.1);
    if (rng() < parryChance) {
      const counterDmg  = Math.max(1, Math.round(playerStats.dgt * 0.5));
      const mobSlotKey  = _autoTarget(mob.body);
      if (mobSlotKey) {
        _applyDamage(mob.body, mobSlotKey, counterDmg);
        if (!_isMobAlive(mob)) _onMobDied(mob);
      }
      emit({ type: 'RIPOSTE', source: 'player', target: mobId,
             data: { dmg: counterDmg, slotKey: mobSlotKey }, priority: PRIORITY.MOB });
      return;
    }
  }

  // Dodge check — legs with dodge ability (unless charger skips dodge)
  if (!skipDodge) {
    const dodgeChance = AbilitySystem.playerDodgeChance(playerBody);
    if (dodgeChance > 0 && rng() < dodgeChance) {
      emit({ type: 'DODGE', source: 'player', target: mobId,
             data: { slotKey }, priority: PRIORITY.MOB });
      return;
    }
  }

  const mobStats    = mob.body.statsWith(organResolver);
  const targetLayer = ORGAN_SLOTS[slotKey].layer;
  const playerStats = playerBody.statsWith(organResolver);

  const armApplies  = RelicSystem.armAppliesToLayer(targetLayer);
  const armReduction  = armApplies ? playerStats.arm : 0;
  const membraneBonus = (targetLayer === 'outer') ? RelicSystem.outerDamageReduction() : 0;
  const quality       = _armQuality(mob.body);
  // Mobs always deal at least 1 damage — high ARM reduces but never negates completely
  let dmg = Math.max(1, Math.round((mobStats.dgt - armReduction) * quality * dmgMult) - membraneBonus);

  // DURCIR buff: absorb flat damage from next mob hit
  if (dmg > 0 && (WS.battle?.buffAbsorb ?? 0) > 0) {
    const absorbed = Math.min(WS.battle.buffAbsorb, dmg);
    WS.battle.buffAbsorb -= absorbed;
    dmg = Math.max(0, dmg - absorbed);
  }

  _applyDamage(playerBody, slotKey, dmg);

  // Side effects: infection + hunger drain
  if (infects) {
    const tSlot = playerBody.slots[slotKey];
    if (tSlot) tSlot.infected = true;
  }
  if (hungerPenalty > 0) {
    WS.player.satiete = Math.max(0, (WS.player.satiete ?? 0) - hungerPenalty);
  }

  if (dmg > 0) {
    emit({
      type:     'ORGAN_DAMAGED',
      source:   mobId,
      target:   'player',
      data:     { slotKey, dmg, organId: playerBody.slots[slotKey]?.organId },
      priority: PRIORITY.MOB,
    });
  }

  const slot = playerBody.slots[slotKey];
  if (slot && slot.hp <= 0) _onPlayerOrganDestroyed(slotKey);

  // Extra strikes (zone_burst / swarm)
  for (let i = 0; i < extraAttacks; i++) {
    if (!playerBody.isAlive()) break;
    const eKey = _autoTarget(playerBody);
    if (!eKey) break;
    const eDmg = Math.max(0, Math.round(dmg * 0.3) - membraneBonus);
    if (eDmg > 0) {
      _applyDamage(playerBody, eKey, eDmg);
      emit({ type: 'ORGAN_DAMAGED', source: mobId, target: 'player',
             data: { slotKey: eKey, dmg: eDmg }, priority: PRIORITY.MOB });
      const eSlot = playerBody.slots[eKey];
      if (eSlot && eSlot.hp <= 0) _onPlayerOrganDestroyed(eKey);
    }
  }

  // Death check: heart ability may prevent it
  if (!playerBody.isAlive()) {
    if (!AbilitySystem.checkHeartAbility(playerBody)) {
      emit({ type: 'PLAYER_DIED', source: 'combat', target: 'player',
             data: { killedBy: mobId }, priority: PRIORITY.MOB });
    }
  }
}

// --- Internals ---

function _isMobAlive(mob) {
  // Heart = primary vital organ
  const heartSlot = mob.body.slots['heart'];
  if (heartSlot !== null) {
    return heartSlot.hp === null || heartSlot.hp > 0;
  }
  // Brain = secondary vital organ (acts like heart when no heart present)
  const brainSlot = mob.body.slots['brain'];
  if (brainSlot !== null) {
    return brainSlot.hp === null || brainSlot.hp > 0;
  }
  // Fully heartless+brainless: dies when the first organ is destroyed
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

// ranged behavior: try to hit mid/deep first
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

function _armQuality(body) {
  const armL = body.slots['arm_l'];
  const armR = body.slots['arm_r'];
  if (!armL && !armR) return 0.5;

  const best = (!armL) ? armR : (!armR) ? armL :
    ((armL.hp ?? 0) >= (armR.hp ?? 0) ? armL : armR);

  const organDef = organResolver(best.organId);
  return organDef ? organDef.getQualityMult(best.hp ?? organDef.maxHp) : 1.0;
}

function _applyDamage(body, slotKey, dmg) {
  const slot = body.slots[slotKey];
  if (!slot) return;
  const organDef  = organResolver(slot.organId);
  const currentHp = slot.hp ?? (organDef?.maxHp ?? 0);
  body.setSlotHp(slotKey, Math.max(0, currentHp - dmg));
}

function _onOrganDestroyed(mob, slotKey) {
  // If the destroyed organ was powering the mob's telegraphed skill → cancel it
  if (mob.scheduledSkill?.slotKey === slotKey) {
    const cancelled = mob.scheduledSkill.skillName;
    mob.scheduledSkill = null;
    mob.intent = `✗ ${cancelled} — interrompu`;
    emit({ type: 'SKILL_CANCELLED', source: 'player', target: mob.id,
           data: { slotKey, skillName: cancelled }, priority: PRIORITY.ACTION });
  }

  emit({
    type:     'ORGAN_DESTROYED',
    source:   'combat',
    target:   mob.id,
    data:     { slotKey, organId: mob.body.slots[slotKey]?.organId },
    priority: PRIORITY.ACTION,
  });
}

function _onPlayerOrganDestroyed(slotKey) {
  emit({
    type:     'ORGAN_DESTROYED',
    source:   'combat',
    target:   'player',
    data:     { slotKey, organId: WS.player.body.slots[slotKey]?.organId },
    priority: PRIORITY.MOB,
  });
}

// --- Self-damage (skill HP cost) ---

function _applySelfDamage(body, slotKey, cost) {
  if (!cost) return;
  const slot = body.slots[slotKey];
  if (!slot) return;
  const def = organResolver(slot.organId);
  const hp  = slot.hp ?? (def?.maxHp ?? 1);
  body.setSlotHp(slotKey, Math.max(0, hp - cost));
  emit({ type: 'SKILL_HP_COST', source: 'ability', target: 'player',
         data: { slotKey, cost, newHp: body.slots[slotKey]?.hp ?? 0 },
         priority: PRIORITY.ACTION });
  if ((body.slots[slotKey]?.hp ?? 1) <= 0) _onPlayerOrganDestroyed(slotKey);
}

// --- Mob skill scheduling (called from BattleEngine each beat) ---

// Picks which organ/skill the mob will schedule next, based on brain AI type.
export function pickMobSkillOrgan(mob) {
  const SKILL_TYPES = new Set(['arm', 'tongue', 'legs', 'skin', 'heart', 'stomach', 'brain']);
  const candidates = [];
  for (const [slotKey, slot] of Object.entries(mob.body.slots)) {
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const def = organResolver(slot.organId);
    if (!def || !SKILL_TYPES.has(def.type)) continue;
    candidates.push({ slotKey, type: def.type, name: def.name });
  }
  if (!candidates.length) return null;

  const brainId  = mob.body.slots['brain']?.organId;
  const hpRatio  = _mobHpRatio(mob);

  if (brainId === 'brain_lich') {
    if (hpRatio < 0.4) {
      const def = candidates.find(c => ['skin', 'heart', 'stomach'].includes(c.type));
      if (def) return def;
    }
    const arms = candidates.filter(c => c.type === 'arm' || c.type === 'tongue');
    if (arms.length && rng() < 0.7) return arms[Math.floor(rng() * arms.length)];
  }
  if (brainId === 'brain_titan') {
    const arms = candidates.filter(c => c.type === 'arm');
    if (arms.length) return arms[Math.floor(rng() * arms.length)];
  }

  return candidates[Math.floor(rng() * candidates.length)];
}

// Returns the telegraph countdown (beats) based on mob's brain and RYT.
export function mobSkillCountdown(mob) {
  const brainSlot = mob.body.slots['brain'];
  const ryt       = mob.body.statsWith(organResolver)?.ryt ?? 0;
  if (!brainSlot) return Math.max(2, 6 - Math.floor(ryt / 3));
  switch (brainSlot.organId) {
    case 'brain_lich':  return 3;
    case 'brain_titan': return 7;
    default:            return 5;
  }
}

// Fires the mob's scheduled skill when countdown reaches 0.
export function executeMobScheduledSkill(mob) {
  const sched = mob.scheduledSkill;
  if (!sched) return;

  const slot = mob.body.slots[sched.slotKey];
  if (!slot || (slot.hp !== null && slot.hp <= 0)) {
    mob.scheduledSkill = null;
    return;
  }

  // Cost HP to mob organ (same rates as player)
  const cost    = SKILL_COST_BY_TYPE[sched.type] ?? 1;
  const current = slot.hp ?? (organResolver(slot.organId)?.maxHp ?? 1);
  mob.body.setSlotHp(sched.slotKey, Math.max(0, current - cost));
  if ((mob.body.slots[sched.slotKey]?.hp ?? 1) <= 0) _onOrganDestroyed(mob, sched.slotKey);

  // If the HP drain killed the mob, don't fire the skill effect
  if (!_isMobAlive(mob)) { _onMobDied(mob); mob.scheduledSkill = null; return; }
  if (mob.lifecycle === 'active') _doMobSkillEffect(mob, sched.type);
  mob.scheduledSkill = null;
}

function _doMobSkillEffect(mob, type) {
  const playerBody = WS.player.body;

  switch (type) {
    case 'arm':
    case 'tongue': {
      const slotKey = _autoTarget(playerBody);
      if (!slotKey) break;

      // ESQUIVER: consume 1 dodge charge → mob skill misses entirely
      if ((WS.battle?.buffDodge ?? 0) > 0) {
        WS.battle.buffDodge--;
        emit({ type: 'DODGE', source: 'player', target: mob.id,
               data: { slotKey, skill: true }, priority: PRIORITY.MOB });
        break;
      }

      const mobStats     = mob.body.statsWith(organResolver);
      const quality      = _armQuality(mob.body);
      const armApplies   = RelicSystem.armAppliesToLayer(ORGAN_SLOTS[slotKey].layer);
      const armReduction = armApplies ? playerBody.statsWith(organResolver)?.arm ?? 0 : 0;
      let dmg = Math.max(2, Math.round((mobStats.dgt - armReduction) * quality * 2.5));

      // DURCIR: absorb flat damage from mob skill
      if (dmg > 0 && (WS.battle?.buffAbsorb ?? 0) > 0) {
        const absorbed = Math.min(WS.battle.buffAbsorb, dmg);
        WS.battle.buffAbsorb -= absorbed;
        dmg = Math.max(0, dmg - absorbed);
      }

      if (dmg > 0) {
        _applyDamage(playerBody, slotKey, dmg);
        emit({ type: 'ORGAN_DAMAGED', source: mob.id, target: 'player',
               data: { slotKey, dmg, skill: true, organId: playerBody.slots[slotKey]?.organId },
               priority: PRIORITY.MOB });
        if ((playerBody.slots[slotKey]?.hp ?? 1) <= 0) _onPlayerOrganDestroyed(slotKey);
      }
      if (!playerBody.isAlive() && !AbilitySystem.checkHeartAbility(playerBody)) {
        emit({ type: 'PLAYER_DIED', source: 'combat', target: 'player',
               data: { killedBy: mob.id }, priority: PRIORITY.MOB });
      }
      break;
    }
    case 'legs': {
      mob.buffDodge = (mob.buffDodge ?? 0) + 1;
      emit({ type: 'MOB_SKILL_FIRED', source: mob.id, target: mob.id,
             data: { type: 'dodge', mobId: mob.id }, priority: PRIORITY.MOB });
      break;
    }
    case 'skin': {
      mob.buffArm      = (mob.buffArm ?? 0) + 4;
      mob.buffArmBeats = (mob.buffArmBeats ?? 0) + 3;
      emit({ type: 'MOB_SKILL_FIRED', source: mob.id, target: mob.id,
             data: { type: 'harden', mobId: mob.id }, priority: PRIORITY.MOB });
      break;
    }
    case 'heart':
    case 'stomach': {
      let worst = null, worstRatio = 1.0;
      for (const [key, s] of Object.entries(mob.body.slots)) {
        if (!s || (s.hp !== null && s.hp <= 0)) continue;
        const def   = organResolver(s.organId);
        if (!def) continue;
        const ratio = (s.hp ?? def.maxHp) / def.maxHp;
        if (ratio < worstRatio) { worstRatio = ratio; worst = key; }
      }
      if (worst) {
        const s   = mob.body.slots[worst];
        const def = organResolver(s.organId);
        if (def) s.hp = Math.min(def.maxHp, (s.hp ?? def.maxHp) + 2);
        emit({ type: 'MOB_SKILL_FIRED', source: mob.id, target: mob.id,
               data: { type: 'heal', mobId: mob.id, slotKey: worst, amount: 2 }, priority: PRIORITY.MOB });
      }
      break;
    }
    case 'brain': {
      let worst = null, worstRatio = 1.0;
      for (const [key, s] of Object.entries(playerBody.slots)) {
        if (!s || (s.hp !== null && s.hp <= 0)) continue;
        const def   = organResolver(s.organId);
        if (!def) continue;
        const ratio = (s.hp ?? def.maxHp) / def.maxHp;
        if (ratio < worstRatio) { worstRatio = ratio; worst = key; }
      }
      mob.aimedSlot      = worst;
      mob.aimedSlotBeats = 3;
      emit({ type: 'MOB_SKILL_FIRED', source: mob.id, target: 'player',
             data: { type: 'analyse', mobId: mob.id, slotKey: worst }, priority: PRIORITY.MOB });
      break;
    }
  }
}

function _mobHpRatio(mob) {
  let cur = 0, max = 0;
  for (const slot of Object.values(mob.body.slots)) {
    if (!slot) continue;
    const def = organResolver(slot.organId);
    if (!def) continue;
    cur += Math.max(0, slot.hp ?? def.maxHp);
    max += def.maxHp;
  }
  return max > 0 ? cur / max : 0;
}

function _onMobDied(mob) {
  mob.lifecycle = 'dead';
  if (WS.battle?.active) WS.battle.explCost++;

  const floor = WS.floors[mob.pos.floorIdx];
  if (floor) {
    const room = floor.cell(mob.pos.x, mob.pos.y);
    if (room) {
      room.removeMob(mob.id);
      if (room.mobIds.length === 0) room.markCleared();
    }
  }

  const cadaverId = `cad_${mob.id}`;
  WS.cadavers.set(cadaverId, {
    id:        cadaverId,
    mobId:     mob.id,
    body:      mob.body,
    lifecycle: 'fresh',
    pos:       { ...mob.pos },
  });

  emit({
    type:     'MOB_DIED',
    source:   'combat',
    target:   mob.id,
    data:     { cadaverId },
    priority: PRIORITY.ACTION,
  });
}
