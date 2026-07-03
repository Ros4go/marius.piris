// CHAIR · Atelier — outil de dev tout-en-un.
// Importe le VRAI moteur du jeu (combatRules, Faculties, registry) via Vite.
import organsJson from '../content/organs.json';
import setsJson   from '../content/sets.json';
import roomsJson  from '../content/rooms.json';
import biomesJson from '../content/biomes.json';
import relicsJson from '../content/relics.json';
import structuresJson from '../content/structures.json';
import scenesJson from '../content/scenes.json';
import tagsJson from '../content/tags.json';
import { ORGAN_SLOTS, ORGAN_TYPES } from '../src/entities/Body.js';
import * as CR from '../src/systems/combatRules.js';
import * as FAC from '../src/systems/Faculties.js';
import { loadDataRaw, organResolver as regOrganResolver } from '../src/registry.js';
import { WS } from '../src/WorldState.js';
import { itemLook, spriteStyle } from '../src/render/InventoryRenderer.js';
import tokensCss from '../styles/tokens.css?raw';
import hudCss from '../styles/hud.css?raw';

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, html = '') => {
  const e = document.createElement(tag);
  Object.assign(e, attrs); if (html) e.innerHTML = html; return e;
};
const deep = (o) => JSON.parse(JSON.stringify(o));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ═══════════════════════════════ WORKSPACE ═══════════════════════════════
const LS_KEY = 'chair_tool_drafts_v3';   // v3 : migration family/loot/cleared/structures — les vieux brouillons sont incompatibles
let DATA = { organs: deep(organsJson), sets: deep(setsJson), rooms: deep(roomsJson), relics: deep(relicsJson), structures: deep(structuresJson), tags: deep(tagsJson) };
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  if (saved?.organs) {
    DATA = saved;
    DATA.relics = DATA.relics ?? deep(relicsJson);           // brouillons d'avant l'onglet reliques
    DATA.structures = DATA.structures ?? deep(structuresJson); // idem structures
    DATA.tags = DATA.tags ?? deep(tagsJson);                 // idem tags
    // fusion douce : une relique ajoutée sur le disque (ex: relic_dechet_organique,
    // requise par HungerSystem) rejoint les vieux brouillons au lieu d'être écrasée au 💾
    for (const r of relicsJson) if (!DATA.relics.some((x) => x.id === r.id)) DATA.relics.push(deep(r));
    setStatus('brouillons localStorage restaurés', 'warn');
  }
} catch {}

function persist() {
  localStorage.setItem(LS_KEY, JSON.stringify(DATA));
  refreshRegistry();
}
function setStatus(msg, cls = 'ok') { $('#status').innerHTML = `<span class="${cls}">${esc(msg)}</span>`; }

// Le registry réel (utilisé par Faculties) est rechargé avec les brouillons.
function refreshRegistry() {
  loadDataRaw({ organs: DATA.organs, sets: DATA.sets, rooms: DATA.rooms, relics: DATA.relics, biomes: biomesJson });
}
refreshRegistry();

// organResolver maison pour combatRules (mêmes champs que le test headless)
const resolver = (id) => {
  const d = DATA.organs.find((o) => o.id === id);
  return d ? { id: d.id, type: d.type, name: d.name, layer: d.layer, maxHp: d.hp,
    pool: d.pool ?? 0, skills: d.skills ?? [], passives: d.passives ?? [], harvest: d.harvest ?? {}, tags: d.tags ?? [] } : null;
};

// ── sauvegarde disque (File System Access) + fallback téléchargement ──
const handles = {};
async function saveFile(name, data) {
  const json = JSON.stringify(data, null, 2);
  if (window.showSaveFilePicker) {
    try {
      if (!handles[name]) {
        handles[name] = await window.showSaveFilePicker({
          suggestedName: name, types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        });
      }
      const w = await handles[name].createWritable(); await w.write(json); await w.close();
      return true;
    } catch (e) { if (e.name === 'AbortError') return false; }
  }
  const a = el('a', { href: URL.createObjectURL(new Blob([json])), download: name }); a.click();
  return true;
}
$('#btn-save').onclick = async () => {
  setStatus('sauvegarde…', 'warn');
  const ok = [];
  if (await saveFile('organs.json', DATA.organs)) ok.push('organs');
  if (await saveFile('sets.json', DATA.sets)) ok.push('sets');
  if (await saveFile('rooms.json', DATA.rooms)) ok.push('rooms');
  if (await saveFile('relics.json', DATA.relics)) ok.push('relics');
  if (await saveFile('structures.json', DATA.structures)) ok.push('structures');
  if (await saveFile('tags.json', DATA.tags)) ok.push('tags');
  setStatus(ok.length ? `sauvé : ${ok.join(', ')}` : 'annulé', ok.length ? 'ok' : 'warn');
};
$('#btn-reset').onclick = () => {
  if (!confirm('Écraser les brouillons avec le contenu réel des JSON ?')) return;
  DATA = { organs: deep(organsJson), sets: deep(setsJson), rooms: deep(roomsJson), relics: deep(relicsJson), structures: deep(structuresJson), tags: deep(tagsJson) };
  persist(); renderOrgList(); renderRoomList(); renderRelicList(); renderStructList(); renderTagPage(); orgEditor(null); roomEditor(null); relicEditor(null); structEditor(null); simSlotsUI();
  setStatus('contenu réel rechargé');
};

// ═══════════════════════════════ TABS ═══════════════════════════════
document.querySelectorAll('.tab').forEach((b) => b.onclick = () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('.tabpane').forEach((p) => p.classList.toggle('on', p.id === 'pane-' + b.dataset.tab));
  if (b.dataset.tab === 'atlas') initAtlas();
});

// ═══════════════════════════════ CATALOGUE DE TAGS (tags.json) ═══════════════════════════════
// Source unique : DATA.tags (brouillons inclus) — plus aucune liste codée en dur.
const tagCat  = () => DATA.tags?.tags ?? {};
const tagDesc = (t) => tagCat()[t]?.description;

const EFFECT_KINDS = ['damage', 'heal', 'bile', 'saignement', 'vulnerabilite', 'protect', 'regen', 'frenesie', 'convert', 'blood', 'retrigger'];
// Formulaire par kind : [clé, label, type] — type: num | bool | sel:a:b
const EFFECT_FIELDS = {
  damage: [['amount', 'dégâts', 'num'], ['pierce', 'perce les couches', 'bool'], ['splash', 'éclabousse adjacents', 'num'],
           ['bleed', 'saignement infligé', 'num'], ['lifesteal', 'vol de vie', 'num'], ['meatOnKill', 'viande si kill', 'num'], ['costMeat', 'coût viande', 'num']],
  heal: [['amount', 'soin', 'num'], ['target', 'cible', 'sel::all'], ['costMeat', 'coût viande', 'num']],
  bile: [['amount', 'stacks', 'num']],
  saignement: [['amount', 'stacks', 'num']],
  vulnerabilite: [['amount', 'stacks', 'num']],
  protect: [['amount', 'protection', 'num']],
  regen: [['amount', 'régén', 'num']],
  frenesie: [['amount', 'frénésie', 'num']],
  blood: [['amount', 'sang gagné', 'num']],
  convert: [['from', 'depuis', 'sel:meat:blood'], ['fromAmount', 'quantité', 'num'], ['to', 'vers', 'sel:blood:meat'], ['toAmount', 'reçu', 'num']],
  retrigger: [],
};
// Définition de chaque mécanique (affichée dans le formulaire au choix du kind)
const KIND_DESC = {
  damage: 'Inflige des dégâts à un organe ennemi accessible (il faut briser la couche externe pour atteindre les couches profondes). Réduits par l\'armure sauf si "perce". Les bonus Frénésie, Vulnérabilité et point faible s\'ajoutent.',
  heal: 'Soigne un organe allié — le plus abîmé par défaut, ou tous les organes avec cible "all".',
  bile: 'Pose des stacks de Bile sur l\'organe ciblé : 1 dégât par tour, décroît de 1. À la mort de l\'organe porteur, la bile se propage en cascade aux organes voisins.',
  saignement: 'L\'organe ennemi saigne quand le mob attaque : il perd des PV à chaque utilisation, et le stack décroît à l\'usage (pas au tour).',
  vulnerabilite: '+1 dégât subi par stack sur cet organe, toutes sources confondues. Décroît de 1 par tour.',
  protect: 'Ajoute de la Protection : absorbe 1 dégât par point avant que tes organes n\'en perdent (le Bloc de Slay the Spire).',
  regen: 'Ajoute de la Régénération : soigne ton organe le plus abîmé à chaque début de tour, puis décroît.',
  frenesie: '+1 dégât par point sur TOUTES tes attaques, pour le reste du combat (la Force de Slay the Spire).',
  convert: 'Convertit une ressource en une autre, ex : 2 Viande → 3 Sang. Échoue si tu n\'as pas la quantité de départ.',
  blood: 'Gagne du Sang immédiatement, utilisable ce tour.',
  retrigger: 'Rejoue gratuitement la première compétence de l\'organe ciblé (ne peut pas rejouer un autre retrigger).',
};
// Liste d'effets d'un skill (compat : `effect` seul = liste de 1)
const skillEffects = (sk) => sk.effects ?? (sk.effect ? [sk.effect] : []);
// Réécrit le skill selon la convention : `effect` = miroir du 1er, `effects` seulement si >1
function writeEffects(sk, list) {
  sk.effect = list[0] ?? undefined;
  if (list.length > 1) sk.effects = list; else delete sk.effects;
}

// ── Zone "Visuel" : la cellule de besace EXACTEMENT comme en jeu ──
// Même code (InventoryRenderer.itemLook) + même CSS (tokens.css + hud.css) que le
// jeu, isolés du style de l'atelier par un shadow DOM (:root remappé sur :host).
// itemsFn est relu à chaque refresh() — l'aperçu suit les éditions du sprite.
function visuelZone(itemsFn) {
  const fs = el('fieldset'); fs.append(el('legend', {}, 'Visuel — cellule de besace (rendu réel)'));
  const host = el('div');
  const sh = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = tokensCss.replaceAll(':root', ':host') + hudCss;
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;gap:16px;align-items:flex-start;padding:4px 2px;';
  sh.append(style, wrap);
  const refresh = () => {
    wrap.innerHTML = '';
    for (const { item, label } of itemsFn()) {
      const look = itemLook(item);
      const box = document.createElement('div');
      box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:5px;width:56px;';
      const cell = document.createElement('div');
      cell.className = look.cls;
      cell.innerHTML = look.html;
      cell.title = look.title;
      cell.style.width = '48px';   // en jeu la taille vient de la grille .inv (aspect-ratio 1)
      const cap = document.createElement('div');
      cap.textContent = label;
      cap.style.cssText = 'font:9px "IBM Plex Mono","Courier New",monospace;color:#9a8a70;text-align:center;';
      box.append(cell, cap);
      wrap.append(box);
    }
  };
  refresh();
  fs.append(host);
  return { fs, refresh };
}

// ── Éditeur de sprite paramétrique ──
// Les préréglages sont les copies EXACTES des formes CSS historiques (hud.css
// .orgshape / .orgshape.eye / .relicshape / ancienne dechetshape) : chaque look
// existant se recrée en un clic, puis se dérive. Compilé par le MÊME spriteStyle()
// que le jeu — l'aperçu au-dessus est le rendu réel. Sans sprite : CSS par défaut.
const SPRITE_PRESETS = {
  organe:  { forme: '50% 50% 55% 45% / 60% 55% 45% 50%', degrade: { cx: 35, cy: 30, stops: [{ c: '#6e2c2b' }, { c: '#2a0f10' }] }, taille: 60 },
  oeil:    { forme: '50%', degrade: { cx: 50, cy: 50, stops: [{ c: '#b3a890', de: 26 }, { c: '#5d3820', de: 28, a: 50 }, { c: '#180a0a', de: 52 }] }, taille: 60 },
  relique: { forme: '46% 54% 50% 50% / 56% 46% 54% 44%', degrade: { cx: 38, cy: 30, stops: [{ c: '#f0dca0' }, { c: '#9a7a3a', de: 55 }, { c: '#3a2c12' }] }, taille: 60, eclat: { c: '#c9a440', alpha: 0.4, rayon: 6 } },
  dechet:  { forme: '52% 48% 44% 56% / 60% 52% 48% 40%', degrade: { cx: 40, cy: 32, stops: [{ c: '#7a5a30' }, { c: '#3a2a14', de: 60 }, { c: '#1a1208' }] }, taille: 60 },
};
const FORME_PRESETS = [
  ['50%', 'cercle (œil)'],
  ['50% 50% 55% 45% / 60% 55% 45% 50%', 'blob organe'],
  ['46% 54% 50% 50% / 56% 46% 54% 44%', 'éclat relique'],
  ['52% 48% 44% 56% / 60% 52% 48% 40%', 'motte (déchet)'],
  ['14%', 'carré arrondi'],
];
// Blob aléatoire : 8 rayons organiques, avec 1 chance sur 4 par rayon de partir
// dans l'extrême — c'est là que sortent les silhouettes loufoques.
const randForme = () => {
  const v = () => (Math.random() < 0.25 ? Math.round(5 + Math.random() * 90) : Math.round(28 + Math.random() * 44));
  return `${v()}% ${v()}% ${v()}% ${v()}% / ${v()}% ${v()}% ${v()}% ${v()}%`;
};

