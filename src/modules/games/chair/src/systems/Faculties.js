import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';

// Perception is 100% TAG-based (TDD §2). No scalar levels. Every organ carries
// `tags: [...]`; capabilities are the union over LIVING organs. Five tag shapes:
//
//  • side tags        — `gauche`/`droite`, INJECTED by the slot (never authored).
//  • capability tags  — boolean presence (`vue`, `plan`, `memoire`…).
//  • numbered families — `fam-N` merge like BINARY CARRY (§2.1): a level-N tag is
//    worth 2^(N-1) units; sum the units; the ACTIVE tiers are the set bits.
//    (`X-1`×2 = `X-2` · `X-1`×3 = `X-2`+`X-1` · `X-1`×4 = `X-3`.)
//  • gauge tags       — count linearly, ±10% each, NO cap (`digestion`, `bruyant`/
//    `calme`, `luminescent`/`sombre`, `compatible`/`incompatible`, `pompe`…).
//  • marker tags      — boolean on entities (`arcane`) or organs (`memoire`…).
//
// Lateralisation: Vue AND Ouïe are per-side (left organ → left half). Lucidité
// (plan/map) & Digestion are global. `ouie-detection` acts on the MAP (no screen
// side) → deliberately GLOBAL (the one documented exception).

const SIDE_TAG = { eye_l: 'gauche', eye_r: 'droite', ear_l: 'gauche', ear_r: 'droite' };

// Highest defined tier per numbered family (bits above collapse onto the max).
const FAMILY_MAX = { 'echolocation': 4, 'ouie-identification': 4, 'ouie-detection': 5, 'map': 4 };

function _alive(slots, key) { const s = slots?.[key]; return !!s?.organId && (s.hp == null || s.hp > 0); }

// Living organs of a body as [{tags, side}] bundles. side=null → central organ
// (matches ANY side query).
function _bundlesOf(body) {
  const slots = body?.slots ?? {};
  const out = [];
  for (const key of Object.keys(slots)) {
    if (!_alive(slots, key)) continue;
    out.push({ tags: organResolver(slots[key].organId)?.tags ?? [], side: SIDE_TAG[key] ?? null });
  }
  return out;
}
const _bundles = () => _bundlesOf(WS.player?.body);
const _sideOk = (b, side) => !side || b.side == null || b.side === side;

// --- Core queries ------------------------------------------------------------

// Tag present on any living organ (optionally restricted to a side).
export function has(tag) { return _bundles().some((b) => b.tags.includes(tag)); }
export function hasOn(tag, side) { return _bundles().some((b) => _sideOk(b, side) && b.tags.includes(tag)); }

// Tag granted by ONE organ that also carries every prerequisite. A side name
// ('gauche'/'droite') as prerequisite = the organ must sit on that side.
export function grants(tag, ...reqs) {
  return _bundles().some((b) =>
    b.tags.includes(tag) &&
    reqs.every((r) => (r === 'gauche' || r === 'droite') ? _sideOk(b, r) : b.tags.includes(r)));
}

// Gauge count: total occurrences of `tag` (repeats stack), optionally per side.
export function count(tag, side = null) {
  let n = 0;
  for (const b of _bundles()) if (_sideOk(b, side)) for (const t of b.tags) if (t === tag) n++;
  return n;
}
// Opposing-pair net value (can go negative).
export function net(plusTag, minusTag, side = null) { return count(plusTag, side) - count(minusTag, side); }

// --- Numbered families: the binary-carry merge (§2.1) -------------------------

function _units(family, side) {
  const re = new RegExp(`^${family}-(\\d+)$`);
  let u = 0;
  for (const b of _bundles()) {
    if (!_sideOk(b, side)) continue;
    for (const t of b.tags) { const m = t.match(re); if (m) u += 2 ** (Number(m[1]) - 1); }
  }
  return u;
}
// Active tiers of a family = set bits of the unit sum (capped on the family max).
export function tiers(family, side = null) {
  const max = FAMILY_MAX[family] ?? 8;
  const u = _units(family, side);
  const out = new Set();
  for (let lvl = 1; lvl <= 30; lvl++) if (u & (1 << (lvl - 1))) out.add(Math.min(lvl, max));
  return [...out].sort((a, b) => a - b);
}
export function tierMax(family, side = null) { const t = tiers(family, side); return t.length ? t[t.length - 1] : 0; }
export function hasTier(family, lvl, side = null) { return tiers(family, side).includes(lvl); }

