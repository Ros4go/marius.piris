// Runtime state for a single room. Receives a def object directly — no registry import.

export class Room {
  constructor(def, id) {
    this.id       = id;          // unique instance id (e.g. "r_3_4")
    this.defId    = def.id;      // points to rooms.json entry
    this.family   = def.family;
    this.ui       = def.ui;
    this.description = def.description;
    this.loot     = { ...def.loot };
    this.cleared  = def.cleared ?? false;
    this.visited  = false;
    this.mobIds   = [];          // WorldState.mobs keys active in this room
    this.lootIds  = [];          // organ/relic instance ids on the floor
    this.npcId    = null;        // optional NPC assigned at dungeon gen
  }

  markVisited() {
    this.visited = true;
  }

  markCleared() {
    this.cleared = true;
  }

  addMob(mobId) {
    if (!this.mobIds.includes(mobId)) this.mobIds.push(mobId);
  }

  removeMob(mobId) {
    this.mobIds = this.mobIds.filter(id => id !== mobId);
  }

  isHostile() {
    return this.family === 'combat' || this.family === 'thematic' || this.family === 'boss';
  }

  toJSON() {
    return {
      id: this.id,
      defId: this.defId,
      family: this.family,
      ui: this.ui,
      description: this.description,
      loot: this.loot,
      cleared: this.cleared,
      visited: this.visited,
      mobIds: [...this.mobIds],
      lootIds: [...this.lootIds],
      npcId: this.npcId,
    };
  }

  static fromJSON(data) {
    const r = new Room({ id: data.defId, family: data.family, ui: data.ui,
                         description: data.description, loot: data.loot,
                         cleared: data.cleared }, data.id);
    r.visited = data.visited;
    r.mobIds  = [...data.mobIds];
    r.lootIds = [...data.lootIds];
    r.npcId   = data.npcId;
    return r;
  }
}
