// SensoryFX — Perceptual effects driven by body stats and combat events.
// Manages: beat pulse, eye vision filters, hit flash, organ-lost FX,
//          LUM aura, EKG line, heart_ultimate, lich_revive.
//
// Les VALEURS des effets (filtres, keyframes, durées) vivent dans content/fx.json
// et sont interprétées par FXSystem — ici il ne reste que le câblage.
//
// Call init() once on boot, onBeat() each battle beat, applyBodyState() each render().

import { WS } from '../WorldState.js';
import { organResolver } from '../registry.js';
import { on as onTrigger } from '../TriggerBus.js';
import { ORGAN_SLOTS } from '../entities/Body.js';
import * as FXSystem from './FXSystem.js';

let _game          = null;
let _viewport      = null;
let _scene         = null;
let _visionOverlay = null;
let _beatOverlay   = null;
let _htlbOverlay   = null;
let _lichOverlay   = null;
let _ekgLine       = null;

// ── Init ──────────────────────────────────────────────────────────────────────

export function init() {
  _game     = document.querySelector('.game');
  _viewport = document.querySelector('.viewport');
  _scene    = document.querySelector('.scene');
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

// ── Per-beat (called from main.js _onBattleBeat) ──────────────────────────────

export function onBeat() {
  if (!_game) return;
  const heart = WS.player.body?.slots?.heart;
  const pool  = heart ? (organResolver(heart.organId)?.pool ?? 0) : 0;
  _game.style.setProperty('--beat-intensity', FXSystem.beatIntensity(pool).toFixed(2));
  FXSystem.beatPulse(_beatOverlay, pool);
  _doEkgPulse();
}

// ── Per-render (called from main.js render()) ─────────────────────────────────

export function applyBodyState() {
  if (!_game) return;
  const body = WS.player.body;
  if (!body) return;
  // Vision filter (fx.json "vision") — inline backdrop-filter, plus de classes CSS.
  if (_visionOverlay) _visionOverlay.style.backdropFilter = FXSystem.visionFilter(body);
  _applyEkgActive(body);
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

// ── Hit flash + organ-lost FX (fx.json "hitFlash" / "organLost") ──────────────

function _onOrganDamaged(e) {
  if (e.target !== 'player' || !_viewport) return;
  const dmg    = e.data?.dmg ?? 1;
  const skinId = WS.player.body?.slots['skin']?.organId ?? null;
  FXSystem.hitFlash(_viewport, skinId, dmg);

  // Organe mort sur ce coup → FX de perte (anim one-shot + classe persistante)
  const slotKey = e.data?.slotKey;
  const slot = slotKey ? WS.player.body?.slots?.[slotKey] : null;
  if (slot && slot.hp !== null && slot.hp <= 0) {
    FXSystem.organLost(_scene, _game, ORGAN_SLOTS[slotKey]?.type);
  }
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
