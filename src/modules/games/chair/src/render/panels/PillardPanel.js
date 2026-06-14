import { WS } from '../../WorldState.js';
import { organResolver, allOrgans } from '../../registry.js';
import { addLog } from '../HUDRenderer.js';

export function render(container, room, options = {}) {
  const { onRender } = options;

  const hum   = WS.player.body?.humanityWith(organResolver) ?? 100;
  const state = hum >= 60 ? 'human' : hum >= 30 ? 'trade' : hum >= 15 ? 'hostile' : 'dying';

  const LABELS = {
    human:   'Blessé',
    trade:   'Marchand ambulant',
    hostile: 'Hostile',
    dying:   'Mourant',
  };
  const NOTES = {
    human:   'Il vous regarde avec espoir. La chair humaine le rassure.',
    trade:   'Il vous jauge, prudent. Prêt à faire affaire.',
    hostile: 'Vos yeux le terrifient. Il brandit quelque chose.',
    dying:   'Il expire lentement. Ses organes vous appartiennent.',
  };

  container.innerHTML = `
    <div class="room-title">☠ Pillard — ${LABELS[state]}</div>
    <div class="room-body" id="pillard-body">
      <p class="insp-dim">${NOTES[state]}</p>
    </div>`;

  const body = container.querySelector('#pillard-body');

  if (state === 'human')   _renderHuman(body, room, onRender);
  if (state === 'trade')   _renderTrade(body, room, onRender);
  if (state === 'hostile') _renderHostile(body, room, onRender);
  if (state === 'dying')   _renderDying(body, room, onRender);
}

function _renderHuman(body, room, onRender) {
  if (room._pillardGone) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Il est parti. Ses pas s\'éloignent dans la chair.';
    body.appendChild(p);
    return;
  }
  const inv = WS.player.inventory;
  if (!inv.length) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Votre besace est vide. Il attend en silence.';
    body.appendChild(p);
    return;
  }
  inv.forEach((item, idx) => {
    const def = organResolver(item.organId);
    if (!def) return;
    const btn = document.createElement('button');
    btn.className = 'dealbtn';
    btn.innerHTML = `Donner ${def.name} <em style="font-variant:normal;font-size:.6em;color:var(--bone)">+20💀</em>`;
    btn.addEventListener('click', () => {
      WS.player.inventory.splice(idx, 1);
      WS.player.gold += 20;
      addLog('Le pillard vous remercie. +20💀.', 'sys');
      room._pillardGone = true;
      onRender?.();
    });
    body.appendChild(btn);
  });
}

function _renderTrade(body, room, onRender) {
  if (!room._pillardStock) {
    const pool = allOrgans().filter(o => o.arcana <= 8 && o.tier !== 'epic');
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      room._pillardStock = { organId: pick.id, price: Math.round(pick.price * 1.1), sold: false };
    }
  }
  if (room._pillardStock && !room._pillardStock.sold) {
    const { organId, price } = room._pillardStock;
    const def = organResolver(organId);
    if (def) {
      const btn = document.createElement('button');
      btn.className = 'dealbtn';
      btn.disabled = WS.player.gold < price;
      btn.innerHTML = `${def.name} <em style="font-variant:normal;font-size:.6em;color:var(--bone)">${price}💀</em>`;
      btn.addEventListener('click', () => {
        if (WS.player.gold < price) return;
        WS.player.gold -= price;
        room._pillardStock.sold = true;
        WS.player.inventory.push({ id: `inv_pillard_${Date.now()}`, organId, hp: def.maxHp });
        addLog(`Acheté à un pillard : ${def.name} pour ${price}💀.`, 'sys');
        onRender?.();
      });
      body.appendChild(btn);
    }
  } else {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Il n\'a plus rien à vendre.';
    body.appendChild(p);
  }
}

function _renderHostile(body, room, onRender) {
  if (room._pillardFled) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Il a fui dans les ténèbres.';
    body.appendChild(p);
    return;
  }

  const btnFlee = document.createElement('button');
  btnFlee.className = 'dealbtn';
  btnFlee.innerHTML = 'Fuir <em style="font-variant:normal;font-size:.6em;color:var(--bone)">il s\'enfuit aussi</em>';
  btnFlee.addEventListener('click', () => {
    room._pillardFled = true;
    addLog('Vous reculez. Le pillard prend la fuite.', 'sys');
    onRender?.();
  });
  body.appendChild(btnFlee);

  const btnStare = document.createElement('button');
  btnStare.className = 'dealbtn danger';
  btnStare.innerHTML = 'Le fixer <em style="font-variant:normal;font-size:.6em;color:var(--bone)">-1HP outer</em>';
  btnStare.addEventListener('click', () => {
    const playerBody = WS.player.body;
    const liveSlots  = Object.keys(playerBody.slots).filter(k => {
      const s = playerBody.slots[k]; return s && (s.hp ?? 1) > 0;
    });
    if (liveSlots.length) {
      const slotKey = liveSlots[Math.floor(Math.random() * liveSlots.length)];
      const slot = playerBody.slots[slotKey];
      slot.hp = Math.max(0, (slot.hp ?? 1) - 1);
      addLog(`Le pillard vous griffe — ${slotKey} -1HP. Il fuit.`, 'damage');
    } else {
      addLog('Il vous regarde, puis fuit.', 'sys');
    }
    room._pillardFled = true;
    onRender?.();
  });
  body.appendChild(btnStare);
}

function _renderDying(body, room, onRender) {
  if (room._pillardLooted) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Le corps ne contient plus rien d\'utile.';
    body.appendChild(p);
    return;
  }
  if (!room._pillardOrgan) {
    const pool = allOrgans().filter(o => o.tier === 'common');
    if (pool.length) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      room._pillardOrgan = { organId: pick.id, hp: Math.ceil(pick.maxHp * 0.5) };
    }
  }
  if (room._pillardOrgan) {
    const { organId, hp } = room._pillardOrgan;
    const def = organResolver(organId);
    if (def) {
      const quality = def.getQuality(hp);
      const btn = document.createElement('button');
      btn.className = 'dealbtn';
      btn.innerHTML = `${def.name} <em style="font-variant:normal;font-size:.6em;color:var(--bone)">[${quality.name}]</em>`;
      btn.addEventListener('click', () => {
        WS.player.inventory.push({ id: `inv_pillard_${Date.now()}`, organId, hp });
        room._pillardLooted = true;
        addLog(`Récupéré sur le mourant : ${def.name} [${quality.name}].`, 'harvest');
        onRender?.();
      });
      body.appendChild(btn);
    }
  }
}
