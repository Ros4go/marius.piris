import { WS } from '../../WorldState.js';
import { organResolver, relic as getRelicDef } from '../../registry.js';
import { addLog } from '../HUDRenderer.js';

const BLESSINGS = [
  'Votre prochaine récolte sera parfaite.',
  'La douleur devient clarté.',
  'Un organe perdu revient en rêve.',
  'Le dieu mort a entendu.',
  'Votre chair vous remercie.',
];

const ALL_RELICS = [
  'relic_sang_cristal',
  'relic_suture_noire',
  'relic_cartilage_fossile',
  'relic_membrane_epaisse',
  'relic_nerf_expose',
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
    btn.innerHTML = `Sacrifier [${slotKey}] <em style="font-variant:normal;margin-left:6px;font-size:.6em;color:var(--bone)">${def.name} · ${quality.name}</em>`;
    btn.addEventListener('click', () => {
      room._sacrificeDone = true;
      room.cleared = true;
      onTick?.({ type: 'REMOVE_ORGAN', slotKey });
      const msg = BLESSINGS[Math.floor(Math.random() * BLESSINGS.length)];
      addLog(`✝ Sacrifice accepté — "${msg}"`, 'sys');
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

  const owned = WS.player.relics ?? [];
  const pool  = ALL_RELICS.filter(id => !owned.includes(id));
  if (!pool.length) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Vous possédez déjà toutes les reliques.';
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

  const btn = document.createElement('button');
  btn.className = 'dealbtn';
  btn.textContent = 'Prendre la relique';
  btn.addEventListener('click', () => {
    WS.player.relics = [...(WS.player.relics ?? []), room._offeredRelicId];
    room._relicTaken = true;
    addLog(`✦ Relique acquise : ${relicDef.name}.`, 'sys');
    onRender?.();
  });
  body.appendChild(btn);
}
