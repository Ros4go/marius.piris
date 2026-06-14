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
  get arcana()    { return this._def.arcana; }
  get tier()      { return this._def.tier; }
  get maxHp()     { return this._def.hp; }
  get layer()     { return this._def.layer; }
  get stats()     { return this._def.stats; }
  get abilities() { return this._def.abilities; }
  get triggers()  { return this._def.triggers; }
  get curses()    { return this._def.curses; }
  get humanity()  { return this._def.humanity; }
  get sounds()    { return this._def.sounds; }
  get harvest()   { return this._def.harvest; }
  get visual()    { return this._def.visual; }
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
