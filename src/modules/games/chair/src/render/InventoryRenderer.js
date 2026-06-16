import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import * as InspectorPanel from './InspectorPanel.js';

const _grid = document.getElementById('inventory-grid');

const ROMAN = ['', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

function _orgShapeClass(type) {
  if (type === 'eye') return 'orgshape eye';
  return 'orgshape';
}

// Returns a Set of locked cell indices.
// Cells 0-1: toujours libres.
// Cells 2-3: bras gauche requis.
// Cells 4-5: bras droit requis.
// Cells 6-11: toujours verrouillés (réservé).
function _lockedSet() {
  const locked = new Set();
  for (let i = 6; i < 12; i++) locked.add(i);
  const check = (key, from, to) => {
    const slot  = WS.player.body?.slots[key];
    const alive = slot && (slot.hp === null || slot.hp > 0);
    if (!alive) for (let i = from; i < to; i++) locked.add(i);
  };
  check('arm_l', 2, 4);
  check('arm_r', 4, 6);
  return locked;
}

export function render() {
  if (!_grid) return;
  const cells  = _grid.querySelectorAll('.cell');
  const inv    = WS.player.inventory;
  const locked = _lockedSet();

  // Build ordered list of free cell indices so items fill sequentially
  const free = [];
  cells.forEach((_, i) => { if (!locked.has(i)) free.push(i); });

  cells.forEach((cell, i) => {
    if (locked.has(i)) {
      cell.className = 'cell lock';
      cell.innerHTML = '';
      cell.onclick   = null;
      if (i >= 6) {
        cell.title = 'slot verrouillé';
      } else {
        cell.title = i < 4 ? 'perdu avec le bras gauche' : 'perdu avec le bras droit';
      }
      return;
    }

    const invIdx = free.indexOf(i);
    const item   = inv[invIdx];
    if (!item) {
      cell.className = 'cell';
      cell.innerHTML = '';
      cell.title     = '';
      cell.onclick   = null;
      return;
    }
    const def     = organResolver(item.organId);
    const quality = def ? def.getQuality(item.hp ?? def.maxHp) : { name: 'pourri' };

    let cls = 'cell full';
    if (quality.name === 'pourri' || quality.name === 'destroyed') cls += ' rot';
    else if (quality.name === 'parfait' || quality.name === 'intact') cls += ' glow';

    const shapeClass = def ? _orgShapeClass(def.type) : 'orgshape';
    // Badge = tier initial for rare+ organs (common = none)
    const romanStr   = (def && def.tier && def.tier !== 'common') ? def.tier[0].toUpperCase() : '';

    cell.className = cls;
    cell.innerHTML = `<div class="${shapeClass}"></div>${romanStr ? `<span class="q">${romanStr}</span>` : ''}`;
    cell.title     = def ? `${def.name} [${quality.name}]` : '?';
    cell.onclick   = () => {
      if (def) InspectorPanel.showOrgan(item.organId, item.hp, null);
    };
  });
}
