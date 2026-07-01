// Shows organ or player-body details in the always-visible inspection panel (#insp-content).
// New model: organs are self-contained — skill/passive values scale per blood level,
// the heart produces the blood pool, armor/evasion come from passives.

import { organResolver, relic as getRelic } from '../registry.js';
import { WS } from '../WorldState.js';
import * as Blood from '../BattleEngine.js';
import { SLOT_FULL, TYPE_NOUN } from '../labels.js';

const _content = document.getElementById('insp-content');
const TIER_FR = { common: 'commun', rare: 'rare', epic: 'épique', legendary: 'légendaire' };
const PASSIVE_FR = { armor: 'Armure (réduction)', regen: 'Régénération', glow: 'Lueur' };
const ABILITY_FR = {
  echolocate:     'Écholocalisation — révèle les salles à 2 cases en explorant',
  see_invisible:  'Vision perçante — détecte et cible les ennemis invisibles',
  pierce_layer:   'Perforation — ignore l\'armure et frappe les couches profondes',
  heart_ultimate: 'Dernier souffle — survit une fois à la mort (1 PV, 1×/run)',
  lich_revive:    'Résurrection — à la mort, tous les organes remontent à 50% (1×/run)',
  acid_resist:    'Résistance acide — immunité aux environnements acides',
};
const FLAW_FR = {
  slow_charge: 'Charge plus lente', bleeds: 'Saigne à l\'usage', loud: 'Bruyant',
  fragile: 'Fragile', blinding: 'Aveuglant', heavy: 'Lourd (ralentit)',
};

const RES_FR = { sang: 'Sang', blood: 'Sang', protection: 'Protection', regen: 'Régénération',
                 frenesie: 'Frénésie', meat: 'Viande', bile: 'Bile', saignement: 'Saignement', vulnerabilite: 'Vulnérabilité' };

// One-line French summary of what a skill's effect does (from the data schema).
function _effectStr(eff) {
  if (!eff) return '';
  const a = eff.amount;
  switch (eff.kind) {
    case 'damage':        return `Inflige ${a} dégâts${eff.pierce ? ' (perforant)' : ''}${eff.bleed ? ` + ${eff.bleed} Saignement` : ''}${eff.lifesteal ? ` · vol de vie ${eff.lifesteal}` : ''}`;
    case 'heal':          return `Soigne ${a} PV${eff.target === 'all' ? ' (tous les organes)' : ''}`;
    case 'protect':       return `Produit ${a} Protection`;
    case 'regen':         return `Accorde ${a} Régénération`;
    case 'frenesie':      return `Accorde ${a} Frénésie (+dégâts permanents)`;
    case 'blood':         return `Produit ${a} Sang`;
    case 'bile':          return `Applique ${a} Bile sur l'organe visé`;
    case 'saignement':    return `Applique ${a} Saignement sur l'organe visé`;
    case 'vulnerabilite': return `Applique ${a} Vulnérabilité sur l'organe visé`;
    case 'retrigger':     return `Redéclenche l'effet de l'organe ciblé`;
    case 'convert':       return `Convertit ${eff.fromAmount} ${RES_FR[eff.from] ?? eff.from} → ${eff.toAmount} ${RES_FR[eff.to] ?? eff.to}`;
    default:              return '';
  }
}

export function init() {}
export function close() {}

function _qualColor(name) {
  return { parfait:'var(--c-parfait)', intact:'var(--c-intact)', 'abîmé':'var(--c-abime)',
           cuit:'var(--c-cuit)', pourri:'var(--c-pourri)', destroyed:'var(--c-dead)' }[name] ?? 'inherit';
}
const _row  = (l, v, cls='') => `<div class="ins-row ${cls}"><span>${l}</span><span>${v}</span></div>`;
const _desc = (t, cls='insp-pos') => `<div class="ins-row ${cls}" style="flex-wrap:wrap"><span style="white-space:normal;line-height:1.4;flex:1">${t}</span></div>`;
const _chargeStr = (ch) => Array.isArray(ch) ? ch.map(v=>(v/1000).toFixed(1)).join(' / ')+' s' : (ch/1000).toFixed(1)+' s';

