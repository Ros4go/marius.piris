// Shows organ or player-body details in the always-visible inspection panel.
// Targets #insp-content (the inner content div). Never hidden.
// Default view (showBody): 10 stats dérivées + humanité, labels en français.

import { organResolver } from '../registry.js';
import { getActiveCurses } from '../systems/CurseSystem.js';
import { WS } from '../WorldState.js';

const _content = document.getElementById('insp-content');

const STAT_FR = {
  dgt: 'Dégâts', prc: 'Précision', per: 'Perception', oui: 'Ouïe',
  brt: 'Bruit',  vit: 'Vitesse',   arm: 'Armure',     fam: 'Faim',
  lum: 'Lueur',  ryt: 'Rythme',
};

const SLOT_FR = {
  arm_l: 'Bras gauche',    arm_r: 'Bras droit',
  eye_l: 'Œil gauche',     eye_r: 'Œil droit',
  ear_l: 'Oreille gauche', ear_r: 'Oreille droite',
  legs: 'Jambes', heart: 'Cœur', skin: 'Peau',
  brain: 'Cerveau', stomach: 'Estomac', tongue: 'Langue',
};

// Mechanical role of each slot — shown as a description under the organ name.
// Heart is handled dynamically in _slotRole() to show live BPM.
const SLOT_ROLE = {
  arm_l:   'Bras — frappe automatiquement à chaque battement. Chaque bras porte 2 objets dans l\'inventaire.',
  arm_r:   'Bras — frappe automatiquement à chaque battement. Chaque bras porte 2 objets dans l\'inventaire.',
  legs:    'Jambes — déplacement normal (1 tick). Sans elles, chaque déplacement coûte 2 ticks.',
  brain:   'Cerveau — mémorise la carte du donjon. Sans cerveau, les salles visitées disparaissent.',
  eye_l:   'Œil — améliore la Perception (détecte les ennemis) et la Lueur bioluminescente.',
  eye_r:   'Œil — améliore la Perception (détecte les ennemis) et la Lueur bioluminescente.',
  ear_l:   'Oreille — améliore l\'Ouïe (détecte les sons lointains) et réduit le Bruit produit en marchant.',
  ear_r:   'Oreille — améliore l\'Ouïe (détecte les sons lointains) et réduit le Bruit produit en marchant.',
  stomach: 'Estomac — améliore le Métabolisme, ralentissant la perte de satiété.',
  tongue:  'Langue — permet de mordre en combat (attaque ciblée, peut atteindre n\'importe quel organe).',
  skin:    'Peau — couche extérieure : absorbe les coups avant tous les autres organes et protège les couches médiane et profonde.',
};

function _slotRole(slotKey, def) {
  return SLOT_ROLE[slotKey] ?? SLOT_ROLE[SLOT_TYPE[slotKey] ?? def.type] ?? null;
}

// Computed stat rows — one line per organ type showing what the organ concretely does right now.
// Uses the full body stats so values reflect the cumulative equipment.
function _computedRows(def, slotKey, hp) {
  const type = SLOT_TYPE[slotKey] ?? def.type;
  const body = WS.player?.body;
  if (!body) return '';

  const stats    = body.statsWith(organResolver);
  const qualMult = typeof def.getQualityMult === 'function' ? def.getQualityMult(hp) : 1.0;
  const dgt      = stats.dgt ?? 0;

  const _row = (label, value) =>
    `<div class="ins-row"><span>${label}</span><span>${value}</span></div>`;

  switch (type) {
    case 'arm': {
      const autoDmg = Math.max(1, Math.round(dgt * qualMult * 0.5));
      return _row('Attaque auto', `~${autoDmg} dmg / battement`);
    }
    case 'legs': {
      const dodgePct = Math.round(Math.min(40, 5 + (stats.vit ?? 0) * 2.5));
      return _row('Esquive', `${dodgePct}% des coups évités`);
    }
    case 'heart': {
      const beatMs  = Math.max(400, 1200 - (stats.ryt ?? 0) * 60);
      const beatSec = (beatMs / 1000).toFixed(1);
      const bpm     = Math.round(60000 / beatMs);
      return _row('Rythme', `1 attaque / ${beatSec}s · ${bpm} BPM`);
    }
    case 'eye': {
      const precPct = Math.round(Math.min(95, 50 + 5 * (stats.prc ?? 0)));
      return _row('Précision', `${precPct}% de touché (skills)`);
    }
    case 'ear': {
      const oui = stats.oui ?? 0;
      const ouiLabel = oui > 3 ? 'excellente' : oui > 1 ? 'bonne' : 'faible';
      return _row('Ouïe totale', `${oui > 0 ? '+' : ''}${oui} (${ouiLabel})`);
    }
    case 'brain': {
      const brt = stats.brt ?? 0;
      const brtLabel = brt > 3 ? 'très bruyant' : brt > 1 ? 'bruyant' : brt < 0 ? 'silencieux' : 'neutre';
      return _row('Bruit total', `${brt > 0 ? '+' : ''}${brt} (${brtLabel})`);
    }
    case 'stomach': {
      const fam = stats.fam ?? 0;
      const famLabel = fam > 0 ? 'faim plus lente' : fam < 0 ? 'faim plus rapide' : 'aucun effet';
      return _row('Métabolisme', `${fam > 0 ? '+' : ''}${fam} (${famLabel})`);
    }
    case 'tongue': {
      const dmg = Math.max(1, Math.round(dgt * qualMult));
      return _row('Morsure', `~${dmg} dmg / frappe`);
    }
    case 'skin': {
      const arm = stats.arm ?? 0;
      return _row('Armure totale', arm > 0 ? `−${arm} dmg reçus` : '0 (aucune réduction)');
    }
    default:
      return '';
  }
}

