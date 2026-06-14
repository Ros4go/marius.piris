// Procedural mob silhouette from mob.body organs.
// DOM nodes are cached per mobId and rebuilt only on first appearance.

import { WS, currentRoom } from '../WorldState.js';
import { organResolver } from '../registry.js';

const _display = document.getElementById('mob-display');
const _cache   = new Map(); // mobId → HTMLElement

export function render() {
  const room = currentRoom();
  const activeMobIds = (room?.mobIds ?? []).filter(id => {
    const m = WS.mobs.get(id);
    return m?.lifecycle === 'active';
  });

  // Remove stale entries
  for (const [id, el] of _cache) {
    if (!activeMobIds.includes(id)) {
      el.remove();
      _cache.delete(id);
    }
  }

  _display.classList.toggle('visible', activeMobIds.length > 0);

  for (const mobId of activeMobIds) {
    const mob = WS.mobs.get(mobId);
    if (!mob) continue;

    if (!_cache.has(mobId)) {
      const el = _build(mob);
      _display.appendChild(el);
      _cache.set(mobId, el);
    }

    _applyDamage(_cache.get(mobId), mob);
  }
}

// ──────────────────────────────────────────────────────────────────────────────

function _build(mob) {
  const organs = mob.body.equippedOrgans();
  const mass   = Math.max(0.6, Math.min(1.6, 0.5 + organs.length * 0.22));

  const wrap = document.createElement('div');
  wrap.dataset.mobId = mob.id;
  wrap.style.cssText = `
    position:relative; display:flex; flex-direction:column;
    align-items:center; justify-content:flex-end;
    width:${Math.round(72 * mass)}px; height:${Math.round(110 * mass)}px;
  `;

  // Core body
  const body = document.createElement('div');
  const bw = Math.round(38 * mass);
  const bh = Math.round(58 * mass);
  body.style.cssText = `
    width:${bw}px; height:${bh}px;
    background:var(--c-blood);
    clip-path:polygon(18% 0,82% 0,88% 100%,12% 100%);
    position:relative; flex-shrink:0;
  `;

  // Eyes
  const hasEye = organs.some(o => o.organId.startsWith('eye'));
  if (hasEye) {
    const eyeDef   = organs.find(o => o.organId.startsWith('eye'));
    const def      = eyeDef ? organResolver(eyeDef.organId) : null;
    const eyeColor = def?.visual?.color ?? '#a040c0';
    const eyes     = document.createElement('div');
    eyes.style.cssText = `
      position:absolute; top:22%; width:100%;
      display:flex; justify-content:space-around; padding:0 20%;
    `;
    for (let i = 0; i < 2; i++) {
      const e = document.createElement('div');
      e.style.cssText = `
        width:5px; height:5px; border-radius:50%;
        background:${eyeColor}; box-shadow:0 0 4px ${eyeColor};
      `;
      eyes.appendChild(e);
    }
    body.appendChild(eyes);
  }

  // Arms
  const hasArm = organs.some(o => o.organId.startsWith('arm'));
  if (hasArm) {
    for (const [side, sign] of [['left', -1], ['right', 1]]) {
      const arm = document.createElement('div');
      const aw  = Math.round(14 * mass);
      const ah  = Math.round(30 * mass);
      arm.style.cssText = `
        position:absolute; top:28%;
        ${side}:${-aw - 2}px;
        width:${aw}px; height:${ah}px;
        background:var(--c-blood);
        clip-path:polygon(${sign < 0 ? '25% 0,100% 5%,85% 100%,0 95%' : '0 5%,75% 0,100% 95%,15% 100%'});
        transform:rotate(${sign * 8}deg);
      `;
      body.appendChild(arm);
    }
  }

  // Legs
  const hasLegs = organs.some(o => o.organId.startsWith('legs'));
  if (hasLegs) {
    const legs = document.createElement('div');
    legs.style.cssText = `
      display:flex; gap:3px; margin-top:2px;
    `;
    for (let i = 0; i < 2; i++) {
      const leg = document.createElement('div');
      leg.style.cssText = `
        width:${Math.round(9 * mass)}px; height:${Math.round(22 * mass)}px;
        background:var(--c-thread);
        clip-path:polygon(20% 0,80% 0,90% 100%,10% 100%);
      `;
      legs.appendChild(leg);
    }
    wrap.appendChild(legs);
  }

  wrap.insertBefore(body, wrap.firstChild);
  return wrap;
}

function _applyDamage(el, mob) {
  const organs = mob.body.equippedOrgans().filter(o => o.hp !== null);
  if (!organs.length) { el.style.opacity = '0.15'; return; }

  let totalCur = 0, totalMax = 0;
  for (const o of organs) {
    const def = organResolver(o.organId);
    if (!def) continue;
    totalCur += Math.max(0, o.hp);
    totalMax += def.maxHp;
  }

  const ratio = totalMax > 0 ? totalCur / totalMax : 0;
  el.style.opacity = (0.25 + ratio * 0.75).toFixed(2);
  el.style.filter  = ratio < 0.35 ? 'blur(1.5px) saturate(0.4)' : '';
}
