// Tag-system tests (TDD §2) — runs the REAL Faculties engine against the REAL
// organs.json, in node:   node src/modules/games/chair/_tests/tags.mjs
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { loadDataRaw, organResolver } from '../src/registry.js';
import { WS } from '../src/WorldState.js';
import * as F from '../src/systems/Faculties.js';
import * as CR from '../src/systems/combatRules.js';

const here = dirname(fileURLToPath(import.meta.url));
const ORGANS = JSON.parse(readFileSync(resolve(here, '../content/organs.json'), 'utf8'));
loadDataRaw({ organs: ORGANS });

// Body stub: WS.player.body.slots is all Faculties reads.
function setBody(spec) {
  const slots = {};
  for (const [k, v] of Object.entries(spec)) {
    slots[k] = typeof v === 'string' ? { organId: v, hp: 5 } : v;   // v peut porter {organId,hp}
  }
  WS.player.body = { slots };
}
// Fake organ defs for vocab not yet on real organs (registered on the fly).
let _fakeN = 0;
function fake(type, tags) {
  const id = `_fake_${type}_${_fakeN++}`;
  ORGANS.push({ id, type, name: id, tier: 'common', hp: 5, layer: 'mid', price: 1, tags, passives: [], skills: [], harvest: { fragileTo: [] } });
  loadDataRaw({ organs: ORGANS });
  return id;
}

let ok = 0, fail = 0;
const t = (name, cond) => { if (cond) { ok++; } else { fail++; console.log('❌ ' + name); } };

// ── Latéralisation Vue ────────────────────────────────────────────────────────
setBody({ eye_l: 'eye_human' });
t('œil G seul : vue à gauche', F.grants('vue', 'gauche'));
t('œil G seul : PAS de vue à droite', !F.grants('vue', 'droite'));
t('œil G humain : couleur à gauche', F.grants('vue-couleur', 'vue', 'gauche'));

setBody({ eye_l: 'eye_human', eye_r: 'eye_beast' });
t('bête D : invisible à droite', F.grants('vue-invisible', 'vue', 'droite'));
t('humain G : PAS invisible à gauche', !F.grants('vue-invisible', 'vue', 'gauche'));
t('bête D : PAS couleur à droite', !F.grants('vue-couleur', 'vue', 'droite'));

// ── Fusion binaire (règle §2.1) ───────────────────────────────────────────────
const e1 = fake('ear', ['ouie', 'echolocation-1']);
setBody({ ear_l: e1 });
t('écho-1 ×1 → tier max 1', F.tierMax('echolocation', 'gauche') === 1);
setBody({ ear_l: e1, ear_r: e1 });
t('écho-1 ×2 (G+D) → global tier 2', F.tierMax('echolocation') === 2);
t('écho-1 ×2 : par CÔTÉ chaque oreille reste tier 1', F.tierMax('echolocation', 'gauche') === 1);
const e11 = fake('ear', ['ouie', 'echolocation-1', 'echolocation-1']);
setBody({ ear_l: e11 });
t('écho-1 ×2 (même organe) → tier 2 à gauche', F.tierMax('echolocation', 'gauche') === 2);
const e111 = fake('ear', ['ouie', 'echolocation-1', 'echolocation-1', 'echolocation-1']);
setBody({ ear_l: e111 });
t('écho-1 ×3 → tiers actifs [1,2] (PAS 3)', JSON.stringify(F.tiers('echolocation', 'gauche')) === '[1,2]');
const e1111 = fake('ear', ['ouie', ...Array(4).fill('echolocation-1')]);
setBody({ ear_l: e1111 });
t('écho-1 ×4 → tier 3', JSON.stringify(F.tiers('echolocation', 'gauche')) === '[3]');

// ── Map & mémoire ─────────────────────────────────────────────────────────────
setBody({});
t('sans cerveau : map verrouillée (0)', F.mapLevel() === 0);
setBody({ brain: 'brain_human' });
t('cerveau humain : map-2', F.mapLevel() === 2);
t('map-2 → prédit à 1', F.mapPredictRange() === 1);
t('cerveau humain : mémoire', F.remembers());
setBody({ brain: 'brain_beast' });
t('cerveau bête : map-3 → prédit à 2', F.mapPredictRange() === 2);
const b22 = fake('brain', ['map-2', 'map-2']);
setBody({ brain: b22 });
t('map-2 ×2 → fusion en map-3', F.mapLevel() === 3);

