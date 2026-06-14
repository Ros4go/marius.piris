# CHAIR — Document de Game Design (v1.0)

> *Dungeon crawler first-person en grille, 100 % HTML/CSS/JS, sans artworks. Tu ne montes pas de niveau : tu te greffes.*

## Vision

Tu es un pillard mourant qui descend dans le cadavre vertical d'un dieu. Pas d'XP, pas de classes : tu t'amputes et tu te greffes les organes de ce que tu tues. Ton corps est ton build, et ton build déforme littéralement l'interface. Plus tu descends, plus tu es monstre — et tes anciens corps peuplent le donjon des runs suivantes.

**Les 4 piliers (tout doit servir au moins l'un d'eux) :**
1. **Le corps est l'interface.** Chaque organe a un effet visible à l'écran. On doit pouvoir lire un build en regardant l'écran du joueur.
2. **Chaque greffe est un dilemme.** Toujours un pouvoir + un coût. Seuls les organes humains sont neutres.
3. **Le donjon se souvient.** Rien ne se perd : tes morts deviennent des boss, tes choix persistent, le lore s'accumule.
4. **Old school assumé.** Grille, tour par tour, case par case, ressources qui comptent, pas de pitié.

**Question émotionnelle du jeu :** qu'est-ce qui reste de toi quand tu as tout remplacé ? (Bateau de Thésée — jamais dit explicitement, toujours ressenti.)

---

# LES 4 PRIMITIVES

Tout le jeu repose sur quatre mécanismes universels. Toute nouvelle mécanique DOIT se construire avec eux.

### 1. Le Tick (le temps)
Une seule horloge pour tout. Un pas = 1 tick. Un tour de combat = 1 tick. Une greffe = 5 ticks. Consomment des ticks : la faim, les torches, le pourrissement des organes en inventaire, la décomposition des cadavres, les patterns des mobs, les effets temporaires. **Il n'y a pas de différence entre "temps d'exploration" et "temps de combat"** — fuir, greffer en plein donjon, attendre : tout a le même coût mesurable partout.

### 2. L'Organe (la matière)
La donnée universelle. C'est à la fois : le build (greffé), le loot (récolté), les PV (segments de vie), la cible (segments visés), la nourriture (mangé), la monnaie (vendu), le moteur (triggers). Joueur, mobs, boss, anciens corps : tous sont des `Body`, c'est-à-dire des assemblages d'organes. **Aucune stat n'existe en dehors d'un organe.**

### 3. Le Son (l'information)
Tout événement émet un son positionné, affiché sur la **bande sonore** (voir Oreilles). Télégraphes ennemis, charognards qui approchent, mécanismes, murmures du lore : un seul canal d'information. Conséquence : **le jeu entier est jouable à la bande sonore** — le build aveugle joue au même jeu avec le même système. Et tout ce que TU fais émet aussi : courir, crier, détruire un cœur. Le son est bidirectionnel.

### 4. La Mémoire (la persistance)
Le donjon se souvient entre les runs : graveyard (tes corps → boss), graines plantées (Fermier), Rival qui progresse, lore accumulé, conséquences des fins. Toute mécanique "long terme" passe par la Mémoire, jamais par un système dédié.

---

# STRUCTURE DU CORPS

**9 types d'organes, 12 slots équipés :**

| Type | Slots | Gouverne |
|------|-------|----------|
| Œil | ×2 | Perception, rendu de l'écran |
| Oreille | ×2 | Ouïe, bande sonore, détection |
| Bras | ×2 | Attaques, interactions |
| Jambes | ×1 (paire) | Déplacement, esquive |
| Cœur | ×1 | Mort/survie, ultime, rythme |
| Peau | ×1 | Couche externe de la barre de vie, environnement |
| Cerveau | ×1 | Information, minimap, dialogue interne |
| Estomac | ×1 | Faim, inventaire, consommation |
| Langue | ×1 | PNJ, sons émis, contrôle des mobs |

**La mort du joueur = la destruction de son (dernier) cœur.** Les autres organes peuvent tous être détruits : on continue, diminué. Un Body sans cœur (golem...) meurt quand tous ses segments sont détruits.

**Tarot :** objectif final 22 organes/type = 198 organes. Chaque organe porte un numéro d'arcane (0 Le Mat → XXI Le Monde) qui définit sa rareté :
- 0–V : commun
- VI–XV : rare
- XVI–XX : épique
- XXI : légendaire — uniquement récolté sur les Organes Majeurs (boss)

Pour l'instant : **6 par type (54 organes).**

### Anatomie d'un organe (modèle de données)

```json
{
  "id": "eye_beholder",
  "slot": "eye",
  "name": "Œil de Beholder",
  "arcana": 9,
  "hp": 6,
  "layer": "deep",
  "stats": { "perception": 8 },
  "abilities": ["see_invisible"],
  "triggers": [ { "on": "onKill", "do": "reveal_room" } ],
  "curses": ["paranoia"],
  "humanity": -15,
  "visual": { "overlay": "hex-fragment" },
  "sounds": { "passive": null, "active": "blink_wet" },
  "harvest": { "fragileTo": ["fire"] }
}
```

- **`hp`** : les PV de l'organe — il est un segment de la barre de vie de son porteur.
- **`layer`** : `outer` (peau, membres) / `mid` (torse, yeux, oreilles) / `deep` (cœur, cerveau). Définit quand il est exposé aux coups.
- **`triggers`** : le moteur à combos — voir Combat. `onKill`, `onTick`, `onDamaged`, `onSound`, `onHarvest`, `onGraft`, `onDestroy`...
- **`sounds`** : ce que l'organe émet (bidirectionnel : les mobs t'entendent aussi).

---

# STATS — LA NORME

**Règle d'or : aucune stat de base.** Toute stat du Body est la **somme des contributions de ses organes** (slots vides = contribution nulle, parfois malus). Le joueur, les mobs, les boss : même calcul.

## Les 10 stats dérivées (échelle /10, sauf HUM /100)

| Stat | Code | Nourrie par | Sert à |
|------|------|-------------|--------|
| Dégâts | `DGT` | bras, triggers | dégâts par coup |
| Précision | `PRC` | yeux, bras | toucher un segment **visé** |
| Perception | `PER` | yeux, cerveau | portée de vue, secrets, pièges |
| Ouïe | `OUI` | oreilles | portée/détail de la Ligne |
| Bruit émis | `BRT` | jambes, peau, langue | ce que les ouïes ennemies captent (bas = furtif) |
| Vitesse | `VIT` | jambes | ticks par case, initiative, esquive |
| Armure | `ARM` | peau | réduction plate sur la couche `outer` |
| Faim | `FAM` | estomac, malédictions | vitesse de chute de la **satiété** (voir Ressources ; bas = sobre) |
| Lueur | `LUM` | yeux, peau | lumière émise/requise (interagit avec le phototropisme) |
| Rythme | `RYT` | cœur | vitesse des beats (`max(400, 1200−RYT×60)` ms) + probabilité de riposte sur WAIT |

**Humanité (`HUM`, /100)** : `100 + somme des champs humanity` des organes (les organes humains valent 0, les monstrueux sont négatifs). Pilote les PNJ, les zones, l'Écho du dieu (seuils : voir PNJ).

## Le corps humain de référence (tous organes humains)
`DGT 2 · PRC 5 · PER 4 · OUI 3 · BRT 3 · VIT 5 · ARM 2 · FAM 3 · LUM 2 · RYT 1 · HUM 100`
C'est l'étalon : tout organe monstrueux se lit en écart à cette ligne.

## Budget de stats par arcane
| Tier (arcane) | Budget de stats | Malédiction | Capacités |
|---|---|---|---|
| Commun (0–V) | ±1 à 2 sur 1-2 stats | légère ou aucune | 0-1 passive |
| Rare (VI–XV) | ±2 à 3 sur 2 stats | obligatoire, modérée | 1 (active ou passive) |
| Épique (XVI–XX) | ±3 à 4 sur 2-3 stats | lourde | 1 active + 1 trigger |
| Légendaire (XXI) | ±5 + **une règle unique** | majeure, définit la run | 1 règle qui change le jeu |

La malédiction est la contrepartie du budget : plus l'organe donne, plus elle coûte. Format JSON : `"stats":{"dgt":+3,"brt":+1}` (seules les valeurs non nulles).

## Qualité de récolte = multiplicateur
| Qualité | Stats | Capacités |
|---|---|---|
| parfait | ×1,25 | + trigger bonus possible |
| intact | ×1 | toutes |
| abîmé | ×0,75 | toutes |
| cuit | ×0,5 | passives seulement |
| pourri | — | ingreffable (alambic / nourriture) |

