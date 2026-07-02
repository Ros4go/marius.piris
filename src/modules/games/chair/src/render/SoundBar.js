// The Sound Bar (TDD §2.3) — the ear instrument, LATERALISED like the eyes:
// each ear covers its half of the bar; a centre source is SPLIT in two.
//   • `ouie`                  — waveforms only, no text, sources stacked centre.
//   • `echolocation-1/2`      — approximate / precise placement on the bar.
//   • `ouie-identification-N` — what gets WRITTEN (1 "créature" · 2 name, holed
//                               dialogue · 3 clear · 4 filter buttons).
//   • plan (via Ouïe)         — enemy telegraphs appear as localised sounds.
// DISPLAY EVERYTHING rule: every active identification reading is stacked —
// nothing is hidden by "the clearest wins".

import { WS, currentRoom } from '../WorldState.js';
import { organResolver } from '../registry.js';
import * as Faculties from '../systems/Faculties.js';
import * as HungerSystem from '../systems/HungerSystem.js';
import * as TurnCombat from '../TurnCombat.js';

let _bar, _canvas, _ctx, _sub, _filters, _running = false;
let _sub_until = 0;
const _pings = [];   // transient localised sounds (drips…)

// id-4 filter state: which sound kinds are shown. All on by default.
const FILTER_KINDS = [
  { key: 'self',   icon: '♥', title: 'soi (cœur, faim)' },
  { key: 'mob',    icon: '⚔', title: 'créatures' },
  { key: 'struct', icon: '⌂', title: 'structures' },
  { key: 'amb',    icon: '∴', title: 'ambiance' },
  { key: 'plan',   icon: '⚠', title: 'intentions' },
];
const _filterOff = new Set();

// A room structure makes an ambient sound — more or less discreet by type.
const STRUCT_CUE = {
  trade:   { label: 'marchand',   i: 0.42 },
  graft:   { label: 'couturière', i: 0.42 },
  pillard: { label: 'pillard',    i: 0.32 },
  altar:   { label: 'autel',      i: 0.24 },
  souffle: { tremor: true,        i: 0.18 },
};

const KIND_GROUP = { heart: 'self', hunger: 'self', mob: 'mob', struct: 'struct', tremor: 'struct', ping: 'amb', plan: 'plan' };

export function ping(x, label = 'ploc', intensity = 0.5, ttl = 850) {
  _pings.push({ x, label, i0: intensity, ttl, age: 0 });
}

export function init() {
  if (_bar) return;
  const vp = document.querySelector('.viewport') ?? document.body;
  _bar = document.createElement('div'); _bar.id = 'sound-bar';
  _bar.innerHTML = '<div id="sb-filters"></div><div id="sb-sub"></div><canvas id="sb-canvas"></canvas>';
  vp.appendChild(_bar);
  _canvas = _bar.querySelector('#sb-canvas');
  _ctx = _canvas.getContext('2d');
  _sub = _bar.querySelector('#sb-sub');
  _filters = _bar.querySelector('#sb-filters');
  _buildFilters();
  _running = true;
  requestAnimationFrame(_loop);
}

function _buildFilters() {
  _filters.innerHTML = '';
  for (const f of FILTER_KINDS) {
    const b = document.createElement('button');
    b.className = 'sb-flt on'; b.textContent = f.icon; b.title = f.title;
    b.onclick = () => {
      if (_filterOff.has(f.key)) _filterOff.delete(f.key); else _filterOff.add(f.key);
      b.classList.toggle('on', !_filterOff.has(f.key));
    };
    _filters.appendChild(b);
  }
}

// --- Subtitles (NPC speech, whispers) — legibility gated by identification ----
// id-1 → indistinct murmur · id-2 → random words erased · id-3+ → clear.
export function say(text, ms = 4200) {
  if (!_sub) return;
  const idMax = Math.max(Faculties.tierMax('ouie-identification', 'gauche'),
                         Faculties.tierMax('ouie-identification', 'droite'));
  _sub.textContent = idMax >= 3 ? text : idMax === 2 ? _holed(text) : idMax === 1 ? '…murmures…' : '';
  if (!_sub.textContent) return;
  _sub.classList.add('on');
  _sub_until = ms;
}

// Deterministically erase ~40% of words (stable per text — no flicker).
function _holed(text) {
  let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return text.split(' ').map((w, i) => (((h >> (i % 28)) & 3) === 0 ? '▁'.repeat(Math.max(2, w.length - 1)) : w)).join(' ');
}

