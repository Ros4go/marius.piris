// La Ligne — spatial audio canvas visualizer.
// 3 channels: G (left), FACE (center), D (right).
// excite(channel, amount) → bumps amplitude, decays over time.

const _canvas = document.getElementById('slc');
const _ctx    = _canvas ? _canvas.getContext('2d') : null;

// Channel indices: G=0, FACE=1, D=2
const CH = { G: 0, FACE: 1, D: 2 };
// Channel x-position (0–1) in canvas
const CH_X = { G: 0.12, FACE: 0.5, D: 0.88 };

const _levels = [0, 0, 0];
// { text, x, intensity, life } — life 1→0 over ~3s at 60fps
const _sounds = [];
let _t    = 0;
let _raf  = null;

// Excite a channel (G, FACE, D) by amount 0–1
export function excite(channel, amount) {
  const idx = CH[channel] ?? 1;
  _levels[idx] = Math.min(1, (_levels[idx] ?? 0) + amount);
}

// Add a text label to La Ligne at the given channel position.
// intensity 0–1 controls opacity and font size.
export function addSound(channel, text, intensity = 0.5) {
  const x = CH_X[channel] ?? 0.5;
  _sounds.push({ text, x, intensity: Math.min(1, intensity), life: 1.0 });
  excite(channel, intensity * 0.5);
}

export function start() {
  if (_raf || !_ctx) return;
  _loop();
}

export function stop() {
  if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
}

function _loop() {
  _raf = requestAnimationFrame(_loop);
  _resize();
  _draw();
  // Decay amplitudes
  _levels[0] *= 0.90;
  _levels[1] *= 0.90;
  _levels[2] *= 0.90;
  // Decay sound labels (~3s at 60fps)
  for (let i = _sounds.length - 1; i >= 0; i--) {
    _sounds[i].life -= 0.0055;
    if (_sounds[i].life <= 0) _sounds.splice(i, 1);
  }
  _t++;
}

function _resize() {
  const parent = _canvas.parentElement;
  if (!parent) return;
  const w = parent.clientWidth  || 200;
  const h = parent.clientHeight || 22;
  if (_canvas.width !== w || _canvas.height !== h) {
    _canvas.width  = w;
    _canvas.height = h;
  }
}

function _draw() {
  const W = _canvas.width;
  const H = _canvas.height;

  _ctx.clearRect(0, 0, W, H);

  // Base flat line
  _ctx.strokeStyle = 'rgba(100,84,56,0.35)';
  _ctx.lineWidth   = 1;
  _ctx.beginPath();
  _ctx.moveTo(0, H / 2);
  _ctx.lineTo(W, H / 2);
  _ctx.stroke();

  // Waveform driven by channel levels
  const maxAmp = (H / 2) * 0.85;
  _ctx.strokeStyle = `rgba(196,127,51,${0.4 + _peakLevel() * 0.6})`;
  _ctx.lineWidth   = 1.5;
  _ctx.beginPath();

  for (let i = 0; i <= W; i++) {
    const t   = i / W;
    const amp = _interpLevel(t) * maxAmp;
    const y   = H / 2 + amp * Math.sin(i * 0.10 + _t * 0.08);
    if (i === 0) _ctx.moveTo(i, y);
    else         _ctx.lineTo(i, y);
  }
  _ctx.stroke();

  // Sound labels — text floating above the waveform
  _ctx.textBaseline = 'bottom';
  _ctx.textAlign    = 'center';
  for (const s of _sounds) {
    const alpha = Math.min(1, s.life * 2) * s.intensity;
    if (alpha < 0.01) continue;
    const sz = Math.round(7 + s.intensity * 4);
    _ctx.font      = `${sz}px monospace`;
    _ctx.fillStyle = `rgba(184,168,134,${alpha})`;
    _ctx.fillText(s.text, s.x * W, H * 0.48);
  }
}

// Interpolate channel level at position t (0=far left, 0.5=center, 1=far right)
function _interpLevel(t) {
  if (t <= 0.33) {
    const p = t / 0.33;
    return _levels[0] * (1 - p) + _levels[1] * p;
  } else if (t <= 0.67) {
    return _levels[1];
  } else {
    const p = (t - 0.67) / 0.33;
    return _levels[1] * (1 - p) + _levels[2] * p;
  }
}

function _peakLevel() {
  return Math.max(_levels[0], _levels[1], _levels[2]);
}
