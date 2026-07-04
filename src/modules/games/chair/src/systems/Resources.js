// Ressources de combat DATA-DRIVEN (content/resources.json, éditées dans
// l'atelier — onglet Ressources). Une ressource déclare TOUT son comportement :
//   polarite  : positif | negatif (pour le porteur — couleur/tri UI, blocages ciblés)
//   porteur   : entite (portefeuille du combattant) | organe (stacks par organe)
//   stockage  : champ HISTORIQUE explicite (pstate.blood, mob._bile…) — les
//               ressources créées dans l'atelier n'en ont pas (stockage générique)
//   max       : plafond de stacks (null = illimité)
//   expire    : jamais | finDeTour | finDuCombat
//   paiement  : organe (le coût est payé par l'organe qui joue le skill) | partout
//   decroissance : { quand: finDeTour|attaque, valeur }        (vulnérabilité…)
//   tick      : { quand: debutDeTour|finDeTour|attaque, degats:{valeur,parStack},
//                 soigne:{valeur,parStack,cible:porteur|pireOrgane},
//                 consomme, propageALaMort }                    (bile, saignement, régé…)
//   auGain    : { hp: {op: plus|moins|fois|divise, valeur} }    (au moment du gain, sur l'organe porteur)
//   absorbe   : { ratio }        — se consomme pour bloquer les dégâts (protection)
//   degatsSubis    : { op: plus|plafond, valeur, parStack }     (vulnérabilité, plafonds)
//   degatsInfliges : { op: plus|fois, valeur, parStack }        (frénésie)
//   soins          : { op: plus|fois, valeur, parStack }
//   gains     : { bloque: ['tous'|'positif'|'negatif'|id…],
//                 modifie: [{cible, op: plus|fois, valeur, parStack}] }
//   production: { parOrganes: true }  — produit au début du tour par les organes
//               (`produces` des organes, report = leur carryover) ; le Sang garde
//               sa production moteur (pool du cœur, voir bloodPool).
// Module PUR (aucun import) : combatRules et l'atelier consomment les mêmes défs.
// Les défauts ci-dessous ne sont qu'un filet AVANT chargement — resources.json
// est la source éditable (même modèle que DEFAULT_BALANCE).

export const DEFAULT_RESOURCES = [
  { id: 'sang', name: 'Sang', polarite: 'positif', porteur: 'entite', stockage: 'blood',
    expire: 'finDeTour', couleur: '#c23a30' },
  { id: 'viande', name: 'Viande', polarite: 'positif', porteur: 'entite', stockage: 'meat',
    expire: 'jamais', couleur: '#a06a42' },
  { id: 'protection', name: 'Protection', polarite: 'positif', porteur: 'entite', stockage: 'protection',
    expire: 'jamais', absorbe: { ratio: 1 }, production: { parOrganes: true }, couleur: '#7fa8c0' },
  { id: 'regeneration', name: 'Régénération', polarite: 'positif', porteur: 'entite', stockage: 'regen',
    expire: 'jamais', tick: { quand: 'debutDeTour', soigne: { valeur: 1, parStack: true, cible: 'pireOrgane' }, consomme: 1 }, couleur: '#5aa86a' },
  { id: 'frenesie', name: 'Frénésie', polarite: 'positif', porteur: 'entite', stockage: 'frenesie',
    expire: 'jamais', degatsInfliges: { op: 'plus', valeur: 1, parStack: true }, couleur: '#d07a2a' },
  { id: 'bile', name: 'Bile', polarite: 'negatif', porteur: 'organe', stockage: '_bile',
    expire: 'jamais', tick: { quand: 'finDeTour', degats: { valeur: 1, parStack: true }, consomme: 1, propageALaMort: true }, couleur: '#8aa02a' },
  { id: 'saignement', name: 'Saignement', polarite: 'negatif', porteur: 'organe', stockage: '_bleeds',
    expire: 'jamais', tick: { quand: 'attaque', degats: { valeur: 1, parStack: true }, consomme: 1 }, couleur: '#7a1813' },
  { id: 'vulnerabilite', name: 'Vulnérabilité', polarite: 'negatif', porteur: 'organe', stockage: '_vuln',
    expire: 'jamais', degatsSubis: { op: 'plus', valeur: 1, parStack: true }, decroissance: { quand: 'finDeTour', valeur: 1 }, couleur: '#c0b08a' },
];

let _defs = new Map(DEFAULT_RESOURCES.map((d) => [d.id, d]));
export function setResources(list) { if (Array.isArray(list) && list.length) _defs = new Map(list.map((d) => [d.id, d])); }
export function allResources() { return [..._defs.values()]; }
export function resDef(id) { return _defs.get(id) ?? null; }

// valeur d'un modificateur : parStack (défaut) → × stacks, sinon forfaitaire dès 1 stack
export function modVal(mod, stacks) { return (mod?.parStack ?? true) ? (mod?.valeur ?? 0) * stacks : (stacks > 0 ? (mod?.valeur ?? 0) : 0); }

