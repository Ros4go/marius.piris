// Procedural mob silhouettes from mob.body organs. Multiple mobs are laid out
// side by side on the scene, each with its NAME and its telegraphed INTENT in a
// bubble above it, and each clickable to make it your focused target.
// DOM nodes are cached per mobId and rebuilt only on first appearance.

import { WS, currentRoom } from '../WorldState.js';
import { organResolver, organColor } from '../registry.js';
import { ORGAN_SLOTS } from '../entities/Body.js';
import { SLOT_SHORT as ORGAN_NAMES } from '../labels.js';
import * as TurnCombat from '../TurnCombat.js';

// deterministic per-string pseudo-random (FNV-1a) for organic timing variety
function _seed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const _display = document.getElementById('mob-display');
const _cache   = new Map(); // mobId → HTMLElement

function _playerHasBrain() {
  const b = WS.player.body;
  return Object.keys(ORGAN_SLOTS).some((k) => {
    if (ORGAN_SLOTS[k].type !== 'brain') return false;
    const s = b.slots[k]; return s?.organId && (s.hp == null || s.hp > 0);
  });
}

// The mob's telegraphed plan, as stacked mini-pills above its silhouette.
function _intentHTML(mobId) {
  if (!TurnCombat.isActive()) return '';
  const plan = TurnCombat.telegraphOf(mobId);
  if (!plan.length) return '<span class="mi mi-wait">∅</span>';
  if (!_playerHasBrain()) return '<span class="mi vague">⚠ <em>prépare un coup…</em></span>';
  return plan.map((a) =>
    `<span class="mi">⚠ <em>${a.label}</em> → <b>${ORGAN_NAMES[a.target] ?? a.target}</b> <span class="tg-dmg">−${a.amount}</span></span>`
  ).join('');
}

