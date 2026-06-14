# CHAIR — Architecture technique

> Data-orienté + orienté objet. Modules à dépendances minimales. WorldState comme source unique de vérité.

---

## Règles fondamentales

1. Les **systèmes** (C4-C5) ne s'importent jamais entre eux — ils lisent/écrivent le WorldState
2. Le **rendu** (C7) est read-only sur le WorldState — zéro effet de bord sur l'état
3. L'**InputHandler** (C6) ne connaît pas le jeu — il produit des actions abstraites
4. `main.js` est le seul module qui importe tout — il orchestre l'ordre d'exécution
5. `MemorySystem` est le seul module à toucher localStorage
6. `registry.js` est le seul module à lire les fichiers JSON
7. Tout l'aléatoire passe par le RNG seedé — zéro `Math.random()` dans les systèmes

---

## Couche 0 — Utilitaires

> Zéro dépendance.

| Fichier | Rôle |
|---------|------|
| `rng.js` | mulberry32, pick, weighted, shuffle |
| `utils.js` | clamp, lerp, deepCopy |

---

## Couche 1 — Contenu

> Données pures. Zéro logique.

```
content/
  organs.json     pool complet des organes (def + stats + triggers + visual)
  mobs.json       gabarits et thèmes de mobs signés
  rooms.json      définitions de salles (type, spawns, features, ui)
  relics.json     reliques (slot et usage)
  biomes.json     strates, voies, boss, palettes CSS, themes mob
  lore.json       fragments narratifs indexés
```

| Fichier | Rôle |
|---------|------|
| `registry.js` | Charge tous les JSON au boot. Expose des lookups `get(id)` en O(1). Seul point d'accès aux données statiques. Valide les schémas au chargement (erreur explicite si un JSON est malformé). |

---

## Couche 2 — Entités domaine

> Dépend : registry, utils. Zéro logique de jeu.

| Classe | Rôle |
|--------|------|
| `Organ.js` | Wrap une définition JSON + hp courant. Calcule quality ratio, price effectif. |
| `Body.js` | 12 slots fixes + extraSlots (reliques). organHp par slot. `stat(key)`, `humanity()`, `isAlive()`. |
| `Floor.js` | Grille N×N, cases taguées (roomId, type, revealed). Entrée, sortie, liste de salles. |
| `Room.js` | Une salle : type, ui, spawns, features, état (visited, cleared, mobIds). |

---

## Couche 3 — WorldState

> Dépend : entités domaine. Singleton. Source unique de vérité.

```js
WorldState = {

  // RUN EN COURS
  run: {
    seed       : number,
    humeur     : string,          // fievre | frissons | bile_montante | rigor | insomnie
    voie       : string,          // air | chair | null (avant carrefour)
    biome      : string,          // gorge | poumons | coeur | estomac | entrailles
    floorNum   : number,
    tick       : number,

    pos        : [x, y],
    dir        : 'N'|'S'|'E'|'O',

    body       : Body,
    floor      : Floor,
    currentRoomId : string,

    // Cycle de vie des mobs : pending → active → dead → harvested → removed
    // pending   : mob généré mais pas encore dans la salle courante
    // active    : dans la salle, participe au combat
    // dead      : corps présent, decomposeTick schedulé dans TickEngine
    // harvested : loot pris, corps encore visible
    // removed   : decomposeTick écoulé ou joueur sorti de la salle → purgé
    activeMobs : Mob[],           // { body, behavior, theme, phototropism, aiState, lifecycle }
    cadavers   : Cadaver[],       // { body, harvestedSlot, decomposeTick, pos, quality }

    bag        : BagItem[],       // { organId, quality, mult, rottingTick } — 6 slots : 2 base + 2 bras_g + 2 bras_d (2 bras au départ)
    viande     : number,
    torches    : number,
    satiete    : number,          // 0-100
    hallu      : number,          // 0-100
    humanity   : number,          // miroir de body, recalculé à chaque greffe

    activeSounds  : Sound[],      // { id, x, label, amp, hue, decay, isFake }
    pendingEvents : GameEvent[],  // { type, priority, ctx, emittedAtTick, depth }
    statusEffects : StatusEffect[], // { id, ticksLeft, source }

    lightState : 'off'|'dim'|'bright',
    log        : LogLine[],       // { text, cls } — 4 lignes max
  },

  // MÉTA (persiste entre runs)
  meta: {
    version       : number,
    runCount      : number,
    loreUnlocked  : string[],
    reliquaire    : string[],
    endingsSeen   : string[],
  },

  graveyard : GraveyardEntry[],
  heritage  : { organId, quality } | null,
  rival     : { body: Body, alive, kills, grudges: string[] },
  seeds     : SeedEntry[],

  settings: {
    screamersEnabled : boolean,
    audioEnabled     : boolean,
  }
}
```

