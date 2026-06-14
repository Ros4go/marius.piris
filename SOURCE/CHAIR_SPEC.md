# CHAIR — Spécification technique (v1.0)

> Document d'implémentation pour Claude Code. À lire **avec** `CHAIR_GDD.md` (la vision) et les 5 pages `chair_da_proto_*.html` (la DA/UI figée). Le GDD dit *quoi* et *pourquoi* ; ce doc dit *comment*. En cas de doute sur un chiffre, ce doc fait foi.

## 0. Stack & principes

- **100 % client** : HTML + CSS + JS vanilla (ES modules). Aucun framework, aucun build step, aucune dépendance réseau. Doit tourner en ouvrant `index.html`.
- **Orienté data** : tout le contenu (organes, mobs, salles, reliques, lore) vit dans des fichiers JSON. Le code n'est qu'un interpréteur. Ajouter du contenu = écrire du JSON, jamais du code.
- **Déterministe** : tout l'aléatoire passe par un RNG seedé (mulberry32). Même seed = même donjon. On ne stocke jamais le donjon, seulement la seed + l'état.
- **Les 4 primitives** (cf. GDD) sont 4 modules : `TickEngine`, `Body/Organ`, `SoundStage`, `Memory`.
- **Rendu** : la vue est un couloir/chambre en CSS (cf. protos), pas de canvas 3D. La Ligne sonore est un canvas 2D. Le HUD est du DOM.
- **Pas de localStorage dans les artifacts de dev**, mais le jeu final l'utilise pour la save (clé `chair_save_v1`).

## 1. Arborescence des fichiers

```
/index.html
/styles/
  tokens.css        ← variables (palette par biome, typo, espacements) — extraites des protos
  hud.css           ← cadre, panneaux suturés, barres segmentées, Ligne, barre d'actions
  scene.css         ← rendu des biomes (gorge, poumons, coeur, estomac, entrailles)
/src/
  main.js           ← bootstrap, boucle, câblage UI
  rng.js            ← mulberry32 + helpers (pick, weighted, shuffle)
  tick.js           ← TickEngine : file d'événements datés, avance le temps
  body.js           ← classes Body, Organ ; calcul des stats dérivées
  combat.js         ← CombatResolver : tours, ciblage, couches, riposte, mort
  triggers.js       ← TriggerBus + AbilityRegistry + CurseRegistry + BossPatternRegistry
  dungeon.js        ← génération d'étage (salles, quotas) + carte
  cadaver.js        ← génération de donjon à partir d'un Body du graveyard (carte évolutive)
  mobgen.js         ← génération procédurale de mobs (budget, thème, anatomie)
  sound.js          ← SoundStage : modèle des sons + rendu Ligne (canvas) + WebAudio
  hallucination.js  ← jauge + corruption des canaux (vue/Ligne)
  npc.js            ← marchand, couturière, autel, pillards, rival, écho du dieu
  memory.js         ← save/load JSON, graveyard, reliquaire, héritage, graines
  render.js         ← rendu de la scène (biome) + HUD + Inspecteur
  content/
    organs.json     ← le pool d'organes (chiffré)
    mobs.json       ← gabarits & thèmes de mobs signés
    rooms.json      ← définitions de salles
    relics.json     ← reliques
    biomes.json     ← strates, voies, boss, palettes
    lore.json       ← fragments narratifs
    abilities.md    ← doc humaine du registre (le code est dans triggers.js)
```

## 2. Schémas de données (la source de vérité)

### Organ
```json
{
  "id": "eye_beholder",
  "type": "eye",
  "name": "Œil de Beholder",
  "arcana": 9,
  "tier": "rare",
  "hp": 12,
  "layer": "mid",  // échelle PV organe : 6-24 (commun 6-12, rare 9-18, épique 12-24)
  "stats": { "per": 3, "prc": 1 },
  "abilities": ["see_invisible"],
  "triggers": [{ "on": "onKill", "do": "purge_infection" }],
  "curses": ["paranoia"],
  "humanity": -15,
  "sounds": { "active": "blink_wet", "passive": null },
  "harvest": { "fragileTo": ["fire", "crush"] },
  "visual": { "overlay": "hex-fragment", "color": "#a040c0", "dot": "mut" },
  "price": 70
}
```
- `type` ∈ {eye, ear, arm, legs, heart, skin, brain, stomach, tongue}
- `tier` ∈ {common, rare, epic, legendary} (dérivable de `arcana` mais stocké pour clarté)
- `layer` ∈ {outer, mid, deep}
- `stats` : seules les clés non nulles ; clés ∈ {dgt, prc, per, oui, brt, vit, arm, fam, lum, ryt}
- `humanity` : entier ≤ 0 (0 = humain)
- `abilities`/`curses`/`triggers[].do` : IDs résolus dans les registres de `triggers.js`
- `price` : valeur de base en viande (vente = price, achat ≈ price×1.6)