function spriteEditor(obj, onChange) {
  const box = el('div', { style: 'border-top:1px dashed var(--line);margin-top:8px;padding-top:8px' });
  const touch = () => { persist(); onChange(); };
  const render = () => {
    box.innerHTML = '';
    const sp = obj.sprite;
    // préréglage + retour au CSS par défaut
    const prRow = el('div', { className: 'frow' });
    prRow.append(el('label', {}, 'sprite'));
    const prSel = el('select');
    prSel.append(el('option', { value: '' }, sp ? 'personnalisé' : '(CSS par défaut)'));
    for (const k of Object.keys(SPRITE_PRESETS)) prSel.append(el('option', { value: k }, 'préréglage : ' + k));
    prSel.onchange = () => { if (!prSel.value) return; obj.sprite = deep(SPRITE_PRESETS[prSel.value]); touch(); render(); };
    prRow.append(prSel);
    if (sp) {
      const rm = el('button', { className: 'tiny danger', title: 'supprimer le sprite (revenir au CSS par défaut)' }, '✕ sprite');
      rm.onclick = () => { delete obj.sprite; touch(); render(); };
      prRow.append(rm);
    }
    box.append(prRow);
    if (!sp) {
      box.append(el('div', { className: 'muted' }, 'Sans sprite, l\'item garde la forme CSS historique. Pars d\'un préréglage pour la personnaliser.'));
      return;
    }
    // forme (border-radius) : texte libre + formes connues
    const fRow = el('div', { className: 'frow' });
    fRow.append(el('label', {}, 'forme'));
    const fInp = el('input', { className: 'wide', value: sp.forme ?? '', placeholder: 'border-radius (ex: 50% 50% 55% 45% / 60% 55% 45% 50%)' });
    fInp.oninput = () => { sp.forme = fInp.value; touch(); };
    const fSel = el('select');
    fSel.append(el('option', { value: '' }, 'formes…'));
    for (const [v, l] of FORME_PRESETS) fSel.append(el('option', { value: v }, l));
    fSel.onchange = () => { if (!fSel.value) return; sp.forme = fSel.value; fInp.value = fSel.value; fSel.value = ''; touch(); };
    const fRnd = el('button', { className: 'tiny', title: 'forme aléatoire — reclique jusqu\'à tomber sur une silhouette loufoque' }, '🎲');
    fRnd.onclick = () => { sp.forme = randForme(); fInp.value = sp.forme; touch(); };
    fRow.append(fInp, fSel, fRnd); box.append(fRow);
    // dégradé : 2 à 4 couleurs, positions optionnelles (deux = anneau net, cf œil)
    const dg = (sp.degrade = sp.degrade ?? { cx: 50, cy: 50, stops: [{ c: '#6e2c2b' }, { c: '#2a0f10' }] });
    dg.stops.forEach((st, i) => {
      const row = el('div', { className: 'frow' });
      row.append(el('label', {}, i === 0 ? 'couleurs' : ''));
      const c = el('input', { type: 'color', value: st.c ?? '#000000' });
      c.oninput = () => { st.c = c.value; touch(); };
      const de = el('input', { type: 'number', value: st.de ?? '', placeholder: 'de %', min: 0, max: 100, style: 'width:62px', title: 'début de la couleur (% du rayon, optionnel)' });
      de.oninput = () => { if (de.value === '') delete st.de; else st.de = +de.value; touch(); };
      const a = el('input', { type: 'number', value: st.a ?? '', placeholder: 'à %', min: 0, max: 100, style: 'width:62px', title: 'fin de la couleur (optionnel) — début + fin = anneau net, comme l\'iris de l\'œil' });
      a.oninput = () => { if (a.value === '') delete st.a; else st.a = +a.value; touch(); };
      row.append(c, de, a);
      if (dg.stops.length > 2) {
        const del = el('button', { className: 'tiny danger' }, '✕');
        del.onclick = () => { dg.stops.splice(i, 1); touch(); render(); };
        row.append(del);
      }
      if (i === dg.stops.length - 1 && dg.stops.length < 4) {
        const add = el('button', { className: 'tiny' }, '+ couleur');
        add.onclick = () => { dg.stops.push({ c: '#3a2c12' }); touch(); render(); };
        row.append(add);
      }
      box.append(row);
    });
    // lumière (centre du dégradé) + taille
    const slider = (label, title, get, set, min, max, unit = '') => {
      const row = el('div', { className: 'frow' });
      row.append(el('label', { title }, label));
      const s = el('input', { type: 'range', min, max, step: 1, value: get(), style: 'width:150px' });
      const num = el('span', { className: 'muted' }, get() + unit);
      s.oninput = () => { set(+s.value); num.textContent = s.value + unit; touch(); };
      row.append(s, num); return row;
    };
    box.append(slider('lumière x', 'position du point brillant du dégradé', () => dg.cx ?? 50, (v) => { dg.cx = v; }, 0, 100, '%'));
    box.append(slider('lumière y', '', () => dg.cy ?? 50, (v) => { dg.cy = v; }, 0, 100, '%'));
    box.append(slider('taille', 'taille dans la cellule de besace', () => sp.taille ?? 60, (v) => { sp.taille = v; }, 30, 100, '%'));
    // éclat (halo lumineux, cf reliques)
    const eRow = el('div', { className: 'frow' });
    eRow.append(el('label', {}, 'éclat'));
    const eCb = el('input', { type: 'checkbox', checked: !!sp.eclat });
    eCb.onchange = () => { if (eCb.checked) sp.eclat = { c: '#c9a440', alpha: 0.4, rayon: 6 }; else delete sp.eclat; touch(); render(); };
    eRow.append(eCb);
    if (sp.eclat) {
      const ec = el('input', { type: 'color', value: sp.eclat.c, title: 'couleur du halo' });
      ec.oninput = () => { sp.eclat.c = ec.value; touch(); };
      const ea = el('input', { type: 'range', min: 0.1, max: 1, step: 0.05, value: sp.eclat.alpha ?? 0.4, style: 'width:78px', title: 'intensité' });
      ea.oninput = () => { sp.eclat.alpha = +ea.value; touch(); };
      const er = el('input', { type: 'range', min: 2, max: 16, step: 1, value: sp.eclat.rayon ?? 6, style: 'width:78px', title: 'rayon (px)' });
      er.oninput = () => { sp.eclat.rayon = +er.value; touch(); };
      eRow.append(ec, ea, er);
    } else {
      eRow.append(el('span', { className: 'muted' }, 'halo lumineux (comme les reliques)'));
    }
    box.append(eRow);
    // calques : petites formes PAR-DESSUS (yeux, taches, détails), centrées sur
    // (x, y) en % de la forme de base — ⧉ duplique en miroir (le 2e œil)
    const cal = () => (sp.calques = sp.calques ?? []);
    (sp.calques ?? []).forEach((k, i) => {
      const row = el('div', { className: 'frow' });
      row.append(el('label', {}, i === 0 ? 'calques' : ''));
      const c = el('input', { type: 'color', value: k.c ?? '#100c0a', title: 'couleur du calque' });
      c.oninput = () => { k.c = c.value; touch(); };
      const num = (key, def, title) => {
        const n = el('input', { type: 'number', value: k[key] ?? def, min: -50, max: 150, style: 'width:52px', title });
        n.oninput = () => { k[key] = +n.value; touch(); };
        return n;
      };
      const fSel2 = el('select', { title: 'forme du calque' });
      for (const [v, l2] of [['50%', 'rond'], ['30%', 'arrondi'], ['0%', 'carré'], ['60% 40% 55% 45% / 50% 60% 40% 50%', 'blob'], ['50% 50% 50% 50% / 80% 80% 20% 20%', 'goutte']])
        fSel2.append(el('option', { value: v, selected: (k.forme ?? '50%') === v }, l2));
      fSel2.onchange = () => { k.forme = fSel2.value; touch(); };
      const rot = el('input', { type: 'number', value: k.rot ?? 0, min: -180, max: 180, style: 'width:52px', title: 'rotation (°)' });
      rot.oninput = () => { if (+rot.value) k.rot = +rot.value; else delete k.rot; touch(); };
      const mir = el('button', { className: 'tiny', title: 'dupliquer en miroir (x → 100−x) — parfait pour le 2e œil' }, '⧉');
      mir.onclick = () => { cal().splice(i + 1, 0, { ...k, x: 100 - (k.x ?? 50) }); touch(); render(); };
      const del = el('button', { className: 'tiny danger' }, '✕');
      del.onclick = () => { cal().splice(i, 1); if (!cal().length) delete sp.calques; touch(); render(); };
      row.append(c, num('x', 50, 'position x (%) — centre du calque'), num('y', 50, 'position y (%)'),
                 num('l', 20, 'largeur (%)'), num('h', 20, 'hauteur (%)'), fSel2, rot, mir, del);
      box.append(row);
    });
    const calRow = el('div', { className: 'frow' });
    calRow.append(el('label', {}, (sp.calques ?? []).length ? '' : 'calques'));
    const addCal = el('button', { className: 'tiny' }, '+ calque (point noir)');
    addCal.disabled = (sp.calques ?? []).length >= 8;
    addCal.onclick = () => { cal().push({ c: '#100c0a', x: 35, y: 40, l: 14, h: 14 }); touch(); render(); };
    calRow.append(addCal);
    if (sp.calques?.length) {
      const dcb = el('input', { type: 'checkbox', checked: !!sp.decoupe });
      dcb.onchange = () => { if (dcb.checked) sp.decoupe = true; else delete sp.decoupe; touch(); };
      const dl = el('label', { style: 'width:auto;font-size:11px', className: 'muted', title: 'ce qui dépasse la forme de base est coupé — décoché, les calques peuvent déborder (cornes, antennes)' });
      dl.append(dcb, document.createTextNode(' découper aux bords'));
      calRow.append(dl);
    } else {
      calRow.append(el('span', { className: 'muted' }, 'yeux, taches, détails posés par-dessus la forme'));
    }
    box.append(calRow);
  };
  render();
  return box;
}

// ═══════════════════════════════ ONGLET ORGANES ═══════════════════════════════
let orgSel = null;

function renderOrgList() {
  const q = ($('#org-search').value || '').toLowerCase();
  const box = $('#org-list'); box.innerHTML = '';
  for (const set of DATA.sets) {
    const members = DATA.organs.filter((o) => o.set === set.id &&
      (!q || o.name.toLowerCase().includes(q) || o.id.includes(q)));
    if (!members.length) continue;
    box.append(el('div', { className: 'grp' }, `${esc(set.name)} <span style="color:${set.color}">●</span>`));
    for (const o of members) {
      const it = el('div', { className: 'item' + (o.id === orgSel ? ' sel' : '') });
      it.append(el('span', { className: 'tierdot t-' + (o.tier || 'common') }));
      it.append(el('span', { className: 'nm' }, esc(o.name)));
      it.append(el('span', { className: 'id' }, esc(o.type) + ' · ' + (o.price ?? 0) + '🥩'));
      it.onclick = () => { orgSel = o.id; renderOrgList(); orgEditor(o); };
      box.append(it);
    }
  }
  const orphans = DATA.organs.filter((o) => !DATA.sets.some((s) => s.id === o.set));
  if (orphans.length) {
    box.append(el('div', { className: 'grp' }, '(set inconnu)'));
    for (const o of orphans) {
      const it = el('div', { className: 'item' }, `<span class="nm">${esc(o.name)}</span>`);
      it.onclick = () => { orgSel = o.id; renderOrgList(); orgEditor(o); };
      box.append(it);
    }
  }
}

