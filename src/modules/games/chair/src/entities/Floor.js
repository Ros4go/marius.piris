// NxN grid floor. Rooms are stored in a Map keyed by "x,y". No imports.

export class Floor {
  constructor(size, floorIndex, biomeId) {
    this.size        = size;
    this.floorIndex  = floorIndex;
    this.biomeId     = biomeId;
    this.rooms       = new Map();   // "x,y" → Room instance
    this.revealed    = new Set();   // "x,y" cells the player has seen
    this.entrance    = null;        // { x, y }
    this.exit        = null;        // { x, y }
  }

  _key(x, y) { return `${x},${y}`; }

  cell(x, y) {
    return this.rooms.get(this._key(x, y)) ?? null;
  }

  setCell(x, y, room) {
    this.rooms.set(this._key(x, y), room);
  }

  reveal(x, y) {
    this.revealed.add(this._key(x, y));
  }

  isRevealed(x, y) {
    return this.revealed.has(this._key(x, y));
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  neighbors(x, y) {
    return [
      { x: x,   y: y-1, dir: 'N' },
      { x: x+1, y: y,   dir: 'E' },
      { x: x,   y: y+1, dir: 'S' },
      { x: x-1, y: y,   dir: 'W' },
    ].filter(n => this.inBounds(n.x, n.y) && this.cell(n.x, n.y) !== null);
  }

  toJSON() {
    const roomsArr = [];
    for (const [key, room] of this.rooms) {
      const [x, y] = key.split(',').map(Number);
      roomsArr.push({ x, y, room: room.toJSON() });
    }
    return {
      size: this.size,
      floorIndex: this.floorIndex,
      biomeId: this.biomeId,
      rooms: roomsArr,
      revealed: [...this.revealed],
      entrance: this.entrance,
      exit: this.exit,
    };
  }

  static fromJSON(data, Room) {
    const f = new Floor(data.size, data.floorIndex, data.biomeId);
    for (const { x, y, room } of data.rooms) {
      f.rooms.set(f._key(x, y), Room.fromJSON(room));
    }
    f.revealed  = new Set(data.revealed);
    f.entrance  = data.entrance;
    f.exit      = data.exit;
    return f;
  }
}
