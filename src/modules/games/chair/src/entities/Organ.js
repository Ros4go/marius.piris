// Wraps a raw organ definition from organs.json. No imports.

const QUALITY_THRESHOLDS = [
  { name: 'parfait', minRatio: 0.99, mult: 1.25 },
  { name: 'intact',  minRatio: 0.70, mult: 1.0  },
  { name: 'abîmé',  minRatio: 0.40, mult: 0.75 },
  { name: 'cuit',   minRatio: 0.01, mult: 0.50 },
  { name: 'pourri', minRatio: 0,    mult: 0     },
];
const DESTROYED = { name: 'destroyed', minRatio: 0, mult: 0 };

export class Organ {
  constructor(def) {
    this._def = def;
  }

  get id()        { return this._def.id; }
  get type()      { return this._def.type; }
  get name()      { return this._def.name; }
  get set()       { return this._def.set ?? null; }
  get tier()      { return this._def.tier; }
  get maxHp()     { return this._def.hp; }
  get layer()     { return this._def.layer; }
  get pool()      { return this._def.pool ?? 0; }          // heart: blood produced
  get maxBlood()  { return this._def.maxBlood ?? 0; }      // blood capacity
  get pulse()     { return this._def.pulse ?? null; }      // heart: beat period (s)
  get color()     { return this._def.color ?? null; }      // per-organ tint override
  // New schema: arrays of skills/passives. Old code reads .skill/.passive (first one).
  get skills()    { return this._def.skills ?? (this._def.skill ? [this._def.skill] : []); }
  get passives()  { return this._def.passives ?? (this._def.passive ? [this._def.passive] : []); }
  get skill()     { return this._def.skill ?? this._def.skills?.[0] ?? null; }
  get passive()   { return this._def.passive ?? this._def.passives?.[0] ?? null; }
  get produces()  { return this._def.produces ?? []; }     // turn-start resource production
  get senses()    { return this._def.senses ?? {}; }       // faculty contributions (vue/ouie/lucidite/digestion)
  get keywords()  { return this._def.keywords ?? []; }     // special perception keywords
  get sonorite()  { return this._def.sonorite ?? 0; }      // noise this organ emits (Sonorité)
  get abilities() { return this._def.abilities ?? []; }
  get triggers()  { return this._def.triggers ?? []; }
  get flaw()      { return this._def.flaw ?? null; }
  get sounds()    { return this._def.sounds ?? {}; }
  get harvest()   { return this._def.harvest ?? {}; }
  get visual()    { return this._def.visual ?? {}; }
  get icon()      { return this._def.icon ?? null; }
  get basePrice() { return this._def.price; }

  getQuality(currentHp) {
    if (currentHp <= 0) return DESTROYED;
    const ratio = currentHp / this._def.hp;
    for (const q of QUALITY_THRESHOLDS) {
      if (ratio >= q.minRatio) return q;
    }
    return QUALITY_THRESHOLDS[4]; // pourri
  }

  getQualityMult(currentHp) {
    return this.getQuality(currentHp).mult;
  }

  getSellPrice(currentHp) {
    return Math.floor(this._def.price * this.getQualityMult(currentHp));
  }
}