function orgValidate(o) {
  const out = [];
  if (DATA.organs.filter((x) => x.id === o.id).length > 1) out.push(['bad', `id "${o.id}" dupliqué`]);
  if (!ORGAN_TYPES.includes(o.type)) out.push(['bad', `type "${o.type}" inconnu (${ORGAN_TYPES.join('/')})`]);
  const slotLayer = Object.values(ORGAN_SLOTS).find((s) => s.type === o.type)?.layer;
  if (slotLayer && o.layer !== slotLayer) out.push(['warn', `layer "${o.layer}" ≠ layer du slot "${slotLayer}"`]);
  const tags = o.tags ?? [];
  for (const t of tags) {
    const def = tagCat()[t];
    if (!def) { out.push(['warn', `tag "${t}" absent du catalogue`]); continue; }
    // prérequis MÊME-ORGANE définis en data (tags.json "prerequis")
    for (const r of def.prerequis ?? []) {
      if (r === 'gauche' || r === 'droite') continue;
      if (!tags.includes(r)) out.push(['bad', `${t} exige "${r}" sur le même organe`]);
    }
    if (def.oppose && tags.includes(def.oppose)) out.push(['warn', `${t} + ${def.oppose} : jauges opposées sur le même organe (elles s'annulent)`]);
    if (def.entite) out.push(['warn', `${t} est un tag d'ENTITÉ (mobs) — sans effet sur un organe du joueur`]);
  }
  for (const sk of o.skills ?? []) {
    const fxList = sk.effects ?? (sk.effect ? [sk.effect] : []);
    if (!fxList.length) out.push(['warn', `skill "${sk.id}" : aucun effet`]);
    for (const e of fxList) {
      if (!EFFECT_KINDS.includes(e?.kind)) out.push(['bad', `skill "${sk.id}" : kind "${e?.kind}" inconnu du moteur`]);
    }
    if (sk.effects && sk.effect !== sk.effects[0]) out.push(['warn', `skill "${sk.id}" : "effect" devrait refléter le 1er élément de "effects"`]);
  }
  const ticks = FAC.graftTicks(resolver(o.id) ?? { tags });
  out.push(['ok', `coût de greffe calculé : ${ticks} tick${ticks > 1 ? 's' : ''}`]);
  // Repères de prix : moyennes des autres organes du même tier / type
  const avg = (list) => Math.round(list.reduce((s, x) => s + (x.price ?? 0), 0) / list.length);
  const sameTier = DATA.organs.filter((x) => x.tier === o.tier && x.id !== o.id);
  const sameType = DATA.organs.filter((x) => x.type === o.type && x.id !== o.id);
  if (sameTier.length) out.push(['ok', `prix moyen du tier ${o.tier} : ${avg(sameTier)} viande (celui-ci : ${o.price ?? 0})`]);
  if (sameType.length) out.push(['ok', `prix moyen des organes "${o.type}" : ${avg(sameType)} viande`]);
  return out;
}

function orgEditor(o) {
  const ed = $('#org-editor');
  if (!o) { ed.innerHTML = '<p class="muted">Sélectionne un organe à gauche.</p>'; return; }
  ed.innerHTML = '';
  const F = (label, key, type = 'text', extra = {}) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', {}, label));
    const inp = el('input', { type, value: o[key] ?? '', ...extra });
    inp.oninput = () => { o[key] = type === 'number' ? +inp.value : inp.value; persist(); renderOrgList(); showWarns(); };
    row.append(inp); return row;
  };
  const fs1 = el('fieldset'); fs1.append(el('legend', {}, 'Identité'));
  fs1.append(F('id', 'id'), F('nom', 'name'), (() => {
    const row = el('div', { className: 'frow' }); row.append(el('label', {}, 'type'));
    const sel = el('select'); for (const t of ORGAN_TYPES) sel.append(el('option', { value: t, selected: o.type === t }, t));
    sel.onchange = () => { o.type = sel.value; persist(); renderOrgList(); showWarns(); };
    row.append(sel); return row;
  })(), (() => {
    const row = el('div', { className: 'frow' }); row.append(el('label', {}, 'set / tier'));
    const s1 = el('select'); for (const s of DATA.sets) s1.append(el('option', { value: s.id, selected: o.set === s.id }, s.name));
    const s2 = el('select'); for (const t of ['common', 'rare', 'epic', 'legendary']) s2.append(el('option', { value: t, selected: o.tier === t }, t));
    s1.onchange = () => { o.set = s1.value; persist(); renderOrgList(); };
    s2.onchange = () => { o.tier = s2.value; persist(); renderOrgList(); };
    row.append(s1, s2); return row;
  })(), F('hp', 'hp', 'number'), F('prix', 'price', 'number'), (() => {
    const row = el('div', { className: 'frow' }); row.append(el('label', {}, 'layer'));
    const sel = el('select'); for (const l of CR.LAYERS) sel.append(el('option', { value: l, selected: o.layer === l }, l));
    sel.onchange = () => { o.layer = sel.value; persist(); showWarns(); };
    row.append(sel); return row;
  })());
  ed.append(fs1);

  // Visuel : la cellule de besace telle qu'en jeu (3 états de qualité) + éditeur
  // de sprite paramétrique, aperçu rafraîchi à chaque édition
  if (regOrganResolver(o.id)) {
    const vz = visuelZone(() => {
      const d2 = regOrganResolver(o.id);   // relu à chaque refresh (sprite/tier à jour)
      if (!d2) return [];
      const maxHp = d2.maxHp ?? o.hp ?? 5;
      const hps = [...new Set([maxHp, Math.max(1, Math.round(maxHp * 0.45)), 1])];
      return hps.map((hp) => ({ item: { organId: o.id, hp }, label: `${d2.getQuality(hp).name} · ${hp} PV` }));
    });
    vz.fs.append(spriteEditor(o, vz.refresh));
    ed.append(vz.fs);
  }

  // tags
  const fs2 = el('fieldset'); fs2.append(el('legend', {}, 'Tags'));
  const chips = el('div', { className: 'chips' });
  const renderChips = () => {
    chips.innerHTML = '';
    for (const [i, t] of (o.tags ?? []).entries()) {
      const c = el('span', { className: 'chip', title: tagDesc(t) ?? '?' }, `<b>${esc(t)}</b> ✕`);
      c.onclick = () => { o.tags.splice(i, 1); persist(); renderChips(); showWarns(); };
      chips.append(c);
    }
  };
  renderChips();
  const addRow = el('div', { className: 'frow' });
  const inp = el('input', { placeholder: 'ajouter un tag…' });
  inp.setAttribute('list', 'taglist');
  let dl = $('#taglist');
  if (!dl) { dl = el('datalist', { id: 'taglist' }); document.body.append(dl); }
  dl.innerHTML = '';   // reconstruit à chaque édition : les tags créés dans l'onglet Tags apparaissent
  for (const [t, td] of Object.entries(tagCat())) dl.append(el('option', { value: t }, td.description ?? ''));
  const add = () => { const v = inp.value.trim(); if (!v) return; (o.tags = o.tags ?? []).push(v); inp.value = ''; persist(); renderChips(); showWarns(); };
  inp.onkeydown = (e) => { if (e.key === 'Enter') add(); };
  const btn = el('button', { className: 'tiny' }, '+'); btn.onclick = add;
  addRow.append(inp, btn);
  fs2.append(chips, addRow);
  ed.append(fs2);

  // skills
  const fs3 = el('fieldset'); fs3.append(el('legend', {}, 'Skills (cartes)'));
  const skbox = el('div');
  const renderSkills = () => {
    skbox.innerHTML = '';
    for (const [i, sk] of (o.skills ?? []).entries()) {
      const d = el('div', { className: 'skill' });
      const mk = (lbl, key, type = 'text', w = 120) => {
        const r = el('div', { className: 'frow' }); r.append(el('label', {}, lbl));
        const x = el('input', { type, value: sk[key] ?? '', style: `width:${w}px` });
        x.oninput = () => { sk[key] = type === 'number' ? +x.value : x.value; persist(); };
        r.append(x); return r;
      };
      d.append(mk('id', 'id'), mk('label', 'label'), mk('coût sang', 'cost', 'number', 60));
      const oncerow = el('div', { className: 'frow' }); oncerow.append(el('label', {}, 'once/combat'));
      const cb = el('input', { type: 'checkbox', checked: !!sk.once });
      cb.onchange = () => { sk.once = cb.checked || undefined; persist(); };
      oncerow.append(cb); d.append(oncerow);
      const descrow = el('div', { className: 'frow' }); descrow.append(el('label', {}, 'desc'));
      const dx = el('input', { className: 'wide', value: sk.desc ?? '' });
      dx.oninput = () => { sk.desc = dx.value; persist(); };
      descrow.append(dx); d.append(descrow);
      // ── Effets : formulaire par kind, multi-effets supportés ──
      const fxBox = el('div');
      const renderFx = () => {
        fxBox.innerHTML = '';
        const list = skillEffects(sk);
        for (const [fi, eff] of list.entries()) {
          const box = el('div', { style: 'border:1px dashed var(--line);border-radius:3px;padding:6px 8px;margin:6px 0' });
          const head = el('div', { className: 'frow' });
          head.append(el('label', {}, fi === 0 ? 'effet ' + (list.length > 1 ? '1 (principal)' : '') : 'effet ' + (fi + 1)));
          const ks = el('select');
          for (const k of EFFECT_KINDS) ks.append(el('option', { value: k, selected: eff.kind === k }, k));
          ks.onchange = () => { list[fi] = { kind: ks.value, ...(ks.value === 'damage' ? { target: 'enemy_organ' } : {}) };
            writeEffects(sk, list); persist(); renderFx(); showWarns(); };
          head.append(ks);
          if (list.length > 1) {
            const del = el('button', { className: 'tiny danger' }, '✕');
            del.onclick = () => { list.splice(fi, 1); writeEffects(sk, list); persist(); renderFx(); showWarns(); };
            head.append(del);
          }
          box.append(head);
          box.append(el('div', { className: 'muted', style: 'margin:2px 0 6px;max-width:420px;line-height:1.45' }, esc(KIND_DESC[eff.kind] ?? '')));
          for (const [key, lbl, type] of EFFECT_FIELDS[eff.kind] ?? []) {
            const row = el('div', { className: 'frow' });
            row.append(el('label', {}, lbl));
            if (type === 'bool') {
              const cb = el('input', { type: 'checkbox', checked: !!eff[key] });
              cb.onchange = () => { if (cb.checked) eff[key] = true; else delete eff[key]; writeEffects(sk, list); persist(); showWarns(); };
              row.append(cb);
            } else if (type.startsWith('sel')) {
              const opts = type.split(':').slice(1);
              const s = el('select');
              for (const o2 of opts) s.append(el('option', { value: o2, selected: (eff[key] ?? '') === o2 }, o2 || '(défaut)'));
              s.onchange = () => { if (s.value) eff[key] = s.value; else delete eff[key]; writeEffects(sk, list); persist(); showWarns(); };
              row.append(s);
            } else {
              const inp = el('input', { type: 'number', value: eff[key] ?? '', style: 'width:70px' });
              inp.oninput = () => { const v = inp.value; if (v === '' || +v === 0) delete eff[key]; else eff[key] = +v; writeEffects(sk, list); persist(); showWarns(); };
              row.append(inp);
            }
            box.append(row);
          }
          // accès expert : le JSON brut de cet effet
          const det = el('details'); det.append(el('summary', { className: 'muted', style: 'cursor:pointer;font-size:10px' }, 'json'));
          const ta = el('textarea', { value: JSON.stringify(eff), style: 'width:320px;height:36px' });
          ta.onchange = () => { try { list[fi] = JSON.parse(ta.value); writeEffects(sk, list); ta.style.borderColor = ''; persist(); renderFx(); showWarns(); } catch { ta.style.borderColor = 'var(--bad)'; } };
          det.append(ta); box.append(det);
          fxBox.append(box);
        }
        const add = el('button', { className: 'tiny' }, '+ effet');
        add.onclick = () => { list.push({ kind: 'damage', amount: 2, target: 'enemy_organ' }); writeEffects(sk, list); persist(); renderFx(); showWarns(); };
        fxBox.append(add);
      };
      renderFx();
      d.append(fxBox);
      const del = el('button', { className: 'tiny danger' }, 'supprimer le skill');
      del.onclick = () => { o.skills.splice(i, 1); persist(); renderSkills(); };
      d.append(del);
      skbox.append(d);
    }
  };
  renderSkills();
  const addSk = el('button', { className: 'tiny primary' }, '+ skill');
  addSk.onclick = () => {
    (o.skills = o.skills ?? []).push({ id: 'new_skill', label: 'Nouveau', cost: 1, desc: '', effect: { kind: 'damage', amount: 3, target: 'enemy_organ' } });
    persist(); renderSkills();
  };
  fs3.append(skbox, addSk);
  ed.append(fs3);

  // harvest + validation
  const fs4 = el('fieldset'); fs4.append(el('legend', {}, 'Récolte'));
  const hrow = el('div', { className: 'frow' }); hrow.append(el('label', {}, 'fragileTo'));
  const hx = el('input', { className: 'wide', value: (o.harvest?.fragileTo ?? []).join(', '), placeholder: 'fire, crush' });
  hx.oninput = () => { o.harvest = { ...(o.harvest ?? {}), fragileTo: hx.value.split(',').map((s) => s.trim()).filter(Boolean) }; persist(); };
  hrow.append(hx); fs4.append(hrow);
  ed.append(fs4);

  const wbox = el('div', { className: 'warns' });
  ed.append(el('h3', {}, 'Validation'), wbox);
  function showWarns() {
    wbox.innerHTML = '';
    for (const [cls, msg] of orgValidate(o)) wbox.append(el('div', { className: 'w ' + cls }, (cls === 'bad' ? '✕ ' : cls === 'warn' ? '⚠ ' : '✓ ') + esc(msg)));
  }
  showWarns();
}

