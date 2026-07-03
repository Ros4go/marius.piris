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

// Sprite paramétrique (organs/relics.json "sprite") → style inline, PARTAGÉ
// besace/marchand/atelier. Sans sprite : les formes CSS historiques (hud.css).
// Champs : forme (border-radius) · degrade {cx,cy,stops:[{c,de?,a?}]} — deux
// positions sur un stop = anneau net (l'iris de l'œil) · taille (% de la cellule)
// · ombre (false = sans ombre portée) · eclat {c,alpha,rayon} (halo, cf reliques).
export function spriteStyle(sp, avecTaille = true) {
  if (!sp) return '';
  const out = [];
  if (sp.forme) out.push(`border-radius:${sp.forme}`);
  if (sp.degrade?.stops?.length) {
    const stops = sp.degrade.stops
      .map((s) => s.c + (s.de != null ? ` ${s.de}%` : '') + (s.a != null ? ` ${s.a}%` : ''))
      .join(', ');
    out.push(`background:radial-gradient(circle at ${sp.degrade.cx ?? 50}% ${sp.degrade.cy ?? 50}%, ${stops})`);
  }
  if (avecTaille && sp.taille) out.push(`width:${sp.taille}%;height:${sp.taille}%`);
  if (sp.eclat?.c || sp.ombre === false) {
    const shadows = [];
    if (sp.eclat?.c) {
      const a = Math.round((sp.eclat.alpha ?? 0.4) * 255).toString(16).padStart(2, '0');
      shadows.push(`0 0 ${sp.eclat.rayon ?? 6}px ${sp.eclat.c}${a}`);
    }
    if (sp.ombre !== false) shadows.push('0 2px 4px #000');
    out.push(`box-shadow:${shadows.join(', ') || 'none'}`);
  }
  if (sp.calques?.length) {
    out.push('position:relative');                    // ancre les calques absolus
    if (sp.decoupe) out.push('overflow:hidden');      // coupe ce qui dépasse la forme
  }
  return out.join(';');
}

// Calques : petites formes posées PAR-DESSUS la forme de base (points noirs pour
// des yeux, taches, détails). {c, c2?, x, y, l, h, forme?, rot?, alpha?} — position
// et taille en % de la forme de base, CENTRÉES sur (x, y). c2 → mini dégradé.
function _calqueStyle(k) {
  const l = k.l ?? 20, h = k.h ?? 20;
  const out = [
    'position:absolute', 'display:block',
    `left:${(k.x ?? 50) - l / 2}%`, `top:${(k.y ?? 50) - h / 2}%`,
    `width:${l}%`, `height:${h}%`,
    `border-radius:${k.forme ?? '50%'}`,
    k.c2 ? `background:radial-gradient(circle at 35% 30%, ${k.c ?? '#000'}, ${k.c2})` : `background:${k.c ?? '#000'}`,
  ];
  if (k.alpha != null) out.push(`opacity:${k.alpha}`);
  if (k.rot) out.push(`transform:rotate(${k.rot}deg)`);
  return out.join(';');
}
// HTML interne de la forme (un <i> par calque) — à insérer DANS le div du sprite.
export function spriteCalques(sp) {
  return (sp?.calques ?? []).map((k) => `<i style="${_calqueStyle(k)}"></i>`).join('');
}

// Apparence d'un item de besace — PARTAGÉE jeu/atelier (zone Visuel de l'outil) :
// classes de cellule, HTML interne (forme CSS + sprite + badge de tier) et tooltip.
export function itemLook(item) {
  if (item.relicId) {
    const rdef = getRelic(item.relicId);
    return { cls: 'cell full relic', html: `<div class="orgshape relicshape" style="${spriteStyle(rdef?.sprite)}">${spriteCalques(rdef?.sprite)}</div>`,
             title: rdef ? `✦ ${rdef.name}\n${rdef.description ?? ''}` : '✦ relique' };
  }
  const def     = organResolver(item.organId);
  const quality = def ? def.getQuality(item.hp ?? def.maxHp) : { name: 'pourri' };
  let cls = 'cell full';
  if (quality.name === 'pourri' || quality.name === 'destroyed') cls += ' rot';
  else if (quality.name === 'parfait' || quality.name === 'intact') cls += ' glow';
  const shape = def ? _orgShapeClass(def.type) : 'orgshape';
  // Badge = initiale du tier pour rare+ (common = rien)
  const badge = (def && def.tier && def.tier !== 'common') ? def.tier[0].toUpperCase() : '';
  return { cls, html: `<div class="${shape}" style="${spriteStyle(def?.sprite)}">${spriteCalques(def?.sprite)}</div>${badge ? `<span class="q">${badge}</span>` : ''}`,
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
}
