import { WS } from '../WorldState.js';
import { organResolver, relic as getRelic } from '../registry.js';

const _grid = document.getElementById('inventory-grid');
let _onInspect = null;

export function init({ onInspect } = {}) { _onInspect = onInspect; }

const ROMAN = ['', 'I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];

function _orgShapeClass(type) {
  if (type === 'eye') return 'orgshape eye';
  return 'orgshape';
}

// Le compilateur de sprites vit dans SpriteFX (partagé besace/marchand/figures
// de salle/atelier) — ré-exporté ici pour les consommateurs historiques.
import { spriteStyle, spriteCalques, spriteAnimAttr, animerSprites } from './SpriteFX.js';
export { spriteStyle, spriteCalques, spriteAnimAttr, animerSprites, structFigure, decorFigure, ANIM_PRESETS, ANIM_EASINGS } from './SpriteFX.js';

// Apparence d'un item de besace — PARTAGÉE jeu/atelier (zone Visuel de l'outil) :
// classes de cellule, HTML interne (forme CSS + sprite + badge de tier) et tooltip.
export function itemLook(item) {
  if (item.relicId) {
    const rdef = getRelic(item.relicId);
    return { cls: 'cell full relic', html: `<div class="orgshape relicshape" style="${spriteStyle(rdef?.sprite)}"${spriteAnimAttr(rdef?.sprite)}>${spriteCalques(rdef?.sprite)}</div>`,
             title: rdef ? `✦ ${rdef.name}\n${rdef.description ?? ''}` : '✦ relique' };
  }
  const def     = organResolver(item.organId);
  const quality = def ? def.getQuality(item.hp ?? def.maxHp) : { name: 'pourri' };
  let cls = 'cell full';
  if (quality.name === 'pourri' || quality.name === 'destroyed') cls += ' rot';
  else if (quality.name === 'parfait' || quality.name === 'intact') cls += ' glow';
  const shape = def ? _orgShapeClass(def.type) : 'orgshape';
  // L'usure TERNIT l'organe : couleurs désaturées et assombries par palier de
  // qualité (pourri/détruit gardent le filtre .rot de la cellule entière)
  const usure = { 'abîmé': 'saturate(.72) brightness(.86)', cuit: 'saturate(.42) brightness(.66)' }[quality.name];
  // Badge = initiale du tier pour rare+ (common = rien)
  const badge = (def && def.tier && def.tier !== 'common') ? def.tier[0].toUpperCase() : '';
  return { cls, html: `<div class="${shape}" style="${spriteStyle(def?.sprite)}${usure ? `;filter:${usure}` : ''}"${spriteAnimAttr(def?.sprite)}>${spriteCalques(def?.sprite)}</div>${badge ? `<span class="q">${badge}</span>` : ''}`,
           title: def ? `${def.name} [${quality.name}]` : '?' };
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
    // A faint ✦ marks an item never inspected yet; it vanishes after first inspect.
    const newMark = item.seen ? '' : '<span class="newmark">✦</span>';

    const look = itemLook(item);
    cell.className = look.cls;
    cell.innerHTML = look.html + newMark;
    cell.title     = look.title;
    const inspectable = !!item.relicId || !!organResolver(item.organId);
    cell.onclick   = inspectable ? () => _onInspect?.(invIdx) : null;
  });
  animerSprites(_grid);
}