---

## Couche 4 — Systèmes purs

> Dépend : WorldState + utils/rng. **Jamais entre eux.**

| Fichier | Rôle | Écrit dans |
|---------|------|-----------|
| `TickEngine.js` | File `{ atTick, fn }` triée. `advance(n)` exécute jusqu'à tick+n. Enregistre les événements futurs (faim, torche, pourriture, décomposition, pattern mob). | `run.tick`, `run.pendingEvents` |
| `CombatSystem.js` | `attack()`, couches outer→mid→deep, ciblage, armure, fenêtre de riposte, mort propre vs violente. | `run.activeMobs[].body.organHp`, `run.body.organHp`, `run.cadavers`, `run.log`, `run.activeSounds`, `run.pendingEvents` |
| `HarvestSystem.js` | `quality()` depuis organHp ratio + fragileTo. Décomposition cadavre au tick. Bruit de récolte. | `run.bag`, `run.cadavers`, `run.activeSounds` |
| `GraftSystem.js` | `graft()`, `amputate()`. Coût en ticks. Recalcule humanity. Émet onGraft. | `run.body`, `run.humanity`, `run.pendingEvents` |
| `HungerSystem.js` | Tick satiété. Autophagie à 0. Torche. Pourriture besace. | `run.satiete`, `run.torches`, `run.body.organHp`, `run.bag` |
| `LightSystem.js` | Gère lightState. Consommation torche. Calcule aggro phototropique. | `run.lightState`, `run.activeMobs[].aiState` |
| `MobAI.js` | Behavior (stalker, ambusher...) + phototropism. `updateIntents()` choisit la prochaine action. `resolveIntents()` l'exécute. | `run.activeMobs[].aiState`, `run.pendingEvents`, `run.activeSounds` |
| `StatusSystem.js` | Décrémente ticksLeft. Applique les règles (panic → inputs inversés, fear → recul). Purge à 0. `checkInputModifiers()` consulté avant chaque action joueur. | `run.statusEffects`, `run.pendingEvents` |
| `DungeonGen.js` | `genFloor(seed, biome, floorNum) → Floor`. Déterministe. | `run.floor` |
| `MobGen.js` | `genMob(rng, biome, floorNum, elite) → Mob`. Budget arcane, thème, anatomie. | `run.activeMobs` |
| `CadaverGen.js` | `genDungeonFromBody(body, meta) → layout`. Carte évolutive. | Utilisé au lancement d'une nouvelle run. |
| `TriggerBus.js` | Voir contrat détaillé ci-dessous. | via ctx |
| `abilities.js` | `AbilityRegistry` : map `id → fn(ctx)`. | via ctx |
| `curses.js` | `CurseRegistry` : map `id → fn(ctx)`. | via ctx |
| `bossPatterns.js` | `BossPatternRegistry` : map `id → { onPhase, onTick, telegraph }`. | via ctx |
| `SoundStage.js` | Modèle positionnel. `emit(sound)`, `tick(dt)` pour le decay. Bidirectionnel. | `run.activeSounds` |
| `HalluSystem.js` | Jauge 0-100. Injecte faux sons à certains paliers. | `run.hallu`, `run.activeSounds` |

