// FXSystem — interpréteur générique des effets visuels décrits dans content/fx.json.
// AUCUNE valeur d'effet codée en dur ici : tout vient de la data (designers-first).
// Les animations one-shot utilisent la Web Animations API (keyframes = JSON pur).

import FX_RAW from '../../content/fx.json';

// Les clés "_doc" de fx.json sont de la documentation pour les designers,
// jamais des données — on les retire partout, récursivement.
function _stripDoc(node) {
  if (Array.isArray(node)) return node.map(_stripDoc);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) if (k !== '_doc') out[k] = _stripDoc(v);
    return out;
  }
  return node;
}
const FX = _stripDoc(FX_RAW);

// Remplace le token "$I" par une valeur numérique dans des keyframes JSON.
function _resolveKeyframes(keyframes, subs = {}) {
  return keyframes.map((kf) => {
    const out = {};
    for (const [k, v] of Object.entries(kf)) {
      out[k] = typeof v === 'string' && subs.I !== undefined && v.includes('$I')
        ? v.replaceAll('$I', String(subs.I)) : v;
    }
    return out;
  });
}

// Joue une anim data { keyframes, duration, easing } sur un élément.
export function play(el, anim, subs = {}) {
  if (!el || !anim?.keyframes) return null;
  return el.animate(_resolveKeyframes(anim.keyframes, subs), {
    duration: anim.duration ?? 300, easing: anim.easing ?? 'ease-out',
  });
}

// ── Vision : filtre combiné des yeux vivants (fx.json "vision" + "visionCombos")
export function visionFilter(body) {
  const eyes = [];
  for (const key of ['eye_l', 'eye_r']) {
    const slot = body?.slots?.[key];
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    if (FX.vision[slot.organId]) eyes.push(slot.organId);
  }
  if (!eyes.length) return '';
  const comboKey = [...new Set(eyes)].sort().join('+');
  if (FX.visionCombos[comboKey]) return FX.visionCombos[comboKey];
  return [...new Set(eyes)].map((id) => FX.vision[id]).join(' ');
}

// ── Flash de dégâts selon la peau (fx.json "hitFlash")
export function hitFlash(viewportEl, skinId, dmg = 1) {
  const def = FX.hitFlash[skinId] ?? FX.hitFlash.default;
  if (!def) return;
  if (def.minDmg && dmg < def.minDmg) return;   // ex: carapace absorbe les petits coups
  play(viewportEl, def);
}

// ── Pulsation cardiaque (fx.json "beat")
export function beatIntensity(pool) {
  return Math.min(1, FX.beat.base + pool * FX.beat.perPool);
}
export function beatPulse(overlayEl, pool) {
  play(overlayEl, FX.beat.overlay, { I: beatIntensity(pool).toFixed(2) });
}

// ── Perte d'organe : anim one-shot + classe persistante (fx.json "organLost")
export function organLost(sceneEl, gameEl, organType) {
  const def = FX.organLost[organType];
  if (!def) return;
  if (def.anim) play(sceneEl, def.anim);
  if (def.persist && gameEl) gameEl.classList.add(def.persist);
}

// ── Overlays d'organes : organs.json visual.overlay → classe CSS
export function overlayClass(overlayId) { return FX.overlays[overlayId] ?? null; }
export const OVERLAY_CLASSES = Object.values(FX.overlays);

// Accès brut (atelier / éditeur FX futur)
export function data() { return FX; }
