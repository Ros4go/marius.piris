// Combat: renders enemy to #foe-panel overlay inside the viewport.
// Non-combat or cleared: hides the foe overlay.

import { WS } from '../../WorldState.js';
import { render as renderSeg } from '../SegmentBar.js';
import * as AbilitySystem from '../../systems/AbilitySystem.js';

const _foe      = document.getElementById('foe-panel');
const _foeName  = document.getElementById('foe-name');
const _foeSeg   = document.getElementById('foe-seg');
const _foeIntent = document.getElementById('foe-intent');

export function render(container, room, options = {}) {
  const { targetedMobId, targetedSlot, onAimMob } = options;

  const active = (room.mobIds ?? [])
    .map(id => WS.mobs.get(id))
    .filter(m => m?.lifecycle === 'active');

  if (!active.length) {
    _foe.classList.remove('active');
    const msg = room.cleared ? 'Salle vidée.' : (room.description ?? '');
    container.innerHTML = msg
      ? `<div class="room-body" style="margin-top:auto"><p class="insp-dim">${msg}</p></div>`
      : '';
    return;
  }

  // Show the targeted mob, or fall back to the first active mob
  const mob = active.find(m => m.id === targetedMobId) ?? active[0];

  _foe.classList.add('active');
  const isInvis = mob.invisible && !AbilitySystem.playerCanSeeInvisible(WS.player.body);
  _foeName.textContent = (mob.isElite ? '★ ' : '') + mob.name + (isInvis ? ' [?]' : '');

  _foeSeg.innerHTML = '';
  renderSeg(_foeSeg, mob.body, {
    targetedSlot: targetedMobId === mob.id ? targetedSlot : null,
    onAim: slotKey => onAimMob?.(mob.id, slotKey),
    showLocked: true,
  });

  const intentParts = [];
  if (mob.intent) intentParts.push(`<b>⚠ ${mob.intent}</b>`);
  if (isInvis) intentParts.push(`<span style="color:var(--whisper);opacity:.8">invisible</span>`);
  if (active.length > 1) intentParts.push(`<span style="opacity:.6">${active.length} entités</span>`);
  _foeIntent.innerHTML = intentParts.join(' · ');

  // During active combat the foe panel handles the display — room panel stays empty
  container.innerHTML = '';
}