---

## Couche 5 — Systèmes NPC (split du God-object)

> NPCSystem découpé en 5 modules indépendants + 1 système commun.

| Fichier | Rôle |
|---------|------|
| `DialogueSystem.js` | Système commun : gates HUM, lore débloqué, variantes de texte. Utilisé par tous les autres systèmes NPC. |
| `MerchantSystem.js` | Marchand : inventaire, buy/sell, tarification (×1.6 achat, ×mult_qualité vente), pity timer. |
| `CrafterSystem.js` | Couturière : greffe/amputation/couture propres, consigne Héritage, vente reliques de slot. |
| `PillardSystem.js` | Pillards procéduraux : machine d'état (blessé → allié, marchand, hostile, mourant). |
| `RivalSystem.js` | Rival : évolution du build entre runs, dialogue, rancunes, alliance/trahison, combat. |
| `EchoSystem.js` | Écho du dieu : actif à HUM < 30, pactes (slot colonisé vs organe XXI), murmures sur La Ligne. |
| `MemorySystem.js` | Save/load localStorage. Graveyard, héritage, graines, reliquaire. **Seul module à toucher le stockage.** Voir section robustesse ci-dessous. |

---

## Couche 6 — Input

> Zéro connaissance du jeu.

**`InputHandler.js`**

Sources :
- **PC** : `keydown` (ZQSD / flèches, Q/E pour tourner, 1–6 pour actions)
- **Mobile** : `touchstart` sur les boutons DOM du padmini et de la barre d'actions

Actions abstraites émises sur un `EventTarget` partagé :

```js
'MOVE_FORWARD' | 'MOVE_BACK' | 'TURN_LEFT' | 'TURN_RIGHT'
| 'STRAFE_LEFT' | 'STRAFE_RIGHT'
| 'ACTION_1' … 'ACTION_6'
| 'AIM_SEGMENT'   // payload: { slotId }
| 'INSPECT'       // payload: { targetId, targetType }
| 'OPEN_MENU' | 'SAVE' | 'IMPORT'
```

`main.js` s'y abonne et dispatch. Portrait mobile → message "⟳ pivote ton téléphone".

---

## Couche 7 — Rendu

> Lecture seule sur WorldState. Zéro effet de bord.

### Scène

| Fichier | Rôle |
|---------|------|
| `SceneRenderer.js` | Couloir CSS par biome (clip-path trapèzes). Torchlight. Biome theming via `data-biome` sur `.game`. |
| `MobRenderer.js` | Silhouette procédurale depuis `mob.body` : masse, yeux (nb + couleur = organe eye), appendices, thème → palette. Dommages → opacité/flou. Cache le DOM entre ticks si le mob n'a pas changé. |
| `BodyFX.js` | **Pilier 1.** Lit `run.body.slots`, applique les overlays CSS : œil vendu → moitié noire, boiterie → vue penchée, heartbeat, infection… Un overlay CSS par organe. |
| `DeathFX.js` | Spasme CSS à la mort violente selon theme (putréfié → nuage, cristallin → éclats, brûlant → flammes). |

### HUD

| Fichier | Rôle |
|---------|------|
| `HUDRenderer.js` | En-tête, besace, log. Diff avant mise à jour : ne touche le DOM que si la donnée a changé. |
| `MinimapRenderer.js` | Grille révélée en explorant. Cache la grille, redessine uniquement les deltas. `◌` rouge = ennemi entendu. Fausses portes (hallu 50+). |
| `SegmentBar.js` | Composant réutilisable : barre segmentée depuis un `Body`. Couleur, locked, glow récolte. Partagé joueur + ennemi. |
| `ActionBar.js` | Dérive les 6 slots depuis `run.body.slots`. Reconstruit sur signal `onGraft`/`onAmputate` uniquement. |
| `InspectorPanel.js` | Stats dérivées par défaut. Fiche au clic. Bouton retour. |

