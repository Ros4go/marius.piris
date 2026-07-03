// Echolocation shaders (TDD §2.3) — "seeing" by sound, drawn as dotted fields
// whose density scales with how much SOUND is around:
//   • `echolocation-3` — always-on dotted shader over the SCENE (not the UI).
//     A light vision substitute: it renders ABOVE the blind black halves, so an
//     eyeless player still faintly perceives the room by ear.
//   • `echolocation-4` — a toggle button (bottom bar) that draws the dotted
//     shader over EVERYTHING, UI included.
// Per §2.1 both are LATERALISED: each half of the screen needs the tier on that
// side's ear (centre split like every ouïe reading).

import { WS, currentRoom } from '../WorldState.js';
import * as Faculties from '../systems/Faculties.js';
import * as MobRenderer from './MobRenderer.js';
import * as TagFX from './TagFX.js';

let _canvas, _ctx;          // scene-level canvas (above darkness, below UI)
let _uiCanvas, _uiCtx;      // viewport-level canvas (above EVERYTHING)
let _btn, _uiOn = false, _running = false;

export function init() {
  if (_canvas) return;
  const vp = document.querySelector('.viewport') ?? document.body;
  _canvas = document.createElement('canvas'); _canvas.id = 'echo-canvas';
  vp.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');

  _uiCanvas = document.createElement('canvas'); _uiCanvas.id = 'echo-ui-canvas';
  document.body.appendChild(_uiCanvas);
  _uiCtx = _uiCanvas.getContext('2d');

  _btn = document.createElement('button');
  _btn.id = 'echo-toggle'; _btn.textContent = '◉'; _btn.title = 'Écholocation totale';
  _btn.onclick = () => { _uiOn = !_uiOn; _btn.classList.toggle('on', _uiOn); };
  vp.appendChild(_btn);

  _running = true;
  requestAnimationFrame(_loop);
}

// Total sound level around (0..~5): mobs + player noise + heart. Drives density.
function _soundLevel() {
  let s = (WS.player?.noise ?? 0) + Faculties.sonorityOf(WS.player?.body) * 0.4;
  const room = currentRoom();
  for (const id of room?.mobIds ?? []) {
    const m = WS.mobs.get(id);
    if (m?.lifecycle === 'active') s += Faculties.sonorityOf(m.body) * 0.6;
  }
  return s;
}

function _sideHas(tier) {
  return {
    gauche: Faculties.hasTier('echolocation', tier, 'gauche'),
    droite: Faculties.hasTier('echolocation', tier, 'droite'),
  };
}

let _lastTs = 0;
function _loop(ts) {
  if (!_running) return;
  _fit(_canvas); _fit(_uiCanvas);
  _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
  _uiCtx.clearRect(0, 0, _uiCanvas.width, _uiCanvas.height);

  const t3 = _sideHas(3), t4 = _sideHas(4);
  const any4 = t4.gauche || t4.droite;
  _btn.style.display = any4 ? '' : 'none';
  if (!any4) _uiOn = false;

  // Paramètres du shader définis en DATA (tags.json echolocation-3 "visuel.shader")
  const P = TagFX.echoParams();
  const level = _soundLevel();
  if (t3.gauche || t3.droite) {
    _dotField(_ctx, _canvas, ts, level, t3, false, P);
    _mobClouds(_ctx, _canvas, ts, P);
  }
  if (_uiOn && any4) _dotField(_uiCtx, _uiCanvas, ts, level * P.uiNiveauMult, t4, true, P);

  _lastTs = ts;
  requestAnimationFrame(_loop);
}

function _fit(c) {
  const W = c.clientWidth, H = c.clientHeight;
  if (c.width !== W) c.width = W;
  if (c.height !== H) c.height = H;
}

// The dotted field: a sparse pseudo-random grid whose alive fraction ∝ sound.
// Deterministic per cell (hash) so dots shimmer in place instead of boiling.
function _dotField(ctx, canvas, ts, level, sideOk, ui = false, P = TagFX.echoParams()) {
  const W = canvas.width, H = canvas.height;
  if (!W || !H) return;
  const tSec = ts / 1000;
  const step = ui ? P.stepUI : P.stepScene;
  const density = Math.min(P.densiteMax, P.densiteBase + level * P.densiteParNiveau);   // fraction of cells lit
  ctx.fillStyle = `rgba(${P.couleur},${ui ? P.alphaUI : P.alphaScene})`;
  for (let gy = 0; gy < H; gy += step) {
    for (let gx = 0; gx < W; gx += step) {
      const side = gx < W / 2 ? 'gauche' : 'droite';
      if (!sideOk[side]) continue;
      let h = ((gx * 73856093) ^ (gy * 19349663)) >>> 0;
      h = (h ^ (h >> 13)) * 0x5bd1e995 >>> 0;
      if ((h % 1000) / 1000 > density) continue;
      const wob = Math.sin(tSec * 2 + (h % 63)) * 1.5;
      const r = 0.8 + ((h >> 4) % 10) / 10 + 0.4 * Math.sin(tSec * 3 + h % 7);
      ctx.beginPath();
      ctx.arc(gx + (h % step) * 0.6 + wob, gy + ((h >> 8) % step) * 0.6, Math.max(0.4, r), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Dense point-clouds hugging each sound-emitting mob (the old sonar silhouettes).
function _mobClouds(ctx, canvas, ts, P = TagFX.echoParams()) {
  const vp = canvas.getBoundingClientRect();
  const tSec = ts / 1000;
  const room = currentRoom();
  const ids = (room?.mobIds ?? []).filter((id) => {
    const m = WS.mobs.get(id);
    return m?.lifecycle === 'active' && Faculties.sonorityOf(m.body) > 0;
  });
  for (const id of ids) {
    const el = MobRenderer.elementOf(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - vp.left;
    const side = cx < canvas.width / 2 ? 'gauche' : 'droite';
    if (!Faculties.hasTier('echolocation', 3, side)) continue;
    const cy = r.top + r.height / 2 - vp.top;
    const rw = r.width * 0.6, rh = r.height * 0.58;
    const ping = 0.5 + 0.5 * Math.sin(tSec * 2.4 + id.length);
    const N = P.nuageMob.points;
    for (let i = 0; i < N; i++) {
      const a  = (i / N) * Math.PI * 2 + tSec * 0.25;
      const rr = 0.55 + 0.45 * Math.sin(i * 3.3 + tSec * 2);
      ctx.fillStyle = `rgba(${P.couleur},${(P.nuageMob.alphaBase + P.nuageMob.alphaPing * ping).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * rw * rr, cy + Math.sin(a) * rh * rr, P.nuageMob.rayon, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
