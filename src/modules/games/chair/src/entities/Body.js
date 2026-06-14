import { clamp, deepCopy } from '../utils.js';

export const ORGAN_TYPES = ['eye','ear','arm','legs','heart','skin','brain','stomach','tongue'];

export const ORGAN_SLOTS = {
  eye_l:    { type: 'eye',     layer: 'mid'   },
  eye_r:    { type: 'eye',     layer: 'mid'   },
  ear_l:    { type: 'ear',     layer: 'mid'   },
  ear_r:    { type: 'ear',     layer: 'mid'   },
  arm_l:    { type: 'arm',     layer: 'outer' },
  arm_r:    { type: 'arm',     layer: 'outer' },
  legs:     { type: 'legs',    layer: 'outer' },
  heart:    { type: 'heart',   layer: 'deep'  },
  skin:     { type: 'skin',    layer: 'outer' },
  brain:    { type: 'brain',   layer: 'deep'  },
  stomach:  { type: 'stomach', layer: 'mid'   },
  tongue:   { type: 'tongue',  layer: 'mid'   },
};

// Human reference stats (unmodified baseline body)
export const BASE_STATS = {
  dgt: 2, prc: 5, per: 4, oui: 3,
  brt: 3, vit: 5, arm: 2, fam: 3,
  lum: 2, ryt: 1,
};

export class Body {
  constructor(id) {
    this.id = id;
    // slots: { slotKey → { organId, hp } | null }
    this.slots = Object.fromEntries(Object.keys(ORGAN_SLOTS).map(k => [k, null]));
  }

  // --- Static factories ---

  static human(id) {
    const b = new Body(id);
    for (const key of Object.keys(ORGAN_SLOTS)) {
      const type = ORGAN_SLOTS[key].type;
      b.slots[key] = { organId: `${type}_human`, hp: null };
    }
    return b;
  }

  static empty(id) {
    return new Body(id);
  }

  // --- Stat resolution (requires registry lookup externally) ---

  // Returns aggregate stats given a resolver function: organId → Organ instance
  statsWith(resolver) {
    const out = { ...BASE_STATS };
    for (const key of Object.keys(this.slots)) {
      const slot = this.slots[key];
      if (!slot) continue;
      const organ = resolver(slot.organId);
      if (!organ) continue;
      for (const [stat, val] of Object.entries(organ.stats)) {
        out[stat] = (out[stat] ?? 0) + val;
      }
    }
    // clamp minimums
    for (const k of Object.keys(out)) out[k] = Math.max(0, out[k]);
    return out;
  }

  // --- Humanity ---

  humanityWith(resolver) {
    let h = 100;
    for (const key of Object.keys(this.slots)) {
      const slot = this.slots[key];
      if (!slot) continue;
      const organ = resolver(slot.organId);
      if (!organ) continue;
      h += organ.humanity;
    }
    return clamp(h, 0, 100);
  }

  // --- HP ---

  isAlive() {
    const heart = this.slots['heart'];
    return heart !== null && (heart.hp === null || heart.hp > 0);
  }

  // --- Slot management ---

  equippedOrgans() {
    return Object.entries(this.slots)
      .filter(([, s]) => s !== null)
      .map(([key, s]) => ({ slot: key, organId: s.organId, hp: s.hp }));
  }

  canFitOrgan(slotKey, organId, resolver) {
    const slotDef = ORGAN_SLOTS[slotKey];
    if (!slotDef) return false;
    const organ = resolver(organId);
    if (!organ) return false;
    return organ.type === slotDef.type;
  }

  // Returns the displaced organ (or null). Does NOT call registry — caller resolves hp.
  setOrgan(slotKey, organId, hp) {
    const old = this.slots[slotKey];
    this.slots[slotKey] = { organId, hp: hp ?? null };
    return old;
  }

  removeOrgan(slotKey) {
    const old = this.slots[slotKey];
    this.slots[slotKey] = null;
    return old;
  }

  // hp for a slot, falling back to organ maxHp via resolver
  slotHp(slotKey, resolver) {
    const slot = this.slots[slotKey];
    if (!slot) return 0;
    if (slot.hp !== null) return slot.hp;
    const organ = resolver(slot.organId);
    return organ ? organ.maxHp : 0;
  }

  setSlotHp(slotKey, hp) {
    if (this.slots[slotKey]) this.slots[slotKey].hp = hp;
  }

  // --- Serialization ---

  toJSON() {
    return { id: this.id, slots: this.slots };
  }

  static fromJSON(data) {
    const b = new Body(data.id);
    b.slots = deepCopy(data.slots);
    return b;
  }
}
