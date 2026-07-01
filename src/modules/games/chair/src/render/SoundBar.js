// The Sound Bar — the bottom-of-screen instrument (see TDD §2.3). Triple duty:
//   • ambiance  — a living waveform that pulses with your heartbeat,
//   • detection — blips for sound sources (your own noise, nearby mobs), their
//                 visibility/localisation scaling with your OUÏE,
//   • lore      — subtitles for NPC speech and the whispers of the dead god.
// Echolocation (point-cloud shader) comes later; this is the 2D instrument.

import { WS, currentRoom } from '../WorldState.js';
import { organResolver } from '../registry.js';
import * as Faculties from '../systems/Faculties.js';
import * as HungerSystem from '../systems/HungerSystem.js';

let _bar, _canvas, _ctx, _sub, _running = false;
let _sub_until = 0;
const _pings = [];   // transient localised sounds (drips, etc.)

// A room's structure makes an ambient sound — more or less discreet by type.
// `tremor:true` → no written label, just a faint trembling wave.
const STRUCT_CUE = {
  trade:   { label: 'marchand',   i: 0.42 },
  graft:   { label: 'couturière', i: 0.42 },
  pillard: { label: 'pillard',    i: 0.32 },   // lurking, quiet
  altar:   { label: 'autel',      i: 0.24 },   // discreet hum
  souffle: { tremor: true,        i: 0.18 },   // no label, just a tremor
};

// Inject a brief localised sound at x (0..1) that decays over `ttl` ms.
export function ping(x, label = 'ploc', intensity = 0.5, ttl = 850) {
  _pings.push({ x, label, i0: intensity, ttl, age: 0 });
}

export function init() {
  if (_bar) return;
  const vp = document.querySelector('.viewport') ?? document.body;
  _bar = document.createElement('div'); _bar.id = 'sound-bar';
  _bar.innerHTML = '<div id="sb-sub"></div><canvas id="sb-canvas"></canvas>';
  vp.appendChild(_bar);
  _canvas = _bar.querySelector('#sb-canvas');
  _ctx = _canvas.getContext('2d');
  _sub = _bar.querySelector('#sb-sub');
  _running = true;
  requestAnimationFrame(_loop);
}

// Show a lore/speech subtitle for a while.
export function say(text, ms = 4200) {
  if (!_sub) return;
  _sub.textContent = text;
  _sub.classList.add('on');
  _sub_until = ms;   // consumed by the loop via dt
}

// --- Sound sources this frame ---------------------------------------------
// Each source is a LOCALISED, NAMED sound: {x, base intensity, label, colour, kind}.
function _emitters() {
  const out = [];
  const deaf = HungerSystem.isDeaf();
  const body = WS.player?.body;

  // Your own body sounds — always felt internally:
  const heart = body?.slots?.heart;
  if (heart?.organId && (heart.hp ?? 1) > 0)
    out.push({ x: 0.5, base: 0.3, label: 'battement', kind: 'heart' });   // discreet

  const hn = WS.player?.noise ?? 0;
  if (hn > 0.05) {
    const famine = HungerSystem.stage() === 'famine';
    out.push({ x: 0.64, base: Math.min(1, hn), label: famine ? 'VACARME' : 'gargouillis', kind: 'hunger' });
  }

  const room = currentRoom();

  // A room structure (NPC / altar / pillard / shard) emits from where it stands.
  const cue = STRUCT_CUE[room?._structKind];
  if (cue) {
    const side = room?._structSide;
    const x = side === 'left' ? 0.25 : side === 'right' ? 0.75 : 0.5;
    out.push({ x, base: cue.i, label: cue.tremor ? '' : cue.label, kind: cue.tremor ? 'tremor' : 'struct' });
  }

  // Mobs — heard only if your OUÏE picks them up; localised (≥2) / identified (≥3) higher up.
  const ouie = Faculties.ouieMax();
  if (!deaf && ouie >= 1) {
    const ids = (room?.mobIds ?? []).filter((id) => WS.mobs.get(id)?.lifecycle === 'active');
    ids.forEach((id, k) => {
      const mob = WS.mobs.get(id);
      const son = Faculties.sonorityOf(mob.body);
      if (son <= 0) return;
      const localised = ouie >= 2, identified = ouie >= 3;
      const x = localised ? (k + 1) / (ids.length + 1) : 0.3 + ((k * 0.37) % 0.4);
      const label = identified ? (mob.name ?? 'créature') : (localised ? 'créature' : 'présence ?');
      out.push({ x, base: Math.min(1, 0.35 + 0.2 * son), label, kind: 'mob' });
    });
  }
  return out;
}