// Type lookup without importing ORGAN_SLOTS
const SLOT_TYPE = {
  arm_l: 'arm', arm_r: 'arm',
  eye_l: 'eye', eye_r: 'eye',
  ear_l: 'ear', ear_r: 'ear',
  legs: 'legs', heart: 'heart', skin: 'skin',
  brain: 'brain', stomach: 'stomach', tongue: 'tongue',
};

const TIER_FR = { common: 'commun', rare: 'rare', epic: 'épique', legendary: 'légendaire' };

// Abilities that are implicit (e.g. strike = just the auto-attack, already explained in SLOT_ROLE)
const ABILITY_HIDDEN = new Set(['strike', 'pierce_layer']); // pierce_layer shown via _skillDesc for arms

const ABILITY_FR = {
  echolocate:     'Écholocalisation — révèle les salles jusqu\'à 2 cases de distance en explorant',
  see_invisible:  'Vision perçante — les ennemis invisibles sont détectés et peuvent être attaqués',
  heart_ultimate: 'Dernier souffle — survit une fois à la mort avec 1 HP sur le cœur (1×/run)',
  lich_revive:    'Résurrection de Liche — à la mort, tous les organes remontent à 50% HP (1×/run)',
  acid_resist:    'Résistance acide — immunité aux dégâts des environnements acides',
};

// dodge description is dynamic — uses current body stats for a concrete %
function _dodgeDesc() {
  const body = WS.player?.body;
  const pct = body
    ? Math.round(Math.min(40, 5 + ((body.statsWith(organResolver).vit) ?? 0) * 2.5))
    : null;
  return pct !== null
    ? `Esquive passive — évite ${pct}% des coups ennemis (augmente avec la Vitesse, max 40%)`
    : 'Esquive passive — évite une part des coups ennemis, selon la Vitesse (max 40%)';
}

function _abilityDesc(key) {
  if (key === 'dodge') return _dodgeDesc();
  return ABILITY_FR[key] ?? key;
}

// Skill button description per organ type (what clicking it does in combat).
// Shows real computed damage when possible.
function _skillDesc(def, slotKey, hp) {
  const type = SLOT_TYPE[slotKey] ?? def.type;
  const hasPierce = def.abilities?.includes('pierce_layer');

  const body = WS.player?.body;
  const dgt = body ? (body.statsWith(organResolver).dgt ?? 0) : 0;
  const qualMult = typeof def.getQualityMult === 'function' ? def.getQualityMult(hp) : 1.0;

  switch (type) {
    case 'arm': {
      if (hasPierce) {
        const dmg = Math.max(1, Math.round(dgt * qualMult));
        return `Skill ESTOC — frappe un organe profond, ignore l'armure ennemie · ~${dmg} dmg · rechargé en 4 battements`;
      }
      const dmg = Math.max(1, Math.round(dgt * qualMult * 1.5));
      return `Skill FRAPPER — frappe lourde sur l'organe ciblé · ~${dmg} dmg · rechargé en 3 battements`;
    }
    case 'legs':
      return 'Skill ESQUIVER — bloque entièrement la prochaine attaque ennemie · rechargé en 5 battements';
    case 'brain':
      return 'Skill ANALYSER — révèle l\'organe le plus endommagé de l\'ennemi · rechargé en 4 battements';
    case 'eye':
      return 'Skill VISER — la prochaine attaque auto cible précisément l\'organe sélectionné · rechargé en 2 battements';
    case 'ear':
      return 'Skill ÉCOUTER — révèle ce que l\'ennemi va faire ce prochain battement · rechargé en 4 battements';
    case 'stomach':
      return 'Skill RÉGÉNÉRER — régénère 1 HP sur l\'organe le plus endommagé du corps · rechargé en 6 battements';
    case 'tongue': {
      const dmg = Math.max(1, Math.round(dgt * qualMult));
      return `Skill MORDRE — morsure ciblée, peut atteindre n'importe quel organe · ~${dmg} dmg · rechargé en 3 battements`;
    }
    case 'skin':
      return 'Skill DURCIR — absorbe les 3 prochains points de dégâts ennemis · rechargé en 6 battements';
    case 'heart':
      return null;
    default:
      return null;
  }
}