$('#org-search').oninput = renderOrgList;
$('#org-new').onclick = () => {
  const o = { id: 'organ_' + Date.now() % 100000, type: 'arm', name: 'Nouvel organe', set: DATA.sets[0]?.id ?? 'human', tier: 'common', hp: 10, layer: 'outer', price: 10, tags: [], passives: [], skills: [], harvest: {} };
  DATA.organs.push(o); orgSel = o.id; persist(); renderOrgList(); orgEditor(o);
};
$('#org-dup').onclick = () => {
  const o = DATA.organs.find((x) => x.id === orgSel); if (!o) return;
  const c = deep(o); c.id = o.id + '_copy'; c.name = o.name + ' (copie)';
  DATA.organs.push(c); orgSel = c.id; persist(); renderOrgList(); orgEditor(c);
};
$('#org-del').onclick = () => {
  const i = DATA.organs.findIndex((x) => x.id === orgSel); if (i < 0) return;
  if (!confirm(`Supprimer ${DATA.organs[i].name} ?`)) return;
  DATA.organs.splice(i, 1); orgSel = null; persist(); renderOrgList(); orgEditor(null);
};
$('#set-new').onclick = () => {
  const id = prompt('id du set (ex: insect)'); if (!id) return;
  const name = prompt('nom affiché', id) || id;
  const color = prompt('couleur hex', '#7a8a4a') || '#7a8a4a';
  DATA.sets.push({ id, name, color }); persist(); renderOrgList();
};

// ═══════════════════════════════ ONGLET RELIQUES ═══════════════════════════════
let relicSel = null;

// Vocabulaire d'effets compris par RelicSystem.js (data-driven : réutiliser un
// kind existant = pur JSON ; un kind inédit exige un handler dans RelicSystem).
const RELIC_KINDS = {
  graft_cost: {
    desc: 'Tant que la relique est dans la besace : les greffes coûtent ce nombre de ticks au lieu de 5. Si plusieurs reliques en portent, la moins chère gagne.',
    fields: [['value', 'coût de greffe (ticks)', 'num']],
  },
  auto_repair: {
    desc: 'Tant que la relique est dans la besace : tous les N ticks, répare des PV sur ton organe vivant le plus endommagé. (Sous malédiction soin-douleur, le soin blesse à la place.)',
    fields: [['everyTicks', 'tous les N ticks', 'num'], ['amount', 'PV réparés', 'num']],
  },
};

function renderRelicList() {
  const q = ($('#relic-search').value || '').toLowerCase();
  const box = $('#relic-list'); box.innerHTML = '';
  box.append(el('div', { className: 'grp' }, 'Reliques'));
  for (const r of DATA.relics.filter((x) => !q || x.name.toLowerCase().includes(q) || x.id.includes(q))) {
    const it = el('div', { className: 'item' + (r.id === relicSel ? ' sel' : '') });
    it.append(el('span', { className: 'nm' }, esc(r.name)));
    it.append(el('span', { className: 'id' }, (r.price ?? 0) + '🥩'));
    it.onclick = () => { relicSel = r.id; renderRelicList(); relicEditor(r); };
    box.append(it);
  }
}

function relicValidate(r) {
  const out = [];
  if (DATA.relics.filter((x) => x.id === r.id).length > 1) out.push(['bad', `id "${r.id}" dupliqué`]);
  if (!(r.effects ?? []).length) out.push(['warn', 'aucun effet — la relique sera inerte']);
  for (const e of r.effects ?? []) {
    if (!RELIC_KINDS[e.kind]) out.push(['bad', `kind "${e.kind}" inconnu de RelicSystem — sera ignoré en jeu (il faut un handler code pour un kind inédit)`]);
  }
  if (!r.description) out.push(['warn', 'pas de description (tooltip besace vide)']);
  return out;
}

function relicEditor(r) {
  const ed = $('#relic-editor');
  if (!r) { ed.innerHTML = '<p class="muted">Sélectionne une relique à gauche.</p>'; return; }
  ed.innerHTML = '';

  const fs1 = el('fieldset'); fs1.append(el('legend', {}, 'Identité'));
  const F = (label, key, type = 'text', extra = {}) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', {}, label));
    const inp = el('input', { type, value: r[key] ?? '', ...extra });
    inp.oninput = () => { r[key] = type === 'number' ? +inp.value : inp.value; persist(); renderRelicList(); showWarns(); };
    row.append(inp); return row;
  };
  fs1.append(F('id', 'id'), F('nom', 'name'), F('prix (viande)', 'price', 'number'));
  const drow = el('div', { className: 'frow' }); drow.append(el('label', {}, 'description'));
  const dx = el('textarea', { value: r.description ?? '', style: 'width:420px;height:56px' });
  dx.oninput = () => { r.description = dx.value; persist(); showWarns(); };
  drow.append(dx); fs1.append(drow);
  ed.append(fs1);

  // Visuel : l'éclat de la besace (rendu réel) + éditeur de sprite paramétrique
  const vz = visuelZone(() => [{ item: { relicId: r.id }, label: '✦ dans la besace' }]);
  vz.fs.append(spriteEditor(r, vz.refresh));
  ed.append(vz.fs);

  const fs2 = el('fieldset'); fs2.append(el('legend', {}, 'Effets (tant que portée dans la besace)'));
  const fxBox = el('div');
  const renderFx = () => {
    fxBox.innerHTML = '';
    for (const [fi, eff] of (r.effects ?? []).entries()) {
      const box = el('div', { style: 'border:1px dashed var(--line);border-radius:3px;padding:6px 8px;margin:6px 0' });
      const head = el('div', { className: 'frow' });
      head.append(el('label', {}, 'effet ' + (fi + 1)));
      const ks = el('select');
      for (const k of Object.keys(RELIC_KINDS)) ks.append(el('option', { value: k, selected: eff.kind === k }, k));
      if (!RELIC_KINDS[eff.kind]) ks.append(el('option', { value: eff.kind, selected: true }, eff.kind + ' (?)'));
      ks.onchange = () => { r.effects[fi] = { kind: ks.value }; persist(); renderFx(); showWarns(); };
      const del = el('button', { className: 'tiny danger' }, '✕');
      del.onclick = () => { r.effects.splice(fi, 1); persist(); renderFx(); showWarns(); };
      head.append(ks, del); box.append(head);
      box.append(el('div', { className: 'muted', style: 'margin:2px 0 6px;max-width:420px;line-height:1.45' }, esc(RELIC_KINDS[eff.kind]?.desc ?? 'kind inconnu du moteur')));
      for (const [key, lbl] of RELIC_KINDS[eff.kind]?.fields ?? []) {
        const row = el('div', { className: 'frow' });
        row.append(el('label', {}, lbl));
        const inp = el('input', { type: 'number', value: eff[key] ?? '', style: 'width:70px' });
        inp.oninput = () => { const v = inp.value; if (v === '') delete eff[key]; else eff[key] = +v; persist(); showWarns(); };
        row.append(inp); box.append(row);
      }
      fxBox.append(box);
    }
    const add = el('button', { className: 'tiny' }, '+ effet');
    add.onclick = () => { (r.effects = r.effects ?? []).push({ kind: 'graft_cost', value: 3 }); persist(); renderFx(); showWarns(); };
    fxBox.append(add);
  };
  renderFx();
  fs2.append(fxBox);
  ed.append(fs2);

  const wbox = el('div', { className: 'warns' });
  ed.append(el('h3', {}, 'Validation'), wbox);
  function showWarns() {
    wbox.innerHTML = '';
    for (const [cls, msg] of relicValidate(r)) wbox.append(el('div', { className: 'w ' + cls }, (cls === 'bad' ? '✕ ' : cls === 'warn' ? '⚠ ' : '✓ ') + esc(msg)));
  }
  showWarns();
}

$('#relic-search').oninput = renderRelicList;
$('#relic-new').onclick = () => {
  const r = { id: 'relic_' + Date.now() % 100000, name: 'Nouvelle relique', price: 100, effects: [], description: '' };
  DATA.relics.push(r); relicSel = r.id; persist(); renderRelicList(); relicEditor(r);
};
$('#relic-dup').onclick = () => {
  const r = DATA.relics.find((x) => x.id === relicSel); if (!r) return;
  const c = deep(r); c.id = r.id + '_copy'; c.name = r.name + ' (copie)';
  DATA.relics.push(c); relicSel = c.id; persist(); renderRelicList(); relicEditor(c);
};
$('#relic-del').onclick = () => {
  const i = DATA.relics.findIndex((x) => x.id === relicSel); if (i < 0) return;
  if (!confirm(`Supprimer ${DATA.relics[i].name} ?`)) return;
  DATA.relics.splice(i, 1); relicSel = null; persist(); renderRelicList(); relicEditor(null);
};

// ═══════════════════════════════ ONGLET STRUCTURES ═══════════════════════════════
let structSel = null;
const PANEL_KINDS = ['combat', 'rest', 'trade', 'graft', 'altar', 'puzzle', 'path_choice', 'pillard'];
const structEntries = () => Object.entries(DATA.structures).filter(([k]) => k !== '_doc');

function renderStructList() {
  const q = ($('#struct-search').value || '').toLowerCase();
  const box = $('#struct-list'); box.innerHTML = '';
  box.append(el('div', { className: 'grp' }, 'Structures'));
  for (const [kind, s] of structEntries().filter(([k, s2]) => !q || k.includes(q) || (s2.label ?? '').includes(q))) {
    const it = el('div', { className: 'item' + (kind === structSel ? ' sel' : '') });
    it.append(el('span', { className: 'nm' }, esc(s.label ?? kind)));
    it.append(el('span', { className: 'id' }, esc(s.panel ?? '')));
    it.onclick = () => { structSel = kind; renderStructList(); structEditor(kind); };
    box.append(it);
  }
}

function structEditor(kind) {
  const ed = $('#struct-editor');
  const s = kind ? DATA.structures[kind] : null;
  if (!s) { ed.innerHTML = '<p class="muted">Sélectionne une structure à gauche.</p>'; return; }
  ed.innerHTML = '';

  const fs1 = el('fieldset'); fs1.append(el('legend', {}, `Structure "${esc(kind)}"`));
  const row1 = el('div', { className: 'frow' });
  row1.append(el('label', {}, 'label'));
  const lx = el('input', { value: s.label ?? '' });
  lx.oninput = () => { s.label = lx.value; persist(); renderStructList(); };
  row1.append(lx); fs1.append(row1);

  const row2 = el('div', { className: 'frow' });
  row2.append(el('label', {}, 'au sol'));
  const fcb = el('input', { type: 'checkbox', checked: !!s.floor });
  fcb.onchange = () => { s.floor = fcb.checked; persist(); };
  row2.append(fcb, el('span', { className: 'muted' }, 'posé par terre (ramassage) plutôt que debout'));
  fs1.append(row2);

  const row3 = el('div', { className: 'frow' });
  row3.append(el('label', {}, 'panneau'));
  const ps = el('select');
  for (const p of PANEL_KINDS) ps.append(el('option', { value: p, selected: s.panel === p }, p));
  ps.onchange = () => { s.panel = ps.value; persist(); renderStructList(); };
  row3.append(ps, el('span', { className: 'muted' }, 'quel panneau s\'ouvre quand on la clique'));
  fs1.append(row3);
  ed.append(fs1);

  const fs2 = el('fieldset'); fs2.append(el('legend', {}, 'Son (barre sonore)'));
  s.son = s.son ?? {};
  const rs1 = el('div', { className: 'frow' });
  rs1.append(el('label', {}, 'label sonore'));
  const slx = el('input', { value: s.son.label ?? '', placeholder: '(vide = pas de texte)' });
  slx.oninput = () => { if (slx.value) s.son.label = slx.value; else delete s.son.label; persist(); };
  rs1.append(slx); fs2.append(rs1);
  const rs2 = el('div', { className: 'frow' });
  rs2.append(el('label', {}, 'intensité'));
  const six = el('input', { type: 'number', value: s.son.intensite ?? 0.3, min: 0, max: 1, step: 0.02, style: 'width:70px' });
  six.oninput = () => { s.son.intensite = +six.value; persist(); };
  rs2.append(six, el('span', { className: 'muted' }, '0 = silencieux · 1 = assourdissant'));
  fs2.append(rs2);
  const rs3 = el('div', { className: 'frow' });
  rs3.append(el('label', {}, 'tremblement'));
  const tcb = el('input', { type: 'checkbox', checked: !!s.son.tremor });
  tcb.onchange = () => { if (tcb.checked) s.son.tremor = true; else delete s.son.tremor; persist(); };
  rs3.append(tcb, el('span', { className: 'muted' }, 'onde sourde sans identification'));
  fs2.append(rs3);
  ed.append(fs2);

  const fs3 = el('fieldset'); fs3.append(el('legend', {}, 'Silhouette (HTML + classes CSS de scene.css)'));
  const ta = el('textarea', { value: s.html ?? '', style: 'width:460px;height:80px' });
  ta.onchange = () => { s.html = ta.value; persist(); };
  fs3.append(ta);
  fs3.append(el('div', { className: 'muted' }, 'Teste-la dans le simulateur : select PNJ de la Vue jeu.'));
  ed.append(fs3);

  const usesKind = (slot) => slot.kind === kind || (slot.choix ?? []).some((c) => c.kind === kind);
  const uses = DATA.rooms.filter((r) => (r.structures ?? []).some(usesKind));
  ed.append(el('h3', {}, 'Salles qui l\'utilisent'),
    el('div', { className: 'muted' }, uses.length ? uses.map((r) => esc(r.id)).join(', ') : 'aucune'));
}

