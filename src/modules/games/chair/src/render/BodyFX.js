// Reads equipped organs → applies/removes CSS classes on .game and .scene.
// Les visuels PAR TAG (moitié noire de vue, désaturation de vue-couleur, pénombre
// de vue-nocturne, facettes de vue-spider…) sont définis en DATA dans tags.json
// ("visuel", modes present/absent) et posés par TagFX.apply() en queue — ici ne
// restent que les états d'ORGANES (cœur, jambes, overlays fx.json) et les
// synthèses multi-sources (no-eye, teintes lum-* liées à la torche).

import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import * as Faculties from '../systems/Faculties.js';
import * as FXSystem from './FXSystem.js';
import * as TagFX from './TagFX.js';

// Capture PARESSEUSE : le DOM du viewport peut être injecté après l'import
// du module (ViewportDOM.build), donc pas de querySelector au chargement.
let _gameEl = null, _sceneEl = null;
const gameEl  = () => (_gameEl  ??= document.querySelector('.game'));
const sceneEl = () => (_sceneEl ??= document.querySelector('.scene'));

// Classes managed on .game (celles des tags — eye-*-dead/dim, no-color-*, spider-* —
// appartiennent à TagFX qui gère son propre diff)
const GAME_MANAGED = ['no-eye', 'limp', 'heart-alive', 'lum-out', 'lum-night', 'lum-glow'];

// Organ overlay → CSS class on .scene : mapping en data (fx.json "overlays")
const OVERLAY_CLASSES = FXSystem.OVERLAY_CLASSES;

export function apply() {
  const body = WS.player.body;
  if (!body) return;
  const _game  = gameEl();
  const _scene = sceneEl();

  // Reset all managed classes
  for (const c of GAME_MANAGED)  _game?.classList.remove(c);
  for (const c of OVERLAY_CLASSES) _scene?.classList.remove(c);

  for (const [slotKey, slot] of Object.entries(body.slots)) {
    const hp    = slot ? (slot.hp ?? 1) : 0;
    const alive = hp > 0;

    if (slotKey === 'legs' && !alive) _game?.classList.add('limp');

    // Organ overlay FX on scene (mapping data : fx.json "overlays")
    if (alive && slot) {
      const def = organResolver(slot.organId);
      const cls = FXSystem.overlayClass(def?.visual?.overlay);
      if (cls) _scene?.classList.add(cls);
    }
  }

  // Vision par côté : moitié noire (vue absente), pénombre (vue-nocturne absente la
  // nuit), désaturation (vue-couleur absente), facettes (vue-spider) — tout est en
  // DATA (tags.json "visuel", modes present/absent), posé par TagFX.apply() en queue.
  // Ne reste ici que la synthèse no-eye (les DEUX canaux morts à la fois).
  const seesL = Faculties.hasOn('vue', 'gauche');
  const seesR = Faculties.hasOn('vue', 'droite');
  if (!seesL && !seesR) _game?.classList.add('no-eye');

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

  // Primitives DATA des tags (tags.json "visuel"/"sonore") — classes, filtres par
  // côté, shaders custom. Gère son propre diff, ne touche pas à GAME_MANAGED.
  TagFX.apply();
}