// --- Sound sources this frame --------------------------------------------------
// Each = { x (true position 0..1), base, label, kind, name }.
function _emitters() {
  const out = [];
  const body = WS.player?.body;

  const heart = body?.slots?.heart;
  if (heart?.organId && (heart.hp ?? 1) > 0)
    out.push({ x: 0.5, base: 0.3, kind: 'heart', name: 'battement' });

  const hn = WS.player?.noise ?? 0;
  if (hn > 0.05) {
    const famine = HungerSystem.stage() === 'famine';
    out.push({ x: 0.64, base: Math.min(1, hn), kind: 'hunger', name: famine ? 'VACARME' : 'gargouillis' });
  }

  const room = currentRoom();
  const cue = STRUCT_CUE[room?._structKind];
  if (cue) {
    const side = room?._structSide;
    const x = side === 'left' ? 0.25 : side === 'right' ? 0.75 : 0.5;
    out.push({ x, base: cue.i, kind: cue.tremor ? 'tremor' : 'struct', name: cue.label ?? '' });
  }

  // Mobs — their organs make the noise (bruyant/calme).
  const ids = (room?.mobIds ?? []).filter((id) => WS.mobs.get(id)?.lifecycle === 'active');
  ids.forEach((id, k) => {
    const mob = WS.mobs.get(id);
    const son = Faculties.sonorityOf(mob.body);
    if (son <= 0) return;
    const x = (k + 1) / (ids.length + 1);
    out.push({ x, base: Math.min(1, 0.35 + 0.2 * son), kind: 'mob', name: mob.name ?? 'créature' });

    // Plan CHANNELLED BY OUÏE (§2.4): the enemy's telegraph is a sound too.
    if (TurnCombat.isActive() && Faculties.has('plan')) {
      const plan = TurnCombat.telegraphOf(id);
      if (plan.length) {
        const dmg = Faculties.has('plan-degats') ? ` −${plan.reduce((a, p) => a + (p.amount ?? 0), 0)}` : '';
        out.push({ x, base: 0.3, kind: 'plan', name: `⚠ ${plan[0].label}${dmg}` });
      }
    }
  });
  return out;
}

function _heartBeat(tSec) {
  const h = WS.player?.body?.slots?.['heart'];
  if (!h?.organId || (h.hp ?? 1) <= 0) return 0;
  const period = organResolver(h.organId)?.pulse ?? 1.1;
  return Math.pow(Math.max(0, Math.sin((2 * Math.PI * tSec) / period)), 10);
}

// Per-side hearing profile, computed once per frame.
function _profile(side) {
  if (!Faculties.hears(side)) return null;
  const echo = Faculties.tiers('echolocation', side);
  const idTiers = Faculties.tiers('ouie-identification', side);
  const place = echo.includes(2) ? 2 : echo.includes(1) ? 1 : 0;   // 0=centre-stack
  const clarity = place === 2 ? 1 : place === 1 ? 0.75 : 0.5;
  return { place, clarity, idTiers, hasFilters: idTiers.includes(4) };
}

// Where a source is DRAWN on a side: precise → x · approx → squeezed toward
// centre with a slow wobble · none → stacked at centre.
function _drawX(e, prof, tSec, idx) {
  if (prof.place === 2) return e.x;
  if (prof.place === 1) return 0.5 + (e.x - 0.5) * 0.45 + Math.sin(tSec * 0.7 + idx * 2.1) * 0.04;
  return 0.5 + Math.sin(idx * 1.7) * 0.015;   // all piled at the centre
}