$('#struct-search').oninput = renderStructList;
$('#struct-new').onclick = () => {
  const kind = prompt('id de la structure (ex: fontaine)'); if (!kind || DATA.structures[kind]) return;
  DATA.structures[kind] = { label: kind, floor: false, panel: 'altar', son: { label: kind, intensite: 0.3 }, html: '<div class="al-glow"></div>' };
  structSel = kind; persist(); renderStructList(); structEditor(kind);
};
$('#struct-del').onclick = () => {
  if (!structSel) return;
  if (!confirm(`Supprimer la structure "${structSel}" ?`)) return;
  delete DATA.structures[structSel]; structSel = null; persist(); renderStructList(); structEditor(null);
};

// ═══════════════════════════════ ONGLET SALLES ═══════════════════════════════
let roomSel = null;
const ROOM_UIS = [...new Set(roomsJson.map((r) => r.ui))];
const ROOM_FAMILIES = [...new Set(roomsJson.map((r) => r.family))];

function renderRoomList() {
  const q = ($('#room-search').value || '').toLowerCase();
  const box = $('#room-list'); box.innerHTML = '';
  // Tri par biome : les salles génériques (sans biomeOnly) d'abord, puis chaque biome
  const groups = [{ id: null, name: 'Tous les biomes' }, ...biomesJson.map((b) => ({ id: b.id, name: b.name }))];
  for (const g of groups) {
    const members = DATA.rooms.filter((r) => (r.biomeOnly ?? null) === g.id && (!q || r.id.includes(q)));
    if (!members.length) continue;
    box.append(el('div', { className: 'grp' }, esc(g.name)));
    for (const r of members) {
      const it = el('div', { className: 'item' + (r.id === roomSel ? ' sel' : '') });
      it.append(el('span', { className: 'nm' }, esc(r.id)));
      it.append(el('span', { className: 'id' }, (r.weight ?? 0) > 0 ? `poids ${r.weight}` : 'placé'));
      it.onclick = () => { roomSel = r.id; renderRoomList(); roomEditor(r); };
      box.append(it);
    }
  }
}

function roomEditor(r) {
  const ed = $('#room-editor');
  if (!r) { ed.innerHTML = '<p class="muted">Sélectionne une salle à gauche.</p>'; return; }
  ed.innerHTML = '';
  const fs = el('fieldset'); fs.append(el('legend', {}, 'Gameplay'));
  const F = (label, get, set, type = 'text', extra = {}) => {
    const row = el('div', { className: 'frow' }); row.append(el('label', {}, label));
    const inp = el('input', { type, value: get() ?? '', ...extra });
    inp.oninput = () => { set(type === 'number' ? +inp.value : inp.value); persist(); renderRoomList(); };
    row.append(inp); return row;
  };
  const hint = (txt) => el('div', { className: 'muted', style: 'margin:-4px 0 8px 98px;max-width:420px;line-height:1.4' }, txt);
  fs.append(F('id', () => r.id, (v) => r.id = v));

  // panneau (ui) : le panneau AUTOMATIQUE de la salle (optionnel)
  const uirow = el('div', { className: 'frow' }); uirow.append(el('label', {}, 'panneau auto'));
  const usel = el('select');
  usel.append(el('option', { value: '' }, '(aucun — description seule)'));
  const UIS = [...new Set([...DATA.rooms.map((x) => x.ui), ...PANEL_KINDS])].filter(Boolean);
  for (const u of UIS) usel.append(el('option', { value: u, selected: r.ui === u }, u));
  usel.onchange = () => { if (usel.value) r.ui = usel.value; else delete r.ui; persist(); };
  uirow.append(usel); fs.append(uirow);
  fs.append(hint('Panneau qui s\'ouvre TOUT SEUL en entrant, pour les salles sans structure (repos, énigme, carrefour, note de combat). Les panneaux des structures, eux, s\'ouvrent au clic sur leur silhouette.'));

  fs.append(F('poids', () => r.weight, (v) => r.weight = v, 'number'));
  fs.append(hint('Chance relative d\'apparaître à la génération de l\'étage (40 = très courant, 2 = rare, 0 = jamais en aléatoire — placée uniquement par le script, ex: entrance/exit/boss).'));

  const mobrow = el('div', { className: 'frow' }); mobrow.append(el('label', {}, 'monstres'));
  const mn = el('input', { type: 'number', value: r.spawns?.minMobs ?? 0, style: 'width:55px' });
  const mx2 = el('input', { type: 'number', value: r.spawns?.maxMobs ?? 0, style: 'width:55px' });
  mn.oninput = () => { r.spawns = { ...(r.spawns ?? {}), minMobs: +mn.value }; persist(); };
  mx2.oninput = () => { r.spawns = { ...(r.spawns ?? {}), maxMobs: +mx2.value }; persist(); };
  mobrow.append(mn, el('span', { className: 'muted' }, 'à'), mx2);
  fs.append(mobrow);
  fs.append(hint('Nombre de monstres générés en entrant (MobGen, thèmes du biome). 0 à 0 = salle sûre, sans combat — c\'est CE champ qui décide de l\'hostilité de la salle.'));

  const brow = el('div', { className: 'frow' }); brow.append(el('label', {}, 'biomeOnly'));
  const bsel = el('select'); bsel.append(el('option', { value: '' }, '(tous)'));
  for (const b of biomesJson) bsel.append(el('option', { value: b.id, selected: r.biomeOnly === b.id }, b.name));
  bsel.onchange = () => { if (bsel.value) r.biomeOnly = bsel.value; else delete r.biomeOnly; persist(); };
  fs.append(brow); brow.append(bsel);

  // Scène de décor (scenes.json) : override par salle, sinon défaut du biome
  const scrow = el('div', { className: 'frow' }); scrow.append(el('label', {}, 'scène'));
  const scsel = el('select'); scsel.append(el('option', { value: '' }, '(défaut du biome)'));
  for (const [sid, sdef] of Object.entries(scenesJson).filter(([k]) => k !== '_doc'))
    scsel.append(el('option', { value: sid, selected: r.scene === sid }, sdef.label ?? sid));
  scsel.onchange = () => { if (scsel.value) r.scene = scsel.value; else delete r.scene; persist(); };
  scrow.append(scsel, el('span', { className: 'muted' }, 'décor DA — visible dans la Vue jeu du simulateur'));
  fs.append(scrow);
  const drow = el('div', { className: 'frow' }); drow.append(el('label', {}, 'description'));
  const dx = el('textarea', { value: r.description ?? '', style: 'width:400px;height:50px' });
  dx.oninput = () => { r.description = dx.value; persist(); };
  drow.append(dx); fs.append(drow);
  ed.append(fs);

  // ── Structures : tirage EXPLICITE, deux formes combinables ──
  const fsS = el('fieldset'); fsS.append(el('legend', {}, 'Structures (tirage à la génération)'));
  fsS.append(el('div', { className: 'muted', style: 'margin-bottom:6px;max-width:460px;line-height:1.45' },
    'Aucune ligne = aucune structure dans cette salle. Chaque ligne est tirée indépendamment. Un GROUPE fait apparaître au plus UN de ses choix (somme ≤ 100%, le reste = rien).'));
  const sBox = el('div');
  const kindSelect = (cur, onch) => {
    const ks = el('select');
    for (const [kind] of structEntries()) ks.append(el('option', { value: kind, selected: cur === kind }, DATA.structures[kind]?.label ?? kind));
    ks.onchange = () => onch(ks.value);
    return ks;
  };
  const pctInput = (cur, onch) => {
    const pc = el('input', { type: 'number', value: Math.round((cur ?? 0) * 100), min: 0, max: 100, style: 'width:58px' });
    pc.oninput = () => onch((+pc.value || 0) / 100);
    return pc;
  };
  const renderStructRows = () => {
    sBox.innerHTML = '';
    for (const [i, slot] of (r.structures ?? []).entries()) {
      const box = el('div', { style: 'border:1px dashed var(--line);border-radius:3px;padding:6px 8px;margin:5px 0' });
      const delSlot = el('button', { className: 'tiny danger' }, '✕');
      delSlot.onclick = () => { r.structures.splice(i, 1); if (!r.structures.length) delete r.structures; persist(); renderStructRows(); };
      if (Array.isArray(slot.choix)) {
        // groupe exclusif
        const head = el('div', { className: 'frow' });
        head.append(el('span', { style: 'font-size:11px;color:var(--accent)' }, 'UN SEUL PARMI :'), delSlot);
        box.append(head);
        for (const [j, c] of slot.choix.entries()) {
          const row = el('div', { className: 'frow' });
          row.append(kindSelect(c.kind, (v) => { c.kind = v; persist(); }));
          row.append(pctInput(c.chance, (v) => { c.chance = v; persist(); showGroupTotal(); }));
          row.append(el('span', { className: 'muted' }, '%'));
          const dc = el('button', { className: 'tiny danger' }, '−');
          dc.onclick = () => { slot.choix.splice(j, 1); persist(); renderStructRows(); };
          row.append(dc);
          box.append(row);
        }
        const addC = el('button', { className: 'tiny' }, '+ choix');
        addC.onclick = () => { slot.choix.push({ kind: structEntries()[0]?.[0] ?? 'altar', chance: 0.2 }); persist(); renderStructRows(); };
        const gt = el('span', { className: 'muted', style: 'margin-left:8px' });
        const showGroupTotal = () => {
          const t = slot.choix.reduce((s2, x) => s2 + (x.chance ?? 0), 0);
          gt.textContent = `total ${Math.round(t * 100)}%${t > 1 ? ' ⚠ dépasse 100%' : ` · ${Math.round((1 - t) * 100)}% rien`}`;
          gt.style.color = t > 1 ? 'var(--bad)' : '';
        };
        showGroupTotal();
        box.append(addC, gt);
      } else {
        // structure indépendante
        const row = el('div', { className: 'frow' });
        row.append(kindSelect(slot.kind, (v) => { slot.kind = v; persist(); }));
        row.append(pctInput(slot.chance, (v) => { slot.chance = v; persist(); }));
        row.append(el('span', { className: 'muted' }, '% de chance d\'être présente'), delSlot);
        box.append(row);
      }
      sBox.append(box);
    }
    const nSlots = (r.structures ?? []).length;
    const add1 = el('button', { className: 'tiny primary', disabled: nSlots >= 3 }, '+ structure');
    add1.onclick = () => { (r.structures = r.structures ?? []).push({ kind: structEntries()[0]?.[0] ?? 'altar', chance: 1 }); persist(); renderStructRows(); };
    const add2 = el('button', { className: 'tiny', style: 'margin-left:6px', disabled: nSlots >= 3 }, '+ groupe exclusif');
    add2.onclick = () => { (r.structures = r.structures ?? []).push({ choix: [{ kind: structEntries()[0]?.[0] ?? 'altar', chance: 0.5 }] }); persist(); renderStructRows(); };
    sBox.append(add1, add2);
    // 3 emplacements (gauche/centre/droite) = 3 structures max par salle
    sBox.append(el('span', { className: 'muted', style: 'margin-left:8px' + (nSlots >= 3 ? ';color:var(--warn)' : '') },
      `${nSlots}/3 emplacements${nSlots >= 3 ? ' — plein' : ''}`));
  };
  renderStructRows();
  fsS.append(sBox);
  ed.append(fsS);

}


