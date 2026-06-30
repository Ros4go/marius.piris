import { WS } from '../../WorldState.js';
import { allOrgans, organResolver, relic as getRelic } from '../../registry.js';
import { addLog } from '../HUDRenderer.js';
import { inventoryCapacity } from '../../WorldState.js';

export function render(container, room, options = {}) {
  const { onRender } = options;

  if (!room.stock) room.stock = _generateStock();

  const gold = WS.player.gold ?? 0;

  container.innerHTML = `
    <div class="trade-name">⚖ Le Marchand d'en-bas</div>
    <div class="trade-cols">
      <div class="trade-col" id="trade-buy-col">
        <div class="trade-h">il vend</div>
      </div>
      <div class="trade-col" id="trade-sell-col">
        <div class="trade-h">tu vends <em>· besace</em></div>
        <div class="sell-scroll" id="trade-sell-scroll"></div>
      </div>
    </div>
    <div class="trade-foot">viande · <b>${gold}</b></div>`;

  const buyCol   = container.querySelector('#trade-buy-col');
  const sellScroll = container.querySelector('#trade-sell-scroll');

  // Buy stock
  const forSale = room.stock.filter(i => !i.sold);
  if (forSale.length) {
    for (const item of forSale) {
      const def          = organResolver(item.organId);
      if (!def) continue;
      const price        = item.price;
      const canAfford    = gold >= price;
      const full         = WS.player.inventory.length >= inventoryCapacity();
      const btn          = document.createElement('button');
      btn.className      = 'ware' + (!canAfford || full ? ' off' : '');
      btn.disabled       = !canAfford || full;
      btn.innerHTML      = `<span class="ware-ic ${_icClass(def.type)}"></span>
                            <span class="ware-n">${def.name} <em>· ${def.tier}</em></span>
                            <span class="ware-p">${price}</span>`;
      btn.addEventListener('click', () => {
        if (WS.player.gold < price || WS.player.inventory.length >= inventoryCapacity()) return;
        WS.player.gold -= price;
        item.sold = true;
        WS.player.inventory.push({ id: `inv_trade_${Date.now()}`, organId: item.organId, hp: def.maxHp });
        addLog(`Acheté : ${def.name} pour ${price}💀.`, 'sys');
        onRender?.();
      });
      buyCol.appendChild(btn);
    }
  } else {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.style.margin = '4px 0';
    p.textContent = 'Stock épuisé.';
    buyCol.appendChild(p);
  }

  // Sell from besace
  if (WS.player.inventory.length) {
    WS.player.inventory.forEach((item, idx) => {
      // Relics are sellable too — flat half of their listed price.
      if (item.relicId) {
        const rdef = getRelic(item.relicId);
        if (!rdef) return;
        const price = Math.round((rdef.price ?? 60) * 0.5);
        const btn   = document.createElement('button');
        btn.className = 'ware sell';
        btn.innerHTML = `<span class="ware-ic relic"></span>
                         <span class="ware-n">✦ ${rdef.name}</span>
                         <span class="ware-p sell">+${price}</span>`;
        btn.addEventListener('click', () => {
          WS.player.gold += price;
          WS.player.inventory.splice(idx, 1);
          addLog(`Vendu : ${rdef.name} +${price}💀.`, 'sys');
          onRender?.();
        });
        sellScroll.appendChild(btn);
        return;
      }

      const def     = organResolver(item.organId);
      if (!def) return;
      const quality = def.getQuality(item.hp ?? def.maxHp);
      const price   = def.getSellPrice ? def.getSellPrice(item.hp ?? def.maxHp) : Math.round((def.price ?? 20) * 0.5);
      const btn     = document.createElement('button');
      btn.className = 'ware sell';
      btn.innerHTML = `<span class="ware-ic ${_icClass(def.type)}"></span>
                       <span class="ware-n">${def.name} <em>${quality.name}</em></span>
                       <span class="ware-p sell">+${price}</span>`;
      btn.addEventListener('click', () => {
        WS.player.gold += price;
        WS.player.inventory.splice(idx, 1);
        addLog(`Vendu : ${def.name} +${price}💀.`, 'sys');
        onRender?.();
      });
      sellScroll.appendChild(btn);
    });
  } else {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Besace vide.';
    sellScroll.appendChild(p);
  }
}

function _icClass(type) {
  if (type === 'eye')   return 'eye';
  if (type === 'heart') return 'heart';
  return '';
}

function _generateStock() {
  const pool   = allOrgans().filter(o => o.tier !== 'legendary');
  if (!pool.length) return [];
  const stock  = [];
  const picked = new Set();
  while (stock.length < 3 && picked.size < pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    if (!picked.has(idx)) {
      picked.add(idx);
      const o = pool[idx];
      stock.push({ organId: o.id, price: Math.round((o.price ?? 30) * 1.2), sold: false });
    }
  }
  return stock;
}
