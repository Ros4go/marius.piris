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
import balanceJson from '../content/balance.json';
import resourcesJson from '../content/resources.json';
import { ORGAN_SLOTS, ORGAN_TYPES } from '../src/entities/Body.js';
import * as CR from '../src/systems/combatRules.js';
import * as FAC from '../src/systems/Faculties.js';
import { loadDataRaw, organResolver as regOrganResolver } from '../src/registry.js';
import { WS, initRun } from '../src/WorldState.js';
import { generateFloor } from '../src/systems/DungeonGen.js';
import { rollMob, rollPack, poolFor, budgetFor, tierTauxFor } from '../src/systems/MobGen.js';
import { itemLook, spriteStyle, spriteCalques, animerSprites, structFigure, decorFigure, ANIM_PRESETS, ANIM_EASINGS } from '../src/render/InventoryRenderer.js';
import { organHTML } from '../src/render/InspectorPanel.js';
import { cardHTML, resChipHTML } from '../src/render/CombatHand.js';
import tokensCss from '../styles/tokens.css?raw';
import hudCss from '../styles/hud.css?raw';
import sceneCssRaw from '../styles/scene.css?raw';

const $ = (s) => document.querySelector(s);
const el = (tag, attrs = {}, html = '') => {
  const e = document.createElement(tag);
  Object.assign(e, attrs); if (html) e.innerHTML = html; return e;
};
const deep = (o) => JSON.parse(JSON.stringify(o));
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

// ═══════════════════════════════ WORKSPACE ═══════════════════════════════
const LS_KEY = 'chair_tool_drafts_v3';   // v3 : migration family/loot/cleared/structures — les vieux brouillons sont incompatibles
let DATA = { organs: deep(organsJson), sets: deep(setsJson), rooms: deep(roomsJson), relics: deep(relicsJson), structures: deep(structuresJson), tags: deep(tagsJson), biomes: deep(biomesJson), balance: deep(balanceJson), resources: deep(resourcesJson) };
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  if (saved?.organs) {
    DATA = saved;
    DATA.relics = DATA.relics ?? deep(relicsJson);           // brouillons d'avant l'onglet reliques
    DATA.structures = DATA.structures ?? deep(structuresJson); // idem structures
    DATA.tags = DATA.tags ?? deep(tagsJson);                 // idem tags
    DATA.biomes = DATA.biomes ?? deep(biomesJson);           // idem biomes
    DATA.resources = DATA.resources ?? deep(resourcesJson);  // idem ressources
    // fusion douce : une entrée ajoutée sur le disque (ex: relic_dechet_organique,
    // requise par HungerSystem) rejoint les vieux brouillons au lieu d'être écrasée au 💾
    for (const r of relicsJson) if (!DATA.relics.some((x) => x.id === r.id)) DATA.relics.push(deep(r));
    for (const b of biomesJson) if (!DATA.biomes.some((x) => x.id === b.id)) DATA.biomes.push(deep(b));
    for (const r of resourcesJson) if (!DATA.resources.some((x) => x.id === r.id)) DATA.resources.push(deep(r));
    // tags : le DISQUE est la source de la structure (visuel/forme/prérequis, édités
    // à la main) — l'onglet Tags n'édite que label/description, donc les brouillons
    // ne conservent que ces deux champs. Sans ça, un vieux brouillon d'avant la
    // migration "visuels des yeux en data" écrase le catalogue et casse la vue.
    {
      const brouillons = DATA.tags?.tags ?? {};
      const fusion = deep(tagsJson);
      for (const [id, d] of Object.entries(brouillons)) {
        if (fusion.tags[id]) {
          if (d.label) fusion.tags[id].label = d.label;
          if (d.description) fusion.tags[id].description = d.description;
        } else {
          fusion.tags[id] = d;   // tag créé dans l'atelier : conservé tel quel
        }
      }
      DATA.tags = fusion;
    }
    // structures : adopte les sprites du disque quand le brouillon n'en a pas
    // (brouillons d'avant la conversion en sprites) OU quand le disque publie une
    // version plus récente (sprite.v — permet d'améliorer un sprite livré sans
    // écraser les créations du designer). Le html legacy part avec.
    for (const [kind, sd] of Object.entries(structuresJson)) {
      if (kind === '_doc') continue;
      const d = DATA.structures[kind];
      if (!d) { DATA.structures[kind] = deep(sd); continue; }
      const diskV = sd.sprite?.v ?? 1;
      if ((!d.sprite && sd.sprite) || diskV > (d.sprite?.v ?? 1)) {
        d.sprite = deep(sd.sprite);
        d.spriteTaille = sd.spriteTaille;
        d.spriteRatio = sd.spriteRatio;
        delete d.html;
      }
      if (sd.categorie && !d.categorie) d.categorie = sd.categorie;
      if (sd.accroche && !d.accroche) d.accroche = sd.accroche;
    }
    // salles : adopte les règles de décor du disque quand le brouillon n'en a pas
    // (migration du défaut historique gorge-1/3 en règles explicites)
    for (const src of roomsJson) {
      const d = DATA.rooms.find((x) => x.id === src.id);
      if (d && !d.decos && src.decos) d.decos = deep(src.decos);
    }
    // migration « une salle = un biome » : les copies par biome du disque
    // rejoignent les brouillons ; biomeOnly/sortie adoptés ; weight (obsolète,
    // remplacé par biomes.salles.poids) retiré des brouillons
    for (const src of roomsJson) {
      const d = DATA.rooms.find((x) => x.id === src.id);
      if (!d) { DATA.rooms.push(deep(src)); continue; }
      if (!d.biomeOnly && src.biomeOnly) d.biomeOnly = src.biomeOnly;
      if (src.sortie && !d.sortie) d.sortie = true;
    }
    for (const d of DATA.rooms) { delete d.weight; d.biomeOnly = d.biomeOnly ?? 'gorge'; }
    // scène explicite par salle (le défaut de biome n'existe plus)
    for (const src of roomsJson) {
      const d = DATA.rooms.find((x) => x.id === src.id);
      if (d && !d.scene && src.scene) d.scene = src.scene;
    }
    for (const d of DATA.biomes) delete d.scene;
    // équilibrage : brouillons d'anciens schémas → v3 (tout PAR BIOME).
    // v1 : formule budgetBase/PerFloor → courbe globale ; v2 : courbes globales
    // (budgetCourbe/tierTaux) × difficulté du biome → v3 : mobs.budget [entrée,
    // sortie] + mobs.tiers {tier: poids} sur chaque biome, globales supprimées.
    DATA.balance = DATA.balance ?? deep(balanceJson);
    {
      const m = (DATA.balance.mob = DATA.balance.mob ?? {});
      if (!m.budgetCourbe && (m.budgetBase != null || m.budgetPerFloor != null)) {
        const base = m.budgetBase ?? 5, par = m.budgetPerFloor ?? 2;
        m.budgetCourbe = [[1, base], [20, base + 19 * par]];
      }
      delete m.budgetBase; delete m.budgetPerFloor;
      delete DATA.balance.tierUnlockFloor;
    }
    for (const src of biomesJson) {
      const d = DATA.biomes.find((x) => x.id === src.id);
      if (d && !d.mobs && src.mobs) d.mobs = deep(src.mobs);
    }
    {
      const gBud = DATA.balance.mob?.budgetCourbe;
      const gTiers = DATA.balance.tierTaux;
      for (const d of DATA.biomes) {
        const src = biomesJson.find((x) => x.id === d.id);
        const mb = (d.mobs = d.mobs ?? {});
        mb.sets = mb.sets ?? deep(src?.mobs?.sets ?? []);
        mb.plus = mb.plus ?? []; mb.moins = mb.moins ?? [];
        mb.intrusion = mb.intrusion ?? src?.mobs?.intrusion ?? 0.02;
        const [f0, f1] = d.floorRange ?? [1, 1];
        if (!mb.budget) {
          const diff = mb.difficulte ?? 1;
          mb.budget = gBud
            ? [Math.round(courbeVal(gBud, f0) * diff), Math.round(courbeVal(gBud, f1) * diff)]
            : deep(src?.mobs?.budget ?? [5, 10]);
        }
        if (!mb.tiers) {
          const mid = (f0 + f1) / 2;
          mb.tiers = gTiers
            ? Object.fromEntries(['common', 'rare', 'epic', 'legendary'].map((t) => [t, Math.round(courbeVal(gTiers[t], mid))]))
            : deep(src?.mobs?.tiers ?? { common: 70, rare: 20, epic: 8, legendary: 2 });
        }
        delete mb.difficulte;
      }
      delete DATA.balance.tierTaux;
      if (DATA.balance.mob) delete DATA.balance.mob.budgetCourbe;
    }
    // biomes : adopte la table de peuplement du disque quand le brouillon n'en a
    // pas ; thematicRooms (champ mort) retiré
    for (const src of biomesJson) {
      const d = DATA.biomes.find((x) => x.id === src.id);
      if (d && !d.salles && src.salles) d.salles = deep(src.salles);
    }
    for (const d of DATA.biomes) delete d.thematicRooms;
    // organes/reliques : même règle — adopte le sprite du disque si le brouillon
    // n'en a pas (ou si le disque publie une version plus récente via sprite.v)
    for (const [disque, brouillons, cle] of [[organsJson, DATA.organs, 'id'], [relicsJson, DATA.relics, 'id'], [resourcesJson, DATA.resources, 'id']]) {
      for (const src of disque) {
        const d = brouillons.find((x) => x[cle] === src[cle]);
        if (d && src.sprite && (!d.sprite || (src.sprite.v ?? 1) > (d.sprite.v ?? 1))) d.sprite = deep(src.sprite);
      }
    }
    // nettoyage : une ancienne version de l'éditeur créait D'OFFICE un fond rouge
    // (aplat #6e2c2b) sur la base des sprites ouverts — le fameux « carré rouge ».
    // On le retire partout où le disque n'a pas de fond de base.
    {
      const pollue = (sp2, src) => sp2?.degrade?.stops?.length === 1
        && sp2.degrade.stops[0].c === '#6e2c2b' && !src?.sprite?.degrade;
      for (const [kind, sd] of Object.entries(structuresJson)) {
        if (kind !== '_doc' && pollue(DATA.structures[kind]?.sprite, sd)) delete DATA.structures[kind].sprite.degrade;
      }
      for (const [disque, brouillons] of [[organsJson, DATA.organs], [relicsJson, DATA.relics]]) {
        for (const src of disque) {
          const d = brouillons.find((x) => x.id === src.id);
          if (pollue(d?.sprite, src)) delete d.sprite.degrade;
        }
      }
    }
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
  loadDataRaw({ organs: DATA.organs, sets: DATA.sets, rooms: DATA.rooms, relics: DATA.relics, biomes: DATA.biomes, balance: DATA.balance, resources: DATA.resources });
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
  if (await saveFile('biomes.json', DATA.biomes)) ok.push('biomes');
  if (await saveFile('balance.json', DATA.balance)) ok.push('balance');
  if (await saveFile('resources.json', DATA.resources)) ok.push('resources');
  setStatus(ok.length ? `sauvé : ${ok.join(', ')}` : 'annulé', ok.length ? 'ok' : 'warn');
};
$('#btn-reset').onclick = () => {
  if (!confirm('Écraser les brouillons avec le contenu réel des JSON ?')) return;
  DATA = { organs: deep(organsJson), sets: deep(setsJson), rooms: deep(roomsJson), relics: deep(relicsJson), structures: deep(structuresJson), tags: deep(tagsJson), biomes: deep(biomesJson), balance: deep(balanceJson), resources: deep(resourcesJson) };
  persist(); renderOrgList(); renderRoomList(); renderRelicList(); renderStructList(); renderTagPage(); renderBiomeList(); renderEquiPage(); renderResList(); orgEditor(null); roomEditor(null); relicEditor(null); structEditor(null); biomeEditor(null); resEditor(null); simSlotsUI();
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

const EFFECT_KINDS = ['damage', 'heal', 'res', 'bile', 'saignement', 'vulnerabilite', 'protect', 'regen', 'frenesie', 'convert', 'blood', 'retrigger'];
// Formulaire par kind : [clé, label, type] — type: num | bool | sel:a:b
const EFFECT_FIELDS = {
  damage: [['amount', 'dégâts', 'num'], ['pierce', 'perce les couches', 'bool'], ['splash', 'éclabousse adjacents', 'num'],
           ['bleed', 'saignement infligé', 'num'], ['lifesteal', 'vol de vie', 'num'], ['meatOnKill', 'viande si kill', 'num'], ['costMeat', 'coût viande', 'num']],
  heal: [['amount', 'soin', 'num'], ['target', 'cible', 'sel::all'], ['costMeat', 'coût viande', 'num']],
  res: [['res', 'ressource', 'res'], ['amount', 'stacks', 'num']],
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
  res: 'Donne N stacks d\'une ressource (onglet Ressources) : une ressource d\'entité va dans ton portefeuille, une ressource d\'organe se pose sur l\'organe visé (ennemi, ou le tien en te ciblant). Ses règles (ticks, absorption, blocages…) viennent de sa fiche.',
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
    animerSprites(wrap);   // les animations de sprites tournent aussi dans l'aperçu
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
  let _minis = [];   // repeints des pastilles de calques (mise à jour sans rebâtir l'éditeur)
  const _ouverts = new WeakSet();   // calques dépliés (par objet — survit aux re-rendus)
  const touch = () => { persist(); onChange(); for (const p of _minis) p(); };
  // pastille : LE calque seul, recentré et agrandi (position/taille ignorées, tout
  // le reste — forme, dégradé, éclat, rotation, alpha, anims — rendu réel)
  const miniCalque = (k) => {
    const f = 76 / Math.max(k.l ?? 20, k.h ?? 20, 1);
    return spriteCalques({ calques: [{ ...k, x: 50, y: 50, l: (k.l ?? 20) * f, h: (k.h ?? 20) * f }] });
  };
  const render = () => {
    box.innerHTML = '';
    _minis = [];
    const sp = obj.sprite;
    // préréglage + retour au CSS par défaut
    const prRow = el('div', { className: 'frow' });
    prRow.append(el('label', {}, 'sprite'));
    const prSel = el('select');
    prSel.append(el('option', { value: '' }, sp ? 'personnalisé' : '(CSS par défaut)'));
    for (const k of Object.keys(SPRITE_PRESETS)) prSel.append(el('option', { value: k }, 'préréglage : ' + k));
    // toute structure spritée est un préréglage — source unique : DATA.structures
    const ogSt = el('optgroup', { label: 'structures' });
    for (const [kind2, sd] of structEntries()) if (sd.sprite && sd !== obj) ogSt.append(el('option', { value: 'struct:' + kind2 }, sd.label ?? kind2));
    if (ogSt.children.length) prSel.append(ogSt);
    prSel.onchange = () => {
      if (!prSel.value) return;
      obj.sprite = prSel.value.startsWith('struct:')
        ? deep(DATA.structures[prSel.value.slice(7)].sprite)
        : deep(SPRITE_PRESETS[prSel.value]);
      touch(); render();
    };
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

    // ── widgets PARTAGÉS base/calques : chaque calque a les mêmes réglages ──
    const slider = (host, label, title, get, set, min, max, step = 1, unit = '') => {
      const row = el('div', { className: 'frow' });
      row.append(el('label', { title }, label));
      const s = el('input', { type: 'range', min, max, step, value: get(), style: 'width:150px' });
      const num = el('span', { className: 'muted' }, get() + unit);
      s.oninput = () => { set(+s.value); num.textContent = s.value + unit; touch(); };
      row.append(s, num); host.append(row);
    };
    // forme (border-radius) : texte libre + formes connues + 🎲
    const formeUI = (host, holder) => {
      const row = el('div', { className: 'frow' });
      row.append(el('label', {}, 'forme'));
      const inp = el('input', { className: 'wide', value: holder.forme ?? '', placeholder: 'border-radius (ex: 50% 50% 55% 45% / 60% 55% 45% 50%)' });
      inp.oninput = () => { holder.forme = inp.value; touch(); };
      const sel = el('select');
      sel.append(el('option', { value: '' }, 'formes…'));
      for (const [v, l] of FORME_PRESETS) sel.append(el('option', { value: v }, l));
      sel.onchange = () => { if (!sel.value) return; holder.forme = sel.value; inp.value = sel.value; sel.value = ''; touch(); };
      const rnd = el('button', { className: 'tiny', title: 'forme aléatoire — reclique jusqu\'à tomber sur une silhouette loufoque' }, '🎲');
      rnd.onclick = () => { holder.forme = randForme(); inp.value = holder.forme; touch(); };
      row.append(inp, sel, rnd); host.append(row);
    };
    // dégradé : 1 à 4 couleurs (1 = aplat), positions optionnelles (deux = anneau
    // net, cf œil), lumière = centre du dégradé (dès 2 couleurs). NE JAMAIS créer
    // le dégradé d'office : une base sans fond est transparente (organes composés,
    // structures) — l'auto-création peignait un carré plein derrière les calques.
    const degradeUI = (host, holder, defCouleur) => {
      if (!holder.degrade?.stops?.length) {
        const row = el('div', { className: 'frow' });
        row.append(el('label', {}, 'couleurs'));
        const add = el('button', { className: 'tiny' }, '+ fond');
        add.onclick = () => { holder.degrade = { cx: 50, cy: 50, stops: [{ c: defCouleur }] }; touch(); render(); };
        row.append(add, el('span', { className: 'muted' }, 'sans fond, la base est transparente (les calques dessinent tout)'));
        host.append(row);
        return;
      }
      const dg = holder.degrade;
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
        const del = el('button', { className: 'tiny danger', title: 'retirer cette couleur (plus aucune = base transparente)' }, '✕');
        del.onclick = () => { dg.stops.splice(i, 1); if (!dg.stops.length) delete holder.degrade; touch(); render(); };
        row.append(del);
        if (i === dg.stops.length - 1 && dg.stops.length < 4) {
          const add = el('button', { className: 'tiny' }, '+ couleur');
          add.onclick = () => { dg.stops.push({ c: '#3a2c12' }); touch(); render(); };
          row.append(add);
        }
        host.append(row);
      });
      if (dg.stops.length >= 2) {
        slider(host, 'lumière x', 'position du point brillant du dégradé', () => dg.cx ?? 50, (v) => { dg.cx = v; }, 0, 100, 1, '%');
        slider(host, 'lumière y', '', () => dg.cy ?? 50, (v) => { dg.cy = v; }, 0, 100, 1, '%');
      }
    };
    // éclat (halo lumineux, cf reliques) + ombre portée
    const eclatOmbreUI = (host, holder, ombreParDefaut) => {
      const row = el('div', { className: 'frow' });
      row.append(el('label', {}, 'éclat'));
      const cb = el('input', { type: 'checkbox', checked: !!holder.eclat });
      cb.onchange = () => { if (cb.checked) holder.eclat = { c: '#c9a440', alpha: 0.4, rayon: 6 }; else delete holder.eclat; touch(); render(); };
      row.append(cb);
      if (holder.eclat) {
        const ec = el('input', { type: 'color', value: holder.eclat.c, title: 'couleur du halo' });
        ec.oninput = () => { holder.eclat.c = ec.value; touch(); };
        const ea = el('input', { type: 'range', min: 0.1, max: 1, step: 0.05, value: holder.eclat.alpha ?? 0.4, style: 'width:78px', title: 'intensité' });
        ea.oninput = () => { holder.eclat.alpha = +ea.value; touch(); };
        const er = el('input', { type: 'range', min: 2, max: 16, step: 1, value: holder.eclat.rayon ?? 6, style: 'width:78px', title: 'rayon (px)' });
        er.oninput = () => { holder.eclat.rayon = +er.value; touch(); };
        row.append(ec, ea, er);
      }
      // ombre : la base l'a par défaut (ombre: false pour l'enlever), un calque non (ombre: true pour l'avoir)
      const ocb = el('input', { type: 'checkbox', checked: ombreParDefaut ? holder.ombre !== false : !!holder.ombre });
      ocb.onchange = () => {
        if (ombreParDefaut) { if (ocb.checked) delete holder.ombre; else holder.ombre = false; }
        else { if (ocb.checked) holder.ombre = true; else delete holder.ombre; }
        touch();
      };
      const ol = el('label', { style: 'width:auto;font-size:11px', className: 'muted' });
      ol.append(ocb, document.createTextNode(' ombre portée'));
      row.append(ol);
      host.append(row);
    };

    // animations : préréglages (clignement…) ou custom {valeur, de → à, durée,
    // courbe d'easing} — jouées par le MÊME animerSprites() que le jeu (WAAPI)
    const ANIM_PROPS = [
      ['alpha', 'opacité'], ['echelle', 'échelle'], ['x', 'position x (%)'], ['y', 'position y (%)'],
      ['rot', 'rotation (°)'], ['forme', 'forme (border-radius)'], ['teinte', 'teinte (hue °)'], ['couleur', 'couleur (aplat)'],
    ];
    const animUI = (host, holder) => {
      (holder.anim ?? []).forEach((a, i) => {
        const row = el('div', { className: 'frow' });
        row.append(el('label', {}, i === 0 ? 'animations' : ''));
        const pSel = el('select', { title: 'préréglage, ou custom pour choisir la valeur animée' });
        pSel.append(el('option', { value: '' }, 'custom…'));
        for (const [k, p] of Object.entries(ANIM_PRESETS)) pSel.append(el('option', { value: k, selected: a.preset === k, title: p.doc }, k));
        pSel.onchange = () => {
          if (pSel.value) holder.anim[i] = { preset: pSel.value };
          else holder.anim[i] = { prop: 'alpha', de: 1, a: 0.4, duree: 1.5, easing: 'ease-in-out' };
          touch(); render();
        };
        row.append(pSel);
        if (!a.preset) {
          const prSel = el('select', { title: 'valeur animée' });
          for (const [v, l] of ANIM_PROPS) prSel.append(el('option', { value: v, selected: a.prop === v }, l));
          prSel.onchange = () => { a.prop = prSel.value; delete a.de; delete a.a; touch(); render(); };
          const val = (key) => {
            if (a.prop === 'forme') {
              const t = el('input', { value: a[key] ?? '', placeholder: key === 'de' ? '50%' : '30% 70%…', style: 'width:110px', title: key === 'de' ? 'border-radius de départ' : 'border-radius d\'arrivée' });
              t.oninput = () => { a[key] = t.value; touch(); };
              return t;
            }
            if (a.prop === 'couleur') {
              const c = el('input', { type: 'color', value: a[key] ?? (key === 'de' ? '#6e2c2b' : '#2a0f10') });
              c.oninput = () => { a[key] = c.value; touch(); };
              return c;
            }
            const n = el('input', { type: 'number', value: a[key] ?? '', step: 'any', style: 'width:58px', placeholder: key });
            n.oninput = () => { if (n.value === '') delete a[key]; else a[key] = +n.value; touch(); };
            return n;
          };
          row.append(prSel, val('de'), el('span', { className: 'muted' }, '→'), val('a'));
        }
        const dur = el('input', { type: 'number', value: a.duree ?? '', step: 0.1, min: 0.1, style: 'width:56px', placeholder: 's', title: 'durée (secondes)' });
        dur.oninput = () => { if (dur.value === '') delete a.duree; else a.duree = +dur.value; touch(); };
        const eSel = el('select', { title: 'courbe d\'easing' });
        for (const [v, l] of ANIM_EASINGS) eSel.append(el('option', { value: v, selected: (a.easing ?? 'ease-in-out') === v }, l));
        eSel.onchange = () => { a.easing = eSel.value; touch(); };
        const del = el('button', { className: 'tiny danger' }, '✕');
        del.onclick = () => { holder.anim.splice(i, 1); if (!holder.anim.length) delete holder.anim; touch(); render(); };
        row.append(dur, eSel, del);
        host.append(row);
      });
      if ((holder.anim ?? []).length < 3) {
        const r = el('div', { className: 'frow' });
        r.append(el('label', {}, (holder.anim ?? []).length ? '' : 'animations'));
        const add = el('button', { className: 'tiny' }, '+ animation');
        add.onclick = () => { (holder.anim = holder.anim ?? []).push({ preset: 'pulsation' }); touch(); render(); };
        r.append(add);
        if (!(holder.anim ?? []).length) r.append(el('span', { className: 'muted' }, 'clignement, pulsation… ou custom (valeur + courbe)'));
        host.append(r);
      }
    };

    // ── forme de base ──
    formeUI(box, sp);
    degradeUI(box, sp, '#6e2c2b');
    slider(box, 'taille', 'taille dans la cellule de besace', () => sp.taille ?? 60, (v) => { sp.taille = v; }, 30, 100, 1, '%');
    eclatOmbreUI(box, sp, true);
    animUI(box, sp);

    // ── calques : mêmes réglages que la base + position/taille/rotation/alpha ──
    // REPLIÉS par défaut : l'en-tête (pastille + position) reste toujours visible,
    // ▸ déplie forme/couleurs/éclat/alpha/animations. L'état suit l'objet calque.
    const cal = () => (sp.calques = sp.calques ?? []);
    (sp.calques ?? []).forEach((k, i) => {
      const ouvert = _ouverts.has(k);
      const sub = el('div', { style: 'border:1px dashed var(--line);border-radius:3px;padding:6px 8px;margin:6px 0' });
      const head = el('div', { className: 'frow', style: 'margin-bottom:' + (ouvert ? '8px' : '0') });
      const chev = el('button', { className: 'tiny', title: ouvert ? 'replier' : 'déplier (forme, couleurs, éclat, animations)' }, ouvert ? '▾' : '▸');
      chev.onclick = () => { if (ouvert) _ouverts.delete(k); else _ouverts.add(k); render(); };
      head.append(el('label', { style: 'width:64px' }, `calque ${i + 1}`), chev);
      // mini-rendu du calque seul (rafraîchi à chaque édition, animations comprises)
      const mini = el('span', { title: 'ce calque seul (position/taille normalisées)' });
      mini.style.cssText = 'width:34px;height:34px;flex:none;position:relative;display:inline-block;background:#0a0705;border:1px solid var(--line);border-radius:3px;overflow:hidden;';
      const paint = () => { mini.innerHTML = miniCalque(k); animerSprites(mini); };
      paint();
      _minis.push(paint);
      head.append(mini);
      const num = (key, def, title) => {
        const n = el('input', { type: 'number', value: k[key] ?? def, min: -50, max: 150, style: 'width:52px', title });
        n.oninput = () => { k[key] = +n.value; touch(); };
        return n;
      };
      const rot = el('input', { type: 'number', value: k.rot ?? 0, min: -180, max: 180, style: 'width:52px', title: 'rotation (°)' });
      rot.oninput = () => { if (+rot.value) k.rot = +rot.value; else delete k.rot; touch(); };
      const mir = el('button', { className: 'tiny', title: 'dupliquer en miroir (x et lumière → 100−x, rotation inversée) — parfait pour le 2e œil' }, '⧉');
      mir.onclick = () => {
        const m = deep(k);
        m.x = 100 - (k.x ?? 50);
        if (m.degrade?.cx != null) m.degrade.cx = 100 - m.degrade.cx;
        if (m.rot) m.rot = -m.rot;
        cal().splice(i + 1, 0, m); touch(); render();
      };
      // ordre d'empilement = ordre de la liste (le dernier est AU-DESSUS)
      const up = el('button', { className: 'tiny', title: 'descendre dans la pile (passe DERRIÈRE)' }, '▲');
      up.disabled = i === 0;
      up.onclick = () => { const c2 = cal(); [c2[i - 1], c2[i]] = [c2[i], c2[i - 1]]; touch(); render(); };
      const dn = el('button', { className: 'tiny', title: 'monter dans la pile (passe DEVANT)' }, '▼');
      dn.disabled = i === cal().length - 1;
      dn.onclick = () => { const c2 = cal(); [c2[i + 1], c2[i]] = [c2[i], c2[i + 1]]; touch(); render(); };
      const del = el('button', { className: 'tiny danger' }, '✕');
      del.onclick = () => { cal().splice(i, 1); if (!cal().length) delete sp.calques; touch(); render(); };
      head.append(num('x', 50, 'position x (%) — centre du calque'), num('y', 50, 'position y (%)'),
                  num('l', 20, 'largeur (%)'), num('h', 20, 'hauteur (%)'), rot, up, dn, mir, del);
      sub.append(head);
      if (ouvert) {
        formeUI(sub, k);
        degradeUI(sub, k, '#100c0a');
        eclatOmbreUI(sub, k, false);
        slider(sub, 'alpha', 'opacité du calque', () => k.alpha ?? 1, (v) => { if (v >= 1) delete k.alpha; else k.alpha = v; }, 0.05, 1, 0.05, '');
        animUI(sub, k);
      }
      box.append(sub);
    });
    const calRow = el('div', { className: 'frow' });
    calRow.append(el('label', {}, (sp.calques ?? []).length ? '' : 'calques'));
    const addCal = el('button', { className: 'tiny' }, '+ calque');
    addCal.disabled = (sp.calques ?? []).length >= 12;
    addCal.onclick = () => {
      const nk = { degrade: { cx: 35, cy: 30, stops: [{ c: '#100c0a' }] }, x: 35, y: 40, l: 14, h: 14 };
      cal().push(nk);
      _ouverts.add(nk);   // un calque fraîchement créé s'ouvre pour être édité
      touch(); render();
    };
    calRow.append(addCal);
    if (sp.calques?.length) {
      const dcb = el('input', { type: 'checkbox', checked: !!sp.decoupe });
      dcb.onchange = () => { if (dcb.checked) sp.decoupe = true; else delete sp.decoupe; touch(); };
      const dl = el('label', { style: 'width:auto;font-size:11px', className: 'muted', title: 'ce qui dépasse la forme de base est coupé — décoché, les calques peuvent déborder (cornes, antennes)' });
      dl.append(dcb, document.createTextNode(' découper aux bords'));
      calRow.append(dl);
    } else {
      calRow.append(el('span', { className: 'muted' }, 'yeux, taches, détails posés par-dessus la forme — mêmes réglages que la base'));
    }
    box.append(calRow);
  };
  render();
  return box;
}

