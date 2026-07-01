// Reads equipped organs → applies/removes CSS classes on .game and .scene.
// Per-eye support: eye_l dead → .eye-l-dead, eye_r dead → .eye-r-dead
// Organ overlays: applied to .scene with bfx-* class names matching scene.css
// HUM visual tiers: .hm-low (HUM<75), .hm-mid (HUM<50), .hm-vlow (HUM<25), .hm-critical (HUM<5)

import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import * as Faculties from '../systems/Faculties.js';

const _game  = document.querySelector('.game');
const _scene = document.querySelector('.scene');

// Classes managed on .game
const GAME_MANAGED = ['no-eye', 'eye-l-dead', 'eye-r-dead', 'eye-l-dim', 'eye-r-dim', 'limp', 'heart-alive', 'lum-out', 'lum-night'];

// Organ overlay → CSS class on .scene (matches scene.css bfx-* rules)
const OVERLAY_FX = {
  'hex-fragment': 'bfx-hex-frag',
  'lich-pulse':   'bfx-lich-pulse',
  'spider-crawl': 'bfx-spider-crawl',
  'stone-crack':  'bfx-stone-crack',
};
const OVERLAY_CLASSES = Object.values(OVERLAY_FX);

export function apply() {
  const body = WS.player.body;
  if (!body) return;

  // Reset all managed classes
  for (const c of GAME_MANAGED)  _game?.classList.remove(c);
  for (const c of OVERLAY_CLASSES) _scene?.classList.remove(c);

  let eyeL = false, eyeR = false;

  for (const [slotKey, slot] of Object.entries(body.slots)) {
    const hp    = slot ? (slot.hp ?? 1) : 0;
    const alive = hp > 0;

    if (slotKey === 'eye_l')  eyeL = alive;
    if (slotKey === 'eye_r')  eyeR = alive;
    if (slotKey === 'legs' && !alive) _game?.classList.add('limp');

    // Organ overlay FX on scene
    if (alive && slot) {
      const def = organResolver(slot.organId);
      const cls = OVERLAY_FX[def?.visual?.overlay];
      if (cls) _scene?.classList.add(cls);
    }
  }

  // Per-side VUE by level: 0 = dark half, 1 = penumbra (eye but no torch), 2+ = clear.
  const vl = Faculties.vue('l'), vr = Faculties.vue('r');
  if (vl <= 0)      _game?.classList.add('eye-l-dead');
  else if (vl === 1) _game?.classList.add('eye-l-dim');
  if (vr <= 0)      _game?.classList.add('eye-r-dead');
  else if (vr === 1) _game?.classList.add('eye-r-dim');
  if (vl <= 0 && vr <= 0) _game?.classList.add('no-eye');

  // Heartbeat pulse — alive heart drives CSS lub-dub animation, at the beat
  // period defined on the heart organ (data-oriented: organs.json "pulse").
  const heartSlot = body.slots['heart'];
  if (heartSlot && (heartSlot.hp === null || heartSlot.hp > 0)) {
    _game?.classList.add('heart-alive');
    const beat = organResolver(heartSlot.organId)?.pulse ?? 1.1;
    _game?.style.setProperty('--hb-dur', `${beat}s`);
  }

  // Torch exhaustion: total darkness — UNLESS you have vision_nocturne, which
  // lets you see in the dark (amber tint) instead of going fully black.
  if ((WS.light?.current ?? 1.0) <= 0) {
    _game?.classList.add(Faculties.hasKeyword('vision_nocturne') ? 'lum-night' : 'lum-out');
  }
}
