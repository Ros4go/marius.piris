// Routes to the correct panel based on room.ui. Read-only.

import { currentRoom } from '../WorldState.js';
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
const STRUCTURES = {
  trade:   { floor: false, html: `<div class="m-hood"></div><div class="m-body"></div>
              <div class="m-eye l"></div><div class="m-eye r"></div><div class="m-wares"></div>` },
  graft:   { floor: false, html: `<div class="ss-lamp"></div><div class="ss-hood"></div><div class="ss-body"></div>
              <div class="ss-arm la"></div><div class="ss-arm ra"></div>
              <div class="ss-eye"></div><div class="ss-table"></div><div class="ss-thread"></div>` },
  altar:   { floor: false, html: `<div class="al-glow"></div><div class="al-top"></div><div class="al-base"></div>` },
  pillard: { floor: false, html: `<div class="pl-body"></div><div class="pl-hood"></div><div class="pl-eye"></div>` },
  souffle: { floor: true,  html: `<div class="sf-glow"></div><div class="sf-shard"></div>` },   // discreet ground pickup
};

// The kind of structure a room has (salle_derniers_mots is the "dernier souffle").
function structKind(room) { return room.id === 'salle_derniers_mots' ? 'souffle' : room.ui; }

let _npcOpen = false, _npcRoomId = null, _onRender = null;

// Which side of the room the NPC stands on (deterministic per room).
function npcSide(room) {
  let h = 2166136261 >>> 0;
  const s = 'npc_' + room.id;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ['left', 'center', 'right'][(h >>> 0) % 3];
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
    _setNpc(null);
    _npcRoomId = null;
    return;
  }
  if (room.id !== _npcRoomId) { _npcRoomId = room.id; _npcOpen = false; }   // fresh room → panel closed

  const fn = PANELS[room.ui];
  const kind = structKind(room);
  const struct = STRUCTURES[kind];
  room._structKind = struct ? kind : null;               // read by the sound bar
  room._structSide = struct ? npcSide(room) : null;
  _setNpc(struct, kind, room._structSide);

  // Structure rooms: it stands in the scene; you must CLICK it to open its panel.
  // (If it spawns on a side where you've lost the eye, it's in the dark — you may
  //  miss it, unless your ears tell you it's there.)
  if (struct && !_npcOpen) {
    _el.classList.remove('active', 'desc-only');
    _el.innerHTML = '';
    return;
  }

  _el.classList.add('active');
  _el.classList.toggle('desc-only', !fn);
  if (fn) {
    fn(_el, room, options);
    if (struct) _prependClose();
  } else {
    _el.innerHTML = `<p class="insp-dim" style="text-shadow:0 1px 4px #000">${room.description ?? ''}</p>`;
  }
}

function _prependClose() {
  const btn = document.createElement('button');
  btn.className = 'npc-close';
  btn.textContent = '✕';
  btn.title = 'Fermer';
  btn.addEventListener('click', () => { _npcOpen = false; _onRender?.(); });
  _el.prepend(btn);
}

function _setNpc(struct, kind, side) {
  if (!_npc) return;
  if (struct) {
    _npc.className = `npc-figure ${kind} pos-${side ?? 'center'}${struct.floor ? ' on-floor' : ''}`;
    _npc.innerHTML = struct.html;
    _npc.style.cursor = 'pointer';
    _npc.title = 'Cliquer pour interagir';
    _npc.onclick = () => { _npcOpen = true; _onRender?.(); };
  } else {
    _npc.className = 'npc-figure';
    _npc.innerHTML = '';
    _npc.onclick = null;
    _npc.style.cursor = '';
    _npc.title = '';
  }
}

// Expose container for external overrides (harvest/graft inline UIs in main.js)
export function container() { return _el; }