export function render(opts = {}) {
  const { onPeek } = opts;
  const room = currentRoom();
  const activeMobIds = (room?.mobIds ?? []).filter(id => {
    const m = WS.mobs.get(id);
    return m?.lifecycle === 'active';
  });

  // Remove stale entries
  for (const [id, el] of _cache) {
    if (!activeMobIds.includes(id)) {
      el.remove();
      _cache.delete(id);
    }
  }

  _display.classList.toggle('visible', activeMobIds.length > 0);
  _display.classList.toggle('multi', activeMobIds.length > 1);
  _display.classList.toggle('crowd', activeMobIds.length >= 3);

  for (const mobId of activeMobIds) {
    const mob = WS.mobs.get(mobId);
    if (!mob) continue;

    let el = _cache.get(mobId);
    if (!el) {
      el = _build(mob);
      el.classList.add('mobwrap');
      // press-and-hold to reveal this mob's organs; release to hide. We CAPTURE
      // the pointer so the organ panel appearing under the cursor can't steal
      // events (which caused an instant close + the not-allowed cursor flicker).
      const start = (e) => {
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        el.classList.add('focused');
        el._onPeek?.(true, mobId);
      };
      const end = (e) => {
        try { el.releasePointerCapture(e.pointerId); } catch (_) {}
        el.classList.remove('focused');
        el._onPeek?.(false, mobId);
      };
      el.addEventListener('pointerdown', start);
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      const tag = document.createElement('div');
      tag.className = 'mob-tag';
      el.appendChild(tag);
      el._tag = tag;
      _display.appendChild(el);
      _cache.set(mobId, el);
    }

    el._onPeek = onPeek;
    _applyDamage(el, mob);
    if (el._tag) {
      el._tag.innerHTML =
        `<span class="mob-name">${(mob.isElite ? '★ ' : '') + mob.name}</span>` + _intentHTML(mobId);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────

// Procedurally assemble the creature FROM ITS ORGANS: every present slot adds an
// anatomical feature, so a mob's silhouette reflects exactly what it's made of.
function _build(mob) {
  const slots   = mob.body.slots;
  const has     = (k) => !!slots[k]?.organId;
  const organs  = mob.body.equippedOrgans();
  const beast   = organs.some((o) => String(o.organId).endsWith('_beast'));

  const eyeL = has('eye_l'), eyeR = has('eye_r');
  const earL = has('ear_l'), earR = has('ear_r');
  const armL = has('arm_l'), armR = has('arm_r');
  const hasLegs = has('legs'), hasStomach = has('stomach'), hasBrain = has('brain'),
        hasHeart = has('heart'), hasTongue = has('tongue'), hasSkin = has('skin');
  const eyeCount = (eyeL ? 1 : 0) + (eyeR ? 1 : 0);
  const headFeat = eyeCount || hasBrain || earL || earR || hasTongue;

  const mass = Math.max(1.02, Math.min(2.76, 0.86 + organs.length * 0.19 + (hasStomach ? 0.24 : 0)));
  const px = (n) => Math.round(n * mass);

  // Explicit part sizes → the wrap (= the click target) hugs the creature, with no
  // empty space above/around it that would offset the hit area.
  const torsoW   = px(hasStomach ? 56 : 44);
  const legH     = hasLegs ? px(24) : px(7);
  const torsoH   = Math.round(torsoW * (hasStomach ? 1.2 : 1.55));
  const headH    = headFeat ? Math.round(torsoW * 0.66) : 0;
  const brainUp  = hasBrain ? px(9) : 0;
  const armOver  = (armL || armR) ? px(13) : px(3);

  const torsoBottom = legH - px(5);
  const headBottom  = torsoBottom + torsoH - Math.round(headH * 0.42);
  const H = headFeat ? headBottom + headH + brainUp : torsoBottom + torsoH;
  const W = torsoW + armOver * 2;

  // Each organ is rendered in its SET colour (same colour as its card). The torso
  // takes the skin's colour if any, else the biome blood.
  const oc = (k) => (has(k) ? organColor(slots[k].organId) : 'var(--c-blood)');
  const torsoFlesh = hasSkin ? oc('skin') : 'var(--c-blood)';

  const wrap = document.createElement('div');
  wrap.dataset.mobId = mob.id;
  wrap.style.cssText = `position:relative; flex:none; width:${W}px; height:${H}px;`;

  // Per-mob animation phase so several mobs on screen never breathe / pulse in
  // lockstep. The breath lives on an INNER layer (not the wrap) so it doesn't
  // fight the wrap's hover-lift / crowd-scale transforms, and the click hitbox
  // stays still. Negative delays start each mob mid-cycle → instantly desynced.
  const phase = _seed(mob.id);
  const breathDelay = -((phase % 4200) / 1000);
  const inner = document.createElement('div');
  inner.style.cssText = `position:absolute; inset:0; animation:breath 4.2s ease-in-out infinite; animation-delay:${breathDelay}s;`;
  wrap.appendChild(inner);

  const mk = (css, parent = inner) => {
    const d = document.createElement('div'); d.style.cssText = css; parent.appendChild(d); return d;
  };

  // ── legs (or stumps when legless) ──
  if (hasLegs) {
    const span = px(22), legCol = oc('legs');
    for (const sx of [-1, 1]) {
      mk(`position:absolute; bottom:0; left:50%; width:${px(11)}px; height:${legH}px;
          margin-left:${sx * span - px(5.5)}px;
          background:linear-gradient(${legCol},#190909);
          clip-path:polygon(22% 0,78% 0,92% 100%,8% 100%);
          transform:rotate(${sx * 4}deg); transform-origin:top;`);
    }
  } else {
    for (const sx of [-1, 0, 1]) {
      mk(`position:absolute; bottom:0; left:50%; width:${px(8)}px; height:${px(13)}px;
          margin-left:${sx * px(10) - px(4)}px; background:${torsoFlesh};
          border-radius:0 0 50% 50%; opacity:.82;`);
    }
  }

  // ── torso (shape depends on stomach / legs; raw veined flesh without skin) ──
  const torsoR = hasStomach ? '46% 46% 50% 50% / 42% 42% 58% 58%'
               : hasLegs    ? '48% 48% 42% 42% / 56% 56% 46% 46%'
               :              '50% 50% 46% 46% / 62% 62% 58% 58%';
  const torso = mk(`position:absolute; bottom:${torsoBottom}px; left:50%; transform:translateX(-50%);
      width:${torsoW}px; height:${torsoH}px; border-radius:${torsoR};
      background:
        radial-gradient(circle at 38% 28%, #ffffff26, transparent 52%),
        radial-gradient(circle at 64% 78%, #00000055, transparent 60%),
        ${hasSkin ? torsoFlesh : `repeating-linear-gradient(8deg, ${torsoFlesh} 0 5px, #2a0d0d 5px 7px)`};
      box-shadow: inset -6px -8px 14px #0008, inset 4px 5px 9px #ffffff10, 0 4px 10px #000a;`);

  // exposed heart — throbs at the beat period defined on the heart organ
  if (hasHeart) {
    const beat = organResolver(slots['heart'].organId)?.pulse ?? 1.05;
    const beatDelay = -(((phase >> 4) % Math.round(beat * 1000)) / 1000);
    mk(`position:absolute; left:50%; top:46%; transform:translate(-50%,-50%);
        width:${px(14)}px; height:${px(14)}px; border-radius:50%;
        background:radial-gradient(circle at 40% 35%, #ff5a4e, #6a1410 70%);
        box-shadow:0 0 ${px(8)}px #b5333a, inset 0 0 4px #2a0606;
        animation:mob-heart ${beat}s ease-in-out ${beatDelay}s infinite;`, torso);
  }

  // arms — one per arm slot (asymmetry possible), each in its own colour
  for (const [key, sx] of [['arm_l', -1], ['arm_r', 1]]) {
    if (!has(key)) continue;
    const aw = px(15), ah = px(34), armCol = organColor(slots[key].organId);
    const arm = mk(`position:absolute; top:14%; ${sx < 0 ? 'left' : 'right'}:-${px(9)}px;
        width:${aw}px; height:${ah}px; background:linear-gradient(${armCol},#190909);
        clip-path:polygon(${sx < 0 ? '30% 0,100% 8%,80% 100%,0 92%' : '0 8%,70% 0,100% 92%,20% 100%'});
        transform:rotate(${sx * 12}deg); transform-origin:top ${sx < 0 ? 'right' : 'left'};`, torso);
    if (beast) {
      mk(`position:absolute; bottom:-${px(4)}px; left:50%; transform:translateX(-50%);
          width:0;height:0; border-left:${px(3)}px solid transparent; border-right:${px(3)}px solid transparent;
          border-top:${px(8)}px solid #d8c8a0;`, arm);
    }
  }

  // ── head + its features ──
  if (headFeat) {
    const hs = headH;
    const head = mk(`position:absolute; left:50%; bottom:${headBottom}px; transform:translateX(-50%);
        width:${hs}px; height:${Math.round(hs * 0.94)}px; z-index:2;
        border-radius:48% 48% 44% 44% / 56% 56% 46% 46%;
        background:radial-gradient(circle at 42% 30%, #ffffff22, transparent 52%), ${torsoFlesh};
        box-shadow: inset -4px -5px 9px #0007, 0 3px 7px #000a;`);

    if (hasBrain) {
      const brainCol = oc('brain');
      // wrinkled brain: lighter ridges + darker grooves, tinted by the organ colour
      mk(`position:absolute; left:50%; top:-${px(8)}px; transform:translateX(-50%);
          width:${Math.round(hs * 0.82)}px; height:${Math.round(hs * 0.5)}px; border-radius:50% 50% 0 0;
          background:repeating-radial-gradient(circle at 50% 82%,
            color-mix(in srgb, ${brainCol} 75%, #fff) 0 3px,
            color-mix(in srgb, ${brainCol} 55%, #000) 3px 6px);
          box-shadow:0 0 5px #0006, inset 0 -3px 6px #0006, inset 0 2px 3px #ffffff22;`, head);
    }

    for (const [key, sx] of [['ear_l', -1], ['ear_r', 1]]) {
      if (!has(key)) continue;
      mk(`position:absolute; top:16%; ${sx < 0 ? 'left' : 'right'}:-${px(5)}px;
          width:${Math.round(hs * 0.3)}px; height:${Math.round(hs * 0.5)}px; background:${organColor(slots[key].organId)};
          clip-path:polygon(${sx < 0 ? '100% 0,100% 100%,0 60%' : '0 0,0 100%,100% 60%'});
          transform:rotate(${sx * -10}deg);`, head);
    }

    // eyes — simple glowing dots, each blinking at its own rhythm
    if (eyeCount) {
      const eyeCol = organColor(slots.eye_l?.organId ?? slots.eye_r?.organId);
      const slotsX = eyeCount === 1 ? [0] : [-1, 1];
      const sz     = px(eyeCount === 1 ? 8 : 6);
      slotsX.forEach((p, i) => {
        const r = _seed(`${mob.id}e${i}`);
        const dur = (40 + (r % 30)) / 10;        // 4.0–6.9s
        const delay = ((r >> 5) % 45) / 10;      // 0–4.4s
        mk(`position:absolute; top:40%; left:50%; transform:translateX(-50%);
            margin-left:${p * Math.round(hs * 0.22)}px; width:${sz}px; height:${sz}px; border-radius:50%;
            background:radial-gradient(circle at 42% 38%, #ffffffcc, ${eyeCol} 55%);
            box-shadow:0 0 ${px(6)}px ${eyeCol};
            animation:mob-blink ${dur}s ease-in-out ${delay}s infinite;`, head);
      });
    }

    if (hasTongue) {
      const maw = mk(`position:absolute; bottom:6%; left:50%; transform:translateX(-50%);
          width:${Math.round(hs * 0.5)}px; height:${Math.round(hs * 0.22)}px; border-radius:0 0 60% 60%;
          background:#160505; box-shadow:inset 0 2px 3px #000;`, head);
      mk(`position:absolute; bottom:-${Math.round(hs * 0.18)}px; left:50%; transform:translateX(-50%);
          width:${Math.round(hs * 0.18)}px; height:${Math.round(hs * 0.32)}px; border-radius:0 0 60% 60%;
          background:linear-gradient(${oc('tongue')},#5a1f1f); animation:mob-tongue 3.4s ease-in-out ${-(((phase >> 7) % 3400) / 1000)}s infinite;`, maw);
    }
  }

  // Transparent hit area covering the WHOLE creature (+ a margin) so a press
  // anywhere on the mob opens the organ peek — not just on a specific part.
  // It sits on the (non-breathing) wrap so the hitbox stays steady.
  mk(`position:absolute; inset:-8px; z-index:6; cursor:pointer;`, wrap);

  return wrap;
}

function _applyDamage(el, mob) {
  const organs = mob.body.equippedOrgans().filter(o => o.hp !== null);
  if (!organs.length) { el.style.opacity = '0.15'; return; }

  let totalCur = 0, totalMax = 0;
  for (const o of organs) {
    const def = organResolver(o.organId);
    if (!def) continue;
    totalCur += Math.max(0, o.hp);
    totalMax += def.maxHp;
  }

  const ratio = totalMax > 0 ? totalCur / totalMax : 0;
  el.style.opacity = (0.25 + ratio * 0.75).toFixed(2);
  el.style.filter  = ratio < 0.35 ? 'blur(1.5px) saturate(0.4)' : '';
}