$('#room-search').oninput = renderRoomList;
$('#room-new').onclick = () => {
  const r = { id: 'room_' + Date.now() % 100000, ui: 'combat', weight: 2, spawns: { minMobs: 0, maxMobs: 0 }, description: '' };
  DATA.rooms.push(r); roomSel = r.id; persist(); renderRoomList(); roomEditor(r);
};
$('#room-dup').onclick = () => {
  const r = DATA.rooms.find((x) => x.id === roomSel); if (!r) return;
  const c = deep(r); c.id = r.id + '_copy'; DATA.rooms.push(c); roomSel = c.id; persist(); renderRoomList(); roomEditor(c);
};
$('#room-del').onclick = () => {
  const i = DATA.rooms.findIndex((x) => x.id === roomSel); if (i < 0) return;
  if (!confirm(`Supprimer ${DATA.rooms[i].id} ?`)) return;
  DATA.rooms.splice(i, 1); roomSel = null; persist(); renderRoomList(); roomEditor(null);
};

// ═══════════════════════════════ ONGLET SIMULATEUR ═══════════════════════════════
const SLOT_KEYS = Object.keys(ORGAN_SLOTS);
const mulberry = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

function emptyBody(id) { return { id, slots: Object.fromEntries(SLOT_KEYS.map((k) => [k, null])) }; }
function bodyFromSelects(prefix) {
  const b = emptyBody(prefix);
  for (const k of SLOT_KEYS) {
    const v = $('#' + prefix + '-slot-' + k)?.value;
    if (v) b.slots[k] = { organId: v, hp: resolver(v)?.maxHp ?? 10 };
  }
  return b;
}

function simSlotsUI() {
  for (const [prefix, box] of [['p', $('#sim-player-slots')], ['m', $('#sim-mob-manual')]]) {
    box.innerHTML = '';
    for (const k of SLOT_KEYS) {
      const row = el('div', { className: 'slotrow' });
      row.append(el('span', { className: 'sl' }, k));
      const sel = el('select', { id: prefix + '-slot-' + k });
      sel.append(el('option', { value: '' }, '—'));
      const type = ORGAN_SLOTS[k].type;
      for (const o of DATA.organs.filter((x) => x.type === type)) sel.append(el('option', { value: o.id }, o.name));
      sel.onchange = () => { if (prefix === 'p') renderPerception(); };
      row.append(sel); box.append(row);
    }
  }
  const ms = $('#sim-mobset'); ms.innerHTML = '';
  ms.append(el('option', { value: '' }, 'tous sets'));
  for (const s of DATA.sets) ms.append(el('option', { value: s.id }, s.name));
}
function fillPreset(setId) {
  for (const k of SLOT_KEYS) {
    const type = ORGAN_SLOTS[k].type;
    const o = DATA.organs.find((x) => x.type === type && x.set === setId);
    const sel = $('#p-slot-' + k); if (sel) sel.value = o?.id ?? '';
  }
  renderPerception();
}
$('#sim-preset-human').onclick = () => fillPreset('human');
$('#sim-preset-beast').onclick = () => fillPreset('beast');
$('#sim-mobmode').onchange = () => {
  const manual = $('#sim-mobmode').value === 'manual';
  $('#sim-mob-manual').style.display = manual ? '' : 'none';
  $('#sim-mob-seedopts').style.display = manual ? 'none' : '';
};

// ── Vue jeu : sandbox iframe = VRAI rendu (ViewportDOM + SensoryFX + BodyFX + SoundBar + fx.json)
const SB = () => document.getElementById('vp-frame')?.contentWindow?.SANDBOX ?? null;

function syncSandbox() {
  const sb = SB(); if (!sb) return;
  sb.applyDrafts?.({ organs: DATA.organs, sets: DATA.sets, rooms: DATA.rooms, relics: DATA.relics, structures: DATA.structures, tags: DATA.tags });
  sb.setBody(bodyFromSelects('p'));
  sb.setLight($('#vp-torch')?.checked ? 1 : 0);
  // le select "ajouter" propose mob + structures (brouillons inclus) + décors
  const ts = $('#vp-spawn-type');
  if (ts) {
    const cur = ts.value;
    ts.innerHTML = '';
    ts.append(el('option', { value: 'mob' }, '👹 monstre aléatoire (test)'));
    ts.append(el('option', { value: 'roommobs' }, '🎲 spawn naturel de la salle (MobGen)'));
    const og1 = el('optgroup', { label: 'Structures' });
    for (const [kind, s] of structEntries()) og1.append(el('option', { value: 'struct:' + kind }, s.label ?? kind));
    ts.append(og1);
    const og2 = el('optgroup', { label: 'Décor' });
    for (const [v, l] of [['guts', 'viscères'], ['spike', 'pieu'], ['bones', 'tas d\'os'], ['skeleton', 'squelette'], ['splatter', 'éclaboussure']]) og2.append(el('option', { value: 'prop:' + v }, l));
    ts.append(og2);
    if (cur) ts.value = cur;
  }
  syncRoomSelect();
  renderSpawnList();
}
// Poll robuste : détecte le sandbox prêt (ou son erreur) et affiche l'état
let _sbSynced = false;
const _sbPoll = setInterval(() => {
  const w = document.getElementById('vp-frame')?.contentWindow;
  const note = document.getElementById('vp-status');
  if (!w) return;
  if (w.SANDBOX_ERROR) {
    if (note) { note.textContent = '✕ sandbox : ' + w.SANDBOX_ERROR; note.style.color = 'var(--bad)'; }
    return;
  }
  if (w.SANDBOX) {
    if (!_sbSynced) { _sbSynced = true; syncSandbox(); }
    if (note) { note.textContent = '✓ sandbox prêt — boutons actifs'; note.style.color = 'var(--ok)'; }
    clearInterval(_sbPoll);
  } else if (note) { note.textContent = '… sandbox en chargement'; }
}, 500);

document.addEventListener('input', (e) => { if (e.target.id === 'vp-torch') SB()?.setLight(e.target.checked ? 1 : 0); });
document.addEventListener('click', (e) => {
  // les ✕ des chips de spawn n'ont pas d'id vp-* mais un data-spawn-id
  if (!e.target.id?.startsWith('vp-') && !e.target.dataset?.spawnId) return;
  const sb = SB();
  const note = document.getElementById('vp-status');
  if (!sb) { if (note) { note.textContent = '✕ sandbox pas prêt'; note.style.color = 'var(--bad)'; } return; }
  let msg = null;
  switch (e.target.id) {
    case 'vp-beat':   msg = sb.beat(); break;
    case 'vp-hit':    msg = sb.hit(2); break;
    case 'vp-legs':   msg = sb.killSlot('legs'); break;
    case 'vp-revive': msg = sb.reviveAll(); break;
    case 'vp-pingl':  sb.ping(0.12, 'goutte', 0.7); msg = '♪ ping gauche'; break;
    case 'vp-pingc':  sb.ping(0.5,  'râle',   0.8); msg = '♪ ping centre'; break;
    case 'vp-pingr':  sb.ping(0.88, 'grincement', 0.7); msg = '♪ ping droit'; break;
    case 'vp-loadroom': msg = sb.loadRoom?.($('#vp-room').value, $('#vp-biome').value); renderSpawnList(); break;
    case 'vp-add': {
      const t = $('#vp-spawn-type').value, side = $('#vp-side').value;
      let r = null;
      if (t === 'mob') r = sb.spawnMob?.(side);
      else if (t === 'roommobs') r = sb.spawnRoomMobs?.();
      else if (t.startsWith('struct:')) r = sb.addStructure?.(t.slice(7), side);
      else if (t.startsWith('prop:')) r = sb.addProp?.(t.slice(5), side);
      msg = r?.err ?? r?.msg ?? null;
      renderSpawnList();
      break;
    }
    case 'vp-clearspawns': msg = sb.clearSpawns?.(); renderSpawnList(); break;
  }
  if (e.target.dataset?.spawnId) { msg = sb.removeContent?.(e.target.dataset.spawnId); renderSpawnList(true); }
  if (msg && note) { note.textContent = msg; note.style.color = msg.startsWith('✕') ? 'var(--bad)' : 'var(--ok)'; }
});

// Portes pilotées par les checkboxes
document.addEventListener('change', (e) => {
  const sb = SB(); if (!sb) return;
  const note = document.getElementById('vp-status');
  let msg = null;
  if (e.target.id === 'vp-room') { syncBiomeSelect(); return; }
  if (e.target.id?.startsWith('vp-door-')) {
    msg = sb.setDoors?.({ g: $('#vp-door-g').checked, f: $('#vp-door-f').checked, d: $('#vp-door-d').checked });
  }
  if (msg && note) { note.textContent = msg; note.style.color = msg.startsWith('✕') ? 'var(--bad)' : 'var(--ok)'; }
});

// Contenu réel de la salle courante (naturel + manuel), chips retirables.
// Rafraîchi en continu : téléportation, tirages et spawns internes au sandbox
// apparaissent sans action côté atelier.
let _lastContents = '';
function renderSpawnList(force = false) {
  const box = document.getElementById('vp-spawnlist');
  const sb = SB();
  if (!box || !sb?.roomContents) return;
  const contents = sb.roomContents();
  const key = JSON.stringify(contents);
  if (!force && key === _lastContents) return;
  _lastContents = key;
  box.innerHTML = '';
  for (const s of contents) {
    const chip = el('span', { className: 'chip' }, `<b>${esc(s.label)}</b> ${esc(s.side)} `);
    const x = el('span', { style: 'cursor:pointer;color:var(--bad)' }, '✕');
    x.dataset.spawnId = s.id;
    chip.append(x);
    box.append(chip);
  }
}
setInterval(() => renderSpawnList(), 1200);

// ── Aperçu réel de l'onglet Salles (2e sandbox, chargé à la demande) ──
const SB2 = () => document.getElementById('room-preview-frame')?.contentWindow?.SANDBOX ?? null;
function roomPreviewStatus(msg) {
  const s = document.getElementById('room-preview-status');
  if (s) { s.textContent = msg ?? ''; s.style.color = String(msg).startsWith('✕') ? 'var(--bad)' : 'var(--ok)'; }
}
function roomPreviewLoad() {
  const sb = SB2();
  const r = DATA.rooms.find((x) => x.id === roomSel);
  if (!r) { roomPreviewStatus('✕ sélectionne une salle'); return; }
  if (!sb) { roomPreviewStatus('… sandbox en chargement, re-clique dans 2s'); return; }
  sb.applyDrafts?.({ organs: DATA.organs, sets: DATA.sets, rooms: DATA.rooms, relics: DATA.relics, structures: DATA.structures, tags: DATA.tags })
    ?.then?.(() => roomPreviewStatus(sb.loadRoom?.(r.id, r.biomeOnly ?? 'gorge')));
}
document.addEventListener('click', (e) => {
  if (e.target.id === 'room-preview-load') roomPreviewLoad();
  if (e.target.id === 'room-preview-roll') {
    const sb = SB2();
    roomPreviewStatus(sb ? (sb.rerollRoom?.() ?? '✕ API absente') : '✕ sandbox pas prêt');
  }
});

// Selects salle + biome (peuplés depuis les brouillons)
function syncRoomSelect() {
  const rs = $('#vp-room'); if (!rs) return;
  const cur = rs.value;
  rs.innerHTML = '';
  for (const fam of [...new Set(DATA.rooms.map((r) => r.family))]) {
    const og = el('optgroup', { label: fam });
    for (const r of DATA.rooms.filter((x) => x.family === fam)) og.append(el('option', { value: r.id, selected: r.id === cur }, r.id));
    rs.append(og);
  }
  syncBiomeSelect();
}
function syncBiomeSelect() {
  const rs = $('#vp-room'), bs = $('#vp-biome'); if (!rs || !bs) return;
  const def = DATA.rooms.find((r) => r.id === rs.value);
  const cur = bs.value;
  bs.innerHTML = '';
  const list = def?.biomeOnly ? biomesJson.filter((b) => b.id === def.biomeOnly) : biomesJson;
  for (const b of list) bs.append(el('option', { value: b.id, selected: b.id === cur }, b.name));
}
// perception via le VRAI Faculties (registry + WS.player)
function renderPerception() {
  const body = bodyFromSelects('p');
  WS.player = WS.player ?? {}; WS.player.body = body;
  const P = $('#sim-perception');
  const yes = (v) => v ? '<span style="color:var(--ok)">oui</span>' : '<span style="color:var(--bad)">non</span>';
  let h = '<table style="font-size:11px;border-spacing:0 1px">';
  for (const side of ['gauche', 'droite']) {
    h += `<tr><td colspan=2 style="color:var(--accent)">— ${side} —</td></tr>`;
    h += `<tr><td>voit</td><td>${yes(FAC.seesOn(side))}</td></tr>`;
    for (const t of ['vue-couleur', 'vue-nocturne', 'vue-invisible', 'vue-rayons-x', 'vue-arcane', 'vue-thermique'])
      if (FAC.grants(t, side)) h += `<tr><td colspan=2 class="muted">+ ${t}</td></tr>`;
    h += `<tr><td>entend</td><td>${yes(FAC.hears(side))}</td></tr>`;
    const e = FAC.tierMax('echolocation', side), i = FAC.tierMax('ouie-identification', side);
    if (e) h += `<tr><td>écholocation</td><td>${e}</td></tr>`;
    if (i) h += `<tr><td>identification</td><td>${i}</td></tr>`;
  }
  h += `<tr><td colspan=2 style="color:var(--accent)">— global —</td></tr>`;
  h += `<tr><td>plan actif</td><td>${yes(FAC.planActive())}</td></tr>`;
  h += `<tr><td>map</td><td>${FAC.mapLevel()}${FAC.remembers() ? ' +mém' : ''}</td></tr>`;
  h += `<tr><td>détection</td><td>${FAC.detectionLevel()}</td></tr>`;
  h += `<tr><td>digestion</td><td>${FAC.count('digestion')}</td></tr>`;
  h += `<tr><td>sang/tour</td><td><b>${CR.bloodPool(body, resolver)}</b></td></tr>`;
  h += `<tr><td>sonorité</td><td>${FAC.sonorityOf(body).toFixed(2)}</td></tr>`;
  h += `<tr><td>lumière nette</td><td>${FAC.lightNet()}</td></tr>`;
  h += '</table>';
  P.innerHTML = h;
  syncSandbox();
}

