// First-person room view. Reads WS + floor geometry — never writes.

import { WS, currentFloor, currentRoom } from '../WorldState.js';
import { biome as getBiomeData, roomDef } from '../registry.js';
import { setScene } from './ViewportDOM.js';
import { structureDefs } from './RoomPanel.js';
import { decorFigure, animerSprites } from './SpriteFX.js';

// Sockets (stables, hors décor) — capturés une fois.
const _app   = document.querySelector('.game');
const _exitL = document.getElementById('exit-l');
const _exitR = document.getElementById('exit-r');
const _exitF = document.getElementById('exit-f');
const _exitB = document.getElementById('exit-b');
const _pit   = document.getElementById('floor-pit');
const _gore  = document.getElementById('gore');

// Éléments du DÉCOR (recréés à chaque changement de scène) — lookup paresseux.
const _decorEl = (id) => document.getElementById(id);

function _hash(s) {
  let h = 0;
  for (let i = 0; i < (s?.length ?? 0); i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const DIR_ORDER = ['N', 'E', 'S', 'W'];
const DIR_DELTA = { N:{dx:0,dy:-1}, E:{dx:1,dy:0}, S:{dx:0,dy:1}, W:{dx:-1,dy:0} };

// Couleurs du biome (biomes.json = source unique) posées en variables CSS sur
// .game. Partagé : appelé par render() ici, utilisé par le jeu ET l'atelier.
export function applyBiomePalette(biomeId) {
  const p = getBiomeData(biomeId)?.palette;
  if (!_app || !p) return;
  _app.dataset.biome = biomeId;
  const map = { '--meat': p.meat, '--blood': p.blood, '--thread': p.thread, '--torch': p.torch, '--torch-hot': p.torchHot };
  for (const [k, v] of Object.entries(map)) if (v) _app.style.setProperty(k, v);
}

// Quelle scène de décor pour cette salle : rooms.json "scene" (explicite sur
// CHAQUE salle depuis « une salle = un biome » — plus de défaut de biome).
// Le couloir reste l'ultime filet si une salle a été créée sans scène.
function _resolveScene(floor, room) {
  return roomDef(room.defId)?.scene ?? 'gorge_couloir';
}

export function render() {
  const floor = currentFloor();
  const room  = currentRoom();

  if (floor?.biomeId) applyBiomePalette(floor.biomeId);
  if (!floor || !room) return;

  setScene(_resolveScene(floor, room));

  const { x, y } = WS.player.pos;
  const dir   = WS.player.dir ?? 'S';
  const fwd   = DIR_DELTA[dir];
  const left  = DIR_DELTA[_rotate(dir, -1)];
  const right = DIR_DELTA[_rotate(dir, +1)];

  const hasFwd   = !!floor.cell(x + fwd.dx,   y + fwd.dy);
  const hasLeft  = !!floor.cell(x + left.dx,  y + left.dy);
  const hasRight = !!floor.cell(x + right.dx, y + right.dy);
  const hasBack  = !!floor.cell(x - fwd.dx,   y - fwd.dy);

  // Walls stay solid; passages are shown as explicit glowing archways instead.
  // (_wl/_wr/_end appartiennent au décor gorge — lookup paresseux, absents ailleurs.)
  const wl = _decorEl('scene-wl'), wr = _decorEl('scene-wr'), end = _decorEl('scene-end');
  if (wl) wl.style.opacity = '1';
  if (wr) wr.style.opacity = '1';
  _exitL?.classList.toggle('open', hasLeft);
  _exitR?.classList.toggle('open', hasRight);
  _exitF?.classList.toggle('open', hasFwd);
  // a passage behind you (you can step back) → warm light spilling from the bottom
  _exitB?.classList.toggle('open', hasBack);
  // the descent room → an irradiating pit in the floor
  _pit?.classList.toggle('open', !!room.sortie);

  // Décoration : 100% DATA — la salle définit ses règles par biome (rooms.json
  // "decos" : { biomeId|'*': [{kind, chance}] }), évaluées dans l'ordre (la
  // première qui réussit gagne), tirage déterministe par salle+règle.
  // AUCUNE règle pour ce biome = aucun décor.
  if (_gore) {
    const defs = structureDefs();
    const conf = roomDef(room.defId)?.decos;
    let prop = 'none';
    const h = _hash(room.id);
    // room._structSalt (outillage : « relancer le tirage ») force un nouveau
    // tirage du décor aussi — indéfini en jeu, donc stable par salle.
    const salt = room._structSalt != null ? ':' + room._structSalt : '';
    const list = conf ? (conf[floor.biomeId] ?? conf['*'] ?? []) : [];
    for (const [idx, c] of list.entries()) {
      if (defs[c.kind]?.categorie !== 'decoration') continue;
      const roll = (_hash(`${room.id}:${c.kind}${idx}${salt}`) % 1000) / 1000;
      if (roll < (c.chance ?? 1)) { prop = c.kind; break; }
    }
    _gore.style.setProperty('--gore-x', `${(h % 7) - 3}px`);
    // position : TIRÉE parmi les emplacements libres — jamais devant une porte
    // latérale (le centre reste toujours possible). Salée par le reroll.
    const spots = ['36%'];
    if (!hasLeft) spots.push('5%');
    if (!hasRight) spots.push('66%');
    _gore.style.setProperty('--gore-left', spots[_hash(`${room.id}:pos${salt}`) % spots.length]);
    if (_gore.dataset.prop !== prop) {   // ne reconstruit qu'au changement (anims)
      _gore.dataset.prop = prop;
      _gore.innerHTML = decorFigure(defs[prop]);
      animerSprites(_gore);
    }
  }

  // Back wall stays a plain textured wall; the forward door is the exit-f overlay.
  // (No red combat tint here — it read as a glowing path, not a wall.)
  if (end) { end.style.opacity = '1'; end.style.filter = ''; }
}

function _rotate(dir, step) {
  return DIR_ORDER[(DIR_ORDER.indexOf(dir) + step + 4) % 4];
}
