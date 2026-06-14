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

const NPC_HTML = {
  trade: `<div class="m-hood"></div><div class="m-body"></div>
          <div class="m-eye l"></div><div class="m-eye r"></div>
          <div class="m-wares"></div>`,
  graft: `<div class="ss-lamp"></div><div class="ss-hood"></div><div class="ss-body"></div>
          <div class="ss-arm la"></div><div class="ss-arm ra"></div>
          <div class="ss-eye"></div><div class="ss-table"></div><div class="ss-thread"></div>`,
};

// options forwarded to the active panel (targeting state, callbacks, …)
export function render(options = {}) {
  // Always reset foe overlay; CombatPanel reactivates it when needed
  document.getElementById('foe-panel')?.classList.remove('active');

  const room = currentRoom();
  if (!room) {
    _el.classList.remove('active');
    _el.innerHTML = '';
    _setNpc(null);
    return;
  }

  _el.classList.add('active');
  _setNpc(room.ui);

  const fn = PANELS[room.ui];
  if (fn) {
    fn(_el, room, options);
  } else {
    _el.innerHTML = `<p class="insp-dim" style="text-shadow:0 1px 4px #000">${room.description ?? ''}</p>`;
  }
}

function _setNpc(ui) {
  if (!_npc) return;
  const html = NPC_HTML[ui] ?? null;
  if (html) {
    _npc.className = `npc-figure ${ui}`;
    _npc.innerHTML = html;
  } else {
    _npc.className = 'npc-figure';
    _npc.innerHTML = '';
  }
}

// Expose container for external overrides (harvest/graft inline UIs in main.js)
export function container() { return _el; }
