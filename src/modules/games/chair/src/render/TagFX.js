// TagFX — l'interpréteur DATA des tags (content/tags.json).
// Un tag INÉDIT créé dans l'atelier fonctionne SANS CODE s'il n'utilise que les
// primitives du catalogue :
//   visuel.classe      — classe CSS posée sur .game tant qu'un organe vivant porte le tag
//   visuel.classeCote  — classe par côté : suffixe -l/-r ajouté, ou gabarit `{c}`
//                        remplacé (ex: "eye-{c}-dead" → eye-l-dead)
//   visuel.filtreCote  — backdrop-filter CSS appliqué sur la moitié d'écran du côté
//                        actif (les filtres actifs d'un même côté se cumulent)
//   visuel.shader      — champ de points animé sur canvas, par côté (couleur, alpha,
//                        step, densite, rayon, vitesse) — même algo que EchoFX
//   visuel.mode        — "present" (défaut) : l'effet suit le tag · "absent" : l'effet
//                        s'applique aux côtés qui N'ONT PAS le tag (prérequis remplis) —
//                        c'est ainsi que vue/vue-couleur expriment moitié noire/désaturée
//   visuel.quand       — "toujours" (défaut) · "nuit" (torche éteinte) · "jour"
//   sonore             — source permanente sur la barre de son ({label, intensite, x}),
//                        suit toujours la PRÉSENCE du tag (jamais mode absent)
// Les tags à sémantique moteur profonde (plan, digestion, détection…) gardent leur
// code ; leur entrée catalogue documente où (champ `moteur`) et nourrit l'atelier.
// Cas particulier : le bloc shader de `echolocation-3` N'EST PAS dessiné ici —
// EchoFX le consomme via echoParams() (placement scène/UI + nuages de mobs).
//
// L'activité d'un tag respecte les prérequis MÊME-ORGANE (Faculties.grants) et la
// latéralisation : un tag `cote` s'évalue par moitié d'écran (organe du bon côté).

import TAGS_RAW from '../../content/tags.json';
import { WS } from '../WorldState.js';
import * as Faculties from '../systems/Faculties.js';

let _cat = TAGS_RAW;
Faculties.configureFamilies(_cat.familles);

// L'atelier/sandbox injecte ses brouillons ici (même mécanique que setStructures).
export function setCatalog(json) {
  if (!json?.tags) return;
  _cat = json;
  Faculties.configureFamilies(_cat.familles);
}
export const catalog  = () => _cat.tags ?? {};
export const familles = () => _cat.familles ?? {};
export const tagDef   = (id) => _cat.tags?.[id] ?? null;

// --- Paramètres du shader d'écholocation (consommés par EchoFX) -----------------
// Défauts identiques aux anciennes constantes codées en dur — un catalogue absent
// ou partiel ne change RIEN au rendu.
const ECHO_DEFAULTS = {
  couleur: '120,224,214', alphaScene: 0.30, alphaUI: 0.5,
  stepScene: 18, stepUI: 26,
  densiteBase: 0.06, densiteParNiveau: 0.13, densiteMax: 0.85, uiNiveauMult: 1.2,
  nuageMob: { points: 52, alphaBase: 0.22, alphaPing: 0.32, rayon: 1.6 },
};
export function echoParams() {
  const p = _cat.tags?.['echolocation-3']?.visuel?.shader ?? {};
  return { ...ECHO_DEFAULTS, ...p, nuageMob: { ...ECHO_DEFAULTS.nuageMob, ...(p.nuageMob ?? {}) } };
}

// --- Activité d'un tag sur le joueur --------------------------------------------
// side=null → global. Les prérequis passent par grants() (même organe) ; un nom de
// côté en prérequis = l'organe doit être de ce côté.
function _activeOn(id, def, side = null) {
  const reqs = def.prerequis ?? [];
  return side ? Faculties.grants(id, ...reqs, side) : Faculties.grants(id, ...reqs);
}
// Porte du mode "absent" : les prérequis du tag sont-ils remplis sur ce côté ?
// (vue-couleur absente ne grise que les côtés qui VOIENT — sinon la moitié est noire.)
function _prereqsOk(def, side) {
  const reqs = def.prerequis ?? [];
  if (!reqs.length) return true;
  return side ? Faculties.grants(reqs[0], ...reqs.slice(1), side) : Faculties.grants(reqs[0], ...reqs.slice(1));
}
// Nom de classe par côté : gabarit {c} remplacé, sinon suffixe -l/-r ajouté.
const _sideClass = (name, sfx) => (name.includes('{c}') ? name.replaceAll('{c}', sfx) : `${name}-${sfx}`);

// --- Éléments gérés (créés paresseusement dans .viewport) ------------------------
// Filtres par moitié : au-dessus du vision-overlay (14), sous desat(19)/eyeblind(20)
// pour que les moitiés aveugles restent noires. Shader canvas juste au-dessus.
let _filterEls = null, _canvas = null, _ctx = null;
function _ensureEls() {
  if (_filterEls) return true;
  const vp = document.querySelector('.viewport');
  if (!vp) return false;
  _filterEls = {};
  for (const [side, css] of [['gauche', 'left:0'], ['droite', 'right:0']]) {
    const el = document.createElement('div');
    el.id = `tagfx-filter-${side === 'gauche' ? 'l' : 'r'}`;
    el.style.cssText = `position:absolute;top:0;${css};width:50%;height:100%;pointer-events:none;z-index:15;`;
    vp.appendChild(el);
    _filterEls[side] = el;
  }
  _canvas = document.createElement('canvas');
  _canvas.id = 'tagfx-canvas';
  _canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:16;';
  vp.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');
  return true;
}