**Alignement des 54 organes** : chaque table de type alimente en priorité ses stats de tutelle (yeux→PER/PRC/LUM, oreilles→OUI, bras→DGT/PRC, jambes→VIT/BRT, cœur→RYT, peau→ARM/BRT/LUM, cerveau→PER, estomac→FAM, langue→BRT/social). Le chiffrage fin se fait en data (JSON) à la phase 5, en respectant les budgets ci-dessus.

---

## 👁 YEUX

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Œil du Roi Pâle | Hollow Knight | Voit l'invisible et les passages secrets. Malédiction : une "infection" orange masque progressivement les coins de l'écran, se purge en tuant (`onKill`). | Vignette bleu pâle, taches orange qui rampent sur les bords |
| Œil Lacrymal | Binding of Isaac | Attaque à distance : projectiles de larmes. Faible mais spammable. | Des gouttes coulent sur l'écran à chaque tir |
| Œil de la Sonde | Outer Wilds | Une fois par étage : photographie la salle suivante avant d'y entrer. | Flash blanc, le cliché reste affiché en polaroid dans un coin |
| Œil du Tampon | Papers, Please | Détecte les mimics et les mensonges des PNJ. | Tampon APPROVED / DENIED qui s'imprime sur les entités inspectées |
| Œil de Verre | Return of the Obra Dinn | Dans chaque salle, revoit la dernière mort qui s'y est produite (lore + indices de pièges). | L'écran passe en dithering 1-bit noir et blanc pendant la vision |
| Œil Noctambule | Limbo | Vision totale dans le noir, plus besoin de torche. Malédiction : aveuglé par la pleine lumière. | Tout en silhouettes et contre-jour, perte des couleurs |

**Sans œil droit/gauche :** moitié d'écran correspondante noire. **Aveugle :** écran noir total — jeu à la bande sonore et à la minimap. Build extrême viable (et encouragé : tes yeux se vendent cher).

---

## 👂 OREILLES

### La bande sonore (système de base — primitive n°3)

Une ligne horizontale en bas de l'écran, au-dessus du log de texte : le champ auditif **gauche / face / droite**, plus un indicateur « derrière ». Les sons y apparaissent en mots ou pictos positionnés selon leur direction (*« pas lourds »*, *« goutte d'eau »*, *« souffle rauque »*). Taille et opacité = distance ; un mot qui grossit = ça approche. Quand tu tournes, les sons glissent le long de la bande — on triangule à l'oreille.

**Les télégraphes de combat passent AUSSI par la bande** (*« le troll inspire, face »*). La bande n'est pas un gadget : c'est le canal d'information principal du jeu, le visuel n'étant que sa confirmation. Le filet de sécurité du build aveugle, et l'instrument de paranoïa de tous les autres.

L'ouïe humaine de base est vague : sons proches uniquement, descriptions floues. Les organes ci-dessous l'affinent.

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Oreille de Chauve-Souris | Mark of the Ninja | Écholocation : crie (1 tick, alerte les mobs) et les murs alentour se dessinent sur la minimap. **Nécessite un cerveau** (sans minimap, l'écho ne s'inscrit nulle part). | Anneaux concentriques qui pulsent depuis le centre de l'écran |
| Oreille Absolue | — | Identifie l'espèce exacte et l'état (blessé, endormi, en chasse) de chaque son. | La bande affiche des étiquettes précises : *« troll, blessé, 3 cases »* |
| Oreille du Métronome | Crypt of the NecroDancer | Entend le « rythme » des mobs : leurs ticks d'action sont affichés un tour à l'avance. Élargit la fenêtre de riposte (+1 tick). | Tic-tac visuel sur la bande, icônes d'intention au-dessus des sons |
| Oreille du Confessionnal | — | Entend les murmures des morts et du dieu : lore, indices de salles secrètes. Malédiction : ils ne se taisent jamais (bande encombrée). | Mots gris fantomatiques qui dérivent en permanence sur la bande |
| Oreille Paranoïaque | Darkest Dungeon | Portée d'écoute doublée, entend à travers 2 murs. Malédiction : +Hallucination passive — la jauge alimente ses sons imaginaires. | Bande étendue, certains mots tremblent (vrais et faux mélangés) |
| Tympan du Siffleur | A Short Hike | Émet un sifflement qui attire les mobs vers une position (leurre directionnel). | Une note de musique part sur la bande dans la direction choisie |

