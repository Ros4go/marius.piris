// Runtime state for a single room. Receives a def object directly — no registry import.

export class Room {
  constructor(def, id) {
    this.id       = id;          // unique instance id (e.g. "r_3_4")
    this.defId    = def.id;      // points to rooms.json entry
    // Hostilité dérivée des spawns : des mobs peuvent y apparaître → hostile.
    // (Remplace l'ancien champ "family", supprimé — redondant avec spawns.)
    this.hostile  = (def.spawns?.maxMobs ?? 0) > 0 || !!def.spawns?.boss || !!def.spawns?.graveyard;
    this.ui       = def.ui;
    this.description = def.description;
    // État runtime : accompli/nettoyé. Une salle hostile démarre non-nettoyée,
    // une salle sûre n'a rien à accomplir. (Ex-champ de def, désormais dérivé ;
    // il passe à true quand les mobs meurent / l'autel est consommé, etc.)
    this.cleared  = def.cleared ?? !this.hostile;
    this.sortie   = !!def.sortie;   // salle de descente (le puits) — flag de def, plus de test sur l'id
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
    return this.hostile;
  }

  toJSON() {
    return {
      id: this.id,
      defId: this.defId,
      hostile: this.hostile,
      sortie: this.sortie,
      ui: this.ui,
      description: this.description,
      cleared: this.cleared,
      visited: this.visited,
      mobIds: [...this.mobIds],
      lootIds: [...this.lootIds],
      npcId: this.npcId,
    };
  }

  static fromJSON(data) {
    const r = new Room({ id: data.defId, ui: data.ui,
                         description: data.description,
                         cleared: data.cleared }, data.id);
    // Compat anciennes saves : elles portaient "family" au lieu de "hostile".
    r.hostile = data.hostile
      ?? (data.family === 'combat' || data.family === 'thematic' || data.family === 'boss');
    // compat vieilles saves : la sortie s'appelait littéralement "exit"
    r.sortie = data.sortie ?? data.defId === 'exit';
    r.visited = data.visited;
    r.mobIds  = [...data.mobIds];
    r.lootIds = [...data.lootIds];
    r.npcId   = data.npcId;
    return r;
  }
}