// --- apply() — appelé en queue de BodyFX.apply() ---------------------------------
let _applied = new Set();          // classes posées sur .game au dernier passage
let _shaders = { gauche: [], droite: [] };
let _sounds = [];                  // sources sonores actives ce passage
let _running = false;

export function apply() {
  const game = document.querySelector('.game');
  if (!game || !_ensureEls()) return;

  const classes = new Set();
  const filters = { gauche: [], droite: [] };
  const shaders = { gauche: [], droite: [] };
  const sounds = [];
  const lit = (WS.light?.current ?? 1) > 0;

  for (const [id, def] of Object.entries(_cat.tags ?? {})) {
    if (def.entite) continue;                        // tags d'entité (mobs) — pas ici
    const v = def.visuel;
    const echo = def.famille === 'echolocation';     // shader consommé par EchoFX
    const sides = def.cote ? [['gauche', 'l'], ['droite', 'r']] : [[null, null]];
    for (const [side, sfx] of sides) {
      const present = _activeOn(id, def, side);
      // le son suit la PRÉSENCE, jamais le mode absent
      if (present && def.sonore) sounds.push({
        x: def.sonore.x ?? 0.5,
        base: def.sonore.intensite ?? 0.3,
        kind: def.sonore.tremor ? 'tremor' : 'tag',
        name: def.sonore.label ?? def.label ?? id,
      });
      if (!v) continue;
      // visibilité de l'effet : mode absent inverse (côtés SANS le tag, prérequis
      // remplis), quand nuit/jour conditionne à la torche
      let vis = v.mode === 'absent' ? (!present && _prereqsOk(def, side)) : present;
      if (v.quand === 'nuit' && lit) vis = false;
      if (v.quand === 'jour' && !lit) vis = false;
      if (!vis) continue;
      if (v.classe) classes.add(v.classe);
      if (v.classeCote && sfx) classes.add(_sideClass(v.classeCote, sfx));
      if (v.filtreCote) (side ? [side] : ['gauche', 'droite']).forEach((s) => filters[s].push(v.filtreCote));
      if (v.shader && !echo) (side ? [side] : ['gauche', 'droite']).forEach((s) => shaders[s].push(v.shader));
    }
  }

  // Diff de classes : on ne retire QUE ce que TagFX a posé (BodyFX gère les siennes).
  for (const c of _applied) if (!classes.has(c)) game.classList.remove(c);
  for (const c of classes) game.classList.add(c);
  _applied = classes;

  for (const side of ['gauche', 'droite']) {
    const f = filters[side].join(' ');
    const el = _filterEls[side];
    if (el.style.backdropFilter !== f) { el.style.backdropFilter = f; el.style.webkitBackdropFilter = f; }
  }

  _sounds = sounds;
  _shaders = shaders;
  const any = shaders.gauche.length || shaders.droite.length;
  if (any) {
    _frame(performance.now());   // première frame synchrone (retour immédiat)
    if (!_running) { _running = true; requestAnimationFrame(_loop); }
  } else {
    _running = false;
    _ctx?.clearRect(0, 0, _canvas.width, _canvas.height);
  }
}

// Sources permanentes pour la barre de son (tags.json "sonore") — dédupliquées
// (un tag `cote` porté des deux côtés ne sonne qu'une fois).
export function soundSources() {
  const seen = new Set();
  return _sounds.filter((s) => !seen.has(s.name) && seen.add(s.name)).map((s) => ({ ...s }));
}

// --- Boucle shader générique ------------------------------------------------------
// Même champ de points que EchoFX (hash déterministe par cellule → scintillement
// stable), mais densité FIXE par tag (paramètre `densite`), pas pilotée par le son.
function _loop(ts) {
  if (!_running) { _ctx?.clearRect(0, 0, _canvas.width, _canvas.height); return; }
  _frame(ts);
  requestAnimationFrame(_loop);
}

function _frame(ts) {
  const W = _canvas.clientWidth, H = _canvas.clientHeight;
  if (_canvas.width !== W) _canvas.width = W;
  if (_canvas.height !== H) _canvas.height = H;
  _ctx.clearRect(0, 0, W, H);
  for (const side of ['gauche', 'droite'])
    for (const sh of _shaders[side]) _dots(ts, side, sh, W, H);
}

function _dots(ts, side, sh, W, H) {
  if (!W || !H) return;
  const tSec = ts / 1000 * (sh.vitesse ?? 1);
  const step = sh.step ?? sh.stepScene ?? 18;
  const density = Math.min(0.95, sh.densite ?? 0.3);
  const rayon = sh.rayon ?? 1;
  _ctx.fillStyle = `rgba(${sh.couleur ?? '120,224,214'},${sh.alpha ?? sh.alphaScene ?? 0.3})`;
  const x0 = side === 'gauche' ? 0 : W / 2, x1 = side === 'gauche' ? W / 2 : W;
  for (let gy = 0; gy < H; gy += step) {
    for (let gx = x0; gx < x1; gx += step) {
      let h = ((gx * 73856093) ^ (gy * 19349663)) >>> 0;
      h = (h ^ (h >> 13)) * 0x5bd1e995 >>> 0;
      if ((h % 1000) / 1000 > density) continue;
      const wob = Math.sin(tSec * 2 + (h % 63)) * 1.5;
      const r = (0.8 + ((h >> 4) % 10) / 10 + 0.4 * Math.sin(tSec * 3 + h % 7)) * rayon;
      _ctx.beginPath();
      _ctx.arc(gx + (h % step) * 0.6 + wob, gy + ((h >> 8) % step) * 0.6, Math.max(0.4, r), 0, Math.PI * 2);
      _ctx.fill();
    }
  }
}
