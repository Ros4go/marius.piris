import { WS } from '../../WorldState.js';
import { organResolver } from '../../registry.js';
import * as RelicSystem from '../../systems/RelicSystem.js';

export function render(container, room, options = {}) {
  const { onTick, heritage = [], onHeritageChange, onRender } = options;
  const cost = RelicSystem.graftCost();

  // Tab state persisted on room object
  if (!room._graftTab) room._graftTab = 'greffer';

  container.innerHTML = `
    <div class="graft-name">✂ La Couturière</div>
    <div class="graft-bar">
      <button class="gtab${room._graftTab === 'greffer'  ? ' on' : ''}" data-tab="greffer">Greffer</button>
      <button class="gtab${room._graftTab === 'consigne' ? ' on' : ''}" data-tab="consigne">Consigne</button>
      <span class="graft-cost">coût <b>${cost} ticks</b></span>
    </div>
    <div id="graft-content" class="graft-section"></div>`;

  container.querySelectorAll('.gtab').forEach(btn => {
    btn.addEventListener('click', () => {
      room._graftTab = btn.dataset.tab;
      onRender?.();
    });
  });

  const content = container.querySelector('#graft-content');
  if (room._graftTab === 'greffer') _renderGreffer(content, onTick);
  else                               _renderConsigne(content, heritage, onHeritageChange, onRender);
}

function _renderGreffer(el, onTick) {
  const inv = WS.player.inventory;
  if (!inv.length) {
    el.innerHTML = '<p class="insp-dim" style="text-align:center">Besace vide.</p>';
    return;
  }

  inv.forEach((item, idx) => {
    const def     = organResolver(item.organId);
    if (!def) return;
    const quality = def.getQuality(item.hp ?? def.maxHp);
    const compat  = Object.keys(WS.player.body.slots).filter(
      sk => WS.player.body.canFitOrgan(sk, item.organId, organResolver)
    );

    const card = document.createElement('div');
    card.className = 'graft-card';
    const nameEl = document.createElement('div');
    nameEl.className = 'graft-card-name';
    nameEl.textContent = `${def.name} [${quality.name}]`;
    card.appendChild(nameEl);

    if (compat.length) {
      const slots = document.createElement('div');
      slots.className = 'graft-slots';
      for (const slotKey of compat) {
        const btn = document.createElement('button');
        btn.className = 'act';
        btn.style.cssText = 'flex:none;max-width:none;padding:4px 8px';
        btn.innerHTML = `<b>→ ${slotKey}</b>`;
        btn.addEventListener('click', () => onTick?.({ type: 'GRAFT', inventoryIndex: idx, slotKey }));
        slots.appendChild(btn);
      }
      card.appendChild(slots);
    } else {
      const p = document.createElement('p');
      p.className = 'insp-dim';
      p.textContent = 'Aucun slot compatible.';
      card.appendChild(p);
    }
    el.appendChild(card);
  });
}

function _renderConsigne(el, heritage, onHeritageChange, onRender) {
  const hdr = document.createElement('p');
  hdr.className = 'insp-dim';
  hdr.style.cssText = 'text-align:center;margin-bottom:6px';
  hdr.textContent = 'Consigne — organes entre les runs';
  el.appendChild(hdr);

  if (heritage.length) {
    for (let hIdx = 0; hIdx < heritage.length; hIdx++) {
      const item    = heritage[hIdx];
      const def     = organResolver(item.organId);
      if (!def) continue;
      const quality = def.getQuality(item.hp ?? def.maxHp);
      const row     = document.createElement('div');
      row.className = 'graft-card';
      row.innerHTML = `<div class="graft-card-name">${def.name} [${quality.name}]</div>`;
      const btn     = document.createElement('button');
      btn.className = 'act';
      btn.style.cssText = 'margin-top:4px;max-width:none;width:100%';
      btn.innerHTML = '<b>Retirer dans besace</b>';
      btn.addEventListener('click', () => {
        WS.player.inventory.push({ ...item });
        heritage.splice(hIdx, 1);
        onHeritageChange?.();
        onRender?.();
      });
      row.appendChild(btn);
      el.appendChild(row);
    }
  } else {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.style.textAlign = 'center';
    p.textContent = 'Consigne vide.';
    el.appendChild(p);
  }

  if (WS.player.inventory.length > 0) {
    const sep = document.createElement('p');
    sep.className = 'insp-dim';
    sep.style.cssText = 'text-align:center;margin:8px 0 4px;border-top:1px solid var(--edge);padding-top:6px';
    sep.textContent = 'Déposer depuis besace :';
    el.appendChild(sep);

    WS.player.inventory.forEach((item, iIdx) => {
      const def     = organResolver(item.organId);
      if (!def) return;
      const quality = def.getQuality(item.hp ?? def.maxHp);
      const row     = document.createElement('div');
      row.className = 'graft-card';
      row.innerHTML = `<div class="graft-card-name">${def.name} [${quality.name}]</div>`;
      const btn     = document.createElement('button');
      btn.className = 'act';
      btn.style.cssText = 'margin-top:4px;max-width:none;width:100%';
      btn.innerHTML = '<b>Déposer</b>';
      btn.addEventListener('click', () => {
        heritage.push({ ...item });
        WS.player.inventory.splice(iIdx, 1);
        onHeritageChange?.();
        onRender?.();
      });
      row.appendChild(btn);
      el.appendChild(row);
    });
  }
}
