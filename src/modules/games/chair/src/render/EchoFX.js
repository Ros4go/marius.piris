// Echolocation (TDD §2.2) — with the `echolocation` keyword you "see" by sound:
// a pulsing POINT-CLOUD is drawn over each sound-emitting body. Because it sits
// ABOVE the darkness overlay, it lets you perceive mobs even fully blind.

import { WS, currentRoom } from '../WorldState.js';
import * as Faculties from '../systems/Faculties.js';
import * as MobRenderer from './MobRenderer.js';

let _canvas, _ctx, _running = false;

export function init() {
  if (_canvas) return;
  const vp = document.querySelector('.viewport') ?? document.body;
  _canvas = document.createElement('canvas'); _canvas.id = 'echo-canvas';
  vp.appendChild(_canvas);
  _ctx = _canvas.getContext('2d');
  _running = true;
  requestAnimationFrame(_loop);
}

function _loop(ts) {
  if (!_running) return;
  const W = _canvas.clientWidth, H = _canvas.clientHeight;
  if (_canvas.width !== W)  _canvas.width = W;
  if (_canvas.height !== H) _canvas.height = H;
  _ctx.clearRect(0, 0, W, H);
  if (Faculties.hasKeyword('echolocation')) _draw(ts);
  requestAnimationFrame(_loop);
}

function _draw(ts) {
  const vp = _canvas.getBoundingClientRect();
  const tSec = ts / 1000;
  const room = currentRoom();
  const ids = (room?.mobIds ?? []).filter((id) => {
    const m = WS.mobs.get(id);
    return m?.lifecycle === 'active' && Faculties.sonorityOf(m.body) > 0 && Faculties.perceivesMob(m);
  });

  for (const id of ids) {
    const el = MobRenderer.elementOf(id);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2 - vp.left;
    const cy = r.top + r.height / 2 - vp.top;
    const rw = r.width * 0.6, rh = r.height * 0.58;
    const ping = 0.5 + 0.5 * Math.sin(tSec * 2.4 + id.length);   // sonar sweep
    const PTS = 52;
    for (let i = 0; i < PTS; i++) {
      const a  = (i / PTS) * Math.PI * 2 + tSec * 0.25;
      const rr = 0.55 + 0.45 * Math.sin(i * 3.3 + tSec * 2);       // ragged silhouette
      const px = cx + Math.cos(a) * rw * rr;
      const py = cy + Math.sin(a) * rh * rr;
      _ctx.fillStyle = `rgba(120,224,214,${(0.22 + 0.32 * ping).toFixed(3)})`;
      _ctx.beginPath();
      _ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      _ctx.fill();
    }
  }
}