### Panels de salle

| Fichier | `room.ui` | Rôle |
|---------|-----------|------|
| `RoomPanel.js` | — | Router : monte/démonte le bon panel selon `currentRoom.ui` |
| `panels/CombatPanel.js` | `combat` | Barre ennemie (SegmentBar), télégraphe |
| `panels/TradePanel.js` | `trade` | 2 colonnes marchand |
| `panels/GraftPanel.js` | `graft` | Onglets greffe / amputer / coudre / consigne |
| `panels/AltarPanel.js` | `altar` | Autel + fiche sacrifice |
| `panels/RestPanel.js` | `rest` | Banc / Abri |
| `panels/PuzzlePanel.js` | `puzzle` | Interaction scène |
| `panels/PathChoicePanel.js` | `pathchoice` | Récolte boss + choix de voie |

### Audio

| Fichier | Rôle |
|---------|------|
| `LineRenderer.js` | Canvas La Ligne. rAF continu mais ne redessine que si `activeSounds` a changé (dirty flag). |
| `AudioDriver.js` | WebAudio. Heartbeat synchronisé au segment cœur. Screamers filtrés par settings. |

---

## Couche 8 — Bootstrap

**`main.js`** — orchestre tout.

---

## Boucle de jeu — ordre explicite et justifié

La boucle est découpée en **trois phases** par tick. L'ordre n'est pas arbitraire.

```
═══════════════════════════════════════════════════════
PHASE A — RÉSOLUTION  (l'action du joueur)
═══════════════════════════════════════════════════════

  1. StatusSystem.checkInputModifiers()
     → AVANT tout : si panic, les inputs sont déjà inversés.
       Si on lit l'input après, on applique la règle au mauvais moment.

  2. [action joueur] selon le type :
       déplacement  → mise à jour pos/dir + SoundStage.emit(pas)
       combat       → CombatSystem.attack()
       greffe       → GraftSystem.graft() / amputate()
       récolte      → HarvestSystem.harvest()
       interaction  → RoomPanel.interact()

  3. TriggerBus.flush(PRIORITY.ACTION)
     → onKill, onDamaged, onDestroy, onGraft, onHarvest, onEnterRoom.
       Ces triggers répondent à ce que le joueur vient de faire.
       Ils doivent résoudre AVANT que le monde ne réponde (phase B),
       sinon un onKill qui soigne le joueur arrive après les dégâts du mob.

═══════════════════════════════════════════════════════
PHASE B — RIPOSTE MONDE  (le monde répond à l'action)
═══════════════════════════════════════════════════════

  4. MobAI.resolveIntents()
     → Les mobs qui avaient un intent télégraphié (impactTick = tick courant)
       exécutent leur action maintenant.
       APRÈS le joueur : il a eu sa chance de riposter (fenêtre de riposte).

  5. TriggerBus.flush(PRIORITY.MOB)
     → onDamaged, onSound issus des actions mob.
       Même logique : leurs triggers résolvent avant l'entretien.

═══════════════════════════════════════════════════════
PHASE C — ENTRETIEN  (le tick d'horloge)
═══════════════════════════════════════════════════════

  6. LightSystem.tick()
     → Consommation torche. Mise à jour lightState.
       AVANT MobAI.updateIntents : les mobs choisissent leur prochain
       mouvement en fonction de la lumière actuelle, pas de la précédente.

  7. MobAI.updateIntents()
     → Chaque mob vivant choisit son prochain intent (= télégraphe du
       prochain tick). Dépend de lightState (6) et des sons actifs.

  8. HungerSystem.tick()
     → Faim, autophagie, torche (si pas encore gérée en 6), pourriture besace.
       EN DERNIER dans les ressources : le joueur a déjà agi, il mérite
       de voir l'effet de son action avant que la faim ne le ronge.

  9. HarvestSystem.tickDecompose()
     → Qualité des cadavres baisse. Sons de charognards si décomposition active.

  10. SoundStage.tick()
      → Decay de tous les sons actifs.

  11. HalluSystem.tick()
      → Monte/descend hallu. Injecte faux sons si palier atteint.
        APRÈS SoundStage : les vrais sons ont leur amplitude à jour,
        les faux sons s'y ajoutent sans interférer avec le decay réel.

  12. StatusSystem.tick()
      → Décrémente ticksLeft. Purge les statuts expirés.

  13. TriggerBus.flush(PRIORITY.TICK)
      → onTick passifs (malédictions, effets continus).
        EN DERNIER : état stabilisé, pas de surprise mid-tick.

═══════════════════════════════════════════════════════
RENDER  (lecture seule, découplé de la logique)
═══════════════════════════════════════════════════════

  14. [tous les renderers lisent WorldState et mettent à jour le DOM/canvas]
      La Ligne + AudioDriver tournent en rAF continu indépendamment.
```

