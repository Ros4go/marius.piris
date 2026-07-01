// Drag-and-drop combat hand. Cards live at the bottom of the screen. Pressing a
// targeted card (damage / heal / sursaut) keeps the card in place and draws a
// dashed arcing ARROW from the card to the cursor — so the organs behind stay
// visible while you aim. The scene dims and the enemy's organs glow over its
// body, plus YOUR own organs light up on the reactor (self-cast). Release on any
// organ to play the card there. Utility cards (guard / dodge…) are click-to-play
// on yourself. Pointer events → desktop + touch.

const SVG = 'http://www.w3.org/2000/svg';

let _root, _handEl, _targetsEl, _end, _blood, _discard;
let _arrowSvg, _arrowLine, _arrowHead;
let _ctx = null;     // last render context
let _aim = null;     // { card, el } while aiming

function _game() { return document.getElementById('chair-app'); }

function _ensure() {
  if (_root) return;
  _root = document.createElement('div'); _root.id = 'combat-ui';
  _root.innerHTML =
    '<div id="combat-targets" aria-hidden="true"></div>' +
    '<div id="combat-hand"></div>';
  _game().appendChild(_root);
  _handEl    = _root.querySelector('#combat-hand');
  _targetsEl = _root.querySelector('#combat-targets');

  // blood drops live at the TOP-LEFT OF THE VIEWPORT (the play area), not the
  // whole game — otherwise they'd sit over the header.
  _blood = document.createElement('div'); _blood.id = 'combat-blood'; _blood.setAttribute('aria-hidden', 'true');
  (document.querySelector('.viewport') ?? _root).appendChild(_blood);

  // discard pile — cards you've played this turn fly here (they return next turn).
  // Click it to see what's inside.
  _discard = document.createElement('div'); _discard.id = 'combat-discard';
  _discard.innerHTML = '<span class="cd-n">0</span><span class="cd-cap">défausse</span><div id="combat-discard-view"></div>';
  (document.querySelector('.viewport') ?? _root).appendChild(_discard);
  _discard.addEventListener('click', (e) => { e.stopPropagation(); _toggleDiscardView(); });
  window.addEventListener('pointerdown', (e) => { if (!e.target.closest?.('#combat-discard')) _closeDiscardView(); });

  _arrowSvg = document.createElementNS(SVG, 'svg');
  _arrowSvg.id = 'combat-arrow'; _arrowSvg.style.display = 'none';
  _arrowLine = document.createElementNS(SVG, 'path'); _arrowLine.setAttribute('class', 'arrow-line');
  _arrowHead = document.createElementNS(SVG, 'path'); _arrowHead.setAttribute('class', 'arrow-head');
  _arrowSvg.append(_arrowLine, _arrowHead);
  _root.appendChild(_arrowSvg);

  window.addEventListener('pointermove', _onMove);
  window.addEventListener('pointerup', _onUp);
}

export function hide() {
  if (_root) _root.style.display = 'none';
  if (_blood) _blood.style.display = 'none';
  if (_discard) _discard.style.display = 'none';
  _endAiming();
}

function _closeDiscardView() { _discard?.classList.remove('cd-open'); }
function _fillDiscardView() {
  const view = _discard?.querySelector('#combat-discard-view');
  if (!view) return;
  const list = _ctx?.discarded ?? [];
  view.innerHTML = '<div class="cdv-title">Défausse — revient au prochain tour</div>' +
    list.map((c) => `<div class="cdv-card"><b>${c.label}</b>${c.once ? ' <em>· 1×/combat</em>' : ''}` +
      `<span class="cdv-org">${c.organName}</span><span class="cdv-desc">${c.desc}</span></div>`).join('');
}
function _toggleDiscardView() {
  if (!_discard) return;
  if (_discard.classList.contains('cd-open')) { _closeDiscardView(); return; }
  if (!(_ctx?.discarded ?? []).length) return;
  _fillDiscardView();
  _discard.classList.add('cd-open');
}