const CURSE_FR = {
  hunger_x2: 'Faim doublée — la satiété se consomme 2× plus vite',
  heal_hurts: 'Les soins blessent — les effets de soin infligent des dégâts',
  paranoia:   'Paranoïa — hallucinations plus fréquentes et plus précoces',
};

function _triggerFr(t) {
  if (t.on === 'onKill' && t.do === 'purge_infection')
    return 'Au kill — purge toutes les infections du corps';
  if (t.on === 'onKill' && t.do === 'life_steal')
    return 'Morsure voleuse — chaque morsure qui touche régénère 1 HP sur l\'organe le plus abîmé';
  return `${t.on} → ${t.do}`;
}

export function init() {
  // No-op: showBody is called from main.js render() after each tick.
}

export function showOrgan(organId, currentHp, slotKey) {
  if (!organId) return;
  const def = organResolver(organId);
  if (!def) return;

  const hp        = currentHp ?? def.maxHp;
  const quality   = def.getQuality(hp);
  const slotLabel = slotKey ? (SLOT_FR[slotKey] ?? slotKey) : (SLOT_FR[def.type] ?? def.type);
  const tierLabel = TIER_FR[def.tier] ?? def.tier;
  const roleText  = _slotRole(slotKey, def);
  const skillDesc = _skillDesc(def, slotKey, hp);

  const _row = (desc, cls) =>
    `<div class="ins-row ${cls}" style="flex-wrap:wrap"><span style="white-space:normal;line-height:1.4;flex:1">${desc}</span></div>`;

  const skillRow = skillDesc ? _row(skillDesc, 'insp-pos') : '';

  const type = SLOT_TYPE[slotKey] ?? def.type;
  const abilityRows = (def.abilities ?? [])
    .filter(a => !ABILITY_HIDDEN.has(a) || (a === 'pierce_layer' && type !== 'arm'))
    .map(a => _row(_abilityDesc(a), 'insp-pos'))
    .join('');

  const curseRows = (def.curses ?? [])
    .map(c => _row(CURSE_FR[c] ?? c, 'insp-neg'))
    .join('');

  const triggerRows = (def.triggers ?? [])
    .map(t => _row(_triggerFr(t), 'insp-pos'))
    .join('');

  const hasAbilities = skillRow || abilityRows || curseRows || triggerRows;

  _content.innerHTML = `
    <div class="ins-name">${def.name}</div>
    <div class="ins-arc">${slotLabel} · ${tierLabel}</div>
    ${roleText ? `<div class="ins-role">${roleText}</div>` : ''}
    <div class="ins-row">
      <span>État</span>
      <span>${hp}/${def.maxHp} HP <span style="color:${_qualColor(quality.name)}">[${quality.name}]</span></span>
    </div>
    ${_statRows(def.stats)}
    ${_computedRows(def, slotKey, hp)}
    ${def.humanity !== 0 ? `<div class="ins-row"><span>Humanité</span><span class="${def.humanity < 0 ? 'insp-neg' : 'insp-pos'}">${def.humanity > 0 ? '+' : ''}${def.humanity}</span></div>` : ''}
    ${hasAbilities ? `<div class="ins-section-head">Capacités</div>${skillRow}${abilityRows}${curseRows}${triggerRows}` : ''}
    <div class="ins-row insp-dim"><span>Revente</span><span>${def.getSellPrice(hp)} 💀</span></div>
  `;
}