### Body (joueur, mob, boss, cadavre : structure unique)
```json
{
  "id": "player",
  "slots": {
    "eye_l": "eye_beholder", "eye_r": null,
    "ear_l": "ear_human", "ear_r": "ear_human",
    "arm_l": "arm_troll", "arm_r": null,
    "legs": "legs_human", "heart": "heart_human",
    "skin": "skin_human", "brain": "brain_human",
    "stomach": "stomach_human", "tongue": "tongue_human"
  },
  "extraSlots": [
    { "id": "arm_x1", "type": "arm", "source": "relic_third_shoulder", "organ": "arm_human" }
  ],
  "organHp": { "eye_l": 6, "arm_l": 5, "heart": 6, "...": 0 },
  "statusEffects": [{ "id": "fear", "ticksLeft": 3, "source": "boss_tongue" }]
}
```
- Les 12 slots de base sont fixes ; `extraSlots` ajoutés par reliques.
- `organHp` : PV courants par slot (l'organe définit le max via `hp`).
- Un Body **sans heart vivant** = mort (joueur) ou détruit quand tous segments à 0 (golem).

### Mob = Body + IA
```json
{ "body": { "...": "..." }, "behavior": "stalker", "theme": "putrid",
  "phototropism": "repelled", "elite": false, "graveyardOf": null }
```
- `behavior` ∈ {stalker, ambusher, charger, ranged, fleer, swarm} (table dans mobgen)
- `graveyardOf` : id de run si c'est un ancien corps.

### SaveFile (clé localStorage `chair_save_v1`)
```json
{
  "meta": { "version": 1, "runCount": 12, "loreUnlocked": ["gorge_1","..."],
            "reliquaire": ["eye_beholder","arm_troll"], "endingsSeen": ["kill"] },
  "heritage": { "organ": "heart_lich" },
  "graveyard": [
    { "runId": 11, "body": {"...":"..."}, "depth": 14, "voie": "chair",
      "humanityFinal": 22, "cause": "famine", "relicsHeld": ["relic_double_spine"] }
  ],
  "rival": { "body": {"...":"..."}, "alive": true, "kills": 3, "grudges": ["betrayed_f7"] },
  "seeds": [{ "plantedRun": 11, "floor": 8, "organSeed": "eye_human", "matureRun": 12 }],
  "currentRun": {
    "runId": 12, "seed": 88421337, "humeur": "fievre", "voie": "air",
    "biome": "poumons", "floor": 8, "tick": 1840,
    "pos": [4,7], "dir": "N",
    "body": {"...":"..."}, "bag": ["eye_intact","heart_worn"],
    "viande": 41, "torches": 2, "satiete": 18, "hallu": 35, "humanity": 40
  }
}
```

### Room
```json
{ "id":"antre", "family":"universal", "biomeTags":["any"], "weight":10,
  "spawns":{"mobs":[1,2]}, "features":["dark_corners"], "ui":"combat" }
```
- `family` ∈ {universal, rare, thematic}
- `ui` ∈ {combat, trade, graft, altar, rest, puzzle, pathchoice, none} → quel module central afficher
- `weight` : poids de tirage (rare uniquement)

### Relic
```json
{ "id":"relic_third_shoulder", "name":"Troisième Épaule", "kind":"slot",
  "effect":{"addSlot":"arm"}, "cadaverBiome":"bras_surnumeraire", "ref":null }
```
- `kind` ∈ {slot, utility}
- `cadaverBiome` : si présent, ajoute un sous-biome quand ce Body devient un donjon (carte évolutive).

## 3. Les stats — formules exactes

Corps humain de référence : `dgt2 prc5 per4 oui3 brt3 vit5 arm2 fam3 lum2 ryt1 hum100`.

```
stat(body, key) = clamp( base_humain[key] + Σ organe.stats[key] (slots équipés non détruits), 0, 10 )
humanity(body)  = clamp( 100 + Σ organe.humanity, 0, 100 )
```

Combat — formules implémentées :
```
# ── Système de combat temps-réel (BattleEngine) ──────────────────────────────
# Le combat est déclenché dès qu'on entre dans une salle hostile.
# Il tourne en temps-réel : intervalle de beat = max(400, 1200 - RYT×60) ms.
# Chaque beat : joueur auto-attaque → mobs tick leur countdown.
# Les mobs N'ont PAS d'auto-attaque en combat : ils n'agissent QUE via skills.

beat_interval(ryt)  = max(400, 1200 - ryt × 60)   // ms

# ── Auto-attaque joueur (chaque beat) ────────────────────────────────────────
auto_dmg = max(1, (DGT_joueur - ARM_mob_si_couche_outer) × qualité_arme)
qualité_arme = 1.0 (base) · armures abîmées réduisent selon tier
# si WS.battle.aimedSlot : cible cet organe (PRC-based hit chance)
# sinon : frappe la couche la plus externe disponible

# ── Skills joueur (coût en PV de l'organe qui tire) ─────────────────────────
SKILL_COST_BY_TYPE = { arm:1, tongue:1, legs:1, eye:1, ear:1, brain:1, stomach:2, skin:2, heart:0 }
PIERCE_COST = 2   // bras perforant coûte 2 HP au lieu de 1

# Multiplicateurs de dégâts par skill :
# FRAPPER  (bras)          : ×3.0, ignore ARM si pierce_layer, CD 3 beats
# ESTOC    (bras perforant): ×2.0, ignore ARM, CD 3 beats
# MORDRE   (langue)        : ×2.5, CD 2 beats
# VAMPIRISER (langue liche): ×2.5 + life_steal = dmg infligé (cap = HP manquants)
# ESQUIVER (jambes)        : +2 charges dodge, CD 4 beats
# ANALYSER (cerveau)       : révèle organe le plus faible + fixe aimedSlot, CD 3 beats
# VISER    (œil)           : fixe aimedSlot sur cible choisie, CD 1 beat
# ÉCOUTER  (oreille)       : countdown ennemi +2 beats (délai), CD 3 beats
# DIGÉRER  (estomac)       : +4 HP sur l'organe le plus blessé, CD 5 beats
# DURCIR   (peau)          : buffAbsorb +8 (absorbe le prochain skill mob), CD 5 beats

chance de toucher visé = min(0.95, 0.5 + 0.05×PRC)
coup au corps (non visé) = toujours frappe la couche outer disponible

# ── Mob skill scheduling ─────────────────────────────────────────────────────
# Chaque mob schedule un skill chaque beat s'il n'en a pas déjà un en cours.
# Countdown basé sur le cerveau du mob :
mob_countdown(brain_type):
  brain_lich  → 3 beats
  brain_titan → 7 beats
  default     → 5 beats
# Intent affiché : "⚔ <organName> [<countdown>▸] <skillName>"
# Si l'organe qui doit tirer est détruit avant la fin du countdown :
#   → skill annulé, event SKILL_CANCELLED, mob.intent = "✗ <skillName> — interrompu"

# Coûts HP mob (identiques joueur, prélevés sur l'organe qui tire) :
mob_skill_cost = SKILL_COST_BY_TYPE  // même table

# Effets des skills mob :
# FRAPPE LOURDE (arm/tongue) : ×2.5 dmg, ignore buffAbsorb partiel
# ESQUIVE       (legs)        : mob.buffDodge +1
# DURCIR        (skin)        : mob.buffArm +4 pendant 3 beats
# SOINS         (heart/stomach): +2 HP sur l'organe le plus blessé du mob
# ANALYSE       (brain)       : mob.aimedSlot = organe joueur le plus blessé, 3 beats

# ── Manger en combat ─────────────────────────────────────────────────────────
# eatInCombat(idx, targetSlotKey) : bypass du tick guard, exécuté immédiatement
# Effet : satiété += SAT_GAIN[quality] ET HP organe choisi += HP de l'organe mangé
# Les deux effets coexistent (satiété + transfert de PV)
# Si targetSlotKey null : répare automatiquement l'organe le plus blessé +1 HP (fallback)
SAT_GAIN = { parfait:30, intact:25, 'abîmé':18, cuit:10, pourri:4 }
HP_TRANSFER = item.hp ?? def.maxHp  // PV actuels de l'organe mangé

# ── Autres formules (inchangées) ─────────────────────────────────────────────
esquive parfaite     = fenêtre de RYT ticks ; réussie → 0 dégât + contre si bras dispo
riposte (WAIT)       = parry_chance = min(0.6, 0.05 + RYT×0.1) → contre_dmg = DGT×0.5
satiété/tick         = -0.04 × FAM   (0 = autophagie : -1 PV organe / 10 ticks, plus monstrueux d'abord)
torche/tick          = -1 tous les 40 ticks (humeur frissons : 25 ticks)
pourrissement organe = qualité baisse d'un cran tous les : commun 60, rare 90, épique 140
greffe (donjon)      = 5 ticks (3 avec relic_suture_noire, 0 chez la Couturière)
amputation           = gratuit, instantané ; l'organe retiré → besace (périssable)

# ── HP organes — échelle révisée (×3 vs proto v1) ───────────────────────────
# commun  : 6-12 HP  (était 2-4)
# rare    : 9-18 HP  (était 3-6)
# épique  : 12-24 HP (était 5-8)
# Carapace Vivante (épique skin max) : 24 HP
# Cœur de Titan (épique heart max)   : 21 HP
```

Économie (viande) :
```
vente organe   = organe.price × mult_qualité           (parfait 1.25 … cuit 0.5)
achat marchand = organe.price × 1.6
loyer Panse    = 15 / étage
consigne Héritage = 100 (one-shot par run)
```

Génération mob :
```
budget B   = 4 + étage           (élite : ×1.5)
coût tier  = {common:1, rare:2, epic:4, legendary:8}
plafond arcane = selon strate : G≤5, P/E≤10, C/En≤15, (XXI réservé aux boss)
densité    = floor(3 + étage/2) mobs/étage ; 1 élite dès étage 3
```

## 4. Le tick & la boucle

`TickEngine` = file d'événements `{ atTick, fn }` triée. `advance(n)` exécute tout jusqu'à tick+n.
Tout ce qui dure s'enregistre comme événement futur : faim, torche, pourriture, statut, décomposition de cadavre, pattern de mob.

Boucle de jeu (event-driven, pas de requestAnimationFrame pour la logique) :
```
action joueur (déplacement OU action de combat OU UI) → coûte des ticks → TickEngine.advance →
  résout les conséquences (faim, sons émis, mobs qui agissent, triggers onTick) →
  re-render HUD + scène + Ligne.
```
Le rendu (animations CSS, Ligne canvas) tourne en continu via rAF, mais la **logique** n'avance qu'au tick.

## 5. Registres (le cœur extensible) — `triggers.js`

Trois maps `id → fn`. Signatures fixes :

```js
AbilityRegistry[id] = (ctx) => {...}      // ctx = {body, target, game, organ}
CurseRegistry[id]   = (ctx) => {...}      // appliqué passivement / au tick
TriggerBus: on(event, handler); emit(event, ctx)
  events: onKill onDamaged onDestroy onTick onSound onHarvest onGraft onEnterRoom
BossPatternRegistry[id] = { onPhase(n,ctx), onTick(ctx), telegraph(ctx) }
```

Registre **minimal à livrer** (le reste s'ajoute en data) :
- abilities : `see_invisible`, `echolocate`, `ranged_tear`, `dash_attack`, `taunt`, `heart_ultimate`, `pierce_layer`
- curses : `paranoia` (+hallu/tick), `hunger_x2`, `light_blind`, `heal_hurts`, `noisy_steps`
- boss patterns : `pattern_tongue`, `pattern_breath`, `pattern_heart`, `pattern_hunger`, `pattern_flora`

## 6. Algorithmes (pseudo-code)

### 6.1 Génération d'étage — `dungeon.js`
```
genFloor(seed, biome, floorNum):
  rng = mulberry32(seed ⊕ floorNum)
  size = 7 + 2*biome.strateIndex            // 7→9→11
  grid = emptyGrid(size)
  carve corridors (random walk depuis l'entrée jusqu'à placer ≥ quota salles)
  place rooms par quota (cf. GDD) :
    1 entrée, 1-2 antres, 1 charnier, 1-2 thematic(biome), 0-1 rare(weighted), 15% cache, 1 puits(+boss si dernier étage)
  pour chaque salle rare : tirage pondéré sur rooms.json (pity: boutique garantie 1×/strate)
  tag chaque case avec roomId + type
  return { grid, rooms, entrance, exit }
```

### 6.2 Génération de mob — `mobgen.js`
```
genMob(rng, biome, floorNum, elite=false):
  B = (4+floorNum) * (elite?1.5:1)
  theme = pick(biome.themes)
  body = emptyBody()
  budget achète des organes du pool filtrés par (arcana ≤ plafond, theme≥70%) jusqu'à B épuisé
  anatomie : 70% 1 cœur / 15% aucun / 10% deux / 5% exotique
  contraintes lisibilité : ≤2 abilities actives ; triggers ≤ (elite?3:1)
  behavior = pick selon theme ; phototropism = theme.default
  return Mob
```

### 6.3 Carte évolutive depuis un cadavre — `cadaver.js`
```
genDungeonFromBody(body, meta):
  base = squelette de donjon standard (5 strates) MAIS thématisé "intérieur de TOI"
  pour chaque organe non-humain équipé :
    ajoute 1 salle-excroissance (room "growth") thématisée sur cet organe, loot = famille de l'organe
  pour chaque relique de slot portée (relicsHeld) :
    ajoute le sous-biome relic.cadaverBiome + son mini-boss
  densité & hostilité = f(humanityFinal)   // bas = plus dense/dur/riche
  malédictions portées → aléas environnementaux (curse → roomHazard mapping)
  return donjon
```

### 6.4 Transition de biome
```
onBossDefeated(boss):
  unlock harvest(boss.body)        // 1 organe lootable, dont XXI
  showPathChoice():                // écran UI central
    si carrefour Gorge : [Trachée→air] [Œsophage→chair]
    sinon : puits disponibles (sûr/long, court/gardé)
  onChoice(voie): currentRun.voie/biome = ... ; genFloor(nextBiome, 1)
```

## 7. Combat — architecture temps-réel (BattleEngine + CombatSystem)

```
# ── Séquence d'un beat (BattleEngine._beat) ──────────────────────────────────
1. Decay cooldowns joueur (-1 beat)
2. Player auto-attaque le mob actif (CombatSystem.playerAutoAttack)
   → flush PRIORITY.ACTION
3. Pour chaque mob actif :
   a. Decay buffArmBeats ; si ≤0 → buffArm = 0
   b. Si scheduledSkill :
      - countdown--
      - si countdown ≤ 0 : executeMobScheduledSkill() + flush + intent = ''
      - sinon : intent = "⚔ <organName> [<countdown>▸] <skillName>"
   c. Sinon : pickMobSkillOrgan() → schedule nouveau skill, intent = telegram
   → flush PRIORITY.MOB
4. onBeat() callback → re-render UI

# ── Skills joueur (BattleEngine.activateSkill → CombatSystem.playerSkill) ───
# Exécutés immédiatement (hors du rythme des beats)
# Coût HP prélevé sur l'organe qui tire (voir table SKILL_COST_BY_TYPE)
# CombatSystem.playerAutoAttack : auto-frappe chaque beat (sans coût HP)
# CombatSystem.playerSkill      : skills manuels cliquables sur l'ActionBar

# ── Mort & récolte (inchangé) ─────────────────────────────────────────────────
mort violente = heart détruit → spasme + charognards accélérés sur la Ligne
mort propre   = barre vidée segment par segment → loot préservé selon cibles
récolte       = 1 organe ; qualité = organHp restant + fragileTo ; cadavre se décompose au tick
```

### Modules implémentés (état actuel)

| Module | Rôle |
|--------|------|
| `BattleEngine.js` | Boucle temps-réel (setInterval au beat_interval), scheduling mob |
| `CombatSystem.js` | playerAutoAttack, playerSkill, mobAttack (hors-combat seulement), mob skill effects |
| `SensoryFX.js` | Effets visuels temps-réel : beat pulse, vision overlay, hit flash, hunger vignette, EKG, LUM, BRT |
| `ActionBar.js` | Barre d'actions contextuelle : en combat → skills organes + MANGER ; hors combat → contexte |
| `TickEngine.js` | Ticks d'exploration (hors combat) ; `eatInCombat()` bypasse le guard en combat |

### SensoryFX — effets visuels pilotés par le corps

Tous injectés via overlays CSS dans `.viewport` / `.game` :

| Signal | Effet | Déclencheur |
|--------|-------|-------------|
| RYT | beatpulse-overlay (vignette pulsée, intensité = RYT/15) | chaque beat |
| Eye type | vision-overlay backdrop-filter (beast/spider/void/beholder/lich) | render() |
| Skin type | hit flash viewport (normal/stone/carapace/lich/acid) | ORGAN_DAMAGED |
| Satiété | hunger-overlay orange (hun-low <35, hun-crit <15) | render() |
| LUM | CSS var --lum + classes lum-low/mid/high sur .game | render() |
| BRT | CSS var --brt + boxShadow sur cellule minimap | render() |
| brain_lich | ekg-line sweep violet à chaque beat | chaque beat |
| HEART_ULTIMATE | heart-last-beat-overlay flash | event |
| LICH_REVIVE | lich-revive-overlay burst | event |

## 8. UI — mapping (déjà figé dans les protos)

Chaque `Room.ui` détermine le module central :
- `combat` → barre segmentée ennemie + télégraphe (proto Gorge/Entrailles)
- `trade` → 2 colonnes + Inspecteur sert de fiche + bouton deal (proto Marchand)
- `graft` → onglets greffer/amputer/coudre/consigne + Inspecteur (proto Couturière)
- `altar` → autel + Inspecteur sert de fiche sacrifice (proto Autel)
- `rest` → le Banc / l'Abri : réparation lente des organes, pose un repère, sauvegarde (le monde continue au tick)
- `puzzle` → énigme environnementale (dalles/leviers) ; pas de panneau dédié, interaction sur la scène
- `pathchoice` → après un boss : récolte du boss puis choix de la voie suivante (Trachée/Œsophage au carrefour, puits sinon)

Constantes UI invariantes (tous biomes) : en-tête, besace, carte 7×7+, la Ligne, "Ton corps" (silhouette 12 slots + barre de vie segmentée), Inspecteur (stats dérivées par défaut, fiche au clic), barre d'actions 6 slots + pad. Règle DA : **une grammaire de couloir par biome**, point de fuite/sortie FIXE, parois animées.

## 9. Ordre de build (pour Claude Code)

1. **Socle data+rng+tick** : schémas JSON chargés, RNG seedé, TickEngine. Test : avancer le temps.
2. **Body+stats** : charger organs.json, calculer les stats dérivées, sérialiser/désérialiser un Body.
3. **Scène+HUD statiques** : porter un proto en modules (tokens.css/hud.css/scene.css), afficher un Body réel.
4. **Exploration** : genFloor, grille, déplacement au tick, carte, la Ligne réagit aux sons.
5. **Combat** : mobs, barre segmentée, couches, riposte, TriggerBus, récolte, greffe.
6. **Boucle** : mort→graveyard, save/load localStorage, transition de biome, choix de voie.
7. **Contenu** : 15 organes, 4 mobs, 1 boss avec pattern, 1 strate complète jouable.
8. **Méta+spéciaux** : cadavre→donjon, reliques, PNJ, hallucination, humeurs, les 5 patterns de boss.

Jalon jouable = fin de l'étape 7 : une run de la Gorge, combat + récolte + greffe + un boss à pattern + mort + nouvelle run.

## 10. Ce que ce doc NE fige pas encore (à chiffrer en data, pas en code)

- Le contenu complet des 198 organes (on livre ~15 pour le proto, le reste est du JSON à étendre).
- L'équilibrage fin (les formules sont posées, les constantes s'ajustent en playtest).
- Le texte de lore (structure prête dans lore.json, écriture à faire).
- Le carrefour Gorge = une room `ui:"pathchoice"` à l'étage 5 (après le boss la Langue).
