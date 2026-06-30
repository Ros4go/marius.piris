import { WS, inventoryCapacity } from '../../WorldState.js';
import { organResolver, relic as getRelicDef, allRelics } from '../../registry.js';
import { addLog } from '../HUDRenderer.js';
import { SLOT_FULL } from '../../labels.js';

const BLESSINGS = [
  'Votre prochaine récolte sera parfaite.',
  'La douleur devient clarté.',
  'Un organe perdu revient en rêve.',
  'Le dieu mort a entendu.',
  'Votre chair vous remercie.',
];

export function render(container, room, options = {}) {
  const { onTick, onRender } = options;

  container.innerHTML = `
    <div class="room-title">☩ L'Autel</div>
    <div class="room-body" id="altar-body">
      <p class="insp-dim">Sacrifiez un organe. Le dieu mort répond.</p>
    </div>`;

  const body = container.querySelector('#altar-body');

  if (room._sacrificeDone) {
    _offerRelic(body, room, onRender);
    return;
  }

  const slots = Object.entries(WS.player.body.slots)
    .filter(([key, s]) => s !== null && key !== 'heart');

  if (!slots.length) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Vous n\'avez rien à offrir (le cœur ne se sacrifie pas).';
    body.appendChild(p);
    return;
  }

  for (const [slotKey, slot] of slots) {
    const def = organResolver(slot.organId);
    if (!def) continue;
    const quality = def.getQuality(slot.hp ?? def.maxHp);

    const btn = document.createElement('button');
    btn.className = 'dealbtn danger';
    btn.innerHTML = `Sacrifier <b>${SLOT_FULL[slotKey] ?? slotKey}</b> <em style="font-variant:normal;margin-left:6px;font-size:.6em;color:var(--bone)">${def.name} · ${quality.name}</em>`;
    btn.addEventListener('click', () => {
      room._sacrificeDone = true;
      room.cleared = true;
      onTick?.({ type: 'SACRIFICE_ORGAN', slotKey });
      const msg = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
      addLog(`✝ ${def.name} consumé sur l'autel — "${msg}"`, 'sys');
    });
    body.appendChild(btn);
  }
}

function _offerRelic(body, room, onRender) {
  if (room._relicTaken) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'La relique est en votre possession.';
    body.appendChild(p);
    return;
  }

  const owned = (WS.player.inventory ?? []).filter(i => i?.relicId).map(i => i.relicId);
  const pool  = allRelics().map(d => d.id).filter(id => !owned.includes(id));
  if (!pool.length) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Vous portez déjà toutes les reliques connues.';
    body.appendChild(p);
    return;
  }

  if (!room._offeredRelicId) {
    room._offeredRelicId = pool[Math.floor(Math.random() * pool.length)];
  }

  const relicDef = getRelicDef(room._offeredRelicId);
  if (!relicDef) return;

  const title = document.createElement('p');
  title.className = 'insp-dim';
  title.style.cssText = 'color:var(--whisper);font-variant:small-caps;margin-top:4px';
  title.textContent = `✦ ${relicDef.name}`;
  body.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'insp-dim';
  desc.textContent = relicDef.description ?? '';
  body.appendChild(desc);

  const full = (WS.player.inventory?.length ?? 0) >= inventoryCapacity();

  const btn = document.createElement('button');
  btn.className = 'dealbtn';
  btn.disabled = full;
  btn.textContent = full ? 'Besace pleine' : 'Prendre la relique';
  btn.addEventListener('click', () => {
    if ((WS.player.inventory?.length ?? 0) >= inventoryCapacity()) return;
    WS.player.inventory.push({ id: `relic_${room._offeredRelicId}_${WS.tick}`, relicId: room._offeredRelicId });
    room._relicTaken = true;
    addLog(`✦ Relique acquise : ${relicDef.name} (rangée dans la besace).`, 'sys');
    onRender?.();
  });
  body.appendChild(btn);

  if (full) {
    const note = document.createElement('p');
    note.className = 'insp-dim';
    note.style.cssText = 'margin-top:4px;font-size:.85em';
    note.textContent = 'Faites de la place dans votre besace pour l\'emporter.';
    body.appendChild(note);
  }
}
