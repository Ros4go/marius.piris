// Peuplement des étages (biomes.json "salles") — node, sans DOM.
// Vérifie : entrée/sortie placées par les RÈGLES, boss au dernier étage,
// pool pondéré par biome, min/max/chance, une-salle-un-biome.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { loadDataRaw, allRooms } from '../src/registry.js';
import { initRun } from '../src/WorldState.js';
import { generateFloor } from '../src/systems/DungeonGen.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const J = (f) => JSON.parse(readFileSync(resolve(root, 'content', f), 'utf8'));
const rooms = J('rooms.json');
const biomes = J('biomes.json');
loadDataRaw({ rooms, biomes, organs: J('organs.json'), sets: J('sets.json'), relics: [], mobs: [], lore: [] });

let ok = 0, ko = 0;
const test = (nom, cond) => { if (cond) ok++; else { ko++; console.log('✕ ' + nom); } };

// 1. une salle = un biome, plus de weight
test('toutes les salles ont un biome', rooms.every((r) => !!r.biomeOnly));
test('plus aucun champ weight', rooms.every((r) => r.weight === undefined));
test('les sorties portent le flag sortie', rooms.filter((r) => r.id.startsWith('exit')).every((r) => r.sortie === true));

// 2. génération gorge : entrée/sortie/pool
const gorge = biomes.find((b) => b.id === 'gorge');
initRun(1234);
const fl = generateFloor('gorge', 0);
const at = (p) => fl.cell(p.x, p.y);
test('entrée = salle de la règle entree', at(fl.entrance)?.defId === 'entrance');
test('sortie normale = exit (pas boss au 1er étage)', at(fl.exit)?.defId === 'exit');
test('sortie flaguée sortie', !!at(fl.exit)?.sortie);

// toutes les salles posées appartiennent à la gorge
let horsBiome = 0;
for (let x = 0; x < fl.size; x++) for (let y = 0; y < fl.size; y++) {
  const c = fl.cell(x, y);
  if (c && allRooms().find((d) => d.id === c.defId)?.biomeOnly !== 'gorge') horsBiome++;
}
test('aucune salle d\'un autre biome', horsBiome === 0);

// 3. boss au dernier étage (règle sortie + etage dernier)
initRun(99);
const flBoss = generateFloor('gorge', gorge.floorRange[1] - 1);
test('boss remplace la sortie au dernier étage', flBoss.cell(flBoss.exit.x, flBoss.exit.y)?.defId === 'boss');

// 4. règles min / max / chance (biome de test injecté)
const bTest = JSON.parse(JSON.stringify(gorge));
bTest.id = 'test';
bTest.salles = {
  poids: { combat: 10 },
  regles: [
    { salle: 'entrance', position: 'entree' },
    { salle: 'exit', position: 'sortie' },
    { salle: 'rest', min: 2 },
    { salle: 'trade', max: 0 },
    { salle: 'altar', chance: 1 },
  ],
};
const roomsTest = rooms.map((r) => ({ ...r, biomeOnly: r.biomeOnly === 'gorge' ? 'test' : r.biomeOnly }));
loadDataRaw({ rooms: roomsTest, biomes: [...biomes, bTest], organs: J('organs.json'), sets: J('sets.json'), relics: [], mobs: [], lore: [] });
let minOk = true, maxOk = true, chanceOk = true;
for (let i = 0; i < 12; i++) {
  initRun(4000 + i);
  const f2 = generateFloor('test', 0);
  const compte = (id) => {
    let n = 0;
    for (let x = 0; x < f2.size; x++) for (let y = 0; y < f2.size; y++) if (f2.cell(x, y)?.defId === id) n++;
    return n;
  };
  if (compte('rest') < 2) minOk = false;
  if (compte('trade') > 0) maxOk = false;
  if (compte('altar') < 1) chanceOk = false;
}
test('min 2 garanti (rest ≥ 2 sur 12 étages)', minOk);
test('max 0 respecté (trade jamais)', maxOk);
test('chance 1 apparaît toujours (altar)', chanceOk);

console.log(`${ok}/${ok + ko} tests peuplement ${ko === 0 ? '✅' : '❌'}`);
process.exit(ko === 0 ? 0 : 1);