---

## TriggerBus — contrat complet

> Point le plus casse-gueule du jeu. Contrat précis ou bugs non-déterministes garantis.

### Shape d'un événement

```js
GameEvent = {
  type         : string,    // 'onKill' | 'onDamaged' | 'onDestroy' | 'onTick'
                            // | 'onSound' | 'onHarvest' | 'onGraft' | 'onEnterRoom'
  priority     : 'ACTION' | 'MOB' | 'TICK',
  ctx: {
    source     : Body,      // qui émet l'événement
    target     : Body | null,
    organ      : Organ | null,
    slot       : string | null,
    value      : number | null,  // dégâts, PV récupérés, etc.
    game       : WorldState,     // accès complet — les handlers écrivent via WorldState
  },
  emittedAtTick : number,
  depth         : number,   // profondeur de cascade, incrémenté à chaque re-émission
}
```

### Ordre de traitement déterministe

Dans chaque `flush(priority)` :

1. Filtrer `pendingEvents` sur la priority demandée
2. Trier par `(emittedAtTick ASC, depth ASC, type ASC)` — ordre alphabétique sur `type` comme tie-breaker final
3. Traiter dans cet ordre, FIFO à égalité parfaite
4. Les handlers peuvent émettre de nouveaux events → ajoutés en fin de queue courante, PAS dans un nouveau flush

### Budget et garde-fous anti-boucle

```
BUDGET_PAR_FLUSH   = 64   // events total traités par flush()
DEPTH_MAX          = 8    // profondeur de cascade max
SAME_TYPE_PER_SOURCE = 3  // un même (type + source.id) ne peut pas se répéter
                           // plus de 3 fois dans le même flush
```

