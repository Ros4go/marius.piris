// Routes to the correct panel based on room.ui. Read-only.

import { currentRoom } from '../WorldState.js';
import { roomDef } from '../registry.js';
import STRUCTURES_JSON from '../../content/structures.json';
import { structFigure, animerSprites } from './SpriteFX.js';
import { render as renderCombat }  from './panels/CombatPanel.js';
import { render as renderRest }    from './panels/RestPanel.js';
import { render as renderTrade }   from './panels/TradePanel.js';
import { render as renderGraft }   from './panels/GraftPanel.js';
import { render as renderAltar }   from './panels/AltarPanel.js';
import { render as renderPuzzle }  from './panels/PuzzlePanel.js';
import { render as renderPath }    from './panels/PathChoicePanel.js';
import { render as renderPillard } from './panels/PillardPanel.js';

const _el  = document.getElementById('room-panel');
const _npc = document.getElementById('npc-figure');

const PANELS = {
  combat:      renderCombat,
  rest:        renderRest,
  trade:       renderTrade,
  graft:       renderGraft,
  altar:       renderAltar,
  puzzle:      renderPuzzle,
  path_choice: renderPath,
  pillard:     renderPillard,
};

// Clickable scene structures: an NPC / altar / lurking pillard / a shard on the
// ground. Each spawns at a random side, is click-to-open, and has a sound cue
// (defined in SoundBar). `floor:true` sits it low on the ground.
// Les structures sont de la DATA (content/structures.json) : label, floor,
// panel (quel panneau s'ouvre au clic), son (barre sonore), html (silhouette).
// setStructures() permet à l'atelier d'injecter des brouillons.
let STRUCT_DEFS = STRUCTURES_JSON;
export function setStructures(data) { if (data) STRUCT_DEFS = data; }
export function structureDefs() { return STRUCT_DEFS; }

// Quelle structure apparaît dans cette salle :
// Structures de la salle — tirage EXPLICITE depuis rooms.json "structures".
// Pas de champ → AUCUNE structure (plus de fallback sur l'ui). Chaque slot :
//   { kind, chance }                → tirage INDÉPENDANT (0-1)
//   { choix: [{kind, chance}, …] }  → tirage EXCLUSIF : au plus UN du groupe
//                                     (somme ≤ 1, le reste = pas de structure)
// Les deux formes se combinent librement dans la même liste.
// Tirage déterministe par salle (hash id d'instance + index du slot), mémorisé
// sur l'instance. room._structSalt (outillage) force un nouveau tirage.
function _hash01(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967296;
}
function _rollStructures(room, list) {
  const salt = room._structSalt != null ? ':' + room._structSalt : '';
  const out = [];
  (Array.isArray(list) ? list : []).forEach((slot, i) => {
    let r = _hash01(`struct_${room.id}:${i}${salt}`);
    if (Array.isArray(slot.choix)) {
      for (const c of slot.choix) {
        if (r < (c.chance ?? 0)) { out.push(c.kind); break; }
        r -= (c.chance ?? 0);
      }
    } else if (r < (slot.chance ?? 0)) {
      out.push(slot.kind);
    }
  });
  return out;
}
// Les structures tirées de la salle (liste de kinds, possiblement vide).
function structKinds(room) {
  if (room._structRolled === undefined) {
    room._structRolled = _rollStructures(room, roomDef(room.defId)?.structures);
  }
  return room._structRolled;
}

let _openKind = null, _npcRoomId = null, _onRender = null;
const _extraNpcs = new Map();   // kind → element (figures au-delà de la première)

