// Combat animation layer — makes the turn-based flow legible: enemies strike one
// at a time (left → right), you see damage land, Protection soak, resources move.
// Pure presentation: it plays back the timeline the engine already resolved.

import * as MobRenderer from './MobRenderer.js';

let _layer = null;

function _viewport() { return document.querySelector('.viewport') ?? document.body; }
function _ensureLayer() {
  if (_layer && _layer.isConnected) return _layer;
  _layer = document.createElement('div');
  _layer.id = 'combat-fx';
  _viewport().appendChild(_layer);
  return _layer;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Float a rising label at viewport coords.
function _float(x, y, html, cls) {
  const l = _ensureLayer();
  const n = document.createElement('div');
  n.className = 'fx-float ' + (cls ?? '');
  n.style.left = `${x}px`; n.style.top = `${y}px`;
  n.innerHTML = html;
  l.appendChild(n);
  setTimeout(() => n.remove(), 1100);
}

// Centre of an element in viewport-relative coords (null → viewport centre).
function _centre(el) {
  const vp = _viewport().getBoundingClientRect();
  if (!el) return { x: vp.width / 2, y: vp.height * 0.62 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - vp.left, y: r.top + r.height / 2 - vp.top };
}

function _lunge(el, cls = 'fx-lunge') {
  if (!el) return;
  el.classList.remove(cls); void el.offsetWidth;   // restart the animation
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 420);
}

function _redFlash() {
  const l = _ensureLayer();
  l.classList.remove('fx-hitflash'); void l.offsetWidth;
  l.classList.add('fx-hitflash');
  setTimeout(() => l.classList.remove('fx-hitflash'), 260);
}

// Decrement a chip's displayed value live (used while Protection soaks hits).
function _drainChip(kind, amount) {
  const chip = document.querySelector(`#combat-blood .cb-${kind}`);
  if (!chip) return;
  const nEl = chip.querySelector('.cb-n');
  const cur = parseInt(nEl?.textContent ?? '0', 10) || 0;
  const next = Math.max(0, cur - amount);
  if (nEl) nEl.textContent = next;
  chip.classList.remove('cb-bump'); void chip.offsetWidth; chip.classList.add('cb-bump');
  setTimeout(() => chip.classList.remove('cb-bump'), 400);
  if (next <= 0) chip.classList.add('cb-spent');
  const vp = _viewport().getBoundingClientRect();
  const r = chip.getBoundingClientRect();
  _float(r.left + r.width / 2 - vp.left, r.top - vp.top - 4, `−${amount}`, 'fx-resdown');
}

// --- Enemy phase: play the resolved timeline step by step ------------------

export async function playEnemyPhase(timeline, logFn) {
  _ensureLayer();
  for (const step of timeline ?? []) {
    if (step.kind === 'produce') { logFn?.(step.events); continue; }

    const el = step.mobId ? MobRenderer.elementOf(step.mobId) : null;

    if (step.kind === 'status') {                    // Bile / Vulnérabilité ticks
      for (const e of step.events) {
        if (e.t === 'damage') { const c = _centre(el); _float(c.x, c.y, `☣ −${e.dmg}`, 'fx-bile'); }
      }
      logFn?.(step.events);
      await sleep(360);
      continue;
    }

    // an attacking mob: spotlight it, then play each of its blows
    if (el) el.classList.add('fx-attacking');
    await sleep(140);
    for (const e of step.events) {
      if (e.t === 'mob_action') {
        _lunge(el);
        _redFlash();
        const c = _centre(el);
        const parts = [`<b class="fx-dmg">−${e.dmg}</b>`];
        if (e.soaked) parts.push(`<span class="fx-block">🛡 ${e.soaked}</span>`);
        _float(c.x, c.y + 40, parts.join(' '), 'fx-hit');
        if (e.soaked) _drainChip('protection', e.soaked);   // show the Bloc draining in real time
        logFn?.([e]);
        await sleep(560);
      } else if (e.t === 'interrupted') {
        logFn?.([e]);
        await sleep(160);
      } else {
        logFn?.([e]);
      }
    }
    if (el) el.classList.remove('fx-attacking');
    await sleep(180);
  }
}

// --- Player card: a quick, effect-typed animation on the target ------------

const KIND_FX = {
  damage:        { cls: 'fx-slash', icon: '' },
  heal:          { cls: 'fx-heal',  icon: '✚' },
  protect:       { cls: 'fx-shield', icon: '🛡' },
  regen:         { cls: 'fx-heal',  icon: '✚' },
  frenesie:      { cls: 'fx-rage',  icon: '🔥' },
  blood:         { cls: 'fx-blood', icon: '🩸' },
  bile:          { cls: 'fx-bilehit', icon: '☣' },
  saignement:    { cls: 'fx-bleed', icon: '∴' },
  vulnerabilite: { cls: 'fx-vuln',  icon: '◎' },
  retrigger:     { cls: 'fx-retrig', icon: '↻' },
  convert:       { cls: 'fx-convert', icon: '⇄' },
};

// Animate a played card on a mob (or, if no mob, near the resource strip).
export function playerCast(mobId, effectKind, label, color) {
  _ensureLayer();
  const fx = KIND_FX[effectKind] ?? KIND_FX.damage;
  const el = mobId ? MobRenderer.elementOf(mobId) : null;
  if (el && (effectKind === 'damage' || effectKind === 'bile' || effectKind === 'saignement' || effectKind === 'vulnerabilite')) {
    _lunge(el, 'fx-struck');
    el.classList.add(fx.cls);
    setTimeout(() => el.classList.remove(fx.cls), 420);
  }
  const c = _centre(el);
  _float(c.x, c.y - 10, `${fx.icon} ${label}`.trim(), `fx-cast ${fx.cls}`);
}

// --- Resource chips: pulse a chip and float its delta ----------------------

export function resourceDelta(kind, delta) {
  if (!delta) return;
  const chip = document.querySelector(`#combat-blood .cb-${kind}`);
  if (!chip) return;
  chip.classList.remove('cb-bump'); void chip.offsetWidth;
  chip.classList.add('cb-bump');
  setTimeout(() => chip.classList.remove('cb-bump'), 400);
  const vp = _viewport().getBoundingClientRect();
  const r = chip.getBoundingClientRect();
  _float(r.left + r.width / 2 - vp.left, r.top - vp.top - 4,
    `${delta > 0 ? '+' : ''}${delta}`, delta > 0 ? 'fx-resup' : 'fx-resdown');
}
