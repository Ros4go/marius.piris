// ViewportDOM — SOURCE UNIQUE du squelette DOM du viewport première personne.
// Consommé par index.html (jeu) ET tools/view-sandbox.html (atelier).
//
// Architecture scènes (DA proto v5) :
//   .scene = [ .scene-decor (interchangeable, content/scenes.json) ]
//          + [ SOCKETS moteur, fixes : gore, exits, pit, mob-display,
//              torchlight/darkness, desat, eyeblind, npc-figure ]
// setScene(id) échange le décor sans toucher aux sockets — MobRenderer,
// RoomPanel, SensoryFX continuent de fonctionner dans n'importe quelle scène.

import SCENES from '../../content/scenes.json';

export function sceneDefs() { return SCENES; }

// ── Sockets standards : TOUT ce que le moteur cible par id/classe ────────────
const SOCKETS_HTML = `
        <!-- Décoration (La Gorge only): ONE rare decor per room, chosen by
             SceneRenderer parmi les entrées "decoration" de structures.json et
             rendue en SPRITE par SpriteFX.decorFigure (plus d'art codé en dur) -->
        <div class="gore" id="gore" data-prop="none" aria-hidden="true"></div>
        <!-- Directional passage doorways (shown by SceneRenderer when a cell exists) -->
        <div class="exit exit-l" id="exit-l" aria-hidden="true"><svg class="exit-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="3,20 11,13 20,34 20,81 3,97"/></svg></div>
        <div class="exit exit-r" id="exit-r" aria-hidden="true"><svg class="exit-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="97,20 89,13 80,34 80,81 97,97"/></svg></div>
        <div class="exit exit-f" id="exit-f" aria-hidden="true"><svg class="exit-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="42,40 50,34 58,40 58,66 42,66"/></svg></div>
        <!-- Warm light spilling from the passage behind you (shown when you can step back) -->
        <div class="exit-back" id="exit-b" aria-hidden="true"></div>
        <!-- Mysterious irradiating pit in the descent room -->
        <div class="floor-pit" id="floor-pit" aria-hidden="true"></div>
        <!-- Mob silhouette (dynamic, managed by MobRenderer) -->
        <div class="creature" id="mob-display">
          <div class="c-mass"></div>
          <div class="c-eye l"></div>
          <div class="c-eye r"></div>
        </div>
        <!-- Ambiance -->
        <div class="torchlight" aria-hidden="true"></div>
        <div class="darkness"   aria-hidden="true"></div>
        <!-- Colour-vision desaturation half-overlays (right / left) — vue-couleur -->
        <div class="desat"   aria-hidden="true"></div>
        <div class="desat-l" aria-hidden="true"></div>
        <!-- Eye blind body-fx overlays (right eye / left eye) -->
        <div class="eyeblind"   id="body-fx"    aria-hidden="true"></div>
        <div class="eyeblind-l" aria-hidden="true"></div>
        <!-- NPC figure (merchant / seamstress / etc.) — managed by RoomPanel -->
        <div id="npc-figure" aria-hidden="true"></div>
`;

// ── Chrome du viewport (hors .scene) ─────────────────────────────────────────
const CHROME_HTML = `
      <!-- Room-transition flash overlay (direction-driven, see _playTransition) -->
      <div id="room-fx" aria-hidden="true"></div>

      <!-- Enemy overlay (shown in combat) -->
      <div class="foe" id="foe-panel">
        <div class="foe-name" id="foe-name"></div>
        <div class="segbar"   id="foe-seg"></div>
        <div class="foe-intent" id="foe-intent"></div>
      </div>

      <!-- Room-specific overlay (trade / graft / altar / rest / puzzle / pathchoice) -->
      <div id="room-panel"></div>

      <!-- La Ligne (sound visualizer canvas) -->
      <div class="soundline" aria-label="La Ligne sonore">
        <canvas id="slc"></canvas>
        <div class="sl-axis" aria-hidden="true">
          <span>◄ G</span><span>FACE</span><span>D ►</span>
        </div>
      </div>
`;

const DEFAULT_SCENE = 'gorge_couloir';

// Injecte le squelette dans un élément .viewport (vide). Idempotent.
export function build(viewportEl, sceneId = DEFAULT_SCENE) {
  if (!viewportEl || viewportEl.querySelector('.scene')) return viewportEl;
  viewportEl.innerHTML =
    `<div class="scene" id="scene"><div class="scene-decor" aria-hidden="true"></div>${SOCKETS_HTML}</div>${CHROME_HTML}`;
  setScene(sceneId);
  return viewportEl;
}

// Échange le décor de la scène (les sockets restent intacts). No-op si inchangé.
export function setScene(sceneId) {
  const scene = document.querySelector('.scene');
  const decor = scene?.querySelector('.scene-decor');
  if (!scene || !decor) return;
  const def = SCENES[sceneId] ?? SCENES[DEFAULT_SCENE];
  const id = SCENES[sceneId] ? sceneId : DEFAULT_SCENE;
  if (scene.dataset.scene === id) return;
  scene.dataset.scene = id;
  scene.style.setProperty('--scene-tempo', `${def.tempo ?? 8}s`);
  decor.innerHTML = def.html ?? '';
}

export function currentScene() {
  return document.querySelector('.scene')?.dataset.scene ?? DEFAULT_SCENE;
}

// ── Squelettes des panneaux HUD partagés (jeu + atelier) ─────────────────────
// InventoryRenderer peuple ces 12 .cell ; MinimapRenderer peuple #minimap-grid.

export const INVENTORY_CELLS_HTML = `
        <!-- 12 cells: 0-1 base, 2-3 bras gauche, 4-5 bras droit, 6-11 verrouillés -->
        <div class="cell"></div><div class="cell"></div>
        <div class="cell"></div><div class="cell"></div>
        <div class="cell"></div><div class="cell"></div>
        <div class="cell"></div><div class="cell"></div>
        <div class="cell"></div><div class="cell"></div>
        <div class="cell"></div><div class="cell"></div>
`;

export const MINIMAP_WRAP_HTML = `
        <span class="compass" id="compass-dir">N ▴</span>
        <div class="map" id="minimap-grid">
          <!-- .mc cells rendered by MinimapRenderer -->
        </div>
        <div class="maplegend">
          <span>▲ toi</span>
          <span class="le">◌ entendu</span>
          <span>▒ deviné</span>
        </div>
`;

// Remplit un conteneur vide avec un squelette partagé. Idempotent.
export function buildInto(el, html) {
  if (el && !el.children.length) el.innerHTML = html;
  return el;
}
