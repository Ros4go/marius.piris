import { WS } from '../../WorldState.js';
import { organResolver } from '../../registry.js';

export function render(container, room, options = {}) {
  const { onTick, onSave } = options;

  container.innerHTML = `
    <div class="room-title">☽ Le Banc</div>
    <div class="room-body" id="rest-body">
      <p class="insp-dim">${room.description ?? 'Le silence, enfin.'}</p>
    </div>`;

  const body = container.querySelector('#rest-body');

  const damaged = Object.entries(WS.player.body.slots)
    .filter(([, s]) => s !== null)
    .map(([key, s]) => {
      const def   = organResolver(s.organId);
      const maxHp = def?.maxHp ?? 1;
      const curHp = s.hp ?? maxHp;
      return { key, def, maxHp, curHp, ratio: curHp / maxHp };
    })
    .filter(o => o.ratio < 1.0)
    .sort((a, b) => a.ratio - b.ratio);

  if (damaged.length) {
    for (const item of damaged.slice(0, 4)) {
      const btn = document.createElement('button');
      btn.className = 'dealbtn';
      btn.innerHTML = `Soigner [${item.key}] <em style="font-variant:normal;margin-left:6px;font-size:.6em;color:var(--bone)">${item.curHp}/${item.maxHp} · 1 tick</em>`;
      btn.addEventListener('click', () => {
        WS.player.body.setSlotHp(item.key, Math.min(item.maxHp, item.curHp + 1));
        onTick?.({ type: 'WAIT' });
      });
      body.appendChild(btn);
    }
  } else {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Tous vos organes sont intacts.';
    body.appendChild(p);
  }

  const sv = document.createElement('button');
  sv.className = 'dealbtn';
  sv.textContent = '⇩ Checkpoint';
  sv.addEventListener('click', () => onSave?.());
  body.appendChild(sv);
}