// --- VUE (lateralised) ---------------------------------------------------------

export function seesOn(side) { return grants('vue', side); }

// --- OUÏE (lateralised) ---------------------------------------------------------

export function hears(side) { return grants('ouie', side); }
export function hearsAny() { return hears('gauche') || hears('droite'); }

// --- LUCIDITÉ · Plan (global brain, CHANNELLED by a sense — §2.4) ---------------

export function planChannels() {
  return { vue: seesOn('gauche') || seesOn('droite'), ouie: hearsAny() };
}
export function planActive() {
  const c = planChannels();
  return has('plan') && (c.vue || c.ouie);
}

// --- LUCIDITÉ · Map (global brain — §2.5) ---------------------------------------

// 0 = LOCKED (greyed, can't even place yourself) · 1..4 per TDD.
export function mapLevel() { return tierMax('map'); }
// Prediction range the map grants (feeds ouie-detection): map-2 → 1, map-3 → 2, map-4 → 3.
export function mapPredictRange() { const l = mapLevel(); return l >= 2 ? l - 1 : 0; }
export function remembers() { return has('memoire'); }

// Detection level (GLOBAL exception — acts on the map, which has no screen side).
export function detectionLevel() { return tierMax('ouie-detection'); }

// --- SONORITÉ (emission) — from `bruyant`/`calme` on the body's organs ----------

export function sonorityOf(body) {
  let n = 0;
  for (const b of _bundlesOf(body)) for (const t of b.tags) { if (t === 'bruyant') n++; else if (t === 'calme') n--; }
  return Math.max(0, n);
}

// --- LUMIÈRE — `luminescent`/`sombre` net on the player (§2.7) ------------------
// Positive → backup glow when the torch dies. Negative → invisibility stacks
// (stored, inert for now).

export function lightNet() { return net('luminescent', 'sombre'); }

// --- INVISIBILITÉ (entities — §2.7) ---------------------------------------------
// Each `invisible` tag = −10% opacity; 10 → fully invisible. Legacy mobs carry a
// boolean `invisible` → treated as 10 stacks.

export function invisibleStacksOf(entity) {
  const fromTags = (entity?.tags ?? []).filter((t) => t === 'invisible').length;
  return fromTags > 0 ? fromTags : (entity?.invisible === true ? 10 : 0);
}

// Fully-invisible entities need `vue-invisible` on the matching side (a seeing
// organ), or ANY echolocation if they emit sound. Partially invisible things are
// simply faint — everyone "perceives" them.
export function perceivesMob(mob, side = null) {
  if (invisibleStacksOf(mob) < 10) return true;
  const seesInvis = side ? grants('vue-invisible', 'vue', side) : grants('vue-invisible', 'vue');
  if (seesInvis) return true;
  if (tierMax('echolocation') >= 1 && sonorityOf(mob.body) > 0) return true;
  return false;
}

// Render opacity for an entity (1 = opaque). The invisibility gauge applies even
// PARTIALLY (a 4-stack mob is faint for everyone); only a true counter-measure
// (vue-invisible on the right side, or echolocation on a noisy body) restores it.
export function mobOpacity(mob, side = null) {
  const stacks = invisibleStacksOf(mob);
  if (stacks <= 0) return 1;
  const seesInvis = side ? grants('vue-invisible', 'vue', side) : grants('vue-invisible', 'vue');
  if (seesInvis) return 1;
  if (tierMax('echolocation') >= 1 && sonorityOf(mob.body) > 0) return 1;
  return Math.max(0, 1 - 0.1 * stacks);
}

// --- GREFFE — `compatible`/`incompatible`/`hyper-compatible` (§2.7b) ------------
// Cost in ticks for grafting a given ORGAN DEF: base ± its own tags, floor 1.
// `hyper-compatible` is the only road to 0.

export function graftTicks(organDef, base = 5) {
  const tags = organDef?.tags ?? [];
  if (tags.includes('hyper-compatible')) return 0;
  const delta = tags.filter((t) => t === 'incompatible').length - tags.filter((t) => t === 'compatible').length;
  return Math.max(1, base + delta);
}