// Fly a copy of a just-played card into the discard pile.
function _flyToDiscard(cardEl) {
  if (!cardEl || !_discard) return;
  const from = cardEl.getBoundingClientRect();
  const to   = _discard.getBoundingClientRect();
  const clone = cardEl.cloneNode(true);
  clone.classList.add('fx-discard-fly');
  clone.style.cssText += `position:fixed; left:${from.left}px; top:${from.top}px; width:${from.width}px; height:${from.height}px; margin:0; z-index:70; pointer-events:none;`;
  document.body.appendChild(clone);
  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);
  requestAnimationFrame(() => {
    clone.style.transition = 'transform .42s cubic-bezier(.5,.1,.7,1), opacity .42s ease-in';
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(.16) rotate(20deg)`;
    clone.style.opacity = '0.15';
  });
  setTimeout(() => clone.remove(), 470);
}

export function render(cards, ctx) {
  _ensure();
  _root.style.display = '';
  _blood.style.display = '';
  _ctx = ctx;

  // top-left resource readout — one chip per resource, its value inside the icon.
  // Sang is always leftmost and always shown (even 0); the others only appear
  // when you actually hold some.
  const chip = (kind, val, label) =>
    `<span class="cb-res cb-${kind}" title="${label} : ${val}"><span class="cb-n">${val}</span></span>`;
  const out = [chip('sang', Math.max(0, ctx.blood ?? 0), 'Sang')];
  if ((ctx.protection ?? 0) > 0) out.push(chip('protection', ctx.protection, 'Protection'));
  if ((ctx.frenesie ?? 0)   > 0) out.push(chip('frenesie', ctx.frenesie, 'Frénésie'));
  if ((ctx.regen ?? 0)      > 0) out.push(chip('regen', ctx.regen, 'Régénération'));
  _blood.innerHTML = out.join('');

  // discard pile count (and refresh the popup if it's open)
  _discard.style.display = '';
  _discard.querySelector('.cd-n').textContent = ctx.discardCount ?? 0;
  _discard.classList.toggle('cd-empty', !(ctx.discardCount > 0));
  if (!(ctx.discardCount > 0)) _closeDiscardView();
  else if (_discard.classList.contains('cd-open')) _fillDiscardView();

  _handEl.innerHTML = '';
  for (const c of cards) {
    const el = document.createElement('div');
    el.className = 'ccard l-' + (c.layerHint ?? 'x') + (c.playable ? '' : ' disabled') + (c.needsTarget ? ' targeted-card' : '');
    if (c.color) el.style.setProperty('--card-accent', c.color);   // organ/set colour (matches the mob)
    const beads = c.cost > 0 ? '<i></i>'.repeat(Math.min(c.cost, 4)) : '<u>libre</u>';
    el.innerHTML =
      `<span class="cc-cost" title="${c.cost} Sang">${beads}</span>` +
      `<span class="cc-name">${c.label}</span>` +
      `<span class="cc-desc">${c.desc}</span>` +
      `<span class="cc-tag">${c.organName ?? ''}</span>`;
    el._card = c;
    if (c.playable) {
      if (c.needsTarget) el.addEventListener('pointerdown', (e) => _onDown(e, el, c));
      else el.addEventListener('click', () => { _flyToDiscard(el); _ctx.onPlay(c.organKey, c.skillId, _ctx.mobId, null, true); });
    }
    _handEl.appendChild(el);
  }

  _end = document.createElement('button');
  _end.id = 'combat-end';
  _end.innerHTML = `FIN DU TOUR<em>${ctx.blood} Sang restant · l'ennemi joue</em>`;
  _end.addEventListener('click', () => _ctx.onEndTurn());
  _handEl.appendChild(_end);
}

// --- aim: card stays put, an arrow points from it to the cursor ------------

function _onDown(e, el, card) {
  e.preventDefault();
  _aim = { card, el };
  el.classList.add('aiming');
  _game().classList.add('targeting');
  _buildTargets();
  _arrowSvg.style.display = '';
  _updateArrow(e.clientX, e.clientY);
}

function _onMove(e) {
  if (!_aim) return;
  _updateArrow(e.clientX, e.clientY);
  const t = _targetUnder(e.clientX, e.clientY);
  for (const n of _allTargets()) n.classList.toggle('hot', n === t);
}

function _onUp(e) {
  if (!_aim) return;
  const t = _targetUnder(e.clientX, e.clientY);
  const aim = _aim;
  _endAiming();
  if (t && !t.classList.contains('locked') && !t.classList.contains('dead')) {
    const isSelf = t.dataset.self === '1';
    _flyToDiscard(aim.el);
    _ctx.onPlay(aim.card.organKey, aim.card.skillId, isSelf ? null : t.dataset.mob, t.dataset.organ, isSelf);
  }
}

// Dashed quadratic arc bowed upward, from the card's top to the cursor.
function _updateArrow(x, y) {
  const r = _aim.el.getBoundingClientRect();
  const sx = r.left + r.width / 2;
  const sy = r.top + 6;
  const dist = Math.hypot(x - sx, y - sy);
  const cpx = (sx + x) / 2;
  const cpy = (sy + y) / 2 - Math.min(200, dist * 0.4);
  _arrowLine.setAttribute('d', `M ${sx} ${sy} Q ${cpx} ${cpy} ${x} ${y}`);
  // arrowhead aligned with the curve's tangent at the cursor (end − control)
  const ang = Math.atan2(y - cpy, x - cpx);
  const len = 17, spread = 0.46;
  const ax = x - len * Math.cos(ang - spread), ay = y - len * Math.sin(ang - spread);
  const bx = x - len * Math.cos(ang + spread), by = y - len * Math.sin(ang + spread);
  _arrowHead.setAttribute('d', `M ${x} ${y} L ${ax} ${ay} L ${bx} ${by} Z`);
}

function _endAiming() {
  if (_aim) _aim.el.classList.remove('aiming');
  _aim = null;
  _game()?.classList.remove('targeting');
  if (_arrowSvg) _arrowSvg.style.display = 'none';
  if (_targetsEl) _targetsEl.innerHTML = '';
  for (const n of _allTargets()) n.classList.remove('hot');
}

function _targetUnder(x, y) {
  const el = document.elementFromPoint(x, y);
  return el?.closest?.('[data-organ]') ?? null;
}

// Every live drop target currently in the DOM: enemy organs (overlay) + your
// own organs (reactor on the right).
function _allTargets() {
  return document.querySelectorAll('#combat-targets .ctarget, #reactor [data-organ]');
}

// Press-and-hold a mob to reveal its organs (inspection), without a card. Release
// to hide. Reuses the same target clusters as a card drag.
export function peek(on, mobId) {
  _ensure();
  if (!_ctx || _aim) return;                 // ignore while a card is being aimed
  if (on) { _game().classList.add('peeking'); _buildTargets(mobId); }
  else    { _game()?.classList.remove('peeking'); if (_targetsEl) _targetsEl.innerHTML = ''; }
}

const LAYER_FR = { outer: 'Externe', mid: 'Médian', deep: 'Profond' };

// One PANEL per enemy: a backdrop card with the organs grouped by layer
// (front → back), each layer labelled. Locked layers (behind an intact layer)
// are dimmed + barricaded so it's clear why they can't be hit yet. Panels are
// anchored over each mob then spread apart so neighbours never overlap.
function _buildTargets(onlyMob = null) {
  _targetsEl.innerHTML = '';
  const tRect = _targetsEl.getBoundingClientRect();

  const byMob = new Map();
  for (const o of _ctx.organs ?? []) {
    if (onlyMob && o.mobId !== onlyMob) continue;
    if (!byMob.has(o.mobId)) byMob.set(o.mobId, []);
    byMob.get(o.mobId).push(o);
  }

  // anchor each panel over its mob, then push apart to avoid overlap
  const CW = 200, GAP = 14;
  const items = [...byMob.keys()].map((id, idx) => {
    const sil = document.querySelector(`#mob-display .mobwrap[data-mob-id="${id}"]`);
    if (sil) {
      const r = sil.getBoundingClientRect();
      return { id, cx: r.left + r.width / 2 - tRect.left, cy: r.top + r.height * 0.42 - tRect.top };
    }
    return { id, cx: tRect.width * ((idx + 1) / (byMob.size + 1)), cy: tRect.height * 0.42 };
  });
  items.sort((a, b) => a.cx - b.cx);
  for (let i = 1; i < items.length; i++) {
    const min = items[i - 1].cx + CW + GAP;
    if (items[i].cx < min) items[i].cx = min;
  }
  if (items.length) {
    const over = items[items.length - 1].cx - (tRect.width - CW / 2 - 6);
    if (over > 0) items.forEach((it) => (it.cx -= over));
    const under = (CW / 2 + 6) - items[0].cx;
    if (under > 0) items.forEach((it) => (it.cx += under));
  }

  for (const { id, cx, cy } of items) {
    const cluster = document.createElement('div');
    cluster.className = 'ctmob';
    cluster.style.left = `${cx}px`;
    cluster.style.top = `${cy}px`;

    const byLayer = { outer: [], mid: [], deep: [] };
    for (const o of byMob.get(id)) (byLayer[o.layer] ?? byLayer.outer).push(o);

    for (const layer of ['outer', 'mid', 'deep']) {   // front → back
      const list = byLayer[layer];
      if (!list.length) continue;
      const reachable = list.some((o) => !o.locked && !o.dead);
      const sec = document.createElement('div');
      sec.className = 'ctlayer l-' + layer + (reachable ? '' : ' locked');
      sec.innerHTML = `<div class="ctl-head"><span class="ctl-name">${LAYER_FR[layer]}</span>` +
        (reachable ? '' : '<span class="ctl-lock">🔒 protégé</span>') + '</div>';

      const row = document.createElement('div');
      row.className = 'ctrow';
      for (const o of list) {
        const n = document.createElement('div');
        n.className = 'ctarget' + (o.locked ? ' locked' : '') + (o.dead ? ' dead' : '') + (o.weak ? ' weak' : '');
        n.dataset.organ = o.slotKey;
        n.dataset.mob = o.mobId;
        if (o.color) n.style.setProperty('--ct-accent', o.color);
        if (o.locked && !o.dead) n.title = 'Inaccessible — détruis un organe de la couche au-dessus';
        if (o.weak) n.title = 'Point faible — dégâts bonus';
        const pct = Math.max(0, Math.round(100 * o.hp / o.maxHp));
        n.innerHTML = `<span class="ct-name">${o.weak ? '✦ ' : ''}${o.name}</span>` +
          `<span class="ct-hp"><span style="width:${pct}%"></span></span>`;
        row.appendChild(n);
      }
      sec.appendChild(row);
      cluster.appendChild(sec);
    }
    _targetsEl.appendChild(cluster);
  }
}