export function showOrgan(organId, currentHp, slotKey, onBack) {
  if (!organId) return;
  const def = organResolver(organId);
  if (!def) return;

  const hp        = currentHp ?? def.maxHp;
  const quality   = def.getQuality(hp);
  const slotLabel = slotKey ? (SLOT_FULL[slotKey] ?? slotKey) : (TYPE_NOUN[def.type] ?? def.type);
  const setStr    = def.set ? ` · ${def.set}` : '';

  let body = '';
  if (def.type === 'heart') body += _row('Produit', `${def.pool} Sang / tour`);
  if (def.maxBlood > 0)     body += _row('Sang max', `${def.maxBlood} 💉`);

  // Turn-start resource production (skin → Protection, etc.)
  for (const p of def.produces ?? []) {
    body += _row('Produit', `+${p.amount} ${RES_FR[p.resource] ?? p.resource} / tour`);
  }

  // Active skills — label, cost, what they do (from the effect) and the flavour text.
  for (const sk of def.skills ?? []) {
    const cost = (sk.cost ?? 0) > 0 ? `${sk.cost} Sang` : 'libre';
    body += `<div class="ins-section-head">${sk.label ?? 'Skill'} · ${cost}${sk.once ? ' · 1×/combat' : ''}</div>`;
    const effStr = _effectStr(sk.effect);
    if (effStr) body += _desc(effStr);
    if (sk.desc) body += _desc(sk.desc, 'insp-dim');
  }

  // Passives — label + description.
  for (const p of def.passives ?? []) {
    body += `<div class="ins-section-head">Passif — ${p.label ?? PASSIVE_FR[p.id] ?? p.id}</div>`;
    if (p.desc) body += _desc(p.desc, 'insp-dim');
  }
  // Abilities / triggers / flaw
  const abil = (def.abilities ?? []).filter(a => a !== 'strike' && a !== 'dodge')
    .map(a => _desc(ABILITY_FR[a] ?? a)).join('');
  const trig = (def.triggers ?? []).map(t => _desc(`${t.on} → ${t.do}`)).join('');
  const flaw = def.flaw ? _desc(`⚠ ${FLAW_FR[def.flaw] ?? def.flaw}`, 'insp-neg') : '';
  if (abil || trig || flaw) body += `<div class="ins-section-head">Effets</div>${abil}${trig}${flaw}`;

  const back = onBack ? '<button class="ins-back" id="ins-back-btn">← retour au corps</button>' : '';
  _content.innerHTML = `
    ${back}
    <div class="ins-name">${def.name}</div>
    <div class="ins-arc">${slotLabel} · ${TIER_FR[def.tier] ?? def.tier}${setStr}</div>
    <div class="ins-row"><span>État</span><span>${hp}/${def.maxHp} PV <span style="color:${_qualColor(quality.name)}">[${quality.name}]</span></span></div>
    ${body}
    <div class="ins-row insp-dim"><span>Revente</span><span>${def.getSellPrice(hp)} 💀</span></div>`;
  if (onBack) document.getElementById('ins-back-btn')?.addEventListener('click', onBack);
}

// Describe a relic effect in French from its data-driven `kind`.
function _relicEffectStr(e) {
  switch (e.kind) {
    case 'graft_cost':  return `Greffe : ${e.value} ticks au lieu de 5`;
    case 'auto_repair': return `Auto-réparation : +${e.amount ?? 1} PV tous les ${e.everyTicks ?? 20} ticks`;
    default:            return e.kind;
  }
}

export function showRelic(relicId, onBack) {
  const def = getRelic(relicId);
  if (!def) return;

  const effects = (def.effects ?? []).map(e => _desc(_relicEffectStr(e))).join('');
  const sell    = def.price != null ? Math.round(def.price * 0.5) : null;
  const back    = onBack ? '<button class="ins-back" id="ins-back-btn">← retour au corps</button>' : '';

  _content.innerHTML = `
    ${back}
    <div class="ins-name">✦ ${def.name}</div>
    <div class="ins-arc">relique · besace</div>
    ${effects ? `<div class="ins-section-head">Effets</div>${effects}` : ''}
    ${def.description ? _desc(def.description, 'insp-dim') : ''}
    ${sell != null ? `<div class="ins-row insp-dim"><span>Revente</span><span>${sell} 💀</span></div>` : ''}`;
  if (onBack) document.getElementById('ins-back-btn')?.addEventListener('click', onBack);
}

export function showBody(body) {
  if (!body) return;

  const pool = Blood.bloodPool();
  let prot = 0;
  for (const s of Object.values(body.slots ?? {})) {
    if (!s?.organId || (s.hp ?? 1) <= 0) continue;
    for (const p of organResolver(s.organId)?.produces ?? []) if (p.resource === 'protection') prot += p.amount ?? 0;
  }

  const combat = `
    <div class="ins-section-head">Combat</div>
    ${_row('Pool de sang', `${pool} 💉`)}
    ${_row('Protection / tour', prot > 0 ? `+${prot} 🛡` : '—')}`;

  const infected = Object.entries(body.slots ?? {}).filter(([,s])=>s?.infected).map(([k])=>k);
  const infHtml = infected.length ? _row('Infecté', infected.join(' · '), 'insp-neg') : '';

  _content.innerHTML = `
    <div class="ins-name">Corps</div>
    ${_battleSection()}
    ${combat}
    ${infHtml}`;
}

function _battleSection() {
  if (!WS.battle?.active) return '';
  const pool  = Blood.bloodPool();
  const spent = Blood.bloodSpent();

  const buffs = [];
  if ((WS.battle.buffAbsorb ?? 0) > 0) buffs.push(`absorb ${WS.battle.buffAbsorb}`);
  if (WS.battle.aimedSlot)             buffs.push(`→ [${WS.battle.aimedSlot}]`);

  return `<div class="ins-section-head" style="color:var(--torch-hot)">⚔ En combat · sang ${spent}/${pool}</div>
    ${buffs.length ? _row('Buffs actifs', buffs.join(' · '), 'insp-pos') : ''}`;
}