// ── état combat ──
let SIM = null;
function log(msg) { const box = $('#simlog'); box.textContent = msg + '\n' + box.textContent.slice(0, 8000); }

function genMob(rng, setFilter, n) {
  const b = emptyBody('mob');
  const pool = DATA.organs.filter((o) => !setFilter || o.set === setFilter);
  let placed = 0, tries = 0;
  while (placed < n && tries++ < 60) {
    const o = pool[Math.floor(rng() * pool.length)];
    const key = SLOT_KEYS.find((k) => ORGAN_SLOTS[k].type === o.type && b.slots[k] === null);
    if (key) { b.slots[key] = { organId: o.id, hp: o.hp }; placed++; }
  }
  if (!b.slots.heart && rng() < 0.6) {
    const h = pool.find((o) => o.type === 'heart') ?? DATA.organs.find((o) => o.type === 'heart');
    if (h) b.slots.heart = { organId: h.id, hp: h.hp };
  }
  return { id: 'mob', body: b, _bleeds: {} };
}

function mkPstate(body) {
  return { blood: 0, protection: 0, regen: 0, frenesie: 0, empower: 0, onceUsed: new Set(), meat: 0,
    onOrganKillBlood: CR.livingSlots(body).some((k) => resolver(body.slots[k].organId)?.passives?.some((p) => p.id === 'instinct')) ? 1 : 0 };
}

$('#sim-start').onclick = () => {
  const seed = +$('#sim-seed').value || 1;
  const rng = mulberry(seed);
  const player = bodyFromSelects('p');
  if (!CR.livingSlots(player).length) { setStatus('corps joueur vide — choisis des organes', 'bad'); return; }
  const mob = $('#sim-mobmode').value === 'manual'
    ? { id: 'mob', body: bodyFromSelects('m'), _bleeds: {} }
    : genMob(rng, $('#sim-mobset').value || null, +$('#sim-mobn').value || 3);
  SIM = { rng, player, mob, pstate: mkPstate(player), turn: 0, used: new Set(), over: false, pendingCard: null };
  SIM.plan = CR.chooseMobPlan(mob, player, resolver, rng);
  $('#simlog').textContent = ''; $('#sim-banner').innerHTML = '';
  $('#sim-endturn').disabled = false;
  startTurn();
};

function startTurn() {
  SIM.turn++; SIM.used.clear(); SIM.pendingCard = null;
  SIM.pstate.blood = CR.bloodPool(SIM.player, resolver);
  CR.produceTurnResources(SIM.player, SIM.pstate, resolver);
  log(`── tour ${SIM.turn} ──  sang:${SIM.pstate.blood}`);
  renderSim();
}

$('#sim-endturn').onclick = () => {
  if (!SIM || SIM.over) return;
  CR.tickEnemyStatus(SIM.mob, resolver, SIM.rng);
  if (checkEnd()) return;
  const ev = CR.resolveMobPlan(SIM.plan, SIM.mob, SIM.player, SIM.pstate, resolver, SIM.rng) ?? [];
  logEvents(ev, 'ennemi');
  if (checkEnd()) return;
  SIM.plan = CR.chooseMobPlan(SIM.mob, SIM.player, resolver, SIM.rng);
  startTurn();
};

function checkEnd() {
  if (!CR.vitalAlive(SIM.mob.body)) { end(true); return true; }
  if (!CR.vitalAlive(SIM.player)) { end(false); return true; }
  return false;
}
function end(win) {
  SIM.over = true; $('#sim-endturn').disabled = true;
  $('#sim-banner').innerHTML = `<div class="banner ${win ? 'win' : 'lose'}">${win ? '☠ ORGANE VITAL DÉTRUIT — VICTOIRE' : '✝ TU ES MORT'} (tour ${SIM.turn})</div>`;
  renderSim();
}

function logEvents(evs, who) {
  for (const e of evs) {
    const m = { hit: `${who} frappe ${e.key ?? ''} (-${e.amount ?? e.dmg ?? '?'})`, weak: `POINT FAIBLE ${e.key}`,
      meat: `+${e.amount} viande`, blood: `+${e.amount} sang`, protect: `+${e.amount} protection`,
      regen_set: `régén ${e.amount}`, frenesie: `frénésie +${e.amount}`, retrigger: `↻ ${e.label}`,
      bile: `bile ${e.amount} → ${e.key}`, saignement: `saignement ${e.amount} → ${e.key}`, vulnerabilite: `vuln ${e.amount} → ${e.key}` };
    log('  ' + (m[e.t] ?? JSON.stringify(e)));
  }
}

const ENEMY_TARGET_KINDS = ['damage', 'bile', 'saignement', 'vulnerabilite'];
function playCardOn(slotKey, sk, targetSlot) {
  const isEnemyKind = ENEMY_TARGET_KINDS.includes(sk.effect?.kind);
  const ctx = isEnemyKind
    ? { enemy: SIM.mob, target: { body: SIM.mob.body, slotKey: targetSlot, isSelf: false } }
    : { enemy: SIM.mob, target: { body: SIM.player, slotKey: targetSlot, isSelf: true } };
  const r = CR.playCard(SIM.pstate, SIM.player, resolver(SIM.player.slots[slotKey].organId), sk, ctx, resolver, SIM.rng);
  if (!r.ok) { log(`  ✕ impossible (${r.reason})`); return; }
  SIM.used.add(slotKey + ':' + sk.id);
  logEvents(r.events, 'toi');
  if (!checkEnd()) renderSim();
}

function renderSim() {
  if (!SIM) return;
  $('#sim-turn').textContent = `tour ${SIM.turn}`;
  const p = SIM.pstate;
  $('#sim-pstats').innerHTML =
    `<span>🩸 sang <b>${p.blood}</b></span><span>🛡 prot <b>${p.protection}</b></span>` +
    `<span>♻ régén <b>${p.regen}</b></span><span>⚔ frén <b>${p.frenesie}</b></span><span>🥩 viande <b>${p.meat}</b></span>`;

  // ennemi par couches
  const ebox = $('#sim-enemy'); ebox.innerHTML = '';
  const reachable = CR.targetableSlots(SIM.mob.body, false);
  for (const layer of CR.LAYERS) {
    const keys = SLOT_KEYS.filter((k) => SIM.mob.body.slots[k] && ORGAN_SLOTS[k].layer === layer);
    if (!keys.length) continue;
    const lb = el('div', { className: 'layerbox' + (keys.some((k) => reachable.includes(k)) ? '' : ' locked') });
    lb.append(el('div', { className: 'lt' }, layer + (keys.some((k) => reachable.includes(k)) ? '' : ' 🔒 (brèche requise)')));
    const row = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px' });
    for (const k of keys) {
      const s = SIM.mob.body.slots[k]; const def = resolver(s.organId);
      const alive = s.hp > 0;
      const card = el('div', { className: 'orgcard' + (alive ? '' : ' dead') + (alive && reachable.includes(k) && SIM.pendingCard ? ' targetable' : '') + (SIM.mob._weakSpot === k ? ' weak' : '') });
      card.append(el('div', { className: 'nm' }, `${esc(def?.name ?? s.organId)} <span class="muted">${k}</span>`));
      const hb = el('div', { className: 'hpbar' }); hb.append(el('i', { style: `width:${Math.max(0, 100 * s.hp / (def?.maxHp || 1))}%` }));
      card.append(hb, el('div', { className: 'muted' }, `${s.hp}/${def?.maxHp}`));
      const st = [];
      if (SIM.mob._bile?.[k]) st.push('🟢bile ' + SIM.mob._bile[k]);
      if (SIM.mob._bleeds?.[k]) st.push('🔴sgn ' + SIM.mob._bleeds[k]);
      if (SIM.mob._vuln?.[k]) st.push('🟣vuln ' + SIM.mob._vuln[k]);
      if (st.length) card.append(el('div', { className: 'stat-ico' }, st.join(' ')));
      if (SIM.pendingCard && alive && reachable.includes(k)) card.onclick = () => {
        const { slotKey, sk } = SIM.pendingCard; SIM.pendingCard = null;
        $('#sim-targethint').textContent = '';
        playCardOn(slotKey, sk, k);
      };
      row.append(card);
    }
    lb.append(row); ebox.append(lb);
  }

  // télégraphe
  const tg = $('#sim-telegraph');
  if (SIM.plan?.length && !SIM.over) {
    tg.style.display = '';
    tg.textContent = '⚡ prépare : ' + SIM.plan.map((a) => `${a.skill?.label ?? '?'}${a.targetKey ? ' → ' + a.targetKey : ''}`).join(' · ');
  } else { tg.style.display = 'none'; }

  // main
  const hand = $('#sim-hand'); hand.innerHTML = '';
  if (!SIM.over) {
    for (const k of CR.livingSlots(SIM.player)) {
      const def = resolver(SIM.player.slots[k].organId);
      for (const sk of def?.skills ?? []) {
        const used = SIM.used.has(k + ':' + sk.id);
        const onceGone = sk.once && SIM.pstate.onceUsed.has(sk.id);
        const cost = sk.cost ?? 0;
        const off = used || onceGone || cost > SIM.pstate.blood;
        const c = el('div', { className: 'card' + (off ? ' off' : ''), title: sk.desc ?? '' });
        c.innerHTML = `<span class="cost">${cost}</span><span class="cn">${esc(sk.label)}</span><br><span class="muted">${esc(def.name)}${sk.once ? ' · 1×' : ''}</span>`;
        if (!off) c.onclick = () => {
          if (ENEMY_TARGET_KINDS.includes(sk.effect?.kind)) {
            SIM.pendingCard = { slotKey: k, sk };
            $('#sim-targethint').textContent = '🎯 clique un organe ennemi accessible…';
            renderSim();
          } else if (sk.effect?.kind === 'heal' || sk.effect?.kind === 'retrigger') {
            SIM.pendingCard = null; playCardOn(k, sk, worstOwnSlot());
          } else { SIM.pendingCard = null; playCardOn(k, sk, null); }
        };
        hand.append(c);
      }
    }
  }

  // corps joueur
  const pb = $('#sim-playerbody'); pb.innerHTML = '';
  for (const k of SLOT_KEYS) {
    const s = SIM.player.slots[k]; if (!s) continue;
    const def = resolver(s.organId);
    const card = el('div', { className: 'orgcard' + (s.hp > 0 ? '' : ' dead') });
    card.append(el('div', { className: 'nm' }, `${esc(def?.name)} <span class="muted">${k}</span>`));
    const hb = el('div', { className: 'hpbar' }); hb.append(el('i', { style: `width:${Math.max(0, 100 * s.hp / (def?.maxHp || 1))}%;background:var(--ok)` }));
    card.append(hb, el('div', { className: 'muted' }, `${s.hp}/${def?.maxHp}`));
    pb.append(card);
  }
}
function worstOwnSlot() {
  const liv = CR.livingSlots(SIM.player);
  return liv.reduce((a, b) => {
    const ra = SIM.player.slots[a].hp / (resolver(SIM.player.slots[a].organId)?.maxHp || 1);
    const rb = SIM.player.slots[b].hp / (resolver(SIM.player.slots[b].organId)?.maxHp || 1);
    return rb < ra ? b : a;
  }, liv[0]);
}