**Sans une oreille :** moitié correspondante de la bande muette (symétrie avec l'œil vendu). **Sourd total :** bande vide, immunisé aux cris, sirènes et malédictions sonores — les murmures du dieu ne t'atteignent plus (l'humanité ne baisse plus par l'ouïe).

---

## 💪 BRAS

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Bras du Décapité | Dead Cells | Se détache, frappe à 3 cases, revient au tick suivant. Pendant ce tick : slot vide. | Le slot clignote vide, le bras visible dans la vue qui vole |
| Bras Hyper-Lumière | Hyper Light Drifter | Attaque-dash : traverse l'ennemi et finit derrière lui (expose les organes dorsaux). | Traînées cyan/magenta, aberration chromatique |
| Bras du Bûcheron | Don't Starve | +2 qualité de récolte : les organes loot sont mieux préservés. Faible en dégâts. | Les PV des segments ennemis deviennent visibles en chiffres |
| Bras de Poupée | Inscryption | Sacrifie des PV de ta peau pour +50 % dégâts sur le coup. Cumulable. | Compteur de gouttes de sang, dents qui sourient sur le slot |
| Bras-Conduit | Slay the Spire (Defect) | `onTick` : charge un orbe par tick ; l'attaque libère tous les orbes d'un coup. | Orbes qui orbitent autour du cadre de la vue |
| Bras du Mineur | Spelunky | Creuse les murs fins : raccourcis. Perforant : ignore 1 couche (peut frapper `mid` sous `outer`). Faible en dégâts. | Fissures cliquables sur les murs |

**Sans bras :** plus d'attaque de ce côté, inventaire réduit de moitié.

---

## 🦵 JAMBES

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Jambes de la Grimpeuse | Celeste | Dash d'une case (esquive), escalade les fosses. Malédiction : panique dans le noir (inputs inversés 1 tick). | Trait de dash, mèche rouge en bord d'écran |
| Jambes du Pèlerin | Journey | Ne déclenche aucune dalle-piège, pas un bruit en marchant (invisible sur les bandes sonores ennemies). | Balancement doux de la vue, particules de sable |
| Jambes d'Araignée | — | Marche sur les murs : ignore sols piégés et fosses. Humanité --. | La vue tangue en saccades, pattes visibles en bas d'écran |
| Jambes du Fuyard | Risk of Rain | Vitesse et esquive augmentent avec les ticks passés sur l'étage. | Chrono visible, motion blur croissant |
| Jambes-Ressort | Shovel Knight | Pogo : saute SUR l'ennemi, atterrit dans son dos — les organes dorsaux (cœur moins protégé) sont exposés 1 tick. | Gros rebond vertical de la vue |
| Jambes du Marcheur de Boucle | Loop Hero | Repasser sur ses propres traces régénère lentement tes organes blessés. | Tes traces s'affichent sur la minimap en doré |

**Sans une jambe :** vue penchée, déplacement en 2 ticks, son de boitement (les mobs t'entendent). **Sans jambes :** tu rampes — 1 case par 2 ticks, mais passages bas accessibles.

---

## ❤️ CŒURS

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Cœur de Liche | — | Survit à une destruction par étage (le cœur se reforme à 1 PV). Malédiction : les soins te blessent. | Barre violette inversée, pulse lent |
| Cœur Déterminé | Undertale | Quand il devrait être détruit : tient à 1 PV pendant 3 ticks. Si le combat n'est pas fini à temps, mort réelle. | Le cœur jaune pixelisé craque à l'écran, « Tu refuses de mourir. » |
| Cœur du Styx | Hades | Première destruction de la run : remontée d'une strate au lieu du game over (le cœur se répare en remontant). | Fondu rouge sang, remontée en flottant |
| Cœur-Réacteur | FTL | Avant chaque combat : répartis 5 barres d'énergie entre tes organes (les non-alimentés sont inertes, leurs triggers éteints). | Jauge d'énergie segmentée à la FTL sous la vue |
| Cœur de Cristal | Crypt of the NecroDancer | Agir pile sur le tick du tempo = dégâts ×2. Rater = tick perdu. Fusionne le tempo avec la fenêtre de riposte. | Métronome battant, la vue pulse au tempo |
| Cœur du Culte | Cult of the Lamb | Sacrifie un organe d'inventaire pour réparer tes organes blessés (valeur selon tier). | Auréole rouge, petit autel dans l'inventaire |

**Cœur humain de base :** rien de spécial — le seul organe sans malédiction du jeu. Le garder est un choix (build « humanité »).

---

## 🛡 PEAUX

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Peau Alchimique | Noita | Absorbe les liquides au sol : l'acide te soigne, l'huile t'enflamme, l'eau purge les statuts. | L'écran se teinte de la couleur du liquide absorbé |
| Peau de Limon | — | Énorme réserve de PV (gros segment `outer`), mais tu laisses des traces : les mobs te pistent. | Bords d'écran gluants verts, traînée sur la minimap |
| Peau du Ver Blanc | Rain World | Les mobs de tier inférieur t'ignorent (chaîne alimentaire). Tuer un « inférieur » brise l'effet pour l'étage. | Indicateur de karma, palette désaturée |
| Peau-Règle | Baba Is You | Une fois par étage : inverse une règle de la salle (« les pièges sont des portes », « le feu est de l'eau »). | Les mots de la règle flottent et se réécrivent |
| Peau de Pierre | — | Armure massive (couche `outer` très épaisse), vitesse réduite, les fosses sont mortelles. | Vue plus basse et lourde, bords rocheux, craquements |
| Peau du Dragueur | Dredge | Invisible dans l'obscurité. Malédiction : +Hallucination par tick dans le noir (voir la jauge). | Distorsions, entités qui n'existent pas |

**Sans peau (écorché) :** ta couche `mid` est directement exposée, mais les greffes ne coûtent plus que 1 tick et les mobs putréfiés te croient des leurs.

---

## 🧠 CERVEAUX

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Cerveau du Détective | Disco Elysium | Tes compétences te parlent : indices, options de dialogue, révèle la jauge d'humanité. Malédiction : elles mentent parfois. | Bulles signées (« LOGIQUE : c'est un piège. ») |
| Cerveau Calculateur | Into the Breach | Affiche les intentions exactes : cible, dégâts chiffrés, ordre des ticks. | Flèches de prévision et chiffres sur la grille |
| Cerveau du Renard | Tunic | Traduit la langue du donjon : inscriptions lisibles, pages du « manuel du jeu » trouvables en loot. | Les glyphes se réécrivent en clair au survol |
| Cerveau de la Carcasse | Carrion | Prend le contrôle d'un mob tué il y a moins de 3 ticks, le pilote 5 ticks. | La vue passe côté monstre, filtre rouge viande |
| Cerveau du Narrateur | The Stanley Parable | Un narrateur commente. Se moque, mais vexé il révèle des secrets pour prouver qu'il sait tout. | Sous-titres élégants, ton pince-sans-rire |
| Cerveau de l'Arpenteur | — | Minimap complète de l'étage à l'arrivée. Malédiction : amnésie — la map des étages précédents s'efface. | Minimap dorée complète, les anciennes se désintègrent |

**Sans cerveau :** pas de minimap, pas de dialogues, textes en charabia. Mais immunité totale aux afflictions ET à la jauge d'Hallucination (rien à affliger — voir Afflictions).

---

## 🍖 ESTOMACS

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Estomac Dévoreur | Kirby (esprit) | Mange un organe : son pouvoir (sans sa malédiction) pour 1 étage, puis digéré à jamais. | Slot « digestion » avec compteur de ticks, rot sonore final |
| Estomac de Fer | — | Mange n'importe quoi : torches, os, or, pièges désamorcés. Tout nourrit. | Tout objet gagne une option « manger » |
| Estomac du Fermier | Stardew Valley | Plante une graine dans un cadavre ; **à la run suivante**, un organe amélioré y a poussé (primitive Mémoire — tu sèmes pour ton prochain toi). | Icônes de pousse mémorisées sur la minimap des runs futures |
| Estomac-Alambic | Noita / Potion Craft | Fermente les organes pourris/cuits (déchets de récolte) en potions. | Jauge de fermentation qui glougloute |
| Panse du Marchand | Recettear | +6 cases d'inventaire. Malédiction : loyer en or à chaque étage. | Grille étendue + facture qui tombe à chaque descente |
| Estomac du Survivant | Vampire Survivors | Plus ta faim est haute, plus tes dégâts montent (jusqu'à ×2 en famine). Manger devient un dilemme. | Jauge de faim changée en jauge de rage, bords qui tremblent |

**Sans estomac :** plus de jauge de satiété (ni famine, ni autophagie), mais plus aucun soin par la nourriture — seuls le Banc, l'Abri et les organes soigneurs réparent.

---

## 👅 LANGUES

| Organe | Réf | Gameplay | Interface |
|--------|-----|----------|-----------|
| Langue du Barde | Wandersong | Chante pour apaiser les mobs d'une salle (ré-hostiles si attaqués). | Roue de chant colorée, les mobs se balancent |
| Langue Fourchue | Moonlighter | Meilleurs prix, peut bluffer les PNJ (échec : prix punitifs). | Prix barrés et renégociés en direct |
| Langue de Grenouille | — | Grab à 2 cases : attire objets, leviers, petits mobs — ou **arrache un segment `outer`** d'un ennemi à distance. | La langue part littéralement du bas de l'écran |
| Langue Morte | — | Parle aux cadavres et à tes anciens corps : lore, indices, marchandage post-mortem. | Dialogues en texte gris tremblé, écran qui refroidit |
| Langue de Sel | Salt and Sanctuary | Insulte un mob : il te focus, ignore le décor, rate parfois de rage. | Bulles d'insultes pixelisées |
| Langue Cousue | INSIDE | Muet : plus aucun dialogue, mais tu n'émets plus AUCUN son (invisible aux ouïes ennemies). | Options grisées, tout l'audio étouffé |

**Sans langue :** dialogues réduits à des grognements, mais immunisé aux malédictions vocales et aux sirènes.

---

## Notes de design des organes

- **Toujours un pouvoir + un coût.** Seuls les organes humains de base sont neutres — l'humanité est le « build sans malédiction ».
- **L'absence est un build.** Chaque slot vide a un effet défini (malus + petit avantage caché). S'amputer volontairement doit être viable.
- **L'UI est le feedback.** Effet visible à l'écran pour chaque organe, même minime.
- **L'absurde est permis, pas équilibré.** Les combos de triggers qui s'emballent sont le but, pas un bug. Les seuls garde-fous : les malédictions qui s'accumulent et les anatomies qui contrent.
- **Synergies attendues :** Cœur de Cristal + Oreille du Métronome (build tempo, fenêtre de riposte géante), Cœur du Culte + Estomac du Fermier + Bras du Bûcheron (moteur d'immortalité par moisson), Tympan du Siffleur + Peau de Limon + pièges (l'éleveur de files d'attente), Langue de Sel + Peau Alchimique + flaque d'acide (le tank qui se soigne en encaissant), Œil Noctambule + Peau du Dragueur + Langue Cousue (le fantôme total), Aveugle + 2 oreilles légendaires (l'écholocateur).

---

# GAMEPLAY

## Exploration

- **Grille, vue first-person, rotation 90°.** Déplacement case par case (flèches / boutons tactiles). Rendu des murs en CSS.
- **Minimap** dessinée en explorant (dépend du cerveau).
- **Salles taguées.** Le générateur découpe le donjon en zones avec ID. Les effets « de salle » (Peau-Règle, chant, ambiances) s'appliquent aux cases de la zone.
- **Old school kit :** murs secrets, leviers, fosses, téléporteurs, dalles de pression. Les organes changent l'exploration.
- **Descente à sens unique**, pas de save intra-étage.
- **Sortir d'un biome = vaincre son boss.** Le dernier étage d'une strate se termine sur l'**Organe Majeur**, qui verrouille la descente. Le vaincre ouvre, dans l'ordre : (1) la **récolte du boss** (son corps, dont l'organe XXI, devient lootable comme n'importe quel cadavre — mais une seule pièce) ; puis (2) un **écran de choix de la voie suivante** dans l'UI (au carrefour de la Gorge : Trachée/Air ou Œsophage/Chair ; ailleurs, les puits disponibles). Le choix est définitif et lance la génération du biome suivant.
- **Lumière (3 états : éteinte / sourde / vive).** La torche se consomme au tick et se règle volontairement. La lumière est un **outil d'aggro** : chaque mob a un trait de *phototropisme* — attiré, repoussé, ou indifférent — et **se déplace entre les salles** en suivant ou fuyant les sources lumineuses. Allumer vif = appâter les phototropes vers un piège (synergie Siffleur). Éteindre = infiltration… mais l'obscurité a ses habitants, et ses builds (Noctambule, Dragueur). La lumière émise est à la vision ce que le bruit est à l'ouïe : un canal bidirectionnel — on te voit comme tu vois.
- **Le bruit de tes pas compte :** chaque déplacement émet selon tes jambes/peau. Les mobs ont leur propre ouïe (champ auditif inversé). L'infiltration n'est pas un mode : c'est juste le son, bidirectionnel.

## Les salles

Le donjon est découpé en zones taguées (ID + type). Trois familles :

**Universelles (toutes strates)** — l'ossature de chaque étage :
- **Couloirs & carrefours** : circulation, embuscades, le terrain du positionnement.
- **Antre** : salle de combat, un pack thématique y vit (et y dort — l'infiltration paie).
- **Charnier** : cadavres à récolter… déjà revendiqués par des charognards.
- **Cache** : salle secrète (mur fin, levier) — relique ou organe de qualité.
- **Autel du dieu** : sacrifie un organe → bénédiction (ou malédiction déguisée).
- **Chambre de greffe** : recoin sûr, greffe à 1 tick — rare, et jamais gratuite deux fois.
- **Salle d'énigme** : dalles, leviers, poids — les organes changent les solutions (langue de grenouille = levier à distance). Variante : **le Panneau** *(The Witness)* — un tracé gravé dans la chair, solution dans le décor.
- **Le Banc** *(Hollow Knight)* : un banc, seul dans le noir. S'asseoir = répare lentement les organes et marque un repère sur la carte. Personne ne sait qui l'a mis là.
- **L'Abri** *(Rain World)* : une porte qui ne se referme que pour dormir un cycle complet — sûr, mais le monde continue au tick : les mobs migrent, les cadavres pourrissent.
- **Puits de descente** : la sortie, souvent gardée. Descendre est un choix, pas un accident.

**Rares / aléatoires (tirage pondéré, n'importe quelle strate)** :
- **Boutique du Marchand d'en-bas** (garantie au moins 1 fois par strate — pity timer).
- **Nid** : génère des mobs au tick tant qu'il vit — détruire, contourner, ou exploiter (farm risqué).
- **Fosse aux parasites** : organes vivants qui supplient d'être greffés.
- **Salle-mémoire** : un organe mémoriel du dieu — greffe = vision de lore.
- **Trace du Rival** : son passage (coffres vides, cadavres récoltés, message gravé) — ou lui.
- **La Table de Sacrifice** *(Inscryption)* : un inconnu aux yeux luisants propose une partie dont la mise est un organe. Les règles changent à chaque visite. Il triche.
- **Le Coffre Maudit** *(Darkest Dungeon)* : un coffre, une intuition. Fouiller à la main, à la torche, ou passer son chemin.

**Thématiques de strate** (1-2 par étage, portent l'identité du lieu) :
- *Gorge* : **Cordes vocales** (la salle crie — la Ligne est saturée, l'ouïe aveugle), **Salle des Derniers Mots** (lore gravé dans la chair).
- *Poumons* : **Alvéoles** (le vent du souffle pousse d'une case par cycle — le combat devient positionnel), **Bronchioles** (boyaux à ramper — sans jambes, avantage).
- *Cœur* : **Ventricules** (portes qui battent — passage au rythme, build tempo roi), **Salle de pression** (le sang monte au tick).
- *Entrailles* : **Bains d'acide** (mortels, sauf Peau Alchimique — qui s'y soigne), **Sphincters** (portes organiques : convaincre avec la langue ou forcer).

**Génération d'un étage** : taille 7×7 (strate 1) → 9×9 (2) → 11×11 (3+) ; quota : 1 puits, 1-2 antres, 1 charnier, 1-2 thématiques, 0-1 rare (pondéré), 15 % de cache. Le seed fait le plan, les quotas font le rythme.

## Combat

**Temps-réel à base de beats**, déclenché automatiquement à l'entrée d'une salle hostile. Le beat interval varie selon RYT : `max(400, 1200 - RYT×60)` ms — plus le cœur est rapide, plus les beats s'enchaînent vite. Pas d'écran séparé, le jeu continue dans la même vue.

### La règle fondamentale : la Vie est une Ressource

**Utiliser un skill coûte des PV à l'organe qui le déclenche.** Bras qui frappe → le bras saigne. Peau qui durcit → la peau se consume. C'est la même règle pour les joueurs et les mobs.

Conséquence directe : **chaque skill est un pari**. Frapper fort détruit ton arme. Esquiver épuise tes jambes. L'organe peut mourir de ses propres capacités — et perdre un organe en plein combat supprime son slot d'action. Le build n'est pas juste une liste de stats : c'est une mécanique qui se dégrade.

Les coûts par type : arm 1 HP, tongue 1 HP, legs 1 HP, eye 1 HP, ear 1 HP, brain 1 HP, stomach 2 HP, skin 2 HP, heart 0 HP (passif, pas de coût).

### La barre de vie segmentée (l'UI signature)

Pas de PV globaux — **la barre de vie d'un Body est la somme de ses organes**, affichée en segments : `[peau|peau|bras|bras|torse|torse|cœur]`. Chaque segment est un organe.

- **Lecture instantanée** : longueur de la barre = vie totale. Zéro apprentissage.
- **La barre EST l'interface de visée** : taper un segment = cibler cet organe. Un tap.
- **Le loot est lisible dedans** : segment brillant = récoltable, terne = abîmé, noirci = détruit (inrécoltable). Tu vois ta récolte se dégrader pendant que tu frappes.
- **Les couches** : `outer` (peau, membres) → `mid` (torse, sens) → `deep` (cœur, cerveau). Les segments profonds sont **grisés, non ciblables** tant que la couche au-dessus tient. Atteindre le cœur = traverser du loot. Certains organes contournent (perforant, pogo dorsal, grab de langue).
- **Symétrie de données, pas d'écran** *(décision proto v8)* : ta barre segmentée est le même composant que celle de l'ennemi, mais elle vit **avec ton corps** (panneau de droite, sous la silhouette) — c'est ta vie et ce que l'ennemi vise. Tes **actions** sont une barre séparée en bas. Ce que tu ES à droite, ce que tu FAIS en bas.

### Le tour de jeu (en beat)

1. **Auto-attaque joueur** : chaque beat, le joueur frappe automatiquement l'ennemi (couche outer disponible, ou l'organe visé si aimedSlot actif). C'est le débit de dégâts de base — gratuit en HP.
2. **Télégraphe mob** : simultanément, le mob annonce son prochain skill avec un compte à rebours : *« ⚔ Bras Tentacule [3▸] FRAPPE LOURDE »*. Le nombre de beats avant exécution dépend du cerveau du mob. Chaque beat le compteur descend — le joueur voit venir le coup.
3. **Tes skills (hors rythme)** : la barre d'actions affiche tes organes comme boutons cliquables. Chaque skill se déclenche immédiatement (pas d'attente du prochain beat). Coût : des PV à l'organe qui tire. Affichage sous-texte : HP courants / HP max de l'organe.

**Décisions tactiques disponibles à chaque beat :**
- **FRAPPER** (bras, ×3.0 dmg) : porter un coup massif pour détruire un organe avant son countdown.
- **ESTOC** (bras perforant, ×2.0, ignore ARM) : atteindre les couches profondes.
- **ESQUIVER** (jambes, +2 charges) : bloquer les 2 prochains skills mob.
- **ANALYSER** (cerveau) : révèle l'organe le plus faible ET verrouille l'auto-attaque dessus.
- **VISER** (œil, CD 1) : verrouille l'auto-attaque sur n'importe quel organe cible.
- **ÉCOUTER** (oreille) : repousse le countdown ennemi de +2 beats — gagne du temps.
- **DIGÉRER** (estomac, +4 HP) : soigne l'organe le plus blessé.
- **VAMPIRISER** (langue liche) : frappe ×2.5, vole autant de HP que les dégâts infligés.
- **DURCIR** (peau, absorbe 8 dmg) : prépare un bouclier contre le prochain skill mob.
- **MANGER** (en combat, si inventaire non vide) : consomme un organe → satiété + transfert de PV vers l'organe de ton choix.

**La mécanique clé** : détruire l'organe qui prépare un skill ANNULE ce skill. *FRAPPER le bras d'un Troll qui charge FRAPPE LOURDE → le bras est détruit → skill annulé.* Le combat est une course contre les countdowns.

### La fenêtre de riposte

Si le joueur choisit ATTENDRE (WAIT), une chance de riposte se déclenche au prochain coup mob : la stat `RYT` (cœur) fixe la probabilité (min(0.6, 0.05 + RYT×0.1)). Réussie → 0 dégât reçu + contre-attaque automatique. C'est une alternative défensive à ESQUIVER pour les builds RYT élevés.

### Les triggers (le moteur à builds)

Tout organe peut porter des déclencheurs : `onKill`, `onTick`, `onDamaged`, `onDestroy`, `onSound`, `onHarvest`, `onGraft`. C'est de la pure data, et c'est là que naissent les combos absurdes — des moteurs qui s'emballent (voir synergies). **Le build = quel moteur tu construis. Le skill = quand tu appuies.**

### Tuer vite ou tuer bien

- **Mort propre** (barre épuisée segment par segment) : silencieuse, cadavre stable, loot préservé selon tes choix de cibles.
- **Mort violente** (destruction directe du cœur) : kill instantané même si le reste est plein, MAIS — râle d'agonie (les charognards approchent en moitié moins de ticks, audible sur la bande) + spasme final selon le thème (le putréfié explose en nuage toxique, le cristallin en éclats, le brûlant enflamme la case) + le cœur, souvent le meilleur loot, est perdu.
- **Pas de meta universelle possible** : le golem n'a pas de cœur, l'hydre en a trois (en détruire un l'enrage), le spectre garde le sien dans une autre case, le voleur de visage expose un faux cœur-piège. Chaque silhouette de barre est un puzzle.

### Anti-lenteur

- Mob trash = 2–3 ticks. Un combat ordinaire dure 10–15 secondes.
- Humanité basse : les mobs très inférieurs fuient ou se soumettent (tu es un prédateur — plus de trash en fin de run).
- Le jeu n'attend ton cerveau que quand un télégraphe l'exige.

## Récolte

Après chaque kill :
- **Un seul organe récoltable par cadavre** (sauf organes/reliques dédiés).
- **Qualité = PV restants de l'organe à la mort** + type de dégâts subis (`fragileTo` : brûlé = cuit, écrasé = détruit, etc.). Règle mécanique, déterministe, lisible dans la barre segmentée pendant le combat. On choisit *comment* tuer en fonction de ce qu'on veut looter.
- **Tiers :** pourri < cuit < abîmé < intact < parfait. Module stats et malédiction. Les déchets nourrissent l'Alambic et l'Estomac de Fer.
- **La tension est au tick :** le cadavre se décompose (qualité qui baisse à chaque tick) et la récolte fait du bruit — sur la bande sonore, les **charognards approchent et grossissent**. Récolter, c'est choisir vite sous une menace qu'on entend venir.
- **Greffe = 5 ticks** (1 si écorché, 0 avec le Fil du Chirurgien), n'importe où — au mauvais endroit, elle tue. Amputation gratuite ; l'organe retiré part en inventaire et y pourrit (au tick).

## Humanité

Jauge cachée (révélée par le Cerveau du Détective ou certains PNJ).
- Organes monstrueux : elle baisse. Organes humains : elle tient.
- **Haute :** PNJ amicaux, prix corrects, dialogues, fin « humaine » accessible.
- **Basse :** les mobs inférieurs te fuient ou t'ignorent, zones organiques accessibles, mais les PNJ fuient — et le dieu commence à te *parler* (murmures sur la bande, sauf sourd).
- Aucun des deux n'est « le bon choix ». Deux jeux différents.

## Afflictions mentales & la jauge d'Hallucination

### Peur et Panique — statuts aigus
Appliqués comme des malédictions temporaires **sur l'organe cerveau** (sans cerveau : rien à affliger → immunité). Chaque cerveau liste ce qu'il craint ou ignore.

| Statut | Règle (une seule) | Écran | Purge |
|---|---|---|---|
| **Peur** | impossible d'avancer *vers* la source ; recul forcé si elle approche | la vignette se resserre du côté de la source | tuer la source · lumière vive · le Banc |
| **Panique** | inputs inversés pendant N ticks | l'écran tremble, les boutons glissent | attendre · le Banc |

### L'Hallucination — la jauge chronique *(réf. la sanité de Don't Starve)*
Le jeu repose sur deux canaux de confiance : **la vue et la Ligne**. La jauge d'Hallucination (0-100) corrompt précisément ces deux canaux — elle n'attaque pas tes PV, elle attaque ton *information*.

**Monte avec** : l'obscurité prolongée, les murmures du dieu (HUM bas), le lore interdit, certains organes (Peau du Dragueur, Oreille Paranoïaque : leurs « hallucinations » sont simplement `+X Hallu/tick` — unification, zéro mécanique dédiée), les salles maudites.
**Descend avec** : la lumière vive, le Banc, l'Abri (dormir), certaines potions de l'Alambic, et **parler à un humain** (le contact humain ancre — l'humanité protège l'esprit).

| Palier | Effets (cumulatifs) |
|---|---|
| 25+ | la Ligne ment parfois : petits sons fantômes ; le grain s'épaissit, les couleurs dérivent |
| 50+ | faux mobs au loin, fausses portes sur la minimap, faux loot qui se dissout au toucher |
| 75+ | **screamers rares** (un son énorme surgit sur la Ligne, l'écran convulse 1 tick) ; mobs illusoires qui attaquent — 0 dégâts réels, mais tu gaspilles ticks, riposte et viande à te battre contre rien ; l'UI ment (fausses barres de vie) |
| 100 | crise : Panique appliquée — et *(réf. Don't Starve)* **les hallucinations deviennent tangibles** : tes cauchemars gagnent des PV et un vrai loot. La folie complète est dangereuse… et farmable |

**Règles de fair-play** : une hallucination ne tue jamais directement (elle coûte des ressources et du doute, jamais de PV avant le palier 100) ; **la jauge n'est jamais affichée en chiffres** — l'écran EST la jauge (grain, dérive, Ligne qui tremble : pilier 1, diégétique). Le Cerveau du Détective prétend la chiffrer. Il ment parfois.
**Accessibilité** : les sons soudains (screamers) ont un toggle dédié dans les réglages.

## Ressources

Toutes consommées **au tick** (primitive n°1) :
- **La faim — le système complet** : une jauge de **satiété** (0-100) descend au tick, à la vitesse de la stat `FAM`. **Manger un organe donne deux effets simultanés** : (1) satiété remonte selon la qualité (parfait +30, intact +25, abîmé +18, cuit +10, pourri +4) ; (2) les PV de l'organe mangé sont **transférés vers l'organe équipé de ton choix** — le joueur choisit le slot cible dans une UI en deux temps (choisir l'organe → choisir le slot). Les deux effets coexistent toujours. **Manger est possible en combat** (bypasse le tick guard). À satiété 0, la **famine** ne tue pas : elle déclenche l'**autophagie** — le corps se mange lui-même, 1 PV d'organe perdu tous les ~10 ticks, *en commençant par les organes les plus monstrueux* (le corps rejette les greffes en premier — la famine dégrade ton build avant ta vie). L'Estomac du Survivant transforme ce risque en pari : dégâts ×2 en famine… pendant que l'autophagie ronge.
- **Torches** (modulées par les yeux), **organes en inventaire** (pourrissent), **viande** (la monnaie du donjon : les PNJ paient et se paient en chair — vendre son œil droit = moitié droite de l'écran noire jusqu'à regreffe). La monnaie étant de la viande, **elle se mange** : dilemme permanent entre richesse et famine, et l'Estomac de Fer peut littéralement dévorer ta fortune.
- **Inventaire en grille limité**, réduit par bras manquant.
- **Le corps est une ressource :** se manger un doigt pour survivre est possible. Le jeu ne juge pas. La jauge d'humanité, si.

## Mobs

- **Un mob = un Body + une IA.** Même structure que le joueur, même barre segmentée, même ouïe (il a sa propre bande sonore interne — tes pas y figurent). Ce que tu vois sur sa barre, c'est ce que tu peux looter.
- **Les mobs n'ont pas d'auto-attaque en combat** — toute leur menace passe par les skills télégraphiés. La tension du combat vient du countdown visible, pas d'un dégât continu passif. C'est ce qui donne au joueur le temps de réagir stratégiquement (ÉCOUTER, ESQUIVER, FRAPPER l'organe avant qu'il tire).
- **L'IA mob dépend du cerveau équipé** : brain_lich → schedule agressif (3 beats), priorise soins quand HP bas ; brain_titan → schedule lent (7 beats) mais frappe massive avec les bras ; sans cerveau spécialisé → 5 beats, comportement neutre. Le cerveau est aussi le nœud de l'intelligence — le détruire peut paralyser l'IA du mob.
- **Génération procédurale — les règles :**
  - **Budget** : `B = 4 + étage` points d'arcane (commun = 1 pt, rare = 2, épique = 4, légendaire = 8). Élite ×1,5. Le générateur achète des organes jusqu'à épuisement.
  - **Plafond d'arcane = la strate** : étages 1-5 → arcanes 0-V, 6-10 → jusqu'à X, 11-15 → jusqu'à XV, 16-20 → jusqu'à XX. Le XXI n'existe que sur les Organes Majeurs. *Le loot monte donc naturellement avec la profondeur.*
  - **Gabarits** : trash 3-4 segments, standard 5-6, élite 7-8 (+ relique possible : la tuer la donne).
  - **Thème obligatoire** (rampant, volant, putréfié, cristallin, brûlant…) : ≥70 % des organes du thème → cohérence visuelle, faiblesse partagée (`fragileTo`), spasme de mort violente, **phototropisme** (les brûlants attirés par la torche, les putréfiés repoussés…).
  - **Anatomie tirée** : 70 % un cœur, 15 % aucun (tout casser), 10 % deux, 5 % exotique (trois, déporté, factice). Chaque barre est un puzzle.
  - **Lisibilité** : max 2 capacités actives par mob (les télégraphes doivent rester lisibles), 1 trigger sur le trash, 2-3 sur les élites.
  - **Densité** : `3 + étage/2` mobs par étage, 1 élite à partir de l'étage 3 ; courbe douce intra-strate, pic au boss, léger reset en strate suivante (le temps d'apprendre ses mécaniques).
  - **Graveyard** : 1 ancien corps max par étage, placé à la profondeur où il est mort.
- **Mobs signés** pour les rencontres mémorables : le ver aveugle (chasse uniquement au son — la Langue Cousue le rend littéralement incapable de te percevoir), le voleur de visage (imite tes anciens corps, faux cœur exposé), le colporteur d'organes (mi-mob mi-marchand).
- **Les reliques s'appliquent aux mobs :** une aberration à Troisième Épaule existe — la tuer te la donne.

## Boss — trois familles

**1. Les Organes Majeurs** (fixes, fin de strate). Mêmes règles que tout le reste (segments, couches, ticks, sons), mais **chacun a UN pattern signature** qui teste un système précis du jeu — c'est ce qui rend le combat mémorable. Récompense : l'organe **arcane XXI** de son type. Structure commune : phase 1 (pattern lisible) → phase 2 (le boss sacrifie un de ses organes, sa barre se reconfigure, le pattern s'intensifie) → phase 3 (désespérée).

| Boss | Strate | Pattern signature | Système testé |
|---|---|---|---|
| **La Langue** | Gorge | *Lit tes intentions* : annonce TON action un tick avant que tu la joues. Il faut jouer à contretemps de sa propre logique (feinter). | lecture de soi |
| **Le Souffle** | Poumons | *Invisible* : aucune barre à l'écran. On le combat uniquement à la Ligne — frapper les directions d'où vient le vent. La folie fait apparaître de faux souffles. | ouïe pure + Hallucination |
| **Le Cœur** | Cœur | Tout pulse à son BPM ; tes actions ne comptent que si elles tombent **sur le battement**. Il accélère le tempo en phase finale. | timing / RYT |
| **La Faim** | Estomac | Ne t'attaque pas : à chaque tick elle **arrache un de TES organes** (le plus monstrueux d'abord) et se le greffe — elle grossit de ce qu'elle te prend. Course contre ta dissolution. | gestion du corps |
| **La Flore** | Entrailles | Repousse : chaque segment détruit **repart** après N ticks, sauf si on brûle d'abord sa racine (un segment caché). | ordre de destruction |

**Les Organes Mineurs** réutilisent des patterns allégés (l'Œil gauche fige par le regard = angles morts ; la Main Droite copie ton dernier coup ; etc.).

**1bis. Les Organes Mineurs** (optionnels, cachés — 1 par strate, derrière secrets ou énigmes). Mini-boss qui portent les XXI des 4 types restants : *l'Œil gauche* (te fige quand il te regarde — combat d'angles morts) → œil XXI, *la Main Droite* → bras XXI, *le Nerf Sciatique* → jambes XXI, *la Migraine* → cerveau XXI. Trouvables mais jamais obligatoires : la récompense du joueur qui fouille. Avec les 5 Majeurs, les 9 types ont chacun leur source légendaire. Structure : phase 1 lisible → phase 2 le boss **sacrifie un de ses propres organes** (sa barre se reconfigure, son pattern change — le boss joue au même jeu que toi) → phase 3 désespérée. La façon de finir détermine ce qui survit de son corps.

**2. Tes anciens corps** (graveyard). Ton ancien Body exact : sa barre segmentée, tu la connais par cœur — et lui connaît la tienne. Meilleure était la run, plus dur le boss, meilleur le loot. Certains parlent (Langue Morte), supplient, mentent.

**3. Le Rival.** Pillard nommé, persistant, qui se greffe ce qu'il tue. Sa barre évolue de run en run — on peut suivre ses choix de build comme un feuilleton. Commerce, alliance d'un étage, trahison possibles. Le tuer est **définitif** : organes uniques, mais après lui, plus jamais. Il apprend de tes builds (snipe ton cœur si tu snipes les siens).

## Reliques

Objets rares (non-organes), max 3 portées. Sources : aberrations profondes, autels, Couturière, Rival.

**De structure** (modifient les slots — les plus précieuses) :
| Relique | Effet |
|---|---|
| Troisième Épaule | +1 slot bras |
| Orbite Creuse | +1 slot œil |
| Colonne Double | +1 slot cœur (deux ultimes, deux malédictions — et l'anti-snipe ultime) |
| Mâchoire Dédoublée | +1 slot langue (parler ET chanter) |

**D'usage** (avec leurs clins d'œil) :
| Relique | Réf | Effet |
|---|---|---|
| Fil du Chirurgien | — | greffe = 0 tick |
| Bocal Saumuré | — | un organe d'inventaire ne pourrit plus |
| Le Dé du Sous-sol | Binding of Isaac (D6) | 1×/étage : relance les organes d'un cadavre |
| Noyau Temporel | Into the Breach | 1×/étage : annule TON dernier tick |
| Couronne de la Soif | Nuclear Throne | révèle tout l'étage, mais FAM ×2 — bénédiction-malédiction |
| Boussole Égarée | Hollow Knight (Wayward Compass) | affiche... ta propre position. C'est tout. La Couturière jure qu'elle est utile |
| Lampe-Tempête | Don't Starve | lumière sans torche — mais LUM +3, les phototropes accourent |
| Clochette du Troupeau | Cult of the Lamb | un charognard apprivoisé te suit : porte 2 organes, et reste mangeable |
| Cuillère du Fossoyeur | Shovel Knight | déterre les cadavres enfouis des étages (loot caché + lore) |

---

# NARRATION

## Le monde

Le donjon est le **cadavre vertical d'un dieu**, enterré debout. Chaque strate est un organe géant ET une strate de son histoire. **Au fond de la Gorge, le corps se divise** — Trachée ou Œsophage, et ce choix engage toute la run :

| Étages | Strate | Ambiance | Organe Majeur → XXI |
|---|---|---|---|
| 1–5 | **La Gorge** | Boyaux secs, échos, ses derniers mots gravés dans la chair | **La Langue** (annonce TES actions — jouer illogique) → langue |
| | *— le carrefour : Trachée (Air) ou Œsophage (Chair) —* | | |
| 6–10 ✈ | **Les Poumons** *(voie de l'Air)* | Cavernes qui respirent, vents, spores | **Le Souffle** (invisible — se combat à la Ligne pure) → oreille |
| 11–15 ✈ | **Le Cœur** *(voie de l'Air)* | Chaleur, pulsation omniprésente, ceux qui l'ont aimé | **Le Cœur** (duel de tempo) → cœur |
| 6–10 ✠ | **L'Estomac** *(voie de la Chair)* | Lacs de suc, choses à demi digérées | **La Faim** (dévore tes organes en combat) → estomac |
| 11–15 ✠ | **Les Entrailles** *(voie de la Chair)* | Acide, flore parasite — ce qui l'a tué vit peut-être ici | **La Flore** (pousse et repousse — détruire ses racines) → peau |
| 16+ | **Le Fond** *(convergence)* | ??? (design volontairement scellé) | Le choix final |

**Pourquoi les voies font la rejouabilité** : chaque voie a ses boss, ses salles thématiques, ses pools d'organes et **ses XXI exclusifs** — cœur et oreille XXI ne se gagnent que par l'Air, estomac et peau XXI que par la Chair. Construire certains builds *impose* une route. Les humeurs (ci-dessous) et le seed font le reste.

**Chemins alternatifs intra-étage** : chaque étage a **2 puits de descente** quand c'est possible — un sûr et long, un court et gardé. S'y ajoutent : la **Fausse Route** (passage secret de la Gorge qui « avale de travers » — saute directement à l'étage 7 de l'autre voie que celle choisie, mal en point), les raccourcis du Bras du Mineur, et les fosses (tomber = descendre d'un étage, en payant en PV d'organes).

**Les Humeurs du cadavre** (1 par run, tirée au seed, annoncée à l'entrée — le dieu n'est jamais deux fois dans le même état) :
- *Fièvre* : tout pourrit ×2 vite, mobs brûlants partout, la viande se conserve mal.
- *Frissons* : les torches brûlent ×2, le froid ralentit (VIT −1), mobs cristallins.
- *Bile montante* : liquides à chaque étage (paradis de la Peau Alchimique).
- *Rigor mortis* : mobs lents mais blindés (ARM +2), portes à forcer.
- *Insomnie* : le dieu murmure dès HUM < 60, lore ×2, Écho actif plus tôt.

## Le mystère central

**Pourquoi le dieu est mort ?** Fragments sur des dizaines de runs : inscriptions (Cerveau du Renard), **organes mémoriels** (greffe son œil → tu *vois* un souvenir), PNJ contradictoires, murmures (Oreille du Confessionnal — le lore passe par la primitive Son). Le joueur reconstitue seul. Écriture courte, deux phrases par event, ton Darkest Dungeon.

## Le twist structurel

**Tu n'es pas le héros, tu es un symptôme.** Le dieu digère les pillards et se reconstruit avec eux. Chaque greffe, c'est LUI qui te colonise. Tes anciens corps en boss ? Sa façon de te garder. Les murmures qui montent quand l'humanité baisse ? Sa voix qui devient la tienne. (Se crever les tympans devient un acte de résistance — la mécanique du sourd EST du narratif.)

## Les trois fins (qui bouclent)

Au Fond, corps presque entièrement monstrueux :
1. **Tuer le cœur pour de bon.** Le donjon se régénère différemment : nouveau biome, nouveaux organes. (Reset du bestiaire, contenu frais.)
2. **Devenir le nouveau dieu.** La run suivante explore TON cadavre, peuplé de tes builds passés. Le New Game+ littéral.
3. **Rester humain et remonter.** Exige une humanité haute (la plus dure). PNJ de surface + le seul lore extérieur.

Aucune fin ne termine le jeu : chacune transforme la boucle suivante (primitive Mémoire).

## Les PNJ

Tous réagissent aux **seuils d'humanité**, et tous peuvent mourir **définitivement** (primitive Mémoire — un PNJ tué ne réapparaît jamais).

| Seuil HUM | Effet |
|---|---|
| ≥ 60 | tout le monde te parle, prix normaux |
| 30-59 | méfiance, prix +25 %, certains dialogues fermés |
| < 30 | les pillards fuient ou attaquent à vue ; **l'Écho du dieu s'active** |
| 0 | plus aucun dialogue humain ; les zones organiques s'ouvrent |

- **Le Marchand d'en-bas** — boutique itinérante. Vend torches, viande, organes douteux ; **achète tes organes humains** (cher, et le prix se paie à l'écran). Indifférent à ton humanité — ce qui devrait inquiéter. N'est probablement plus humain depuis longtemps (lore).
- **La Couturière** — chirurgienne fixe, rare (1 par strate max). Greffe et ampute **proprement** (0 risque, 0 tick, payant en viande), vend les reliques de structure (Troisième Épaule, Orbite Creuse), et **coud sur demande** : langue cousue, tympans crevés — les builds volontaires de privation passent par elle. Ne juge jamais.
- **Les pillards anonymes** (procéduraux) — 4 états : *blessé* (aide-le → allié pour un étage), *marchand amateur* (troc d'organes), *hostile* (il veut TES organes), *mourant* (reste près de lui → il te lègue un organe ; ou récolte-le — HUM s'effondre). Tuer un humain : −25 HUM.
- **Le Rival** — voir Boss. Entre les combats : il commerce, ment, propose des alliances d'un étage, et **se souvient de chaque trahison**.
- **L'Ermite qui remonte** — le seul PNJ croisé en sens inverse. Témoin d'une ancienne fin 3. Vend des fragments de carte des étages inférieurs, et refuse de dire ce qu'il a vu au Fond.
- **L'Écho du dieu** — pas un corps : une voix (la Ligne, le log). À HUM < 30, il propose des **pactes** : un organe légendaire contre un slot *définitivement colonisé* (l'organe ne pourra plus jamais être retiré de ce slot, toutes runs confondues).
- **Tes anciens corps** — dialogue via Langue Morte : fragments de leurs runs, marchandage post-mortem, mensonges.

## Rythme narratif
Un event tous les 2-3 étages, porté par les salles rares (autel, fosse aux parasites, salle-mémoire, trace du Rival) et les PNJ ci-dessus. Écriture : deux phrases, ton Darkest Dungeon, jamais d'exposition.

---

# BOUCLE & MÉTA

## La boucle d'une run
Explorer (au tick, à l'oreille) → lire les télégraphes → tuer vite ou tuer bien → récolter sous la menace des charognards → greffer (dilemme, 5 ticks) → event → descendre → Organe Majeur → plus profond, plus monstre → mort ou Fond.

## Début de run
Chaque pillard démarre **entièrement humain** (corps de référence), 30 viande, 3 torches — plus, éventuellement, son **Héritage** (voir ci-dessous). L'entrée du donjon est la bouche du dieu : le premier étage sert de tutoriel environnemental (un charognard faible, un cadavre à récolter, une greffe évidente).

## L'Héritage — la Consigne de la Couturière (méta-progression)
Chez la Couturière, on peut **mettre UN organe en consigne** (payant, cher). À la mort, cet organe survit : le pillard suivant peut le récupérer chez elle au premier étage. C'est l'unique transfert de puissance entre les runs — un seul slot, un choix douloureux (consigner = ne plus le porter), et un coût. Tout le reste de la méta est de la *connaissance et du monde* : graveyard, Rival, graines, lore, Reliquaire (codex des organes déjà récoltés, consultable — savoir ce qui existe EST une progression).

## La boucle méta
Mort → Body sérialisé au **graveyard** → run suivante : nouveau donjon (seed + humeur), graines écloses, Rival avancé, lore accumulé.

### Ton cadavre EST le donjon suivant *(carte évolutive)*
La fin **2 (devenir le dieu)** et, plus modestement, chaque mort, transforment ton dernier Body en **topologie du donjon suivant** — la meta "graveyard" n'est pas que des boss, ce sont des **mondes** :
- Chaque **organe non-humain porté** devient une **salle-excroissance** : un détour optionnel thématisé sur cet organe (ton Œil de Beholder → une salle qui voit, etc.), avec son loot lié.
- Chaque **relique de slot** ajoute **un sous-biome entier + un mini-boss** : Colonne Double → le *Ventricule Jumeau* ; Troisième Épaule → le *Bras Surnuméraire* ; Orbite Creuse → la *Chambre Aveugle*. Plus tu avais d'extensions, plus ton cadavre est vaste.
- Ton **humanité finale** règle l'ambiance et la densité (corps très monstrueux → donjon plus grand, plus hostile, plus riche en loot).
- Tes **malédictions** deviennent les aléas environnementaux de ton cadavre (l'infection du Roi Pâle → des salles qui rongent l'écran, etc.).

Conséquence : une run riche et chargée engendre un cadavre-donjon vaste et dangereux à piller. Ta puissance passée devient ton défi futur — cycle vertueux. Le donjon ne se vide jamais : il est peuplé, et désormais *façonné*, par tous tes anciens toi.

### Les 7 fils de la méta-progression
| Fil | Ce qui persiste | Ce que ça donne |
|---|---|---|
| **Graveyard** | tes corps morts → boss | farmer tes meilleurs anciens builds (loot = tes organes) |
| **Héritage** | 1 organe en consigne (payant) | le seul transfert de *puissance* entre runs |
| **Reliquaire** | codex des organes récoltés | connaissance : stats/malédictions consultables avant de greffer |
| **Graines** (Fermier) | pousses dans les cadavres | organes améliorés qui t'attendent à la prochaine run |
| **Le Rival** | son build, ses rancunes | un antagoniste-feuilleton, ses organes uniques |
| **Lore** | fragments débloqués | le mystère du dieu se reconstitue, dialogues qui s'ouvrent |
| **Les Fins** | l'état du monde | chaque fin transforme le donjon des runs suivantes |

Philosophie : **un seul fil donne de la puissance** (l'Héritage, limité à un organe). Tout le reste est du monde et de la connaissance — la difficulté ne s'érode jamais, c'est le joueur qui progresse.

## Save
- **JSON intégral en localStorage** + export/import fichier, accessibles **en jeu** depuis l'en-tête (⇩ SAVE / ⇧ import — validé au proto, format déjà figé).
- `meta` (runs, lore, fins choisies), `graveyard` (Bodies + profondeur + cause de mort), `rival`, `seeds_plantées`, `currentRun` (Body, seed, position, tick).
- Le donjon n'est jamais stocké : seed + régénération déterministe. Pas de save-scumming.

---

# ÉQUILIBRAGE — GARDE-FOUS

**Durées cibles** : combat trash ~15 s · étage 5-8 min · strate 30-40 min · run complète (Fond) 2-3 h · run moyenne (mort) 30-60 min.

**Économie indicative (en viande)** : torche 10 · repas 5 · organe commun 15-30 · rare 50-90 · épique 150+ · ton œil humain se vend ~80 · consigne de l'Héritage ~100 · loyer de la Panse 15/étage. La faim humaine brûle ~1 viande / 25 ticks : la famine est lente mais inévitable sans gestion.

**Soupapes anti-frustration** : boutique garantie 1×/strate · le boss de strate lâche toujours son XXI · 15 % de cache par étage · la Couturière propose toujours au moins 1 organe du slot le plus faible du joueur · jamais deux étages consécutifs sans organe greffable.

**Philosophie** : l'absurde des combos est *permis, pas équilibré* — les garde-fous sont les malédictions cumulées, les anatomies qui contrent, et la faim. On nerfe l'ennui, jamais la puissance.

---

# DIRECTION ARTISTIQUE & INTERFACE *(gelées au proto v8 — `chair_da_proto.html`)*

## Palette & matière
Noir dominant (#030202). La chair des murs à peine visible (#2e1112, striations), l'os (#b8a886) pour le texte et les cadres, la torche ambrée (#c47f33) pour tout ce qui est précieux/actif, le **violet des murmures** (#7d659e) réservé au dieu, le fil de suture (#5d2120). Grain de pellicule animé, vignette **fixe** (jamais pulsée), torche au vacillement irrégulier, murs qui respirent (cycle 8 s, subliminal).
**Typo** : serif en petites capitales espacées (titres, noms) + monospace (log, Ligne, données) — héritage terminal des vieux crawlers.
**Thème UI : l'interface est suturée.** Panneaux en os ciselé (coins en équerre, double bordure, ◆ au sommet), coutures de fil rouge entre les zones, crans de PV gravés dans les segments.

## Rendu (zéro asset)
- **Couloir** : tranches de profondeur en `clip-path` (trapèzes %), pas de transforms 3D — fiable, et s'étire à tout ratio d'écran. Côtes d'os en arches pour la Gorge.
- **Créatures** : compositions CSS/Unicode procédurales — silhouettes dans le noir, yeux luisants ; on devine plus qu'on ne voit.
- **Audio** : 100 % généré en WebAudio. Drone dissonant (oscillateurs désaccordés qui battent), **le cœur du joueur au premier plan** (lub-dub ~1,1 s, synchronisé à l'UI : segment cœur + voile rouge aux bords), sons spatialisés en stéréo correspondant un-à-un à la Ligne, râles de structure rares.

## Architecture d'information du HUD
Chaque zone a UN job :

| Zone | Job |
|------|-----|
| **En-tête** | lieu · étage · tick · humanité + ⚙ réglages (dont toggle « sons soudains ») · ⇩ save · ⇧ import |
| **Gauche — Besace** | inventaire en grille ; bras perdu = moitié des cases **condamnées** (hachures visibles) ; viande / torches / faim |
| **Gauche — Carte** | 7×7 révélée en explorant ; ▲ toi, **◌ rouge = ennemi entendu** (l'ouïe reportée sur la carte), ▒ couloirs devinés ; boussole |
| **Centre — Vue** | le couloir, la créature, sa barre segmentée + **télégraphe** (*« ⚠ charge · ~2 ticks »*, sobre — type d'action + compte approximatif de base, exact via organes) |
| **Centre — la Ligne** | sismographe blanc fin en bas de vue : chaque son = perturbation à sa position (G/FACE/D + « derrière ») ; **l'opacité des labels suit le volume en temps réel** (pur visualizer : un son qui meurt s'efface en fondu) |
| **Centre — Log** | 3-4 lignes mono, marqueurs ▸, curseur clignotant ; les murmures du dieu en violet espacé |
| **Droite — Ton corps** | **la silhouette est l'index** : 12 points de slot cliquables, code couleur (rouge-orangé = monstrueux, rouge sombre = humain, ocre = blessé, vide = perdu) ; ta barre de vie segmentée dessous |
| **Droite — Inspection** | au repos : **stats dérivées** (dégâts, perception, bruit émis, vitesse, faim, humanité — chacune avec son organe source) ; au clic sur un slot / segment ennemi / objet : fiche (état PV, pouvoir, malédiction, humanité, info de récolte) |
| **Bas — Actions** | 6 slots (touches 1-6) : nom + organe source, vides en pointillés ; pad de déplacement intégré (↺↑↻ / ←↓→, Q/E), séparé par une suture, échelle fluide en `clamp()` |

Règles transverses : aucun texte tutoriel dans le HUD ; labels de segments toujours lisibles (texte os clair sur ombre, jamais noir sur noir) ; tout élément inspectable a un curseur + anneau de sélection.

## Le corps déforme l'écran *(validé et étendu — SensoryFX)*

Chaque organe DOIT avoir un effet visible (pilier 1). Implémentés via le module `SensoryFX.js` en overlays CSS et variables CSS dynamiques :

| Organe / stat | Effet écran |
|---|---|
| Œil droit vendu | moitié droite noire |
| Jambe perdue | vue penchée |
| Cœur | écran pulse à chaque beat (vignette beatpulse, intensité ∝ RYT) |
| eye_beast | filtre chaud sur le viewport (backdrop-filter sepia+saturate) |
| eye_spider | filtre hue-rotate bleuté |
| eye_void | filtre noir désaturé |
| eye_beholder | filtre violet/hex |
| eye_lich | filtre lich-pulse |
| Satiété < 35 | vignette orange faim (pulsée en dessous de 15) |
| brain_lich | ligne EKG violette qui sweep à chaque beat |
| BRT élevé | halo ambré sur la cellule minimap du joueur |
| LUM élevé | éclat chaud sur le viewport (.game lum-low/mid/high) |
| Coup reçu | flash viewport selon skin : normal / pierre / carapace / liche / acide |
| HEART_ULTIMATE | flash rouge sang sur tout le jeu |
| LICH_REVIVE | burst violet sur tout le jeu |

## Plateformes
- **PC** : plein écran (100 dvh), colonnes en `clamp(15-19 vw)` avec scroll interne, la vue absorbe la hauteur restante.
- **Téléphone** : **paysage uniquement** — en portrait, écran « ⟳ pivote ton téléphone » ; en paysage < 560 px de haut, mode compact (colonnes 128/170 px, typo resserrée).
- **Tactile** : points de slot agrandis (16 px) sur pointeur grossier, et les segments de ta barre de vie sont les **mêmes cibles d'inspection** que les points — sur téléphone on tape les segments, larges. La greffe fine se fera sur l'écran de personnage (plein écran, silhouette grande).

---

# ARCHITECTURE & ROADMAP

Les détails techniques (schémas de données, registres, formules, algorithmes, arborescence de fichiers, ordre de build) vivent désormais dans **`CHAIR_SPEC.md`** — la spec d'implémentation. Ce GDD reste le document de vision.

**Rappel des principes** (développés dans le SPEC) : 100 % HTML/CSS/JS vanilla sans dépendances ; orienté data (contenu en JSON, code = interpréteur) ; déterministe (RNG seedé) ; les 4 primitives = 4 modules (`TickEngine`, `Body/Organ`, `SoundStage`, `Memory`) ; rendu CSS pour les scènes, canvas pour la Ligne, DOM pour le HUD.

**Jalon jouable** : une run de la Gorge — explorer, combattre, récolter, greffer, un boss à pattern, mourir, relancer. Cf. l'ordre de build du SPEC.
