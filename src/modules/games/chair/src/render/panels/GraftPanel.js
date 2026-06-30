import { WS } from '../../WorldState.js';
import { organResolver, relic as getRelic } from '../../registry.js';

// The consigne keeps a single item safe between runs.
const CONSIGNE_CAP = 1;

// Display label for a besace/consigne item — organ (with quality) or relic.
function _itemLabel(item) {
  if (item.relicId) {
    const r = getRelic(item.relicId);
    return r ? `✦ ${r.name}` : '✦ relique';
  }
  const def = organResolver(item.organId);
  if (!def) return null;
  const quality = def.getQuality(item.hp ?? def.maxHp);
  return `${def.name} [${quality.name}]`;
}

export function render(container, room, options = {}) {
  const { heritage = [], onHeritageChange, onRender } = options;

  // The Couturière keeps organs safe between runs (the Consigne). Grafting is
  // always available from the action bar, so it has no redundant "Greffer" tab.
  container.innerHTML = `
    <div class="graft-name">✂ La Couturière</div>
    <div id="graft-content" class="graft-section"></div>`;

  const content = container.querySelector('#graft-content');
  _renderConsigne(content, heritage, onHeritageChange, onRender);
}

function _renderConsigne(el, heritage, onHeritageChange, onRender) {
  const hdr = document.createElement('p');
  hdr.className = 'insp-dim';
  hdr.style.cssText = 'text-align:center;margin-bottom:6px';
  hdr.textContent = 'Consigne — organes & reliques gardés entre les runs';
  el.appendChild(hdr);

  if (heritage.length) {
    for (let hIdx = 0; hIdx < heritage.length; hIdx++) {
      const item  = heritage[hIdx];
      const label = _itemLabel(item);
      if (!label) continue;
      const row   = document.createElement('div');
      row.className = 'graft-card';
      row.innerHTML = `<div class="graft-card-name">${label}</div>`;
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

  // The consigne holds a single item — once it's occupied, no more deposits.
  if (heritage.length >= CONSIGNE_CAP) {
    const note = document.createElement('p');
    note.className = 'insp-dim';
    note.style.cssText = 'text-align:center;margin:8px 0 4px;border-top:1px solid var(--edge);padding-top:6px';
    note.textContent = 'Consigne pleine — un seul objet à la fois.';
    el.appendChild(note);
    return;
  }

  if (WS.player.inventory.length > 0) {
    const sep = document.createElement('p');
    sep.className = 'insp-dim';
    sep.style.cssText = 'text-align:center;margin:8px 0 4px;border-top:1px solid var(--edge);padding-top:6px';
    sep.textContent = 'Déposer depuis besace :';
    el.appendChild(sep);

    WS.player.inventory.forEach((item, iIdx) => {
      const label = _itemLabel(item);
      if (!label) return;
      const row   = document.createElement('div');
      row.className = 'graft-card';
      row.innerHTML = `<div class="graft-card-name">${label}</div>`;
      const btn     = document.createElement('button');
      btn.className = 'act';
      btn.style.cssText = 'margin-top:4px;max-width:none;width:100%';
      btn.innerHTML = '<b>Déposer</b>';
      btn.addEventListener('click', () => {
        if (heritage.length >= CONSIGNE_CAP) return;
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