function _heartBeat(tSec) {
  const h = WS.player?.body?.slots?.['heart'];
  if (!h?.organId || (h.hp ?? 1) <= 0) return 0;
  const period = organResolver(h.organId)?.pulse ?? 1.1;
  const phase = Math.sin((2 * Math.PI * tSec) / period);
  return Math.pow(Math.max(0, phase), 10);   // sharp periodic thump
}

let _last = 0;
function _loop(ts) {
  if (!_running) return;
  const dt = _last ? ts - _last : 16; _last = ts;
  const tSec = ts / 1000;

  if (_sub && _sub.classList.contains('on')) {
    _sub_until -= dt;
    if (_sub_until <= 0) _sub.classList.remove('on');
  }

  const W = _canvas.clientWidth, H = _canvas.clientHeight;
  if (_canvas.width !== W)  _canvas.width = W;
  if (_canvas.height !== H) _canvas.height = H;
  _ctx.clearRect(0, 0, W, H);

  const mid = H * 0.66;
  const COL = '#8a7658';   // single neutral tone — no per-source colour
  const beat = _heartBeat(tSec);
  const deaf = HungerSystem.isDeaf();
  let emitters = _emitters();
  // Famine (deaf): your own din drowns EVERYTHING — keep only the hunger vacarme.
  // No ears (not famine): you hear nothing at all (flat line), heartbeat included.
  if (deaf) emitters = emitters.filter((e) => e.kind === 'hunger');
  else if (Faculties.ouieMax() < 1) emitters = [];
  // transient pings (water drips…) are EXTERNAL sounds → need ears, like mobs.
  const canHear = !deaf && Faculties.ouieMax() >= 1;
  for (let i = _pings.length - 1; i >= 0; i--) {
    const p = _pings[i]; p.age += dt;
    if (p.age >= p.ttl) { _pings.splice(i, 1); continue; }
    if (canHear) emitters.push({ x: p.x, base: p.i0 * (1 - p.age / p.ttl), label: p.label, kind: 'ping' });
  }
  // the heartbeat drives the heart emitter's amplitude — kept subtle
  for (const e of emitters) e.i = e.kind === 'heart' ? e.base * (0.12 + 0.5 * beat) : e.base;

  // CLARITÉ — your OUÏE sharpens the whole readout: at Ouïe 1 the waves are faint
  // and trembling (you barely make it out), Ouïe 2 clean, Ouïe 3+ ample and crisp.
  const ouie = Faculties.ouieMax();
  const clarity = deaf ? 1 : ouie <= 0 ? 0 : Math.min(1.15, 0.3 + 0.27 * ouie);
  const fuzz = (1 - Math.min(1, clarity)) * 4;   // low Ouïe → jittery line near sources

  // ONE continuous full-width line — sound sources are bumps on it.
  _ctx.beginPath();
  for (let x = 0; x <= W; x += 2) {
    let y = mid;
    for (const e of emitters) {
      const ex = e.x * W, w = W * 0.045, amp = e.i * (H * 0.26) * clarity;
      const env = Math.exp(-Math.pow((x - ex) / w, 2));
      if (env > 0.002) {
        y -= amp * env * Math.sin((x - ex) * 0.28 - tSec * 9);
        y += env * fuzz * Math.sin(x * 0.9 + tSec * 17);   // trembling at low Ouïe
      }
    }
    if (x === 0) _ctx.moveTo(x, y); else _ctx.lineTo(x, y);
  }
  _ctx.strokeStyle = COL; _ctx.lineWidth = 1.2; _ctx.globalAlpha = 0.2 + 0.4 * Math.min(1, clarity);
  _ctx.stroke(); _ctx.globalAlpha = 1;

  // the sound name written above each source (tremors have no label)
  for (const e of emitters) {
    if (!e.label) continue;
    const ex = e.x * W, amp = e.i * (H * 0.26) * clarity;
    const size = (8 + e.i * 9) * (0.72 + 0.28 * Math.min(1, clarity));
    const bob = Math.sin(tSec * 4 + e.x * 12) * 2;
    _ctx.font = `600 ${size}px "IBM Plex Mono", "Courier New", monospace`;
    _ctx.textAlign = 'center';
    _ctx.fillStyle = COL;
    _ctx.globalAlpha = (0.35 + 0.45 * Math.min(1, e.i)) * Math.min(1, clarity);
    _ctx.fillText(e.label, ex, mid - amp - 6 + bob);
    _ctx.globalAlpha = 1;
  }

  requestAnimationFrame(_loop);
}
