// Drag-and-drop combat hand. Cards live at the bottom of the screen. Pressing a
// targeted card (damage / heal / sursaut) keeps the card in place and draws a
// dashed arcing ARROW from the card to the cursor — so the organs behind stay
// visible while you aim. The scene dims and the enemy's organs glow over its
// body, plus YOUR own organs light up on the reactor (self-cast). Release on any
// organ to play the card there. Utility cards (guard / dodge…) are click-to-play
// on yourself. Pointer events → desktop + touch.

const SVG = 'http://www.w3.org/2000/svg';

let _root, _handEl, _targetsEl, _end, _blood;
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
  _endAiming();
}

export function render(cards, ctx) {
  _ensure();
  _root.style.display = '';
  _blood.style.display = '';
  _ctx = ctx;

  // top-left blood drops — the single readout of what you can spend this turn
  const n = Math.max(0, ctx.blood ?? 0);
  _blood.innerHTML = `<span class="cb-drops">${'<i></i>'.repeat(Math.min(n, 12))}</span>` +
    `<span class="cb-num">${n}</span><span class="cb-cap">sang</span>`;

  _handEl.innerHTML = '';
  for (const c of cards) {
    const el = document.createElement('div');
    el.className = 'ccard l-' + (c.layerHint ?? 'x') + (c.playable ? '' : ' disabled') + (c.needsTarget ? ' targeted-card' : '');
    const beads = c.cost > 0 ? '<i></i>'.repeat(Math.min(c.cost, 4)) : '<u>libre</u>';
    el.innerHTML =
      `<span class="cc-cost" title="${c.cost} Sang">${beads}</span>` +
      `<span class="cc-name">${c.label}</span>` +
      `<span class="cc-desc">${c.desc}</span>` +
      `<span class="cc-tag">${c.organName ?? ''}</span>`;
    el._card = c;
    if (c.playable) {
      if (c.needsTarget) el.addEventListener('pointerdown', (e) => _onDown(e, el, c));
      else el.addEventListener('click', () => _ctx.onPlay(c.organKey, c.skillId, _ctx.mobId, null, true));
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

// One cluster of organs PER enemy, anchored over that enemy's silhouette and
// arranged by layer (deep at top, outer at bottom). Drop on any one to target it.
function _buildTargets() {
  _targetsEl.innerHTML = '';
  const tRect = _targetsEl.getBoundingClientRect();

  const byMob = new Map();
  for (const o of _ctx.organs ?? []) {
    if (!byMob.has(o.mobId)) byMob.set(o.mobId, []);
    byMob.get(o.mobId).push(o);
  }
  const mobIds = [...byMob.keys()];

  mobIds.forEach((mobId, idx) => {
    const cluster = document.createElement('div');
    cluster.className = 'ctmob';

    // anchor over the mob's silhouette; fall back to even spacing if absent
    const sil = document.querySelector(`#mob-display .mobwrap[data-mob-id="${mobId}"]`);
    let cx, cy;
    if (sil) {
      const r = sil.getBoundingClientRect();
      cx = r.left + r.width / 2 - tRect.left;
      cy = r.top + r.height * 0.45 - tRect.top;
    } else {
      cx = tRect.width * ((idx + 1) / (mobIds.length + 1));
      cy = tRect.height * 0.42;
    }
    cluster.style.left = `${cx}px`;
    cluster.style.top = `${cy}px`;

    const byLayer = { deep: [], mid: [], outer: [] };
    for (const o of byMob.get(mobId)) (byLayer[o.layer] ?? byLayer.outer).push(o);
    for (const layer of ['deep', 'mid', 'outer']) {
      if (!byLayer[layer].length) continue;
      const row = document.createElement('div');
      row.className = 'ctrow l-' + layer;
      for (const o of byLayer[layer]) {
        const n = document.createElement('div');
        n.className = 'ctarget' + (o.locked ? ' locked' : '') + (o.dead ? ' dead' : '');
        n.dataset.organ = o.slotKey;
        n.dataset.mob = o.mobId;
        n.innerHTML = `<span class="ct-name">${o.name}</span>` +
          `<span class="ct-hp"><span style="width:${Math.max(0, Math.round(100 * o.hp / o.maxHp))}%"></span></span>`;
        row.appendChild(n);
      }
      cluster.appendChild(row);
    }
    _targetsEl.appendChild(cluster);
  });
}