Si `depth > DEPTH_MAX` → event ignoré + warning dans le log.
Si budget dépassé → flush interrompu + warning. Le jeu continue, les events non traités sont **purgés** (pas reportés au tick suivant — évite l'accumulation).

Les "combos qui s'emballent" du GDD restent possibles dans le budget. Au-delà, on coupe proprement.

### Registres

```js
// AbilityRegistry : handlers actifs, déclenchés par action
AbilityRegistry['see_invisible'] = (ctx) => { ... }

// CurseRegistry : handlers passifs, déclenchés au tick
CurseRegistry['paranoia'] = (ctx) => { ctx.game.run.hallu += 2; }

// BossPatternRegistry : cycle de phases
BossPatternRegistry['pattern_tongue'] = {
  phases    : 3,
  onPhase   : (phaseNum, ctx) => { ... },  // appelé à chaque changement de phase
  onTick    : (ctx) => { ... },             // appelé à chaque tick de combat boss
  telegraph : (ctx) => string,             // retourne le texte du télégraphe
}
```

---

## Couche de test et déterminisme

> Le jeu est entièrement déterministe. Une seed + une séquence d'actions = toujours le même état final.

### `TestHarness.js`

```js
// Rejoue une seed avec une séquence d'actions connue
TestHarness.replay(seed, actions[]) → WorldState final

// Snapshot de l'état à un tick donné
TestHarness.snapshot(worldState, tick) → JSON

// Compare deux snapshots
TestHarness.diff(snapA, snapB) → diff[]

// Vérifie le déterminisme : même seed lancée 2 fois doit donner le même snapshot
TestHarness.assertDeterministic(seed, actions[])
```

### Intégration `_tests/`

Les fichiers existants (`engine.mjs`, `run.mjs`, `difficulty.mjs`) testent les formules isolément. Ils restent valides et sont exécutés avec `node`.

`TestHarness.js` teste le jeu complet de bout en bout (seed → run → mort). Les deux niveaux sont complémentaires :

| Niveau | Fichier | Lance avec | Teste |
|--------|---------|-----------|-------|
| Formules | `_tests/run.mjs` | `node` | Stats, combat, récolte, faim, éco, génération mob |
| Difficulté | `_tests/difficulty.mjs` | `node` | Winrate par profil joueur |
| Intégration | `TestHarness.js` | `main.js` en mode test | Run complète, déterminisme, save/load |

### Contrainte d'implémentation

Aucun système ne doit appeler `Math.random()` ni `Date.now()` directement. Seul le RNG seedé est autorisé. Cela garantit que `TestHarness.replay()` peut reproduire n'importe quelle run à partir de sa seed et de sa liste d'actions.

---

## Robustesse — Save corrompue

`MemorySystem.load()` suit ce protocole :

```
1. Lire localStorage['chair_save_v1']
2. Si absent → nouvelle partie, rien à faire
3. JSON.parse() dans un try/catch → si erreur → GOTO 6
4. Valider le schéma :
     - meta.version présent et === VERSION_COURANTE
     - champs requis présents (meta, graveyard, run si currentRun)
     - types corrects (Body valide, organes dans registry, etc.)
5. Si valide → appliquer au WorldState
6. Si invalide (parse error ou validation échouée) :
     - Logger l'erreur dans la console
     - Proposer à l'écran : [Nouvelle partie] [Télécharger la sauvegarde corrompue]
     - NE PAS écraser automatiquement la save corrompue (peut contenir du lore précieux)
     - Démarrer une nouvelle partie sans toucher localStorage
```

Auto-save uniquement sur **checkpoint** (jamais au tick) :
- Transition de salle
- Mort du joueur
- S'asseoir sur le Banc / entrer dans l'Abri
- Manuellement via le bouton ⇩ SAVE

---

## Cycle de vie des mobs et cadavres

```
Mob :
  pending   → généré par MobGen, pas encore dans la salle courante
  active    → joueur entre dans la salle, mob passe active
  dead      → heart destroyed (si cœur présent), ou premier segment détruit (sans cœur — les autres restent intacts pour la récolte)
              decomposeTick schedulé dans TickEngine
              → cadavre créé dans run.cadavers
  removed   → decomposeTick atteint OU joueur sort de la salle
              → purgé de run.activeMobs

Cadavre :
  fresh     → vient d'être créé, qualité max
  decaying  → HarvestSystem.tickDecompose() baisse la qualité au tick
  harvested → loot pris, corps visible mais vide
  gone      → decomposeTick atteint → retiré de run.cadavers

Nettoyage à la transition de salle :
  - Tous les mobs `dead` ou `pending` de l'ancienne salle → removed
  - Tous les cadavres `decaying` ou `harvested` → gone
  - Cadavres `fresh` (pas encore touchés) → conservés si la salle est revisitée
    (le TickEngine continue leur décomposition même hors-salle)
```

---

## Performance

| Sujet | Stratégie |
|-------|-----------|
| **La Ligne canvas** | rAF continu, mais dirty flag : ne redessine que si `activeSounds` a changé depuis le dernier frame |
| **HUDRenderer** | Diff avant écriture DOM : chaque zone compare sa donnée à la valeur précédemment rendue, n'écrit que les deltas |
| **MinimapRenderer** | Cache la grille révélée en off-screen canvas, recomposite uniquement les cases nouvellement révélées |
| **MobRenderer** | Cache le DOM de chaque mob entre ticks. Mise à jour sur signal (organHp changé, mob blessé) uniquement |
| **ActionBar** | Reconstruit uniquement sur `onGraft` / `onAmputate`, pas à chaque render |
| **BodyFX** | Les overlays CSS sont des classes toggleées, pas recalculées à chaque frame |
| **TickEngine** | La logique n'avance qu'au tick (event-driven). Le rAF ne fait que du rendu, zéro logique de jeu |
| **Sons WebAudio** | Nodes créés et détruits par événement, jamais de boucle de GC surprise |

---

## Structure de fichiers

```
src/modules/games/chair/
  index.html
  styles/
    tokens.css
    hud.css
    scene.css
  src/
    main.js
    WorldState.js
    rng.js
    utils.js
    registry.js
    entities/
      Organ.js
      Body.js
      Floor.js
      Room.js
    systems/
      TickEngine.js
      CombatSystem.js
      HarvestSystem.js
      GraftSystem.js
      HungerSystem.js
      LightSystem.js
      MobAI.js
      StatusSystem.js
      DungeonGen.js
      MobGen.js
      CadaverGen.js
      TriggerBus.js
      abilities.js
      curses.js
      bossPatterns.js
      SoundStage.js
      HalluSystem.js
      npc/
        DialogueSystem.js
        MerchantSystem.js
        CrafterSystem.js
        PillardSystem.js
        RivalSystem.js
        EchoSystem.js
      MemorySystem.js
    input/
      InputHandler.js
    render/
      SceneRenderer.js
      MobRenderer.js
      BodyFX.js
      DeathFX.js
      HUDRenderer.js
      MinimapRenderer.js
      SegmentBar.js
      ActionBar.js
      InspectorPanel.js
      LineRenderer.js
      AudioDriver.js
      RoomPanel.js
      panels/
        CombatPanel.js
        TradePanel.js
        GraftPanel.js
        AltarPanel.js
        RestPanel.js
        PuzzlePanel.js
        PathChoicePanel.js
    test/
      TestHarness.js
  _tests/
    engine.mjs
    run.mjs
    difficulty.mjs
  content/
    organs.json
    mobs.json
    rooms.json
    relics.json
    biomes.json
    lore.json
  ARCHITECTURE.md
```

---

## Contrôles — PC + Mobile (paysage)

Les boutons DOM sont identiques dans les deux cas.

| Action | PC | Mobile |
|--------|-----|--------|
| Avancer | ↑ / Z | Bouton ↑ du padmini |
| Reculer | ↓ / S | Bouton ↓ |
| Tourner gauche | Q | Bouton ↺ |
| Tourner droite | E | Bouton ↻ |
| Pas côté G/D | ← → / A D | Boutons ← → |
| Actions 1–6 | Touches 1–6 | Boutons barre d'actions |
| Viser un segment | Clic segment ennemi | Tap segment ennemi |
| Inspecter | Clic `[data-i]` | Tap |
| Menu / Save | Boutons en-tête | Tap boutons en-tête |

Portrait mobile → message "⟳ pivote ton téléphone" (déjà dans les protos).

---

## Graphe de dépendances

```
utils / rng
    └── registry
            └── Organ · Body · Floor · Room
                        └── WorldState
                                └── [systèmes C4 + NPC C5]
                                            │
                                     (via WorldState uniquement,
                                      jamais entre eux)
                                            │
                                        main.js ←── InputHandler (C6)
                                            │
                                    [renderers C7]
                                  (lecture WorldState, zéro write)
```