// ── Stockage ENTITÉ — holder = pstate (joueur) ou mob._res (ennemi) ──
export function entGet(holder, id) {
  const d = resDef(id);
  if (!holder || !d) return 0;
  return (d.stockage ? holder[d.stockage] : holder.res?.[id]) ?? 0;
}
export function entSet(holder, id, v) {
  const d = resDef(id);
  if (!holder || !d) return;
  v = Math.max(0, v);
  if (d.max != null) v = Math.min(v, d.max);
  if (d.stockage) holder[d.stockage] = v;
  else (holder.res = holder.res ?? {})[id] = v;
}

// ── Stockage ORGANE — holder = combattant (mob) ou pstate (joueur) ──
function _bag(holder, d, create = false) {
  if (d.stockage) { if (create) holder[d.stockage] = holder[d.stockage] ?? {}; return holder[d.stockage]; }
  if (create) { holder._orgRes = holder._orgRes ?? {}; holder._orgRes[d.id] = holder._orgRes[d.id] ?? {}; }
  return holder._orgRes?.[d.id];
}
export function orgGet(holder, id, key) {
  const d = resDef(id);
  return (d && holder) ? (_bag(holder, d)?.[key] ?? 0) : 0;
}
export function orgSet(holder, id, key, v) {
  const d = resDef(id);
  if (!d || !holder) return;
  v = Math.max(0, v);
  if (d.max != null) v = Math.min(v, d.max);
  const b = _bag(holder, d, true);
  if (v > 0) b[key] = v; else delete b[key];
}
export function orgEntries(holder, id) {
  const d = resDef(id);
  return Object.entries((d && holder ? _bag(holder, d) : null) ?? {});
}
// Toutes les ressources d'organe présentes sur un slot (affichage/inspection).
export function orgAt(holder, key) {
  const out = [];
  for (const d of allResources()) {
    if (d.porteur !== 'organe') continue;
    const v = orgGet(holder, d.id, key);
    if (v > 0) out.push({ def: d, val: v });
  }
  return out;
}

// Une cible de blocage/modification matche-t-elle cette déf ?
function _cible(cible, d) { return cible === 'tous' || cible === d.polarite || cible === d.id; }

// ── GAIN (le seul chemin d'entrée) : blocages → modificateurs → plafond → auGain ──
// Les blocages/modificateurs viennent des ressources d'ENTITÉ déjà détenues par le
// receveur (gains.bloque / gains.modifie). Retourne le montant réellement gagné.
function _gainAmount(holder, d, n, ev) {
  for (const src of allResources()) {
    const have = entGet(holder, src.id);
    if (have <= 0 || !src.gains) continue;
    if ((src.gains.bloque ?? []).some((c) => _cible(c, d))) {
      ev?.push({ t: 'res_bloque', id: d.id, par: src.id });
      return 0;
    }
    for (const m of src.gains.modifie ?? []) {
      if (!_cible(m.cible ?? 'tous', d)) continue;
      n = m.op === 'fois' ? Math.round(n * (m.parStack ? Math.pow(m.valeur ?? 1, have) : (m.valeur ?? 1)))
                          : n + modVal(m, have);
    }
  }
  return Math.max(0, Math.round(n));
}
export function gainEnt(holder, id, n, ev) {
  const d = resDef(id);
  if (!d || n <= 0) return 0;
  const applique = _gainAmount(holder, d, n, ev);
  if (applique <= 0) return 0;
  entSet(holder, id, entGet(holder, id) + applique);
  ev?.push({ t: 'res', id, amount: applique });
  return applique;
}
// entHolder = portefeuille du receveur (blocages), orgHolder = porteur des sacs
// d'organes, body/organResolver pour l'effet auGain.hp sur l'organe porteur.
export function gainOrg(entHolder, orgHolder, body, id, key, n, organResolver, ev) {
  const d = resDef(id);
  if (!d || n <= 0) return 0;
  const applique = _gainAmount(entHolder ?? orgHolder, d, n, ev);
  if (applique <= 0) return 0;
  orgSet(orgHolder, id, key, orgGet(orgHolder, id, key) + applique);
  ev?.push({ t: 'res_org', id, key, amount: applique });
  // auGain.hp : ajuste les PV de l'organe porteur au moment du gain (× par stack gagné)
  const hp = d.auGain?.hp;
  if (hp && body?.slots?.[key]?.organId) {
    const s = body.slots[key];
    const mx = organResolver?.(s.organId)?.maxHp ?? s.hp ?? 1;
    let v = s.hp ?? mx;
    for (let i = 0; i < applique; i++) {
      v = hp.op === 'plus' ? v + (hp.valeur ?? 0)
        : hp.op === 'moins' ? v - (hp.valeur ?? 0)
        : hp.op === 'fois' ? v * (hp.valeur ?? 1)
        : hp.op === 'divise' ? v / Math.max(0.001, hp.valeur ?? 1) : v;
    }
    s.hp = Math.max(0, Math.min(mx, Math.round(v)));
    ev?.push({ t: 'res_hp', id, key, hp: s.hp });
  }
  return applique;
}

