import { WS } from '../WorldState.js';
import { organResolver, balance as getBalance } from '../registry.js';

const _cfg = () => getBalance().faculties ?? { torchVue: 1, senseLucidite: 0.25, palierMax: 3 };

// Faculties — perception LEVELS computed from the player's organs (see TDD §2).
// Two axes: a scalar level (stacks; Vue/Ouïe are lateralised per side) and
// discrete keywords carried by special organs. Humans sit low on purpose.

const EYE = { l: 'eye_l', r: 'eye_r' };
const EAR = { l: 'ear_l', r: 'ear_r' };

function _alive(key) { const s = WS.player?.body?.slots?.[key]; return !!s?.organId && (s.hp == null || s.hp > 0); }
function _def(key)   { const s = WS.player?.body?.slots?.[key]; return s?.organId ? organResolver(s.organId) : null; }
function _sense(key, faculty) { return _alive(key) ? (_def(key)?.senses?.[faculty] ?? 0) : 0; }
function _keywords(key) { return _alive(key) ? (_def(key)?.keywords ?? []) : []; }
function _torchLit() { return (WS.light?.current ?? 1) > 0; }

// --- VUE (per side; needs an eye on that side, torch amplifies) ------------
export function vue(side) {
  if (!_alive(EYE[side])) return 0;                    // no eye on this side → dark
  return _sense(EYE[side], 'vue') + (_torchLit() ? _cfg().torchVue : 0);
}
export function vueMax() { return Math.max(vue('l'), vue('r')); }

// --- OUÏE (per side; needs an ear on that side) ---------------------------
export function ouie(side) { return _alive(EAR[side]) ? _sense(EAR[side], 'ouie') : 0; }
export function ouieMax() { return Math.max(ouie('l'), ouie('r')); }

// --- LUCIDITÉ (brain-driven; eyes/ears feed a little) ---------------------
export function lucidite() {
  let lvl = _sense('brain', 'lucidite');
  const c = _cfg().senseLucidite;
  for (const k of ['eye_l', 'eye_r', 'ear_l', 'ear_r']) if (_alive(k)) lvl += c;
  return lvl;
}
// Combat-plan clarity tier: 0 vague · 1 attack+target · 2 +damage · 3 +weak point
export function luciditePalier() { return Math.max(0, Math.min(_cfg().palierMax, Math.floor(lucidite()))); }

// --- DIGESTION (stomach + mouth/tongue) -----------------------------------
export function digestion() { return _sense('stomach', 'digestion') + _sense('tongue', 'digestion'); }

// --- CARTOGRAPHIE — how many rooms of LAYOUT you sense around you -------------
// Driven by LUCIDITÉ (brain, aided by eyes/ears): you deduce the shape of nearby
// corridors (not their content — that's Ouïe). Lucidité 3 → 1 room, 4 → 2 rooms.
export function mapRange() {
  const l = lucidite();
  return l >= 4 ? 2 : l >= 3 ? 1 : 0;
}

// --- SONORITÉ (any body) — noise = sum of its living organs' sonorité -------
// Mobs and the player emit sound the SAME way: through their organs. No special
// "mob sonority" system — a mob is loud because it has loud organs.
export function sonorityOf(body) {
  let s = 0;
  for (const slot of Object.values(body?.slots ?? {})) {
    if (!slot?.organId || (slot.hp ?? 1) <= 0) continue;
    s += organResolver(slot.organId)?.sonorite ?? 0;
  }
  return s;
}

// Can you perceive this mob at all? Invisible mobs need `voir_invisible`, OR
// echolocation if the mob emits sound (noisy-invisible → heard even unseen).
export function perceivesMob(mob) {
  if (!mob?.invisible) return true;
  if (hasKeyword('voir_invisible')) return true;
  if (hasKeyword('echolocation') && sonorityOf(mob.body) > 0) return true;
  return false;
}

// --- Keywords (optionally on a given side for lateralised senses) ----------
const KW_SLOTS = { voir_invisible: EYE, vision_nocturne: EYE, vision_couleur: EYE, vision_fragmentee: EYE, echolocation: EAR };
export function hasKeyword(kw, side = null) {
  const map = KW_SLOTS[kw];
  if (side && map) return _keywords(map[side]).includes(kw);
  const slots = map ? Object.values(map) : ['brain'];
  return slots.some((s) => _keywords(s).includes(kw)) || _keywords('brain').includes(kw);
}