// ── Détection (globale) ───────────────────────────────────────────────────────
const eD = fake('ear', ['ouie', 'ouie-detection-1']);
setBody({ ear_l: eD });
t('détection-1', F.detectionLevel() === 1);

// ── Plan : canal sensoriel ────────────────────────────────────────────────────
setBody({ brain: 'brain_human' });
t('plan SANS yeux ni oreilles → inactif', !F.planActive());
setBody({ brain: 'brain_human', eye_l: 'eye_human' });
t('plan + œil → actif (canal vue)', F.planActive() && F.planChannels().vue);
setBody({ brain: 'brain_human', ear_l: 'ear_human' });
t('plan + oreille → actif (canal ouïe)', F.planActive() && F.planChannels().ouie);

// ── Jauges ────────────────────────────────────────────────────────────────────
setBody({ tongue: 'tongue_human', stomach: 'stomach_human' });
t('digestion humaine = 9 tags', F.count('digestion') === 9);
setBody({ heart: 'heart_beast', stomach: 'stomach_beast' });
t('sonorité bête : cœur×2 + panse×1 = 3', F.sonorityOf(WS.player.body) === 3);
const sCalme = fake('skin', ['calme', 'calme']);
setBody({ heart: 'heart_beast', skin: sCalme });
t('calme ×2 annule : net 0', F.sonorityOf(WS.player.body) === 0);
const sLum = fake('skin', ['luminescent', 'sombre', 'sombre', 'sombre']);
setBody({ skin: sLum });
t('lumière nette −2', F.lightNet() === -2);

// ── Invisibilité d\'entité ────────────────────────────────────────────────────
const mobFull = { tags: Array(10).fill('invisible'), body: { slots: {} } };
const mobHalf = { tags: Array(4).fill('invisible'),  body: { slots: {} } };
setBody({});
t('mob 10 stacks : non perçu sans rien', !F.perceivesMob(mobFull));
t('mob 4 stacks : perçu (partiel) par tous', F.perceivesMob(mobHalf));
t('mob 4 stacks : opacité 0.6', Math.abs(F.mobOpacity(mobHalf) - 0.6) < 1e-9);
setBody({ eye_l: 'eye_beast' });
t('vue-invisible G : perçoit le mob total à gauche', F.perceivesMob(mobFull, 'gauche'));
t('vue-invisible G : PAS à droite', !F.perceivesMob(mobFull, 'droite'));
const mobNoisy = { tags: Array(10).fill('invisible'), body: { slots: { heart: { organId: 'heart_beast', hp: 5 } } } };
setBody({ ear_l: 'ear_human' });   // echolocation-1
t('écho + mob bruyant invisible → perçu', F.perceivesMob(mobNoisy, 'droite'));

// ── Greffe ────────────────────────────────────────────────────────────────────
t('greffe base 5', F.graftTicks(organResolver('arm_human'), 5) === 5);
const oInc = fake('arm', ['incompatible', 'incompatible']);
t('incompatible ×2 → 7 ticks', F.graftTicks(organResolver(oInc), 5) === 7);
const oCmp = fake('arm', Array(9).fill('compatible'));
t('compatible ×9 → plancher 1', F.graftTicks(organResolver(oCmp), 5) === 1);
const oHyp = fake('arm', ['hyper-compatible']);
t('hyper-compatible → 0 tick', F.graftTicks(organResolver(oHyp), 5) === 0);

// ── Pompe (combatRules, pur) ─────────────────────────────────────────────────
const hPmp = fake('skin', ['pompe', 'pompe', 'pompe', 'pompe', 'pompe']);
const body1 = { slots: { heart: { organId: 'heart_human', hp: 5 }, skin: { organId: hPmp, hp: 5 } } };
t('pompe ×5 : sang 3 → 5 (×1.5 arrondi)', CR.bloodPool(body1, organResolver) === Math.round(3 * 1.5));
const body0 = { slots: { heart: { organId: 'heart_human', hp: 5 } } };
t('sans pompe : sang 3', CR.bloodPool(body0, organResolver) === 3);

// ── Organes morts ne comptent pas ────────────────────────────────────────────
setBody({ eye_l: { organId: 'eye_human', hp: 0 } });
t('œil mort : aucune vue', !F.grants('vue', 'gauche'));

console.log(`\n${ok}/${ok + fail} tests passent${fail ? ' — ' + fail + ' ÉCHEC(S)' : ' ✅'}`);
process.exit(fail ? 1 : 0);
