// SensoryFX — Perceptual effects driven by body stats and combat events.
// Manages: beat pulse, eye vision filters, hit flash, hunger vignette,
//          LUM aura, BRT CSS var, EKG line, heart_ultimate, lich_revive.
//
// Call init() once on boot, onBeat() each battle beat, applyBodyState() each render().

import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { on as onTrigger } from '../TriggerBus.js';

const VISION_CLASSES = ['vis-beast', 'vis-spider', 'vis-void', 'vis-beholder', 'vis-lich'];
const HIT_CLASSES    = ['hit-normal', 'hit-stone', 'hit-carapace', 'hit-lich', 'hit-acid'];

let _game          = null;
let _viewport      = null;
let _visionOverlay = null;
let _beatOverlay   = null;
let _htlbOverlay   = null;
let _lichOverlay   = null;
let _ekgLine       = null;
let _beatTimeout   = null;
let _hitTimeout    = null;

// ── Init ──────────────────────────────────────────────────────────────────────

export function init() {
  _game     = document.querySelector('.game');
  _viewport = document.querySelector('.viewport');
  if (!_game || !_viewport) return;

  _visionOverlay = _inject(_viewport, 'vision-overlay');
  _beatOverlay   = _inject(_viewport, 'beatpulse-overlay');
  _ekgLine       = _inject(_viewport, 'ekg-line');
  _htlbOverlay   = _inject(_game,     'heart-last-beat-overlay');
  _lichOverlay   = _inject(_game,     'lich-revive-overlay');

  onTrigger('ORGAN_DAMAGED',  _onOrganDamaged);
  onTrigger('HEART_ULTIMATE', _onHeartUltimate);
  onTrigger('LICH_REVIVE',    _onLichRevive);
}

// ── Per-beat (called from main.js _onBattleBeat) ─────────────────────────────

export function onBeat() {
  if (!_game) return;
  const heart = WS.player.body?.slots?.heart;
  const pool  = heart ? (organResolver(heart.organId)?.pool ?? 0) : 0;
  _doBeatPulse(pool);
  _doEkgPulse();
}

// ── Per-render (called from main.js render()) ─────────────────────────────────

export function applyBodyState() {
  if (!_game) return;
  const body = WS.player.body;
  if (!body) return;
  _applyVisionFilter(body);
  _applyEkgActive(body);
}

// ── Beat pulse (intensity scales with the heart's blood pool) ─────────────────

function _doBeatPulse(pool) {
  const intensity = Math.min(1, 0.25 + pool * 0.08);
  _game.style.setProperty('--beat-intensity', intensity.toFixed(2));

  _beatOverlay.classList.remove('bp-fire');
  void _beatOverlay.offsetWidth; // reflow → restarts animation
  _beatOverlay.classList.add('bp-fire');

  clearTimeout(_beatTimeout);
  _beatTimeout = setTimeout(() => _beatOverlay.classList.remove('bp-fire'), 160);
}

// ── EKG line ──────────────────────────────────────────────────────────────────

function _applyEkgActive(body) {
  const on = body.slots?.brain?.organId === 'brain_lich';
  _game.classList.toggle('ekg-active', on);
}

function _doEkgPulse() {
  if (!_ekgLine || !_game.classList.contains('ekg-active')) return;
  _ekgLine.classList.remove('ekg-pulse');
  void _ekgLine.offsetWidth;
  _ekgLine.classList.add('ekg-pulse');
}

// ── Vision filter (backdrop-filter on overlay div) ────────────────────────────

const EYE_VIS = {
  eye_beast:    'vis-beast',
  eye_spider:   'vis-spider',
  eye_void:     'vis-void',
  eye_beholder: 'vis-beholder',
  eye_lich:     'vis-lich',
};

function _applyVisionFilter(body) {
  if (!_visionOverlay) return;
  for (const c of VISION_CLASSES) _visionOverlay.classList.remove(c);

  for (const key of ['eye_l', 'eye_r']) {
    const slot = body.slots[key];
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const cls = EYE_VIS[slot.organId];
    if (cls) _visionOverlay.classList.add(cls);
  }
}


// ── Hit flash ─────────────────────────────────────────────────────────────────

const SKIN_HIT = {
  skin_stone:      'hit-stone',
  skin_carapace:   'hit-carapace',
  skin_lich:       'hit-lich',
  skin_alchimique: 'hit-acid',
};

function _onOrganDamaged(e) {
  if (e.target !== 'player' || !_viewport) return;
  const dmg   = e.data?.dmg ?? 1;
  const skinId = WS.player.body?.slots['skin']?.organId ?? null;

  // Carapace: supprime le flash si dégât minimal (absorbé)
  if (skinId === 'skin_carapace' && dmg <= 1) return;

  const cls = SKIN_HIT[skinId] ?? 'hit-normal';
  for (const c of HIT_CLASSES) _viewport.classList.remove(c);
  void _viewport.offsetWidth;
  _viewport.classList.add(cls);

  clearTimeout(_hitTimeout);
  _hitTimeout = setTimeout(() => {
    for (const c of HIT_CLASSES) _viewport.classList.remove(c);
  }, 210);
}

// ── Heart ultimate ────────────────────────────────────────────────────────────

function _onHeartUltimate() {
  if (!_htlbOverlay) return;
  _htlbOverlay.classList.remove('htlb-fire');
  void _htlbOverlay.offsetWidth;
  _htlbOverlay.classList.add('htlb-fire');
  setTimeout(() => _htlbOverlay.classList.remove('htlb-fire'), 1500);
}

// ── Lich revive ───────────────────────────────────────────────────────────────

function _onLichRevive() {
  if (!_lichOverlay) return;
  _lichOverlay.classList.remove('lr-fire');
  void _lichOverlay.offsetWidth;
  _lichOverlay.classList.add('lr-fire');
  setTimeout(() => _lichOverlay.classList.remove('lr-fire'), 2400);
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function _inject(parent, cls) {
  const el = document.createElement('div');
  el.className = cls;
  parent.appendChild(el);
  return el;
}