export function showBody(body) {
  if (!body) return;
  const stats    = body.statsWith(organResolver);
  const humanity = body.humanityWith(organResolver);
  const humCls   = humanity >= 60 ? 'insp-pos' : humanity < 30 ? 'insp-neg' : '';

  // --- Computed combat values ---
  const dgt       = stats.dgt ?? 0;
  const autoDmg   = Math.max(1, Math.round(dgt * 0.5));
  const beatMs    = Math.max(400, 1200 - (stats.ryt ?? 0) * 60);
  const beatSec   = (beatMs / 1000).toFixed(1);
  const precPct   = Math.round(Math.min(95, 50 + 5 * (stats.prc ?? 0)));
  const dodgePct  = Math.round(Math.min(40, 5 + (stats.vit ?? 0) * 2.5));
  const arm       = stats.arm ?? 0;

  const combatRows = `
    <div class="ins-section-head">Combat</div>
    <div class="ins-row"><span>Attaque auto</span><span>~${autoDmg} dmg · /${beatSec}s</span></div>
    <div class="ins-row"><span>Skills (visée)</span><span>${precPct}% touché</span></div>
    <div class="ins-row"><span>Esquive (passif)</span><span>${dodgePct}%</span></div>
    <div class="ins-row"><span>Armure (outer)</span><span>${arm > 0 ? `−${arm} dmg` : '—'}</span></div>
  `;

  // --- Passive / exploration stats ---
  const PASSIVE = [
    { k: 'per', label: 'Perception', hint: 'sens des proies' },
    { k: 'oui', label: 'Ouïe',       hint: 'détecte les sons' },
    { k: 'brt', label: 'Bruit',      hint: 'attire les ennemis' },
    { k: 'fam', label: 'Métabolisme',hint: 'résistance à la faim' },
    { k: 'lum', label: 'Lueur',      hint: 'bioluminescence' },
  ];
  const passiveRows = PASSIVE
    .map(({ k, label, hint }) => {
      const v = stats[k] ?? 0;
      return `<div class="ins-row insp-dim"><span title="${hint}">${label}</span><span>${v}</span></div>`;
    })
    .join('');

  // --- Curses ---
  const cursesHtml = [...getActiveCurses()]
    .map(c => `<div class="ins-row insp-neg"><span>Malé.</span><span>${CURSE_FR[c] ?? c}</span></div>`)
    .join('');

  const infectedKeys = Object.entries(body?.slots ?? {})
    .filter(([, s]) => s?.infected)
    .map(([k]) => k);
  const infectedHtml = infectedKeys.length
    ? `<div class="ins-row insp-neg"><span>Infecté</span><span>${infectedKeys.join(' · ')}</span></div>`
    : '';

  const battleHtml = _battleSection();

  _content.innerHTML = `
    <div class="ins-name">Corps</div>
    <div class="ins-arc ${humCls}">Humanité · ${humanity}/100</div>
    ${battleHtml}
    ${combatRows}
    <div class="ins-section-head">Exploration</div>
    ${passiveRows}
    ${cursesHtml}
    ${infectedHtml}
  `;
}

export function close() {
  // Intentional no-op — showBody() from render() will refresh on next tick.
}

function _battleSection() {
  if (!WS.battle?.active) return '';

  const cds = Object.entries(WS.battle.skillCooldowns ?? {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k} ${v}♥`)
    .join(' · ');

  const buffs = [];
  if ((WS.battle.buffDodge ?? 0) > 0)  buffs.push(`esquive ×${WS.battle.buffDodge}`);
  if ((WS.battle.buffAbsorb ?? 0) > 0) buffs.push(`absorb ${WS.battle.buffAbsorb}`);
  if (WS.battle.aimedSlot)             buffs.push(`→ [${WS.battle.aimedSlot}]`);

  return `
    <div class="ins-section-head" style="color:var(--torch-hot)">⚔ En combat · beat #${WS.battle.beatTick ?? 0}</div>
    ${cds ? `<div class="ins-row insp-neg"><span>Recharge</span><span>${cds}</span></div>` : ''}
    ${buffs.length ? `<div class="ins-row insp-pos"><span>Buffs actifs</span><span>${buffs.join(' · ')}</span></div>` : ''}
  `;
}

function _statRows(stats) {
  return Object.entries(stats ?? {})
    .map(([k, v]) => {
      const label = STAT_FR[k] ?? k;
      return `<div class="ins-row"><span>${label}</span><span class="${v > 0 ? 'insp-pos' : 'insp-neg'}">${v > 0 ? '+' : ''}${v}</span></div>`;
    })
    .join('');
}

function _qualColor(name) {
  return {
    parfait:   'var(--c-parfait)',
    intact:    'var(--c-intact)',
    'abîmé':  'var(--c-abime)',
    cuit:      'var(--c-cuit)',
    pourri:    'var(--c-pourri)',
    destroyed: 'var(--c-dead)',
  }[name] ?? 'inherit';
}
