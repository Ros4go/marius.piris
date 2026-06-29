// Shows organ or player-body details in the always-visible inspection panel (#insp-content).
// New model: organs are self-contained — skill/passive values scale per blood level,
// the heart produces the blood pool, armor/evasion come from passives.

import { organResolver } from '../registry.js';
import { WS } from '../WorldState.js';
import * as Blood from '../BattleEngine.js';
import { armorOf, evasionOf } from '../systems/CombatSystem.js';
import { SLOT_FULL, TYPE_NOUN } from '../labels.js';

const _content = document.getElementById('insp-content');
const TIER_FR = { common: 'commun', rare: 'rare', epic: 'épique', legendary: 'légendaire' };
const PASSIVE_FR = { armor: 'Armure (réduction)', dodge: 'Esquive %', regen: 'Régénération', glow: 'Lueur' };
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
  if (def.type === 'heart') body += _row('Produit', `${def.pool} 💉 (pool de sang)`);
  if (def.maxBlood > 0)     body += _row('Sang max', `${def.maxBlood} 💉`);

  // Active skill
  if (def.skill && def.skill.kind) {
    const sk   = def.skill;
    const flags = [sk.pierce ? 'perforant' : null, sk.lifesteal ? 'vol de vie' : null].filter(Boolean).join(', ');
    const vals = (sk.values ?? []).map((v,i)=>`${i+1}💉 → ${v}`).join(' · ');
    body += `<div class="ins-section-head">Skill — ${sk.label || sk.kind}${flags ? ` (${flags})` : ''}</div>`;
    body += _desc(`Valeurs par sang : ${vals || '—'}`);
    body += _row('Charge', _chargeStr(sk.charge));
  }
  // Passive
  if (def.passive) {
    const vals = (def.passive.values ?? []).map((v,i)=>`${i+1}💉 → ${v}`).join(' · ');
    body += `<div class="ins-section-head">Passif — ${PASSIVE_FR[def.passive.id] ?? def.passive.id}</div>`;
    body += _desc(`Valeurs par sang : ${vals || '—'}`);
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

export function showBody(body) {
  if (!body) return;

  const pool = Blood.bloodPool();
  const arm  = armorOf(body, true);
  const eva  = Math.round(evasionOf(body, true) * 100);

  const combat = `
    <div class="ins-section-head">Combat</div>
    ${_row('Pool de sang', `${pool} 💉`)}
    ${_row('Armure (couche externe)', arm > 0 ? `−${arm} dmg` : '—')}
    ${_row('Esquive', eva > 0 ? `${eva}%` : '—')}`;

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
  if ((WS.battle.buffDodge ?? 0) > 0)  buffs.push(`esquive ×${WS.battle.buffDodge}`);
  if ((WS.battle.buffAbsorb ?? 0) > 0) buffs.push(`absorb ${WS.battle.buffAbsorb}`);
  if (WS.battle.aimedSlot)             buffs.push(`→ [${WS.battle.aimedSlot}]`);

  return `<div class="ins-section-head" style="color:var(--torch-hot)">⚔ En combat · sang ${spent}/${pool}</div>
    ${buffs.length ? _row('Buffs actifs', buffs.join(' · '), 'insp-pos') : ''}`;
}