// Which side the structure PREFERS (deterministic per room + kind).
// room._structSalt (outillage : « relancer le tirage ») refait AUSSI les côtés.
function npcSide(room, kind) {
  let h = 2166136261 >>> 0;
  const s = 'npc_' + room.id + '_' + kind + (room._structSalt != null ? ':' + room._structSalt : '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ['left', 'center', 'right'][(h >>> 0) % 3];
}

// La salle a 3 EMPLACEMENTS (left / center / right) : une structure par
// emplacement, jamais deux au même endroit. Chaque structure vise son côté
// préféré (hash), sinon le premier emplacement libre.
// room._structSidePrefs = { kind: side } (outillage) force un emplacement.
const SLOT_ORDER = ['left', 'center', 'right'];
function _assignSides(room, kinds) {
  const taken = new Set();
  return kinds.map((k) => {
    const pref = room._structSidePrefs?.[k] ?? npcSide(room, k);
    const side = !taken.has(pref) ? pref : SLOT_ORDER.find((s) => !taken.has(s));
    if (side) taken.add(side);
    return side ?? 'center';
  });
}

// options forwarded to the active panel (targeting state, callbacks, …)
export function render(options = {}) {
  _onRender = options.onRender ?? _onRender;
  // Always reset foe overlay; CombatPanel reactivates it when needed
  document.getElementById('foe-panel')?.classList.remove('active');

  const room = currentRoom();
  if (!room) {
    _el.classList.remove('active');
    _el.innerHTML = '';
    _setNpcs(null, []);
    _npcRoomId = null;
    return;
  }
  if (room.id !== _npcRoomId) { _npcRoomId = room.id; _openKind = null; }   // fresh room → panel closed

  // 3 emplacements max, une seule structure par type
  const kinds = [...new Set(structKinds(room).filter((k) => STRUCT_DEFS[k]))].slice(0, 3);
  const sides = _assignSides(room, kinds);
  room._structKinds = kinds;                               // read by the sound bar
  room._structSides = sides;
  room._structKind  = kinds[0] ?? null;                    // compat lecteurs au singulier
  room._structSide  = sides[0] ?? null;
  _setNpcs(room, kinds, sides);

  if (_openKind && !kinds.includes(_openKind)) _openKind = null;
  const openStruct = _openKind ? STRUCT_DEFS[_openKind] : null;

  // Salle à structures : elles se dressent dans la scène, il faut CLIQUER l'une
  // d'elles pour ouvrir SON panneau (struct.panel). (Si elle apparaît du côté où
  // tu as perdu l'œil, tu peux la rater — sauf si tes oreilles te la signalent.)
  if (kinds.length && !openStruct) {
    _el.classList.remove('active', 'desc-only');
    _el.innerHTML = '';
    return;
  }

  const fn = PANELS[openStruct ? openStruct.panel : room.ui];
  _el.classList.add('active');
  _el.classList.toggle('desc-only', !fn);
  if (fn) {
    fn(_el, room, options);
    if (openStruct) _prependClose();
  } else {
    _el.innerHTML = `<p class="insp-dim" style="text-shadow:0 1px 4px #000">${room.description ?? ''}</p>`;
  }
}

function _prependClose() {
  const btn = document.createElement('button');
  btn.className = 'npc-close';
  btn.textContent = '✕';
  btn.title = 'Fermer';
  btn.addEventListener('click', () => { _openKind = null; _onRender?.(); });
  _el.prepend(btn);
}

// Une figure par structure : #npc-figure porte la première, des clones (mêmes
// classes CSS, donc même rendu) portent les suivantes. Toutes cliquables,
// chacune sur SON emplacement (jamais deux au même endroit).
function _setNpcs(room, kinds, sides = []) {
  if (!_npc) return;
  for (const [k, el2] of _extraNpcs) {
    if (!room || !kinds.slice(1).includes(k)) { el2.remove(); _extraNpcs.delete(k); }
  }
  const first = kinds?.[0];
  if (room && first) {
    _applyFigure(_npc, first, sides[0]);
  } else {
    _npc.className = 'npc-figure';
    _npc.innerHTML = '';
    _npc.onclick = null;
    _npc.style.cursor = '';
    _npc.title = '';
  }
  (kinds ?? []).slice(1).forEach((k, i) => {
    let el2 = _extraNpcs.get(k);
    if (!el2) { el2 = document.createElement('div'); _npc.parentElement?.appendChild(el2); _extraNpcs.set(k, el2); }
    _applyFigure(el2, k, sides[i + 1]);
  });
}
function _applyFigure(el2, kind, side) {
  const struct = STRUCT_DEFS[kind];
  el2.className = `npc-figure ${kind} pos-${side ?? 'center'}${struct?.floor ? ' on-floor' : ''}`;
  // figure = sprite paramétrique (éditeur de l'atelier) si défini, sinon le
  // html/CSS historique de structures.json — même compilateur que la besace
  const fig = structFigure(struct);
  el2.style.cssText = fig.style;
  el2.innerHTML = fig.html;
  animerSprites(el2);
  el2.style.cursor = 'pointer';
  el2.title = 'Cliquer pour interagir';
  el2.onclick = () => { _openKind = kind; _onRender?.(); };
}

// Expose container for external overrides (harvest/graft inline UIs in main.js)
export function container() { return _el; }
