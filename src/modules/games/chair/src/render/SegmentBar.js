// Renders a Body's slots as segmented HP divs directly into container (.segbar).
// Structure per segment: <div class="seg [state]"><i style="width:X%"></i><b>SK</b></div>
// Null slots (no organ installed) are skipped — only occupied slots are rendered.

import { ORGAN_SLOTS } from '../entities/Body.js';
import { organResolver } from '../registry.js';

const SLOT_ORDER = [
  'skin', 'arm_l', 'arm_r', 'legs',
  'eye_l', 'eye_r', 'ear_l', 'ear_r', 'stomach', 'tongue',
  'heart', 'brain',
];

const SLOT_LABELS = {
  skin:    'PEAU',    arm_l:   'BRAS',    arm_r:   'BRAS',    legs:    'JAMBES',
  eye_l:   'ŒIL',    eye_r:   'ŒIL',     ear_l:   'OREILLE', ear_r:   'OREILLE',
  stomach: 'ESTOMAC', tongue: 'LANGUE',  heart:   'CŒUR',    brain:   'CERVEAU',
};

// Row grouping for two-line player segbar
const ROW1 = ['skin', 'arm_l', 'arm_r', 'legs', 'heart', 'brain'];
const ROW2 = ['eye_l', 'eye_r', 'ear_l', 'ear_r', 'stomach', 'tongue'];

// options: { onAim(slotKey), targetedSlot, showLocked, twoLine }
// twoLine=true: outer+deep on row 1, mid organs on row 2
export function render(container, body, options = {}) {
  const { onAim, targetedSlot, showLocked = false, twoLine = false } = options;
  container.innerHTML = '';

  // Locked layer gating: outer alive → mid locked, mid alive → deep locked
  let midLocked = false, deepLocked = false;
  if (showLocked) {
    const outerAlive = SLOT_ORDER.some(k => {
      if (ORGAN_SLOTS[k]?.layer !== 'outer') return false;
      const s = body.slots[k];
      return s && (s.hp == null || s.hp > 0);
    });
    const midAlive = SLOT_ORDER.some(k => {
      if (ORGAN_SLOTS[k]?.layer !== 'mid') return false;
      const s = body.slots[k];
      return s && (s.hp == null || s.hp > 0);
    });
    midLocked  = outerAlive;
    deepLocked = midAlive;
  }

  // twoLine: render row1 slots first, then a flex-break, then row2 slots
  const slotOrder = twoLine ? [...ROW1, null, ...ROW2] : SLOT_ORDER;

  for (const slotKey of slotOrder) {
    // null = flex line-break sentinel
    if (slotKey === null) {
      const br = document.createElement('div');
      br.className = 'seg-break';
      container.appendChild(br);
      continue;
    }

    const slotDef = ORGAN_SLOTS[slotKey];
    if (!slotDef) continue;

    const slot = body.slots[slotKey];
    if (!slot) continue;   // skip unoccupied slots entirely

    const seg = document.createElement('div');
    seg.className   = 'seg';
    seg.dataset.slot  = slotKey;
    seg.dataset.layer = slotDef.layer;

    const def = organResolver(slot.organId);
    if (def) {
      const hp      = slot.hp ?? def.maxHp;
      const pct     = hp <= 0 ? 0 : Math.max(0, (hp / def.maxHp) * 100);
      const quality = def.getQuality(hp);

      if (hp <= 0) {
        seg.classList.add('dead');
      } else {
        seg.classList.add('hurt');
        if (slotKey === 'heart') seg.classList.add('heart');
      }
      seg.dataset.quality = quality.name;

      const fill = document.createElement('i');
      fill.style.width = `${pct.toFixed(1)}%`;
      seg.appendChild(fill);

      seg.title = `${def.name} [${quality.name}] ${hp}/${def.maxHp}`;
    } else {
      seg.classList.add('dead');
      seg.dataset.quality = 'destroyed';
      seg.appendChild(document.createElement('i'));
      seg.title = slotKey;
    }

    const lbl = document.createElement('b');
    lbl.textContent = SLOT_LABELS[slotKey] ?? slotKey.slice(0, 2).toUpperCase();
    seg.appendChild(lbl);

    // Layer-locked (deeper organ protected by living outer/mid organ)
    const layer = slotDef.layer;
    const locked = showLocked && (
      (layer === 'mid'  && midLocked) ||
      (layer === 'deep' && deepLocked)
    );
    if (locked) seg.classList.add('locked');

    if (slotKey === targetedSlot) seg.classList.add('sel-ring');

    if (onAim && !locked && slot) {
      seg.addEventListener('click', () => onAim(slotKey));
      seg.addEventListener('touchstart', (ev) => {
        ev.preventDefault();
        onAim(slotKey);
      }, { passive: false });
    }

    container.appendChild(seg);
  }
}