// ── batch : IA gloutonne du test headless ──
$('#sim-batch-run').onclick = () => {
  const N = Math.min(5000, +$('#sim-batch-n').value || 500);
  const player0 = bodyFromSelects('p');
  if (!CR.livingSlots(player0).length) { setStatus('corps joueur vide', 'bad'); return; }
  const setF = $('#sim-mobset').value || null, nOrg = +$('#sim-mobn').value || 3;
  let wins = 0, turnsSum = 0, hpSum = 0, timeouts = 0;
  const t0 = performance.now();
  for (let i = 0; i < N; i++) {
    const rng = mulberry(i + 1);
    const player = deep(player0);
    const mob = genMob(rng, setF, nOrg);
    const pstate = mkPstate(player);
    let plan = CR.chooseMobPlan(mob, player, resolver, rng), turns = 0, win = false, timeout = false;
    while (turns < 40) {
      turns++;
      pstate.blood = CR.bloodPool(player, resolver);
      CR.produceTurnResources(player, pstate, resolver);
      const reach = CR.targetableSlots(mob.body, false);
      mob._target = reach.find((k) => k === 'heart') ?? reach.slice().sort((a, b) => mob.body.slots[a].hp - mob.body.slots[b].hp)[0];
      const used = new Set(); let safety = 0;
      while (pstate.blood > 0 && safety++ < 12) {
        let played = false;
        for (const k of CR.livingSlots(player)) {
          const def = resolver(player.slots[k].organId);
          for (const sk of def?.skills ?? []) {
            if (sk.effect?.kind !== 'damage' || (sk.cost ?? 0) > pstate.blood || used.has(k + ':' + sk.id)) continue;
            const r = CR.playCard(pstate, player, def, sk, { enemy: mob, target: { body: mob.body, slotKey: mob._target, isSelf: false } }, resolver, rng);
            if (r.ok) { used.add(k + ':' + sk.id); played = true; break; }
          }
          if (played) break;
        }
        if (!played) break;
        mob._target = CR.targetableSlots(mob.body, false).find((x) => x === 'heart') || mob._target;
        if (!CR.vitalAlive(mob.body)) break;
      }
      CR.tickEnemyStatus(mob, resolver, rng);
      if (!CR.vitalAlive(mob.body)) { win = true; break; }
      CR.resolveMobPlan(plan, mob, player, pstate, resolver, rng);
      if (!CR.vitalAlive(player)) break;
      plan = CR.chooseMobPlan(mob, player, resolver, rng);
    }
    if (turns >= 40 && !win) timeout = true;
    if (win) {
      wins++;
      const liv = CR.livingSlots(player);
      hpSum += liv.reduce((s, k) => s + player.slots[k].hp, 0) / liv.reduce((s, k) => s + (resolver(player.slots[k].organId)?.maxHp || 1), 0);
    }
    if (timeout) timeouts++;
    turnsSum += turns;
  }
  const ms = Math.round(performance.now() - t0);
  $('#sim-batch-out').innerHTML =
    `<b style="color:var(--accent)">${(100 * wins / N).toFixed(1)}%</b> winrate<br>` +
    `${(turnsSum / N).toFixed(1)} tours moyens<br>` +
    `${(100 * hpSum / Math.max(1, wins)).toFixed(0)}% PV restants (victoires)<br>` +
    `${timeouts} timeouts · ${ms}ms`;
};

// ═══════════════════════════════ ONGLET TAGS ═══════════════════════════════
// Volontairement MINIMAL : une page pour éditer le label et la description de
// chaque tag, rien d'autre. Le reste du catalogue (forme, prérequis, primitives
// visuel/sonore, familles) vit dans content/tags.json, édité à la main — le
// moteur (TagFX, Faculties, EchoFX, SoundBar) le lit tel quel.
function renderTagPage() {
  const box = $('#tag-page'); if (!box) return;
  const q = ($('#tag-search')?.value || '').toLowerCase();
  box.innerHTML = '';
  const cats = [...new Set(Object.values(tagCat()).map((d) => d.categorie ?? 'Autres'))];
  for (const cat of cats) {
    const members = Object.entries(tagCat()).filter(([id, d]) => (d.categorie ?? 'Autres') === cat &&
      (!q || id.includes(q) || (d.label ?? '').toLowerCase().includes(q) || (d.description ?? '').toLowerCase().includes(q)));
    if (!members.length) continue;
    box.append(el('h3', {}, esc(cat)));
    for (const [id, d] of members) {
      const row = el('div', { className: 'frow' });
      row.append(el('label', { style: 'width:180px', title: id }, esc(id)));
      const lab = el('input', { value: d.label ?? '', style: 'width:190px' });
      lab.oninput = () => { d.label = lab.value; persist(); };
      const desc = el('input', { value: d.description ?? '', style: 'flex:1;min-width:280px;max-width:640px' });
      desc.oninput = () => { d.description = desc.value; persist(); };
      row.append(lab, desc);
      box.append(row);
    }
  }
}
$('#tag-search').oninput = () => renderTagPage();

// ═══════════════════════════════ ONGLET ATLAS ═══════════════════════════════
const SRC = import.meta.glob('../src/**/*.js', { query: '?raw', import: 'default' });
let atlas = null;

const GROUP_COLORS = { root: '#b9975b', entities: '#5a86a8', systems: '#a3352b', render: '#5f7a4a', panels: '#9a5aa8', input: '#b0742a' };
function groupOf(path) {
  if (path.includes('/render/panels/')) return 'panels';
  if (path.includes('/render/')) return 'render';
  if (path.includes('/systems/')) return 'systems';
  if (path.includes('/entities/')) return 'entities';
  if (path.includes('/input/')) return 'input';
  return 'root';
}

async function initAtlas() {
  if (atlas) return;
  setStatus('analyse du code…', 'warn');
  const files = {};
  await Promise.all(Object.entries(SRC).map(async ([p, load]) => { files[p] = await load(); }));

  const nodes = [], byPath = {};
  for (const [path, code] of Object.entries(files)) {
    const name = path.split('/').pop().replace('.js', '');
    const exports = [];
    for (const m of code.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let)\s+(\w+)/g)) exports.push(m[1]);
    for (const m of code.matchAll(/export\s*\{([^}]+)\}/g))
      for (const part of m[1].split(',')) { const n = part.trim().split(/\s+as\s+/).pop().trim(); if (n) exports.push(n); }
    const imports = [];
    for (const m of code.matchAll(/import[^'"]*['"](\.[^'"]+)['"]/g)) imports.push(m[1]);
    const n = { path, name, code, exports, imports, lines: code.split('\n').length, group: groupOf(path), out: [], in: [] };
    nodes.push(n); byPath[path] = n;
  }
  // résolution des imports relatifs
  const resolve = (from, rel) => {
    const parts = from.split('/').slice(0, -1);
    for (const seg of rel.split('/')) {
      if (seg === '.') continue; else if (seg === '..') parts.pop(); else parts.push(seg);
    }
    let p = parts.join('/');
    if (!p.endsWith('.js')) p += '.js';
    return byPath[p] ? p : null;
  };
  for (const n of nodes) for (const rel of n.imports) {
    const t = resolve(n.path, rel);
    if (t) { n.out.push(t); byPath[t].in.push(n.path); }
  }
  // code mort suspect : exports jamais cités ailleurs
  for (const n of nodes) {
    n.deadExports = n.exports.filter((ex) => {
      if (ex.length < 3 || ex === 'default') return false;
      const re = new RegExp('\\b' + ex + '\\b');
      return !nodes.some((m) => m !== n && re.test(m.code));
    });
  }
  atlas = { nodes, byPath };

  // légende
  $('#atlas-legend').innerHTML = Object.entries(GROUP_COLORS)
    .map(([g, c]) => `<span><i style="background:${c}"></i>${g}</span>`).join('') +
    `<span class="muted" style="margin-left:14px">${nodes.length} modules · ${nodes.reduce((s, n) => s + n.lines, 0)} lignes</span>`;

  // force layout
  const cv = $('#atlascanvas');
  const W = cv.width = cv.clientWidth, H = cv.height = cv.clientHeight;
  for (const n of nodes) { n.x = W / 2 + (Math.random() - 0.5) * W * 0.7; n.y = H / 2 + (Math.random() - 0.5) * H * 0.7; }
  for (let it = 0; it < 260; it++) {
    for (const a of nodes) {
      let fx = (W / 2 - a.x) * 0.002, fy = (H / 2 - a.y) * 0.002;
      for (const b of nodes) {
        if (a === b) continue;
        const dx = a.x - b.x, dy = a.y - b.y, d2 = Math.max(80, dx * dx + dy * dy);
        fx += dx / d2 * 900; fy += dy / d2 * 900;
      }
      for (const t of a.out) { const b = byPath[t]; fx += (b.x - a.x) * 0.004; fy += (b.y - a.y) * 0.004; }
      for (const t of a.in) { const b = byPath[t]; fx += (b.x - a.x) * 0.004; fy += (b.y - a.y) * 0.004; }
      a.x = Math.max(30, Math.min(W - 30, a.x + fx)); a.y = Math.max(20, Math.min(H - 20, a.y + fy));
    }
  }
  drawAtlas(null);
  cv.onclick = (e) => {
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let best = null, bd = 1e9;
    for (const n of nodes) { const d = (n.x - x) ** 2 + (n.y - y) ** 2; if (d < bd) { bd = d; best = n; } }
    if (bd < 900) { drawAtlas(best); atlasDetail(best); }
  };
  setStatus('atlas prêt');
}

function drawAtlas(sel) {
  const cv = $('#atlascanvas'); const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height);
  const { nodes, byPath } = atlas;
  ctx.lineWidth = 1;
  for (const n of nodes) for (const t of n.out) {
    const b = byPath[t];
    const hot = sel && (n === sel || b === sel);
    ctx.strokeStyle = hot ? '#b9975b' : 'rgba(120,100,70,0.22)';
    ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    // pointe de flèche
    const ang = Math.atan2(b.y - n.y, b.x - n.x);
    const px = b.x - Math.cos(ang) * 12, py = b.y - Math.sin(ang) * 12;
    ctx.beginPath(); ctx.moveTo(px, py);
    ctx.lineTo(px - Math.cos(ang - 0.4) * 5, py - Math.sin(ang - 0.4) * 5);
    ctx.lineTo(px - Math.cos(ang + 0.4) * 5, py - Math.sin(ang + 0.4) * 5);
    ctx.fillStyle = ctx.strokeStyle; ctx.fill();
  }
  for (const n of nodes) {
    const rr = 5 + Math.min(11, n.lines / 60);
    ctx.beginPath(); ctx.arc(n.x, n.y, rr, 0, 7);
    ctx.fillStyle = GROUP_COLORS[n.group]; ctx.fill();
    if (n.deadExports.length) { ctx.strokeStyle = '#e8b25c'; ctx.lineWidth = 2; ctx.stroke(); }
    if (n === sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); }
    if (!n.in.length && n.name !== 'main') {
      ctx.fillStyle = '#e8b25c'; ctx.font = '9px monospace'; ctx.fillText('⚠', n.x - 3, n.y - rr - 3);
    }
    ctx.fillStyle = '#d8c8ab'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(n.name, n.x, n.y + rr + 10);
  }
}

function atlasDetail(n) {
  const side = $('#atlas-side');
  const li = (arr, f) => arr.length ? arr.map(f).join('') : '<span class="muted">—</span>';
  side.innerHTML = `
    <h3 style="margin-top:0">${esc(n.name)}</h3>
    <div class="muted">${esc(n.path.replace('../src/', 'src/'))} · ${n.lines} lignes · ${n.group}</div>
    <h3>Importe (${n.out.length})</h3>${li(n.out, (p) => `<div class="w">→ ${esc(atlas.byPath[p].name)}</div>`)}
    <h3>Importé par (${n.in.length})</h3>${li(n.in, (p) => `<div class="w">← ${esc(atlas.byPath[p].name)}</div>`)}
    ${!n.in.length && n.name !== 'main' ? '<div class="w warn">⚠ jamais importé (orphelin ?)</div>' : ''}
    <h3>Exports (${n.exports.length})</h3>${li(n.exports, (e) => `<div class="w ${n.deadExports.includes(e) ? 'warn' : ''}">${n.deadExports.includes(e) ? '⚠ ' : ''}${esc(e)}</div>`)}
    ${n.deadExports.length ? '<div class="muted" style="margin-top:6px">⚠ = jamais référencé ailleurs (suspect, pas certain)</div>' : ''}
  `;
}

// ═══════════════════════════════ INIT ═══════════════════════════════
renderOrgList();
renderRoomList();
renderRelicList();
renderStructList();
renderTagPage();
simSlotsUI();
fillPreset('human');
setStatus(`${DATA.organs.length} organes · ${Object.keys(tagCat()).length} tags · ${DATA.rooms.length} salles · ${DATA.relics.length} reliques · ${structEntries().length} structures · ${DATA.sets.length} sets`);
