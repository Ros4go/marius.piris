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
const GAME_MANAGED = ['no-eye', 'eye-l-dead', 'eye-r-dead', 'eye-l-dim', 'eye-r-dim', 'no-color-l', 'no-color-r',
                      'limp', 'heart-alive', 'lum-out', 'lum-night', 'lum-glow', 'spider-l', 'spider-r'];

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

  for (const [slotKey, slot] of Object.entries(body.slots)) {
    const hp    = slot ? (slot.hp ?? 1) : 0;
    const alive = hp > 0;

    if (slotKey === 'legs' && !alive) _game?.classList.add('limp');

    // Organ overlay FX on scene
    if (alive && slot) {
      const def = organResolver(slot.organId);
      const cls = OVERLAY_FX[def?.visual?.overlay];
      if (cls) _scene?.classList.add(cls);
    }
  }

  // Per-side VUE (tags): no `vue` on that side = dark half; `vue` but no light
  // (torch out, no `vue-nocturne` there) = penumbra; lit or night-sighted = clear.
  const lit = (WS.light?.current ?? 1.0) > 0;
  const seesL = Faculties.hasOn('vue', 'gauche');
  const seesR = Faculties.hasOn('vue', 'droite');
  if (!seesL)                                                    _game?.classList.add('eye-l-dead');
  else if (!(lit || Faculties.hasOn('vue-nocturne', 'gauche')))  _game?.classList.add('eye-l-dim');
  if (!seesR)                                                    _game?.classList.add('eye-r-dead');
  else if (!(lit || Faculties.hasOn('vue-nocturne', 'droite')))  _game?.classList.add('eye-r-dim');
  if (!seesL && !seesR) _game?.classList.add('no-eye');

  // Colour vision, LATERALISED: each half reads in greyscale unless an eye on that
  // side carries `vue-couleur` (a monochrome eye greys its own half).
  if (seesL && !Faculties.hasOn('vue-couleur', 'gauche')) _game?.classList.add('no-color-l');
  if (seesR && !Faculties.hasOn('vue-couleur', 'droite')) _game?.classList.add('no-color-r');

  // `vue-spider` quirk: that half is subdivided into 4 identical facets (visual
  // approximation — a faceted lens overlay; a true 4× re-render needs a compositor).
  if (Faculties.hasOn('vue-spider', 'gauche')) _game?.classList.add('spider-l');
  if (Faculties.hasOn('vue-spider', 'droite')) _game?.classList.add('spider-r');

  // `luminescent`/`sombre` net light (§2.7): stored for future stealth; a net
  // NEGATIVE glow converts into invisibility stacks on the player (inert for now).
  const light = Faculties.lightNet();
  WS.player.invisibleStacks = Math.max(0, -light);

  // Heartbeat pulse — alive heart drives CSS lub-dub animation, at the beat
  // period defined on the heart organ (data-oriented: organs.json "pulse").
  const heartSlot = body.slots['heart'];
  if (heartSlot && (heartSlot.hp === null || heartSlot.hp > 0)) {
    _game?.classList.add('heart-alive');
    const beat = organResolver(heartSlot.organId)?.pulse ?? 1.1;
    _game?.style.setProperty('--hb-dur', `${beat}s`);
  }

  // Torch exhaustion: total darkness — UNLESS `vue-nocturne` (amber night sight)
  // or a net-POSITIVE `luminescent` body (a faint organic glow, weaker than night
  // sight but better than blackness).
  if ((WS.light?.current ?? 1.0) <= 0) {
    _game?.classList.add(Faculties.has('vue-nocturne') ? 'lum-night' : light > 0 ? 'lum-glow' : 'lum-out');
  }
}
