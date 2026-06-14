import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';

// Returns behavior-based damage modifier for non-boss mobs.
// Used by CombatSystem alongside handlePattern.
export function handleBehavior(mob) {
  if (mob.isBoss) return { dmgMult: 1, skipDodge: false };
  switch (mob.behavior) {
    case 'charger':  return { dmgMult: 1.4, skipDodge: true };
    case 'fleer':    return { dmgMult: 0.6, skipDodge: false };
    case 'ranged':   return { dmgMult: 1.0, skipDodge: false, targetDeep: true };
    case 'ambusher': {
      if (!mob.ambushUsed) { mob.ambushUsed = true; return { dmgMult: 2.0, skipDodge: true }; }
      return { dmgMult: 1.0, skipDodge: false };
    }
    case 'swarm':    return { dmgMult: 0.5, skipDodge: false, extraAttacks: 1 };
    default:         return { dmgMult: 1.0, skipDodge: false };
  }
}

// Called in CombatSystem.mobAttack before applying damage.
// Returns { skip, dmgMult, extraAttacks?, hungerPenalty?, infects? }
export function handlePattern(mob) {
  if (!mob.pattern) return { skip: false, dmgMult: 1 };
  switch (mob.pattern) {
    case 'read_ahead':  return _readAhead(mob);
    case 'zone_burst':  return _zoneBurst(mob);
    case 'pulse_rhythm': return _pulseRhythm(mob);
    case 'devour':      return _devour(mob);
    case 'infect':      return _infect(mob);
    default:            return { skip: false, dmgMult: 1 };
  }
}

// Called in CombatSystem.playerAttack after applying damage.
export function checkPhase2(mob) {
  if (!mob.isBoss || mob.phase2Active) return;
  if (_hpRatio(mob) <= (mob.phase2Threshold ?? 0.5)) {
    mob.phase2Active = true;
    _triggerPhase2(mob);
  }
}

// --- Patterns ---

// La Langue: reads last player action type
function _readAhead(mob) {
  switch (WS.player.lastActionType) {
    case 'ATTACK': return { skip: false, dmgMult: 0.5 };
    case 'WAIT':   return { skip: false, dmgMult: 2.0 };
    case 'MOVE':   return { skip: true,  dmgMult: 1   };
    default:       return { skip: false, dmgMult: 1   };
  }
}

// Le Souffle: burst of weak hits spread across organs
// Phase 2 adds 2 extra strikes on top
function _zoneBurst(mob) {
  const bonus = mob.phase2Active ? 2 : 0;
  return { skip: false, dmgMult: 0.6, extraAttacks: 2 + bonus };
}

// Le Cœur: every 3rd attack is a devastating pulse
// Phase 2 resets counter so next hit is always the pulse
function _pulseRhythm(mob) {
  mob.attackCount = (mob.attackCount ?? 0) + 1;
  if (mob.attackCount % 3 === 0) return { skip: false, dmgMult: 3.0 };
  return { skip: false, dmgMult: 1.0 };
}

// La Faim: drains satiety alongside dealing damage
// Phase 2 doubles the hunger penalty
function _devour(mob) {
  const penalty = mob.phase2Active ? 20 : 10;
  return { skip: false, dmgMult: 1.0, hungerPenalty: penalty };
}

// La Flore: infects the struck organ (slow HP drain over time)
function _infect(mob) {
  return { skip: false, dmgMult: 1.0, infects: true };
}

// --- Phase 2 triggers ---

function _triggerPhase2(mob) {
  switch (mob.defId) {
    case 'boss_langue':  _phase2Langue(mob);  break;
    case 'boss_souffle': _phase2Souffle(mob); break;
    case 'boss_coeur':   _phase2Coeur(mob);   break;
    case 'boss_faim':    _phase2Faim(mob);    break;
    case 'boss_flore':   _phase2Flore(mob);   break;
    default: mob.intent = '★ PHASE 2'; break;
  }
}

function _phase2Langue(mob) {
  const free = ['arm_l', 'arm_r'].find(s => mob.body.slots[s] !== null);
  if (free && mob.body.slots['tongue'] === null) {
    mob.body.slots['tongue'] = { ...mob.body.slots[free] };
    mob.body.slots[free] = null;
  }
  mob.intent = '★ PHASE 2 — Reconfiguration';
}

function _phase2Souffle(mob) {
  // phase2Active flag already makes _zoneBurst add 2 extra attacks
  mob.intent = '★ PHASE 2 — Tempête respiratoire';
}

function _phase2Coeur(mob) {
  // Force next attack to be a pulse by setting counter to 2
  mob.attackCount = 2;
  mob.intent = '★ PHASE 2 — Rythme cardiaque erratique';
}

function _phase2Faim(mob) {
  // phase2Active flag already doubles hunger penalty in _devour
  mob.intent = '★ PHASE 2 — Faim absolue';
}

function _phase2Flore(mob) {
  // Infect all currently occupied player slots immediately
  for (const slot of Object.values(WS.player.body.slots)) {
    if (slot) slot.infected = true;
  }
  mob.intent = '★ PHASE 2 — Sporulation totale';
}

// --- Shared helpers ---

function _hpRatio(mob) {
  const organs = mob.body.equippedOrgans();
  if (!organs.length) return 0;
  let total = 0, cur = 0;
  for (const { organId, hp } of organs) {
    const def = organResolver(organId);
    if (!def) continue;
    total += def.maxHp;
    cur   += (hp ?? def.maxHp);
  }
  return total > 0 ? cur / total : 0;
}