// The stacked label lines for a source (DISPLAY EVERYTHING — one line per active
// identification reading).
function _labels(e, prof) {
  if (e.kind === 'tremor') return [];
  if (e.kind === 'plan') return prof.idTiers.length ? [e.name] : [];   // plan text needs SOME identification
  const lines = [];
  for (const t of prof.idTiers) {
    if (t === 1) lines.push(e.kind === 'mob' || e.kind === 'struct' ? 'créature ?' : 'bruit');
    else if (t === 2) lines.push(_holed(e.name));
    else if (t === 3) lines.push(e.name);
    // 4 = filters (UI, not a text reading)
  }
  return [...new Set(lines)];
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
  const COL = '#8a7658';
  const beat = _heartBeat(tSec);
  const deaf = HungerSystem.isDeaf();

  const profL = deaf ? null : _profile('gauche');
  const profR = deaf ? null : _profile('droite');
  const showFilters = !!(profL?.hasFilters || profR?.hasFilters);
  if (_filters) _filters.style.display = showFilters ? '' : 'none';

  let emitters = _emitters();
  // transient pings are external ambiance
  for (let i = _pings.length - 1; i >= 0; i--) {
    const p = _pings[i]; p.age += dt;
    if (p.age >= p.ttl) { _pings.splice(i, 1); continue; }
    emitters.push({ x: p.x, base: p.i0 * (1 - p.age / p.ttl), kind: 'ping', name: p.label });
  }
  // Famine: your own din drowns EVERYTHING external.
  if (deaf) emitters = emitters.filter((e) => e.kind === 'hunger');
  // id-4 filters
  if (showFilters) emitters = emitters.filter((e) => !_filterOff.has(KIND_GROUP[e.kind] ?? 'amb'));

  for (const e of emitters) e.i = e.kind === 'heart' ? e.base * (0.12 + 0.5 * beat) : e.base;

  // Split each emitter onto the sides that hear it. Centre sources (x≈0.5) are
  // CUT IN TWO (§2.1) — half intensity per hearing side.
  const draw = [];   // {x, i, labels, side}
  const sides = [['gauche', profL, (x) => x < 0.55], ['droite', profR, (x) => x > 0.45]];
  emitters.forEach((e, idx) => {
    const centre = e.x > 0.45 && e.x < 0.55;
    for (const [side, prof, inSide] of sides) {
      if (!prof || (!deaf && !inSide(e.x))) continue;
      if (centre && profL && profR && !deaf) {
        // both ears: each side renders its half at half intensity, nudged apart
        const dx = side === 'gauche' ? -0.03 : 0.03;
        draw.push({ x: 0.5 + dx, i: e.i * 0.5, labels: _labels(e, prof), prof, idx });
      } else {
        draw.push({ x: _drawX(e, prof, tSec, idx), i: e.i, labels: _labels(e, prof), prof, idx });
        if (!centre) break;   // non-centre source belongs to ONE side
      }
    }
  });
  // deaf famine: hunger renders regardless of ears (it's internal)
  if (deaf) {
    draw.length = 0;
    emitters.forEach((e, idx) => draw.push({ x: e.x, i: e.i, labels: [e.name], prof: { clarity: 1 }, idx }));
  }

  // ONE continuous line; each half only waves if that ear works.
  _ctx.beginPath();
  for (let x = 0; x <= W; x += 2) {
    const sideProf = x < W / 2 ? profL : profR;
    let y = mid;
    if (deaf || sideProf) {
      const clarity = deaf ? 1 : sideProf.clarity;
      const fuzz = (1 - clarity) * 3.5;
      for (const d of draw) {
        const ex = d.x * W, w = W * 0.045, amp = d.i * (H * 0.26) * clarity;
        const env = Math.exp(-Math.pow((x - ex) / w, 2));
        if (env > 0.002) {
          y -= amp * env * Math.sin((x - ex) * 0.28 - tSec * 9);
          y += env * fuzz * Math.sin(x * 0.9 + tSec * 17);
        }
      }
    }
    if (x === 0) _ctx.moveTo(x, y); else _ctx.lineTo(x, y);
  }
  const anyEar = deaf || profL || profR;
  _ctx.strokeStyle = COL; _ctx.lineWidth = 1.2;
  _ctx.globalAlpha = anyEar ? 0.55 : 0.15;
  _ctx.stroke(); _ctx.globalAlpha = 1;

  // Stacked labels (DISPLAY EVERYTHING) — one line per reading, bottom-up.
  for (const d of draw) {
    if (!d.labels?.length) continue;
    const ex = d.x * W;
    const clarity = d.prof.clarity ?? 1;
    const amp = d.i * (H * 0.26) * clarity;
    const bob = Math.sin(tSec * 4 + d.x * 12) * 2;
    for (let li = 0; li < d.labels.length; li++) {
      const size = (8 + d.i * 8) * (0.72 + 0.28 * clarity) * (li === 0 ? 1 : 0.82);
      _ctx.font = `600 ${size}px "IBM Plex Mono", "Courier New", monospace`;
      _ctx.textAlign = 'center';
      _ctx.fillStyle = COL;
      _ctx.globalAlpha = (0.32 + 0.45 * Math.min(1, d.i)) * clarity * (li === 0 ? 1 : 0.7);
      _ctx.fillText(d.labels[li], ex, mid - amp - 6 - li * (size + 2) + bob);
    }
    _ctx.globalAlpha = 1;
  }

  requestAnimationFrame(_loop);
}
