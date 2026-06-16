import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';

// Boss phase 2: when the boss drops below its threshold it sacrifices/reconfigures
// part of its body. Called from CombatSystem.playerSkill after applying damage.
export function checkPhase2(mob) {
  if (!mob.isBoss || mob.phase2Active) return;
  if (_hpRatio(mob) <= (mob.phase2Threshold ?? 0.5)) {
    mob.phase2Active = true;
    _triggerPhase2(mob);
  }
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

// La Langue: grafts a freed arm onto the empty tongue slot — its bar reconfigures.
function _phase2Langue(mob) {
  const free = ['arm_l', 'arm_r'].find(s => mob.body.slots[s] !== null);
  if (free && mob.body.slots['tongue'] === null) {
    mob.body.slots['tongue'] = { ...mob.body.slots[free] };
    mob.body.slots[free] = null;
  }
  mob.intent = '★ PHASE 2 — Reconfiguration';
}

function _phase2Souffle(mob) {
  mob.intent = '★ PHASE 2 — Tempête respiratoire';
}

function _phase2Coeur(mob) {
  mob.intent = '★ PHASE 2 — Rythme cardiaque erratique';
}

function _phase2Faim(mob) {
  mob.intent = '★ PHASE 2 — Faim absolue';
}

// La Flore: infects all currently occupied player slots immediately.
function _phase2Flore(mob) {
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
