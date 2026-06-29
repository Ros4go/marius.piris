// Combat panel. Enemy names + telegraphed intents are now drawn PER-MOB on the
// scene (glowing bubbles above each silhouette — see MobRenderer), and the organs
// are revealed over the focused enemy only while you drag a card (see CombatHand).
// So this center panel stays empty during a fight; it only shows the cleared note.

import { WS } from '../../WorldState.js';
import * as TurnCombat from '../../TurnCombat.js';

const _foe       = document.getElementById('foe-panel');
const _foeName   = document.getElementById('foe-name');
const _foeSeg    = document.getElementById('foe-seg');
const _foeIntent = document.getElementById('foe-intent');

export function render(container, room, options = {}) {
  const active = (room.mobIds ?? []).map((id) => WS.mobs.get(id)).filter((m) => m?.lifecycle === 'active');

  // The top-center foe banner is retired — intents live on the mobs themselves.
  _foe.classList.remove('active');
  if (_foeSeg)    _foeSeg.innerHTML = '';
  if (_foeName)   _foeName.textContent = '';
  if (_foeIntent) _foeIntent.innerHTML = '';

  container.innerHTML = (!active.length && room.cleared)
    ? '<div class="room-body" style="margin-top:auto"><p class="insp-dim">Salle vidée.</p></div>'
    : '';
}