// ── Zone "Visuel" des structures : la VRAIE figure (classe npc-figure + html
// data), rendue avec les vraies feuilles de style dans un shadow DOM — même
// principe que la cellule de besace des organes/reliques.
function structVisuelZone(kind, s) {
  const fs = el('fieldset'); fs.append(el('legend', {}, 'Visuel — figure dans la salle (rendu réel)'));
  // fond du plateau commutable (sombre = ambiance salle, clair = lecture des contours)
  const FONDS = [
    ['radial-gradient(ellipse at 50% 20%, #17100b, #070403 85%)', '◐ fond clair'],
    ['radial-gradient(ellipse at 50% 20%, #efe8da, #cfc4b0 85%)', '◑ fond sombre'],
  ];
  let fond = 0;
  const fbtn = el('button', { className: 'tiny', style: 'margin-bottom:4px' }, FONDS[0][1]);
  fbtn.onclick = () => {
    fond = 1 - fond;
    stage.style.background = FONDS[fond][0];
    fbtn.textContent = FONDS[fond][1];
  };
  fs.append(fbtn);
  const host = el('div');
  const sh = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = tokensCss.replaceAll(':root', ':host') + sceneCssRaw + hudCss;
  const stage = document.createElement('div');
  stage.style.cssText = 'position:relative;width:440px;height:230px;background:' + FONDS[0][0] + ';border:1px solid #241a12;overflow:hidden;';
  sh.append(style, stage);
  const refresh = () => {
    // même compilateur que le jeu : figure npc pour les structures, decorFigure
    // (accroche sol/mur/plafond) pour les décorations
    if (isDeco(s)) {
      stage.style.setProperty('--gore-left', '38%');
      stage.innerHTML = decorFigure(s);
    } else {
      const fig = structFigure(s);
      stage.innerHTML = `<div class="npc-figure pos-center ${esc(kind)}${s.floor ? ' on-floor' : ''}" style="${fig.style}">${fig.html}</div>`;
    }
    animerSprites(stage);
  };
  refresh();
  fs.append(host);
  return { fs, refresh };
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
    // couleur DU SET (partagée : pastilles de liste, accent des cartes, organes des mobs)
    const setDe = (id2) => DATA.sets.find((x) => x.id === id2);
    const sc = el('input', { type: 'color', value: /^#[0-9a-fA-F]{6}$/.test(setDe(o.set)?.color ?? '') ? setDe(o.set).color : '#888888',
      title: 'couleur du set (liste, accent des cartes de combat, organes des mobs) — « + set » dans la barre du bas pour en créer un' });
    sc.oninput = () => { const st = setDe(s1.value); if (st) { st.color = sc.value; persist(); renderOrgList(); } };
    s1.onchange = () => { o.set = s1.value; const st = setDe(s1.value); if (/^#[0-9a-fA-F]{6}$/.test(st?.color ?? '')) sc.value = st.color; persist(); renderOrgList(); };
    s2.onchange = () => { o.tier = s2.value; persist(); renderOrgList(); };
    row.append(s1, s2, sc); return row;
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
      const hps = [...new Set([maxHp, Math.max(1, Math.round(maxHp * 0.45)), 1, 0])];
      return hps.map((hp) => ({ item: { organId: o.id, hp },
        label: `${d2.getQuality(hp).name === 'destroyed' ? 'détruit' : d2.getQuality(hp).name} · ${hp} PV` }));
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

  // skills — REPLIÉS par défaut : l'en-tête résume (label · coût · effets), ▸
  // déplie la vraie CARTE de combat (cardHTML partagé avec CombatHand) + le formulaire
  const fs3 = el('fieldset'); fs3.append(el('legend', {}, 'Skills (cartes)'));
  const skbox = el('div');
  const _skOuverts = new WeakSet();
  const renderSkills = () => {
    skbox.innerHTML = '';
    for (const [i, sk] of (o.skills ?? []).entries()) {
      const ouvert = _skOuverts.has(sk);
      const d = el('div', { className: 'skill' });
      const head = el('div', { className: 'frow', style: 'cursor:pointer;margin-bottom:' + (ouvert ? '8px' : '0') });
      const chev = el('button', { className: 'tiny' }, ouvert ? '▾' : '▸');
      const kinds = skillEffects(sk).map((e) => e?.kind).filter(Boolean).join(' + ') || 'aucun effet';
      head.append(chev, el('span', {}, `<b style="color:var(--accent)">${esc(sk.label ?? sk.id ?? 'skill')}</b> · ${sk.cost ?? 0} sang · <span class="muted">${esc(kinds)}${sk.once ? ' · 1×' : ''}</span>`));
      head.onclick = () => { if (ouvert) _skOuverts.delete(sk); else _skOuverts.add(sk); renderSkills(); };
      d.append(head);
      if (!ouvert) { skbox.append(d); continue; }

      // la carte telle qu'elle sort en combat (mêmes markup + CSS que le jeu)
      const chost = el('div');
      const csh = chost.attachShadow({ mode: 'open' });
      const cst = document.createElement('style');
      cst.textContent = tokensCss.replaceAll(':root', ':host') + hudCss;
      const cwrap = document.createElement('div');
      cwrap.style.cssText = 'padding:4px 2px 10px;';
      csh.append(cst, cwrap);
      const repaintCard = () => {
        const layer = Object.values(ORGAN_SLOTS).find((s2) => s2.type === o.type)?.layer ?? 'x';
        const accent = o.color ?? DATA.sets.find((s2) => s2.id === o.set)?.color;
        cwrap.innerHTML = `<div class="ccard l-${layer}" style="cursor:default${accent ? `;--card-accent:${accent}` : ''}">`
          + cardHTML({ label: sk.label ?? '?', cost: sk.cost ?? 0, couts: sk.couts, desc: sk.desc ?? '', organName: o.name }) + '</div>';
      };
      repaintCard();
      d.append(chost);

      const mk = (lbl, key, type = 'text', w = 120) => {
        const r = el('div', { className: 'frow' }); r.append(el('label', {}, lbl));
        const x = el('input', { type, value: sk[key] ?? '', style: `width:${w}px` });
        x.oninput = () => { sk[key] = type === 'number' ? +x.value : x.value; persist(); repaintCard(); };
        r.append(x); return r;
      };
      d.append(mk('id', 'id'), mk('label', 'label'), mk('coût sang', 'cost', 'number', 60));
      // multi-coûts : un skill peut consommer x d'une ressource, y d'une autre… (skill.couts)
      const coutBox = el('div');
      const renderCouts = () => {
        coutBox.innerHTML = '';
        Object.entries(sk.couts ?? {}).forEach(([rid, n], ci) => {
          const row = el('div', { className: 'frow' });
          row.append(el('label', {}, ci === 0 ? 'coûts ressources' : ''));
          const s = el('select');
          for (const r2 of DATA.resources) s.append(el('option', { value: r2.id, selected: r2.id === rid }, r2.name));
          s.onchange = () => { const v = sk.couts[rid]; delete sk.couts[rid]; sk.couts[s.value] = v; persist(); renderCouts(); repaintCard(); };
          const nn = el('input', { type: 'number', value: n, min: 1, style: 'width:56px' });
          nn.oninput = () => { sk.couts[rid] = +nn.value; persist(); repaintCard(); };
          const del = el('button', { className: 'tiny danger' }, '✕');
          del.onclick = () => { delete sk.couts[rid]; if (!Object.keys(sk.couts).length) delete sk.couts; persist(); renderCouts(); repaintCard(); };
          row.append(s, nn, del);
          coutBox.append(row);
        });
        const add = el('button', { className: 'tiny', title: 'coût supplémentaire : la carte n\'est jouable que si TOUTES les ressources sont payables (une ressource d\'organe est payée par l\'organe qui joue, selon sa fiche)' }, '+ coût en ressource');
        add.onclick = () => {
          const dispo = DATA.resources.find((r2) => !(sk.couts ?? {})[r2.id]);
          if (!dispo) return;
          (sk.couts = sk.couts ?? {})[dispo.id] = 1;
          persist(); renderCouts(); repaintCard();
        };
        coutBox.append(add);
      };
      renderCouts();
      d.append(coutBox);
      const oncerow = el('div', { className: 'frow' }); oncerow.append(el('label', {}, 'once/combat'));
      const cb = el('input', { type: 'checkbox', checked: !!sk.once });
      cb.onchange = () => { sk.once = cb.checked || undefined; persist(); };
      oncerow.append(cb); d.append(oncerow);
      const descrow = el('div', { className: 'frow' }); descrow.append(el('label', {}, 'desc'));
      const dx = el('input', { className: 'wide', value: sk.desc ?? '' });
      dx.oninput = () => { sk.desc = dx.value; persist(); repaintCard(); };
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
          ks.onchange = () => { list[fi] = { kind: ks.value, ...(ks.value === 'damage' ? { target: 'enemy_organ' } : {}), ...(ks.value === 'res' ? { res: DATA.resources[0]?.id, amount: 1 } : {}) };
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
            } else if (type === 'res') {
              const s = el('select');
              for (const r2 of DATA.resources) s.append(el('option', { value: r2.id, selected: (eff[key] ?? '') === r2.id }, `${r2.name} (${r2.porteur === 'organe' ? 'organe' : 'entité'})`));
              s.onchange = () => { eff[key] = s.value; writeEffects(sk, list); persist(); showWarns(); };
              row.append(s);
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
    const nsk = { id: 'new_skill', label: 'Nouveau', cost: 1, desc: '', effect: { kind: 'damage', amount: 3, target: 'enemy_organ' } };
    (o.skills = o.skills ?? []).push(nsk);
    _skOuverts.add(nsk);   // un skill fraîchement créé s'ouvre pour être édité
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

  // Inspecteur : la fiche générée EXACTEMENT comme en jeu (organHTML partagé,
  // vrai CSS ins-* dans un shadow DOM) — suit les éditions en direct
  const fsInsp = el('fieldset'); fsInsp.append(el('legend', {}, 'Inspecteur — fiche générée (rendu réel)'));
  const ihost = el('div');
  const ish = ihost.attachShadow({ mode: 'open' });
  const ist = document.createElement('style');
  ist.textContent = tokensCss.replaceAll(':root', ':host') + hudCss;
  const ibox = document.createElement('div');
  ibox.style.cssText = 'max-width:320px;background:#0b0807;border:1px solid #241a12;padding:8px 10px;';
  ish.append(ist, ibox);
  fsInsp.append(ihost);
  const refreshInsp = () => {
    try { ibox.innerHTML = organHTML(o.id, undefined, null); }
    catch (e) { ibox.textContent = '✕ ' + e.message; }
  };
  refreshInsp();
  ed.append(fsInsp);

  const wbox = el('div', { className: 'warns' });
  ed.append(el('h3', {}, 'Validation'), wbox);
  function showWarns() {
    wbox.innerHTML = '';
    for (const [cls, msg] of orgValidate(o)) wbox.append(el('div', { className: 'w ' + cls }, (cls === 'bad' ? '✕ ' : cls === 'warn' ? '⚠ ' : '✓ ') + esc(msg)));
    refreshInsp();   // la fiche inspecteur suit les mêmes éditions
  }
  showWarns();
}

$('#org-search').oninput = renderOrgList;
$('#org-new').onclick = () => {
  const o = { id: 'organ_' + Date.now() % 100000, type: 'arm', name: 'Nouvel organe', set: DATA.sets[0]?.id ?? 'human', tier: 'common', hp: 10, layer: 'outer', price: 10, tags: [], passives: [], skills: [], harvest: {},
    sprite: { forme: '50% 50% 55% 45% / 60% 55% 45% 50%', degrade: { cx: 35, cy: 30, stops: [{ c: '#6e2c2b' }, { c: '#2a0f10' }] }, taille: 62 } };
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
const isDeco = (s) => s?.categorie === 'decoration';
// les structures cliquables seulement (tirages des salles, spawn du simulateur)
const structOnly = () => structEntries().filter(([, s]) => !isDeco(s));

function renderStructList() {
  const q = ($('#struct-search').value || '').toLowerCase();
  const box = $('#struct-list'); box.innerHTML = '';
  const hits = structEntries().filter(([k, s2]) => !q || k.includes(q) || (s2.label ?? '').includes(q));
  for (const [grp, filtre] of [['Structures', (s2) => !isDeco(s2)], ['Décorations', isDeco]]) {
    const members = hits.filter(([, s2]) => filtre(s2));
    if (!members.length) continue;
    box.append(el('div', { className: 'grp' }, grp));
    for (const [kind, s] of members) {
      const it = el('div', { className: 'item' + (kind === structSel ? ' sel' : '') });
      it.append(el('span', { className: 'nm' }, esc(s.label ?? kind)));
      it.append(el('span', { className: 'id' }, esc(isDeco(s) ? (s.accroche ?? 'sol') : (s.panel ?? ''))));
      it.onclick = () => { structSel = kind; renderStructList(); structEditor(kind); };
      box.append(it);
    }
  }
}

function structEditor(kind) {
  const ed = $('#struct-editor');
  const s = kind ? DATA.structures[kind] : null;
  if (!s) { ed.innerHTML = '<p class="muted">Sélectionne une structure à gauche.</p>'; return; }
  ed.innerHTML = '';
  const vz = structVisuelZone(kind, s);

  const fs1 = el('fieldset'); fs1.append(el('legend', {}, `${isDeco(s) ? 'Décoration' : 'Structure'} "${esc(kind)}"`));
  const row1 = el('div', { className: 'frow' });
  row1.append(el('label', {}, 'label'));
  const lx = el('input', { value: s.label ?? '' });
  lx.oninput = () => { s.label = lx.value; persist(); renderStructList(); };
  row1.append(lx); fs1.append(row1);

  // catégorie : structure (cliquable, panneau, tirée par les salles) ou
  // décoration (ambiance pure, accrochée dans la salle, tirée par SceneRenderer)
  const rowC = el('div', { className: 'frow' });
  rowC.append(el('label', {}, 'catégorie'));
  const cs = el('select');
  cs.append(el('option', { value: 'structure', selected: !isDeco(s) }, 'structure (cliquable → panneau)'));
  cs.append(el('option', { value: 'decoration', selected: isDeco(s) }, 'décoration (ambiance)'));
  cs.onchange = () => {
    if (cs.value === 'decoration') { s.categorie = 'decoration'; s.accroche = s.accroche ?? 'sol'; }
    else { delete s.categorie; delete s.accroche; }
    persist(); renderStructList(); structEditor(kind);
  };
  rowC.append(cs); fs1.append(rowC);

  if (isDeco(s)) {
    const rowA = el('div', { className: 'frow' });
    rowA.append(el('label', {}, 'accroche'));
    const as2 = el('select');
    for (const [v, l] of [['sol', 'sol (posée par terre)'], ['mur', 'mur (à mi-hauteur)'], ['plafond', 'plafond (suspendue)']])
      as2.append(el('option', { value: v, selected: (s.accroche ?? 'sol') === v }, l));
    as2.onchange = () => { s.accroche = as2.value; persist(); renderStructList(); vz.refresh(); };
    rowA.append(as2); fs1.append(rowA);
  } else {
    const row2 = el('div', { className: 'frow' });
    row2.append(el('label', {}, 'au sol'));
    const fcb = el('input', { type: 'checkbox', checked: !!s.floor });
    fcb.onchange = () => { s.floor = fcb.checked; persist(); vz.refresh(); };
    row2.append(fcb, el('span', { className: 'muted' }, 'posé par terre (ramassage) plutôt que debout'));
    fs1.append(row2);

    const row3 = el('div', { className: 'frow' });
    row3.append(el('label', {}, 'panneau'));
    const ps = el('select');
    for (const p of PANEL_KINDS) ps.append(el('option', { value: p, selected: s.panel === p }, p));
    ps.onchange = () => { s.panel = ps.value; persist(); renderStructList(); };
    row3.append(ps, el('span', { className: 'muted' }, 'quel panneau s\'ouvre quand on la clique'));
    fs1.append(row3);
  }
  // sprite paramétrique : le MÊME éditeur que les organes/reliques — s'il est
  // défini, il remplace la silhouette HTML ci-dessous (formes, calques, animations)
  vz.fs.append(spriteEditor(s, vz.refresh));
  const tfRow = el('div', { className: 'frow' });
  tfRow.append(el('label', { title: 'largeur de la figure en % de la salle (utilisé seulement avec un sprite)' }, 'taille figure'));
  const tfs = el('input', { type: 'range', min: 4, max: 30, step: 1, value: s.spriteTaille ?? 12, style: 'width:150px' });
  const tfn = el('span', { className: 'muted' }, (s.spriteTaille ?? 12) + '% de la salle (avec sprite)');
  tfs.oninput = () => { s.spriteTaille = +tfs.value; tfn.textContent = tfs.value + '% de la salle (avec sprite)'; persist(); vz.refresh(); };
  tfRow.append(tfs, tfn);
  vz.fs.append(tfRow);
  ed.append(fs1, vz.fs);

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

  if (isDeco(s)) {
    ed.append(el('div', { className: 'muted' }, 'Apparition : tirée au hasard (déterministe) par SceneRenderer dans ~1 salle sur 3 de La Gorge. Teste-la via « ajouter » dans le Simulateur.'));
  } else {
    const usesKind = (slot) => slot.kind === kind || (slot.choix ?? []).some((c) => c.kind === kind);
    const uses = DATA.rooms.filter((r) => (r.structures ?? []).some(usesKind));
    ed.append(el('h3', {}, 'Salles qui l\'utilisent'),
      el('div', { className: 'muted' }, uses.length ? uses.map((r) => esc(r.id)).join(', ') : 'aucune'));
  }
}

$('#struct-search').oninput = renderStructList;
$('#struct-new').onclick = () => {
  const kind = prompt('id de la structure (ex: fontaine)'); if (!kind || DATA.structures[kind]) return;
  DATA.structures[kind] = { label: kind, floor: false, panel: 'altar', son: { label: kind, intensite: 0.3 },
    spriteTaille: 12,
    sprite: { calques: [{ x: 50, y: 62, l: 70, h: 70, forme: '46% 54% 50% 50% / 56% 46% 54% 44%',
      degrade: { cx: 40, cy: 25, stops: [{ c: '#3a2f22' }, { c: '#14100a' }] }, ombre: true }] } };
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
  const groups = [{ id: null, name: 'Tous les biomes' }, ...DATA.biomes.map((b) => ({ id: b.id, name: b.name }))];
  for (const g of groups) {
    const members = DATA.rooms.filter((r) => (r.biomeOnly ?? null) === g.id && (!q || r.id.includes(q)));
    if (!members.length) continue;
    box.append(el('div', { className: 'grp' }, esc(g.name)));
    for (const r of members) {
      const it = el('div', { className: 'item' + (r.id === roomSel ? ' sel' : '') });
      it.append(el('span', { className: 'nm' }, esc(r.id)));
      it.append(el('span', { className: 'id' }, esc(r.ui ?? '')));
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

  fs.append(hint('Taux de spawn : onglet Biomes → Peuplement (le poids appartient au biome, plus à la salle).'));

  const mobrow = el('div', { className: 'frow' }); mobrow.append(el('label', {}, 'monstres'));
  const mn = el('input', { type: 'number', value: r.spawns?.minMobs ?? 0, style: 'width:55px' });
  const mx2 = el('input', { type: 'number', value: r.spawns?.maxMobs ?? 0, style: 'width:55px' });
  mn.oninput = () => { r.spawns = { ...(r.spawns ?? {}), minMobs: +mn.value }; persist(); };
  mx2.oninput = () => { r.spawns = { ...(r.spawns ?? {}), maxMobs: +mx2.value }; persist(); };
  mobrow.append(mn, el('span', { className: 'muted' }, 'à'), mx2);
  fs.append(mobrow);
  fs.append(hint('Nombre de monstres générés en entrant (MobGen, thèmes du biome). 0 à 0 = salle sûre, sans combat — c\'est CE champ qui décide de l\'hostilité de la salle.'));

  // une salle = UN biome (le fond/DA change par biome) — changer de biome déplace
  // aussi son poids de peuplement dans la table du nouveau biome
  const brow = el('div', { className: 'frow' }); brow.append(el('label', {}, 'biome'));
  const bsel = el('select');
  for (const b of DATA.biomes) bsel.append(el('option', { value: b.id, selected: r.biomeOnly === b.id }, b.name));
  bsel.onchange = () => {
    const avant = r.biomeOnly;
    r.biomeOnly = bsel.value;
    const bAv = DATA.biomes.find((x) => x.id === avant);
    const bAp = DATA.biomes.find((x) => x.id === bsel.value);
    const w = bAv?.salles?.poids?.[r.id];
    if (w != null) {
      delete bAv.salles.poids[r.id];
      ((bAp.salles = bAp.salles ?? { poids: {}, regles: [] }).poids = bAp.salles.poids ?? {})[r.id] = w;
    }
    persist(); renderRoomList();
  };
  fs.append(brow); brow.append(bsel);

  // Scène de décor (scenes.json) : EXPLICITE sur chaque salle (plus de défaut de biome)
  const scrow = el('div', { className: 'frow' }); scrow.append(el('label', {}, 'scène'));
  const scsel = el('select');
  for (const [sid, sdef] of Object.entries(scenesJson).filter(([k]) => k !== '_doc'))
    scsel.append(el('option', { value: sid, selected: r.scene === sid }, sdef.label ?? sid));
  scsel.onchange = () => { r.scene = scsel.value; persist(); };
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
    for (const [kind] of structOnly()) ks.append(el('option', { value: kind, selected: cur === kind }, DATA.structures[kind]?.label ?? kind));
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
        addC.onclick = () => { slot.choix.push({ kind: structOnly()[0]?.[0] ?? 'altar', chance: 0.2 }); persist(); renderStructRows(); };
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
    add1.onclick = () => { (r.structures = r.structures ?? []).push({ kind: structOnly()[0]?.[0] ?? 'altar', chance: 1 }); persist(); renderStructRows(); };
    const add2 = el('button', { className: 'tiny', style: 'margin-left:6px', disabled: nSlots >= 3 }, '+ groupe exclusif');
    add2.onclick = () => { (r.structures = r.structures ?? []).push({ choix: [{ kind: structOnly()[0]?.[0] ?? 'altar', chance: 0.5 }] }); persist(); renderStructRows(); };
    sBox.append(add1, add2);
    // 3 emplacements (gauche/centre/droite) = 3 structures max par salle
    sBox.append(el('span', { className: 'muted', style: 'margin-left:8px' + (nSlots >= 3 ? ';color:var(--warn)' : '') },
      `${nSlots}/3 emplacements${nSlots >= 3 ? ' — plein' : ''}`));
  };
  renderStructRows();
  fsS.append(sBox);
  ed.append(fsS);

  // ── décor : quelle déco peut apparaître dans cette salle, PAR BIOME ──
  // (une seule déco par salle ; règles évaluées dans l'ordre, tirage déterministe)
  const fsD = el('fieldset'); fsD.append(el('legend', {}, 'Décor (une déco max par salle)'));
  const dBox = el('div');
  const decoKinds = () => structEntries().filter(([, s2]) => s2.categorie === 'decoration');
  const renderDecoRows = () => {
    dBox.innerHTML = '';
    for (const [bid, list] of Object.entries(r.decos ?? {})) {
      (list ?? []).forEach((c, j) => {
        const row = el('div', { className: 'frow' });
        const bs = el('select', { title: 'biome où cette règle s\'applique (les salles multi-biomes peuvent varier leur décor)' });
        bs.append(el('option', { value: '*', selected: bid === '*' }, 'tous les biomes'));
        for (const b of DATA.biomes) bs.append(el('option', { value: b.id, selected: bid === b.id }, b.name));
        bs.onchange = () => {
          list.splice(j, 1); if (!list.length) delete r.decos[bid];
          ((r.decos = r.decos ?? {})[bs.value] = r.decos[bs.value] ?? []).push(c);
          persist(); renderDecoRows();
        };
        const ds = el('select');
        for (const [kind, s2] of decoKinds()) ds.append(el('option', { value: kind, selected: c.kind === kind }, s2.label ?? kind));
        ds.onchange = () => { c.kind = ds.value; persist(); };
        const ch = el('input', { type: 'number', value: c.chance ?? 1, min: 0, max: 1, step: 0.05, style: 'width:64px', title: 'probabilité (0-1) — déterministe par salle' });
        ch.oninput = () => { c.chance = +ch.value; persist(); };
        const del = el('button', { className: 'tiny danger' }, '✕');
        del.onclick = () => {
          list.splice(j, 1); if (!list.length) delete r.decos[bid];
          if (r.decos && !Object.keys(r.decos).length) delete r.decos;
          persist(); renderDecoRows();
        };
        row.append(bs, ds, ch, el('span', { className: 'muted' }, 'chance'), del);
        dBox.append(row);
      });
    }
    const add = el('button', { className: 'tiny' }, '+ règle de décor');
    add.disabled = !decoKinds().length;
    add.onclick = () => {
      const bid = r.biomeOnly ?? '*';
      ((r.decos = r.decos ?? {})[bid] = r.decos[bid] ?? []).push({ kind: decoKinds()[0][0], chance: 0.5 });
      persist(); renderDecoRows();
    };
    dBox.append(add);
    dBox.append(el('div', { className: 'muted' }, 'Évaluées dans l\'ordre — la première qui réussit gagne (tirage déterministe par salle). Aucune règle pour un biome = aucun décor dans ce biome.'));
  };
  renderDecoRows();
  fsD.append(dBox);
  ed.append(fsD);
}


$('#room-search').oninput = renderRoomList;
$('#room-new').onclick = () => {
  const bid = DATA.biomes[0]?.id ?? 'gorge';
  const r = { id: 'room_' + Date.now() % 100000, ui: 'combat', biomeOnly: bid, spawns: { minMobs: 0, maxMobs: 0 }, description: '' };
  DATA.rooms.push(r);
  // enregistrée d'office dans le peuplement de son biome (poids 2, modifiable là-bas)
  const b = DATA.biomes.find((x) => x.id === bid);
  ((b.salles = b.salles ?? { poids: {}, regles: [] }).poids = b.salles.poids ?? {})[r.id] = 2;
  roomSel = r.id; persist(); renderRoomList(); roomEditor(r);
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
  const box = $('#sim-player-slots');
  box.innerHTML = '';
  for (const k of SLOT_KEYS) {
    const row = el('div', { className: 'slotrow' });
    row.append(el('span', { className: 'sl' }, k));
    const sel = el('select', { id: 'p-slot-' + k });
    sel.append(el('option', { value: '' }, '—'));
    const type = ORGAN_SLOTS[k].type;
    for (const o of DATA.organs.filter((x) => x.type === type)) sel.append(el('option', { value: o.id }, o.name));
    sel.onchange = () => { syncSandbox(); renderPerception(); };
    row.append(sel); box.append(row);
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
  syncSandbox();
  renderPerception();
}
$('#sim-preset-human').onclick = () => fillPreset('human');
$('#sim-preset-beast').onclick = () => fillPreset('beast');

// ── Vue jeu : sandbox iframe = VRAI rendu (ViewportDOM + SensoryFX + BodyFX + SoundBar + fx.json)
const SB = () => document.getElementById('vp-frame')?.contentWindow?.SANDBOX ?? null;

function syncSandbox() {
  const sb = SB(); if (!sb) return;
  sb.applyDrafts?.({ organs: DATA.organs, sets: DATA.sets, rooms: DATA.rooms, relics: DATA.relics, structures: DATA.structures, tags: DATA.tags, biomes: DATA.biomes, balance: DATA.balance, resources: DATA.resources });
  // en combat, NE PAS re-pousser le corps des selects : ça ressusciterait les
  // organes perdus (les dégâts vivent dans le WS du sandbox, pas dans les selects)
  if (!sb.TurnCombat?.isActive?.()) sb.setBody(bodyFromSelects('p'));
  sb.setLight($('#vp-torch')?.checked ? 1 : 0);
  // le select "ajouter" propose mob + structures (brouillons inclus) + décors
  const ts = $('#vp-spawn-type');
  if (ts) {
    const cur = ts.value;
    ts.innerHTML = '';
    ts.append(el('option', { value: 'mob' }, '👹 monstre aléatoire (test)'));
    ts.append(el('option', { value: 'roommobs' }, '🎲 spawn naturel de la salle (MobGen)'));
    const og1 = el('optgroup', { label: 'Structures' });
    for (const [kind, s] of structOnly()) og1.append(el('option', { value: 'struct:' + kind }, s.label ?? kind));
    ts.append(og1);
    // décors = entrées "decoration" des brouillons (créables dans l'onglet Structures)
    const og2 = el('optgroup', { label: 'Décor' });
    for (const [kind, s] of structEntries()) if (isDeco(s)) og2.append(el('option', { value: 'prop:' + kind }, s.label ?? kind));
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
setInterval(() => { renderSpawnList(); renderPerception(); }, 1200);   // suit aussi le combat en live

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
  sb.applyDrafts?.({ organs: DATA.organs, sets: DATA.sets, rooms: DATA.rooms, relics: DATA.relics, structures: DATA.structures, tags: DATA.tags, biomes: DATA.biomes, resources: DATA.resources })
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
  const list = def?.biomeOnly ? DATA.biomes.filter((b) => b.id === def.biomeOnly) : DATA.biomes;
  for (const b of list) bs.append(el('option', { value: b.id, selected: b.id === cur }, b.name));
}
// perception via le VRAI Faculties — branchée sur l'ÉTAT VIVANT du sandbox quand
// il tourne (organes perdus en combat inclus), sinon sur les selects locaux.
let _lastPerception = '';
function renderPerception() {
  const sb = SB();
  const live = !!sb?.WS?.player?.body;
  const body = live ? sb.WS.player.body : bodyFromSelects('p');
  const FA = live ? sb.Faculties : FAC;
  if (!live) { WS.player = WS.player ?? {}; WS.player.body = body; }
  const P = $('#sim-perception');
  const yes = (v) => v ? '<span style="color:var(--ok)">oui</span>' : '<span style="color:var(--bad)">non</span>';
  let h = live ? '<div class="muted" style="margin-bottom:3px">● état LIVE du sandbox</div>' : '';
  h += '<table style="font-size:11px;border-spacing:0 1px">';
  for (const side of ['gauche', 'droite']) {
    h += `<tr><td colspan=2 style="color:var(--accent)">— ${side} —</td></tr>`;
    h += `<tr><td>voit</td><td>${yes(FA.seesOn(side))}</td></tr>`;
    for (const t of ['vue-couleur', 'vue-nocturne', 'vue-invisible', 'vue-rayons-x', 'vue-arcane', 'vue-thermique'])
      if (FA.grants(t, side)) h += `<tr><td colspan=2 class="muted">+ ${t}</td></tr>`;
    h += `<tr><td>entend</td><td>${yes(FA.hears(side))}</td></tr>`;
    const e = FA.tierMax('echolocation', side), i = FA.tierMax('ouie-identification', side);
    if (e) h += `<tr><td>écholocation</td><td>${e}</td></tr>`;
    if (i) h += `<tr><td>identification</td><td>${i}</td></tr>`;
  }
  h += `<tr><td colspan=2 style="color:var(--accent)">— global —</td></tr>`;
  h += `<tr><td>plan actif</td><td>${yes(FA.planActive())}</td></tr>`;
  h += `<tr><td>map</td><td>${FA.mapLevel()}${FA.remembers() ? ' +mém' : ''}</td></tr>`;
  h += `<tr><td>détection</td><td>${FA.detectionLevel()}</td></tr>`;
  h += `<tr><td>digestion</td><td>${FA.count('digestion')}</td></tr>`;
  h += `<tr><td>sang/tour</td><td><b>${CR.bloodPool(body, resolver)}</b></td></tr>`;
  h += `<tr><td>sonorité</td><td>${FA.sonorityOf(body).toFixed(2)}</td></tr>`;
  h += `<tr><td>lumière nette</td><td>${FA.lightNet()}</td></tr>`;
  h += '</table>';
  if (h !== _lastPerception) { P.innerHTML = h; _lastPerception = h; }
}

// ── combat : le VRAI flux du jeu, joué dans le sandbox ──
// TurnCombat + CombatHand + CombatFX (via CombatOrchestrator, module partagé avec
// main.js) contre les mobs ACTIFS de la salle affichée. Cartes, visée de tes
// propres organes (panneau « Ton corps »), afflictions, ressources, défausse :
// tout se joue DANS la vue, à l'identique du jeu.
function log(msg) { const box = $('#simlog'); box.textContent = msg + '\n' + box.textContent.slice(0, 8000); }
window.CHAIR_TOOL_LOG = (msg) => log(msg);   // le sandbox remonte son journal de combat ici

$('#sim-start').onclick = () => {
  const sb = SB();
  if (!sb) { setStatus('sandbox pas prêt — réessaie dans 2s', 'bad'); return; }
  if (!CR.livingSlots(bodyFromSelects('p')).length) { setStatus('corps joueur vide — choisis des organes', 'bad'); return; }
  syncSandbox();                               // corps + brouillons à jour
  const msg = sb.startCombat?.() ?? '✕ API combat absente (recharge la page)';
  log(msg);
  setStatus(msg, msg.startsWith('✕') ? 'bad' : 'ok');
};
$('#sim-stop').onclick = () => {
  const msg = SB()?.stopCombat?.() ?? '✕ sandbox pas prêt';
  log(msg);
  setStatus(msg, 'warn');
};

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

// ── batch : IA gloutonne du test headless ──
// UN combat à l'IA gloutonne (celle du test headless) — partagé entre le batch
// du Simulateur et la courbe de difficulté mesurée de l'onglet Équilibrage.
function combatIA(player0, mob, rng) {
  const player = deep(player0);
  const pstate = mkPstate(player);
  let plan = CR.chooseMobPlan(mob, player, resolver, rng), turns = 0, win = false;
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
  const liv = CR.livingSlots(player);
  const hpRatio = win && liv.length
    ? liv.reduce((s, k) => s + player.slots[k].hp, 0) / liv.reduce((s, k) => s + (resolver(player.slots[k].organId)?.maxHp || 1), 0)
    : 0;
  return { win, turns, timeout: turns >= 40 && !win, hpRatio };
}

$('#sim-batch-run').onclick = () => {
  const N = Math.min(5000, +$('#sim-batch-n').value || 500);
  const player0 = bodyFromSelects('p');
  if (!CR.livingSlots(player0).length) { setStatus('corps joueur vide', 'bad'); return; }
  const setF = $('#sim-mobset').value || null, nOrg = +$('#sim-mobn').value || 3;
  let wins = 0, turnsSum = 0, hpSum = 0, timeouts = 0;
  const t0 = performance.now();
  for (let i = 0; i < N; i++) {
    const rng = mulberry(i + 1);
    const r = combatIA(player0, genMob(rng, setF, nOrg), rng);
    if (r.win) { wins++; hpSum += r.hpRatio; }
    if (r.timeout) timeouts++;
    turnsSum += r.turns;
  }
  const ms = Math.round(performance.now() - t0);
  $('#sim-batch-out').innerHTML =
    `<b style="color:var(--accent)">${(100 * wins / N).toFixed(1)}%</b> winrate<br>` +
    `${(turnsSum / N).toFixed(1)} tours moyens<br>` +
    `${(100 * hpSum / Math.max(1, wins)).toFixed(0)}% PV restants (victoires)<br>` +
    `${timeouts} timeouts · ${ms}ms`;
};

// ═══════════════════════════════ ONGLET RESSOURCES ═══════════════════════════════
// content/resources.json : sang, protection, bile… et toutes celles que tu crées.
// TOUT le comportement est sur la fiche (le moteur — Resources.js + combatRules —
// ne connaît aucune ressource en dur) : porteur, polarité, expiration, plafond,
// paiement, décroissance, et des BLOCS DE RÈGLES activables (tick, absorption,
// modificateurs de dégâts/soins/gains, blocages, production). L'icône est un
// sprite du même éditeur que les organes, rendue par la vraie puce de combat.
let resSel = null;
const RES_QUAND = [['finDeTour', 'fin de ton tour'], ['debutDeTour', 'début de ton tour'], ['attaque', 'quand le porteur attaque']];

function renderResList() {
  const box = $('#res-list'); if (!box) return;
  const q = ($('#res-search')?.value || '').toLowerCase();
  box.innerHTML = '';
  for (const grp of ['entite', 'organe']) {
    const dedans = DATA.resources.filter((r) => (r.porteur ?? 'entite') === grp && (!q || r.name?.toLowerCase().includes(q) || r.id.includes(q)));
    if (!dedans.length) continue;
    box.append(el('div', { className: 'grp' }, grp === 'entite' ? 'Portées par l\'entité' : 'Portées par un organe'));
    for (const r of dedans) {
      const it = el('div', { className: 'item' + (r.id === resSel ? ' sel' : '') });
      it.append(el('span', { className: 'nm' },
        `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${r.couleur ?? '#666'};margin-right:5px"></span>`
        + `${esc(r.name ?? r.id)} <span style="color:${r.polarite === 'negatif' ? 'var(--bad)' : 'var(--ok)'};font-size:9px">${r.polarite === 'negatif' ? '−' : '+'}</span>`));
      it.append(el('span', { className: 'id' }, r.id));
      it.onclick = () => { resSel = r.id; renderResList(); resEditor(r); };
      box.append(it);
    }
  }
}

function resValidate(r) {
  const out = [];
  if (DATA.resources.filter((x) => x.id === r.id).length > 1) out.push(['bad', `id "${r.id}" dupliqué`]);
  if (!/^[a-z0-9_]+$/.test(r.id ?? '')) out.push(['bad', 'id : minuscules/chiffres/underscore']);
  if (r.porteur === 'organe' && r.absorbe) out.push(['warn', '« absorbe » ne joue que sur une ressource d\'ENTITÉ (le Bloc) — ignoré ici']);
  if (r.porteur === 'organe' && r.production?.parOrganes) out.push(['warn', '« production par organes » ne joue que sur une ressource d\'entité — ignoré ici']);
  if (r.porteur === 'entite' && r.auGain?.hp) out.push(['warn', '« au gain : PV » joue sur l\'organe porteur — ignoré pour une ressource d\'entité']);
  if (r.porteur === 'entite' && r.tick?.propageALaMort) out.push(['warn', 'la propagation à la mort ne concerne qu\'une ressource d\'organe']);
  for (const c of r.gains?.bloque ?? []) {
    if (!['tous', 'positif', 'negatif'].includes(c) && !DATA.resources.some((x) => x.id === c)) out.push(['bad', `blocage : ressource "${c}" inconnue`]);
  }
  for (const m of r.gains?.modifie ?? []) {
    const c = m.cible ?? 'tous';
    if (!['tous', 'positif', 'negatif'].includes(c) && !DATA.resources.some((x) => x.id === c)) out.push(['bad', `modificateur de gain : cible "${c}" inconnue`]);
  }
  if (r.stockage) out.push(['ok', `stockage historique : ${r.stockage} (champ moteur — ne pas toucher)`]);
  const usages = DATA.organs.filter((o) => (o.skills ?? []).some((sk) =>
    (sk.couts ?? {})[r.id] || (sk.effects ?? (sk.effect ? [sk.effect] : [])).some((e) => e.res === r.id))).length;
  out.push(['ok', `${usages} organe(s) consomment/donnent cette ressource via leurs skills`]);
  return out;
}

function resEditor(r) {
  const ed = $('#res-editor'); if (!ed) return;
  if (!r) { ed.innerHTML = '<p class="muted">Sélectionne une ressource à gauche.</p>'; return; }
  ed.innerHTML = '';
  const warns = el('div', { className: 'warns' });
  const showWarns = () => {
    warns.innerHTML = '';
    for (const [cls, msg] of resValidate(r)) warns.append(el('div', { className: 'w ' + cls }, (cls === 'bad' ? '✕ ' : cls === 'warn' ? '⚠ ' : '✓ ') + esc(msg)));
  };
  const touch = () => { persist(); renderResList(); showWarns(); };

  // petits widgets partagés
  const num = (host, lbl, obj, key, { step = 1, w = 64, title = '', vide = null } = {}) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', { title }, lbl));
    const n = el('input', { type: 'number', value: obj[key] ?? '', step, style: `width:${w}px`, placeholder: vide ?? '' });
    n.oninput = () => { if (n.value === '') { if (vide != null) delete obj[key]; else obj[key] = 0; } else obj[key] = +n.value; touch(); };
    row.append(n);
    if (vide != null) row.append(el('span', { className: 'muted' }, `vide = ${vide}`));
    host.append(row);
    return row;
  };
  const sel = (host, lbl, obj, key, options, { title = '', onChange = null } = {}) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', { title }, lbl));
    const s = el('select');
    for (const [v, l] of options) s.append(el('option', { value: v, selected: (obj[key] ?? options[0][0]) === v }, l));
    s.onchange = () => { obj[key] = s.value; touch(); onChange?.(); };
    row.append(s); host.append(row);
    return row;
  };
  const cbx = (host, lbl, obj, key, { title = '' } = {}) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', { title }, lbl));
    const c = el('input', { type: 'checkbox', checked: !!obj[key] });
    c.onchange = () => { if (c.checked) obj[key] = true; else delete obj[key]; touch(); };
    row.append(c); host.append(row);
  };
  const parStackSel = (host, obj) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', { title: '5 stacks font-ils 5× l\'effet, ou l\'effet est-il actif tel quel dès 1 stack ?' }, 'application'));
    const s = el('select');
    s.append(el('option', { value: '1', selected: (obj.parStack ?? true) }, '× stacks (chaque stack compte)'));
    s.append(el('option', { value: '', selected: !(obj.parStack ?? true) }, 'forfaitaire (dès 1 stack)'));
    s.onchange = () => { obj.parStack = !!s.value; touch(); };
    row.append(s); host.append(row);
  };

  // ── identité ──
  const fs1 = el('fieldset'); fs1.append(el('legend', {}, 'Identité'));
  const F = (label, key, ph = '') => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', {}, label));
    const inp = el('input', { className: key === 'description' ? 'wide' : '', value: r[key] ?? '', placeholder: ph });
    inp.oninput = () => { r[key] = inp.value; touch(); };
    row.append(inp); return row;
  };
  fs1.append(F('id', 'id'), F('nom', 'name'));
  const dRow = el('div', { className: 'frow' }); dRow.append(el('label', {}, 'description'));
  const dTa = el('textarea', { value: r.description ?? '', style: 'width:420px;height:52px' });
  dTa.oninput = () => { r.description = dTa.value; touch(); };
  dRow.append(dTa); fs1.append(dRow);
  const cRow = el('div', { className: 'frow' }); cRow.append(el('label', { title: 'couleur des pastilles de coût et des listes (l\'icône elle-même est le sprite)' }, 'couleur'));
  const cIn = el('input', { type: 'color', value: /^#[0-9a-fA-F]{6}$/.test(r.couleur ?? '') ? r.couleur : '#888888' });
  cIn.oninput = () => { r.couleur = cIn.value; touch(); };
  cRow.append(cIn); fs1.append(cRow);
  sel(fs1, 'polarité', r, 'polarite', [['positif', 'positive (bénéfique au porteur)'], ['negatif', 'négative (affliction)']],
    { title: 'du point de vue du PORTEUR — sert aux blocages ciblés par type et à l\'UI' });
  sel(fs1, 'porteur', r, 'porteur', [['entite', 'entité (portefeuille du combattant)'], ['organe', 'organe (stacks posés sur un organe)']],
    { onChange: () => resEditor(r) });
  ed.append(fs1);

  // ── règles générales ──
  const fs2 = el('fieldset'); fs2.append(el('legend', {}, 'Règles générales'));
  num(fs2, 'plafond de stacks', r, 'max', { vide: 'illimité', title: 'un gain ne dépasse jamais ce total' });
  sel(fs2, 'expire', r, 'expire', [['jamais', 'jamais'], ['finDeTour', 'à la fin de ton tour'], ['finDuCombat', 'à la fin du combat']]);
  if (r.porteur === 'organe') {
    sel(fs2, 'qui paie un coût', r, 'paiement', [['organe', 'l\'organe qui joue le skill'], ['partout', 'n\'importe quel organe du corps']],
      { title: 'quand un skill coûte cette ressource : où est-elle prélevée ?' });
  }
  {
    const dec = el('fieldset'); dec.append(el('legend', {}, 'Décroissance naturelle'));
    const on = el('input', { type: 'checkbox', checked: !!r.decroissance });
    on.onchange = () => { if (on.checked) r.decroissance = { quand: 'finDeTour', valeur: 1 }; else delete r.decroissance; touch(); resEditor(r); };
    const lb = el('label', { style: 'width:auto;font-size:11px' }); lb.append(on, document.createTextNode(' active'));
    dec.append(lb);
    if (r.decroissance) {
      sel(dec, 'quand', r.decroissance, 'quand', RES_QUAND);
      num(dec, 'stacks perdus', r.decroissance, 'valeur');
    }
    fs2.append(dec);
  }
  ed.append(fs2);

  // ── blocs de règles activables ──
  const bloc = (key, titre, desc, defauts, build) => {
    const fs = el('fieldset');
    const lg = el('legend');
    const on = el('input', { type: 'checkbox', checked: !!r[key] });
    on.onchange = () => { if (on.checked) r[key] = deep(defauts); else delete r[key]; touch(); resEditor(r); };
    lg.append(on, document.createTextNode(' ' + titre));
    fs.append(lg, el('div', { className: 'muted', style: 'margin-bottom:5px;max-width:520px;line-height:1.4' }, desc));
    if (r[key]) build(fs, r[key]);
    ed.append(fs);
  };

  bloc('tick', 'Tick — agit à chaque tour', 'Dégâts et/ou soins périodiques sur le porteur (Bile, Saignement, Régénération…), puis consommation de stacks. Une ressource d\'organe frappe SON organe ; une ressource d\'entité soigne le pire organe ou frappe le pire organe.',
    { quand: 'finDeTour', degats: { valeur: 1, parStack: true }, consomme: 1 },
    (fs, t) => {
      sel(fs, 'quand', t, 'quand', RES_QUAND);
      {
        const dOn = el('input', { type: 'checkbox', checked: !!t.degats });
        const row = el('div', { className: 'frow' }); row.append(el('label', {}, 'dégâts'));
        dOn.onchange = () => { if (dOn.checked) t.degats = { valeur: 1, parStack: true }; else delete t.degats; touch(); resEditor(r); };
        row.append(dOn); fs.append(row);
        if (t.degats) { num(fs, '… valeur', t.degats, 'valeur'); parStackSel(fs, t.degats); }
      }
      {
        const sOn = el('input', { type: 'checkbox', checked: !!t.soigne });
        const row = el('div', { className: 'frow' }); row.append(el('label', {}, 'soigne'));
        sOn.onchange = () => { if (sOn.checked) t.soigne = { valeur: 1, parStack: true, cible: 'pireOrgane' }; else delete t.soigne; touch(); resEditor(r); };
        row.append(sOn); fs.append(row);
        if (t.soigne) { num(fs, '… valeur', t.soigne, 'valeur'); parStackSel(fs, t.soigne); }
      }
      num(fs, 'stacks consommés après', t, 'consomme');
      if (r.porteur === 'organe') cbx(fs, 'propage à la mort de l\'organe', t, 'propageALaMort',
        { title: 'à la mort de l\'organe porteur, les stacks restants se répartissent sur 1–3 autres organes (comme la Bile)' });
    });

  if (r.porteur === 'organe') {
    bloc('auGain', 'Au gain — altère les PV de l\'organe', 'Au moment où l\'organe reçoit la ressource, ses PV changent : augmenter, diminuer, multiplier ou diviser (une fois par stack gagné).',
      { hp: { op: 'plus', valeur: 1 } },
      (fs, g) => {
        g.hp = g.hp ?? { op: 'plus', valeur: 1 };
        sel(fs, 'opération', g.hp, 'op', [['plus', 'augmenter (+)'], ['moins', 'diminuer (−)'], ['fois', 'multiplier (×)'], ['divise', 'diviser (÷)']]);
        num(fs, 'valeur', g.hp, 'valeur', { step: 0.1 });
      });
  }

  if (r.porteur === 'entite') {
    bloc('absorbe', 'Absorption — se consomme à la place des PV', 'Chaque stack bloque « ratio » dégâts entrants et disparaît (la Protection). Appliquée après l\'armure et les plafonds.',
      { ratio: 1 },
      (fs, a) => num(fs, 'dégâts bloqués par stack', a, 'ratio'));
  }

  bloc('degatsSubis', 'Dégâts subis — le porteur encaisse autrement', '« plus » : le porteur subit +N par coup (Vulnérabilité). « plafond » : les dégâts reçus ne dépassent JAMAIS cette valeur tant qu\'il reste 1 stack.',
    { op: 'plus', valeur: 1, parStack: true },
    (fs, m) => {
      sel(fs, 'opération', m, 'op', [['plus', '+ dégâts subis'], ['plafond', 'plafonne les dégâts subis']]);
      num(fs, 'valeur', m, 'valeur');
      if (m.op !== 'plafond') parStackSel(fs, m);
    });

  bloc('degatsInfliges', 'Dégâts infligés — les attaques du porteur changent', '« plus » : +N dégâts sur chaque attaque (Frénésie). « fois » : multiplie les dégâts.',
    { op: 'plus', valeur: 1, parStack: true },
    (fs, m) => {
      sel(fs, 'opération', m, 'op', [['plus', '+ dégâts'], ['fois', '× dégâts']]);
      num(fs, 'valeur', m, 'valeur', { step: 0.1 });
      parStackSel(fs, m);
    });

  bloc('soins', 'Soins — les soins du porteur changent', 'Modifie les soins que le porteur prodigue : « plus » les augmente d\'autant, « fois » les multiplie.',
    { op: 'plus', valeur: 1, parStack: true },
    (fs, m) => {
      sel(fs, 'opération', m, 'op', [['plus', '+ soin'], ['fois', '× soin']]);
      num(fs, 'valeur', m, 'valeur', { step: 0.1 });
      parStackSel(fs, m);
    });

  bloc('gains', 'Gains de ressources — bloque ou modifie ce que le porteur reçoit', 'Tant que le porteur détient cette ressource : bloque les gains ciblés (par ressource ou par polarité), et/ou modifie les quantités produites par les skills. Un gain bloqué fait échouer l\'effet (le coût n\'est payé que si un effet passe).',
    { bloque: [], modifie: [] },
    (fs, g) => {
      g.bloque = g.bloque ?? []; g.modifie = g.modifie ?? [];
      const cibles = [['tous', 'toutes les ressources'], ['positif', 'les positives'], ['negatif', 'les négatives'],
        ...DATA.resources.filter((x) => x.id !== r.id).map((x) => [x.id, x.name ?? x.id])];
      const bRow = el('div', { className: 'frow', style: 'flex-wrap:wrap' });
      bRow.append(el('label', {}, 'bloque'));
      for (const [i, c] of g.bloque.entries()) {
        const chip = el('span', { style: 'display:inline-flex;gap:4px;border:1px solid var(--line);border-radius:3px;padding:1px 5px;font-size:10px' },
          esc(cibles.find(([v]) => v === c)?.[1] ?? c));
        const x = el('span', { style: 'cursor:pointer;color:#c05a4a' }, '✕');
        x.onclick = () => { g.bloque.splice(i, 1); touch(); resEditor(r); };
        chip.append(x); bRow.append(chip);
      }
      const bAdd = el('select');
      bAdd.append(el('option', { value: '' }, '+ bloquer…'));
      for (const [v, l] of cibles) if (!g.bloque.includes(v)) bAdd.append(el('option', { value: v }, l));
      bAdd.onchange = () => { if (bAdd.value) { g.bloque.push(bAdd.value); touch(); resEditor(r); } };
      bRow.append(bAdd); fs.append(bRow);
      g.modifie.forEach((m, i) => {
        const row = el('div', { className: 'frow' });
        row.append(el('label', {}, i === 0 ? 'modifie' : ''));
        const cs = el('select');
        for (const [v, l] of cibles) cs.append(el('option', { value: v, selected: (m.cible ?? 'tous') === v }, l));
        cs.onchange = () => { m.cible = cs.value; touch(); };
        const os = el('select');
        for (const [v, l] of [['plus', '+'], ['fois', '×']]) os.append(el('option', { value: v, selected: (m.op ?? 'plus') === v }, l));
        os.onchange = () => { m.op = os.value; touch(); };
        const nv = el('input', { type: 'number', value: m.valeur ?? 1, step: 0.1, style: 'width:56px' });
        nv.oninput = () => { m.valeur = +nv.value; touch(); };
        const del = el('button', { className: 'tiny danger' }, '✕');
        del.onclick = () => { g.modifie.splice(i, 1); touch(); resEditor(r); };
        row.append(cs, os, nv, del);
        fs.append(row);
      });
      const mAdd = el('button', { className: 'tiny' }, '+ modificateur');
      mAdd.onclick = () => { g.modifie.push({ cible: 'tous', op: 'plus', valeur: 1, parStack: true }); touch(); resEditor(r); };
      fs.append(mAdd);
    });

  if (r.porteur === 'entite') {
    bloc('production', 'Production — au début de chaque tour', 'Produit par les organes qui déclarent `produces: [{resource, amount, carryover}]` (le report d\'un tour à l\'autre vient de leur carryover). Le Sang garde sa production moteur : le pool du cœur.',
      { parOrganes: true },
      (fs, p) => cbx(fs, 'produit par les organes', p, 'parOrganes'));
  }

  // ── visuel : la VRAIE puce de combat (resChipHTML + hud.css), sprite éditable ──
  const fsV = el('fieldset'); fsV.append(el('legend', {}, 'Visuel — la puce de combat (rendu réel)'));
  const host = el('div');
  const sh = host.attachShadow({ mode: 'open' });
  const vStyle = document.createElement('style');
  vStyle.textContent = tokensCss.replaceAll(':root', ':host') + hudCss;
  const vWrap = document.createElement('div');
  vWrap.style.cssText = 'display:flex;gap:14px;align-items:center;padding:6px 2px;';
  sh.append(vStyle, vWrap);
  const refreshChip = () => {
    vWrap.innerHTML = [1, 3, 12].map((v) => resChipHTML(r, v)).join('')
      + `<span style="font:9px monospace;color:#9a8a70">la valeur s'affiche dans l'icône, comme en combat</span>`;
  };
  refreshChip();
  fsV.append(host);
  fsV.append(spriteEditor(r, refreshChip));
  ed.append(fsV);

  // ── test dans le Simulateur ──
  const fsT = el('fieldset'); fsT.append(el('legend', {}, 'Essai en combat'));
  const tRow = el('div', { className: 'frow' });
  const tN = el('input', { type: 'number', value: 3, min: 1, style: 'width:56px' });
  const tBtn = el('button', { className: 'tiny primary' }, '◈ donner au Simulateur');
  const tOut = el('span', { className: 'muted' });
  tBtn.onclick = () => {
    const sb = SB();
    tOut.textContent = sb?.giveResource ? sb.giveResource(r.id, +tN.value || 1, 'skin') : '✕ sandbox pas prêt';
  };
  tRow.append(tN, tBtn, tOut);
  fsT.append(tRow, el('div', { className: 'muted' }, 'Lance d\'abord un combat dans le Simulateur — la ressource apparaît en puce (entité) ou sur ta peau (organe), et ses règles jouent pour de vrai.'));
  ed.append(fsT);

  ed.append(warns);
  showWarns();
}

// boutons de l'onglet
$('#res-search')?.addEventListener('input', renderResList);
$('#res-new')?.addEventListener('click', () => {
  const r = { id: 'res_' + (Date.now() % 100000), name: 'Nouvelle ressource', description: '', polarite: 'positif', porteur: 'entite', max: null, expire: 'jamais', couleur: '#8a8172' };
  DATA.resources.push(r); resSel = r.id;
  persist(); renderResList(); resEditor(r);
});
$('#res-dup')?.addEventListener('click', () => {
  const src = DATA.resources.find((x) => x.id === resSel); if (!src) return;
  const r = deep(src); r.id = src.id + '_copie'; r.name = (src.name ?? src.id) + ' (copie)';
  delete r.stockage;   // le champ moteur historique ne se duplique pas
  DATA.resources.push(r); resSel = r.id;
  persist(); renderResList(); resEditor(r);
});
$('#res-del')?.addEventListener('click', () => {
  const i = DATA.resources.findIndex((x) => x.id === resSel); if (i < 0) return;
  if (DATA.resources[i].stockage && !confirm('Ressource CÂBLÉE au moteur (stockage historique) — la supprimer cassera les skills qui l\'utilisent. Continuer ?')) return;
  DATA.resources.splice(i, 1); resSel = null;
  persist(); renderResList(); resEditor(null);
});

// ═══════════════════════════════ ONGLET ÉQUILIBRAGE ═══════════════════════════════
// Tout se règle PAR BIOME (biomes.json mobs) : budget [entrée → sortie du
// biome, interpolé], taux des tiers (poids normalisés), pool par sets ±
// exceptions, intrusion. Le bandeau « parcours » montre les étages de chaque
// biome, sert de sélecteur et trace la puissance résultante. Restent globaux
// (balance.json, repliés) : élites/meutes/coûts des tiers + courbe mesurée.
const TIER_COULEUR = { common: '#8a8172', rare: '#5a86a8', epic: '#9a5aa8', legendary: '#c79a3a' };
const _etageMax = () => Math.max(20, ...DATA.biomes.map((b2) => b2.floorRange?.[1] ?? 0));

// interpolation d'une courbe à points [[étage, val]…] (migration d'anciens
// brouillons + tracés denses de la courbe mesurée)
function courbeVal(points, etage) {
  if (!Array.isArray(points) || !points.length) return 0;
  const pts = [...points].sort((a, b) => a[0] - b[0]);
  if (etage <= pts[0][0]) return pts[0][1];
  if (etage >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    if (etage <= pts[i][0]) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      return y0 + (y1 - y0) * ((etage - x0) / (x1 - x0 || 1));
    }
  }
  return pts[pts.length - 1][1];
}

// Les deux branches du jeu (le donjon fourche) : pour chaque strate, la Ne
// variante — biomeAt(étage, branche) sert aux bandes du graphe et à la mesure.
function biomeAt(etage, branche = 0) {
  const cands = DATA.biomes.filter((b2) => etage >= (b2.floorRange?.[0] ?? 99) && etage <= (b2.floorRange?.[1] ?? -1));
  return cands[Math.min(branche, cands.length - 1)] ?? null;
}

// Graphe SVG : lignes = [{points [[étage, val]…] OU fn(étage), color, label}]
function graphe(lignes, { h = 150, yMax = null, unite = '' } = {}) {
  const EMAX = _etageMax();
  const W = 620, H = h, PAD = 26, BANDE = 8;
  let max = yMax ?? Math.max(1, ...lignes.flatMap((l) => Array.from({ length: EMAX }, (_, i) => l.fn ? l.fn(i + 1) : courbeVal(l.points, i + 1))));
  max *= 1.1;
  const X = (e) => PAD + (e - 1) / (EMAX - 1) * (W - PAD - 6);
  const Y = (v) => 4 + (H - BANDE * 2 - 12) * (1 - v / max);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.style.cssText = 'background:#0a0705;border:1px solid var(--line);border-radius:3px';
  let inner = '';
  // bandes de biomes (2 branches) aux couleurs de leur palette + marqueurs boss
  for (const br of [0, 1]) {
    for (const b2 of DATA.biomes) {
      const [f0, f1] = b2.floorRange ?? [0, -1];
      if (f1 < f0) continue;
      if (biomeAt(f0, br)?.id !== b2.id) continue;
      const y = H - BANDE * (2 - br) - 2;
      inner += `<rect x="${X(f0) - 4}" y="${y}" width="${X(f1) - X(f0) + 8}" height="${BANDE - 1}" fill="${b2.palette?.blood ?? '#444'}" opacity=".8"><title>${esc(b2.name)} (branche ${br + 1})</title></rect>`;
      if (b2.bossId) inner += `<text x="${X(f1)}" y="${y + BANDE - 1}" font-size="8" fill="#fff" text-anchor="middle">☠</text>`;
    }
  }
  for (let e = 5; e <= EMAX; e += 5) inner += `<text x="${X(e)}" y="${H - BANDE * 2 - 3}" font-size="8" fill="#6a5d48" text-anchor="middle">${e}</text>`;
  for (const l of lignes) {
    const pts = Array.from({ length: EMAX }, (_, i) => `${X(i + 1).toFixed(1)},${Y(l.fn ? l.fn(i + 1) : courbeVal(l.points, i + 1)).toFixed(1)}`).join(' ');
    inner += `<polyline points="${pts}" fill="none" stroke="${l.color}" stroke-width="1.6"><title>${esc(l.label)}</title></polyline>`;
  }
  inner += `<text x="${PAD}" y="10" font-size="9" fill="#9a8a70">${max.toFixed(0)}${unite}</text>`;
  svg.innerHTML = inner;
  const legend = el('div', { className: 'muted', style: 'display:flex;gap:12px;margin:2px 0 8px' });
  for (const l of lignes) legend.append(el('span', {}, `<span style="display:inline-block;width:14px;height:3px;background:${l.color};vertical-align:middle;margin-right:4px"></span>${esc(l.label)}`));
  const box = el('div');
  box.append(svg, legend);
  return box;
}

// biome sélectionné dans l'onglet (via le bandeau « parcours »)
let equiBiomeSel = null;

// Carte d'un mob généré (organes + tiers + budget dépensé / budget alloué)
function mobCard(m, fi, b) {
  const bal = DATA.balance, M = bal.mob ?? {};
  const card = el('div', { className: 'orgcard', style: 'min-width:190px' + (m.isElite ? ';box-shadow:0 0 7px var(--warn)' : '') });
  card.append(el('div', { className: 'nm' }, `<b>${esc(m.name)}</b>${m.isElite ? ' <span style="color:var(--warn)">★ élite</span>' : ''}`));
  card.append(el('div', { className: 'muted' }, `${esc(m.theme)} · ${esc(m.behavior)}${m.tags?.length ? ' · ' + [...new Set(m.tags)].join(',') : ''}`));
  let cout = 0;
  for (const [slot, s2] of Object.entries(m.body.slots)) {
    if (!s2?.organId) continue;
    const def2 = DATA.organs.find((o2) => o2.id === s2.organId);
    cout += bal.tierCost?.[def2?.tier] ?? 1;
    card.append(el('div', { style: 'font-size:10px' },
      `<span class="tierdot t-${def2?.tier ?? 'common'}" style="display:inline-block;margin-right:4px"></span>${esc(slot)} : ${esc(def2?.name ?? s2.organId)} (${s2.hp} PV)`));
  }
  card.append(el('div', { className: 'muted' }, `budget dépensé ≈ ${cout} / ${Math.floor(budgetFor(b, fi) * (m.isElite ? (M.eliteMult ?? 1.7) : 1))}`));
  return card;
}

function renderEquiPage() {
  const page = $('#equi-page'); if (!page) return;
  page.innerHTML = '';
  const bal = DATA.balance;
  const M = (bal.mob = bal.mob ?? {});
  const EMAX = _etageMax();
  if (!DATA.biomes.some((b2) => b2.id === equiBiomeSel)) equiBiomeSel = DATA.biomes[0]?.id ?? null;

  // ═══ 1. LE PARCOURS : quels étages pour quel biome — et sélecteur de biome ═══
  const fsP = el('fieldset');
  fsP.append(el('legend', {}, 'Le parcours — les étages de chaque biome (clique pour régler)'));
  const pBox = el('div');
  const renderParcours = () => {
    pBox.innerHTML = '';
    for (const br of [0, 1]) {
      const row = el('div', { style: 'display:flex;gap:3px;margin-bottom:4px;align-items:stretch' });
      row.append(el('span', { className: 'muted', style: 'width:62px;flex:none;align-self:center' }, 'branche ' + 'AB'[br]));
      let e = 1;
      while (e <= EMAX) {
        const b2 = biomeAt(e, br);
        let fin = e;
        while (fin < EMAX && biomeAt(fin + 1, br)?.id === b2?.id) fin++;
        const col = b2?.palette?.blood ?? '#444';
        const sel = b2 && b2.id === equiBiomeSel;
        const seg = el('div', {
          className: 'parcseg',
          style: `flex:${fin - e + 1};min-width:0;border:1px solid ${col};border-radius:3px;padding:3px 7px;font-size:11px;line-height:1.4;`
            + `cursor:${b2 ? 'pointer' : 'default'};background:${b2 ? col + (sel ? '66' : '22') : 'transparent'};${sel ? 'outline:1px solid var(--accent)' : ''}`,
          title: b2 ? `${b2.name} — étages ${e} à ${fin}` : 'aucun biome ne couvre ces étages (onglet Biomes → strate/étages)',
        }, `<b>${esc(b2?.name ?? '— trou —')}</b><br><span class="muted">ét. ${e}–${fin} · ${fin - e + 1} étage${fin - e ? 's' : ''}${b2?.bossId ? ` · ☠ ét. ${fin}` : ''}</span>`);
        if (b2) seg.onclick = () => { equiBiomeSel = b2.id; renderParcours(); renderPanel(); };
        row.append(seg);
        e = fin + 1;
      }
      pBox.append(row);
    }
    // la puissance RÉSULTANTE des réglages par biome, continue de l'étage 1 à EMAX
    pBox.append(graphe([
      { fn: (e) => budgetFor(biomeAt(e, 0), e - 1), color: 'var(--accent)', label: 'budget d\'un mob — branche A' },
      { fn: (e) => budgetFor(biomeAt(e, 1), e - 1), color: '#5a86a8', label: 'branche B' },
    ], { h: 110 }));
    pBox.append(el('div', { className: 'muted' }, 'Le donjon fourche : chaque descente suit UNE des deux branches. Strate & étages d\'un biome : onglet Biomes → Identité.'));
  };
  fsP.append(pBox);
  page.append(fsP);

  // ═══ 2. LE BIOME SÉLECTIONNÉ : budget, tiers, pool d'organes, générateur ═══
  const fsB = el('fieldset');
  fsB.append(el('legend', {}, 'Réglages du biome sélectionné'));
  const panel = el('div', { className: 'equi-panel' });
  const renderPanel = () => {
    panel.innerHTML = '';
    const b = DATA.biomes.find((b2) => b2.id === equiBiomeSel);
    if (!b) { panel.append(el('p', { className: 'muted' }, 'Aucun biome — crée-en un dans l\'onglet Biomes.')); return; }
    const mb = (b.mobs = b.mobs ?? { sets: [], plus: [], moins: [], intrusion: 0.02 });
    mb.plus = mb.plus ?? []; mb.moins = mb.moins ?? [];
    mb.budget = mb.budget ?? [5, 10];
    mb.tiers = mb.tiers ?? { common: 70, rare: 20, epic: 8, legendary: 2 };
    const [f0, f1] = b.floorRange ?? [1, 1];

    // en-tête : où vit ce biome
    panel.append(el('div', { className: 'equi-head', style: `border-left:3px solid ${b.palette?.blood ?? '#444'};padding-left:8px;margin-bottom:8px` },
      `<b style="font-size:13px">${esc(b.name)}</b> <span class="muted">— étages ${f0} à ${f1} (${f1 - f0 + 1} étages) · strate ${b.strateIndex ?? '?'}${b.bossId ? ` · boss « ${esc(b.bossId)} » à l'ét. ${f1}` : ' · pas de boss'}</span>`));

    // budget des mobs : LES chiffres du jeu, interpolés de l'entrée à la sortie
    const bRow = el('div', { className: 'frow' });
    bRow.append(el('label', { style: 'width:110px', title: 'budget d\'organes d\'un mob, interpolé linéairement du premier au dernier étage du biome' }, 'budget des mobs'));
    const b0In = el('input', { className: 'bud-in', type: 'number', value: mb.budget[0], min: 1, style: 'width:56px' });
    const b1In = el('input', { className: 'bud-in', type: 'number', value: mb.budget[1], min: 1, style: 'width:56px' });
    const budElite = el('span', { className: 'muted' });
    const refreshBud = () => {
      const em = M.eliteMult ?? 1.7;
      budElite.textContent = `(élite ×${em} → ${Math.floor(mb.budget[0] * em)} à ${Math.floor(mb.budget[1] * em)})`;
    };
    b0In.oninput = () => { mb.budget[0] = +b0In.value; persist(); refreshBud(); renderParcours(); };
    b1In.oninput = () => { mb.budget[1] = +b1In.value; persist(); refreshBud(); renderParcours(); };
    refreshBud();
    bRow.append(b0In, el('span', { className: 'muted' }, `à l'entrée (ét. ${f0}) →`), b1In, el('span', { className: 'muted' }, `à la sortie (ét. ${f1})`), budElite);
    panel.append(bRow);

    // taux des tiers de CE biome — poids libres, la barre montre la part réelle
    const tBars = {};
    const refreshTiers = () => {
      const taux = tierTauxFor(b);   // la MÊME normalisation que le jeu
      for (const t of Object.keys(TIER_COULEUR)) {
        tBars[t].bar.style.width = (100 * taux[t]).toFixed(1) + '%';
        tBars[t].pct.textContent = (100 * taux[t]).toFixed(0) + '%';
      }
    };
    for (const t of Object.keys(TIER_COULEUR)) {
      const row = el('div', { className: 'frow' });
      row.append(el('label', { style: `width:110px;color:${TIER_COULEUR[t]}`, title: 'poids de tirage de ce tier dans CE biome — seule la proportion compte (normalisé)' }, 'tier ' + t));
      const n = el('input', { className: 'tier-n', type: 'number', value: mb.tiers[t] ?? 0, min: 0, style: 'width:56px' });
      const barBox = el('div', { style: 'width:170px;height:9px;background:#0a0705;border:1px solid var(--line);border-radius:2px;overflow:hidden' });
      const bar = el('div', { style: `height:100%;background:${TIER_COULEUR[t]}` });
      barBox.append(bar);
      const pct = el('span', { className: 'muted tier-pct', style: 'width:34px' });
      tBars[t] = { bar, pct };
      n.oninput = () => { mb.tiers[t] = +n.value; persist(); refreshTiers(); };
      row.append(n, barBox, pct, el('span', { className: 'muted', style: 'font-size:10px' }, `coût ${bal.tierCost?.[t] ?? 1} sur le budget`));
      panel.append(row);
    }
    refreshTiers();

    const iRow = el('div', { className: 'frow' });
    iRow.append(el('label', { style: 'width:110px', title: 'chance, à CHAQUE tirage d\'organe, de piocher HORS du pool (n\'importe quel organe des autres biomes)' }, 'intrusion %'));
    const intN = el('input', { type: 'number', value: Math.round((mb.intrusion ?? 0) * 1000) / 10, min: 0, max: 100, step: 0.5, style: 'width:64px' });
    intN.oninput = () => { mb.intrusion = (+intN.value || 0) / 100; persist(); };
    iRow.append(intN, el('span', { className: 'muted' }, 'chance par organe de venir d\'un autre biome'));
    panel.append(iRow);

    // sets du pool
    const sRow = el('div', { className: 'frow' });
    sRow.append(el('label', { style: 'width:110px', title: 'les mobs de ce biome se construisent avec les organes de ces sets' }, 'sets du pool'));
    for (const s2 of DATA.sets) {
      const cb2 = el('input', { className: 'set-cb', type: 'checkbox', checked: (mb.sets ?? []).includes(s2.id) });
      cb2.onchange = () => {
        const arr = (mb.sets = mb.sets ?? []);
        if (cb2.checked) arr.push(s2.id); else arr.splice(arr.indexOf(s2.id), 1);
        persist(); renderPanel();
      };
      const lb = el('label', { style: 'width:auto;font-size:11px' });
      lb.append(cb2, document.createTextNode(' ' + s2.name));
      sRow.append(lb);
    }
    panel.append(sRow);

    // pool résolu (sets ± exceptions), groupé par tier — MobGen.poolFor partagé
    const pool = poolFor(b, DATA.organs);
    const poolBox = el('div', { style: 'margin:6px 0' });
    poolBox.append(el('div', { className: 'muted', style: 'margin-bottom:3px' },
      `Pool : ${pool.length} organe(s). Clique la croix d'un organe pour l'exclure ; ＋ = exception ajoutée hors sets.`));
    for (const t of Object.keys(TIER_COULEUR)) {
      const duTier = pool.filter((o) => (o.tier ?? 'common') === t);
      if (!duTier.length) continue;
      const line = el('div', { style: 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:3px;align-items:center' });
      line.append(el('span', { style: `color:${TIER_COULEUR[t]};font-size:10px;width:100px;flex:none` }, t));
      for (const o of duTier) {
        const horsSet = !(mb.sets ?? []).includes(o.set);
        const chip = el('span', {
          className: 'poolchip',
          style: `display:inline-flex;gap:4px;align-items:center;border:1px solid ${horsSet ? 'var(--accent)' : 'var(--line)'};border-radius:3px;padding:1px 5px;font-size:10px`,
          title: `${o.id} · set ${o.set ?? '?'}${horsSet ? ' — exception (hors sets du pool)' : ''}`,
        }, `<span class="tierdot t-${o.tier ?? 'common'}"></span>${horsSet ? '＋ ' : ''}${esc(o.name)}`);
        const x = el('span', { className: 'poolx', style: 'cursor:pointer;color:#c05a4a', title: horsSet ? 'retirer cette exception' : 'exclure cet organe du pool' }, '✕');
        x.onclick = () => {
          if (horsSet) mb.plus.splice(mb.plus.indexOf(o.id), 1);
          else mb.moins.push(o.id);
          persist(); renderPanel();
        };
        chip.append(x);
        line.append(chip);
      }
      poolBox.append(line);
    }
    if (!pool.length) poolBox.append(el('div', { className: 'w warn' }, '⚠ pool vide — les mobs n\'auront que la peau humaine de secours'));
    // exclus (barrés, restaurables)
    const exclus = (mb.moins ?? []).map((id2) => DATA.organs.find((o) => o.id === id2) ?? { id: id2, name: id2 + ' (inconnu)' });
    if (exclus.length) {
      const line = el('div', { style: 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:3px;align-items:center' });
      line.append(el('span', { className: 'muted', style: 'font-size:10px;width:100px;flex:none' }, 'exclus'));
      for (const o of exclus) {
        const chip = el('span', { style: 'display:inline-flex;gap:4px;align-items:center;border:1px dashed var(--line);border-radius:3px;padding:1px 5px;font-size:10px;opacity:.65' },
          `<s>${esc(o.name)}</s>`);
        const back = el('span', { className: 'poolback', style: 'cursor:pointer', title: 'réintégrer au pool' }, '↩');
        back.onclick = () => { mb.moins.splice(mb.moins.indexOf(o.id), 1); persist(); renderPanel(); };
        chip.append(back);
        line.append(chip);
      }
      poolBox.append(line);
    }
    // + exception : n'importe quel organe hors pool
    const dispo = DATA.organs.filter((o) => !pool.some((p2) => p2.id === o.id) && !(mb.moins ?? []).includes(o.id));
    if (dispo.length) {
      const addSel = el('select', { className: 'pooladd', style: 'max-width:300px' });
      addSel.append(el('option', { value: '' }, '＋ ajouter une exception (organe hors sets)…'));
      for (const o of dispo) addSel.append(el('option', { value: o.id }, `${o.name} — ${o.set ?? '?'} · ${o.tier ?? 'common'}`));
      addSel.onchange = () => { if (addSel.value) { mb.plus.push(addSel.value); persist(); renderPanel(); } };
      poolBox.append(addSel);
    }
    panel.append(poolBox);

    // générateur de CE biome (vrai MobGen sur les brouillons)
    const gRow = el('div', { className: 'frow', style: 'margin-top:8px' });
    gRow.append(el('label', { style: 'width:110px' }, '🎲 générateur'));
    const gEtage = el('input', { type: 'number', value: f0, min: f0, max: f1, style: 'width:56px', title: `étage (${f0} à ${f1} pour ce biome)` });
    const gElite = el('input', { className: 'gen-elite', type: 'checkbox' });
    const gGroupe = el('input', { className: 'gen-groupe', type: 'checkbox', title: 'groupe de 3 : une élite max (si cochée) + soutiens à budget réduit' });
    const lE = el('label', { style: 'width:auto;font-size:11px' }); lE.append(gElite, document.createTextNode(' élite'));
    const lG = el('label', { style: 'width:auto;font-size:11px' }); lG.append(gGroupe, document.createTextNode(' groupe de 3'));
    const gBtn = el('button', { className: 'tiny primary gen-btn' }, '🎲 générer');
    gRow.append(el('span', { className: 'muted' }, 'étage'), gEtage, lE, lG, gBtn);
    const gOut = el('div', { className: 'gen-out', style: 'display:flex;gap:10px;flex-wrap:wrap;margin-top:6px' });
    gBtn.onclick = () => {
      try {
        refreshRegistry();
        initRun((Math.random() * 0xffffffff) >>> 0);
        const fi = (+gEtage.value || f0) - 1;
        const mobs = gGroupe.checked
          ? rollPack(b.id, fi, { count: 3, elite: gElite.checked })
          : [rollMob(b.id, fi, { elite: gElite.checked })].filter(Boolean);
        gOut.innerHTML = '';
        for (const m of mobs) gOut.append(mobCard(m, fi, b));
      } catch (e2) { gOut.textContent = '✕ ' + e2.message; }
    };
    panel.append(gRow, gOut);
  };
  fsB.append(panel);
  renderParcours();
  renderPanel();
  page.append(fsB);

  // ═══ 3. RÉGLAGES GLOBAUX (tous biomes) — repliés pour ne pas noyer le reste ═══
  const detail = (titre) => {
    const det = el('details', { style: 'margin:0 0 8px' });
    det.append(el('summary', { style: 'cursor:pointer;font-size:12px;color:var(--accent);padding:3px 0' }, titre));
    const inner = el('div', { style: 'padding:6px 2px 2px' });
    det.append(inner);
    page.append(det);
    return inner;
  };

  // élites, meutes, coûts
  const meutes = detail('⚙ Élites, meutes & coût des tiers (tous biomes)');
  const numRow = (obj, key, label, title, step = 0.01) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', { style: 'width:190px', title }, label));
    const n = el('input', { type: 'number', value: obj[key] ?? '', step, style: 'width:72px' });
    n.oninput = () => { obj[key] = +n.value; persist(); };
    row.append(n); return row;
  };
  meutes.append(
    numRow(M, 'eliteChance', 'chance d\'élite / groupe', 'chance qu\'un groupe (hors salle combat_elite, qui force) contienne UNE élite'),
    numRow(M, 'eliteMult', '× budget élite', 'multiplicateur de budget de l\'élite (elle reçoit aussi le meilleur cœur du pool)'),
    numRow(M, 'supportBudgetMult', '× budget des soutiens', 'les compagnons de meute d\'une élite sont construits sur ce budget réduit'),
    numRow(M, 'packFloor', 'meutes de 3+ dès l\'étage', 'avant cet étage, les groupes sont plafonnés à 2 mobs', 1),
    numRow(M, 'extraMobChanceBase', 'chance de mob en plus (base)', 'chaque place au-dessus du minimum se remplit avec cette chance…'),
    numRow(M, 'extraMobChancePerFloor', '… + par étage', '…qui augmente d\'autant par étage (plafond 85%)'),
  );
  const costRow = el('div', { className: 'frow' });
  costRow.append(el('label', { style: 'width:190px', title: 'prix d\'un organe de ce tier sur le budget du mob' }, 'coût des tiers'));
  for (const t of Object.keys(TIER_COULEUR)) {
    const n = el('input', { type: 'number', value: bal.tierCost?.[t] ?? 1, min: 1, style: 'width:52px', title: t });
    n.style.borderColor = TIER_COULEUR[t];
    n.oninput = () => { (bal.tierCost = bal.tierCost ?? {})[t] = +n.value; persist(); };
    costRow.append(n);
  }
  meutes.append(costRow);

  // courbe de difficulté MESURÉE
  const mesure = detail('📈 Courbe de difficulté mesurée (IA gloutonne, mobs du vrai MobGen)');
  const mRow = el('div', { className: 'frow' });
  const mBranche = el('select');
  mBranche.append(el('option', { value: '0' }, 'branche A'));
  mBranche.append(el('option', { value: '1' }, 'branche B'));
  const mBtn = el('button', { className: 'tiny primary' }, '📈 mesurer (40 combats/étage)');
  mRow.append(mBtn, mBranche, el('span', { className: 'muted' }, 'corps testés : celui du Simulateur + le corps humain de base'));
  const mOut = el('div');
  mBtn.onclick = () => {
    try {
      refreshRegistry();
      const br = +mBranche.value;
      const corps = [
        { label: 'corps du Simulateur', body: bodyFromSelects('p'), color: 'var(--accent)' },
        { label: 'corps humain de base', body: presetBody('human'), color: '#5a86a8' },
      ].filter((c2) => CR.livingSlots(c2.body).length);
      const lignes = corps.map((c2) => ({ ...c2, mesures: [] }));
      for (let etage = 1; etage <= EMAX; etage++) {
        const b2 = biomeAt(etage, br);
        for (const l of lignes) {
          if (!b2) { l.mesures.push([etage, 0]); continue; }
          let wins = 0;
          const N = 40;
          for (let i = 0; i < N; i++) {
            initRun(etage * 1000 + i);
            const mob = rollMob(b2.id, etage - 1);
            if (!mob) continue;
            if (combatIA(l.body, mob, mulberry(etage * 100 + i)).win) wins++;
          }
          l.mesures.push([etage, Math.round(100 * wins / N)]);
        }
      }
      mOut.innerHTML = '';
      mOut.append(graphe(lignes.map((l) => ({ points: l.mesures, color: l.color, label: l.label + ' (winrate %)' })), { h: 150, yMax: 100, unite: '%' }));
    } catch (e2) { mOut.textContent = '✕ ' + e2.message; }
  };
  mesure.append(mRow, mOut);
}

// corps de référence : le preset d'un set (mêmes organes que les boutons du Simulateur)
function presetBody(setId) {
  const b = emptyBody('ref_' + setId);
  for (const k of SLOT_KEYS) {
    const type = ORGAN_SLOTS[k].type;
    const o = DATA.organs.find((x) => x.type === type && x.set === setId);
    if (o) b.slots[k] = { organId: o.id, hp: o.hp ?? 6 };
  }
  return b;
}

// ═══════════════════════════════ ONGLET BIOMES ═══════════════════════════════
// Palette (les 5 tokens appliqués par SceneRenderer.applyBiomePalette), identité,
// étages, génération d'étage. themes/themeDetails (IA des mobs) restent en JSON
// brut — édition experte. Les brouillons partent au simulateur via applyDrafts.
let biomeSel = null;
const PALETTE_KEYS = [
  ['meat',     'chair (fond)'],
  ['blood',    'sang (accents)'],
  ['thread',   'fil (bordures)'],
  ['torch',    'torche'],
  ['torchHot', 'torche chaude'],
];

function renderBiomeList() {
  const box = $('#biome-list'); if (!box) return;
  const q = ($('#biome-search')?.value || '').toLowerCase();
  box.innerHTML = '';
  box.append(el('div', { className: 'grp' }, 'Biomes'));
  for (const b of DATA.biomes.filter((x) => !q || x.name.toLowerCase().includes(q) || x.id.includes(q))) {
    const it = el('div', { className: 'item' + (b.id === biomeSel ? ' sel' : '') });
    const sw = (b.palette ? ['meat', 'blood', 'torch'] : []).map((k) =>
      `<span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${b.palette[k]};margin-right:2px"></span>`).join('');
    it.append(el('span', { className: 'nm' }, `${sw}${esc(b.name)}`));
    it.append(el('span', { className: 'id' }, `strate ${b.strateIndex ?? '?'} · ét. ${b.floorRange?.[0] ?? '?'}-${b.floorRange?.[1] ?? '?'}`));
    it.onclick = () => { biomeSel = b.id; renderBiomeList(); biomeEditor(b); };
    box.append(it);
  }
}

function biomeValidate(b) {
  const out = [];
  if (DATA.biomes.filter((x) => x.id === b.id).length > 1) out.push(['bad', `id "${b.id}" dupliqué`]);
  for (const [k] of PALETTE_KEYS) if (!/^#[0-9a-fA-F]{6}$/.test(b.palette?.[k] ?? '')) out.push(['bad', `palette.${k} : couleur hex attendue`]);
  if (!(b.floorRange?.[0] <= b.floorRange?.[1])) out.push(['bad', 'étages : début > fin']);
  for (const rid of Object.keys(b.salles?.poids ?? {})) {
    const rr = DATA.rooms.find((x) => x.id === rid);
    if (!rr) out.push(['bad', `peuplement : salle "${rid}" inconnue`]);
    else if (rr.biomeOnly !== b.id) out.push(['bad', `peuplement : "${rid}" appartient au biome "${rr.biomeOnly}"`]);
  }
  for (const rg of b.salles?.regles ?? []) {
    if (!DATA.rooms.some((x) => x.id === rg.salle)) out.push(['bad', `règle : salle "${rg.salle}" inconnue`]);
  }
  if (!(b.salles?.regles ?? []).some((rg) => rg.position === 'entree')) out.push(['warn', 'aucune règle « entrée » — les étages n\'auront pas de salle de départ']);
  if (!(b.salles?.regles ?? []).some((rg) => rg.position === 'sortie')) out.push(['warn', 'aucune règle « sortie » — les étages n\'auront pas de descente']);
  if (b.bossId) out.push(['ok', `boss : ${b.bossId} (mobs.json)`]);
  for (const oid of b.mobs?.plus ?? []) if (!DATA.organs.some((o) => o.id === oid)) out.push(['bad', `pool mobs (exception +) : organe "${oid}" inconnu`]);
  for (const oid of b.mobs?.moins ?? []) if (!DATA.organs.some((o) => o.id === oid)) out.push(['warn', `pool mobs (exclu) : organe "${oid}" inconnu`]);
  if (b.mobs && !poolFor(b, DATA.organs).length) out.push(['warn', 'pool d\'organes des mobs VIDE (onglet Équilibrage)']);
  const users = DATA.rooms.filter((r) => r.biomeOnly === b.id).length;
  out.push(['ok', `${users} salle(s) réservée(s) à ce biome`]);
  return out;
}

function biomeEditor(b) {
  const ed = $('#biome-editor'); if (!ed) return;
  if (!b) { ed.innerHTML = '<p class="muted">Sélectionne un biome à gauche.</p>'; return; }
  ed.innerHTML = '';
  const warns = el('div', { className: 'warns' });
  const showWarns = () => {
    warns.innerHTML = '';
    for (const [cls, msg] of biomeValidate(b)) warns.append(el('div', { className: 'w ' + cls }, (cls === 'bad' ? '✕ ' : cls === 'warn' ? '⚠ ' : '✓ ') + esc(msg)));
  };
  const touch = () => { persist(); renderBiomeList(); showWarns(); };

  // ── identité ──
  const fs1 = el('fieldset'); fs1.append(el('legend', {}, 'Identité'));
  const F = (label, key, type = 'text', extra = {}) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', {}, label));
    const inp = el('input', { type, value: b[key] ?? '', ...extra });
    inp.oninput = () => { b[key] = type === 'number' ? +inp.value : inp.value; touch(); };
    row.append(inp); return row;
  };
  fs1.append(F('id', 'id'), F('nom', 'name'));
  const frRow = el('div', { className: 'frow' }); frRow.append(el('label', {}, 'strate / étages'));
  const st = el('input', { type: 'number', value: b.strateIndex ?? 0, min: 0, max: 5, style: 'width:52px', title: 'profondeur dans le corps (0 = Gorge)' });
  st.oninput = () => { b.strateIndex = +st.value; touch(); };
  const f0 = el('input', { type: 'number', value: b.floorRange?.[0] ?? 1, style: 'width:56px', title: 'premier étage' });
  const f1 = el('input', { type: 'number', value: b.floorRange?.[1] ?? 5, style: 'width:56px', title: 'dernier étage (boss à l\'avant-dernier)' });
  f0.oninput = () => { (b.floorRange = b.floorRange ?? [1, 5])[0] = +f0.value; touch(); };
  f1.oninput = () => { (b.floorRange = b.floorRange ?? [1, 5])[1] = +f1.value; touch(); };
  frRow.append(st, el('span', { className: 'muted' }, 'étages'), f0, el('span', { className: 'muted' }, '→'), f1);
  fs1.append(frRow);
  fs1.append(F('boss (id mob)', 'bossId', 'text', { placeholder: 'boss_langue — vide : pas de boss' }));
  ed.append(fs1);

  // ── palette (tokens CSS appliqués par SceneRenderer, code partagé jeu/sandbox) ──
  const fs2 = el('fieldset'); fs2.append(el('legend', {}, 'Palette — les 5 tokens du biome'));
  b.palette = b.palette ?? {};
  for (const [k, lbl] of PALETTE_KEYS) {
    const row = el('div', { className: 'frow' });
    row.append(el('label', {}, lbl));
    const c = el('input', { type: 'color', value: /^#[0-9a-fA-F]{6}$/.test(b.palette[k] ?? '') ? b.palette[k] : '#000000' });
    c.oninput = () => { b.palette[k] = c.value; hex.value = c.value; touch(); };
    const hex = el('input', { value: b.palette[k] ?? '', style: 'width:90px', placeholder: '#2e1112' });
    hex.oninput = () => { b.palette[k] = hex.value; if (/^#[0-9a-fA-F]{6}$/.test(hex.value)) c.value = hex.value; touch(); };
    row.append(c, hex); fs2.append(row);
  }
  fs2.append(el('div', { className: 'muted' }, 'Teste dans le Simulateur : choisis ce biome dans « salle / biome » puis charge la salle.'));
  ed.append(fs2);

  // ── génération d'étage ──
  const fs3 = el('fieldset'); fs3.append(el('legend', {}, 'Génération d\'étage'));
  const gen = (b.gen = b.gen ?? { pathBias: 0.5, branchSeeds: 0.6, branchLen: [1, 2] });
  const gRow1 = el('div', { className: 'frow' }); gRow1.append(el('label', { title: 'taille de la grille du donjon (impair)' }, 'grille'));
  const gs = el('input', { type: 'number', value: b.gridSize ?? 7, min: 5, max: 15, step: 2, style: 'width:56px' });
  gs.oninput = () => { b.gridSize = +gs.value; touch(); };
  gRow1.append(gs); fs3.append(gRow1);
  const gslider = (label, title, get, set) => {
    const row = el('div', { className: 'frow' });
    row.append(el('label', { title }, label));
    const s = el('input', { type: 'range', min: 0, max: 1, step: 0.05, value: get(), style: 'width:150px' });
    const num = el('span', { className: 'muted' }, String(get()));
    s.oninput = () => { set(+s.value); num.textContent = s.value; touch(); };
    row.append(s, num); fs3.append(row);
  };
  gslider('chemin direct', 'biais du chemin principal vers la sortie (1 = ligne droite)', () => gen.pathBias ?? 0.5, (v) => { gen.pathBias = v; });
  gslider('branches', 'densité des embranchements secondaires', () => gen.branchSeeds ?? 0.6, (v) => { gen.branchSeeds = v; });
  const blRow = el('div', { className: 'frow' }); blRow.append(el('label', { title: 'longueur des branches (min → max salles)' }, 'long. branches'));
  const bl0 = el('input', { type: 'number', value: gen.branchLen?.[0] ?? 1, min: 0, max: 6, style: 'width:52px' });
  const bl1 = el('input', { type: 'number', value: gen.branchLen?.[1] ?? 2, min: 0, max: 6, style: 'width:52px' });
  bl0.oninput = () => { (gen.branchLen = gen.branchLen ?? [1, 2])[0] = +bl0.value; touch(); };
  bl1.oninput = () => { (gen.branchLen = gen.branchLen ?? [1, 2])[1] = +bl1.value; touch(); };
  blRow.append(bl0, el('span', { className: 'muted' }, '→'), bl1); fs3.append(blRow);
  ed.append(fs3);

  // Mobs (budget, tiers, pool d'organes, intrusion) : réglés dans l'onglet Équilibrage
  ed.append(el('div', { className: 'muted', style: 'margin:0 0 8px' }, '👹 Budget des mobs, taux des tiers, pool d\'organes & intrusion : onglet Équilibrage (clique ce biome dans le parcours).'));

  // ── PEUPLEMENT : le taux de spawn de chaque salle DU BIOME, avec barres % ──
  b.salles = b.salles ?? { poids: {}, regles: [] };
  const poids = (b.salles.poids = b.salles.poids ?? {});
  const mesSalles = () => DATA.rooms.filter((r2) => r2.biomeOnly === b.id);
  const fs4 = el('fieldset'); fs4.append(el('legend', {}, 'Peuplement — poids de chaque salle (0 = jamais)'));
  const pBox = el('div');
  const renderPoids = () => {
    pBox.innerHTML = '';
    const total = Object.values(poids).reduce((s, w) => s + Math.max(0, w || 0), 0) || 1;
    for (const r2 of mesSalles()) {
      const w = poids[r2.id] ?? 0;
      const row = el('div', { className: 'frow', style: w > 0 ? '' : 'opacity:.55' });
      row.dataset.salle = r2.id;
      row.append(el('label', { style: 'width:170px', title: r2.id }, esc(r2.id)));
      const n = el('input', { type: 'number', value: w, min: 0, max: 99, style: 'width:56px' });
      n.oninput = () => {
        if (+n.value > 0) poids[r2.id] = +n.value; else delete poids[r2.id];
        persist(); renderPoids();
      };
      const pct = w > 0 ? (100 * w / total) : 0;
      const bar = el('div', { style: 'width:160px;height:9px;background:#0a0705;border:1px solid var(--line);border-radius:2px;overflow:hidden' });
      bar.append(el('div', { style: `width:${pct.toFixed(1)}%;height:100%;background:var(--accent)` }));
      row.append(n, bar, el('span', { className: 'muted' }, w > 0 ? pct.toFixed(1) + '%' : 'jamais'));
      pBox.append(row);
    }
    if (!mesSalles().length) pBox.append(el('div', { className: 'muted' }, 'Aucune salle dans ce biome (onglet Salles → biome).'));
  };
  renderPoids();
  fs4.append(pBox);
  ed.append(fs4);

  // ── RÈGLES : salles particulières (entrée, sortie, boss, garanties…) ──
  const fs5b = el('fieldset'); fs5b.append(el('legend', {}, 'Règles — salles particulières'));
  const rBox = el('div');
  const POSITIONS = [['', '— zone'], ['entree', 'entrée'], ['sortie', 'sortie'], ['impasse', 'impasse (bout de branche)'], ['chemin', 'chemin principal']];
  const ETAGES = [['', 'tous les étages'], ['premier', 'premier étage'], ['dernier', 'dernier étage']];
  const renderRegles = () => {
    rBox.innerHTML = '';
    (b.salles.regles ?? []).forEach((rg, i) => {
      const row = el('div', { className: 'frow' });
      const ss = el('select');
      for (const r2 of mesSalles()) ss.append(el('option', { value: r2.id, selected: rg.salle === r2.id }, r2.id));
      ss.onchange = () => { rg.salle = ss.value; persist(); };
      const ps = el('select', { title: 'entrée/sortie : PLACE la salle · impasse/chemin : restreint la zone de min/max/chance' });
      for (const [v, l] of POSITIONS) ps.append(el('option', { value: v, selected: (rg.position ?? '') === v }, l));
      ps.onchange = () => { if (ps.value) rg.position = ps.value; else delete rg.position; persist(); };
      const es2 = el('select', { title: 'restreint la règle à un étage du biome' });
      for (const [v, l] of ETAGES) es2.append(el('option', { value: v, selected: (rg.etage ?? '') === v }, l));
      es2.onchange = () => { if (es2.value) rg.etage = es2.value; else delete rg.etage; persist(); };
      const num2 = (key, ph, title) => {
        const n = el('input', { type: 'number', value: rg[key] ?? '', placeholder: ph, min: 0, step: key === 'chance' ? 0.05 : 1, style: 'width:58px', title });
        n.oninput = () => { if (n.value === '') delete rg[key]; else rg[key] = +n.value; persist(); };
        return n;
      };
      const del = el('button', { className: 'tiny danger' }, '✕');
      del.onclick = () => { b.salles.regles.splice(i, 1); persist(); renderRegles(); };
      row.append(ss, ps, es2, num2('min', 'min', 'nombre garanti par étage'), num2('max', 'max', 'plafond par étage'), num2('chance', '%', 'probabilité d\'UNE apparition par étage (0-1)'), del);
      rBox.append(row);
    });
    const add = el('button', { className: 'tiny' }, '+ règle');
    add.disabled = !mesSalles().length;
    add.onclick = () => { (b.salles.regles = b.salles.regles ?? []).push({ salle: mesSalles()[0].id, min: 1 }); persist(); renderRegles(); };
    rBox.append(add);
    rBox.append(el('div', { className: 'muted' }, 'entrée/sortie placent la salle (deux règles « sortie » : celle avec un étage gagne — le boss au dernier). min garantit, max plafonne, chance tente une apparition.'));
  };
  renderRegles();
  fs5b.append(rBox);
  ed.append(fs5b);

  // ── SIMULATION : le VRAI DungeonGen sur les brouillons, carte + stats + hover ──
  const fs6 = el('fieldset'); fs6.append(el('legend', {}, 'Simulation — étages générés (vrai DungeonGen)'));
  const simRow = el('div', { className: 'frow' });
  const simBtn = el('button', { className: 'tiny primary' }, '🎲 générer 20 étages');
  const simNav = el('span');
  simRow.append(simBtn, simNav);
  const simMap = el('div', { style: 'display:none' });
  const simStats = el('div', { className: 'muted', style: 'margin-top:6px' });
  fs6.append(simRow, simMap, simStats);
  ed.append(fs6);
  let _floors = [], _fi = 0;
  const teinte = (id) => `hsl(${(Array.from(id).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0) % 360} 38% 30%)`;
  const renderSim = () => {
    if (!_floors.length) return;
    const fl = _floors[_fi];
    simNav.innerHTML = '';
    const prev = el('button', { className: 'tiny' }, '◀'); prev.onclick = () => { _fi = (_fi + _floors.length - 1) % _floors.length; renderSim(); };
    const next = el('button', { className: 'tiny' }, '▶'); next.onclick = () => { _fi = (_fi + 1) % _floors.length; renderSim(); };
    simNav.append(prev, el('span', { className: 'muted' }, ` étage ${_fi + 1}/${_floors.length} (idx ${fl.idx}${fl.boss ? ' · BOSS' : ''}) `), next);
    // carte : une cellule par case, survol ↔ highlight croisé avec le peuplement
    simMap.style.cssText = `display:grid;grid-template-columns:repeat(${fl.size},16px);gap:1px;margin:6px 0;`;
    simMap.innerHTML = '';
    for (let y = 0; y < fl.size; y++) for (let x = 0; x < fl.size; x++) {
      const cell = fl.grid[y][x];
      const c = el('div', { title: cell ?? '' });
      c.style.cssText = 'width:16px;height:16px;border-radius:2px;background:' + (cell ? teinte(cell) : '#0a0705');
      if (cell) {
        c.dataset.salle = cell;
        if (fl.entree.x === x && fl.entree.y === y) c.style.outline = '1px solid var(--ok)';
        if (fl.sortie.x === x && fl.sortie.y === y) c.style.outline = '1px solid var(--bad)';
        c.onmouseenter = () => hi(cell, true);
        c.onmouseleave = () => hi(cell, false);
      }
      simMap.append(c);
    }
    // stats moyennes (tous étages) + hover croisé
    const tot = {};
    for (const f2 of _floors) for (const row2 of f2.grid) for (const id of row2) if (id) tot[id] = (tot[id] ?? 0) + 1;
    simStats.innerHTML = '';
    for (const [id, n] of Object.entries(tot).sort((a2, b2) => b2[1] - a2[1])) {
      const line = el('div', { style: 'cursor:default' }, `<span style="display:inline-block;width:9px;height:9px;border-radius:2px;background:${teinte(id)};margin-right:5px"></span>${esc(id)} — ${(n / _floors.length).toFixed(1)}/étage`);
      line.dataset.salle = id;
      line.onmouseenter = () => hi(id, true);
      line.onmouseleave = () => hi(id, false);
      simStats.append(line);
    }
  };
  const hi = (id, on) => {
    for (const n of ed.querySelectorAll(`[data-salle]`)) {
      const match = n.dataset.salle === id;
      if (n.parentElement === simMap) n.style.boxShadow = on && match ? '0 0 0 2px #fff' : '';
      else n.style.background = on && match ? '#2a1f14' : '';
    }
  };
  simBtn.onclick = () => {
    try {
      refreshRegistry();   // la simulation lit les BROUILLONS (poids/règles non sauvés inclus)
      const span = Math.max(1, (b.floorRange?.[1] ?? 1) - (b.floorRange?.[0] ?? 1) + 1);
      _floors = [];
      for (let i = 0; i < 20; i++) {
        const idx = (b.floorRange?.[0] ?? 1) - 1 + (i % span);
        initRun(0xC0FFEE + i * 7919);
        const fl = generateFloor(b.id, idx);
        const grid = Array.from({ length: fl.size }, (_, y) => Array.from({ length: fl.size }, (_, x) => fl.cell(x, y)?.defId ?? null));
        _floors.push({ size: fl.size, idx, grid, entree: fl.entrance, sortie: fl.exit,
          boss: !!b.bossId && idx === (b.floorRange?.[1] ?? 0) - 1 });
      }
      _fi = 0;
      renderSim();
    } catch (e2) { simStats.textContent = '✕ ' + e2.message; }
  };

  // ── thèmes (IA des mobs) : édition experte en JSON brut ──
  const fs5 = el('fieldset'); fs5.append(el('legend', {}, 'Thèmes (comportements des mobs) — JSON'));
  const ta = el('textarea', { value: JSON.stringify({ themes: b.themes ?? [], themeDetails: b.themeDetails ?? {} }, null, 1), style: 'width:460px;height:130px' });
  ta.onchange = () => {
    try {
      const v = JSON.parse(ta.value);
      b.themes = v.themes; b.themeDetails = v.themeDetails;
      ta.style.borderColor = ''; touch();
    } catch { ta.style.borderColor = 'var(--bad)'; }
  };
  fs5.append(ta, el('div', { className: 'muted' }, 'phototropism (attracted/repelled/neutral) · deathSpasm · behaviors · preferredTypes — lus par MobGen.'));
  ed.append(fs5);

  showWarns();
  ed.append(warns);
}

$('#biome-search').oninput = () => renderBiomeList();
$('#biome-new').onclick = () => {
  let n = 1; while (DATA.biomes.some((x) => x.id === `biome-${n}`)) n++;
  const b = { id: `biome-${n}`, name: 'Nouveau biome', strateIndex: 0, floorRange: [1, 5], bossId: null,
    themes: [], themeDetails: {}, palette: { meat: '#2e1112', blood: '#8a2f2a', thread: '#5d2120', torch: '#c47f33', torchHot: '#e8b25c' },
    gridSize: 7, gen: { pathBias: 0.5, branchSeeds: 0.6, branchLen: [1, 2] }, salles: { poids: {}, regles: [] } };
  DATA.biomes.push(b); biomeSel = b.id; persist(); renderBiomeList(); biomeEditor(b);
};
$('#biome-dup').onclick = () => {
  const b = DATA.biomes.find((x) => x.id === biomeSel); if (!b) return;
  const c = deep(b); c.id = b.id + '-copie'; c.name = b.name + ' (copie)';
  DATA.biomes.push(c); biomeSel = c.id; persist(); renderBiomeList(); biomeEditor(c);
};
$('#biome-del').onclick = () => {
  const i = DATA.biomes.findIndex((x) => x.id === biomeSel); if (i < 0) return;
  if (!confirm(`Supprimer ${DATA.biomes[i].name} ?`)) return;
  DATA.biomes.splice(i, 1); biomeSel = null; persist(); renderBiomeList(); biomeEditor(null);
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
renderBiomeList();
renderEquiPage();
renderResList();
simSlotsUI();
fillPreset('human');
setStatus(`${DATA.organs.length} organes · ${Object.keys(tagCat()).length} tags · ${DATA.resources.length} ressources · ${DATA.rooms.length} salles · ${DATA.biomes.length} biomes · ${DATA.relics.length} reliques · ${structEntries().length} structures · ${DATA.sets.length} sets`);