// ── COÛTS de skill : { resId: n } — entité au portefeuille ; organe selon
// def.paiement ('organe' = l'organe qui joue paie, 'partout' = tout le corps) ──
export function canPay(pstate, couts, organKey = null) {
  for (const [id, n] of Object.entries(couts ?? {})) {
    if (!(n > 0)) continue;
    const d = resDef(id);
    if (!d) return { ok: false, manque: id };
    const have = d.porteur === 'entite' ? entGet(pstate, id)
      : (d.paiement ?? 'organe') === 'organe' ? orgGet(pstate, id, organKey)
      : orgEntries(pstate, id).reduce((s, [, v]) => s + v, 0);
    if (have < n) return { ok: false, manque: id };
  }
  return { ok: true };
}
export function pay(pstate, couts, organKey = null) {
  for (const [id, n] of Object.entries(couts ?? {})) {
    if (!(n > 0)) continue;
    const d = resDef(id);
    if (!d) continue;
    if (d.porteur === 'entite') { entSet(pstate, id, entGet(pstate, id) - n); continue; }
    if ((d.paiement ?? 'organe') === 'organe') { orgSet(pstate, id, organKey, orgGet(pstate, id, organKey) - n); continue; }
    let du = n;
    for (const [key, v] of orgEntries(pstate, id)) {
      const prend = Math.min(v, du);
      orgSet(pstate, id, key, v - prend);
      du -= prend;
      if (du <= 0) break;
    }
  }
}

// ── PIPELINES de dégâts / soins ──
// Sortants (l'attaquant) : ressources d'entité + celles de l'organe qui frappe.
export function outgoingMods(pstate, organKey = null) {
  let plus = 0, fois = 1;
  for (const d of allResources()) {
    const m = d.degatsInfliges;
    if (!m) continue;
    const stacks = (d.porteur === 'entite' ? entGet(pstate, d.id) : orgGet(pstate, d.id, organKey));
    if (stacks <= 0) continue;
    if (m.op === 'fois') fois *= m.parStack ? Math.pow(m.valeur ?? 1, stacks) : (m.valeur ?? 1);
    else plus += modVal(m, stacks);
  }
  return { plus, fois };
}
// Entrants (la cible) : ressources de l'organe touché + d'entité. plafond = le
// plus bas déclaré (« les dégâts ne dépassent pas X »).
export function incomingMods(entHolder, orgHolder, key) {
  let plus = 0, plafond = null;
  for (const d of allResources()) {
    const m = d.degatsSubis;
    if (!m) continue;
    const stacks = d.porteur === 'entite' ? entGet(entHolder, d.id) : orgGet(orgHolder, d.id, key);
    if (stacks <= 0) continue;
    if (m.op === 'plafond') plafond = plafond == null ? (m.valeur ?? 0) : Math.min(plafond, m.valeur ?? 0);
    else plus += modVal(m, stacks);
  }
  return { plus, plafond };
}
// Absorption : chaque ressource `absorbe` se consomme pour bloquer ratio dégâts/stack.
export function absorb(entHolder, dmg, ev) {
  let soaked = 0;
  for (const d of allResources()) {
    if (!d.absorbe || dmg <= 0) continue;
    const stacks = entGet(entHolder, d.id);
    if (stacks <= 0) continue;
    const ratio = d.absorbe.ratio ?? 1;
    const bloc = Math.min(dmg, stacks * ratio);
    const conso = Math.ceil(bloc / ratio);
    entSet(entHolder, d.id, stacks - conso);
    dmg -= bloc; soaked += bloc;
    ev?.push({ t: 'res_absorb', id: d.id, amount: bloc });
  }
  return { dmg, soaked };
}
export function healMods(pstate, organKey = null) {
  let plus = 0, fois = 1;
  for (const d of allResources()) {
    const m = d.soins;
    if (!m) continue;
    const stacks = d.porteur === 'entite' ? entGet(pstate, d.id) : orgGet(pstate, d.id, organKey);
    if (stacks <= 0) continue;
    if (m.op === 'fois') fois *= m.parStack ? Math.pow(m.valeur ?? 1, stacks) : (m.valeur ?? 1);
    else plus += modVal(m, stacks);
  }
  return { plus, fois };
}

// ── EXPIRATION (finDeTour / finDuCombat) sur un portefeuille + sacs d'organes ──
export function expire(entHolder, orgHolder, quand) {
  for (const d of allResources()) {
    if (d.expire !== quand) continue;
    if (d.porteur === 'entite') entSet(entHolder, d.id, 0);
    else for (const [key] of orgEntries(orgHolder, d.id)) orgSet(orgHolder, d.id, key, 0);
  }
}

// Vue pour l'UI : une puce par ressource d'entité (le Sang toujours, les autres si > 0).
export function entChips(pstate) {
  const out = [];
  for (const d of allResources()) {
    if (d.porteur !== 'entite') continue;
    const val = entGet(pstate, d.id);
    if (d.id === 'sang' || val > 0) out.push({ def: d, val });
  }
  return out;
}
