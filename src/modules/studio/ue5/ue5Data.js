// ============================================================
// UE5 BLUEPRINT — contenu de révision (fiches + quiz)
// Généré depuis les 7 supports de cours + approfondissements
// Widgets & Signaux, vérifiés pour Unreal Engine 5.4.
// NE PAS ÉDITER À LA MAIN : régénérer via consolidate.mjs.
// ============================================================

export const CHAPTERS = [
  {
    "id": "decouverte",
    "num": "01",
    "special": false,
    "title": "Découverte du moteur",
    "summary": "Ce chapitre introduit Unreal Engine (moteur, concurrents, C++/Blueprint), l'installation via l'Epic Games Launcher et la création d'un projet, puis fait le tour complet de l'éditeur UE5 : interface, navigation dans le viewport, Content Browser, Outliner, Details panel, préférences, outils de transformation, modes de l'éditeur, mise en place d'un niveau et de son éclairage, et gestion des Actors et des assets.",
    "topics": [
      "moteur de jeu (définition)",
      "Unreal Engine / Epic Games",
      "langages C++ et Blueprint",
      "concurrents (Unity, CryEngine, Godot)",
      "licence et redevance",
      "comparatif Unity / Unreal",
      "Epic Games Launcher",
      "onglet Bibliothèque et versions du moteur",
      "templates de projet",
      "création de projet (Blueprint/C++, plateforme, qualité, Starter Content)",
      "Menu Bar",
      "Main Toolbar",
      "Viewport Toolbar",
      "Level Viewport",
      "Content Drawer button",
      "Bottom Toolbar",
      "Outliner",
      "Details panel",
      "navigation viewport à la souris",
      "focus caméra (F) et orbite",
      "Editor Preferences",
      "raccourcis AZERTY / Keyboard Shortcuts",
      "outils de transformation (Move/Rotate/Scale)",
      "système de coordonnées World / Local",
      "snapping (grid, rotation, scale, surface)",
      "modes d'affichage (Lit, Unlit, Wireframe)",
      "vitesse de caméra",
      "Show Flags / FPS",
      "Bookmarks caméra",
      "Play In Editor (PIE) et options de Play",
      "Input Mapping Context (IMC)",
      "F8 Eject / Possess",
      "Keep Simulation Changes",
      "Character Movement component",
      "layout de l'interface (dockable, sauvegarde)",
      "Project Settings",
      "Maps & Modes",
      "création d'un niveau (New Level / Empty Level)",
      "sauvegarde et dossier Maps",
      "éclairage / Environment Light Mixer",
      "Sky Light Real Time Capture",
      "Exponential Height Fog / Volumetric Fog",
      "rangement de l'Outliner (dossiers)",
      "les modes de l'éditeur (Selection, Landscape, Foliage, Mesh Paint, Modeling, Fracture, Brush Editing, Animation)",
      "Modeling Mode / CubeGrid",
      "Content Browser / Content Drawer",
      "Set Color de dossier",
      "import d'assets",
      "Migrate (migration d'assets)",
      "Developer folder",
      "Marketplace / Fab",
      "Actor (équivalent GameObject)",
      "Place Actors panel",
      "drag & drop et Quixel Bridge",
      "copier-coller de transform, Alt-duplication, Shift-suivi caméra"
    ],
    "fiches": [
      {
        "title": "Qu'est-ce qu'un moteur de jeu et Unreal Engine ?",
        "body": "Un **moteur de jeu** est un ensemble de modules et d'interfaces qui gèrent les objets, les niveaux, le rendu de la portion visible du monde, la mise à jour des positions et le comportement des PNJ, pour laisser l'équipe se concentrer sur le **gameplay** plutôt que sur la technique. **Unreal Engine** est un moteur propriétaire développé par **Epic Games**, dont les principaux concurrents sont **Unity**, **CryEngine** et **Godot**. Il propose deux façons de programmer : le **C++** et un langage visuel par nœuds appelé **Blueprint**.",
        "keypoints": [
          "Moteur = gère objets, niveaux, **rendu**, positions et IA des PNJ",
          "**Unreal Engine** développé par **Epic Games** (propriétaire)",
          "Concurrents : **Unity**, **CryEngine**, **Godot**",
          "2 langages : **C++** (performant) et **Blueprint** (visuel)"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Qu'est-ce qu'un moteur de jeu et Unreal Engine ?"
      },
      {
        "title": "Licence et comparatif Unity / Unreal",
        "body": "Depuis mars 2015, Unreal Engine est **gratuit** ; une **redevance** n'est due qu'au-delà d'un certain chiffre d'affaires. Le moteur exporte vers de nombreuses plateformes (PC, consoles, mobiles, VR...). **Unity** se démarque par sa simplicité de prise en main, sa rapidité de compilation, ses outils 2D et ses exports mobiles plus légers. **Unreal** se démarque par la performance du **C++**, la qualité du **rendu**, un **moteur réseau** mature, des outils d'animation complets et le **Blueprint** accessible aux non-codeurs.",
        "keypoints": [
          "**Gratuit** depuis 2015, **redevance** au-delà d'un seuil de revenus",
          "**Unity** : prise en main, compilation, 2D, mobile léger",
          "**Unreal** : **C++**, **rendu**, réseau, animation, **Blueprint**"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Unreal vs Unity : licence et forces de chacun"
      },
      {
        "title": "Epic Games Launcher : installer et lancer le moteur",
        "body": "On télécharge et gère Unreal depuis le site unrealengine.com puis via l'**Epic Games Launcher**. Le launcher comporte plusieurs onglets : **Actus** (accueil), **Apprendre/Exemples** (tutos), le **Marché** (équivalent de l'Asset Store d'Unity) et la **Bibliothèque**. C'est dans la **Bibliothèque** que l'on installe les différentes versions du moteur (bouton **+**) et que l'on relance rapidement un projet existant.",
        "keypoints": [
          "Installe et gère Unreal ; compte **Epic** requis",
          "Onglets : Actus, Exemples, **Marché**, **Bibliothèque**",
          "Installer une version : **Bibliothèque** > bouton **+**",
          "La Bibliothèque relance aussi vos projets"
        ],
        "versionNote": "En UE 5.4 (avril 2024) le catalogue est le Marketplace ; depuis octobre 2024 il a été remplacé par Fab, désormais accessible via un onglet dédié du launcher.",
        "tier": 1,
        "front": "À quoi sert l'Epic Games Launcher ?"
      },
      {
        "title": "Créer un projet",
        "body": "Depuis la Bibliothèque, on clique sur **Lancer** puis on choisit un **template** (types de jeux courants : vide, First Person, Third Person...). Ces templates peuvent d'ailleurs être intégrés à tout moment de la vie du projet. À la création, on règle plusieurs options : **Blueprint** ou **C++**, la cible (**Desktop**), le niveau de **qualité**, et l'ajout du **Starter Content**. On donne enfin un nom et un dossier, puis on clique sur **Create**.",
        "keypoints": [
          "Choisir un **template** selon le type de jeu",
          "Options : **Blueprint**/**C++**, plateforme, qualité, **Starter Content**",
          "Templates ajoutables à tout moment du projet",
          "Nom + emplacement, puis **Create**"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Comment créer un projet Unreal ?"
      },
      {
        "title": "L'interface de l'éditeur : les 8 zones",
        "body": "L'éditeur de niveau UE5 s'organise en zones principales. La **Menu Bar** donne accès aux commandes de l'éditeur ; la **Main Toolbar** regroupe des raccourcis vers les outils courants, le mode Jeu et le déploiement ; la **Viewport Toolbar** contient les outils translate/rotate/scale et les réglages d'affichage ; le **Level Viewport** affiche le contenu du niveau. En bas, le bouton **Content Drawer** ouvre le tiroir de contenu et la **Bottom Toolbar** donne accès à la console, l'**Output Log** et l'état du contrôle de source. À droite, l'**Outliner** montre la hiérarchie du niveau et le **Details panel** affiche les propriétés de l'élément sélectionné.",
        "keypoints": [
          "**Menu Bar** + **Main Toolbar** : commandes, **Play**, déploiement",
          "**Viewport** : vue du niveau ; **Viewport Toolbar** : transform/affichage",
          "**Content Drawer** : assets ; **Bottom Toolbar** : console, Output Log",
          "**Outliner** : hiérarchie ; **Details** : propriétés du sélectionné"
        ],
        "versionNote": "En UE 5.4 la Viewport Toolbar est encore l'ancienne barre à bulles flottantes ; sa refonte majeure (barre pleine largeur) est arrivée en UE 5.6.",
        "tier": 1,
        "front": "Les zones principales de l'éditeur UE5"
      },
      {
        "title": "Naviguer dans le viewport",
        "body": "La navigation ressemble à Unity. Un **clic gauche** sélectionne un objet ; la **molette** zoome. En maintenant le **clic gauche**, la souris agit comme les flèches directionnelles (avancer/reculer, gauche/droite) ; en maintenant le **clic droit**, on change l'**orientation** de la caméra ; en maintenant **clic gauche + droit** simultanément, on change la **position** (translation) de la caméra. La touche **F** centre (focus) la caméra sur l'objet sélectionné, après quoi il est possible d'**orbiter** autour de lui.",
        "keypoints": [
          "Clic gauche : sélectionner ; molette : zoom",
          "Clic droit maintenu : pivoter la caméra (orientation)",
          "Clic gauche + droit : déplacer la caméra",
          "**F** : focus sur l'objet sélectionné, puis orbite"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Naviguer dans le viewport à la souris"
      },
      {
        "title": "Editor Preferences et raccourcis clavier",
        "body": "Les préférences de l'éditeur s'ouvrent via **Edit > Editor Preferences** et n'affectent que votre éditeur (pas le projet). Elles sont organisées en catégories (Général, Level, Content, Plugins, Privacy, Avancée) et disposent d'une **barre de recherche** très utile. On y modifie fréquemment les **Keyboard Shortcuts** (raccourcis), le comportement au démarrage (Loading & Saving), les captures d'écran, etc. C'est aussi là qu'on peut remapper la **navigation viewport** ou passer les touches de transformation en **AZERTY**.",
        "keypoints": [
          "**Edit > Editor Preferences** : votre éditeur seulement (pas le projet)",
          "Catégories + **barre de recherche** pour trouver un réglage",
          "Modifier les **Keyboard Shortcuts** (ex. remap **AZERTY**)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Où régler préférences et raccourcis clavier ?"
      },
      {
        "title": "Outils du viewport : transformation, snapping et affichage",
        "body": "Pour manipuler les Actors on utilise trois **outils de transformation** : **Move** (**W**), **Rotate** (**E**) et **Scale** (**R**) ; la **barre d'espace** fait défiler ces outils, et le gizmo se règle en repère **World** (monde) ou **Local** (axes propres de l'objet). Le **snapping** s'active et se configure pour la grille (déplacement), la **rotation**, le **scale** et l'aimantation à la **surface**, en plus du réglage de la **vitesse de caméra**. Côté affichage, les modes **Lit** (éclairé), **Unlit** (sans éclairage) et **Wireframe** (filaire) s'obtiennent par Alt+chiffre ; les **Show Flags** basculent fog, collision ou l'affichage des **FPS**, et les **Bookmarks** mémorisent jusqu'à 10 vues (Ctrl+chiffre pour enregistrer, le chiffre pour rappeler).",
        "keypoints": [
          "**Move** = W, **Rotate** = E, **Scale** = R ; repère **World**/**Local**",
          "**Snapping** : grid, rotation, scale, surface ; vitesse caméra",
          "Affichage : **Lit** (Alt+4), **Unlit** (Alt+3), **Wireframe** (Alt+2)",
          "**Show Flags** (FPS, fog) ; **Bookmarks** : 10 vues (Ctrl+chiffre)"
        ],
        "versionNote": "Raccourcis de transformation par défaut en UE 5.4 : W/E/R (le support indiquait Q/W/E). En 5.4 la Viewport Toolbar est encore l'ancienne barre à bulles ; sa refonte est arrivée en UE 5.6.",
        "tier": 2,
        "front": "Transformation, snapping et modes d'affichage"
      },
      {
        "title": "Play In Editor (PIE), raccourcis et Keep Simulation Changes",
        "body": "Le bouton **Play** lance le jeu directement dans l'éditeur (**Play In Editor**, raccourci **Alt+P**) ; les **3 points** à droite ouvrent les options (rester dans l'éditeur, **Standalone**, multijoueur...). Pendant le play, **F8** (Eject/Possess) détache le contrôle du personnage pour se déplacer et éditer des Actors dans le Details panel, puis on reprend la main avec **Possess** ; **Maj+F1** libère la souris, **F11** passe en plein écran et **Échap** quitte. Par défaut, les modifications faites en play sont **annulées** à l'arrêt : pour les conserver, on éjecte (F8), on sélectionne l'Actor, puis clic droit > **Keep Simulation Changes** (**K**). Les touches de gameplay se remappent via l'**Input Mapping Context** (ex. IMC_Default).",
        "keypoints": [
          "**Play In Editor** : Alt+P ; options via les 3 points (Standalone...)",
          "**F8** Eject/Possess ; Maj+F1 souris ; F11 plein écran ; Échap quitte",
          "**Keep Simulation Changes** (clic droit > K) garde les modifs du play",
          "Touches de gameplay : **Input Mapping Context** (IMC)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Play In Editor (PIE) et Keep Simulation Changes"
      },
      {
        "title": "Layout de l'interface et Project Settings",
        "body": "Les panneaux (Outliner, Details...) sont **dockables** ou **autohide** : on les déplace par cliquer-glisser, on les rouvre depuis le menu **Window**, et on peut **sauvegarder**, **charger** ou **réinitialiser** un layout via le menu dédié. À ne pas confondre : les **Project Settings** (Edit > Project Settings) s'appliquent à **tout le projet** et regroupent 6 catégories : **Projet**, **Jeu**, **Moteur**, **Éditeur**, **Plateformes** et **Plugins**. On y trouve notamment **Maps & Modes** pour définir le niveau de démarrage de l'éditeur et le niveau par défaut du jeu.",
        "keypoints": [
          "Panneaux **dockables**/autohide, rouvrables via **Window**",
          "Layout : sauvegarder / charger / réinitialiser",
          "**Project Settings** = tout le projet (6 catégories)",
          "**Maps & Modes** : niveau de démarrage éditeur et jeu par défaut"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Layout des panneaux et Project Settings"
      },
      {
        "title": "Créer un niveau et son éclairage",
        "body": "On crée un niveau vide via **File > New Level > Empty Level**, puis on l'enregistre avec **Ctrl+S** dans un dossier **Maps** (rangé sous Content > NomDuProjet) ; on peut le définir comme niveau par défaut dans **Maps & Modes**. Pour l'éclairage de base, l'**Environment Light Mixer** (menu **Window**) crée en un panneau les composants d'ambiance : **Sky Light**, **Sky Atmosphere**, **Directional Light** et **Volumetric Clouds**, évitant de tout poser à la main. Deux options améliorent le rendu : **Real Time Capture** sur la Sky Light et **Volumetric Fog** sur l'**Exponential Height Fog**. On range ensuite ces éléments dans un dossier **Lights** de l'Outliner.",
        "keypoints": [
          "**File > New Level > Empty Level**, puis Ctrl+S dans un dossier **Maps**",
          "**Environment Light Mixer** : Sky Light, Atmosphere, Directional, Clouds",
          "Cocher **Real Time Capture** (Sky Light) et **Volumetric Fog**",
          "Regrouper l'éclairage dans un dossier Outliner \"Lights\""
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Créer un niveau et poser son éclairage"
      },
      {
        "title": "Les modes de l'éditeur (Modeling, CubeGrid...)",
        "body": "L'éditeur propose plusieurs **modes** spécialisés (sélecteur en haut à gauche du Level Editor). Le mode **Selection** est le mode par défaut où l'on passe 90 % du temps pour manipuler les Actors. Les autres : **Landscape** (paysages/terrains), **Foliage** (peindre du feuillage), **Mesh Paint** (peindre vertex/couleurs), **Modeling** (édition de mesh dans Unreal), **Fracture** (objets destructibles), **Brush Editing** (géométries), **Animation**. En mode **Modeling**, l'outil **CubeGrid** (section Create) permet de bloquer très vite des volumes : clic-glisser pour la grille, puis **Ctrl+glisser** pour tirer (**pull**) ou creuser (**push**) — sans oublier de cliquer sur **Accept**.",
        "keypoints": [
          "**Selection** = mode par défaut (manipuler les Actors)",
          "Modes : **Landscape**, **Foliage**, **Modeling**, **Fracture**...",
          "**Modeling > CubeGrid** : blockout rapide de volumes",
          "Pull/Push avec **Ctrl+glisser**, puis **Accept**"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Les modes de l'éditeur et le CubeGrid"
      },
      {
        "title": "Content Browser, Content Drawer et gestion des assets",
        "body": "Le **Content Browser** est la zone centrale pour créer, importer, organiser et gérer les ressources du projet, avec recherche par texte et filtres par type. Le **Content Drawer** en est une instance spéciale : on l'ouvre avec **Ctrl+Espace** (ou son bouton en bas), il se **réduit automatiquement** quand il perd le focus, et **Dock in Layout** le fixe. Bonnes pratiques : créer un dossier au nom du projet, colorer les dossiers (clic droit > **Set Color**), et réserver un **Developer folder** aux expérimentations — ce dossier doit être **exclu du packaging** et jamais référencé par le contenu de production. On importe via le bouton **Add/Import** et on transfère des assets entre projets avec **Migrate** (qui embarque les dépendances).",
        "keypoints": [
          "**Content Browser** : créer, importer, organiser, filtrer les assets",
          "**Content Drawer** : **Ctrl+Espace**, se réduit hors focus ; Dock in Layout",
          "Organiser : dossier projet, **Set Color** ; **Developer folder** hors packaging",
          "**Migrate** : copier des assets ET leurs dépendances"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Content Browser, Content Drawer et assets"
      },
      {
        "title": "Actors et Place Actors",
        "body": "Un **Actor** est tout élément que l'on peut placer dans un niveau (Mesh, Lights, Volumes, Trigger, Fog, Post Process Volume...) : c'est l'équivalent des **GameObjects** d'Unity. Le panneau **Place Actors** sert à glisser-déposer ces Actors dans la scène ; on peut aussi les déposer directement depuis le **Content Drawer** ou le pont **Quixel Bridge**. Une fois placé, on affine ses valeurs dans le **Details panel** (position/rotation/scale bien plus précises qu'à la souris, et copier-coller d'un bloc de transform entier). Astuces : **Alt + déplacement** duplique l'objet ; **Maj + déplacement** fait suivre la caméra.",
        "keypoints": [
          "**Actor** = élément placé dans le niveau (≈ **GameObject** Unity)",
          "**Place Actors** : glisser-déposer Character, Lights, Volumes...",
          "**Details** : transform précis + copier-coller d'un bloc entier",
          "**Alt+glisser** = dupliquer ; **Maj+glisser** = la caméra suit"
        ],
        "versionNote": "En UE 5.4 Quixel Bridge (Megascans) est un plugin intégré ; depuis fin 2024 son contenu est distribué via Fab.",
        "tier": 1,
        "front": "Qu'est-ce qu'un Actor ? Le placer dans le niveau"
      }
    ],
    "quiz": [
      {
        "q": "Selon le cours, quel est le rôle d'un moteur de jeu ?",
        "choices": [
          "Dessiner uniquement les modèles 3D et animations du jeu",
          "Écrire seulement le code réseau et les serveurs en ligne",
          "Gérer objets, niveaux, rendu et IA pour le gameplay",
          "Produire la musique et les dialogues de l'aventure"
        ],
        "answer": 2,
        "explain": "Un moteur de jeu regroupe des modules et interfaces (objets, niveaux, rendu, mise à jour des positions, comportement des PNJ) afin que l'équipe se concentre sur le gameplay plutôt que sur la technique.",
        "difficulty": "facile",
        "topic": "moteur de jeu (définition)",
        "def": {
          "term": "Moteur de jeu",
          "text": "Logiciel réunissant les briques techniques (rendu, physique, audio, script, gestion des niveaux) sur lesquelles une équipe construit son jeu."
        }
      },
      {
        "q": "Qui développe Unreal Engine et quels sont ses concurrents cités ?",
        "choices": [
          "Epic Games ; concurrents : Unity, CryEngine, Godot",
          "Unity Technologies ; concurrents : Unreal et CryEngine",
          "Crytek ; concurrents : Unity, Godot, Unreal",
          "Valve ; concurrents : Unity, CryEngine, Source"
        ],
        "answer": 0,
        "explain": "Unreal Engine est un moteur propriétaire d'Epic Games ; le cours cite comme principaux concurrents Unity, CryEngine (Crytek) et Godot.",
        "difficulty": "facile",
        "topic": "Unreal Engine / Epic Games",
        "def": {
          "term": "Moteur propriétaire",
          "text": "Moteur dont le code appartient à un éditeur unique et s'emploie sous licence, par opposition à un moteur libre et open source comme Godot."
        }
      },
      {
        "q": "Quelles sont les deux façons de programmer dans Unreal Engine ?",
        "choices": [
          "C# combiné à un langage visuel par nœuds",
          "Python et Lua chargés via un plugin externe",
          "JavaScript et un éditeur visuel de nœuds maison",
          "C++ et Blueprint, un langage visuel par nœuds"
        ],
        "answer": 3,
        "explain": "Unreal propose le C++ (performant à l'exécution) et le Blueprint, un langage de programmation visuel par nœuds accessible aux non-codeurs.",
        "difficulty": "facile",
        "topic": "langages C++ et Blueprint",
        "def": {
          "term": "Blueprint",
          "text": "Système de script visuel d'Unreal : on relie des nœuds au lieu d'écrire du code texte ; accessible aux non-programmeurs et compilé en interne."
        }
      },
      {
        "q": "D'après le comparatif du cours, sur quoi Unity se démarque-t-il d'Unreal ?",
        "choices": [
          "La qualité du rendu et la performance native du C++",
          "Simplicité de prise en main et compilation rapide",
          "La maturité du moteur réseau et du multijoueur",
          "Les outils complets d'édition de mesh et animation"
        ],
        "answer": 1,
        "explain": "Le cours note qu'Unity se démarque par sa simplicité, sa rapidité de compilation, ses outils 2D et ses exports mobiles plus légers, tandis qu'Unreal excelle sur le rendu, le réseau et le C++.",
        "difficulty": "moyen",
        "topic": "comparatif Unity / Unreal",
        "def": {
          "term": "Moteur réseau (netcode)",
          "text": "Systèmes qui synchronisent les joueurs d'une même partie en ligne ; leur maturité est un point fort historique d'Unreal face à Unity."
        }
      },
      {
        "q": "Dans l'Epic Games Launcher, où installe-t-on une version du moteur ?",
        "choices": [
          "Onglet Marché, via le bouton Télécharger",
          "Onglet Actus, via le lien Installer",
          "Onglet Bibliothèque, via le bouton +",
          "Onglet Apprendre, via un exemple"
        ],
        "answer": 2,
        "explain": "L'onglet Bibliothèque sert à installer les différentes versions du moteur (bouton +) et à relancer rapidement vos projets ; le Marché est l'équivalent de l'Asset Store.",
        "difficulty": "facile",
        "topic": "onglet Bibliothèque et versions du moteur",
        "def": {
          "term": "Epic Games Launcher",
          "text": "Application d'Epic pour installer les versions d'Unreal, lancer ses projets et accéder au catalogue d'assets (Marketplace, puis Fab)."
        }
      },
      {
        "q": "Que peut-on dire des templates de projet dans Unreal ?",
        "choices": [
          "Ils s'ajoutent à tout moment de la vie du projet",
          "Ils sont définitivement figés dès la création du projet",
          "Un seul template est autorisé par version installée",
          "Ils ne fonctionnent qu'en C++, pas en Blueprint"
        ],
        "answer": 0,
        "explain": "Le cours précise qu'on peut commencer avec un projet vide et y intégrer plus tard des templates (FPS, TPS...) : ils sont ajoutables à tout moment.",
        "difficulty": "moyen",
        "topic": "templates de projet",
        "def": {
          "term": "Template de projet",
          "text": "Projet de départ pré-configuré (First Person, Third Person, vide...) fournissant assets et logique de base pour démarrer un projet plus vite."
        }
      },
      {
        "q": "Quel panneau affiche les propriétés (transform, mesh, matériau, physique) de l'Actor sélectionné ?",
        "choices": [
          "L'Outliner de la hiérarchie",
          "Le Content Browser du projet",
          "La Main Toolbar de l'éditeur",
          "Le Details panel de l'Actor"
        ],
        "answer": 3,
        "explain": "Le Details panel s'affiche quand on sélectionne un Actor et présente ses propriétés ; il change selon l'élément sélectionné dans le viewport.",
        "difficulty": "facile",
        "topic": "Details panel",
        "def": {
          "term": "Details panel",
          "text": "Panneau affichant et permettant d'éditer les propriétés (transform, composants, matériaux, physique) de l'élément actuellement sélectionné."
        }
      },
      {
        "q": "Quel panneau affiche l'arborescence hiérarchique de tout le contenu du niveau ?",
        "choices": [
          "Le Details panel de droite",
          "L'Outliner de la scène 3D",
          "La Bottom Toolbar en bas",
          "La Viewport Toolbar du haut"
        ],
        "answer": 1,
        "explain": "L'Outliner présente sous forme d'arbre tous les Actors du niveau ; il correspond à la Hierarchy d'Unity.",
        "difficulty": "facile",
        "topic": "Outliner",
        "def": {
          "term": "Outliner",
          "text": "Panneau listant sous forme d'arbre tous les Actors présents dans le niveau ; il correspond à la fenêtre Hierarchy d'Unity."
        }
      },
      {
        "q": "Quel est le raccourci pour ouvrir le Content Drawer sous Windows ?",
        "choices": [
          "Ctrl + B comme Browser",
          "Alt + C du clavier",
          "Ctrl + Espace (Space)",
          "Maj + Entrée pressé"
        ],
        "answer": 2,
        "explain": "Le Content Drawer s'ouvre avec Ctrl+Espace (Cmd+Espace sur macOS) ou via son bouton dans la barre inférieure.",
        "difficulty": "moyen",
        "topic": "Content Browser / Content Drawer",
        "def": {
          "term": "Content Drawer",
          "text": "Tiroir escamotable donnant un accès rapide au Content Browser ; il se referme dès qu'il perd le focus, sauf s'il est ancré au layout."
        }
      },
      {
        "q": "Quelle touche recentre (focus) la caméra du viewport sur l'objet sélectionné ?",
        "choices": [
          "La touche F",
          "La touche C",
          "La touche Z",
          "La touche Tab"
        ],
        "answer": 0,
        "explain": "Comme dans Unity, la touche F fait le focus de la caméra sur l'objet sélectionné, ce qui permet ensuite d'orbiter autour.",
        "difficulty": "facile",
        "topic": "focus caméra (F) et orbite",
        "def": {
          "term": "Focus caméra",
          "text": "Recadrage de la vue du viewport pour centrer l'objet sélectionné, qui sert ensuite de pivot pour orbiter autour de lui."
        }
      },
      {
        "q": "Quels sont les raccourcis par défaut des outils de transformation dans UE 5.4 ?",
        "choices": [
          "Q = Move, W = Rotate, E = Scale",
          "M = Move, R = Rotate, S = Scale",
          "1 = Move, 2 = Rotate, 3 = Scale",
          "W = Move, E = Rotate, R = Scale"
        ],
        "answer": 3,
        "explain": "Par défaut dans UE5, W active Move (déplacer), E active Rotate (pivoter) et R active Scale (échelle) ; la barre d'espace fait défiler ces outils.",
        "difficulty": "moyen",
        "topic": "outils de transformation (Move/Rotate/Scale)",
        "def": {
          "term": "Gizmo de transformation",
          "text": "Poignées 3D pour déplacer, pivoter ou redimensionner un Actor selon les axes X, Y et Z, en repère World (monde) ou Local (objet)."
        }
      },
      {
        "q": "Quel raccourci active le mode d'affichage Wireframe (filaire) dans le viewport UE 5.4 ?",
        "choices": [
          "Alt + 1",
          "Alt + 2",
          "Ctrl + W",
          "Alt + 4"
        ],
        "answer": 1,
        "explain": "Dans UE5, les modes d'affichage s'obtiennent par Alt+chiffre : Wireframe = Alt+2, Unlit = Alt+3, Lit = Alt+4.",
        "difficulty": "moyen",
        "topic": "modes d'affichage (Lit, Unlit, Wireframe)",
        "def": {
          "term": "Mode d'affichage Wireframe",
          "text": "Vue filaire ne montrant que les arêtes des maillages, sans surfaces ni éclairage ; pratique pour inspecter la topologie d'une scène."
        }
      },
      {
        "q": "Où modifie-t-on les préférences propres à l'éditeur (raccourcis clavier, navigation) ?",
        "choices": [
          "Edit > Project Settings",
          "Window > World Settings",
          "Edit > Editor Preferences",
          "File > Package Project (build)"
        ],
        "answer": 2,
        "explain": "Edit > Editor Preferences ouvre les réglages de l'éditeur (Keyboard Shortcuts, Loading & Saving...) ; une barre de recherche aide à trouver une préférence précise.",
        "difficulty": "facile",
        "topic": "Editor Preferences",
        "def": {
          "term": "Editor Preferences",
          "text": "Réglages qui ne concernent que votre éditeur local (raccourcis, navigation, sauvegarde) et non le contenu du projet partagé en équipe."
        }
      },
      {
        "q": "Pendant un Play In Editor, à quoi sert la touche F8 ?",
        "choices": [
          "Se détacher (Eject) pour éditer des Actors",
          "Quitter aussitôt le mode Play In Editor",
          "Sauvegarder le niveau courant en pleine partie",
          "Recompiler tous les Blueprints du projet"
        ],
        "answer": 0,
        "explain": "F8 éjecte le contrôleur (Eject/Possess) : on peut alors voler dans la scène, sélectionner des Actors et les modifier dans le Details panel, avant de reprendre la main via Possess.",
        "difficulty": "moyen",
        "topic": "F8 Eject / Possess",
        "def": {
          "term": "Eject / Possess",
          "text": "Pendant un test, Eject détache la caméra du personnage pour voler librement et éditer la scène ; Possess redonne le contrôle du pion."
        }
      },
      {
        "q": "Comment conserver les modifications faites sur un Actor pendant le mode play ?",
        "choices": [
          "Rien, elles sont conservées automatiquement à l'arrêt",
          "Faire Ctrl+S en pleine partie pour les figer",
          "Relancer le mode Play une deuxième fois de suite",
          "Éjecter puis clic droit > Keep Simulation Changes"
        ],
        "answer": 3,
        "explain": "Par défaut les changements en play sont annulés à l'arrêt ; Keep Simulation Changes (raccourci K, après un clic droit sur l'Actor éjecté) permet de les conserver.",
        "difficulty": "difficile",
        "topic": "Keep Simulation Changes",
        "def": {
          "term": "Keep Simulation Changes",
          "text": "Commande reportant dans l'éditeur les modifications faites sur un Actor pendant le test, alors qu'elles seraient sinon annulées à l'arrêt."
        }
      },
      {
        "q": "Que sont les Project Settings et quelle est leur portée ?",
        "choices": [
          "Des réglages limités à l'apparence de votre éditeur local",
          "Des options valables pour tout le projet (6 catégories)",
          "Les paramètres du seul Actor sélectionné à l'écran",
          "Le journal listant les erreurs de compilation"
        ],
        "answer": 1,
        "explain": "Les Project Settings s'appliquent à l'ensemble du projet (comportement du moteur, plateformes...) et comptent 6 catégories : Projet, Jeu, Moteur, Éditeur, Plateformes, Plugins.",
        "difficulty": "moyen",
        "topic": "Project Settings",
        "def": {
          "term": "Portée d'un réglage",
          "text": "Un réglage peut être global (Project Settings, versionné avec le projet et partagé) ou local (Editor Preferences, propre à votre poste)."
        }
      },
      {
        "q": "Où définit-on le niveau de démarrage de l'éditeur et le niveau par défaut du jeu ?",
        "choices": [
          "Editor Preferences > Privacy",
          "Window > Environment Light Mixer",
          "Project Settings > Maps & Modes",
          "Bottom Toolbar > Output Log"
        ],
        "answer": 2,
        "explain": "La section Maps & Modes des Project Settings permet de définir la map de démarrage de l'éditeur et la map par défaut au lancement du jeu.",
        "difficulty": "moyen",
        "topic": "Maps & Modes",
        "def": {
          "term": "Maps & Modes",
          "text": "Section des Project Settings fixant la carte ouverte au démarrage de l'éditeur, la carte par défaut du jeu et le GameMode associé."
        }
      },
      {
        "q": "Comment crée-t-on un niveau vide et le range-t-on correctement ?",
        "choices": [
          "File > New Level > Empty Level, puis Ctrl+S dans Maps",
          "Clic droit dans l'Outliner puis choisir Nouveau niveau",
          "Alt+P pour lancer le jeu, puis Enregistrer sous",
          "Window > New Level avec enregistrement automatique"
        ],
        "answer": 0,
        "explain": "On utilise File > New Level > Empty Level, puis Ctrl+S pour l'enregistrer dans un dossier Maps (rangé sous Content), et on peut le définir par défaut dans Maps & Modes.",
        "difficulty": "moyen",
        "topic": "création d'un niveau (New Level / Empty Level)",
        "def": {
          "term": "Niveau (Level / Map)",
          "text": "Fichier .umap contenant une scène : Actors, éclairage et géométrie d'un environnement de jeu que le joueur va parcourir."
        }
      },
      {
        "q": "Quel outil permet de créer rapidement l'éclairage d'ambiance (Sky Light, Sky Atmosphere, Directional Light, Volumetric Clouds) depuis un seul panneau ?",
        "choices": [
          "Le Content Drawer du Content Browser",
          "Le Sequencer pour les animations",
          "Le mode Fracture des objets cassables",
          "L'Environment Light Mixer (Window)"
        ],
        "answer": 3,
        "explain": "L'Environment Light Mixer (menu Window) crée et édite en un seul panneau les composants d'ambiance : Sky Light, Sky Atmosphere, jusqu'à deux Directional Lights et les Volumetric Clouds.",
        "difficulty": "moyen",
        "topic": "éclairage / Environment Light Mixer",
        "def": {
          "term": "Environment Light Mixer",
          "text": "Panneau regroupant la création et le réglage des lumières d'ambiance d'un ciel : Sky Light, Sky Atmosphere, Directional Light et nuages."
        }
      },
      {
        "q": "Quelles deux options le cours recommande-t-il de cocher pour améliorer le rendu d'un niveau ?",
        "choices": [
          "Nanite sur chaque mesh et Lumen sur la caméra active",
          "Real Time Capture (Sky Light) et Volumetric Fog",
          "Ray Tracing et DLSS activés dans Project Settings",
          "Auto Exposure et Motion Blur sur le Post Process"
        ],
        "answer": 1,
        "explain": "Le cours indique de cocher Real Time Capture dans la Sky Light et Volumetric Fog dans l'Exponential Height Fog pour un meilleur rendu.",
        "difficulty": "difficile",
        "topic": "Sky Light Real Time Capture / Volumetric Fog",
        "def": {
          "term": "Éclairage d'ambiance",
          "text": "Lumière indirecte et diffuse qui remplit une scène (ciel, brouillard) ; bien réglée, elle apporte réalisme et profondeur à un niveau."
        }
      },
      {
        "q": "Parmi les modes de l'éditeur, lequel est le mode par défaut où l'on passe l'essentiel du temps ?",
        "choices": [
          "Foliage (le feuillage)",
          "Fracture (destruction)",
          "Selection (Sélection)",
          "Landscape (le terrain)"
        ],
        "answer": 2,
        "explain": "Le mode Selection est le mode par défaut (utilisé ~90 % du temps) pour manipuler les Actors ; les autres (Landscape, Foliage, Mesh Paint, Modeling, Fracture, Brush Editing, Animation) sont spécialisés.",
        "difficulty": "facile",
        "topic": "les modes de l'éditeur",
        "def": {
          "term": "Modes de l'éditeur",
          "text": "Jeux d'outils spécialisés du Level Editor (Selection, Landscape, Foliage, Modeling, Fracture...) que l'on active selon la tâche en cours."
        }
      },
      {
        "q": "En mode Modeling, à quoi sert principalement l'outil CubeGrid ?",
        "choices": [
          "Bloquer vite des volumes (blockout) avec pull/push",
          "Peindre rapidement du feuillage sur le sol",
          "Compiler tous les Blueprints du niveau ouvert",
          "Importer des assets depuis le catalogue en ligne Fab"
        ],
        "answer": 0,
        "explain": "CubeGrid (section Create du mode Modeling) crée des volumes basiques très vite : clic-glisser pour la grille, Ctrl+glisser pour tirer (pull) ou creuser (push), puis Accept pour valider.",
        "difficulty": "moyen",
        "topic": "Modeling Mode / CubeGrid",
        "def": {
          "term": "CubeGrid (Modeling)",
          "text": "Outil de blockout du mode Modeling : on trace puis on extrude ou creuse des volumes calés sur une grille pour poser vite les masses d'un niveau."
        }
      },
      {
        "q": "Que fait la fonction Migrate d'un dossier du Content Browser ?",
        "choices": [
          "Supprimer définitivement les assets du disque dur local",
          "Convertir un projet Blueprint en projet C++ complet",
          "Publier les assets sélectionnés sur le Marketplace",
          "Copier des assets et leurs dépendances vers un projet"
        ],
        "answer": 3,
        "explain": "Clic droit > Migrate permet de transférer des assets et toutes leurs dépendances vers le dossier content d'un autre projet Unreal.",
        "difficulty": "moyen",
        "topic": "Migrate (migration d'assets)",
        "def": {
          "term": "Dépendances d'un asset",
          "text": "Autres ressources dont un asset a besoin pour fonctionner (matériaux, textures, meshes) ; il faut les emporter avec lui lors d'un transfert."
        }
      },
      {
        "q": "Dans Unreal, un Actor correspond à quel concept d'Unity, et comment le place-t-on ?",
        "choices": [
          "À un Component ; on l'ajoute uniquement par du C++",
          "À un GameObject ; on le place en glisser-déposer",
          "À une Scene ; on la règle via les Project Settings",
          "À un Prefab ; on le pose seulement en mode play"
        ],
        "answer": 1,
        "explain": "Un Actor (Mesh, Light, Volume, Trigger...) est l'équivalent d'un GameObject Unity ; on le place par glisser-déposer depuis le panneau Place Actors ou le Content Drawer.",
        "difficulty": "facile",
        "topic": "Actor (équivalent GameObject) / Place Actors",
        "def": {
          "term": "Actor",
          "text": "Objet de base plaçable dans un niveau Unreal : il possède un Transform et peut contenir des composants (mesh, lumière, collision, script)."
        }
      }
    ],
    "sources": [
      {
        "label": "Unreal Editor Interface — Documentation officielle UE",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/unreal-editor-interface"
      },
      {
        "label": "Viewport Controls in Unreal Engine — Documentation officielle UE",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/viewport-controls-in-unreal-engine"
      },
      {
        "label": "Content Browser in Unreal Engine — Documentation officielle UE",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/content-browser-in-unreal-engine"
      },
      {
        "label": "Level Editor Modes in Unreal Engine — Documentation officielle UE",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/level-editor-modes-in-unreal-engine"
      },
      {
        "label": "Environmental Light with Fog, Clouds, Sky and Atmosphere — Documentation officielle UE",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/environmental-light-with-fog-clouds-sky-and-atmosphere-in-unreal-engine"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/k-zMkzmduqI/hqdefault.jpg",
        "caption": "Miniature du cours pour débutants « UE5 Starter Course » : installation, navigation dans le viewport et prise en main de l'éditeur.",
        "credit": "Unreal Sensei (YouTube)",
        "link": "https://www.youtube.com/watch?v=k-zMkzmduqI"
      },
      {
        "url": "https://upload.wikimedia.org/wikipedia/commons/e/e3/Ue_ss.png",
        "caption": "Vue d'ensemble de l'interface de l'éditeur Unreal (viewport, panneaux, barre d'outils) — schéma conceptuel de l'agencement de l'éditeur.",
        "credit": "Kuldhi, Wikimedia Commons (CC BY-SA 4.0)",
        "link": "https://commons.wikimedia.org/wiki/File:Ue_ss.png"
      }
    ],
    "links": [
      {
        "label": "Doc officielle Epic — Comprendre les bases d'Unreal Engine (éditeur, Content Browser, Actors)",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/understanding-the-basics-of-unreal-engine?lang=en-US",
        "kind": "doc"
      },
      {
        "label": "Doc officielle Epic — Placer des Actors dans un niveau (les 4 méthodes de placement)",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/placing-actors-in-unreal-engine?lang=en-US",
        "kind": "doc"
      },
      {
        "label": "Vidéo YouTube — Unreal Engine 5 Beginner Tutorial : UE5 Starter Course (Unreal Sensei)",
        "url": "https://www.youtube.com/watch?v=k-zMkzmduqI",
        "kind": "youtube"
      },
      {
        "label": "Forum Epic (tuto communautaire) — Navigation dans le viewport UE5 : astuces et raccourcis",
        "url": "https://forums.unrealengine.com/t/community-tutorial-unreal-engine-5-viewport-navigation-i-useful-tips-and-shortcuts/1788865",
        "kind": "forum"
      }
    ]
  },
  {
    "id": "bp-bases",
    "num": "02",
    "special": false,
    "title": "Blueprint — Les bases",
    "summary": "Chapitre d'introduction aux Blueprints d'Unreal Engine 5.4 : le visual scripting et sa comparaison avec le C++, les types de Blueprint (Level, Class/Actor, Animation, Widget), l'héritage et les classes principales du Game Framework (Object, Actor, Component, Pawn, Character, Controllers, GameMode, GameInstance). Il détaille l'éditeur Blueprint (panneaux, onglets, compilation, Construction Script), l'Event Graph et ses nodes, la distinction pins d'exécution / pins de données, les events (BeginPlay, Tick, Overlap), les variables typées et leur code couleur, GET/SET, les opérateurs et comparaisons, la manipulation de Strings, les tableaux et boucles, les nodes de contrôle de flux (Branch, Switch, Gate, FlipFlop, DoOnce/DoN, Sequence) et enfin le Cast et la validation d'objets.",
    "topics": [
      "Visual scripting / définition Blueprint",
      "Blueprint vs C++",
      "Types de Blueprint (Level, Class, Animation, Widget)",
      "Héritage",
      "Classes principales (Object, Actor, Component)",
      "Game Framework (GameMode, GameInstance, Pawn, Character, Controllers)",
      "Éditeur Blueprint (panneaux & onglets)",
      "Compilation",
      "Construction Script",
      "Event Graph & nodes",
      "Pins d'exécution vs pins de données",
      "Events (BeginPlay, Tick, Overlap)",
      "Commentaires",
      "Variables & types",
      "Code couleur des types",
      "GET / SET",
      "Panneau Détails d'une variable",
      "Conventions de nommage",
      "Opérateurs & comparaisons",
      "Manipulation de Strings",
      "Tableaux (Arrays)",
      "Boucles (For, ForEach)",
      "Contrôle de flux (Branch, Switch, Gate, FlipFlop, DoOnce, DoN, Sequence)",
      "Cast & validation (Is Valid, Get Class)"
    ],
    "fiches": [
      {
        "title": "Qu'est-ce qu'un Blueprint ? (visual scripting) & BP vs C++",
        "body": "Un **Blueprint** est un outil de **code visuel** (visual scripting) d'Unreal Engine : chaque action est représentée par un **bloc (node / nœud)** que l'on relie à d'autres par des **connexions (wires)**. Ces connexions représentent le **cheminement de la logique** exécutée par le moteur. Les Blueprints permettent de créer des événements de gameplay (missions, inventaire, ascenseurs...) sans nécessiter de connaissances approfondies en programmation. C'est un excellent outil de **prototypage**, rapide et simple d'accès. Contrairement au C++, pas besoin de recompiler (build) tout le projet avant de jouer : il suffit de **compiler le seul Blueprint modifié** (très rapide, comme dans Unity). Le langage Blueprint est **typé** et **orienté objet**, basé sur du C++, mais **moins performant** que du C++ pur ; sur des logiques complexes il peut vite devenir un « spaghetti » visuel confus. Les deux approches sont **complémentaires** : on utilise le meilleur des deux mondes à bon escient.",
        "keypoints": [
          "**Blueprint** = code visuel : actions = **nodes** reliés par des connexions",
          "Sert au gameplay et au **prototypage** rapide, sans savoir coder",
          "On compile **seulement le BP modifié** (pas tout le projet)",
          "Typé, orienté objet, basé C++ mais moins performant ; complémentaires"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Qu'est-ce qu'un Blueprint ? BP vs C++"
      },
      {
        "title": "Les différents types de Blueprint",
        "body": "Unreal propose plusieurs types de Blueprint. Le **Level Blueprint** est intégré à un niveau donné : il gère les événements et actions spécifiques à ce niveau (ex : cinématiques) et n'est **pas instanciable** (level scripting). Les **Blueprint Classes** (souvent appelées Actor Blueprint par abus de langage) sont **instanciables au runtime** — l'équivalent d'un **prefab** — et réutilisables dans n'importe quel niveau. L'**Animation Blueprint** est spécifique à la mise en place d'animations (state machine, transitions, blending). Le **Widget Blueprint** sert à créer les interfaces (GUI, HUD du joueur). Point important : l'**interface de l'éditeur** est **identique** entre un Level Blueprint et une class Blueprint.",
        "keypoints": [
          "**Level Blueprint** : lié à un niveau, non instanciable (cinématiques)",
          "**Blueprint Class** (Actor BP) : instanciable, réutilisable = **prefab**",
          "**Animation Blueprint** : state machine, transitions, blending",
          "**Widget Blueprint** : UI, HUD, menus (**WBP_**)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Les différents types de Blueprint"
      },
      {
        "title": "Level Blueprint vs Blueprint Class & héritage",
        "body": "Un **Level Blueprint** appartient à un niveau et sert à définir des événements/actions propres à ce niveau ; il peut interagir avec les Actor Blueprints présents (les éléments du niveau). Une **Blueprint Class** définit les **données et le comportement** d'un type d'objet ; elle peut être basée sur une **classe C++** ou sur une **autre classe Blueprint**. La notion d'**héritage** est fondamentale dans le framework Unreal (qui s'appuie aussi beaucoup sur la **composition** via les components). Lors de la création d'une classe Blueprint, on choisit une **classe parente**. Un enfant hérite des variables et méthodes du parent et peut en ajouter : ex. **BP_Car** hérite de **BP_Vehicle** — elle possède couleur / vitesse / roues du parent, plus une variable **autoRadio** propre ; on peut ensuite créer **BP_Batmobile** qui hérite de BP_Car. L'héritage peut être **BP → BP**, **C++ → C++** ou **BP → C++**.",
        "keypoints": [
          "**Level BP** = script d'un niveau ; **BP Class** = type d'objet réutilisable",
          "Une BP Class hérite d'une classe **C++** ou d'une autre **BP**",
          "L'enfant hérite variables/méthodes du parent et en ajoute",
          "Framework Unreal = **héritage** ET **composition** (components)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Blueprint Class, classe parente et héritage"
      },
      {
        "title": "Les classes principales : Object, Actor, Component",
        "body": "Toutes les classes descendent de la classe racine **Object**. **Actor** est la classe de base des objets qui peuvent être **placés ou spawnés** dans un niveau (joueurs, armes, pickups). **ActorComponent** est la classe de base des composants (comportements réutilisables ajoutés à un Actor) ; ils **n'ont pas de transform** (aucune position/rotation dans le monde) et servent aux comportements abstraits (mouvement, inventaire, gestion d'attributs). Le **SceneComponent** (enfant d'ActorComponent) prend en charge les comportements **basés sur l'emplacement** sans représentation géométrique (caméras, spring arms/bras à ressort, forces et contraintes physiques, audio). Le **PrimitiveComponent** est un SceneComponent avec **représentation géométrique** (static/skeletal mesh, sprites, panneaux, systèmes de particules, volumes de collision box/capsule/sphere) — utilisé pour le rendu et les collisions. Règle clé : chaque Actor est un Object, mais **tous les Objects ne sont pas des Actors** (un ActorComponent est un Object mais pas un Actor, il ne peut pas être placé seul dans le monde).",
        "keypoints": [
          "**Object** = base de tout ; **Actor** = objet plaçable/spawnable",
          "**ActorComponent** : comportement réutilisable, SANS transform",
          "**SceneComponent** : emplacement sans géométrie (caméra, spring arm)",
          "**PrimitiveComponent** : SceneComponent AVEC géométrie (mesh, collisions)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Object, Actor, Component : la hiérarchie de base"
      },
      {
        "title": "Le Game Framework (GameMode, GameInstance, Pawn, Character, Controllers)",
        "body": "Le Game Framework s'appuie sur des classes clés. **GameInstance** : stocke les informations persistantes ; son état **n'est PAS réinitialisé** au changement de niveau ou de mode (idéal pour ce qui doit survivre entre niveaux et matchs, ex. le vaisseau choisi au menu). **GameMode** : définit les **règles du jeu**, les conditions de victoire, le pawn/Character par défaut ; il n'existe **que sur le serveur** et ne doit pas stocker de données transitoires. Chaque niveau peut avoir son propre GameMode (via **GameMode Override** dans le World Settings, sinon celui défini pour le projet dans Maps & Modes). **Pawn** : classe de base des acteurs contrôlables par un joueur ou une IA — représentation physique dans le monde. **Character** : sous-classe de **Pawn** déjà configurée (capsule de collision, mesh, composant **CharacterMovement**, mouvement bipède walk/jump/swim). **PlayerController** : interface entre le joueur humain et le **Pawn** ; il reçoit les inputs et pilote le Pawn possédé (un Pawn/Character ne reçoit d'inputs que s'il est possédé). **PlayerState** (nom, score, inventaire d'un participant) et **GameState** (état global : joueurs connectés, scores) gèrent l'état, notamment en réseau.",
        "keypoints": [
          "**GameInstance** : données persistantes, non reset entre niveaux",
          "**GameMode** : règles du jeu, pawn par défaut ; serveur seulement",
          "**Pawn** : entité contrôlable ; **Character** = Pawn préconfiguré (CharacterMovement)",
          "**PlayerController** : relie joueur et Pawn, transmet les inputs"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Le Game Framework : GameMode, GameInstance, Pawn..."
      },
      {
        "title": "L'éditeur Blueprint : panneaux, onglets, compilation & Construction Script",
        "body": "On ouvre l'éditeur Blueprint via le bouton **Blueprint** du panneau Details, ou en double-cliquant l'asset dans le **Content Drawer** (raccourci **Ctrl+E** pour éditer, **Ctrl+B** pour localiser dans le Content Browser). Les parties principales : la **Toolbar** (Save, Browse, **Compile**, Diff, Find/Rechercher, **Hide Unrelated**, **Class Settings**, **Class Defaults**), le **Components panel** (bouton **Add Component**, hiérarchie parent/enfant importante pour les transforms), le panneau **My Blueprint** (fonctions & graphs, macros, variables, events) et le panneau **Details** (réglage des variables et propriétés, avec zone de recherche). Un Blueprint d'acteur possède aussi trois onglets/graphes : le **Viewport** (équivalent de la scène propre à l'objet : représentation visuelle des components, manipulables avec les widgets de transformation), le **Construction Script** (constructeur visuel) et l'**Event Graph** (script visuel du comportement, équivalent d'une fonction C++). Le **Construction Script** est une fonction spéciale exécutée quand l'acteur est **ajouté au niveau**, quand ses **propriétés sont modifiées**, ou quand il est **créé au runtime** — mais **PAS** au démarrage du jeu pour les acteurs **déjà placés** dans le niveau. La **compilation** (bouton Compile) **valide le code et applique les modifications** ; elle est notamment nécessaire pour pouvoir **affecter les valeurs par défaut**. Ne pas oublier de **compiler puis sauvegarder**.",
        "keypoints": [
          "Ouvrir : double-clic / **Ctrl+E** ; panneaux My Blueprint, Details, Components",
          "Onglets : **Viewport**, **Construction Script**, **Event Graph**",
          "**Construction Script** : exécuté à l'ajout/spawn, pas pour acteurs déjà placés",
          "**Compile** valide et applique les changements (requis pour valeurs par défaut)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "L'éditeur Blueprint et le Construction Script"
      },
      {
        "title": "L'Event Graph, les nodes, le menu contextuel & les commentaires",
        "body": "L'**Event Graph** est l'endroit où l'on code le comportement d'une classe Blueprint (la logique de jeu de ses instances). Il contient des **événements** et des **actions** représentés par un graphe de **nœuds (nodes)**. Les nodes représentent des **variables, opérateurs, fonctions et événements**. Pour ajouter un node, on ouvre le **menu contextuel** : soit par **clic droit** dans une zone vide du graphe, soit en **tirant un fil** depuis une pin d'un node puis en relâchant le bouton. En haut de ce menu, la case **Context Sensitive** filtre la liste selon le contexte courant : la classe Blueprint actuelle (si clic droit dans le graphe) ou le **type de la pin** (si on a tiré un fil). Le panneau **Palette** (Window > Palette) liste **tous** les nodes disponibles et propose une section **Favoris** (clic droit > Ajouter aux favoris). Comme tout langage, l'Event Graph permet d'ajouter des **commentaires** : le raccourci **touche C** crée un **bloc de commentaire** englobant les nodes sélectionnés ; le panneau **Details** permet d'en **changer la couleur** et de garder le texte **visible même dézoomé**. Il existe aussi des commentaires **individuels** dédiés à un seul node.",
        "keypoints": [
          "**Event Graph** = logique/comportement des instances de la classe",
          "**Nodes** = variables, opérateurs, fonctions, événements",
          "Ajouter un node : clic droit, ou tirer un fil depuis une **pin**",
          "**Context Sensitive** filtre la liste ; commentaire = touche **C**"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "L'Event Graph, les nodes et les commentaires"
      },
      {
        "title": "Pins d'exécution vs pins de données (wires)",
        "body": "Chaque node possède des **pins**. Il existe **2 types de pins**. Les **pins d'exécution** sont **blanches** (triangle) et pilotent l'**ordre d'exécution** via des **fils blancs**. Les **pins de données** sont **colorées** (une couleur par **type** de variable) et sont reliées par des **data wires** transportant des **valeurs**. Les pins situées à **gauche** sont les **entrées (inputs)**, celles de **droite** les **sorties (outputs)**. L'exécution démarre à un **node Événement rouge** et suit le fil blanc **de gauche à droite** jusqu'au dernier node, puis passe à l'événement suivant déclenché. Quand un node avec des pins de données s'exécute, il **récupère d'abord les données requises** via ses data wires avant de terminer (ex. un **Set** qui lit une valeur issue d'un node de **multiplication**, lui-même alimenté par une variable). Brancher un lien, c'est comme brancher un objet électrique sur une prise : au Play, une animation parcourt les liens et montre le flux. Astuces : **Alt + clic** sur un lien pour le supprimer, **Ctrl + clic** pour le débrancher et le rebrancher ailleurs, double-clic sur un rail pour créer un **point de contrôle**, **Shift + Suppr** pour supprimer un node en conservant les connexions.",
        "keypoints": [
          "**Pins d'exécution** = blanches (triangle) : ordre d'exécution",
          "**Pins de données** = colorées (1 couleur/type) : valeurs (data wires)",
          "Entrées à **gauche**, sorties à **droite**",
          "Exécution : node **Event** rouge → de gauche à droite"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Pins d'exécution vs pins de données"
      },
      {
        "title": "Les Events principaux (BeginPlay, Tick, Overlap)",
        "body": "Par défaut, 3 events (les **points d'entrée** du code) sont présents dans le graph : **BeginPlay**, **Tick** et **ActorBeginOverlap**. **BeginPlay** est appelé **au début de la phase de jeu**, propre à chaque objet de la scène ; il n'est actif **que si un bloc est branché à sa sortie** (optimisation). **Tick** (Event Tick) est appelé **à chaque frame** (chaque boucle d'update) et fournit le paramètre **Delta Seconds** (float) — l'équivalent du **delta time** de Unity — pour rendre les traitements indépendants du framerate ; lui aussi ne s'exécute que s'il est branché. **ActorBeginOverlap** se déclenche au chevauchement (vu au chapitre sur les events). En tapant « event » dans le menu contextuel, on découvre beaucoup d'autres events (Key events, Mouse events, Game events...).",
        "keypoints": [
          "3 events par défaut : **BeginPlay**, **Tick**, **ActorBeginOverlap**",
          "**BeginPlay** : au début du jeu, une fois par objet",
          "**Tick** : à chaque frame, fournit **Delta Seconds** (delta time)",
          "Un event ne s'exécute que si sa sortie est branchée"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Les Events BeginPlay, Tick et Overlap"
      },
      {
        "title": "Les variables : création, types & code couleur",
        "body": "Pour créer une variable (ou un graph, une fonction, un event), on clique sur le **+** du panneau **My Blueprint**. Une nouvelle variable est **par défaut un Boolean** ; on change son **type** dans le panneau **Details** (à droite). Chaque type possède un **code couleur** dédié ; à la création d'une variable, l'ordinateur réserve une **quantité de mémoire** dépendant du type. Principaux types : **Boolean** (vrai/faux), **Byte** et **Integer** / **Integer64** (entiers), **Float** (nombre à virgule), **String**, **Name** et **Text** (chaînes), **Vector** (position/direction XYZ), **Rotator** (rotation Pitch/Yaw/Roll), **Transform** (position + rotation + scale), ainsi que des références d'**Object/Actor**, des **enums** et des **structures**. Il faut **compiler et sauvegarder** pour pouvoir affecter des valeurs par défaut.",
        "keypoints": [
          "Créer : bouton **+** du panneau **My Blueprint**",
          "Type par défaut = **Boolean** ; se change dans **Details**",
          "Chaque type a un **code couleur** et une empreinte mémoire",
          "Types : Boolean, Integer, **Float**, String, **Vector**, **Rotator**, **Transform**..."
        ],
        "versionNote": "Depuis UE5, le type **Float** des Blueprints est en réalité un **double précision (Real / 64 bits)** : les anciens floats 32 bits de l'UE4 sont convertis automatiquement. En UE 5.4, « Float (single-precision) » et « Double » apparaissent dans le dropdown, mais le Float par défaut d'un Blueprint est bien traité en double précision (utile pour les grands mondes / Large World Coordinates).",
        "tier": 1,
        "front": "Créer une variable : types et code couleur"
      },
      {
        "title": "GET / SET & mise à jour d'une variable",
        "body": "Les variables en Blueprint fonctionnent en **GETTER / SETTER**. En glissant une variable dans le graphe, on choisit **GET** (obtenir/lire une référence à la valeur) ou **SET** (modifier la valeur). Raccourcis : **Drag + Ctrl = GET**, **Drag + Alt = SET**. Un **SET** possède une **pin d'exécution** (c'est une action), un **GET** non (simple lecture). Exemple de mise à jour de la variable **Health** : récupérer Health via un **Get node**, lui retirer une valeur via un node **opérateur « - »**, puis écrire le résultat via un **Set node**. Point crucial : le résultat d'une opération est **temporaire** ; s'il n'est **pas enregistré via un Set**, il est **perdu** et la variable reste inchangée. On peut aussi glisser une variable **héritée** (afficher les variables héritées via la roue dentée du panneau My Blueprint).",
        "keypoints": [
          "**GET** = lire (Drag+Ctrl) ; **SET** = écrire (Drag+Alt)",
          "**SET** a une pin d'exécution (action) ; **GET** non (lecture)",
          "Un résultat non enregistré via **SET** est perdu",
          "Roue dentée = afficher/glisser les variables héritées"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "GET / SET : lire et modifier une variable"
      },
      {
        "title": "Panneau Détails d'une variable & conventions de nommage",
        "body": "Le panneau **Details** d'une variable permet de régler : son **nom**, son **type**, un **tooltip**, l'exposition **Instance Editable** (icône œil : variable **public**, éditable dans l'inspecteur des instances), **Blueprint Read Only** (get only, non modifiable dans d'autres Blueprints), **Private** (ni get ni set dans d'autres BP), le **slider range** (créer un curseur de réglage dans l'inspecteur), le **clamp** (borner la valeur), et la **Replication** pour le multijoueur. Conventions de nommage : préfixes par type d'asset — **BP_** (Blueprint), **M_** (Material), **S_** (Static Mesh), **SK_** (Skeletal Mesh), **T_** (Texture), **PS_** (Particle System), **WBP_** (Widget Blueprint). Côté nommage du code : penser **DRY** (pas de code dupliqué : factoriser en fonctions), **KISS** et **POO**.",
        "keypoints": [
          "**Instance Editable** (œil) = public ; **Blueprint Read Only**, **Private**",
          "**Slider range** + **clamp** ; **Replication** pour le multi",
          "Préfixes : **BP_**, **M_**, **S_**, **SK_**, **T_**, **PS_**, **WBP_**",
          "Bonnes pratiques : **DRY**, **KISS**, **POO**"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Détails d'une variable et conventions de nommage"
      },
      {
        "title": "Opérateurs, comparaisons & manipulation de Strings",
        "body": "On choisit l'**opérateur de comparaison** en fonction du **type** de la variable testée ; le comparateur renvoie **True** ou **False** selon que les éléments comparés sont identiques ou non. Pour les entiers et les strings, on utilise **Equal (==)** ; pour les **floats**, **vectors**, **transforms** ou **colors**, on préfère souvent **Nearly Equal** (égalité approchée avec tolérance) plutôt qu'un **Equal exactly**, à cause des erreurs d'arrondi en virgule flottante. Pour les chaînes : le node **Append** **concatène** des strings, et le node **Format Text** génère un texte à partir de **paramètres nommés** placés entre **accolades { }** dans le champ Format ; l'option **Add pin +** ajoute des entrées. Il existe aussi un node **Math Expression** pour écrire directement des formules (ex. sin(x) + cos(y) crée automatiquement les pins x et y). Unreal réalise souvent un **cast automatique** (ex. un bool converti en string pour un Print).",
        "keypoints": [
          "Comparateur choisi selon le type ; renvoie **True**/**False**",
          "Integer/String : **Equal (==)** ; Float/Vector : **Nearly Equal** (tolérance)",
          "**Append** = concaténer ; **Format Text** : paramètres entre { }",
          "**Cast automatique** fréquent (ex. bool → string pour Print)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Opérateurs, comparaisons et Strings"
      },
      {
        "title": "Tableaux (Arrays) & boucles (For / ForEach)",
        "body": "Une variable peut devenir un **tableau (Array)** en cliquant sur la petite **icône (en forme de « tic-tac »)** à côté du type, ou via le menu de type dans les **Details** (choisir **Array**). Il faut **compiler** pour pouvoir y insérer des valeurs. Pour itérer sur un tableau : la **For Loop** classique utilise un **index** qui varie de **0 à (nombre d'éléments − 1)** ; la **For Each Loop** parcourt directement **chaque élément** de la liste (sortie **Array Element**) et fournit aussi l'index courant. On y accède en tirant un fil depuis la variable tableau et en tapant « **ForEach Loop** ». La ForEach est plus compacte (≈ 5 nodes) que la For loop équivalente (≈ 9 nodes). D'autres nodes retournent des **tableaux d'acteurs** sur lesquels itérer (ex. Get All Actors Of Class). Exemple : au **BeginPlay**, une ForEach reliée à un node **Print** affiche la valeur de chaque élément (Unreal caste automatiquement l'élément en string).",
        "keypoints": [
          "Rendre Array : icône « tic-tac » à côté du type (ou Details > Array)",
          "**Compiler** avant d'insérer des valeurs",
          "**For Loop** : index de 0 à (Length − 1)",
          "**For Each Loop** : parcourt chaque **Array Element** (+ index), plus compacte"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Tableaux (Arrays) et boucles For / ForEach"
      },
      {
        "title": "Contrôle de flux : Branch, Switch, Gate, FlipFlop, DoOnce/DoN, Sequence",
        "body": "Les nodes de **flow control** déterminent le **chemin d'exécution** en fonction de conditions. **Branch** est le « **if** » du Blueprint : selon un **booléen** (Condition), il exécute la sortie **True** ou **False** (raccourci **B + clic gauche**). **Switch** (on Int / String / Name / Enum) aiguille l'exécution vers **plusieurs sorties** selon une valeur (ex. afficher Noob / Warrior / King selon l'XP). **Gate** est une **porte** ouverte ou fermée : si elle est **ouverte**, elle laisse passer l'exécution vers la pin **Exit** (entrées Open / Close / Toggle). **FlipFlop** **alterne** entre les sorties **A** et **B** à chaque passage (passage 1 → A, passage 2 → B, passage 3 → A...) et fournit un **booléen d'état**. **DoOnce** ne laisse passer l'exécution **qu'une seule fois**, puis ferme la porte jusqu'à un **Reset** ; **DoN** l'autorise **N fois** avant de devoir être réinitialisé. **Sequence** exécute plusieurs sorties **dans l'ordre**, mais **sur la même frame** (ex. un Delay branché sur une sortie ne bloque pas les suivantes).",
        "keypoints": [
          "**Branch** = if (booléen → True/False), raccourci **B**+clic",
          "**Switch** (Int/Enum/String) : aiguillage vers plusieurs sorties",
          "**Gate** : porte Open/Close/Toggle ; **FlipFlop** : alterne A/B",
          "**DoOnce** (1 fois) / **DoN** (N fois) ; **Sequence** : dans l'ordre, même frame"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Contrôle de flux : Branch, Switch, Gate..."
      },
      {
        "title": "Le Cast & la validation d'objets",
        "body": "Le **Cast** vérifie qu'un objet est bien d'une **classe précise** et, si oui, donne accès à ses **variables et fonctions spécifiques**. Utilité : quand deux classes héritent du **même parent** (ex. le player et un ennemi héritant tous deux de **Character**), la vérification de type de base ne suffit pas — il faut caster pour s'assurer qu'un acteur est bien **BP_OwnPlayerCharacter** et non l'ennemi (ex. une zone de victoire qui ne doit se déclencher que pour le joueur). On tire un fil depuis un objet — par exemple **Get Player Character** (le **player index** identifie le joueur pour le multi ; index **0** = 1er joueur, toujours 0 en solo) — et on tape « **Cast to ...** ». La sortie n'est « alimentée » (« le courant ne passe ») **que si le cast réussit**. Autres nodes de validité : **Is Valid** (vérifie qu'un objet est **non null**), et **Get Class** + **== (Equal Class)** pour comparer des classes. Le cast est pratique au début (comme le Tick), mais on cherche vite de meilleures approches.",
        "keypoints": [
          "**Cast** : vérifie la classe exacte et débloque ses membres spécifiques",
          "Utile quand 2 classes partagent le même parent (player vs ennemi)",
          "Sortie exécutée **seulement si le cast réussit**",
          "Validation : **Is Valid** (non null), **Get Class** + **==**"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Le Cast et la validation d'objets"
      }
    ],
    "quiz": [
      {
        "q": "Qu'est-ce qu'un Blueprint dans Unreal Engine 5.4 ?",
        "choices": [
          "Un langage de shader réservé aux matériaux et aux effets visuels avancés du moteur",
          "Un système de script visuel où les actions sont des nodes reliés par des fils",
          "Un format d'échange pour importer et exporter des modèles 3D animés",
          "Un outil de gestion de version qui suit les modifications d'un projet"
        ],
        "answer": 1,
        "explain": "Un Blueprint est un outil de code visuel : chaque action est un bloc/node et les connexions représentent le cheminement de la logique exécutée par le moteur.",
        "difficulty": "facile",
        "topic": "Introduction / définition",
        "def": {
          "term": "Blueprint",
          "text": "Système de script visuel d'Unreal Engine : la logique se construit en reliant des nodes par des fils, sans écrire de code textuel. Idéal pour le prototypage et le gameplay."
        }
      },
      {
        "q": "Que peut-on dire de la relation entre Blueprint et C++ ?",
        "choices": [
          "Un jeu doit être écrit soit entièrement en Blueprint, soit entièrement en C++",
          "Le Blueprint s'exécute toujours plus vite que le C++ compilé équivalent",
          "Un langage typé et orienté objet basé sur C++, mais moins performant que lui",
          "Un Blueprint ne peut en aucun cas hériter d'une classe écrite en C++ pur"
        ],
        "answer": 2,
        "explain": "Le Blueprint est basé sur C++, typé et orienté objet, mais moins performant. Les deux sont complémentaires, et un BP peut hériter d'une classe C++.",
        "difficulty": "moyen",
        "topic": "Blueprint vs C++",
        "def": {
          "term": "Blueprint vs C++",
          "text": "Le Blueprint est typé, orienté objet et basé sur le C++, mais moins performant. Les deux approches sont complémentaires : un BP peut même hériter d'une classe C++."
        }
      },
      {
        "q": "Quelle affirmation décrit correctement le Level Blueprint ?",
        "choices": [
          "Il est propre à un niveau donné et n'est pas instanciable (level scripting)",
          "Il est instanciable plusieurs fois au runtime, à la manière d'un prefab",
          "Il sert uniquement à construire les interfaces et le HUD du joueur",
          "Il ne peut pas du tout interagir avec les acteurs présents dans le niveau chargé"
        ],
        "answer": 0,
        "explain": "Le Level Blueprint appartient à un niveau, gère ses événements et actions (ex. cinématiques) et n'est pas instanciable. Il peut interagir avec les Actor Blueprints du niveau.",
        "difficulty": "moyen",
        "topic": "Types de Blueprint",
        "def": {
          "term": "Level Blueprint",
          "text": "Blueprint unique attaché à un niveau, non instanciable. Il scripte les événements propres à ce niveau (cinématiques, déclencheurs) et pilote les acteurs qui s'y trouvent."
        }
      },
      {
        "q": "Une Blueprint Class (souvent appelée Actor Blueprint) est :",
        "choices": [
          "Non réutilisable, car elle reste liée à un seul et unique niveau de jeu",
          "Réservée exclusivement à la création et au blending des animations",
          "Instanciable au runtime et réutilisable dans tout niveau, comme un prefab",
          "Un simple fichier de configuration des préférences visuelles de l'éditeur Blueprint"
        ],
        "answer": 2,
        "explain": "Une Blueprint Class définit les données et le comportement d'un type d'objet ; elle est instanciable au runtime (comme un prefab) et réutilisable dans tous les niveaux.",
        "difficulty": "moyen",
        "topic": "Types de Blueprint",
        "def": {
          "term": "Blueprint Class",
          "text": "Classe Blueprint définissant les données et le comportement d'un type d'objet. Instanciable au runtime et réutilisable dans tous les niveaux, à la manière d'un prefab."
        }
      },
      {
        "q": "Dans l'exemple où BP_Car hérite de BP_Vehicle, qu'est-ce qui est vrai ?",
        "choices": [
          "Elle ne peut posséder aucune variable qui lui soit réellement propre",
          "Elle perd la variable vitesse qui était définie dans la classe parente BP_Vehicle",
          "Elle hérite des variables du parent (couleur, vitesse) et peut en ajouter",
          "L'héritage n'est possible qu'entre deux classes écrites en C++ pur"
        ],
        "answer": 2,
        "explain": "Par héritage, l'enfant expose les variables et méthodes de la classe mère et peut en ajouter. L'héritage peut être BP→BP, C++→C++ ou BP→C++.",
        "difficulty": "moyen",
        "topic": "Héritage",
        "def": {
          "term": "Héritage",
          "text": "Mécanisme par lequel une classe enfant reçoit les variables et méthodes de sa classe parente et peut en ajouter de nouvelles. Possible BP→BP, C++→C++ ou BP→C++."
        }
      },
      {
        "q": "Quelle est la classe racine dont dérivent toutes les autres classes dans Unreal ?",
        "choices": [
          "Actor",
          "Pawn",
          "Object",
          "Component"
        ],
        "answer": 2,
        "explain": "Object est la classe de base ; toutes les autres classes en sont des sous-classes. Chaque Actor est un Object, mais l'inverse n'est pas vrai.",
        "difficulty": "facile",
        "topic": "Classes principales",
        "def": {
          "term": "Object",
          "text": "Classe racine d'Unreal Engine : toutes les autres classes en dérivent. Un Actor est un Object, mais l'inverse est faux (un ActorComponent est un Object, pas un Actor)."
        }
      },
      {
        "q": "Pourquoi un ActorComponent ne peut-il pas être placé directement dans le monde ?",
        "choices": [
          "Parce qu'il est nécessairement écrit et compilé en langage C++ pur",
          "Parce qu'il n'a pas de transform (ni position ni rotation dans le monde)",
          "Parce qu'il s'avère bien plus performant qu'un Actor classique du moteur Unreal",
          "Parce qu'il hérite directement de la classe Pawn du framework de jeu"
        ],
        "answer": 1,
        "explain": "Un ActorComponent n'a pas de transformation (pas de position/rotation) ; il définit des comportements abstraits (mouvement, inventaire). C'est un Object mais pas un Actor.",
        "difficulty": "moyen",
        "topic": "Classes principales",
        "def": {
          "term": "ActorComponent",
          "text": "Classe de base des composants réutilisables ajoutés à un Actor. Sans transform (aucune position dans le monde), il porte des comportements abstraits : mouvement, inventaire…"
        }
      },
      {
        "q": "Quelle est la différence entre un SceneComponent et un PrimitiveComponent ?",
        "choices": [
          "Le SceneComponent possède une géométrie de rendu, pas le PrimitiveComponent",
          "Le PrimitiveComponent est un SceneComponent doté d'une géométrie de rendu",
          "Ils sont strictement identiques et parfaitement interchangeables partout",
          "Le PrimitiveComponent n'a aucun emplacement défini dans le monde du jeu"
        ],
        "answer": 1,
        "explain": "Le SceneComponent gère un emplacement sans géométrie (caméra, spring arm, audio, forces). Le PrimitiveComponent en hérite et ajoute une représentation géométrique (mesh, sprites, volumes de collision).",
        "difficulty": "difficile",
        "topic": "Classes principales",
        "def": {
          "term": "PrimitiveComponent",
          "text": "SceneComponent doté d'une représentation géométrique (mesh, sprite, volume de collision). Utilisé pour le rendu et les collisions, contrairement au SceneComponent nu."
        }
      },
      {
        "q": "Où faut-il stocker des données qui doivent survivre au changement de niveau ?",
        "choices": [
          "Dans le GameMode, qui n'est présent que du côté serveur du jeu",
          "Dans la GameInstance, un conteneur unique partagé par toute la session",
          "Dans le PlayerController, qui est créé pour chaque joueur de la partie",
          "Dans le Level Blueprint, associé à la carte actuellement chargée en jeu"
        ],
        "answer": 1,
        "explain": "La GameInstance n'est pas réinitialisée au changement de niveau ou de mode ; c'est là qu'on stocke ce qui doit persister. GameMode et PlayerController, eux, sont réinitialisés.",
        "difficulty": "moyen",
        "topic": "Game Framework",
        "def": {
          "term": "GameInstance",
          "text": "Objet unique vivant toute la session de jeu. Son état n'est pas réinitialisé au changement de niveau ou de mode : idéal pour les données persistantes (score, choix menu)."
        }
      },
      {
        "q": "À quoi sert principalement le GameMode ?",
        "choices": [
          "Gérer l'affichage du HUD, des menus et des indicateurs à l'écran du joueur humain",
          "Définir les règles du jeu, les conditions de victoire et le pawn par défaut",
          "Conserver le score persistant d'un joueur d'une partie de jeu à l'autre",
          "Stocker de nombreuses données qui sont mises à jour à chaque frame de jeu"
        ],
        "answer": 1,
        "explain": "Le GameMode définit les règles, les conditions de victoire, le Character par défaut, etc. Il n'existe que sur le serveur et ne doit pas stocker de données transitoires.",
        "difficulty": "moyen",
        "topic": "Game Framework",
        "def": {
          "term": "GameMode",
          "text": "Classe définissant les règles du jeu, les conditions de victoire et le pawn par défaut. N'existe que sur le serveur et ne doit pas stocker de données transitoires."
        }
      },
      {
        "q": "Quelle est la relation entre Pawn et Character ?",
        "choices": [
          "Character est une sous-classe de Pawn déjà configurée pour se déplacer",
          "Character est la classe parente dont Pawn hérite toutes ses fonctions",
          "Ils n'ont aucun lien d'héritage et restent totalement indépendants",
          "Un Pawn ne peut jamais être contrôlé par une intelligence artificielle du jeu"
        ],
        "answer": 0,
        "explain": "Character hérite de Pawn et arrive préconfiguré (capsule de collision, mesh, CharacterMovement, saut, marche). Un Pawn peut être contrôlé par un joueur OU une IA.",
        "difficulty": "moyen",
        "topic": "Game Framework",
        "def": {
          "term": "Character",
          "text": "Sous-classe de Pawn livrée préconfigurée : capsule de collision, mesh et composant CharacterMovement (marche, saut, nage). Contrôlable par un joueur ou une IA."
        }
      },
      {
        "q": "À quoi sert le bouton Compile de la toolbar d'un Blueprint ?",
        "choices": [
          "Exporter le Blueprint sous la forme de code source C++ entièrement éditable",
          "Valider le code du Blueprint et appliquer ses dernières modifications",
          "Masquer les nodes qui ne sont pas reliés à la sélection courante du graphe",
          "Lancer immédiatement le jeu dans une fenêtre séparée en mode Play"
        ],
        "answer": 1,
        "explain": "Compiler valide le code et applique les modifications ; c'est notamment nécessaire pour pouvoir affecter les valeurs par défaut. On ne compile que le BP modifié, pas tout le projet.",
        "difficulty": "facile",
        "topic": "Éditeur Blueprint / Compilation",
        "def": {
          "term": "Compilation (Compile)",
          "text": "Action qui valide le graphe du Blueprint et applique ses modifications, notamment pour affecter les valeurs par défaut. On ne compile que le BP modifié, pas tout le projet."
        }
      },
      {
        "q": "Quand le Construction Script d'un Blueprint d'acteur s'exécute-t-il ?",
        "choices": [
          "À chaque frame pendant toute la durée du jeu, exactement comme le Tick",
          "Uniquement lorsqu'on clique sur le bouton Compile de la barre d'outils",
          "À l'ajout ou la modification dans l'éditeur, et à l'instanciation runtime",
          "Seulement du côté serveur lorsqu'on joue une partie en mode multijoueur en ligne"
        ],
        "answer": 2,
        "explain": "Le Construction Script s'exécute à l'ajout/modification de l'acteur dans l'éditeur et à l'instanciation runtime, mais pas au démarrage du jeu pour les acteurs déjà placés dans le niveau.",
        "difficulty": "difficile",
        "topic": "Construction Script",
        "def": {
          "term": "Construction Script",
          "text": "Fonction exécutée quand l'acteur est ajouté ou modifié dans l'éditeur, ou instancié au runtime — mais pas au lancement du jeu pour les acteurs déjà placés dans le niveau."
        }
      },
      {
        "q": "À quoi sert l'Event Graph d'un Blueprint ?",
        "choices": [
          "Afficher la représentation visuelle en 3D des components de l'acteur",
          "Coder le comportement des instances de la classe via un graphe de nodes",
          "Régler uniquement les valeurs par défaut des variables de la classe",
          "Gérer le système de contrôle de version du projet et l'historique des commits"
        ],
        "answer": 1,
        "explain": "L'Event Graph est l'endroit où l'on code la logique de jeu ; il contient événements et actions représentés par un graphe de nodes (équivalent d'une fonction C++).",
        "difficulty": "facile",
        "topic": "Event Graph",
        "def": {
          "term": "Event Graph",
          "text": "Graphe de nodes où l'on code la logique de comportement des instances d'une classe Blueprint. Contient événements et actions, à la manière d'une fonction C++."
        }
      },
      {
        "q": "Comment distingue-t-on visuellement une pin d'exécution d'une pin de données ?",
        "choices": [
          "Les pins d'exécution sont colorées, les pins de données restent blanches",
          "Les pins d'exécution sont blanches, les pins de données colorées par type",
          "Toutes les pins ont exactement la même apparence et la même couleur unie",
          "Les pins de données ne se trouvent jamais qu'à gauche des nodes du graphe d'événements"
        ],
        "answer": 1,
        "explain": "Les pins d'exécution sont blanches (triangle) et pilotent l'ordre d'exécution ; les pins de données sont colorées, une couleur par type de variable, et transportent des valeurs.",
        "difficulty": "facile",
        "topic": "Pins d'exécution vs données",
        "def": {
          "term": "Pins (exécution / données)",
          "text": "Points de connexion d'un node. Les pins d'exécution (blanches, triangulaires) ordonnent l'exécution ; les pins de données (colorées selon le type) transportent des valeurs."
        }
      },
      {
        "q": "Dans quel sens se déroule l'exécution d'un graphe Blueprint ?",
        "choices": [
          "Depuis un node bleu quelconque, en remontant le fil de droite à gauche",
          "Depuis un node Événement rouge, en suivant le fil blanc de gauche à droite",
          "De haut en bas de la fenêtre, colonne de nodes après colonne de nodes",
          "Dans un ordre imprévisible et totalement aléatoire à chaque exécution du jeu"
        ],
        "answer": 1,
        "explain": "L'exécution commence à un node Événement (rouge) et suit le fil d'exécution blanc de gauche à droite jusqu'au dernier node, puis passe à l'événement suivant déclenché.",
        "difficulty": "facile",
        "topic": "Pins d'exécution vs données",
        "def": {
          "term": "Flux d'exécution",
          "text": "L'exécution part d'un node Événement (rouge) et suit le fil blanc de gauche à droite jusqu'au dernier node, avant de passer à l'événement suivant déclenché."
        }
      },
      {
        "q": "Que fait un node avec des pins de données au moment de son exécution ?",
        "choices": [
          "Il transmet systématiquement ses données après avoir fini son exécution",
          "Il récupère d'abord les données requises via ses fils avant de terminer",
          "Il ignore ses pins de données et n'exploite que ses pins d'exécution",
          "Rien de particulier, car les fils de données ne sont là que pour décorer"
        ],
        "answer": 1,
        "explain": "Avant de terminer, un node va chercher les valeurs nécessaires en remontant ses data wires (ex. un Set lit le résultat d'une multiplication, elle-même alimentée par une variable).",
        "difficulty": "moyen",
        "topic": "Pins d'exécution vs données",
        "def": {
          "term": "Récupération des données (pull)",
          "text": "À son exécution, un node remonte ses fils de données pour récupérer les valeurs requises avant de finir (ex. un Set lit d'abord le résultat d'une multiplication)."
        }
      },
      {
        "q": "L'event BeginPlay est appelé :",
        "choices": [
          "À chaque frame de jeu, tant que la partie n'est pas mise en pause",
          "Uniquement au moment où deux acteurs se chevauchent physiquement",
          "Au début de la phase de jeu, une fois pour chaque objet de la scène",
          "Seulement à l'intérieur du Level Blueprint associé à la carte chargée"
        ],
        "answer": 2,
        "explain": "BeginPlay est déclenché au début de la phase de jeu, pour chaque objet. Comme Tick, il n'est actif que si un bloc est branché à sa sortie (optimisation).",
        "difficulty": "facile",
        "topic": "Events",
        "def": {
          "term": "BeginPlay",
          "text": "Événement déclenché au début de la phase de jeu, une fois par objet. Comme Tick, il ne s'exécute que si un bloc est branché à sa sortie (optimisation)."
        }
      },
      {
        "q": "Quel paramètre l'Event Tick fournit-il, et à quelle fréquence est-il appelé ?",
        "choices": [
          "Delta Seconds (float), fourni à chaque frame de la boucle d'update",
          "Le nombre de joueurs connectés, fourni une seule fois par niveau",
          "Aucun paramètre, car l'Event Tick n'en reçoit jamais le moindre",
          "Delta Seconds, mais transmis uniquement lors du tout premier démarrage du jeu"
        ],
        "answer": 0,
        "explain": "Tick est appelé à chaque frame et fournit Delta Seconds (float), l'équivalent du delta time, pour rendre les traitements indépendants du framerate.",
        "difficulty": "moyen",
        "topic": "Events",
        "def": {
          "term": "Event Tick",
          "text": "Événement appelé à chaque frame. Il fournit Delta Seconds (float), le temps écoulé depuis la frame précédente, pour rendre les traitements indépendants du framerate."
        }
      },
      {
        "q": "Quel raccourci clavier crée un bloc de commentaire dans l'Event Graph ?",
        "choices": [
          "La touche B, en cliquant ensuite dans une zone vide du graphe",
          "Le raccourci Ctrl+K, saisi depuis le panneau My Blueprint",
          "La touche C, qui englobe les nodes actuellement sélectionnés",
          "La touche V, en la maintenant au-dessus d'un node existant"
        ],
        "answer": 2,
        "explain": "La touche C crée un commentaire englobant les nodes sélectionnés. Le panneau Details permet d'en changer la couleur et de garder le texte visible même dézoomé.",
        "difficulty": "facile",
        "topic": "Commentaires",
        "def": {
          "term": "Bloc de commentaire",
          "text": "Cadre créé avec la touche C autour des nodes sélectionnés. Sa couleur et sa visibilité au dézoom se règlent dans le panneau Details, pour documenter le graphe."
        }
      },
      {
        "q": "Quel est le type par défaut d'une variable nouvellement créée, et où change-t-on son type ?",
        "choices": [
          "Integer, et l'on change son type depuis la barre d'outils",
          "Float, et l'on change son type directement dans le Viewport",
          "Boolean, et l'on change son type dans le panneau Details",
          "String, et l'on change son type via le Content Drawer"
        ],
        "answer": 2,
        "explain": "Une nouvelle variable est un Boolean par défaut ; on change son type dans le panneau Details. Chaque type a un code couleur et une empreinte mémoire propres.",
        "difficulty": "moyen",
        "topic": "Variables & types",
        "def": {
          "term": "Variable Blueprint",
          "text": "Une variable nouvellement créée est un Boolean par défaut ; son type se change dans le panneau Details. Chaque type a un code couleur et une empreinte mémoire propres."
        }
      },
      {
        "q": "Dans Unreal Engine 5.4, quelle est la particularité du type Float des Blueprints ?",
        "choices": [
          "Il reste en simple précision sur 32 bits, comme il l'était en UE4",
          "Il a disparu du moteur, remplacé partout par le type Integer",
          "Il est désormais traité en double précision (Real, sur 64 bits)",
          "Il ne peut plus stocker que des valeurs strictement entières"
        ],
        "answer": 2,
        "explain": "Depuis UE5, le Float des Blueprints est en réalité un double (Real, 64 bits) ; les anciens floats 32 bits de l'UE4 sont convertis automatiquement. Cela améliore la précision (grands mondes).",
        "difficulty": "difficile",
        "topic": "Variables & types (version UE5)",
        "def": {
          "term": "Float (double précision)",
          "text": "Depuis UE5, le Float des Blueprints est en réalité un double (Real, 64 bits) ; les anciens floats 32 bits de l'UE4 sont convertis. Utile pour les grands mondes (LWC)."
        }
      },
      {
        "q": "Quelle affirmation sur GET et SET est correcte ?",
        "choices": [
          "GET modifie la valeur alors que SET se contente de la lire",
          "GET lit la valeur (Drag+Ctrl) et SET la modifie (Drag+Alt)",
          "Un SET n'a pas besoin d'être exécuté pour changer la variable",
          "GET et SET sont totalement interchangeables selon le contexte"
        ],
        "answer": 1,
        "explain": "GET obtient/lit la valeur (Drag+Ctrl) ; SET la modifie (Drag+Alt) et possède une pin d'exécution. Sans un SET, un résultat calculé reste temporaire et est perdu.",
        "difficulty": "moyen",
        "topic": "GET / SET",
        "def": {
          "term": "GET / SET",
          "text": "GET lit la valeur d'une variable (Drag+Ctrl), SET la modifie (Drag+Alt) et porte une pin d'exécution. Un résultat non enregistré par un SET est temporaire et perdu."
        }
      },
      {
        "q": "Dans le panneau Details d'une variable, à quoi sert l'option Instance Editable (l'icône œil) ?",
        "choices": [
          "Supprimer définitivement la variable du Blueprint et de ses enfants",
          "Rendre la variable publique, éditable dans l'inspecteur des instances",
          "Changer la couleur d'affichage de la variable dans l'Event Graph",
          "Forcer la réplication réseau de la variable pour le mode multijoueur en ligne"
        ],
        "answer": 1,
        "explain": "Instance Editable (icône œil) expose la variable en public, éditable sur chaque instance dans l'inspecteur. Autres options : Blueprint Read Only (get only), Private, slider/clamp, Replication pour le multi.",
        "difficulty": "moyen",
        "topic": "Panneau Détails d'une variable",
        "def": {
          "term": "Instance Editable",
          "text": "Option (icône œil) qui expose une variable en public : elle devient éditable sur chaque instance dans l'inspecteur, sans passer par les valeurs par défaut de la classe."
        }
      },
      {
        "q": "Quel préfixe de nommage correspond à un Widget Blueprint ?",
        "choices": [
          "UMG_",
          "HUD_",
          "WBP_",
          "GUI_"
        ],
        "answer": 2,
        "explain": "Conventions de préfixes : BP_ (Blueprint), M_ (Material), S_ (Static Mesh), SK_ (Skeletal Mesh), T_ (Texture), PS_ (Particle System) et WBP_ (Widget Blueprint).",
        "difficulty": "facile",
        "topic": "Conventions de nommage",
        "def": {
          "term": "WBP_ (Widget Blueprint)",
          "text": "Préfixe de nommage des Widget Blueprints (interfaces, HUD, menus). Rappel : BP_ (Blueprint), M_ (Material), SK_ (Skeletal Mesh), T_ (Texture), PS_ (Particle System)."
        }
      },
      {
        "q": "Quel node Blueprint correspond au « if » d'un langage de programmation classique ?",
        "choices": [
          "Branch",
          "Sequence",
          "Gate",
          "Cast"
        ],
        "answer": 0,
        "explain": "Le node Branch réalise le « if » : selon un booléen (Condition), il exécute la sortie True ou False. Raccourci : B + clic gauche.",
        "difficulty": "facile",
        "topic": "Contrôle de flux",
        "def": {
          "term": "Branch",
          "text": "Node de contrôle de flux équivalent au « if » : selon un booléen (Condition), il exécute la sortie True ou False. Raccourci de création : B + clic gauche."
        }
      },
      {
        "q": "À quoi sert un node Switch (on Int / Enum / String) ?",
        "choices": [
          "Ouvrir ou fermer le passage d'un flux à la manière d'une porte",
          "Aiguiller l'exécution vers différentes sorties selon une valeur",
          "N'autoriser l'exécution d'une action qu'une seule et unique fois",
          "Inverser la valeur d'un booléen entre vrai et faux à chaque appel"
        ],
        "answer": 1,
        "explain": "Un Switch dirige l'exécution vers une sortie parmi plusieurs selon une valeur (entier, enum, string, name). C'est un contrôle de flux à cas multiples.",
        "difficulty": "moyen",
        "topic": "Contrôle de flux",
        "def": {
          "term": "Switch",
          "text": "Node de flux qui dirige l'exécution vers une sortie parmi plusieurs, selon une valeur (Int, Enum, String ou Name). Un aiguillage à cas multiples, comme un switch/case."
        }
      },
      {
        "q": "Quel node fait alterner l'exécution entre deux sorties A et B à chaque passage ?",
        "choices": [
          "DoOnce",
          "FlipFlop",
          "Gate",
          "MultiGate"
        ],
        "answer": 1,
        "explain": "FlipFlop alterne entre les sorties A et B à chaque déclenchement et fournit un booléen d'état. Gate ouvre/ferme un flux, DoOnce n'exécute qu'une fois (jusqu'à Reset), Sequence exécute plusieurs sorties dans l'ordre sur la même frame.",
        "difficulty": "moyen",
        "topic": "Contrôle de flux",
        "def": {
          "term": "FlipFlop",
          "text": "Node qui bascule alternativement entre ses sorties A et B à chaque déclenchement (1→A, 2→B, 3→A…) et fournit un booléen indiquant l'état courant."
        }
      },
      {
        "q": "Quelle est la différence entre une For Loop et une For Each Loop ?",
        "choices": [
          "La For Each Loop n'existe tout simplement pas parmi les nodes Blueprint",
          "La For Loop itère via un index (0 à N-1), la For Each parcourt les éléments",
          "La For Loop ne peut fonctionner qu'avec des tableaux de type String uniquement",
          "Les deux boucles exigent obligatoirement d'être reliées à un Event Tick"
        ],
        "answer": 1,
        "explain": "La For Loop classique utilise un index allant de 0 à (nombre d'éléments − 1) ; la For Each Loop parcourt directement chaque élément (Array Element) d'un tableau et fournit aussi l'index. La ForEach est plus compacte.",
        "difficulty": "moyen",
        "topic": "Tableaux & boucles",
        "def": {
          "term": "For Loop / For Each Loop",
          "text": "La For Loop itère avec un index de 0 à Length−1 ; la For Each Loop parcourt directement chaque Array Element d'un tableau et fournit l'index. La ForEach est plus compacte."
        }
      },
      {
        "q": "À quoi sert un Cast (par ex. « Cast To BP_ThirdPersonCharacter ») ?",
        "choices": [
          "Convertir une valeur de type float en une valeur de type integer",
          "Supprimer proprement un objet du niveau et libérer toute sa mémoire",
          "Vérifier qu'un objet est d'une classe précise et accéder à ses membres",
          "Créer un bloc de commentaire coloré autour de plusieurs nodes du graphe"
        ],
        "answer": 2,
        "explain": "Le Cast vérifie qu'un objet appartient à une classe donnée (utile quand player et ennemi héritent tous deux de Character) ; s'il réussit, il donne accès aux membres spécifiques de cette classe. Pour la validité, on utilise aussi Is Valid (non null) et Get Class + == (Equal Class).",
        "difficulty": "moyen",
        "topic": "Cast & validation",
        "def": {
          "term": "Cast",
          "text": "Node qui vérifie qu'un objet appartient à une classe donnée et, si oui, débloque l'accès à ses variables et fonctions spécifiques. Sa suite ne s'exécute que si le cast réussit."
        }
      }
    ],
    "sources": [
      {
        "label": "Flow Control in Unreal Engine — Documentation officielle Epic",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/flow-control-in-unreal-engine"
      },
      {
        "label": "Blueprint Variables in Unreal Engine — Documentation officielle Epic",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-variables-in-unreal-engine"
      },
      {
        "label": "Nodes in Unreal Engine (pins d'exécution / données) — Documentation officielle Epic",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/nodes-in-unreal-engine"
      },
      {
        "label": "Blueprint Editor Cheat Sheet in Unreal Engine — Documentation officielle Epic (raccourcis B, C...)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-editor-cheat-sheet-in-unreal-engine"
      },
      {
        "label": "UE Tip: Float Is Now Double Precision (changement UE5) — Unreal Directive",
        "url": "https://unrealdirective.com/tips/float-is-now-double/"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/oKGJECvQJA8/hqdefault.jpg",
        "caption": "Miniature du tuto « Guide to Variables and Variable Types » : les variables et leurs types (Boolean, Integer, Float…) dans le Blueprint.",
        "credit": "YouTube — Guide To Variables And Variable Types (Blueprint Basics For Beginners)",
        "link": "https://www.youtube.com/watch?v=oKGJECvQJA8"
      },
      {
        "url": "https://upload.wikimedia.org/wikipedia/commons/c/c2/Ue_bp.png",
        "caption": "Exemple d'Event Graph Blueprint : nodes reliés par des fils d'exécution — illustration du système de scripting visuel.",
        "credit": "Kuldhi, Wikimedia Commons (CC BY-SA 4.0)",
        "link": "https://commons.wikimedia.org/wiki/File:Ue_bp.png"
      }
    ],
    "links": [
      {
        "label": "Doc officielle Epic — Guide de démarrage rapide des Blueprints (Event Graph, Branch, Cast, flux d'exécution)",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/quick-start-guide-for-blueprints-visual-scripting-in-unreal-engine?lang=en-US",
        "kind": "doc"
      },
      {
        "label": "Vidéo YouTube — Guide des variables et de leurs types dans les Blueprints (pour débutants)",
        "url": "https://www.youtube.com/watch?v=oKGJECvQJA8",
        "kind": "youtube"
      },
      {
        "label": "Forum Epic — « Expliquez-moi les bases des nodes Cast To » (question + réponses de la communauté)",
        "url": "https://forums.unrealengine.com/t/can-someone-explain-the-basics-of-cast-to-nodes-to-me/22289",
        "kind": "forum"
      },
      {
        "label": "Article freeCodeCamp — Unreal Engine 5 Crash Course with Blueprint (nodes, variables, Branch)",
        "url": "https://www.freecodecamp.org/news/unreal-engine-5-crash-course-with-blueprint/",
        "kind": "blog"
      }
    ]
  },
  {
    "id": "events",
    "num": "03",
    "special": false,
    "title": "Blueprint — Les Events",
    "summary": "Ce chapitre couvre le système d'événements des Blueprints dans Unreal Engine 5.4. On y voit d'abord la nature des Events (nœuds rouges sans pin d'entrée, appelés par le moteur ou par le développeur, un seul de chaque type par graph), puis les events de collision (ActorBeginOverlap / ActorEndOverlap avec Generate Overlap Events, Event Hit avec Simulation Generates Hit Events, et OnComponentBeginOverlap au niveau des composants). Viennent ensuite les Custom Events (événements personnalisés créés par le développeur pour organiser le code et servir au binding). Une grande partie est consacrée aux events d'input : l'ancien système d'Action/Axis Mappings (< UE 5.1, déprécié) puis l'Enhanced Input System (activé par défaut depuis UE 5.1, standard dans UE 5.4) avec ses quatre concepts (Input Actions, Input Mapping Contexts, Input Modifiers, Input Triggers), les types de valeur (Digital, Axis1D/2D/3D), les Trigger States (Triggered, Started, Ongoing, Canceled, Completed), les modificateurs (Negate, Swizzle) et la priorité des contextes. Enfin, les Event Dispatchers implémentent le pattern observer (Call = invoke, Bind = AddEventListener) avec l'importance du unbind.",
    "topics": [
      "Nature et principes des Events",
      "Communication entre Blueprints",
      "Event ActorBeginOverlap et les 3 events principaux",
      "Collision Events : Overlap vs Hit",
      "Event OnComponentBeginOverlap",
      "Custom Events",
      "Events d'input et ancien système (< UE 5.1)",
      "Enhanced Input System",
      "Input Actions et types de valeur",
      "Trigger States",
      "Input Mapping Contexts et priorité",
      "Input Modifiers (Negate, Swizzle)",
      "Event Dispatchers (pattern observer)"
    ],
    "fiches": [
      {
        "title": "Nature, principes et communication des Events",
        "body": "Les **Events** (événements) sont des nœuds appelés depuis le code de jeu pour démarrer l'exécution d'un réseau individuel dans l'**EventGraph**. Visuellement ils sont **rouges** et n'ont **pas de pin d'exécution en entrée** : ils sont le point de départ d'une chaîne de nœuds. Ils peuvent être appelés soit par le **moteur lui-même** (les ticks, le BeginPlay, les collisions), soit par le **développeur** (via un event graph ou depuis une autre classe). Ils permettent à un Blueprint d'effectuer une série d'actions en réponse à certains événements du jeu (le jeu démarre, un niveau se réinitialise, un joueur subit des dégâts…) et servent à **implémenter de nouvelles fonctionnalités** ou à **remplacer / augmenter** une fonctionnalité par défaut. Ils permettent aussi de **communiquer entre Blueprints** : soit un BP **appelle directement un événement** sur un autre BP s'il possède une **référence** sur lui, soit il utilise un **Event Dispatcher** pour prévenir tous les abonnés. Pour ceux venant de Unity : le **Call** équivaut à `Invoke()` et le **Bind** à `AddEventListener()` ; on peut **s'abonner (bind)** et **se désabonner (unbind)**. Les inputs de touches et les collisions sont eux aussi gérés par des événements.",
        "keypoints": [
          "Nœuds **rouges**, sans pin d'exécution en entrée : point de départ",
          "Appelés par le **moteur** (Tick, BeginPlay, collisions) ou le **développeur**",
          "Un seul de chaque type par graph ; actif si sa sortie est branchée",
          "Communication BP : appel direct via référence, ou **Event Dispatcher**"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Qu'est-ce qu'un Event dans un Blueprint ?"
      },
      {
        "title": "Les 3 events principaux et Event ActorBeginOverlap",
        "body": "À la création d'une **Blueprint Class**, trois événements principaux sont proposés d'emblée : **Event BeginPlay**, **Event Tick** (vus au chapitre précédent) et **Event ActorBeginOverlap**. L'**Event ActorBeginOverlap** est appelé lorsqu'un autre Actor entre en **overlap** (chevauchement) avec la collision de cet Actor. Il fournit le paramètre **Other Actor** (l'acteur qui a provoqué le chevauchement), très utile pour savoir avec quoi on interagit. Comme les deux autres, il n'est **actif que si un bloc est branché** sur sa sortie (optimisation du moteur).",
        "keypoints": [
          "3 events par défaut : **BeginPlay**, **Tick**, **ActorBeginOverlap**",
          "**ActorBeginOverlap** : un autre Actor chevauche la collision",
          "Fournit le paramètre **Other Actor**",
          "Actif seulement si sa sortie est branchée"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Les 3 events par défaut et ActorBeginOverlap"
      },
      {
        "title": "Collision Events : Overlap vs Hit",
        "body": "Les **événements de collision** se déclenchent quand deux acteurs entrent en collision ou se chevauchent. Il faut distinguer deux familles. Les **Overlap** (chevauchement, sans blocage physique) : **Event ActorBeginOverlap** s'exécute quand deux acteurs commencent à se chevaucher **à condition que la propriété `Generate Overlap Events` soit à `true` sur les DEUX acteurs**, et **Event ActorEndOverlap** quand ils cessent de se chevaucher. Les **Hit** (contact solide/bloquant) : **Event Hit** ne s'exécute que si la propriété **`Simulation Generates Hit Events`** de l'un des acteurs vaut **`true`**. Un Hit correspond à une collision bloquante (mouvement de personnage, déplacement avec `sweep`, simulation physique), tandis qu'un Overlap traverse sans bloquer.",
        "keypoints": [
          "**Overlap** = chevauchement non bloquant ; **Hit** = contact solide",
          "**ActorBeginOverlap** / **ActorEndOverlap** : début et fin",
          "Overlap exige **Generate Overlap Events** = true sur les DEUX acteurs",
          "**Event Hit** exige **Simulation Generates Hit Events** = true"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Collision : Overlap vs Hit"
      },
      {
        "title": "Event OnComponentBeginOverlap",
        "body": "Il est souvent **plus intéressant de gérer les overlaps au niveau des composants** (comme une Box Collision, une Sphere Collision…) plutôt qu'au niveau de l'Actor entier. Dans le panneau **Détails** des composants qui le supportent, on peut ajouter des **événements dédiés** tels que **OnComponentBeginOverlap** (et OnComponentEndOverlap, OnComponentHit). Cela offre un contrôle plus fin : on réagit précisément au composant touché et non à l'ensemble de l'acteur. Les mêmes conditions s'appliquent (`Generate Overlap Events` à true sur les composants concernés).",
        "keypoints": [
          "Plus précis que par Actor : réagir au composant touché",
          "Ajout depuis le panneau **Détails** du composant",
          "Nœuds : **OnComponentBeginOverlap** / EndOverlap / Hit",
          "Nécessite **Generate Overlap Events** = true"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Gérer l'overlap au niveau du composant"
      },
      {
        "title": "Custom Events (événements personnalisés)",
        "body": "Les **Custom Events** permettent de créer ses propres événements, soit **utilisés au sein du même Blueprint**, soit **appelés depuis d'autres BP** en leur passant une référence. On les crée par **clic droit → Add Custom Event** dans l'event graph. Une fois créé, on l'**appelle comme un nœud d'exécution normal**. Ils sont **très pratiques pour organiser son code** en le répartissant dans plusieurs graphs (par exemple un graph « CameraSetPosition » séparé du graph principal). Ils servent aussi au **binding des Event Dispatchers** (pattern observer). On peut leur ajouter des paramètres d'entrée personnalisés.",
        "keypoints": [
          "Créés par clic droit → **Add Custom Event**",
          "Appelés comme un nœud d'exécution normal",
          "Dans le même BP ou un autre BP via référence",
          "Organisent le code (plusieurs graphs) et servent au **binding**"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "À quoi servent les Custom Events ?"
      },
      {
        "title": "Les events d'input et l'ancien système (< UE 5.1)",
        "body": "Dans un jeu il faut réagir aux événements clavier/souris pour créer de l'interaction. Un clic droit dans un Blueprint donne accès à des nœuds d'input : on peut réagir quand une touche **s'enfonce (Pressed)** ou **se relâche (Released)**. Le problème d'un input « brut » comme la touche F : ce n'est pas explicite, et si plusieurs BP réagissent à F ou si le jeu passe sur mobile/console, la gestion devient difficile. **Avant UE 5.1**, on créait des **Action Mappings** et **Axis Mappings** dans **Project Settings > Input > Bindings** : on définissait par exemple une action **« Fire »** au nom explicite, à laquelle on **mappait toutes les touches/boutons** susceptibles de la déclencher. Ce système est aujourd'hui **déprécié** au profit de l'Enhanced Input.",
        "keypoints": [
          "Réaction sur touche **Pressed** ou **Released**",
          "**Action Mappings** (bool) et **Axis Mappings** (float)",
          "Configuré dans **Project Settings > Input > Bindings**",
          "**Déprécié** depuis UE 5.1, remplacé par l'**Enhanced Input**"
        ],
        "versionNote": "Le support de cours situe l'ancien système « < UE 5.1 ». En UE 5.4, les Action/Axis Mappings existent encore pour compatibilité mais sont dépréciés : privilégier l'Enhanced Input.",
        "tier": 2,
        "front": "L'ancien système d'input (< UE 5.1)"
      },
      {
        "title": "Enhanced Input System : vue d'ensemble",
        "body": "L'**Enhanced Input** est le nouveau système d'entrée, **activé par défaut** dans Unreal Engine 5.4. Il fournit des fonctionnalités avancées : gestion complexe des entrées, **remappage du contrôle en runtime**, et **compatibilité descendante** avec le système d'input d'UE4. Son grand atout : on peut **ajouter et supprimer des contextes de mapping au moment de l'exécution**, ce qui facilite la gestion d'un grand nombre d'actions et permet de **modifier le comportement d'une entrée selon l'état du joueur**. Exemple : un personnage peut marcher, sprinter ou être couché ; en permutant le contexte de mapping, la touche **CTRL** peut s'accroupir (en marchant), glisser (en sprintant) ou se relever (couché). Le système repose sur **quatre concepts principaux** : **Input Actions**, **Input Mapping Contexts**, **Input Modifiers** et **Input Triggers**. On crée ces ressources depuis le Content Browser via **Ajouter (+) → catégorie Entrée / Input**.",
        "keypoints": [
          "**Activé par défaut** dans UE 5.4 ; remappage **runtime**",
          "Ajout/suppression de **contextes** en cours d'exécution",
          "Comportement d'une entrée adaptable à l'état du joueur",
          "4 concepts : **Input Actions**, **IMC**, **Modifiers**, **Triggers**"
        ],
        "versionNote": "Le support indique « Enhanced Input (UE 5.2 ++) ». En réalité l'Enhanced Input est le système par défaut depuis UE 5.1 (sources Epic), et il l'est toujours dans UE 5.4.",
        "tier": 2,
        "front": "L'Enhanced Input System : vue d'ensemble"
      },
      {
        "title": "Input Actions et types de valeur",
        "body": "Les **Input Actions** sont le **lien de communication** entre l'Enhanced Input et le code du projet. Elles sont l'équivalent conceptuel des Action/Axis Mappings, mais ce sont des **ressources de données (Data Assets)** et non des propriétés du projet. Chaque action représente quelque chose que l'utilisateur peut faire (« Accroupi », « Tirer »). On peut ajouter des **Input Listeners** en Blueprint (clic droit dans l'event graph, taper le nom de l'action) ou en C++. Le **type de valeur** détermine le comportement : **Digital (bool)** = état activé/désactivé, pour un bouton de manette ou une touche (équivalent de l'Action Mapping) ; **Axis1D (float)** = valeur flottante, pour les gâchettes (équivalent de l'Axis Mapping) ; **Axis2D (FVector2D)** = pour les sticks analogiques ; **Axis3D (FVector 3D)** = pour des données plus complexes comme un contrôleur de mouvement. On peut aussi donner une description et préciser si l'input est consommé après écoute.",
        "keypoints": [
          "Lien Enhanced Input ↔ code : ce sont des **Data Assets**",
          "**Digital** (bool) : bouton/touche — ex. Action Mapping",
          "**Axis1D** (float) : gâchettes ; **Axis2D** : sticks analogiques",
          "**Axis3D** (FVector) : données complexes (motion controllers)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Input Actions et types de valeur"
      },
      {
        "title": "Trigger States (états d'une action)",
        "body": "Une Input Action passe par différents **Trigger States** ; on peut se lier à un état précis en Blueprint comme en C++. **Triggered (Déclenchée)** : l'action a été déclenchée, toutes les exigences du déclencheur ont été évaluées et validées (ex. un trigger « Press and Release » est envoyé au relâchement) — c'est l'état le plus utilisé. **Started (Démarrée)** : un événement a lancé l'évaluation (ex. la première pression d'un « Double Tap » appelle Started une fois). **Ongoing (En cours)** : le déclencheur est encore en cours de traitement (ex. un « Press and Hold » est en cours pendant qu'on maintient le bouton avant que la durée requise soit atteinte ; peut se déclencher à chaque tick). **Canceled (Annulée)** : le déclenchement a été annulé (ex. on relâche avant que le « Press and Hold » n'aboutisse). **Completed (Terminée)** : le processus d'évaluation du déclencheur est terminé.",
        "keypoints": [
          "**Triggered** : exigences validées, action déclenchée (le plus utilisé)",
          "**Started** : l'évaluation vient de commencer (1re pression)",
          "**Ongoing** : déclencheur en cours (Press and Hold maintenu)",
          "**Canceled** : annulé (relâche trop tôt) ; **Completed** : terminé"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Les Trigger States d'une Input Action"
      },
      {
        "title": "Input Mapping Contexts et priorité",
        "body": "Un **Input Mapping Context (IMC)** est une **collection d'Input Actions** représentant un contexte dans lequel le joueur peut se trouver ; il décrit les **règles qui déclenchent chaque Input Action**. Structure hiérarchique : au sommet la **liste des Input Actions** ; sous chaque action, la **liste des entrées utilisateur** (touches, boutons, axes de mouvement) qui peuvent la déclencher ; au niveau le plus bas, les **Input Triggers et Input Modifiers** appliqués à chaque entrée. C'est **dans l'IMC que sont implémentées les liaisons réelles** entre un input physique et une Input Action. On crée un IMC via clic droit dans le Content Browser → Input → Input Mapping Context. Les IMC peuvent être **ajoutés dynamiquement, supprimés ou hiérarchisés** par joueur. La **priorité** : si plusieurs contextes mappent la même action, celui de **priorité la plus élevée l'emporte** et les autres sont ignorés. Utiliser des IMC **mutuellement exclusifs** évite les collisions d'input (ex. un IMC commun + un IMC véhicule ajouté à l'entrée dans le véhicule et retiré à la sortie).",
        "keypoints": [
          "Collection d'**Input Actions** décrivant les règles de déclenchement",
          "Hiérarchie : Actions → entrées → **Triggers**/**Modifiers**",
          "Liaisons réelles input↔action définies dans l'**IMC**",
          "**Priorité** : le contexte le plus prioritaire gagne, les autres ignorés"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Input Mapping Contexts (IMC) et priorité"
      },
      {
        "title": "Input Modifiers (Negate, Swizzle…)",
        "body": "Les **Input Modifiers** sont des **préprocesseurs** qui modifient la valeur d'entrée **brute** avant qu'elle n'atteigne les Input Triggers. UE propose divers modificateurs : modifier l'ordre des axes, **inverser la valeur (Negate)**, appliquer des **zones mortes (dead zones)**, convertir en World Space, appliquer une sensibilité, lisser les entrées sur plusieurs images, ou adapter le comportement selon l'état du joueur. Cas typique : gérer un déplacement 2D depuis des touches unidirectionnelles (ZQSD ou flèches). Comme chaque touche fournit une valeur positive 1D occupant l'axe X, il faut : **Negate** pour inverser certaines touches (passer de 1 à -1, ex. gauche et bas), et **Swizzle Input Axis Values** pour que certaines touches s'inscrivent sur l'axe Y au lieu de l'axe X (ex. haut et bas). Ainsi Z→+Y (Swizzle), Q→-X (Negate), S→-Y (Negate + Swizzle), D→+X (aucun) : un ensemble d'entrées 1D est interprété comme une unique valeur d'entrée 2D.",
        "keypoints": [
          "Préprocesseurs sur la valeur **brute**, avant les **Triggers**",
          "**Negate** : inverse la valeur (1 → -1)",
          "**Swizzle Input Axis Values** : réaffecte l'axe (X → Y)",
          "ZQSD → Axis2D : Z=+Y, Q=-X, S=-Y (Negate+Swizzle), D=+X"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Input Modifiers : Negate et Swizzle"
      },
      {
        "title": "Event Dispatchers (pattern observer)",
        "body": "Les **Event Dispatchers** implémentent le **pattern observer** pour prévenir plusieurs abonnés sans couplage fort. Retenir le vocabulaire (comparaison Unity) : **Call = `invoke()`** (déclencher/émettre l'événement) et **Bind = `AddEventListener()`** (s'abonner). On crée un dispatcher via le **+** dans la section Event Dispatchers du BP (ex. `DeathEventDispatcher`) ; on peut lui **ajouter des paramètres d'entrée** (ou copier la signature d'un autre event). Pour l'**émettre**, on glisse le dispatcher sur le graph et on choisit **Call**. Pour **s'abonner**, un autre BP (ou le Level Blueprint) récupère une référence (ex. via GetAllActorsOfClass au BeginPlay) et fait un **Bind Event to** en tirant de la pin Event vers un **Custom Event**. **ATTENTION** : les bind consomment des ressources ; quand ils ne servent plus il faut **unbind** (RemoveEventListener). On peut tout désabonner d'un coup, ou désabonner un event précis (mais cela devient vite « spaghetti »). **Bonne pratique** : dédier un graph au bind/unbind pour garder l'event graph principal lisible.",
        "keypoints": [
          "Pattern observer : **Call** = invoke(), **Bind** = AddEventListener()",
          "Créé via **+** dans la section Event Dispatchers",
          "Émission : **Call** ; abonnement : **Bind Event to** + Custom Event",
          "Toujours **unbind** quand inutile ; graph dédié aux bind/unbind"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Event Dispatchers (pattern observer)"
      }
    ],
    "quiz": [
      {
        "q": "Quelle affirmation décrit correctement l'apparence et le rôle d'un Event dans un EventGraph Blueprint ?",
        "choices": [
          "Un nœud rouge sans pin d'entrée, départ d'un réseau de nœuds",
          "Un nœud bleu doté d'une pin d'entrée reliée au nœud précédent",
          "Un nœud vert qui retourne toujours une valeur en sortie",
          "Un cadre coloré servant seulement à documenter le graph"
        ],
        "answer": 0,
        "explain": "Les Events sont rouges et n'ont pas de pin d'exécution en entrée : ils constituent le point de départ d'une chaîne de nœuds, déclenchée par le moteur ou par le développeur.",
        "difficulty": "facile",
        "topic": "Nature et principes des Events",
        "def": {
          "term": "Event (Blueprint)",
          "text": "Nœud rouge sans pin d'exécution en entrée qui démarre un réseau de nœuds, appelé par le moteur (Tick, BeginPlay, collisions) ou par le développeur."
        }
      },
      {
        "q": "Dans un même EventGraph, combien d'événements d'un même type (ex. Event BeginPlay) peut-on placer ?",
        "choices": [
          "Autant qu'on veut du même type, ils s'additionnent tous",
          "Un seul de chaque type, mais plusieurs types par graph",
          "Exactement trois par graph, comme les trois events par défaut proposés",
          "Aucune limite, mais seuls les deux premiers s'exécutent"
        ],
        "answer": 1,
        "explain": "N'importe quel nombre d'événements peut être utilisé dans un EventGraph, mais un seul de chaque type est autorisé dans un même graph.",
        "difficulty": "moyen",
        "topic": "Nature et principes des Events",
        "def": {
          "term": "EventGraph",
          "text": "Graphe d'un Blueprint contenant les réseaux d'événements. Il accepte plusieurs events, mais un seul exemplaire de chaque type d'event."
        }
      },
      {
        "q": "Un Blueprint veut prévenir plusieurs autres Blueprints qu'un événement s'est produit, sans les connaître à l'avance. Quel mécanisme est le plus adapté ?",
        "choices": [
          "Appeler directement une fonction en dur sur chacun des Blueprints",
          "Sonder l'état en continu depuis l'Event Tick de chaque Blueprint",
          "Émettre un Event Dispatcher auquel les intéressés s'abonnent",
          "Créer une variable globale que tous les Blueprints viennent lire"
        ],
        "answer": 2,
        "explain": "L'Event Dispatcher (pattern observer) permet de notifier tous les abonnés. Le Call émet l'événement (équivalent Invoke) et les autres s'abonnent via Bind (équivalent AddEventListener).",
        "difficulty": "moyen",
        "topic": "Communication entre Blueprints",
        "def": {
          "term": "Event Dispatcher",
          "text": "Mécanisme du pattern observer : un BP émet (Call/Invoke) un événement et les abonnés (Bind/AddEventListener) sont notifiés, sans couplage fort."
        }
      },
      {
        "q": "Quels sont les trois événements principaux proposés à la création d'une Blueprint Class ?",
        "choices": [
          "Event Construct, Event EndPlay, Event ActorEndOverlap",
          "Event BeginPlay, Event Tick, Event ActorBeginOverlap",
          "Event Hit, Event Input Axis, Event Dispatcher",
          "Event Awake, Event Update, Event OnTriggerEnter"
        ],
        "answer": 1,
        "explain": "Les trois events principaux d'une Blueprint Class sont BeginPlay, Tick (vus au chapitre précédent) et ActorBeginOverlap. (Awake/Update/OnTriggerEnter sont des noms Unity.)",
        "difficulty": "facile",
        "topic": "Event ActorBeginOverlap et les 3 events principaux",
        "def": {
          "term": "Blueprint Class",
          "text": "Classe créée dans l'éditeur ; à sa création, trois events sont proposés d'emblée : BeginPlay, Tick et ActorBeginOverlap."
        }
      },
      {
        "q": "Quel paramètre l'Event ActorBeginOverlap fournit-il pour identifier l'acteur qui a provoqué le chevauchement ?",
        "choices": [
          "Le paramètre Hit Result",
          "Le paramètre Overlap Index",
          "Le paramètre Other Actor",
          "Le paramètre Instigator"
        ],
        "answer": 2,
        "explain": "ActorBeginOverlap fournit le paramètre Other Actor, qui référence l'acteur ayant commencé à chevaucher la collision.",
        "difficulty": "facile",
        "topic": "Event ActorBeginOverlap et les 3 events principaux",
        "def": {
          "term": "Other Actor",
          "text": "Paramètre fourni par l'Event ActorBeginOverlap : référence vers l'acteur qui est entré en chevauchement avec la collision de cet Actor."
        }
      },
      {
        "q": "Pour qu'un Event ActorBeginOverlap se déclenche entre deux acteurs, quelle condition sur la propriété Generate Overlap Events est requise ?",
        "choices": [
          "Elle doit être à true sur les DEUX acteurs concernés",
          "Elle doit être à true sur au moins un des deux acteurs",
          "Elle n'a aucun effet, l'overlap se déclenche toujours",
          "Elle doit être à false pour autoriser le chevauchement"
        ],
        "answer": 0,
        "explain": "ActorBeginOverlap ne s'exécute que si la propriété Generate Overlap Events est définie sur true sur les deux acteurs qui se chevauchent.",
        "difficulty": "moyen",
        "topic": "Collision Events : Overlap vs Hit",
        "def": {
          "term": "Generate Overlap Events",
          "text": "Propriété qui doit valoir true sur les deux acteurs pour que les events Actor/Component BeginOverlap et EndOverlap se déclenchent."
        }
      },
      {
        "q": "Quelle propriété doit valoir true pour que l'Event Hit s'exécute lors d'une collision solide ?",
        "choices": [
          "Simulation Generates Overlap Events",
          "Simulation Generates Hit Events",
          "Can Ever Affect Navigation Mesh",
          "Enable Gravity On Simulation"
        ],
        "answer": 1,
        "explain": "L'Event Hit ne s'exécute que si la propriété Simulation Generates Hit Events de l'un des acteurs de la collision vaut true. Generate Overlap Events concerne les overlaps, pas les hits.",
        "difficulty": "moyen",
        "topic": "Collision Events : Overlap vs Hit",
        "def": {
          "term": "Simulation Generates Hit Events",
          "text": "Propriété qui, à true sur l'un des acteurs, permet le déclenchement de l'Event Hit lors d'une collision bloquante (sweep, simulation physique)."
        }
      },
      {
        "q": "Pourquoi préférer souvent l'Event OnComponentBeginOverlap à l'Event ActorBeginOverlap ?",
        "choices": [
          "Parce qu'il compile plus vite que l'Event ActorBeginOverlap",
          "Parce qu'il réagit au niveau d'un composant précis, plus finement",
          "Parce qu'il ne réclame aucune propriété de collision activée",
          "Parce qu'il continue de fonctionner même quand le jeu est en pause"
        ],
        "answer": 1,
        "explain": "OnComponentBeginOverlap se gère au niveau d'un composant (ex. une Box Collision) plutôt que de l'Actor entier, ce qui donne un contrôle plus précis. On l'ajoute depuis le panneau Détails du composant.",
        "difficulty": "moyen",
        "topic": "Event OnComponentBeginOverlap",
        "def": {
          "term": "OnComponentBeginOverlap",
          "text": "Event de collision au niveau d'un composant (Box, Sphere Collision…) plutôt que de l'Actor entier, offrant un contrôle plus fin sur la réaction."
        }
      },
      {
        "q": "Comment crée-t-on un Custom Event dans un event graph, et comment l'utilise-t-on ensuite ?",
        "choices": [
          "Clic droit → Add Custom Event ; on l'appelle comme un nœud normal",
          "Project Settings → Events ; on l'appelle via la console de commandes",
          "En héritant d'une classe C++ ; on ne peut l'appeler qu'en C++",
          "Via le menu Compile ; il s'exécute automatiquement à chaque frame"
        ],
        "answer": 0,
        "explain": "On crée un Custom Event par clic droit → Add Custom Event. Une fois créé, il s'appelle comme n'importe quel nœud d'exécution, dans le même BP ou dans un autre BP via une référence.",
        "difficulty": "facile",
        "topic": "Custom Events",
        "def": {
          "term": "Custom Event",
          "text": "Événement personnalisé créé via clic droit → Add Custom Event ; appelé comme un nœud d'exécution, il organise le code et sert au binding des dispatchers."
        }
      },
      {
        "q": "Dans l'ancien système d'input (< UE 5.1), où définissait-on les Action Mappings et Axis Mappings ?",
        "choices": [
          "Dans le Content Browser via un Data Asset dédié",
          "Dans Project Settings > Input > Bindings",
          "Directement dans chaque Blueprint via un Custom Event",
          "Dans un fichier .ini édité à la main uniquement"
        ],
        "answer": 1,
        "explain": "L'ancien système se configurait dans Project Settings > Input > Bindings (catégorie Engine > Input), où l'on créait des Action Mappings (bool) et Axis Mappings (float) au nom explicite.",
        "difficulty": "moyen",
        "topic": "Events d'input et ancien système (< UE 5.1)",
        "def": {
          "term": "Action / Axis Mappings",
          "text": "Ancien système d'input (< UE 5.1) configuré dans Project Settings > Input : Action Mappings (bool) et Axis Mappings (float). Déprécié au profit de l'Enhanced Input."
        }
      },
      {
        "q": "Dans Unreal Engine 5.4, quel est le statut de l'Enhanced Input System par rapport à l'ancien système d'Action/Axis Mappings ?",
        "choices": [
          "L'ancien système est le seul disponible, Enhanced Input reste expérimental",
          "Enhanced Input est activé par défaut ; l'ancien système est déprécié",
          "Les deux sont désactivés, il faut coder tous les inputs en C++",
          "Enhanced Input ne fonctionne que sur console, jamais sur PC ni Mac"
        ],
        "answer": 1,
        "explain": "Depuis UE 5.1, l'Enhanced Input est activé par défaut et constitue le standard ; l'ancien système d'Action/Axis Mappings est déprécié (conservé pour compatibilité). Cela reste vrai dans UE 5.4.",
        "difficulty": "moyen",
        "topic": "Enhanced Input System",
        "def": {
          "term": "Enhanced Input",
          "text": "Système d'entrée d'UE, activé par défaut depuis UE 5.1 (et dans 5.4). Remappage runtime, contextes dynamiques, compatibilité UE4 ; remplace Action/Axis Mappings."
        }
      },
      {
        "q": "Quels sont les quatre concepts principaux de l'Enhanced Input System ?",
        "choices": [
          "Action Mappings, Axis Mappings, Key Bindings et Console Commands",
          "Input Actions, Input Mapping Contexts, Input Modifiers, Input Triggers",
          "Input Events, Input Ticks, Input Overlaps et Input Collisions",
          "Input Calls, Input Bindings, Input Unbindings et Input Dispatchers finaux"
        ],
        "answer": 1,
        "explain": "L'Enhanced Input repose sur quatre concepts : Input Actions, Input Mapping Contexts, Input Modifiers et Input Triggers.",
        "difficulty": "moyen",
        "topic": "Enhanced Input System",
        "def": {
          "term": "Enhanced Input : 4 concepts",
          "text": "Le système repose sur quatre briques : Input Actions, Input Mapping Contexts, Input Modifiers et Input Triggers."
        }
      },
      {
        "q": "Qu'est-ce qu'une Input Action dans l'Enhanced Input, techniquement ?",
        "choices": [
          "Une propriété du projet stockée dans les Project Settings Input",
          "Un Data Asset faisant le lien entre Enhanced Input et le code",
          "Un composant physique attaché directement à chaque Actor",
          "Une fonction C++ compilée et non modifiable en éditeur"
        ],
        "answer": 1,
        "explain": "Une Input Action est un Data Asset (ressource de données) qui sert de lien de communication entre l'Enhanced Input et le code. C'est l'équivalent conceptuel des Action/Axis Mappings, mais sous forme d'asset et non de propriété de projet.",
        "difficulty": "moyen",
        "topic": "Input Actions et types de valeur",
        "def": {
          "term": "Input Action",
          "text": "Data Asset servant de lien entre l'Enhanced Input et le code. Chaque action (Tirer, Accroupi) a un type de valeur (Digital, Axis1D/2D/3D)."
        }
      },
      {
        "q": "Pour lire un stick analogique (direction + intensité sur deux axes), quel type de valeur d'Input Action choisir ?",
        "choices": [
          "Digital, un booléen",
          "Axis1D, un simple float",
          "Axis2D, un FVector2D",
          "Axis3D, un FVector"
        ],
        "answer": 2,
        "explain": "Un stick analogique se lit avec une Input Action de type Axis2D, dont la valeur est un FVector2D (X et Y). Digital = bouton (bool), Axis1D = gâchette (float), Axis3D = données 3D (ex. motion controller).",
        "difficulty": "moyen",
        "topic": "Input Actions et types de valeur",
        "def": {
          "term": "Types de valeur (Input Action)",
          "text": "Digital (bool) = bouton ; Axis1D (float) = gâchette ; Axis2D (FVector2D) = stick analogique ; Axis3D (FVector) = données 3D (motion controller)."
        }
      },
      {
        "q": "Dans les Trigger States de l'Enhanced Input, que signifie l'état « Triggered » ?",
        "choices": [
          "L'évaluation du déclencheur vient tout juste de commencer",
          "Les exigences du déclencheur validées, action lancée",
          "Le déclenchement a été annulé avant d'avoir pu aboutir",
          "L'action est maintenue mais n'est pas encore validée"
        ],
        "answer": 1,
        "explain": "« Triggered » signifie que toutes les exigences du déclencheur ont été satisfaites et que l'action est effectivement déclenchée. C'est l'état le plus couramment utilisé.",
        "difficulty": "moyen",
        "topic": "Trigger States",
        "def": {
          "term": "Triggered",
          "text": "État où toutes les exigences du déclencheur sont validées et l'action est effectivement déclenchée ; c'est le Trigger State le plus utilisé."
        }
      },
      {
        "q": "Pour un déclencheur « Press and Hold », quel Trigger State est actif pendant que l'utilisateur maintient le bouton AVANT que la durée requise soit atteinte ?",
        "choices": [
          "Completed (terminé)",
          "Triggered (déclenché)",
          "Ongoing (en cours)",
          "Started (démarré)"
        ],
        "answer": 2,
        "explain": "Pendant le maintien, avant que la durée requise ne soit atteinte, l'état est « Ongoing » (le déclencheur est encore en cours de traitement, il peut se répéter à chaque tick). Il devient « Triggered » une fois la durée atteinte, ou « Canceled » si on relâche trop tôt.",
        "difficulty": "difficile",
        "topic": "Trigger States",
        "def": {
          "term": "Ongoing",
          "text": "État d'un déclencheur encore en cours de traitement (ex. Press and Hold pendant le maintien, avant la durée requise) ; peut se répéter à chaque tick."
        }
      },
      {
        "q": "Qu'est-ce qu'un Input Mapping Context (IMC) dans l'Enhanced Input ?",
        "choices": [
          "Un unique bouton associé à une seule touche physique du clavier",
          "Une collection d'Input Actions et leurs règles de déclenchement",
          "Un modificateur qui inverse la valeur brute d'un axe de mouvement",
          "Le graph dédié où l'on branche tous les Event Dispatchers du BP"
        ],
        "answer": 1,
        "explain": "Un IMC est une collection d'Input Actions représentant un contexte du joueur ; il décrit les règles (touches, triggers, modifiers) qui déclenchent chaque action. C'est là que sont implémentées les liaisons réelles input↔action.",
        "difficulty": "moyen",
        "topic": "Input Mapping Contexts et priorité",
        "def": {
          "term": "Input Mapping Context (IMC)",
          "text": "Collection d'Input Actions décrivant un contexte du joueur ; c'est là que sont liées les entrées physiques aux actions. Ajoutable/priorisable en runtime."
        }
      },
      {
        "q": "Si plusieurs Input Mapping Contexts mappent la même Input Action, lequel est pris en compte ?",
        "choices": [
          "Celui qui a été ajouté en premier, chronologiquement",
          "Tous en même temps, leurs valeurs étant simplement additionnées",
          "Celui de priorité la plus élevée, les autres sont ignorés",
          "Aucun : le conflit désactive purement l'action visée"
        ],
        "answer": 2,
        "explain": "En cas de conflit sur une même action, le contexte de priorité la plus élevée est pris en compte et les autres sont ignorés. Des IMC mutuellement exclusifs évitent aussi les collisions d'input.",
        "difficulty": "moyen",
        "topic": "Input Mapping Contexts et priorité",
        "def": {
          "term": "Priorité des IMC",
          "text": "Quand plusieurs contextes mappent la même Input Action, celui de priorité la plus élevée l'emporte et les autres sont ignorés."
        }
      },
      {
        "q": "À quoi servent les Input Modifiers dans l'Enhanced Input ?",
        "choices": [
          "À générer de nouveaux Custom Events dans l'event graph principal",
          "À transformer la valeur d'entrée brute avant les Input Triggers",
          "À définir la priorité d'un Input Mapping Context donné",
          "À compiler le Blueprint d'input bien plus rapidement"
        ],
        "answer": 1,
        "explain": "Les Input Modifiers sont des préprocesseurs qui modifient la valeur brute reçue par UE avant de la transmettre aux déclencheurs : inversion (Negate), zones mortes, sensibilité, lissage, conversion World Space, réordonnancement des axes (Swizzle), etc.",
        "difficulty": "moyen",
        "topic": "Input Modifiers (Negate, Swizzle)",
        "def": {
          "term": "Input Modifier",
          "text": "Préprocesseur qui transforme la valeur d'entrée brute avant les Input Triggers : Negate, Swizzle, dead zone, sensibilité, lissage, World Space…"
        }
      },
      {
        "q": "Pour piloter un déplacement 2D (Axis2D) avec les touches ZQSD, quels modificateurs permettent de faire pointer les touches « haut/bas » sur l'axe Y et d'inverser « gauche/bas » ?",
        "choices": [
          "Dead Zone pour rediriger vers l'axe Y, et Scalar pour inverser",
          "Swizzle Input Axis Values vers l'axe Y, et Negate pour inverser",
          "World Space pour rediriger vers l'axe Y, puis Smooth pour inverser",
          "FOV Scaling pour rediriger vers l'axe Y, et Clamp pour inverser"
        ],
        "answer": 1,
        "explain": "Chaque touche fournit une valeur positive 1D sur l'axe X. On applique Swizzle Input Axis Values pour que haut/bas s'inscrivent sur l'axe Y, et Negate pour inverser gauche et bas (1 → -1). Ainsi Z=+Y (Swizzle), Q=-X (Negate), S=-Y (Negate+Swizzle), D=+X (aucun).",
        "difficulty": "difficile",
        "topic": "Input Modifiers (Negate, Swizzle)",
        "def": {
          "term": "Swizzle / Negate",
          "text": "Swizzle Input Axis Values réaffecte l'axe (X→Y) ; Negate inverse la valeur (1→-1). Combinés, ils transforment 4 touches 1D (ZQSD) en une entrée Axis2D."
        }
      },
      {
        "q": "Dans le vocabulaire des Event Dispatchers (comparé à Unity), à quoi correspondent respectivement Call et Bind ?",
        "choices": [
          "Call = AddEventListener() (écouter), Bind = Invoke() (émettre)",
          "Call = Invoke() (émettre), Bind = AddEventListener()",
          "Call = Start() (démarrer), Bind = Update() (chaque frame)",
          "Call = Destroy() (détruire), Bind = Instantiate() (créer)"
        ],
        "answer": 1,
        "explain": "Call correspond à Invoke() : on émet/déclenche l'événement. Bind correspond à AddEventListener() : on s'abonne pour être notifié.",
        "difficulty": "facile",
        "topic": "Event Dispatchers (pattern observer)",
        "def": {
          "term": "Call / Bind",
          "text": "Vocabulaire des Event Dispatchers : Call = Invoke() (émettre l'événement) ; Bind = AddEventListener() (s'abonner). Toujours penser à unbind ensuite."
        }
      },
      {
        "q": "Pourquoi faut-il penser à faire un unbind (RemoveEventListener) des Event Dispatchers, et quelle bonne pratique le cours recommande-t-il ?",
        "choices": [
          "Les bind ne coûtent rien : il est totalement inutile de les retirer un jour",
          "Les bind coûtent des ressources : retirer l'inutile via un graph dédié",
          "Il faut unbind uniquement en C++, jamais depuis un Blueprint",
          "Le unbind sert seulement à recolorer les nœuds de l'event graph"
        ],
        "answer": 1,
        "explain": "Les bind consomment des ressources ; quand ils ne sont plus utiles il faut les retirer (unbind). Pour éviter un event graph « spaghetti », le cours recommande un graph dédié aux bind/unbind.",
        "difficulty": "moyen",
        "topic": "Event Dispatchers (pattern observer)",
        "def": {
          "term": "Unbind",
          "text": "Désabonnement d'un Event Dispatcher (RemoveEventListener). Indispensable car les bind coûtent des ressources ; bonne pratique : un graph dédié aux bind/unbind."
        }
      }
    ],
    "sources": [
      {
        "label": "Enhanced Input in Unreal Engine — Documentation officielle Epic (concepts, valeurs, trigger states, activé par défaut)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/enhanced-input-in-unreal-engine"
      },
      {
        "label": "ETriggerState — API Enhanced Input (états Triggered/Started/Ongoing/Canceled/Completed)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Plugins/EnhancedInput/ETriggerState"
      },
      {
        "label": "Unreal Engine 5.1 Release Notes — Enhanced Input devient le système par défaut",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5.1-release-notes?application_version=5.1&lang=en-US"
      },
      {
        "label": "Collision in Unreal Engine - Overview (Overlap vs Hit, Generate Overlap Events, Simulation Generates Hit Events)",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/collision-in-unreal-engine---overview"
      },
      {
        "label": "Events in Unreal Engine — Documentation officielle (Custom Events, ActorBeginOverlap)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/events-in-unreal-engine"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/4AUR78-56jk/hqdefault.jpg",
        "caption": "Miniature du tuto « Event Begin Play and Event Tick » : les deux events du cycle de vie d'un Blueprint.",
        "credit": "YouTube — Event Begin Play and Event Tick (Unreal Blueprints Tutorial 07)",
        "link": "https://www.youtube.com/watch?v=4AUR78-56jk"
      },
      {
        "url": "https://img.youtube.com/vi/j53dLKWihE0/hqdefault.jpg",
        "caption": "Miniature du tuto « UE5 Enhanced Input Basics & Overview » : Input Actions, Mapping Context et déclenchement des events d'entrée.",
        "credit": "YouTube — UE5 Enhanced Input Basics & Overview",
        "link": "https://www.youtube.com/watch?v=j53dLKWihE0"
      }
    ],
    "links": [
      {
        "label": "Doc officielle Epic — Events dans Unreal Engine (BeginPlay, Tick, Overlap, Hit, Custom Events)",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/events-in-unreal-engine?lang=en-US",
        "kind": "doc"
      },
      {
        "label": "Doc officielle Epic — Enhanced Input (Input Actions, Mapping Contexts, Modifiers, Triggers)",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/enhanced-input-in-unreal-engine?lang=en-US",
        "kind": "doc"
      },
      {
        "label": "Vidéo YouTube — Event Begin Play & Event Tick expliqués (Blueprints)",
        "url": "https://www.youtube.com/watch?v=4AUR78-56jk",
        "kind": "youtube"
      },
      {
        "label": "Tuto communautaire Epic — Enhanced Input in UE5 (mise en place pas à pas)",
        "url": "https://dev.epicgames.com/community/learning/tutorials/eD13/unreal-engine-enhanced-input-in-ue5",
        "kind": "doc"
      }
    ]
  },
  {
    "id": "signaux",
    "num": "S",
    "special": true,
    "title": "Signaux — Event Dispatchers & Communication BP",
    "summary": "Approfondissement expert (UE 5.4) sur les « signaux » en Blueprint : le pattern Observateur et les Event Dispatchers (dynamic multicast delegates). Couvre les 4 méthodes de communication entre Blueprints (Direct, Cast To, Interface, Event Dispatcher), la création et l'usage complet d'un dispatcher (Call/broadcast, Bind Event, Assign, Unbind, Unbind All, Inputs), le découplage / couplage faible, le bon moment pour binder (BeginPlay), la gestion des références nulles, l'ordre de broadcast et les pièges classiques.",
    "topics": [
      "Pattern Observateur (émetteur / abonnés)",
      "4 méthodes de communication BP",
      "Communication directe (référence)",
      "Cast To (Blueprint Casting)",
      "Blueprint Interface",
      "Event Dispatcher : création",
      "Call / broadcast",
      "Bind Event to",
      "Assign (Bind + Custom Event)",
      "Unbind / Unbind All",
      "Inputs / paramètres du dispatcher",
      "Couplage faible / découplage",
      "Timing du Bind (BeginPlay)",
      "Ordre de broadcast & références nulles",
      "Dynamic multicast delegates",
      "Pièges courants"
    ],
    "fiches": [
      {
        "title": "Les « signaux » en Blueprint : le pattern Observateur",
        "body": "En Unreal, un « signal » désigne un mécanisme **événementiel de type Observateur** : un Blueprint **émet** un événement (broadcast) et un ou plusieurs autres Blueprints, qui s'y sont **abonnés** (bind), y **réagissent**. L'émetteur ne connaît pas ses abonnés : il se contente d'annoncer « ceci vient de se produire », sans savoir qui écoute ni combien. En Blueprint, ce pattern se réalise principalement via les **Event Dispatchers** (des *delegates* exposés au Blueprint). C'est l'inverse d'un appel direct où un objet commande explicitement un autre : ici, on **publie** un signal et les intéressés **s'abonnent** librement. Cette inversion de contrôle est la clé du **découplage** : on peut ajouter/retirer des abonnés sans jamais toucher au code de l'émetteur.",
        "keypoints": [
          "Émetteur **broadcast** ; abonnés **bind** et réagissent",
          "L'émetteur **ignore** qui l'écoute et combien",
          "Réalisé en BP via les **Event Dispatchers**",
          "Inversion de contrôle → **découplage** fort"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Le pattern « signal » (Observateur) en Blueprint"
      },
      {
        "title": "Les 4 méthodes de communication entre Blueprints",
        "body": "Epic distingue quatre grandes approches pour faire dialoguer deux Blueprints, du couplage le plus fort au plus faible :\n\n1. **Communication directe (référence)** — on stocke une référence vers l'autre acteur et on appelle directement ses membres. *Couplage fort*, un-vers-un.\n2. **Cast To (Blueprint Casting)** — on convertit une référence générique (ex. Other Actor) vers une classe précise pour accéder à ses membres. *Couplage moyen à fort*.\n3. **Blueprint Interface** — un contrat de fonctions que plusieurs classes différentes implémentent chacune à leur façon. *Couplage faible*, un-vers-plusieurs (types hétérogènes).\n4. **Event Dispatcher** — l'émetteur broadcast un signal, les abonnés réagissent. *Couplage faible*, **un-vers-plusieurs** (pattern Observateur).\n\nRègle de choix : **Direct/Cast** quand on connaît précisément la cible et qu'on veut une réponse immédiate ; **Interface** quand des objets de types variés doivent répondre au même appel ; **Event Dispatcher** quand un événement doit **notifier plusieurs systèmes** sans que l'émetteur les connaisse.",
        "keypoints": [
          "**Direct** : couplage fort, un-vers-un",
          "**Cast To** : cible d'une classe connue",
          "**Interface** : plusieurs types répondent différemment",
          "**Event Dispatcher** : un-vers-plusieurs (broadcast)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Les 4 méthodes de communication entre Blueprints"
      },
      {
        "title": "Communication directe (référence)",
        "body": "La méthode la plus simple : on crée une **variable de type référence** (ex. `BP_Door`) et on l'assigne à une instance précise, puis on tire depuis cette référence pour appeler ses **fonctions/events** ou lire/écrire ses **variables publiques**. On obtient la référence soit via le **Return Value** d'un *Spawn Actor from Class*, soit en exposant une variable *Instance Editable* et en la pointant dans le niveau, soit par *Get All Actors of Class* / overlap.\n\n**Avantages** : direct, immédiat, facile à comprendre, permet une réponse synchrone.\n**Inconvénients** : **couplage fort** — l'émetteur doit connaître le type exact de la cible et détenir une référence valide ; peu réutilisable ; casse si la référence est **nulle** (acteur détruit ou non encore spawné). À réserver aux relations simples et stables entre deux acteurs précis.",
        "keypoints": [
          "Une **variable référence** vers une instance précise",
          "Accès direct aux fonctions/events/variables publiques",
          "Réponse **immédiate** et synchrone",
          "**Couplage fort** + risque de référence nulle"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Communication directe par référence"
      },
      {
        "title": "Cast To (Blueprint Casting)",
        "body": "Le **Cast To** convertit une référence générique (souvent un `Actor` renvoyé par un overlap, un line trace, *Get Player Character*...) vers une **classe précise**. Si l'objet **est** bien de ce type, le cast réussit (pin *exec* principal) et donne accès à l'interface de cette classe ; sinon il échoue (pin **Cast Failed**) et on évite ainsi une erreur.\n\n**Avantages** : vérification de type sûre avant l'accès ; fonctionne sur des acteurs découverts à l'exécution ; utile pour le polymorphisme.\n**Inconvénients** : crée un **couplage à une classe précise** (le Blueprint qui caste doit référencer/charger cette classe, ce qui alourdit les dépendances et le chargement en mémoire) ; multiplier les casts vers des classes différentes devient vite lourd. Quand plusieurs types doivent répondre, préférer une **Interface** ou un **Event Dispatcher**.",
        "keypoints": [
          "Convertit une réf **générique** vers une **classe précise**",
          "Pin **Cast Failed** pour gérer l'échec proprement",
          "Sûr pour les acteurs découverts en runtime",
          "Couple à la classe castée (dépendance / mémoire)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Cast To (Blueprint Casting)"
      },
      {
        "title": "Blueprint Interface",
        "body": "Une **Blueprint Interface** est un **contrat** : une liste de fonctions (avec entrées/sorties) sans implémentation. Plusieurs Blueprints, même de types totalement différents, peuvent **implémenter** cette interface et fournir chacun leur propre logique. On appelle alors la fonction d'interface sur n'importe quelle référence : si l'objet implémente l'interface, sa version s'exécute — sinon rien (ou un *Does Implement Interface* de contrôle).\n\n**Avantages** : **découplage** (on dépend du contrat, pas de la classe concrète) ; plusieurs types hétérogènes répondent au même message chacun à sa façon ; peut transmettre et renvoyer des variables ; passe très bien à l'échelle (ajouter un nouvel objet interactif = juste implémenter l'interface).\n**Inconvénients** : un peu plus de mise en place ; l'appel reste **déclenché par l'appelant** (ce n'est pas un broadcast un-vers-plusieurs automatique comme un dispatcher). Idéal pour « faire agir » divers objets via un même verbe (ex. `Interact`, `TakeDamage`).",
        "keypoints": [
          "**Contrat** implémenté par des classes variées",
          "On dépend du **contrat**, pas de la classe concrète",
          "Peut **passer ET renvoyer** des variables",
          "Extensible ; l'appel reste **initié par l'appelant**"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Blueprint Interface : un contrat de fonctions"
      },
      {
        "title": "Event Dispatcher : rôle et quand l'utiliser",
        "body": "Un **Event Dispatcher** permet à un Blueprint de **signaler son état / un événement** à qui veut l'écouter. On lui **lie** (bind) un ou plusieurs events, et lorsqu'on **l'appelle** (Call), **tous** les events liés se déclenchent. C'est le mécanisme **un-vers-plusieurs** (multicast) : un seul émetteur, plusieurs abonnés indépendants. Documentation Epic 5.4 : « Allows a Blueprint Class to report on its state to the Level Blueprint. »\n\n**Quand l'utiliser** : diffuser un changement d'état ou un événement significatif à **plusieurs systèmes** qui ne devraient pas se connaître entre eux — ex. « le joueur a pris des dégâts », « le piège s'est déclenché », « la vague est terminée ». L'émetteur **n'a pas besoin de connaître** ses abonnés : c'est le meilleur choix pour un **couplage faible** et une architecture extensible. À éviter si l'on a besoin d'une **valeur de retour** (le dispatcher est à sens unique) — préférer alors Interface/appel direct.",
        "keypoints": [
          "**Bind** = abonner un event ; **Call** = déclencher tous les events",
          "Communication **un-vers-plusieurs** (multicast)",
          "Émetteur totalement **découplé** de ses abonnés",
          "**Sens unique** : pas de valeur de retour"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "C'est quoi un Event Dispatcher et quand l'utiliser ?"
      },
      {
        "title": "Créer un Event Dispatcher",
        "body": "Dans l'éditeur Blueprint, ouvrir le panneau **My Blueprint**, repérer la catégorie **Event Dispatchers** et cliquer sur le **+** ; nommer le dispatcher (convention : préfixe `On...`, ex. `OnHealthChanged`, `OnTrapTriggered`). Le dispatcher sélectionné se configure dans le **Details panel** : **Tooltip**, **Category**, et surtout les **Inputs** (paramètres). \n\nOn peut ensuite glisser le dispatcher dans un graphe pour poser ses différents nodes (Call, Bind, Unbind, Assign). Note d'interface : contrairement à une fonction, **double-cliquer** sur l'entrée d'un dispatcher n'ouvre pas un graphe éditable — sa « signature » se modifie via les Inputs du Details panel. Un dispatcher est un **membre de la classe** : toutes les instances de ce Blueprint le possèdent.",
        "keypoints": [
          "Panneau **My Blueprint** → **Event Dispatchers** → **+**",
          "Convention : préfixe **On...** (OnHealthChanged)",
          "Config (Inputs, Category) dans le **Details panel**",
          "**Membre de classe** : présent sur chaque instance"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Créer un Event Dispatcher"
      },
      {
        "title": "Call : émettre le signal (broadcast)",
        "body": "Le node **Call [Dispatcher]** est ce qui **émet** le signal : « Calling an Event Dispatcher with a Call node causes all of the events bound to the Event Dispatcher to fire. » Tant que le dispatcher n'est **pas appelé**, binder ne produit rien : le Call est l'action déclenchante. On peut placer **plusieurs** nodes Call pour un même dispatcher, dans une Blueprint Class **ou** dans le Level Blueprint.\n\nSi le dispatcher a des **Inputs**, le node Call expose des **pins d'entrée** : les valeurs qu'on y branche sont transmises à **tous** les abonnés. Point clé : au moment du Call, **tous les events actuellement liés** s'exécutent — ceux qui se lieront *après* ne recevront **pas** ce broadcast précis (voir fiche sur le timing).",
        "keypoints": [
          "**Call** déclenche **tous** les events liés au dispatcher",
          "Sans Call, le **bind** ne produit aucun effet",
          "Plusieurs Call possibles (BP Class ou Level BP)",
          "Les **Inputs** branchés sont diffusés à tous les abonnés"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Call : émettre le signal (broadcast)"
      },
      {
        "title": "Bind Event to : s'abonner au signal",
        "body": "Pour qu'un Blueprint **réagisse** à un dispatcher, il pose un node **Bind Event to [Dispatcher]** sur la **référence de l'émetteur** (pin *Target*) et branche, sur le **pin rouge carré « Event »** (le pin *delegate*), un **Custom Event** (ou une fonction/event compatible) qui contiendra sa réaction. Ce Custom Event doit avoir **les mêmes paramètres** que les Inputs du dispatcher.\n\nDétail important : le **Target** désigne **quelle instance** on écoute. Dans une **Blueprint Class** qui écoute son propre dispatcher, le Target vaut **Self**. Dans le **Level Blueprint** (ou pour écouter un *autre* acteur), le Target doit pointer une **référence d'instance spécifique** (sinon rien n'est écouté). Le Bind ne se fait qu'**une fois** (typiquement au BeginPlay) : il installe l'abonnement de façon persistante jusqu'à un Unbind.",
        "keypoints": [
          "**Bind Event to** sur la référence émettrice (**Target**)",
          "Pin rouge **Event** → y brancher un **Custom Event**",
          "Custom Event = **mêmes paramètres** que les Inputs",
          "Target = **Self** en BP Class, instance précise en Level BP"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Bind Event to : s'abonner à un dispatcher"
      },
      {
        "title": "Assign : Bind + Custom Event automatiques",
        "body": "**Assign** est un raccourci de confort : en le choisissant sur un dispatcher (menu du dispatcher ou menu contextuel), Unreal crée **automatiquement** un node **Bind Event** ET un **Custom Event**, **déjà câblés ensemble**. Le Custom Event généré porte déjà les **bons paramètres** correspondant aux Inputs du dispatcher — on n'a plus qu'à écrire la logique de réaction à sa suite.\n\nC'est strictement équivalent à poser un *Bind Event to* puis à tirer depuis son pin rouge un *Add Custom Event*, mais en un seul geste. Pratique pour s'abonner vite et sans erreur de signature. À noter : Assign reste une opération de **bind** — il faut toujours l'exécuter au bon moment (souvent BeginPlay) et sur la bonne référence *Target*.",
        "keypoints": [
          "**Assign** = Bind Event + Custom Event pré-câblés en un clic",
          "Le Custom Event reçoit d'office les **paramètres** du dispatcher",
          "Équivaut à Bind Event to + Add Custom Event manuel",
          "Reste un **bind** : dépend du bon timing et du bon Target"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Assign : Bind + Custom Event automatiques"
      },
      {
        "title": "Unbind et Unbind All : se désabonner",
        "body": "Deux nodes permettent d'**annuler** un abonnement :\n\n- **Unbind Event from [Dispatcher]** : retire **un** event précis (même Custom Event + même Target) de la liste d'abonnés du dispatcher. Après ça, ce Custom Event ne réagira plus aux futurs Call.\n- **Unbind All Events from [Dispatcher]** : retire **tous** les events liés à ce dispatcher pour la Target donnée.\n\nDésabonner est utile pour éviter des réactions indésirables (ex. UI cachée qui ne doit plus se mettre à jour) ou pour de l'hygiène de cycle de vie (souvent dans **EndPlay**). Bien que le broadcast d'un dispatcher **ignore automatiquement les objets détruits/expirés** (delegate dynamique — pas de crash), désabonner explicitement dans EndPlay reste une **bonne pratique** pour un état propre et prévisible.",
        "keypoints": [
          "**Unbind Event** = retire **un** abonnement précis",
          "**Unbind All** = retire **tous** les events pour la Target",
          "Souvent dans **EndPlay** (hygiène de cycle de vie)",
          "Le broadcast **ignore déjà** les objets expirés (pas de crash)"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Unbind et Unbind All : se désabonner"
      },
      {
        "title": "Inputs (paramètres) d'un Event Dispatcher",
        "body": "Un dispatcher peut **transporter des données**. Dans le Details panel du dispatcher, section **Inputs**, cliquer **New**, nommer le paramètre et choisir son **type** ; on peut définir une valeur par défaut, l'option **passer par référence** et réordonner les pins avec les flèches. Ces Inputs définissent la **signature** du signal.\n\nConséquences en jeu :\n- Le node **Call** expose alors des **pins d'entrée** : les valeurs branchées sont **diffusées** à tous les abonnés.\n- Chaque **Custom Event** abonné doit avoir la **même signature** (mêmes types, même ordre) pour recevoir ces valeurs. Assign/Bind génèrent d'ailleurs un Custom Event déjà conforme.\n\nExemple : `OnHealthChanged (NewHealth: Float, MaxHealth: Float)` — l'acteur santé broadcast les nouvelles valeurs, et la barre de vie les reçoit directement, sans jamais caster ni interroger l'acteur.",
        "keypoints": [
          "Ajoutés via **Details panel → Inputs → New** (nom + type)",
          "Ils forment la **signature** diffusée à tous les abonnés",
          "Le node **Call** expose alors des pins d'entrée",
          "Chaque **Custom Event** abonné doit avoir la même signature"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Inputs : faire transporter des données au signal"
      },
      {
        "title": "Couplage faible : dispatcher vs appel direct vs interface",
        "body": "Le principal atout d'un Event Dispatcher est le **couplage faible**. Comparaison :\n\n- **Appel direct / Cast** : l'émetteur **doit connaître** la classe cible et détenir une référence — dépendance forte, référence/chargement de la classe, fragile si la cible change ou est nulle.\n- **Interface** : découple les *types*, mais c'est **l'appelant** qui déclenche l'action sur une cible connue (il tient une référence à qui il parle).\n- **Event Dispatcher** : l'émetteur **ne connaît pas** ses abonnés ; ce sont **les abonnés** qui vont vers lui pour s'inscrire. On ajoute/retire des systèmes réactifs (analytics, son, UI, achievements...) **sans modifier** l'émetteur.\n\nEn résumé : le dispatcher **inverse la dépendance** — au lieu de « A appelle B », on a « A publie, B (et C, D...) s'abonnent ». C'est ce qui évite les casts en cascade et les dépendances circulaires, et rend le code extensible.",
        "keypoints": [
          "**Direct/Cast** : émetteur dépend de la classe cible",
          "**Interface** : découple les types, mais l'appelant déclenche",
          "**Dispatcher** : l'émetteur **ignore** ses abonnés",
          "Ajouter des réactions **sans toucher** à l'émetteur"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Couplage faible : dispatcher vs direct vs interface"
      },
      {
        "title": "Binder au bon moment : timing, ordre, références nulles",
        "body": "**Quand binder ?** En général **une seule fois au démarrage**, typiquement dans **BeginPlay**, quand les acteurs concernés existent. Ne jamais binder dans **Event Tick** (on empilerait des abonnements en double à chaque frame). \n\n**Références nulles** : un Bind Event a besoin d'une **Target valide** ; si la référence de l'émetteur est *None* au moment du bind, l'abonnement échoue silencieusement. Il faut donc s'assurer que l'émetteur est **déjà spawné/résolu** — d'où l'importance de l'ordre d'initialisation (utiliser un *IsValid*, ou binder côté abonné après avoir obtenu la référence).\n\n**Timing du broadcast** : au moment du **Call**, seuls les abonnés **déjà liés** réagissent. Si un abonné binde **après** le broadcast, il **rate** ce signal. **Ordre d'exécution** : lors d'un broadcast, tous les abonnés s'exécutent, mais **l'ordre n'est pas garanti** — ne jamais faire dépendre la logique de l'ordre d'abonnement.",
        "keypoints": [
          "Binder **une fois** au **BeginPlay** ; jamais dans **Tick**",
          "**Target** nulle → bind échoué en silence (vérifier IsValid)",
          "Binder **après** le Call = signal manqué",
          "**Ordre** d'exécution des abonnés **non garanti**"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Binder au bon moment : timing, ordre, refs nulles"
      },
      {
        "title": "Sous le capot (delegates) & pièges courants",
        "body": "Un Event Dispatcher Blueprint est, techniquement, un **dynamic multicast delegate** exposé au Blueprint (`BlueprintAssignable`). *Dynamic* = sérialisable et bindable par nom/réflexion (donc utilisable dans les graphes) ; *multicast* = plusieurs fonctions peuvent y être liées et sont toutes appelées par **Broadcast()**. Deux corollaires officiels : les fonctions liées **ne renvoient pas de valeur** (sens unique) et **l'ordre d'exécution au Broadcast n'est pas défini**. Le node *Bind Event* utilise une sémantique **AddUnique** : re-binder exactement le même event sur la même cible **ne crée pas de doublon**.\n\n**Pièges fréquents** :\n- **Oublier le Call** (ou oublier de binder) → le signal semble « ne rien faire ».\n- **Binder trop tard** (après le broadcast) → signal manqué.\n- **Binder dans Tick** → abonnements multiples.\n- **Target nulle / mauvaise instance** (surtout en Level Blueprint) → aucun abonnement effectif.\n- **Attendre une valeur de retour** d'un dispatcher → impossible, choisir Interface/appel direct.\n- **Dépendre de l'ordre des abonnés** → non fiable.",
        "keypoints": [
          "Dispatcher = **dynamic multicast delegate** (BlueprintAssignable)",
          "Sens unique + **ordre de broadcast non défini**",
          "**Bind Event = AddUnique** (pas de doublon)",
          "Pièges : Call/bind oublié, bind trop tard/dans Tick, Target nulle"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Sous le capot : delegates et pièges courants"
      }
    ],
    "quiz": [
      {
        "q": "En Unreal Engine, un « signal » (pattern Observateur) désigne un mécanisme où :",
        "choices": [
          "un Blueprint diffuse un événement et ses abonnés y réagissent",
          "un Blueprint recopie ses variables dans un autre à chaque frame",
          "le moteur échange des paquets réseau entre serveurs distants",
          "un matériau transmet sa couleur de base à un static mesh"
        ],
        "answer": 0,
        "explain": "Le pattern Observateur repose sur un émetteur qui publie un événement et des abonnés qui s'y sont inscrits et réagissent. En Blueprint, on le réalise via les Event Dispatchers.",
        "difficulty": "facile",
        "topic": "Pattern Observateur",
        "def": {
          "term": "Pattern Observateur",
          "text": "Modèle où un émetteur publie un événement et des abonnés inscrits y réagissent, sans que l'émetteur connaisse leur identité ni leur nombre."
        }
      },
      {
        "q": "Combien de grandes méthodes de communication entre Blueprints Epic distingue-t-il classiquement ?",
        "choices": [
          "Deux : communication directe et Blueprint Interface",
          "Trois : Cast To, Interface et Event Dispatcher",
          "Quatre : direct, Cast To, Interface, dispatcher",
          "Six : direct, Cast, Interface, dispatcher, RPC, timer"
        ],
        "answer": 2,
        "explain": "Les quatre approches sont : communication directe (référence), Cast To (Blueprint Casting), Blueprint Interface et Event Dispatcher, du couplage le plus fort au plus faible.",
        "difficulty": "facile",
        "topic": "4 méthodes de communication",
        "def": {
          "term": "Communication Blueprint",
          "text": "Epic distingue 4 méthodes pour faire dialoguer des Blueprints : directe, Cast To, Interface et Event Dispatcher, du couplage le plus fort au plus faible."
        }
      },
      {
        "q": "Quelle méthode offre le couplage le plus faible ET une communication « un-vers-plusieurs » ?",
        "choices": [
          "La référence directe",
          "Le Blueprint Casting",
          "L'Event Dispatcher",
          "La Blueprint Interface"
        ],
        "answer": 2,
        "explain": "L'Event Dispatcher permet un broadcast un-vers-plusieurs où l'émetteur ignore ses abonnés : c'est le couplage le plus faible parmi les quatre méthodes.",
        "difficulty": "moyen",
        "topic": "Couplage faible",
        "def": {
          "term": "Couplage faible",
          "text": "Dépendance minimale entre Blueprints : l'émetteur ignore ses abonnés. L'Event Dispatcher l'offre via un broadcast un-vers-plusieurs (multicast)."
        }
      },
      {
        "q": "Où crée-t-on un Event Dispatcher dans l'éditeur Blueprint (UE 5.4) ?",
        "choices": [
          "Dans le panneau My Blueprint, section Event Dispatchers",
          "Dans le Content Browser, via un clic droit puis Delegate",
          "Dans les Project Settings, section Delegates du moteur",
          "Dans les Class Settings, près des Interfaces ajoutées"
        ],
        "answer": 0,
        "explain": "On ouvre le panneau My Blueprint, on repère la catégorie Event Dispatchers et on clique sur le +, puis on nomme le dispatcher. Sa configuration se fait ensuite dans le Details panel.",
        "difficulty": "facile",
        "topic": "Création d'un dispatcher",
        "def": {
          "term": "Créer un dispatcher",
          "text": "Se crée dans le panneau My Blueprint, catégorie Event Dispatchers, via le bouton + ; se configure ensuite (Inputs, Category) dans le Details panel."
        }
      },
      {
        "q": "Quel node émet (déclenche) un Event Dispatcher ?",
        "choices": [
          "Le node Bind",
          "Le node Call",
          "Le node Assign",
          "Le node Unbind"
        ],
        "answer": 1,
        "explain": "Le node Call fait feu : « Calling an Event Dispatcher with a Call node causes all of the events bound to the Event Dispatcher to fire. » Sans Call, binder ne produit rien.",
        "difficulty": "facile",
        "topic": "Call / broadcast",
        "def": {
          "term": "Call (broadcast)",
          "text": "Node qui émet le signal : appeler un Event Dispatcher déclenche tous les events qui lui sont liés à cet instant."
        }
      },
      {
        "q": "Que fait exactement le node Call d'un Event Dispatcher ?",
        "choices": [
          "Il enregistre un nouvel abonné au dispatcher",
          "Il déclenche les events liés au dispatcher",
          "Il retire le dispatcher de la classe courante",
          "Il renvoie la liste des abonnés actuels"
        ],
        "answer": 1,
        "explain": "Call déclenche l'ensemble des events liés au dispatcher au moment de l'appel. Ceux qui se lieront après ne recevront pas ce broadcast précis.",
        "difficulty": "moyen",
        "topic": "Call / broadcast",
        "def": {
          "term": "Broadcast",
          "text": "Émettre le signal : le Call exécute tous les events actuellement liés au dispatcher ; ceux liés après ne reçoivent pas ce broadcast précis."
        }
      },
      {
        "q": "Comment un Blueprint s'abonne-t-il à l'Event Dispatcher d'un autre Blueprint ?",
        "choices": [
          "Avec un Bind Event to sur la référence émettrice",
          "En castant l'émetteur à chaque frame dans Event Tick",
          "En recopiant le dispatcher dans une variable locale",
          "En appelant un node Broadcast sur sa propre instance"
        ],
        "answer": 0,
        "explain": "On utilise Bind Event to [Dispatcher] avec le pin Target pointant l'instance émettrice, et on branche un Custom Event sur son pin delegate rouge.",
        "difficulty": "moyen",
        "topic": "Bind Event to",
        "def": {
          "term": "Bind Event to",
          "text": "Node qui abonne un Custom Event au dispatcher d'un émetteur ; le pin Target désigne l'instance écoutée (Self ou une référence précise)."
        }
      },
      {
        "q": "Sur un node Bind Event to, à quoi sert le pin rouge carré « Event » (pin delegate) ?",
        "choices": [
          "À brancher la référence de l'acteur écouté",
          "À connecter le Custom Event qui réagira",
          "À définir la priorité d'exécution de l'abonné",
          "À récupérer la valeur de retour du dispatcher"
        ],
        "answer": 1,
        "explain": "Le pin rouge est le pin delegate : on y relie un Custom Event (ou une fonction compatible) qui contient la réaction. Depuis ce pin on peut tirer un Add Custom Event.",
        "difficulty": "moyen",
        "topic": "Bind Event to",
        "def": {
          "term": "Pin delegate",
          "text": "Pin rouge carré « Event » d'un Bind Event : on y relie le Custom Event qui s'exécutera à chaque Call du dispatcher."
        }
      },
      {
        "q": "Que produit l'option/node Assign d'un Event Dispatcher ?",
        "choices": [
          "Seulement un node Call vers l'émetteur",
          "Un Bind Event et un Custom Event pré-câblés",
          "Une variable Delegate à assigner à la main",
          "Un Cast To automatique vers l'acteur émetteur"
        ],
        "answer": 1,
        "explain": "Assign est un raccourci : il pose un Bind Event et un Custom Event pré-connectés, ce dernier ayant déjà la bonne signature (les paramètres du dispatcher).",
        "difficulty": "moyen",
        "topic": "Assign",
        "def": {
          "term": "Assign",
          "text": "Raccourci qui pose d'un clic un Bind Event et un Custom Event déjà câblés, ce dernier ayant la signature (Inputs) du dispatcher."
        }
      },
      {
        "q": "Que fait le node Unbind All Events from [Dispatcher] ?",
        "choices": [
          "Il supprime le dispatcher de la classe émettrice",
          "Il retire tous les events liés à cette Target",
          "Il retire seulement le dernier event abonné",
          "Il bloque tout futur bind sur ce dispatcher"
        ],
        "answer": 1,
        "explain": "Unbind All Events retire l'ensemble des abonnements pour la cible ; Unbind Event (au singulier) ne retire qu'un event précis.",
        "difficulty": "moyen",
        "topic": "Unbind / Unbind All",
        "def": {
          "term": "Unbind All Events",
          "text": "Node qui retire d'un coup tous les events abonnés à un dispatcher pour la Target donnée ; Unbind Event n'en retire qu'un seul."
        }
      },
      {
        "q": "L'ordre dans lequel les abonnés s'exécutent lors d'un broadcast est-il garanti ?",
        "choices": [
          "Oui, toujours dans l'ordre d'abonnement",
          "Oui, dans l'ordre inverse d'abonnement",
          "Non, l'ordre reste indéfini au Call",
          "Oui, par ordre alphabétique des acteurs"
        ],
        "answer": 2,
        "explain": "La doc officielle précise que l'ordre d'exécution des fonctions liées lors du Broadcast n'est pas défini : il ne faut jamais faire dépendre la logique de cet ordre.",
        "difficulty": "difficile",
        "topic": "Ordre de broadcast",
        "def": {
          "term": "Ordre de broadcast",
          "text": "Au Broadcast, tous les abonnés s'exécutent mais dans un ordre non défini : ne jamais faire dépendre la logique de l'ordre d'abonnement."
        }
      },
      {
        "q": "Un Event Dispatcher peut-il renvoyer une valeur à l'émetteur ?",
        "choices": [
          "Oui, via un pin Return Value sur le Call",
          "Non, la communication est à sens unique",
          "Oui, mais seulement avec un unique abonné",
          "Oui, à l'aide d'un node Get Return dédié"
        ],
        "answer": 1,
        "explain": "Les multicast delegates (donc les Event Dispatchers) ne peuvent pas utiliser de valeur de retour : la communication est unidirectionnelle. Pour un retour, préférer une Interface ou un appel direct.",
        "difficulty": "moyen",
        "topic": "Event Dispatcher : rôle",
        "def": {
          "term": "Sens unique",
          "text": "Un Event Dispatcher (multicast delegate) ne renvoie aucune valeur : communication unidirectionnelle. Pour un retour, préférer Interface ou appel direct."
        }
      },
      {
        "q": "Combien d'abonnés peuvent être liés à un même Event Dispatcher ?",
        "choices": [
          "Un unique abonné à la fois",
          "Deux abonnés au maximum autorisés",
          "Plusieurs abonnés indépendants",
          "Aucun sans interface dédiée"
        ],
        "answer": 2,
        "explain": "Un Event Dispatcher est un dynamic MULTICAST delegate : plusieurs events/objets peuvent s'y lier et sont tous appelés lors du Call/Broadcast.",
        "difficulty": "moyen",
        "topic": "Dynamic multicast delegates",
        "def": {
          "term": "Multicast",
          "text": "Un Event Dispatcher accepte plusieurs abonnés : tous les events liés sont appelés au broadcast (delegate multicast, un-vers-plusieurs)."
        }
      },
      {
        "q": "À quel moment binde-t-on généralement un Event Dispatcher ?",
        "choices": [
          "Dans Event Tick, chaque frame",
          "Au démarrage, dans BeginPlay",
          "Seulement au moment de l'EndPlay",
          "Jamais : bind auto à la compilation"
        ],
        "answer": 1,
        "explain": "On binde une fois au démarrage (BeginPlay), quand les acteurs existent. Binder dans Tick empilerait des abonnements en double à chaque frame.",
        "difficulty": "moyen",
        "topic": "Timing du Bind",
        "def": {
          "term": "Timing du Bind",
          "text": "On binde une seule fois au démarrage (BeginPlay), quand les acteurs existent ; jamais dans Tick, sinon les abonnements se dupliquent chaque frame."
        }
      },
      {
        "q": "Un abonné exécute son Bind Event APRÈS que l'émetteur a déjà fait son Call. Que se passe-t-il ?",
        "choices": [
          "L'abonné rejoue le signal manqué automatiquement",
          "L'abonné rate ce Call, mais capte les suivants",
          "Le moteur relance le broadcast pour ce retardataire",
          "Une erreur de compilation est levée aussitôt"
        ],
        "answer": 1,
        "explain": "Le Call ne notifie que les abonnés déjà liés à cet instant. Un bind trop tardif rate le broadcast : d'où l'importance de binder assez tôt (BeginPlay).",
        "difficulty": "difficile",
        "topic": "Timing du Bind",
        "def": {
          "term": "Bind tardif",
          "text": "Le Call ne notifie que les abonnés déjà liés ; un Bind exécuté après le broadcast rate ce signal et ne captera que les Call suivants."
        }
      },
      {
        "q": "Dans un Level Blueprint, à quoi doit être connecté le Target d'un Bind Event to ?",
        "choices": [
          "À Self, l'instance du Level Blueprint",
          "À une référence d'instance de l'émetteur",
          "À la classe de l'acteur, pas une instance",
          "À rien : le Target y est optionnel"
        ],
        "answer": 1,
        "explain": "Dans le Level Blueprint, le Target doit pointer une instance précise de l'acteur écouté ; sinon aucun abonnement effectif. En Blueprint Class écoutant son propre dispatcher, le Target vaut Self.",
        "difficulty": "moyen",
        "topic": "Bind Event to",
        "def": {
          "term": "Target (Level BP)",
          "text": "Le pin Target désigne l'instance écoutée. Dans le Level Blueprint, il doit pointer une référence d'instance précise de l'émetteur, sinon rien n'écoute."
        }
      },
      {
        "q": "Dans une Blueprint Class, quel est le Target par défaut pour un node de dispatcher appelé sur elle-même ?",
        "choices": [
          "Self, l'instance courante",
          "Le GameMode de la partie",
          "Le Player Controller joueur",
          "Aucun, à fournir à la main"
        ],
        "answer": 0,
        "explain": "Quand une Blueprint Class agit sur son propre dispatcher, le Target vaut Self par défaut, ce qui affecte l'instance courante.",
        "difficulty": "moyen",
        "topic": "Bind Event to",
        "def": {
          "term": "Self",
          "text": "Dans une Blueprint Class agissant sur son propre dispatcher, le Target vaut Self par défaut : l'action porte sur l'instance courante."
        }
      },
      {
        "q": "Techniquement, un Event Dispatcher Blueprint repose sur quel type sous-jacent ?",
        "choices": [
          "Un Timer répété du moteur",
          "Un dynamic multicast delegate",
          "Une variable booléenne globale",
          "Un appel RPC réseau répliqué"
        ],
        "answer": 1,
        "explain": "Sous le capot, un Event Dispatcher est un dynamic multicast delegate : dynamic (sérialisable/bindable par réflexion, donc utilisable en Blueprint) et multicast (plusieurs abonnés appelés par Broadcast).",
        "difficulty": "difficile",
        "topic": "Dynamic multicast delegates",
        "def": {
          "term": "Dynamic multicast delegate",
          "text": "Type sous-jacent d'un Event Dispatcher (BlueprintAssignable) : dynamic = bindable par réflexion en BP, multicast = plusieurs abonnés appelés par Broadcast()."
        }
      },
      {
        "q": "À quoi servent les Inputs (paramètres) d'un Event Dispatcher ?",
        "choices": [
          "À renommer proprement le dispatcher",
          "À transmettre des données aux abonnés",
          "À fixer le nombre maximal d'abonnés",
          "À choisir la classe cible du dispatcher"
        ],
        "answer": 1,
        "explain": "Les Inputs définissent la signature du signal ; le node Call expose alors des pins d'entrée dont les valeurs sont diffusées à tous les abonnés. Chaque Custom Event abonné doit avoir la même signature.",
        "difficulty": "moyen",
        "topic": "Inputs / paramètres",
        "def": {
          "term": "Inputs du dispatcher",
          "text": "Paramètres définissant la signature du signal ; leurs valeurs, branchées sur le Call, sont diffusées à chaque Custom Event abonné (même signature)."
        }
      },
      {
        "q": "Quel est un inconvénient majeur du Cast To pour communiquer ?",
        "choices": [
          "Il ne marche jamais sur un acteur runtime",
          "Il couple à une classe et la charge",
          "Il ne lit pas les variables de la cible",
          "Il est réservé au seul Level Blueprint"
        ],
        "answer": 1,
        "explain": "Le Cast To couple à une classe concrète : le Blueprint qui caste doit connaître et charger cette classe (dépendance et charge mémoire). Multiplier les casts vers des types variés devient lourd.",
        "difficulty": "moyen",
        "topic": "Cast To",
        "def": {
          "term": "Cast To",
          "text": "Convertit une référence générique vers une classe précise ; inconvénient : couple à cette classe et la charge en mémoire (dépendance accrue)."
        }
      },
      {
        "q": "Quel est l'avantage clé d'une Blueprint Interface ?",
        "choices": [
          "Elle garantit l'ordre d'exécution des abonnés",
          "Des types variés répondent au même appel",
          "Elle renvoie toujours une valeur au dispatcher",
          "Elle rend le node BeginPlay superflu"
        ],
        "answer": 1,
        "explain": "Une interface est un contrat implémenté par des classes hétérogènes ; on dépend du contrat, pas de la classe concrète, ce qui découple et passe très bien à l'échelle.",
        "difficulty": "moyen",
        "topic": "Blueprint Interface",
        "def": {
          "term": "Blueprint Interface",
          "text": "Contrat de fonctions implémenté par des classes hétérogènes : chacune répond au même appel à sa façon. On dépend du contrat, pas de la classe."
        }
      },
      {
        "q": "Principal inconvénient de la communication directe (référence directe) ?",
        "choices": [
          "Impossible pour les acteurs placés au niveau",
          "Couplage fort, référence valide requise",
          "Elle ne transmet jamais aucune variable",
          "Elle impose toujours une interface dédiée"
        ],
        "answer": 1,
        "explain": "La référence directe est simple mais couple fortement : l'émetteur doit connaître le type exact et détenir une référence valide, sinon la logique casse (référence nulle).",
        "difficulty": "facile",
        "topic": "Communication directe",
        "def": {
          "term": "Communication directe",
          "text": "Une variable référence pointe une instance précise pour appeler ses membres. Simple, mais couplage fort : casse si la référence devient nulle."
        }
      },
      {
        "q": "Un signal ne se déclenche jamais chez les abonnés. Quelle est la cause la plus probable ?",
        "choices": [
          "Le dispatcher possède trop d'Inputs",
          "Aucun Call émis, ou aucun Bind fait",
          "Le dispatcher est passé en single-cast",
          "Le moteur limite un broadcast par seconde"
        ],
        "answer": 1,
        "explain": "Sans Call, rien n'est émis ; sans Bind (ou avec un bind trop tardif / une Target nulle), personne n'écoute. Ce sont les deux oublis les plus fréquents.",
        "difficulty": "difficile",
        "topic": "Pièges courants",
        "def": {
          "term": "Pièges courants",
          "text": "Un signal muet vient presque toujours d'un Call oublié ou d'un Bind manquant (ou trop tardif, ou posé sur une Target nulle)."
        }
      },
      {
        "q": "Que se passe-t-il si l'on exécute deux fois le même node Bind Event vers le même Custom Event et la même Target ?",
        "choices": [
          "Le Custom Event se déclenche deux fois par Call",
          "L'event reste lié une fois, sans doublon",
          "Cela provoque un crash au prochain broadcast",
          "Le second bind écrase l'ancien dispatcher"
        ],
        "answer": 1,
        "explain": "Le node Bind Event ajoute de façon unique (AddUnique) : re-binder exactement le même event sur la même cible ne crée pas de doublon, donc pas de double déclenchement.",
        "difficulty": "difficile",
        "topic": "Bind Event to",
        "def": {
          "term": "AddUnique (Bind Event)",
          "text": "Le node Bind Event ajoute l'abonnement de façon unique : re-binder le même Custom Event sur la même Target ne crée pas de doublon."
        }
      },
      {
        "q": "Une barre de vie (UI) doit se mettre à jour quand le joueur perd des PV. Quel est le montage idiomatique ?",
        "choices": [
          "La barre caste le joueur chaque frame pour lire ses PV",
          "Le composant santé broadcast, l'UI s'y abonne",
          "Le joueur référence directement chaque widget",
          "Le GameMode recopie les PV dans l'UI au Tick"
        ],
        "answer": 1,
        "explain": "Le pattern idiomatique : l'émetteur (composant santé) broadcast OnHealthChanged avec les nouvelles valeurs, et la barre de vie s'y abonne. Découplage total, pas de cast ni de polling par frame.",
        "difficulty": "moyen",
        "topic": "Exemple concret",
        "def": {
          "term": "Montage idiomatique",
          "text": "L'émetteur (composant santé) broadcast OnHealthChanged avec les valeurs ; la barre de vie s'y abonne au BeginPlay. Découplage total, sans cast ni polling."
        }
      },
      {
        "q": "Un acteur abonné est détruit sans avoir fait Unbind, puis l'émetteur broadcast. Que se passe-t-il ?",
        "choices": [
          "Le jeu crashe immédiatement au broadcast",
          "Broadcast ignore l'objet expiré, sans crash",
          "Le dispatcher est supprimé de la classe",
          "Tous les autres abonnés sont ignorés ensuite"
        ],
        "answer": 1,
        "explain": "Broadcast() n'appelle pas les objets expirés/détruits : pas de crash. Cependant, désabonner explicitement (souvent dans EndPlay) garde un état propre et prévisible.",
        "difficulty": "difficile",
        "topic": "Unbind / références nulles",
        "def": {
          "term": "Références expirées",
          "text": "Broadcast() n'appelle pas les objets détruits/expirés : pas de crash. Désabonner (Unbind) dans EndPlay reste une bonne pratique d'hygiène."
        }
      }
    ],
    "sources": [
      {
        "label": "Event Dispatchers in Unreal Engine (doc officielle, version 5.4)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/event-dispatchers-in-unreal-engine?application_version=5.4"
      },
      {
        "label": "Blueprint Communications in Unreal Engine (doc officielle)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-communications-in-unreal-engine"
      },
      {
        "label": "Calling Event Dispatchers in Unreal Engine (doc officielle)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/calling-event-dispatchers-in-unreal-engine"
      },
      {
        "label": "Event Dispatchers and Delegates Quick Start Guide (doc officielle)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/event-dispatchers-and-delegates-quick-start-guide-in-unreal-engine"
      },
      {
        "label": "Multicast Delegates in Unreal Engine (doc officielle, culture delegates)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/multicast-delegates-in-unreal-engine"
      },
      {
        "label": "Creating Dispatcher Events in Unreal Engine (doc officielle)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/creating-dispatcher-events-in-unreal-engine"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/5GYsTTcGGJo/hqdefault.jpg",
        "caption": "Event Dispatchers dans UE5 : Bind / Broadcast pour la communication entre Blueprints.",
        "credit": "Buvesa Game Development (YouTube)",
        "link": "https://www.youtube.com/watch?v=5GYsTTcGGJo"
      },
      {
        "url": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Observer.svg",
        "caption": "Schema du patron Observateur (Subject/Observer) : le concept derriere les Event Dispatchers.",
        "credit": "WikiSolved, Wikimedia Commons (domaine public)",
        "link": "https://commons.wikimedia.org/wiki/File:Observer.svg"
      }
    ],
    "links": [
      {
        "label": "Forum Epic - Cast, Event Dispatchers ou Blueprint Interface : lequel choisir ?",
        "url": "https://forums.unrealengine.com/t/what-should-i-use-cast-event-dispatchers-or-blueprint-interface/1656441",
        "kind": "forum"
      },
      {
        "label": "YouTube - Why Use Interfaces & Event Dispatchers in Unreal Engine (UE5 Explained)",
        "url": "https://www.youtube.com/watch?v=EQfml2D9hwE",
        "kind": "youtube"
      },
      {
        "label": "Doc Epic - Blueprint Communication Usage (Direct, Cast, Interface, Dispatcher)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-communication-usage-in-unreal-engine",
        "kind": "doc"
      },
      {
        "label": "Blog - Unreal Engine Blueprint Communication Guide",
        "url": "https://www.unreal-university.blog/unreal-engine-blueprint-communication-guide/",
        "kind": "blog"
      }
    ]
  },
  {
    "id": "fonctions",
    "num": "04",
    "special": false,
    "title": "Fonctions",
    "summary": "Ce chapitre couvre les fonctions Blueprint dans Unreal Engine 5.4 : leur definition et leur signature (nom, entrees/parametres, sorties/resultat), les deux facons de les creer (Collapse to Function et creation from scratch), les parametres d'entree/sortie et le noeud Return, les variables locales et leur portee, les differences entre fonctions et events, la distinction cruciale entre fonctions pures (vertes) et impures (bleues) avec leurs implications de performance et de mise en cache, l'heritage et l'override (Call to Parent Function), les Blueprint Function Libraries statiques, la notion de Target (instance cible, Self, contrainte de classe, Context Sensitive, World Context, noeuds statiques), les Blueprint Interfaces pour un couplage lache, les Macros et Macro Libraries (expansion inline, noeuds latents, sorties multiples, portee locale), et enfin les Timelines et Timers.",
    "topics": [
      "Definitions variables et fonctions",
      "Signature de fonction",
      "Creation de fonction (Collapse / from scratch)",
      "Parametres d'entree/sortie et valeur de retour",
      "Variables locales et portee",
      "Function vs Event",
      "Fonctions pure vs impure",
      "Performance des fonctions pures",
      "Heritage et override (Call to Parent)",
      "Blueprint Function Library",
      "Target et scope",
      "Noeuds statiques et World Context",
      "Blueprint Interface",
      "Macros et Macro Library",
      "Timeline et Timers"
    ],
    "fiches": [
      {
        "title": "Variables et fonctions : definitions et signature",
        "body": "Regle d'or du cours : **si vous utilisez plus de deux fois une valeur, elle doit etre une variable, et si vous utilisez plus de deux fois un calcul, il doit etre une fonction**. Une **variable** est un emplacement ou une valeur est stockee, et cette valeur peut changer pendant l'execution. Une **fonction** est un **bloc de code reutilisable** concu pour executer une tache specifique. Son objectif principal est de **simplifier le graphe Blueprint** en remplacant de longs groupes de noeuds par une seule boite, ce qui ameliore aussi l'organisation et la lisibilite du code. La **signature** d'une fonction declare son **nom** (identifiant), ses **entrees** (les parametres) et ses **sorties** (le resultat).",
        "keypoints": [
          "Regle : un calcul utilise plus de 2 fois doit devenir une fonction",
          "Variable = valeur stockee, modifiable a l'execution",
          "Fonction = **bloc reutilisable** qui clarifie le graphe",
          "Signature = nom + entrees (params) + sorties (resultat)"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Variable, fonction et signature : de quoi parle-t-on ?"
      },
      {
        "title": "Creer une fonction : Collapse to Function et from scratch",
        "body": "Il existe deux facons de creer une fonction. **A partir de noeuds existants** : selectionner tous les noeuds propres a la future fonction, faire un **clic droit puis 'Collapse to Function'**, et la nommer (ex. TestFortyTwo). **From scratch** : cliquer sur l'icone **+** dans la categorie **Functions** du panneau **My Blueprint**. Point important : **chaque fonction possede son propre onglet et son propre graphe**, distinct de l'**Event Graph** et du **Construction Script**. Creer des fonctions et faire de 'jolis rails' (double-clic sur un lien pour ajouter un point de reroute, touche **Q** pour aligner les noeuds selectionnes) sont les remedes au 'Blueprint spaghetti'.",
        "keypoints": [
          "**Collapse to Function** : regrouper des noeuds via clic droit",
          "**From scratch** : bouton + de la categorie Functions (My Blueprint)",
          "Chaque fonction a son propre onglet/graphe, separe de l'Event Graph",
          "Evite le 'Blueprint spaghetti'"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Comment creer une fonction Blueprint ?"
      },
      {
        "title": "Parametres d'entree/sortie et valeur de retour",
        "body": "Pour rendre une fonction flexible, on lui passe des donnees via des **parametres d'entree (Input)** plutot que d'utiliser des variables codees en dur : dans l'exemple, la valeur a tester devient un Input **int** 'intToTest'. Le resultat est renvoye via un **parametre de sortie (Output)**, par exemple un **bool** indiquant si le test reussit. On ajoute ces parametres en selectionnant le noeud de fonction et en editant le panneau **Details**. Detail cle : **des qu'on ajoute un Output, Unreal cree automatiquement un noeud Return** dans le graphe de la fonction, ou l'on branche la (les) valeur(s) a retourner.",
        "keypoints": [
          "**Input** = parametre recu (ex. intToTest)",
          "**Output** = valeur retournee (ex. bool resultat)",
          "Params ajoutes/edites dans le panneau **Details**",
          "Ajouter un Output cree automatiquement un noeud **Return**"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Inputs, Outputs et noeud Return d'une fonction"
      },
      {
        "title": "Variables locales et portee (scope)",
        "body": "Une **variable locale** se cree, lorsqu'on est dans une fonction, via le bouton **Local Variable** du panneau **My Blueprint**. Sa **portee est limitee a la fonction** : elle n'est visible ni des autres fonctions, ni de l'Event Graph. C'est un 'bloc-notes' de travail interne a la fonction, **detruit une fois la fonction terminee**. Cela reduit l'encombrement pour des donnees qui ne servent que localement. Point important : **seules les fonctions (et macros) peuvent avoir des variables locales ; les events, non**.",
        "keypoints": [
          "Creees via **Local Variable** (My Blueprint, dans une fonction)",
          "Portee limitee a la fonction : invisibles ailleurs",
          "Detruites a la fin de l'execution (bloc-notes temporaire)",
          "Les events ne peuvent pas en avoir"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "A quoi servent les variables locales ?"
      },
      {
        "title": "Function vs Event : les differences cles",
        "body": "Fonctions et events organisent le script mais different fortement. **Une fonction peut renvoyer des valeurs ; un event ne peut pas avoir de sortie.** **Une fonction peut avoir des variables locales ; un event non.** A l'inverse, **les events peuvent utiliser des noeuds latents comme Delay ou Timeline**, ce qui est **interdit dans une fonction**. Limitation cruciale a retenir : **une fonction Blueprint ne peut pas contenir de noeuds d'execution latents** car elle doit s'executer et retourner immediatement. Enfin, les events peuvent etre appeles depuis d'autres Blueprints et servir de reference 'delegue'.",
        "keypoints": [
          "Fonction : retourne des valeurs, a des variables locales",
          "Event : pas de sortie ni de variable locale",
          "Event : autorise les noeuds latents (**Delay**, **Timeline**)",
          "Fonction : interdit tout noeud latent (retour immediat)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Fonction ou Event : quelles differences ?"
      },
      {
        "title": "Fonctions pures vs impures",
        "body": "Il existe deux types de fonctions. Les **fonctions pures** (**noeuds verts**) **n'ont pas de broche d'execution** : elles servent a **obtenir des valeurs** et sont **garanties de ne pas modifier les variables ni l'etat de l'objet** ou de ses membres (ex. **Get Actor Location**, **Random Float in Range**). Les **fonctions impures** (**noeuds bleus/blancs**) sont connectees par des **broches d'execution** (pins blancs), respectent l'ordre gauche->droite et **peuvent modifier l'etat interne** (les variables) de l'objet. Pour rendre une fonction pure, il suffit de **cocher l'attribut Pure dans le panneau Details** de la fonction.",
        "keypoints": [
          "**Pure** = noeud vert, sans exec pin, ne modifie pas l'etat (getter)",
          "**Impure** = noeud bleu, avec exec pins, peut modifier l'etat",
          "Pures : Get Actor Location, Random Float in Range",
          "Rendre pure = cocher **Pure** dans le panneau Details"
        ],
        "versionNote": "Comportement identique en UE 5.4 : Pure = BlueprintPure (pas d'exec, pas de modification d'etat) ; distinction confirmee par la doc Epic.",
        "tier": 2,
        "front": "Fonction pure (verte) vs impure (bleue) ?"
      },
      {
        "title": "Performance : mise en cache et optimisation des pures",
        "body": "Difference fondamentale de performance. Une **fonction pure recalcule sa logique a chaque fois qu'elle est appelee** par une connexion de broche : **sa valeur n'est PAS mise en cache**. Consequence : **une fonction pure est executee une fois pour chaque broche de sortie a laquelle elle est connectee**. Si une pure complexe (long calcul math) est branchee a **3 endroits**, elle est **calculee 3 fois** (et si elle est aleatoire, les resultats peuvent differer). A l'inverse, **une fonction ou un noeud impur execute sa logique une seule fois** quand le flux la declenche, et **ses sorties sont mises en cache** en memoire (meme resultat si relu plus tard). **Optimisation** : pour une pure complexe appelee plusieurs fois, la calculer une seule fois au debut du flux et **promouvoir le resultat dans une variable locale**.",
        "keypoints": [
          "Pure = **non mise en cache**, recalculee a chaque pin connectee",
          "Pure complexe branchee 3 fois = calculee 3 fois",
          "Impure = executee une fois, sortie mise en cache",
          "Optimiser : calculer une fois, stocker en variable locale"
        ],
        "versionNote": "En UE 5.4, les noeuds purs ne cachent toujours pas leur resultat : ils sont reevalues pour chaque pin qui les consomme (confirme par Blueprint Best Practices, Epic).",
        "tier": 3,
        "front": "Perf : pourquoi optimiser une fonction pure ?"
      },
      {
        "title": "Heritage et override : Call to Parent Function",
        "body": "Les **classes enfants** (heritees) peuvent **remplacer (override)** les fonctions definies dans la classe parente : c'est un aspect essentiel de l'heritage et de la POO. Lorsqu'une fonction heritee est overridee dans un Blueprint enfant, il reste possible d'**appeler la logique de la classe parente** grace au noeud **Call to Parent Function**. Cela donne un **controle total sur l'ordre d'execution** entre la logique parent et enfant (executer le parent avant, apres, ou pas du tout).",
        "keypoints": [
          "Les classes enfants peuvent **override** les fonctions du parent",
          "**Call to Parent Function** appelle la logique du parent",
          "Controle l'ordre d'execution parent/enfant",
          "Pilier de l'heritage et de la POO"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Override et Call to Parent Function ?"
      },
      {
        "title": "Blueprint Function Library (BFL)",
        "body": "Une **Blueprint Function Library (BFL)** est un conteneur pour des **fonctions de nature statique**, **non liees a une instance d'acteur** specifique. Elles sont ideales pour les **utilitaires generaux, les maths, ou toute fonction devant etre accessible partout**. Caracteristique cle : **les fonctions d'une BFL sont statiques et n'ont pas de broche Target** ; elles s'appellent **directement par leur nom, n'importe ou dans le projet**. Exemple typique : un calcul de distance entre deux points, refait a l'identique dans plusieurs BP, gagne a etre centralise dans une BFL. Avantages : **reutilisation** (logique commune centralisee), **clarte** (graphes des acteurs propres) et **maintenance** facilitee.",
        "keypoints": [
          "Fonctions **statiques**, non liees a une instance d'acteur",
          "Pas de pin **Target** : appelables par nom partout",
          "Ideale pour utilitaires, maths, logique commune",
          "Centralise le code et facilite la maintenance"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "A quoi sert une Blueprint Function Library ?"
      },
      {
        "title": "La Target : instance cible, Self, noeuds statiques et World Context",
        "body": "La **Target** est une **reference a l'objet/acteur specifique** sur lequel une fonction/action doit s'executer : elle indique au moteur **quelle instance** est destinataire de la commande. C'est le coeur de la POO en Blueprint : on appelle une **methode (la fonction) sur une instance (la Target)**. Regles cles : **si la broche Target n'est pas connectee, elle vaut Self** (l'acteur agit sur lui-meme). Pour appeler une fonction d'une **autre classe** absente du contexte courant, il faut **decocher 'Context Sensitive'** dans la recherche (Unreal precise alors la target attendue), puis fournir une **reference** valide (variable typee de la classe, ou recherche de l'acteur dans la scene). La Target a une **contrainte de type** : liee a une classe precise (ou un parent), une fonction exigeant un **Pawn** ne marchera pas sur un simple **Actor**. A l'inverse, les **noeuds statiques** (utilitaires globaux) **n'ont pas de Target** : ex. **Print String**, ou les Function Libraries **KismetMathLibrary** (maths) et **GameplayStatics** (gameplay). Certaines fonctions statiques exigent un **World Context** pour savoir dans quel monde operer ; dans un contexte non-Actor (ex. **Anim Notify State**), elles recuperent ce World via un objet passe en parametre. Perf : stocker le retour de **GetPlayerCharacter** ou **GetController** dans une variable evite des appels repetes couteux.",
        "keypoints": [
          "**Target** = instance sur laquelle la fonction s'execute (POO)",
          "Pin Target vide => **Self** ; contrainte de classe (Pawn != Actor)",
          "Decocher **Context Sensitive** pour une fonction hors contexte",
          "Noeuds statiques (GameplayStatics, Print String) : sans Target"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "La Target : sur quelle instance agit un noeud ?"
      },
      {
        "title": "Blueprint Interface (BPI) : couplage lache vs Cast",
        "body": "Une **Blueprint Interface (BPI)** est un **contrat** ('promesse') : une **collection de fonctions/evenements SANS implementation** (juste des signatures). Objectif : la **communication inter-Blueprint en couplage lache (loose coupling)** — on interagit avec un acteur selon **ce qu'il peut faire** (son contrat), pas selon **qui il est** (sa classe). L'editeur d'interface ne permet que de definir les signatures. Cote implementation : **les fonctions d'un BPI sans parametre de sortie apparaissent comme des Events** dans le BP qui l'implemente ; **celles avec une sortie apparaissent dans la section Interfaces du panneau My Blueprint**. On declenche une fonction via le noeud **Message** ; le **pin Target** determine quel acteur recoit le message. Si l'objet n'implemente pas l'interface, **l'appel est simplement ignore sans planter**. Le noeud **Does Implement Interface** (ou **Get All Actors With Interface**) permet une verification optionnelle. Enfin, une **BPI est bien plus performante qu'un Cast** : elle **ne verifie qu'un simple flag de contrat**, alors que le **Casting** parcourt la hierarchie de classes, **force le chargement de l'acteur en memoire** et est couteux.",
        "keypoints": [
          "**BPI** = contrat de signatures sans implementation (loose coupling)",
          "Sans output => Events ; avec output => section Interfaces",
          "Appel via noeud **Message** ; ignore sans crash si non implemente",
          "Plus rapide qu'un **Cast** : verifie un flag, sans charger en memoire"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Blueprint Interface : couplage lache vs Cast"
      },
      {
        "title": "Macros, Macro Library et comparaison finale",
        "body": "Une **macro** ressemble a un graphe reduit de noeuds : **a la compilation, son contenu est developpe (insere) directement** la ou elle est utilisee — comme un **copier-coller organise** remplacant le noeud unique. Elle **n'a pas de portee propre** et prend celle du graphe hote, ce qui lui permet d'**acceder aux variables locales** de ce graphe. Grand avantage : **une macro peut contenir des noeuds latents (Delay), impossibles dans une fonction**, et peut avoir **plusieurs broches d'execution d'entree et de sortie** (Done, Success, Failure). Plusieurs noeuds de **Flow Control** (For Each Loop, Do Once, FlipFlop) sont d'ailleurs des macros de la Standard Macro Library. Cout : les macros **augmentent le nombre reel de noeuds** du graphe final, donc coutent generalement **plus cher** que les fonctions. **Portee** : une macro locale **ne peut pas etre appelee par d'autres Blueprints**, sauf via une **Macro Library** (actif partageable a l'echelle du projet, qui exige de choisir une **classe parente** ; une modif y est propagee automatiquement partout). **Recap Macros vs Events vs Functions** : tous ont des **parametres d'entree** ; les **macros** ont des sorties et plusieurs chemins d'execution mais **pas d'appel externe** ; les **events** n'ont pas de sortie mais sont **appelables depuis d'autres BP**, ont un **delegue** et supportent les **Timelines** ; les **fonctions** sont **appelables depuis d'autres BP** et ont des sorties mais **pas d'actions latentes (Delay)**.",
        "keypoints": [
          "**Macro** = expansion inline a la compilation (copier-coller)",
          "Peut contenir **Delay** et plusieurs pins d'exec I/O",
          "Locale par defaut : partage via une **Macro Library**",
          "Cout : plus de noeuds finaux qu'une fonction"
        ],
        "versionNote": "En UE 5.4, les fonctions ne peuvent toujours pas contenir de noeuds latents (Delay) ; les macros oui, car elles sont expansees inline dans le graphe appelant (confirme par la doc Macros d'Epic).",
        "tier": 3,
        "front": "Macro : expansion inline et Macro Library"
      },
      {
        "title": "Timeline et Timers",
        "body": "La **Timeline** est un noeud qui fait **evoluer une valeur grace a une courbe**. On l'ajoute via clic droit -> **Add Timeline**, on la nomme, puis on choisit le **type a animer** (float, vector, event, color, curve asset), la **longueur en secondes** et des **options de lecture**. On ajoute une **track** (ex. Add Float Track 'Move') et des **cles** (clic droit Add Key, ou Shift+clic) — par ex. key1 time 0/value 0 et key2 time 0.5/value 1 — puis on lisse la courbe (clic droit sur une cle -> Auto). Les **Timers** sont l'un des meilleurs moyens d'**executer du code periodiquement SANS Event Tick** : le moteur declenche automatiquement un event ou une fonction au temps defini. La pin **Time** est le delai d'attente (si <= 0, le timer est efface) ; le **premier appel** se fait apres 'Time' secondes ; **Looping** repete l'appel toutes les 'Time' secondes ; le **carre rouge** est un delegue d'evenement (un seul event connecte a la fois). **Timer by Function Name** cible une fonction par son **nom texte** (fragile : casse si on renomme la fonction) ; le noeud **CreateEvent** resout ce probleme en referencant fonctions/events et en adaptant le delegue si le nom change.",
        "keypoints": [
          "**Timeline** : anime une valeur via une courbe (float/vector...)",
          "**Timer** : code periodique sans **Event Tick** (bon pour le FPS)",
          "Time <= 0 efface ; **Looping** repete ; carre rouge = delegue",
          "**Timer by Function Name** fragile ; **CreateEvent** robuste au renommage"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Timeline et Timers : a quoi servent-ils ?"
      }
    ],
    "quiz": [
      {
        "q": "Selon la regle enoncee dans le cours, a partir de quand un calcul doit-il devenir une fonction ?",
        "choices": [
          "Dès la toute première utilisation du calcul",
          "Seulement au-delà de dix utilisations",
          "Dès qu'on l'utilise plus de deux fois",
          "Jamais : mieux vaut dupliquer le code"
        ],
        "answer": 2,
        "explain": "Le cours pose la regle : si une valeur sert plus de deux fois elle doit etre une variable, et si un calcul sert plus de deux fois il doit etre une fonction. Cela ameliore la reutilisation, l'organisation et la lisibilite.",
        "difficulty": "facile",
        "topic": "Definitions variables et fonctions",
        "def": {
          "term": "Fonction",
          "text": "Bloc de code réutilisable qui exécute une tâche précise ; transformer un calcul répété en fonction simplifie le graphe et améliore lisibilité et maintenance."
        }
      },
      {
        "q": "Que declare la signature d'une fonction ?",
        "choices": [
          "Son nom, ses entrées et sa valeur de sortie",
          "La couleur et l'icône du nœud dans le graphe",
          "La liste des variables globales du projet actif",
          "Le nombre d'appels de la fonction au runtime"
        ],
        "answer": 0,
        "explain": "La signature declare l'identifiant (nom) de la fonction ainsi que ses entrees (les parametres) et ses sorties (le resultat retourne).",
        "difficulty": "facile",
        "topic": "Signature de fonction",
        "def": {
          "term": "Signature de fonction",
          "text": "Déclaration qui identifie une fonction : son nom, ses paramètres d'entrée et ses valeurs de sortie ; elle définit comment l'appeler et ce qu'elle renvoie."
        }
      },
      {
        "q": "Quelle commande transforme une selection de noeuds existants en une nouvelle fonction ?",
        "choices": [
          "Collapse to Macro Node",
          "Convert Nodes to Event",
          "Refactor to New Function",
          "Collapse to Function"
        ],
        "answer": 3,
        "explain": "On selectionne les noeuds propres a la future fonction, clic droit puis 'Collapse to Function', et on la nomme. C'est la methode a partir de noeuds existants.",
        "difficulty": "facile",
        "topic": "Creation de fonction (Collapse / from scratch)",
        "def": {
          "term": "Collapse to Function",
          "text": "Commande Blueprint (clic droit) qui regroupe des nœuds sélectionnés dans une nouvelle fonction dotée de son propre graphe, pour désengorger l'Event Graph."
        }
      },
      {
        "q": "Ou vit le graphe d'une fonction dans l'editeur Blueprint ?",
        "choices": [
          "Dans son propre onglet et son propre graphe",
          "Dans le même graphe, partagé avec l'Event Graph",
          "Obligatoirement dans le Construction Script",
          "Seulement dans un fichier C++ dédié au BP"
        ],
        "answer": 0,
        "explain": "Chaque fonction dispose de son propre onglet et de son propre graphe, separe de l'Event Graph et du Construction Script. On la cree from scratch via le + de la categorie Functions du panneau My Blueprint.",
        "difficulty": "moyen",
        "topic": "Creation de fonction (Collapse / from scratch)",
        "def": {
          "term": "Graphe de fonction",
          "text": "Chaque fonction Blueprint possède son onglet et son graphe dédié, séparés de l'Event Graph et du Construction Script, ce qui isole sa logique."
        }
      },
      {
        "q": "Que se passe-t-il automatiquement lorsqu'on ajoute un parametre Output a une fonction ?",
        "choices": [
          "Aucun nœud n'est ajouté au graphe visible",
          "Un nœud Branch est inséré à l'entrée",
          "La fonction devient automatiquement pure",
          "Un nœud Return apparaît dans le graphe"
        ],
        "answer": 3,
        "explain": "Ajouter un Output (ex. un bool de resultat) genere automatiquement un noeud Return, ou l'on branche la valeur a retourner.",
        "difficulty": "facile",
        "topic": "Parametres d'entree/sortie et valeur de retour",
        "def": {
          "term": "Nœud Return",
          "text": "Nœud terminal d'une fonction où l'on branche les valeurs de sortie ; créé automatiquement dès l'ajout d'un paramètre Output, il marque la fin de l'exécution."
        }
      },
      {
        "q": "Quelle affirmation decrit correctement une variable locale a une fonction ?",
        "choices": [
          "Accessible depuis tous les Blueprints du projet ouvert",
          "Persistante comme une globale d'une frame à l'autre",
          "Visible dans sa seule fonction, détruite après appel",
          "Limitée aux seules valeurs de type booléen simple"
        ],
        "answer": 2,
        "explain": "Une variable locale a une portee limitee a sa fonction (invisible ailleurs) et sert de bloc-notes temporaire detruit une fois la fonction terminee. Les events, eux, ne peuvent pas avoir de variables locales.",
        "difficulty": "moyen",
        "topic": "Variables locales et portee",
        "def": {
          "term": "Variable locale",
          "text": "Variable créée dans une fonction, visible uniquement à l'intérieur de celle-ci et détruite à la fin de son exécution ; sert de stockage temporaire de travail."
        }
      },
      {
        "q": "Quelle est une difference correcte entre une fonction et un event ?",
        "choices": [
          "Une fonction renvoie des valeurs, pas un event",
          "Un event peut renvoyer des sorties, pas une fonction",
          "Ni event ni fonction ne peut avoir d'entrée",
          "Tous deux acceptent un nœud latent Delay"
        ],
        "answer": 0,
        "explain": "La fonction peut renvoyer des valeurs et avoir des variables locales ; l'event ne peut pas avoir de sortie mais peut utiliser Delay/Timeline et etre appele depuis d'autres Blueprints.",
        "difficulty": "moyen",
        "topic": "Function vs Event",
        "def": {
          "term": "Fonction vs Event",
          "text": "La fonction renvoie des valeurs et admet des variables locales mais interdit les nœuds latents ; l'event n'a pas de sortie mais autorise Delay et Timeline."
        }
      },
      {
        "q": "Pourquoi ne peut-on pas placer un noeud Delay dans une fonction Blueprint ?",
        "choices": [
          "Parce que le nœud Delay n'existe pas du tout en Blueprint",
          "Parce que Delay est un nœud réservé au code C++",
          "Parce que Delay ralentit trop la compilation du BP",
          "Car la fonction rend la main aussitôt, sans latence"
        ],
        "answer": 3,
        "explain": "Une fonction Blueprint ne peut pas contenir de noeuds d'execution latents (Delay, Timeline) car elle doit s'executer et retourner immediatement. Pour la latence, on utilise un event ou une macro.",
        "difficulty": "moyen",
        "topic": "Function vs Event",
        "def": {
          "term": "Nœud latent",
          "text": "Nœud dont l'exécution s'étale sur plusieurs frames (Delay, Timeline) ; interdit dans une fonction, qui doit se terminer aussitôt ; autorisé en events et macros."
        }
      },
      {
        "q": "Qu'est-ce qui caracterise une fonction pure (noeud vert) ?",
        "choices": [
          "Avec broches d'exécution, elle modifie l'état de l'objet",
          "Sans broche d'exécution, elle ne modifie pas l'état",
          "Elle ne peut renvoyer aucune valeur de sortie",
          "Exécutée une fois, elle met son résultat en cache"
        ],
        "answer": 1,
        "explain": "Une fonction pure n'a pas de broche d'execution, sert a obtenir des valeurs et est garantie de ne pas modifier l'etat ni les variables/membres de l'objet (ex. Get Actor Location, Random Float in Range).",
        "difficulty": "facile",
        "topic": "Fonctions pure vs impure",
        "def": {
          "term": "Fonction pure",
          "text": "Nœud vert sans broche d'exécution, utilisé pour lire des valeurs (getter) ; garantie de ne modifier ni l'état ni les variables de l'objet ; non mise en cache."
        }
      },
      {
        "q": "Comment rendre une fonction pure dans l'editeur Blueprint (UE 5.4) ?",
        "choices": [
          "Cocher la case Pure dans le panneau Details",
          "Renommer la fonction avec le préfixe Pure_ imposé",
          "Supprimer tous ses paramètres d'entrée existants",
          "La déplacer dans une Blueprint Macro Library"
        ],
        "answer": 0,
        "explain": "Il suffit de cocher l'attribut Pure dans le panneau Details de la fonction (equivalent du specificateur BlueprintPure en C++). Le noeud perd alors ses broches d'execution.",
        "difficulty": "facile",
        "topic": "Fonctions pure vs impure",
        "def": {
          "term": "Attribut Pure",
          "text": "Option du panneau Details (équivalent BlueprintPure en C++) qui rend une fonction pure : le nœud perd ses broches d'exécution et sert de simple getter."
        }
      },
      {
        "q": "Une fonction pure complexe est branchee a 3 emplacements differents dans le graphe. Combien de fois est-elle calculee ?",
        "choices": [
          "1 fois, car sa valeur est mise en cache",
          "0 fois : cela provoque une erreur de compilation",
          "3 fois, mais renvoie une valeur unique en cache",
          "3 fois : une pure ne cache pas sa valeur"
        ],
        "answer": 3,
        "explain": "Une fonction pure est executee une fois pour chaque broche de sortie a laquelle elle est connectee, et sa valeur n'est pas mise en cache : branchee 3 fois, elle est calculee 3 fois (et si elle est aleatoire, les resultats peuvent differer).",
        "difficulty": "moyen",
        "topic": "Performance des fonctions pures",
        "def": {
          "term": "Non mise en cache (pure)",
          "text": "Une fonction pure est réévaluée pour chaque broche qui la consomme : sa sortie n'est pas mise en cache, donc branchée à 3 endroits elle est calculée 3 fois."
        }
      },
      {
        "q": "Que se passe-t-il pour les valeurs de sortie d'une fonction IMPURE ?",
        "choices": [
          "Recalculées à chaque connexion, jamais mises en cache",
          "Inutilisables plus d'une fois dans le graphe",
          "Mises en cache, elles restent stables sur la branche",
          "Recalculées une fois par broche de donnée liée"
        ],
        "answer": 2,
        "explain": "Une fonction impure execute sa logique une seule fois quand le flux la declenche, et ses sorties sont mises en cache en memoire : le resultat reste le meme si on le relit plus tard dans la branche.",
        "difficulty": "moyen",
        "topic": "Fonctions pure vs impure",
        "def": {
          "term": "Mise en cache (impure)",
          "text": "Une fonction ou un nœud impur exécute sa logique une seule fois quand le flux la déclenche ; ses sorties sont stockées en mémoire et restent stables ensuite."
        }
      },
      {
        "q": "Quelle est la bonne facon d'optimiser une fonction pure complexe appelee plusieurs fois ?",
        "choices": [
          "La calculer une fois, stocker en variable locale",
          "La transformer en event avec broches d'exécution latentes",
          "La convertir en macro pour la mettre en cache",
          "Cocher deux fois l'attribut Pure du nœud vert"
        ],
        "answer": 0,
        "explain": "Comme les pures ne cachent pas leur valeur, on la calcule une seule fois en tete de flux et on promeut le resultat dans une variable locale, qui est ensuite reutilisee sans recalcul.",
        "difficulty": "difficile",
        "topic": "Performance des fonctions pures",
        "def": {
          "term": "Promotion en variable",
          "text": "Optimisation : calculer une pure coûteuse une seule fois puis stocker (promouvoir) sa valeur dans une variable locale réutilisée, évitant les recalculs répétés."
        }
      },
      {
        "q": "Dans un Blueprint enfant qui override une fonction du parent, comment appeler la logique de la classe parente ?",
        "choices": [
          "Recréer manuellement la logique du parent",
          "Supprimer l'override et dupliquer la fonction",
          "Activer l'option Context Sensitive du menu",
          "Utiliser le nœud Call to Parent Function"
        ],
        "answer": 3,
        "explain": "Le noeud Call to Parent Function appelle la logique de la classe parente depuis la fonction overridee, donnant un controle total sur l'ordre d'execution parent/enfant.",
        "difficulty": "moyen",
        "topic": "Heritage et override (Call to Parent)",
        "def": {
          "term": "Call to Parent Function",
          "text": "Nœud placé dans une fonction overridée qui exécute la version du parent ; permet de choisir l'ordre : avant, après ou sans la logique de l'enfant."
        }
      },
      {
        "q": "Quelle est la caracteristique cle des fonctions d'une Blueprint Function Library (BFL) ?",
        "choices": [
          "Liées à une instance d'acteur bien précise",
          "Réservées à ne contenir que des macros internes",
          "Statiques, sans Target, appelées par leur nom",
          "Autorisées à contenir des nœuds Delay latents"
        ],
        "answer": 2,
        "explain": "Les fonctions d'une BFL sont de nature statique, ne sont pas liees a une instance d'acteur et n'ont pas de broche Target : elles s'appellent directement par leur nom n'importe ou dans le projet. Ideales pour les utilitaires et les maths.",
        "difficulty": "moyen",
        "topic": "Blueprint Function Library",
        "def": {
          "term": "Blueprint Function Library",
          "text": "Conteneur de fonctions statiques non liées à une instance (pas de Target), appelables par leur nom partout ; idéale pour utilitaires et maths partagés."
        }
      },
      {
        "q": "Qu'est-ce que la Target d'un noeud dans Unreal ?",
        "choices": [
          "Le nom de la variable de retour renvoyée",
          "L'instance sur laquelle le nœud s'exécute",
          "Un type de macro de contrôle de flux latent",
          "La couleur et le style du nœud affiché"
        ],
        "answer": 1,
        "explain": "La Target est une reference a l'objet/acteur specifique (l'instance) qui est destinataire de la commande. C'est la base de la POO : on appelle une methode sur une instance.",
        "difficulty": "facile",
        "topic": "Target et scope",
        "def": {
          "term": "Target",
          "text": "Référence à l'instance (objet/acteur) sur laquelle un nœud agit ; cœur de la POO en Blueprint. Broche vide = Self ; soumise à une contrainte de classe."
        }
      },
      {
        "q": "Que se passe-t-il si la broche Target d'un noeud n'est pas connectee ?",
        "choices": [
          "Elle vaut Self : l'acteur agit sur soi",
          "Le nœud provoque une erreur à la compilation",
          "Elle prend le premier acteur trouvé du niveau",
          "Elle désactive purement la fonction appelée"
        ],
        "answer": 0,
        "explain": "Une broche Target non connectee vaut Self (soi-meme) : l'acteur execute la fonction sur lui-meme. Si la fonction exige une autre classe (ex. BP_Vehicule), laisser vide provoque une erreur a l'execution.",
        "difficulty": "moyen",
        "topic": "Target et scope",
        "def": {
          "term": "Self",
          "text": "Valeur par défaut d'une broche Target laissée vide : le nœud s'exécute sur l'instance courante, c'est-à-dire que l'acteur agit sur lui-même."
        }
      },
      {
        "q": "Une fonction appartenant a une autre classe n'apparait pas dans la recherche de noeuds. Que faire ?",
        "choices": [
          "Recompiler entièrement tout le projet ouvert",
          "Passer la fonction cible en mode pure vert",
          "Créer une nouvelle Blueprint Macro Library",
          "Décocher l'option Context Sensitive"
        ],
        "answer": 3,
        "explain": "Par defaut la recherche est Context Sensitive et ne montre que ce qui existe dans le contexte courant. En decochant Context Sensitive, Unreal trouve la fonction et precise la target attendue.",
        "difficulty": "moyen",
        "topic": "Target et scope",
        "def": {
          "term": "Context Sensitive",
          "text": "Option de la recherche de nœuds, active par défaut, qui limite les résultats au contexte courant ; la décocher révèle les fonctions d'autres classes."
        }
      },
      {
        "q": "Que peut-on dire des noeuds de KismetMathLibrary et GameplayStatics ?",
        "choices": [
          "Ils exigent une broche Target vers un Pawn",
          "Ils ne marchent qu'au sein d'une interface",
          "Utilitaires statiques globaux, sans Target",
          "Ils s'appellent depuis le Construction Script"
        ],
        "answer": 2,
        "explain": "KismetMathLibrary (maths globales) et GameplayStatics (utilitaires de gameplay) sont des noeuds statiques globaux sans Target. Certaines de ces fonctions statiques exigent toutefois un World Context pour savoir dans quel monde operer.",
        "difficulty": "moyen",
        "topic": "Noeuds statiques et World Context",
        "def": {
          "term": "Nœuds statiques",
          "text": "Fonctions globales sans Target (ex. KismetMathLibrary, GameplayStatics, Print String), appelables partout ; certaines exigent un World Context."
        }
      },
      {
        "q": "Qu'est-ce qu'une Blueprint Interface (BPI) ?",
        "choices": [
          "Un contrat de signatures sans implémentation",
          "Une classe fournissant l'implémentation des fonctions",
          "Un type de variable locale partagée entre acteurs",
          "Une fonction pure globale accessible de partout"
        ],
        "answer": 0,
        "explain": "Une BPI est un contrat/promesse : une collection de signatures de fonctions ou d'evenements sans implementation. Elle permet la communication inter-Blueprint en couplage lache (on interagit selon ce que l'acteur peut faire, pas selon sa classe).",
        "difficulty": "facile",
        "topic": "Blueprint Interface",
        "def": {
          "term": "Blueprint Interface",
          "text": "Contrat de signatures de fonctions/events sans implémentation ; permet une communication inter-Blueprint en couplage lâche, selon ce qu'un acteur peut faire."
        }
      },
      {
        "q": "Pourquoi une Blueprint Interface est-elle plus performante qu'un Cast ?",
        "choices": [
          "Le Cast est plus rapide car il met tout en cache",
          "Les deux opérations ont strictement le même coût",
          "L'interface force le chargement complet de l'acteur",
          "Elle ne teste qu'un flag, sans charger l'acteur"
        ],
        "answer": 3,
        "explain": "Le Casting est lourd : Unreal parcourt la hierarchie de classes de l'acteur et force son chargement en memoire. L'interface, elle, ne verifie qu'un simple flag de contrat (booleen), evitant cette lourdeur et les dependances dures.",
        "difficulty": "difficile",
        "topic": "Blueprint Interface",
        "def": {
          "term": "Interface vs Cast",
          "text": "Un Cast parcourt la hiérarchie de classes et force le chargement de l'acteur en mémoire ; une interface ne teste qu'un flag de contrat, donc bien plus légère."
        }
      },
      {
        "q": "Au moment de la compilation, comment une Macro est-elle traitee par Unreal Engine ?",
        "choices": [
          "Appelée comme un sous-programme séparé à portée propre",
          "Son contenu est copié-collé dans le graphe hôte",
          "Elle s'exécute dans son propre onglet isolé du reste",
          "Elle est convertie en fonction pure à broches"
        ],
        "answer": 1,
        "explain": "Contrairement a une fonction (appel de sous-programme), le code d'une macro est insere directement dans le graphe appelant a la compilation, comme un copier-coller des noeuds. Elle n'a donc pas de portee propre et prend celle du graphe hote.",
        "difficulty": "moyen",
        "topic": "Macros et Macro Library",
        "def": {
          "term": "Expansion de macro",
          "text": "À la compilation, le contenu d'une macro est inséré (copier-coller) dans le graphe appelant ; elle n'a pas de portée propre et prend celle du graphe hôte."
        }
      },
      {
        "q": "Quel enonce decrit correctement les Macros par rapport aux fonctions ?",
        "choices": [
          "Elle admet Delay et plusieurs sorties, mais reste locale",
          "Une macro n'a qu'une sortie et interdit tout nœud latent",
          "Une macro est appelable depuis n'importe quel Blueprint",
          "Une macro produit toujours moins de nœuds qu'une fonction"
        ],
        "answer": 0,
        "explain": "Les macros peuvent contenir des noeuds latents comme Delay (impossibles dans une fonction) et exposer plusieurs broches d'execution (Done/Success/Failure). Elles sont locales par defaut et, coutant plus de noeuds finaux, ne sont appelables ailleurs que via une Macro Library.",
        "difficulty": "moyen",
        "topic": "Macros et Macro Library",
        "def": {
          "term": "Macro vs fonction",
          "text": "Une macro admet des nœuds latents (Delay) et plusieurs broches d'exécution, mais reste locale (partageable via une Macro Library) et crée plus de nœuds finaux."
        }
      },
      {
        "q": "Concernant la repetition periodique de code, quelle affirmation est correcte ?",
        "choices": [
          "Un Timer oblige à interroger Event Tick chaque frame",
          "Une Timeline n'anime que des valeurs booléennes",
          "Un Timer exécute du code périodique sans Event Tick",
          "Un Timer ne peut jamais boucler ni se répéter"
        ],
        "answer": 2,
        "explain": "Les Timers sont l'un des meilleurs moyens d'executer du code periodiquement sans Event Tick : Unreal declenche automatiquement l'event/fonction au temps defini (option Looping pour repeter), ce qui evite de reduire le FPS. La Timeline, elle, anime une valeur via une courbe.",
        "difficulty": "moyen",
        "topic": "Timeline et Timers",
        "def": {
          "term": "Timer",
          "text": "Mécanisme qui déclenche périodiquement un event ou une fonction sans Event Tick ; l'option Looping répète l'appel toutes les 'Time' secondes, économisant le FPS."
        }
      }
    ],
    "sources": [
      {
        "label": "Functions in Unreal Engine - Documentation officielle Epic",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/functions-in-unreal-engine"
      },
      {
        "label": "Blueprint Best Practices in Unreal Engine (pure vs impure, mise en cache) - Epic",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-best-practices-in-unreal-engine"
      },
      {
        "label": "Macros in Unreal Engine (expansion inline, noeuds latents) - Epic",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/macros-in-unreal-engine"
      },
      {
        "label": "Blueprint Macro Library in Unreal Engine - Epic",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-macro-library-in-unreal-engine"
      },
      {
        "label": "Blueprint Interface in Unreal Engine - Epic",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blueprint-interface-in-unreal-engine"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/U5gnrHWm1d0/hqdefault.jpg",
        "caption": "Fonctions pures et impures dans les Blueprints UE5 : quand et pourquoi les utiliser.",
        "credit": "Polysiens (YouTube)",
        "link": "https://www.youtube.com/watch?v=U5gnrHWm1d0"
      },
      {
        "url": "https://img.youtube.com/vi/hM52OJnUSpI/hqdefault.jpg",
        "caption": "Bonnes pratiques Unreal Engine : Events, fonctions, macros, pure/impure et const.",
        "credit": "Learning Dev (YouTube)",
        "link": "https://www.youtube.com/watch?v=hM52OJnUSpI"
      }
    ],
    "links": [
      {
        "label": "Forum Epic - Difference entre les macros et les fonctions Blueprint",
        "url": "https://forums.unrealengine.com/t/whats-the-difference-between-blueprint-macros-and-blueprint-functions/280809",
        "kind": "forum"
      },
      {
        "label": "YouTube - Blueprint Best Practices : fonctions Pure vs Impure (UE5)",
        "url": "https://www.youtube.com/watch?v=ytMW51zJJmQ",
        "kind": "youtube"
      },
      {
        "label": "Blog - Blueprint Pure Functions : Yes? No? It's Complicated (pieges des nodes pures)",
        "url": "https://raharuu.github.io/unreal/blueprint-pure-functions-complicated/",
        "kind": "blog"
      },
      {
        "label": "Doc Epic - Functions in Unreal Engine (fonctions, variables locales, pure/const)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/functions-in-unreal-engine",
        "kind": "doc"
      }
    ]
  },
  {
    "id": "widgets",
    "num": "05",
    "special": false,
    "title": "HUD & Widgets",
    "summary": "Ce chapitre couvre l'UMG (Unreal Motion Graphics), le systeme d'interface utilisateur natif d'Unreal Engine 5.4 construit sur le framework Slate. On y apprend a creer des Widget Blueprints (User Widgets), a travailler dans les deux environnements Designer (visualisation, Palette, Hierarchie) et Graph (logique), a organiser le layout avec les panneaux (Canvas Panel, Vertical/Horizontal Box, Stack Box, Spacer), a positionner les elements avec les Ancres (Anchors), l'Alignment et le DPI Scaling. Le cours detaille l'affichage a l'ecran (Create Widget + Add to Viewport), le cycle de vie (Pre-Construct, Construct, Tick), la performance (invalidation/caching, event-driven vs bindings, virtualisation), les variables de widget (Is Variable, Expose on Spawn), la communication (Event Dispatchers), les animations (Timeline/Sequenceur, keyframes, Play Animation), les evenements interactifs (OnClicked, OnHovered, Slider), le Widget Component pour l'UI 3D/diegetique, et l'architecture professionnelle de gestion de l'UI via la classe HUD, le PlayerController, le Z-Order et la GameInstance, jusqu'a la realisation d'un HUD responsive (barres de vie/faim/soif).",
    "topics": [
      "UMG et framework Slate",
      "Widget Blueprint : Designer, Graph, Palette, Hierarchie",
      "Types de widgets (User Widget, Native, Widget Component)",
      "Create Widget & Add to Viewport",
      "Cycle de vie et performance (Pre-Construct, Construct, Tick, invalidation)",
      "Panneaux de layout (Canvas Panel, Box, Stack Box, Spacer)",
      "Ancres (Anchors) et Alignment",
      "DPI Scaling et styles (Font, Brush)",
      "Variables de widget (Is Variable, Expose on Spawn)",
      "Bindings vs architecture event-driven",
      "Event Dispatchers",
      "Evenements de widgets (OnClicked, OnHovered, Slider, Focus)",
      "Animations UMG",
      "Widget Component (UI 3D / diegetique)",
      "Classe HUD, PlayerController, Z-Order, GameInstance"
    ],
    "fiches": [
      {
        "title": "L'UMG et le framework Slate",
        "body": "**UMG (Unreal Motion Graphics)** est le systeme d'interface utilisateur (UI) **natif d'Unreal Engine**. Il sert a creer tous les elements d'interface d'un jeu : **menus principaux** et **HUD (Heads-Up Display / affichage tete haute)**. Sous le capot, toutes les interfaces d'Unreal sont construites sur le framework **Slate UI** (la couche UI bas niveau du moteur). Concretement, on cree son UI dans un fichier appele **Widget Blueprint** (un **Widget**), qui est un fichier de design d'interface permettant d'afficher et de manipuler de l'UI sur un **viewport**. Bonne pratique d'organisation : creer un dossier **UI** dans le Content, puis y creer ses widgets avec une nomenclature claire (ex : WG_MainMenu, WBP_Main).",
        "keypoints": [
          "**UMG** = systeme d'UI natif d'Unreal Engine",
          "Construit par-dessus le framework **Slate**",
          "Sert a creer menus et **HUD**",
          "Un **Widget Blueprint** est un fichier de design d'UI"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "UMG et Slate : le systeme d'UI d'Unreal"
      },
      {
        "title": "Widget Blueprint : Designer, Graph, Palette et Hierarchie",
        "body": "Chaque **Widget Blueprint** est divise en deux environnements de travail : le **Designer** (visualisation, l'apparence de l'interface) et le **Graph** (logique, fonctionnalites, interactions). Dans le Designer, deux panneaux clefs : la **Palette** est la boite a outils principale, contenant tous les elements a poser a l'ecran (Button, Text, Image, ProgressBar/barre de progression, etc.) ; la **Hierarchie** regroupe les objets ajoutes sur la 'scene' du widget et affiche leur structure en **calques**. L'ordre des calques est **inverse** par rapport a une liste classique : un widget avec un **Z-order plus eleve est rendu au-dessus** des autres. Le **Graph Blueprint** est l'endroit ou l'on script fonctions, evenements personnalises et logique de jeu ; les animations creees dans le Designer y sont exposees comme des variables, et les evenements comme **OnClicked** d'un bouton y sont geres.",
        "keypoints": [
          "Deux environnements : **Designer** (visuel) et **Graph** (logique)",
          "**Palette** = boite a outils des composants a poser",
          "**Hierarchie** = calques ; Z-order eleve = rendu au-dessus",
          "Les animations du Designer deviennent des variables du Graph"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Widget Blueprint : Designer, Graph, Palette, Hierarchie"
      },
      {
        "title": "Types de widgets : User Widget, Native, Widget Component",
        "body": "Le cours distingue trois familles. 1) **User Widget (ou Widget Blueprint)** : la classe parente par defaut pour construire une UI ; elle peut heriter d'autres classes pour le style ou les fonctionnalites. Bonne pratique : chaque element complexe (barre de sante, emplacement d'inventaire) doit etre **son propre Widget Blueprint** pour favoriser la reutilisation. 2) **Native Widgets (composants)** : les briques de base trouvees dans la **Palette**, comme **Text, Image, Button ou Border**. 3) **Widget Component** : un composant qui permet d'afficher un User Widget dans l'environnement **3D** du monde (**World Space** / 3D Widget), utilise pour les interfaces interactives (clavier virtuel) ou les HUD flottants au-dessus des acteurs ; on y choisit la **classe de User Widget** a afficher et sa taille de rendu (**Draw Size**).",
        "keypoints": [
          "**User Widget** = classe parente par defaut d'une UI",
          "Chaque element complexe = son propre Widget (reutilisation)",
          "**Native Widgets** = composants de base (Text, Image, Button)",
          "**Widget Component** = afficher un User Widget en 3D (World Space)"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "User Widget, Native Widget, Widget Component ?"
      },
      {
        "title": "Afficher un widget : Create Widget & Add to Viewport",
        "body": "Pour rendre un widget visible a l'ecran du joueur, il faut **deux etapes** (typiquement dans le Level Blueprint ou le Player Controller) : 1) **Create Widget** cree l'instance du widget **en memoire** (on precise la Class ; la Return Value est le widget cree) ; 2) **Add to Viewport** **affiche** cette instance sur l'ecran du joueur. On stocke souvent la Return Value du Create Widget dans une variable (**promote to variable**) pour reutiliser le widget plus tard sans le recreer. Attention : **Add to Viewport** ajoute le widget a la racine du viewport (comme une nouvelle fenetre), a ne pas confondre avec **Add Child** qui parente un widget dans un panneau. **Recommandation** : encapsuler la creation et la gestion des widgets dans une classe **HUD** (ou un HUD Subsystem dedie) plutot que dans le Player Character, afin de reduire les dependances.",
        "keypoints": [
          "**Create Widget** : cree l'instance EN MEMOIRE (n'affiche rien)",
          "**Add to Viewport** : AFFICHE l'instance a l'ecran",
          "Stocker la reference en variable pour la reutiliser",
          "Encapsuler la creation dans la classe **HUD**, pas le Character"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Afficher un widget : Create Widget + Add to Viewport"
      },
      {
        "title": "Cycle de vie du widget et performance",
        "body": "Trois evenements structurent le cycle de vie. **Event Pre-Construct** s'execute dans l'editeur a chaque modification du Widget Blueprint : ideal pour parametrer des proprietes et visualiser l'apparence des widgets derives directement dans l'editeur, avant meme de lancer le jeu. **Event Construct** est appele **une seule fois** au moment ou le widget est cree et ajoute en memoire (au Create Widget ou a l'ajout dans la hierarchie d'un parent) : on y fait les initialisations, le chargement initial des donnees et le lancement des animations d'intro. **Event Tick** s'execute a **chaque frame** : son usage sur les widgets est generalement inefficace et doit etre evite (charge CPU). Cote performance : un widget ne se met a jour que lorsqu'il est **invalide** ; l'**Invalidation (caching)** met en cache les etapes **Paint** et **Layout** de Slate pour eviter de les recalculer chaque frame (gain CPU important). L'invalidation se propage en cascade (Paint < Layout < Visibility < Order). Certains widgets sont couteux car ils exigent **deux passes Slate** (Size Box en mise a l'echelle, Scale Box, Rich Text, Text avec Auto Wrap multiligne) : a utiliser avec parcimonie. Astuce : pour masquer un widget 3D, utiliser **Collapsed** plutot que **Hidden** (Hidden reste inclus dans les calculs de layout).",
        "keypoints": [
          "**Pre-Construct** : dans l'editeur, a chaque modif (apercu)",
          "**Construct** : une seule fois a la creation (initialisations)",
          "**Tick** : chaque frame, a eviter (perf)",
          "**Invalidation/caching** = mise en cache Paint + Layout de Slate"
        ],
        "versionNote": "Le pourcentage exact de gain CPU cite en cours (~60%) est illustratif ; l'important est le principe d'invalidation/caching de Slate, valide en UE 5.4.",
        "tier": 2,
        "front": "Cycle de vie du widget : Pre-Construct, Construct, Tick"
      },
      {
        "title": "Panneaux de layout : Canvas Panel, Box, Stack Box, Spacer",
        "body": "Le layout repose sur l'usage strategique des **Panels**. **Canvas Panel** : conteneur principal par defaut permettant le **positionnement absolu** des enfants ; c'est le **seul panneau qui permet d'utiliser les Ancres (Anchors)**, les enfants y sont places dans un **Slot Canvas Panel**. A n'utiliser que si l'on a vraiment besoin d'un placement libre (HUD principal, effets a l'ecran). Pour le reste, on prefere des structures hierarchiques qui s'adaptent au contenu (**Flow Layout**), evitant le positionnement absolu. **Vertical Box** et **Horizontal Box** : conteneurs qui empilent automatiquement les enfants dans une seule direction (verticale ou horizontale) et ajustent l'espacement ; parfaits pour listes, menus et barres d'outils. **Stack Box** : combine Horizontal et Vertical Box, avec orientation controlable (utile pour des designs adaptatifs, ex. horizontal sur grand ecran / vertical sur mobile). **Spacer** : ajoute un rembourrage proportionnel et **force l'espace de layout**, poussant les widgets adjacents pour leur faire de la place. **Border** est souvent utilise comme conteneur de panneau (equivalent d'un panel), avec une option **Size to Content**.",
        "keypoints": [
          "**Canvas Panel** = positionnement absolu, seul a gerer les Anchors",
          "**Vertical/Horizontal Box** = empilement auto dans une direction",
          "**Stack Box** = combine H et V, orientation controlable",
          "Preferer le **Flow Layout** (Box) au positionnement absolu"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Panneaux de layout : Canvas, Box, Stack Box, Spacer"
      },
      {
        "title": "Les Ancres (Anchors) et l'Alignment",
        "body": "Les **Ancres (Anchors)** definissent le **point de reference sur l'ecran** auquel un widget est fixe (uniquement dans un Canvas Panel). La position du widget (**Offset** : Left, Top, Right, Bottom) est calculee **relativement a son ancre**. Les ancres garantissent que les elements conservent une position coherente quand la **taille ou le rapport d'aspect** de l'ecran change (UI responsive). On choisit une ancre depuis les **presets** ou manuellement via les parametres **Minimum (X,Y)** et **Maximum (X,Y)** : Min(0,0)/Max(0,0) = coin superieur gauche, Min(1,1)/Max(1,1) = coin inferieur droit. Cas typiques : pour **remplir tout l'ecran (Full Screen)**, choisir l'ancre Full Screen et mettre **tous les Offsets (Left, Top, Right, Bottom) a 0** ; pour **centrer** un widget de facon fiable, mettre l'ancre au **Centre** et regler l'**Alignment (X/Y) a 0.5** (50%), ce qui aligne le widget sur son propre centre. Astuce editeur : maintenir **Ctrl** en deplacant l'ancre deplace ancre + widget ensemble.",
        "keypoints": [
          "**Anchor** = point de reference ecran ; **Offset** relatif a l'ancre",
          "Assure une position coherente selon taille/ratio d'ecran",
          "Full Screen : ancre plein ecran + tous les Offsets a 0",
          "Centrer : ancre au centre + **Alignment** X/Y = 0.5"
        ],
        "versionNote": "Comportement des Anchors (Min/Max, presets, offsets) confirme pour UE 5.4.",
        "tier": 2,
        "front": "Anchors et Alignment : UI responsive"
      },
      {
        "title": "DPI Scaling et styles (Font, Brush, materiaux UI)",
        "body": "Le **DPI Scaling (Dots Per Inch Scaling)** est le systeme d'Unreal pour la **mise a l'echelle automatique de l'UI independamment de la resolution**, garantissant une taille coherente et lisible sur tout ecran. L'echelle est definie par une **courbe DPI** qui mappe des resolutions (ex. 1080p) a un facteur d'echelle. Reglages : **Project Settings > Engine > User Interface**. La **DPI Scale Rule** determine quelle dimension de la fenetre (cote court, cote long, horizontal ou vertical) sert a evaluer la courbe. Cote **styles** : les **Font** (police) gerent le texte, avec le **Mono Spacing** garantissant une largeur constante par caractere (crucial pour scores/minuteries afin d'eviter que le texte 'danse'). Les **Brushes** definissent l'apparence visuelle des elements et leurs **etats (Normal, Hovered, Pressed)** ; les styles se copient/collent entre etats ou boutons. Optimisation : utiliser des **materiaux UI (shaders)** pour generer formes et degrades via calculs d'UV plutot que de grosses textures (economie memoire). Import d'assets UI : **Texture Group = UI** et **Compression Setting = UserInterface2D**.",
        "keypoints": [
          "**DPI Scaling** = mise a l'echelle UI independante de la resolution",
          "Reglages : Project Settings > Engine > User Interface",
          "**Brushes** : apparence + etats Normal/Hovered/Pressed",
          "**Materiaux UI** et Texture Group=UI pour optimiser"
        ],
        "versionNote": "En UE 5.4, les parametres de DPI Scaling se trouvent bien dans Project Settings > Engine > User Interface.",
        "tier": 2,
        "front": "DPI Scaling et styles (Font, Brush)"
      },
      {
        "title": "Variables de widget : Is Variable, types, Expose on Spawn",
        "body": "Tout composant (TextBlock, Image, panneau, ou un UserWidget entier) peut etre transforme en **variable** pour etre manipule dans le Graph. Pour cela, il faut **cocher la case Is Variable** dans le panneau **Details** de l'element selectionne. Seuls les composants dont **Is Variable est coche** apparaissent dans **My Blueprint > Variables**, permettant un acces en **Get/Set** (ex. appeler **SetText** sur un bloc de texte, ou modifier position/visibilite/couleur). Les variables peuvent etre de **types standard** (Float, Boolean, Integer...) ou **specifiques aux widgets** (**Slate Font Info** pour les polices, **Linear Color** pour les couleurs). Options importantes : **Expose on Spawn** permet de **passer des valeurs au widget des son instanciation** (des l'appel du noeud Create Widget), sans noeuds Set supplementaires ; **Instance Editable** (Instance Editable / DesignerEditable) rend la variable modifiable dans le panneau Details lors de l'instanciation. Recommandation : marquer les variables internes en **Blueprint Read Only** ou **Private** pour une bonne encapsulation.",
        "keypoints": [
          "Cocher **Is Variable** (Details) pour exposer un composant au Graph",
          "Seuls ces composants apparaissent dans My Blueprint > Variables",
          "Types specifiques : Slate Font Info, Linear Color",
          "**Expose on Spawn** : passer des valeurs des le Create Widget"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Is Variable et Expose on Spawn : variables de widget"
      },
      {
        "title": "Bindings vs architecture pilotee par evenements",
        "body": "Un **Property Binding (liaison de propriete)** lie une propriete visuelle (texte, couleur d'un brush, pourcentage d'une ProgressBar) a une **fonction Blueprint** : chaque fois que la propriete est affichee, la fonction liee est executee pour retourner la valeur actuelle, sans script manuel. **Probleme majeur** : un Binding s'execute a **chaque frame**, de maniere similaire a **Event Tick** ; avec beaucoup de bindings (ex. 50 slots d'inventaire), cela surcharge inutilement le CPU meme si les donnees ne changent pas (plus un couplage fort et un debug difficile). **Methode recommandee : l'architecture pilotee par evenements (Event-Driven)** : ne mettre a jour un widget **que lorsque les donnees changent reellement**. Au lieu d'un binding, on met a jour la propriete **manuellement** via des fonctions **Set** (**SetText, SetPercent, SetRenderOpacity**) en reponse a un evenement. On identifie la **source de donnees** (ex. PlayerState, HealthComponent), on recupere sa reference dans **Event Construct**, puis on **Bind Event** au Dispatcher de la source. C'est ainsi qu'on met a jour proprement une **barre de vie** (SetPercent) uniquement quand les PV changent.",
        "keypoints": [
          "**Property Binding** = propriete liee a une fonction, evaluee chaque frame",
          "Cout CPU eleve (comme Tick), couplage fort, debug difficile",
          "Preferer **event-driven** : mise a jour au changement seulement",
          "Fonctions **Set** (SetText, SetPercent) sur evenement"
        ],
        "versionNote": "Le plugin MVVM (Model-View-ViewModel), qui automatise le data binding via Field Notifies, est en beta/experimental en UE 5.4.",
        "tier": 3,
        "front": "Property Binding vs architecture event-driven"
      },
      {
        "title": "Event Dispatchers : communication decouplee",
        "body": "Un **Event Dispatcher** est un mecanisme permettant a un widget (ou un Actor) d'**annoncer qu'une action a eu lieu** (ex. un bouton a ete clique). Il fonctionne en deux temps : le widget **source** declenche l'evenement avec **Call** (Call/Execute), et le ou les destinataires **s'abonnent** avec **Bind**. **Avantage principal : le decouplage** : la source n'a pas besoin de savoir qui l'ecoute ni comment la logique sera traitee. Les Event Dispatchers crees dans un widget sont **exposes en bas du panneau Details**, ce qui permet aux autres Blueprints de s'y abonner directement. Cas d'usage typiques : un bouton 'Play' qui declenche un dispatcher **OnPlayClicked** ; un **PlayerState** qui declenche **OnHealthChanged**, auquel le widget de HUD s'abonne pour mettre a jour sa barre de vie ou jouer une animation de degats ; ou la communication **UI vers 3D** (un bouton d'UI declenche une action dans un Actor 3D qui s'est abonne au dispatcher). Le decouplage evite les Casts en dur et facilite la maintenance.",
        "keypoints": [
          "**Event Dispatcher** = annonce qu'une action a eu lieu (ex. clic)",
          "**Call** (source declenche) vs **Bind** (destinataire s'abonne)",
          "Avantage : **decouplage** (la source ignore ses ecouteurs)",
          "Exposes en bas du panneau Details du widget"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Event Dispatcher : communication decouplee"
      },
      {
        "title": "Evenements de widgets : boutons, sliders, focus et input",
        "body": "L'interactivite repose sur des **evenements predefinis** accessibles dans le Graph. Un **Button** expose **On Clicked / On Pressed / On Released** (interaction principale) et **On Hovered / On Unhovered** (survol / focus). Pour reagir a un clic : selectionner le bouton dans la Hierarchie et ajouter l'event **OnClicked**, ce qui cree le noeud dans le Graph. Il faut configurer les etats **Normal, Hovered, Pressed** sous Style pour un bon retour visuel (feedback). Un **Slider** lie son **pourcentage (Percent)** a une valeur (volume, sensibilite, luminosite) et expose **On Value Changed**, **On Mouse Capture Begin/End**, **On Controller Capture Begin/End**. Un champ de texte (**Editable Text / Editable Text Box**) reagit a **On Text Changed** (validation d'entree). Navigation **sans souris** (manette/clavier) : le widget doit avoir le **Focus**, donc **Is Focusable** coche (souvent sur le widget racine) ; le moteur gere le mouvement automatique (D-Pad/fleches) entre widgets freres, ajustable via les proprietes de **Navigation** (Explicit, Wrap, Escape). Cote **PlayerController** : **Set Input Mode UI Only** (menus/pause : desactive l'input jeu, focus vers l'UI, requiert un Widget to Focus Is Focusable) vs **Set Input Mode Game and UI** (HUD non-invasifs). En mode UI Only, penser a **Set Show Mouse Cursor (True)** sur le Player Controller (souvent au Begin Play) pour voir/utiliser le curseur.",
        "keypoints": [
          "**Button** : On Clicked/Pressed/Released + On Hovered",
          "**Slider** : Percent + On Value Changed",
          "**Is Focusable** requis pour la navigation manette/clavier",
          "**Set Input Mode UI Only** vs Game and UI (PlayerController)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Evenements : boutons, sliders, focus et input"
      },
      {
        "title": "Animations UMG : Timeline, tracks et lecture",
        "body": "UMG inclut des outils d'animation pour le polish et le feedback. La **Timeline (fenetre Sequenceur)**, en bas de l'editeur de Widget Blueprint, est l'outil principal ; on anime en placant des **Keyframes (images cles)** a des instants precis, chacune definissant la valeur d'une propriete a ce moment. On ajoute une **Track (piste)** par propriete a animer, via le bouton **Add Key** a cote du parametre. Proprietes animables courantes : **Position/Translation** (slide-in/out), **Opacity/Render Opacity** (fade-in/out), **Color/Tint**, **Scale**. Pour les materiaux, les sections **Absolute** (interpole de la valeur actuelle a la valeur du track) et **Additive** (ajoute/soustrait a la valeur actuelle) permettent de tweener sans Blueprint. **Important** : une animation ne se joue pas juste en cliquant Play dans l'editeur ; **il faut la jouer par code**. Toute animation creee est **automatiquement exposee comme variable** dans le Graph ; on appelle dessus **Play Animation**, **Play Animation Reverse** (fermeture), ou **Play Forward and Reverse** (se souvient de l'etat, ideal pour le hover) et **Stop Animation**. Astuce : **numLoopsToPlay = 0** joue en boucle (combine au playmode **PingPong**). L'animation expose des **Events**, dont **OnAnimationFinished** (chainer des animations, ou appeler **Remove From Parent** apres une animation de sortie jouee en **Reverse** plutot que de retirer le widget brutalement).",
        "keypoints": [
          "**Timeline/Sequenceur** en bas de l'editeur ; keyframes precises",
          "Tracks : Position, Opacity, Color, Scale",
          "Animation auto-exposee comme variable dans le Graph",
          "**Play Animation** / Reverse / Forward and Reverse"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Animations UMG : Timeline, tracks et lecture"
      },
      {
        "title": "Widget Component : UI 3D / diegetique et communication 3D-UI",
        "body": "Le **Widget Component** est un composant d'Actor (3D) qui affiche un **User Widget (UI 2D)** dans l'environnement 3D du jeu. On le configure avec la **Widget Class** (le Widget Blueprint 2D rendu comme une texture) et la **Draw Size** (resolution interne, ex. 900x900, convertie en texture 3D : a optimiser). Deux espaces : **World** (surface 3D fixe, subit perspective et occlusion, ex. ecran d'ordinateur) et **Screen** (toujours face a la camera, ideal pour etiquettes de nom ou barres de sante au-dessus des ennemis). C'est la base des **UIs diegetiques** (integrees a l'univers : panneaux interactifs, inventaires 3D via Scene Capture Component, HUD flottants). Pour interagir en 3D, on ajoute un **Widget Interaction Component (WIC)** au joueur : il agit comme un pointeur virtuel, effectue un **Line Trace / Sphere Trace** et simule les evenements souris via **Press Pointer Key / Release Pointer Key** (option **Show Debug** pour visualiser le rayon). Communication **3D vers UI** : Widget Component -> **Get User Widget Object** -> **Cast** vers la classe de widget pour acceder a ses fonctions/variables. Communication **UI vers 3D** : le widget cree un **Event Dispatcher**, et l'Actor 3D s'y abonne (souvent dans son Event Begin Play).",
        "keypoints": [
          "**Widget Component** = User Widget 2D affiche dans le monde 3D",
          "**Widget Class** + **Draw Size** (resolution -> texture)",
          "Space **World** (surface fixe) vs **Screen** (face camera)",
          "3D->UI : Get User Widget Object + Cast ; UI->3D : Dispatcher"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Widget Component : UI 3D / diegetique"
      },
      {
        "title": "Gerer l'UI : classe HUD, PlayerController, Z-Order, GameInstance",
        "body": "La **classe HUD** est la solution professionnelle pour **centraliser la gestion de l'UI** : elle sert de conteneur et de gestionnaire (UIManager) pour tous les widgets affiches a l'ecran du joueur local. Ses fonctions natives de dessin direct (textures, lignes, triangles) sont anterieures a l'UMG et **rarement utilisees** aujourd'hui ; la classe a un cote **'legacy'** mais reste **recommandee** pour la gestion locale de l'UI (centralisation de la creation, decouplage, gestion de la visibilite, accessibilite via **GetHUD**). Le **Game Mode** definit la classe HUD par defaut (slot HUD). Pour l'utiliser : noeud **Get HUD** -> **Cast** vers sa classe (ex. BP_MyHUD) -> **stocker la reference** dans une variable pour eviter les Casts repetes. Le **PlayerController** gere l'**input local** (clavier, souris, manette) et est ideal pour initier une action UI (ex. Echap ouvre le Menu Pause) avant de deleguer l'ouverture/fermeture au HUD. Le **Z-Order** est un **entier** qui definit l'ordre de superposition (layering) : valeur plus elevee = rendu au-dessus (ex. 0/-1 pour le HUD principal, 10-50 pour les menus, 100+ pour les pop-ups modaux). Enfin, la **GameInstance** persiste toute la session (meme lors des changements de niveau) et stocke les donnees globales (nom du joueur, progression) accessibles par les widgets a tout moment. Approches globales : **Map de widgets** (UIManager) et **Function Libraries** (ex. GetPlayerHUDRef) pour reduire le Casting.",
        "keypoints": [
          "Classe **HUD** = gestionnaire central des widgets (legacy mais utile)",
          "**Get HUD** -> Cast -> stocker la reference (eviter les Casts)",
          "**Z-Order** = entier ; valeur elevee = rendu au-dessus",
          "**GameInstance** = donnees globales persistantes entre niveaux"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Gerer l'UI : HUD, PlayerController, Z-Order, GameInstance"
      }
    ],
    "quiz": [
      {
        "q": "Sur quel framework de bas niveau le systeme d'interface UMG d'Unreal Engine est-il construit ?",
        "choices": [
          "Le framework Slate",
          "Le framework Scaleform",
          "Le moteur web CEF",
          "La librairie ImGui"
        ],
        "answer": 0,
        "explain": "Les interfaces UMG d'Unreal Engine sont construites par-dessus le framework Slate UI, la couche d'interface bas niveau du moteur.",
        "difficulty": "facile",
        "topic": "UMG et framework Slate",
        "def": {
          "term": "Slate",
          "text": "Framework d'interface (UI) bas niveau d'Unreal, écrit en C++, sur lequel repose UMG pour construire menus et HUD."
        }
      },
      {
        "q": "En quels deux environnements de travail un Widget Blueprint est-il divise ?",
        "choices": [
          "Le Viewport et l'Outliner",
          "La Palette et la Hiérarchie",
          "Le Designer et le Graph",
          "Le Blueprint et le Matériau"
        ],
        "answer": 2,
        "explain": "Chaque Widget Blueprint possede un Designer (l'apparence de l'UI) et un Graph (la logique, les interactions et les evenements comme OnClicked).",
        "difficulty": "facile",
        "topic": "Designer vs Graph",
        "def": {
          "term": "Designer & Graph",
          "text": "Les deux modes d'un Widget Blueprint : le Designer (composition visuelle de l'UI) et le Graph (logique, événements et interactions Blueprint)."
        }
      },
      {
        "q": "Dans l'editeur de widget, quel panneau contient les composants a poser (Button, Text, Image, ProgressBar) ?",
        "choices": [
          "Le panneau Hiérarchie",
          "Le panneau Palette",
          "Le panneau Details",
          "Le panneau My Blueprint"
        ],
        "answer": 1,
        "explain": "La Palette est la boite a outils principale : c'est de la que l'on glisse-depose les composants natifs (Button, Text, Image, ProgressBar, Border...) dans le Designer. La Hierarchie, elle, affiche la structure des elements deja poses.",
        "difficulty": "facile",
        "topic": "Palette / Editeur",
        "def": {
          "term": "Palette",
          "text": "Boîte à outils du Designer regroupant tous les composants UMG (Button, Text, Image, ProgressBar...) à glisser-déposer dans le widget."
        }
      },
      {
        "q": "Dans la Hierarchie d'un widget, comment est determine l'ordre de rendu des calques ?",
        "choices": [
          "Le premier de la liste passe toujours devant",
          "L'ordre alphabétique des noms décide",
          "Les images passent toujours en dernier",
          "Un Z-order plus élevé est rendu au-dessus"
        ],
        "answer": 3,
        "explain": "La Hierarchie affiche la structure en calques et l'ordre est inverse d'une liste classique : un widget ayant une valeur de Z-order plus elevee sera rendu par-dessus les autres elements.",
        "difficulty": "moyen",
        "topic": "Hierarchie",
        "def": {
          "term": "Z-order (calques)",
          "text": "Entier définissant l'ordre de superposition des widgets : plus la valeur est élevée, plus l'élément est rendu au-dessus des autres."
        }
      },
      {
        "q": "A quoi sert le Widget Component ?",
        "choices": [
          "Convertir un Widget Blueprint en matériau",
          "Compiler le Blueprint d'un widget UMG",
          "Afficher un User Widget dans le monde 3D",
          "Regrouper des widgets dans la Palette"
        ],
        "answer": 2,
        "explain": "Le Widget Component est un composant d'Actor qui affiche un User Widget dans l'espace 3D (World ou Screen). On y definit la Widget Class a afficher et la Draw Size (resolution interne convertie en texture). Ideal pour les UIs diegetiques et les barres de vie au-dessus des ennemis.",
        "difficulty": "moyen",
        "topic": "Widget Component",
        "def": {
          "term": "Widget Component",
          "text": "Composant d'Actor affichant un User Widget 2D dans l'espace 3D (World ou Screen) ; on définit sa Widget Class et sa Draw Size."
        }
      },
      {
        "q": "Que fait exactement le noeud Create Widget ?",
        "choices": [
          "Il affiche le widget à l'écran du joueur",
          "Il crée l'instance du widget en mémoire",
          "Il retire le widget du viewport actif",
          "Il compile le Widget Blueprint cible"
        ],
        "answer": 1,
        "explain": "Create Widget instancie le widget EN MEMOIRE (on precise la Class, la Return Value est le widget cree). Il ne l'affiche pas : il faut ensuite appeler Add to Viewport pour le rendre visible.",
        "difficulty": "facile",
        "topic": "Create Widget",
        "def": {
          "term": "Create Widget",
          "text": "Nœud qui instancie un Widget Blueprint en mémoire (Return Value = le widget) sans l'afficher ; il faut ensuite Add to Viewport."
        }
      },
      {
        "q": "Quel noeud affiche a l'ecran du joueur une instance de widget deja creee ?",
        "choices": [
          "Le nœud Create Widget",
          "Le nœud Set Visibility",
          "Le nœud Add Child to Canvas",
          "Le nœud Add to Viewport"
        ],
        "answer": 3,
        "explain": "Add to Viewport dessine le widget a la racine du viewport (comme une nouvelle fenetre). A ne pas confondre avec Add Child qui parente un widget dans un panneau.",
        "difficulty": "facile",
        "topic": "Add to Viewport",
        "def": {
          "term": "Add to Viewport",
          "text": "Nœud qui dessine une instance de widget à la racine du viewport du joueur (comme une fenêtre), la rendant visible à l'écran."
        }
      },
      {
        "q": "L'Event Construct d'un widget est appele...",
        "choices": [
          "Une seule fois, à la création du widget",
          "À chaque frame de jeu, comme l'Event Tick",
          "Dans l'éditeur, à chaque modification",
          "À chaque survol du widget par la souris"
        ],
        "answer": 0,
        "explain": "Event Construct est appele une seule fois au moment de la creation/ajout du widget (Create Widget ou ajout a la hierarchie d'un parent). On y fait les initialisations et le lancement des animations d'intro.",
        "difficulty": "moyen",
        "topic": "Cycle de vie",
        "def": {
          "term": "Event Construct",
          "text": "Événement appelé une seule fois à la création du widget (Create Widget/ajout au parent) ; on y place initialisations et animations d'intro."
        }
      },
      {
        "q": "Quelle particularite a l'Event Pre-Construct ?",
        "choices": [
          "Il ne s'exécute qu'au premier lancement du jeu",
          "Il remplace l'Event Tick sur les widgets",
          "Il s'exécute dans l'éditeur, à chaque édition",
          "Il ne marche que sur les Widget Components 3D"
        ],
        "answer": 2,
        "explain": "Event Pre-Construct s'execute dans l'editeur a chaque modification du Widget Blueprint. Il est ideal pour parametrer des proprietes et visualiser l'apparence des widgets derives directement dans l'editeur, avant meme de lancer le jeu.",
        "difficulty": "moyen",
        "topic": "Cycle de vie",
        "def": {
          "term": "Event Pre-Construct",
          "text": "Événement joué dans l'éditeur à chaque modification du widget : prévisualise l'apparence des widgets dérivés sans lancer le jeu."
        }
      },
      {
        "q": "Pourquoi le cours deconseille-t-il d'utiliser l'Event Tick sur les widgets ?",
        "choices": [
          "Il ne fonctionne pas dans un Widget Blueprint",
          "Il tourne à chaque frame et charge le CPU",
          "Il bloque l'affichage du curseur souris",
          "Il désactive les animations du widget"
        ],
        "answer": 1,
        "explain": "Event Tick s'execute a chaque frame ; son usage sur les widgets est generalement inefficace et doit etre evite pour des raisons de performance. On prefere une approche event-driven (mise a jour seulement quand les donnees changent).",
        "difficulty": "facile",
        "topic": "Performance / Tick",
        "def": {
          "term": "Event Tick",
          "text": "Événement exécuté à chaque frame. Sur un widget, il est coûteux en CPU et déconseillé ; on lui préfère une mise à jour event-driven."
        }
      },
      {
        "q": "Quel panneau permet le positionnement absolu et est le SEUL a supporter les Ancres ?",
        "choices": [
          "Le Horizontal Box",
          "L'Overlay Panel",
          "Le Vertical Box",
          "Le Canvas Panel"
        ],
        "answer": 3,
        "explain": "Le Canvas Panel est le conteneur par defaut qui permet le positionnement absolu des enfants (dans un Slot Canvas Panel) et c'est le seul panneau qui permet d'utiliser les Ancres. A reserver aux cas necessitant un placement libre (HUD, effets a l'ecran).",
        "difficulty": "moyen",
        "topic": "Canvas Panel",
        "def": {
          "term": "Canvas Panel",
          "text": "Panneau à positionnement absolu, seul à gérer les Ancres et l'Offset ; à réserver aux placements libres (HUD, effets plein écran)."
        }
      },
      {
        "q": "Comment se comportent un Vertical Box et un Horizontal Box ?",
        "choices": [
          "Ils empilent les enfants dans une seule direction",
          "Ils positionnent les enfants en absolu, via des ancres",
          "Ils affichent les enfants en 3D dans le monde",
          "Ils n'acceptent qu'un seul enfant à la fois"
        ],
        "answer": 0,
        "explain": "Ces conteneurs organisent les enfants dans une seule direction (verticale ou horizontale) : les elements s'empilent automatiquement et ajustent leur espacement. Ils sont parfaits pour les listes, menus et barres d'outils (Flow Layout).",
        "difficulty": "facile",
        "topic": "Panneaux de layout",
        "def": {
          "term": "Vertical/Horizontal Box",
          "text": "Panneaux de Flow Layout qui empilent les enfants dans une seule direction (verticale ou horizontale) en ajustant automatiquement l'espacement."
        }
      },
      {
        "q": "Que definissent les Ancres (Anchors) d'un widget dans un Canvas Panel ?",
        "choices": [
          "La couleur de fond et la bordure du widget UI",
          "L'ordre de rendu des calques à l'écran",
          "Le point d'écran auquel le widget est fixé",
          "La vitesse de l'animation d'ouverture"
        ],
        "answer": 2,
        "explain": "Les Ancres definissent le point de reference sur l'ecran auquel le widget est fixe ; sa position (Offset) est calculee relativement a l'ancre. Cela garantit une position coherente quand la taille ou le rapport d'aspect de l'ecran change (UI responsive).",
        "difficulty": "moyen",
        "topic": "Anchors",
        "def": {
          "term": "Ancres (Anchors)",
          "text": "Point de référence écran auquel un widget est fixé dans un Canvas Panel ; sa position (Offset) est calculée par rapport à lui, pour une UI responsive."
        }
      },
      {
        "q": "Pour centrer un widget de maniere fiable, que faut-il faire ?",
        "choices": [
          "Ancre en Top Left et Alignment X/Y à 0",
          "Ancre au Centre et Alignment X/Y à 0.5",
          "Tous les Offsets à 0 avec l'ancre Centre",
          "Cocher Is Focusable sur le widget racine"
        ],
        "answer": 1,
        "explain": "Pour un centrage fiable, on definit l'ancre au Centre et on regle l'Alignment (X/Y) sur 0.5 (50%), de sorte que le widget soit aligne sur son propre centre. L'ancre Full Screen + offsets a 0 sert au contraire a remplir tout l'ecran.",
        "difficulty": "difficile",
        "topic": "Alignment",
        "def": {
          "term": "Alignment",
          "text": "Point de pivot du widget (0-1 sur X et Y) relatif à sa propre taille. Centre + Alignment 0.5 aligne le widget sur son propre centre."
        }
      },
      {
        "q": "Comment faire pour qu'un element remplisse tout l'ecran (Full Screen) ?",
        "choices": [
          "Régler l'Alignment X/Y sur 0.5 précisément",
          "Donner un Z-order élevé (100) au widget",
          "Activer un DPI Scaling au facteur 2.0",
          "Ancre Full Screen et tous les Offsets à 0"
        ],
        "answer": 3,
        "explain": "Pour remplir tout l'ecran, on choisit l'ancre Full Screen (etiree sur tout le Canvas) puis on met tous les Offsets Left/Top/Right/Bottom a 0, ce qui colle le widget aux quatre bords.",
        "difficulty": "moyen",
        "topic": "Anchors",
        "def": {
          "term": "Full Screen (Anchors)",
          "text": "Preset d'ancre étirant le widget sur tout le Canvas ; en mettant les quatre Offsets à 0, il se colle aux bords et remplit l'écran."
        }
      },
      {
        "q": "A quoi sert le DPI Scaling et ou se configure-t-il en UE 5.4 ?",
        "choices": [
          "Augmenter le nombre de polygones à l'écran ; Rendering Settings",
          "Régler l'ordre des calques ; la Hiérarchie du widget",
          "Mettre l'UI à l'échelle ; Project Settings > User Interface",
          "Compresser les textures UI ; dans le Content Browser"
        ],
        "answer": 2,
        "explain": "Le DPI Scaling assure la mise a l'echelle automatique de l'UI independamment de la resolution (taille coherente et lisible). Les parametres se trouvent dans Project Settings > Engine > User Interface, et la DPI Scale Rule choisit la dimension d'ecran evaluee par la courbe.",
        "difficulty": "moyen",
        "topic": "DPI Scaling",
        "def": {
          "term": "DPI Scaling",
          "text": "Système de mise à l'échelle automatique de l'UI selon la résolution, défini par une courbe DPI (Project Settings > Engine > User Interface)."
        }
      },
      {
        "q": "Que faut-il faire pour qu'un composant (ex. un TextBlock) soit accessible en Get/Set dans le Graph ?",
        "choices": [
          "Cocher la case Is Variable dans ses Details",
          "Le placer dans un Canvas Panel racine",
          "Lui donner un Z-order supérieur à zéro",
          "Activer l'option Expose on Spawn du composant"
        ],
        "answer": 0,
        "explain": "Il faut cocher Is Variable dans les Details du composant. Seuls les composants dont Is Variable est coche apparaissent dans My Blueprint > Variables et deviennent accessibles en Get/Set (ex. pour appeler SetText).",
        "difficulty": "moyen",
        "topic": "Is Variable",
        "def": {
          "term": "Is Variable",
          "text": "Case (panneau Details) qui expose un composant du widget comme variable dans My Blueprint, le rendant accessible en Get/Set dans le Graph."
        }
      },
      {
        "q": "A quoi sert l'option Expose on Spawn sur une variable de widget ?",
        "choices": [
          "Rendre la variable visible dans le monde 3D en jeu",
          "Passer une valeur au widget dès le Create Widget",
          "Empêcher toute modification de la variable",
          "Jouer une animation d'intro au démarrage"
        ],
        "answer": 1,
        "explain": "Expose on Spawn permet de passer des valeurs au widget des son instanciation (le parametre apparait sur le noeud Create Widget), ce qui evite d'ajouter des noeuds Set apres la creation. Utile pour initialiser un titre de menu ou un identifiant.",
        "difficulty": "moyen",
        "topic": "Variables de widget",
        "def": {
          "term": "Expose on Spawn",
          "text": "Option d'une variable qui la fait apparaître comme entrée sur le nœud Create Widget, pour l'initialiser dès l'instanciation sans nœud Set."
        }
      },
      {
        "q": "Pourquoi le cours recommande-t-il d'eviter les Property Bindings pour les UIs performantes ?",
        "choices": [
          "Les Bindings ne marchent qu'avec les Widget 3D",
          "Les Bindings bloquent l'usage des ancres du Canvas Panel",
          "Les Bindings suppriment le widget après la frame",
          "Chaque Binding s'évalue à chaque frame, comme un Tick"
        ],
        "answer": 3,
        "explain": "Un Property Binding est evalue a chaque frame (de maniere similaire a Event Tick), meme si les donnees ne changent pas. Avec de nombreux bindings, cela surcharge inutilement le CPU (plus couplage fort et debug difficile). On prefere l'architecture event-driven.",
        "difficulty": "difficile",
        "topic": "Bindings",
        "def": {
          "term": "Property Binding",
          "text": "Liaison d'une propriété visuelle à une fonction, réévaluée à chaque frame (comme un Tick). Coûteux en CPU ; à remplacer par l'event-driven."
        }
      },
      {
        "q": "Dans une approche event-driven, comment met-on a jour proprement une barre de vie (ProgressBar) ?",
        "choices": [
          "En laissant un Binding lire la vie chaque frame",
          "En utilisant Event Tick pour sonder la vie",
          "En appelant SetPercent quand les PV changent",
          "En recréant le widget à chaque changement de PV"
        ],
        "answer": 2,
        "explain": "L'approche event-driven met a jour la propriete manuellement via des fonctions Set (SetPercent pour une ProgressBar, SetText, SetRenderOpacity...) uniquement en reponse a un evenement (ex. un dispatcher OnHealthChanged), au lieu de sonder la valeur chaque frame.",
        "difficulty": "moyen",
        "topic": "Event-driven / barres de vie",
        "def": {
          "term": "Mise à jour event-driven",
          "text": "Actualiser un widget uniquement quand les données changent, via des fonctions Set (SetPercent, SetText) déclenchées par un événement/dispatcher."
        }
      },
      {
        "q": "Quel est l'avantage principal d'un Event Dispatcher ?",
        "choices": [
          "Le découplage : la source ignore qui l'écoute",
          "Il joue automatiquement les animations du widget",
          "Il double la vitesse de rendu de l'écran",
          "Il remplace la classe HUD du joueur local"
        ],
        "answer": 0,
        "explain": "Un Event Dispatcher permet a un widget d'annoncer une action (Call), a laquelle d'autres Blueprints s'abonnent (Bind). L'avantage majeur est le decouplage : le widget source ignore qui l'ecoute et comment la logique sera traitee. Les dispatchers sont exposes en bas du panneau Details.",
        "difficulty": "moyen",
        "topic": "Event Dispatcher",
        "def": {
          "term": "Event Dispatcher",
          "text": "Mécanisme d'annonce (Call) auquel d'autres Blueprints s'abonnent (Bind). Il découple la source de ses écouteurs, base de l'architecture event-driven."
        }
      },
      {
        "q": "Comment fait-on reagir le jeu au clic d'un Button ?",
        "choices": [
          "En cochant Is Focusable sur le Canvas Panel racine",
          "En ajoutant l'event OnClicked au bouton, dans le Graph",
          "En réglant le Z-order du bouton à 100 ou davantage",
          "En activant le DPI Scaling sur le widget du bouton cliqué"
        ],
        "answer": 1,
        "explain": "On selectionne le bouton dans la Hierarchie puis on ajoute l'evenement OnClicked, ce qui cree le noeud correspondant dans le Graph. Le bouton expose aussi On Pressed/On Released et On Hovered/On Unhovered.",
        "difficulty": "facile",
        "topic": "Evenements de widgets",
        "def": {
          "term": "Événement OnClicked",
          "text": "Événement d'un Button, ajouté depuis la Hiérarchie, qui crée un nœud dans le Graph déclenché au clic. Le bouton expose aussi Pressed/Hovered."
        }
      },
      {
        "q": "Quel evenement d'un Slider se declenche lorsque sa valeur change (utile pour un reglage de volume) ?",
        "choices": [
          "On Mouse Captured",
          "On Text Changed",
          "On Focus Received",
          "On Value Changed"
        ],
        "answer": 3,
        "explain": "Le Slider lie son pourcentage (Percent) a une valeur et expose On Value Changed (ainsi que On Mouse/Controller Capture Begin/End). C'est ideal pour le volume audio, la sensibilite souris ou la luminosite.",
        "difficulty": "moyen",
        "topic": "Sliders",
        "def": {
          "term": "Slider - On Value Changed",
          "text": "Événement du Slider déclenché à chaque changement de sa valeur (Percent) ; sert à piloter volume, sensibilité ou luminosité en temps réel."
        }
      },
      {
        "q": "Quel outil sert a creer les animations d'un widget dans l'editeur UMG ?",
        "choices": [
          "Le Material Editor du Widget Blueprint animé",
          "Le panneau Details du composant animé",
          "La Timeline (Séquenceur) de l'éditeur UMG",
          "La console de commandes de l'éditeur"
        ],
        "answer": 2,
        "explain": "La Timeline (Sequenceur) situee en bas de l'editeur de Widget Blueprint est l'outil principal : on ajoute des Tracks (Position, Opacity, Color, Scale) et on place des Keyframes definissant la valeur des proprietes a des instants precis.",
        "difficulty": "facile",
        "topic": "Animations UMG",
        "def": {
          "term": "Timeline / Séquenceur",
          "text": "Outil d'animation en bas de l'éditeur de Widget Blueprint : on y ajoute des Tracks et des keyframes définissant la valeur des propriétés dans le temps."
        }
      },
      {
        "q": "Comment joue-t-on une animation UMG creee dans le Designer, et comment la faire boucler ?",
        "choices": [
          "Via sa variable auto-exposée : Play Animation, numLoopsToPlay = 0",
          "Elle se joue automatiquement dès l'ouverture de l'éditeur du widget",
          "En cochant la case Is Variable sur la piste Timeline",
          "Uniquement via un Property Binding, à chaque frame du jeu"
        ],
        "answer": 0,
        "explain": "Toute animation creee dans l'editeur UMG est automatiquement exposee comme variable dans le Graph ; on appelle dessus Play Animation (ou Play Animation Reverse, Play Forward and Reverse, Stop Animation). Regler numLoopsToPlay a 0 la fait boucler (a combiner avec le playmode PingPong). Cliquer Play dans l'editeur ne suffit pas : il faut la jouer par code.",
        "difficulty": "moyen",
        "topic": "Animations UMG",
        "def": {
          "term": "Play Animation",
          "text": "Toute animation UMG est auto-exposée comme variable ; Play Animation la joue (Reverse, Forward and Reverse aussi). numLoopsToPlay = 0 = boucle."
        }
      },
      {
        "q": "Quel est aujourd'hui le role principal de la classe HUD dans Unreal Engine ?",
        "choices": [
          "Dessiner lignes et triangles à l'écran, comme seul rôle",
          "Gérer et centraliser les widgets du joueur local",
          "Remplacer le Player Controller pour gérer l'input local",
          "Stocker les données globales persistantes entre les niveaux"
        ],
        "answer": 1,
        "explain": "La classe HUD sert de gestionnaire (UIManager) et de conteneur pour les widgets affiches a l'ecran du joueur local ; on y accede via Get HUD puis un Cast vers sa classe (reference a stocker pour eviter les Casts repetes). Ses anciennes fonctions de dessin direct (anterieures a l'UMG) sont desormais rarement utilisees. Le stockage des donnees globales persistantes, lui, releve de la GameInstance.",
        "difficulty": "moyen",
        "topic": "Classe HUD",
        "def": {
          "term": "Classe HUD",
          "text": "Gestionnaire/conteneur central des widgets du joueur local (accessible via Get HUD). Ses fonctions de dessin direct, antérieures à l'UMG, sont rares."
        }
      }
    ],
    "sources": [
      {
        "label": "Creating Widgets in Unreal Engine (Epic Games Docs)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/creating-widgets-in-unreal-engine"
      },
      {
        "label": "Displaying Your UMG UI in the Viewport (Create Widget & Add to Viewport)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/displaying-your-umg-ui-in-the-viewport-in-unreal-engine"
      },
      {
        "label": "UMG Anchors in Unreal Engine UI (Epic Games Docs)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/umg-anchors-in-unreal-engine-ui"
      },
      {
        "label": "Property Binding for UMG in Unreal Engine (Epic Games Docs)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/property-binding-for-umg-in-unreal-engine"
      },
      {
        "label": "UMG Best Practices in Unreal Engine (Events vs Bindings, caching)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/umg-best-practices-in-unreal-engine"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/u4tfL6UpRWE/hqdefault.jpg",
        "caption": "Le Canvas Panel dans UMG : placement, ancrages (anchors) et mise en page du HUD.",
        "credit": "Ryan Laley (YouTube)",
        "link": "https://www.youtube.com/watch?v=u4tfL6UpRWE"
      },
      {
        "url": "https://img.youtube.com/vi/RdGWzXk_9n0/hqdefault.jpg",
        "caption": "Creer une barre de vie (widget UMG) et l'afficher a l'ecran dans Unreal Engine 5.",
        "credit": "Maimute Studios (YouTube)",
        "link": "https://www.youtube.com/watch?v=RdGWzXk_9n0"
      }
    ],
    "links": [
      {
        "label": "Doc Epic - UMG UI Designer Quick Start Guide (HUD, Canvas, Add to Viewport)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/umg-ui-designer-quick-start-guide-in-unreal-engine",
        "kind": "doc"
      },
      {
        "label": "YouTube - UE5 Tutorial : Widgets Part 1, le Canvas Panel",
        "url": "https://www.youtube.com/watch?v=u4tfL6UpRWE",
        "kind": "youtube"
      },
      {
        "label": "YouTube - How to Create a Health Bar in UE5 (Create Widget / Add to Viewport)",
        "url": "https://www.youtube.com/watch?v=RdGWzXk_9n0",
        "kind": "youtube"
      },
      {
        "label": "Blog - Unreal Engine 5 UI Tutorial (UMG, Widget Blueprint) - Kodeco",
        "url": "https://www.kodeco.com/38238361-unreal-engine-5-ui-tutorial",
        "kind": "blog"
      }
    ]
  },
  {
    "id": "widgets-plus",
    "num": "W",
    "special": true,
    "title": "Widgets — Approfondissement",
    "summary": "Approfondissement expert sur UMG (Unreal Motion Graphics) dans Unreal Engine 5.4 : structure du Widget Blueprint (Designer/Graph), hiérarchie et choix des panels, ancres et slots du Canvas Panel pour l'adaptation aux résolutions, widgets courants, bindings vs mises à jour événementielles, cycle de vie et création/affichage des widgets, gestion de l'input, animations, invalidation/optimisation, Widget Component 3D et aperçu de Common UI. Contenu vérifié sur la documentation officielle Epic.",
    "topics": [
      "Widget Blueprint (Designer / Graph)",
      "Panels de layout et choix",
      "Canvas Panel, ancres et alignement",
      "Slots et propriétés de layout",
      "Widgets courants et interactifs",
      "Property Binding vs Event-driven",
      "Créer et afficher un widget",
      "Widget Component (3D)",
      "Cycle de vie et événements",
      "Gestion de l'input UI",
      "Widget Animation",
      "Invalidation et optimisation",
      "Common UI (aperçu 5.4)"
    ],
    "fiches": [
      {
        "title": "UMG et le Widget Blueprint : Designer vs Graph",
        "body": "UMG (**Unreal Motion Graphics**) est le système d'interface d'Unreal Engine. Une UI se construit dans un **Widget Blueprint** (asset dérivé de UUserWidget) qui possède deux modes. L'onglet **Designer** est l'éditeur visuel WYSIWYG : on y place les widgets et on règle leur apparence dans le panneau **Details**. L'onglet **Graph** fonctionne comme un Blueprint classique : on y écrit la logique (événements, fonctions, variables). Les widgets disponibles sont listés dans la **Palette** (toute classe héritant de UWidget) et se glissent dans le **Visual Designer** ou directement dans la **Hierarchy**, qui affiche l'arbre du User Widget. En résumé, on met en page dans le Designer et on branche le comportement dans le Graph.",
        "keypoints": [
          "**Widget Blueprint** = asset UMG dérivé de **UUserWidget**",
          "**Designer** = mise en page ; **Graph** = logique",
          "**Palette** : classes UWidget glissables",
          "**Hierarchy** : arbre du widget ; **Details** : propriétés"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "UMG : le Widget Blueprint (Designer vs Graph)"
      },
      {
        "title": "Choisir son panel de layout",
        "body": "Le choix du conteneur est décisif pour la performance et la robustesse aux résolutions. **Canvas Panel** : placement libre par coordonnées, ancres et z-order (idéal pour un HUD positionné précisément, mais coûteux en CPU si imbriqué profondément). **Horizontal Box / Vertical Box** : empilement automatique en ligne/colonne (menus, listes). **Overlay** : superpose ses enfants, chacun avec son propre alignement. **Grid Panel** (lignes/colonnes avec règles de remplissement) et **Uniform Grid Panel** (cellules de taille égale) pour les grilles (inventaires). **Size Box** contraint une taille fixe/min/max, **Scale Box** met à l'échelle son unique enfant, **Border** encadre un enfant avec fond/marge, **Scroll Box** rend une zone défilable, **Widget Switcher** n'affiche qu'un enfant à la fois selon un index. La règle Epic : préférer des **Overlay + Size Box + Horizontal/Vertical Box** plutôt que d'empiler des Canvas Panels.",
        "keypoints": [
          "**Canvas Panel** : placement libre + ancres (coûteux imbriqué)",
          "**H/V Box** : empilement auto ; **Overlay** : superposition",
          "**Grid** / **Size Box** / **Scale Box** : grilles et contraintes",
          "Epic : préférer **Overlay + Size Box + Box** aux Canvas empilés"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Choisir son panel de layout"
      },
      {
        "title": "Canvas Panel : ancres (Anchors) et alignement",
        "body": "Dans un **Canvas Panel**, chaque widget est positionné via des **ancres** matérialisées par le **médaillon d'ancre** (repère dans le Designer). Le système normalise le Canvas de **(0,0) en haut à gauche** à **(1,1) en bas à droite** : ancrer un widget à (1,1) le colle au coin inférieur droit quelle que soit la résolution. Les **offsets** (mesurés en **Slate Units**) donnent la distance du médaillon jusqu'au widget. Quand l'ancre **Minimum** et l'ancre **Maximum** sont identiques, le widget garde une taille fixe et suit son point d'ancre ; quand on **éclate le médaillon** (Min ≠ Max), le widget **s'étire** proportionnellement avec le Canvas entre les deux ancres. C'est ce mécanisme d'ancrage relatif qui assure l'adaptation aux tailles d'écran et rapports d'aspect. Ne pas confondre avec l'**Alignment** : l'ancre est le point de référence sur le **parent**, tandis que l'Alignment (0 à 1) est un **pivot relatif à la propre taille du widget**. Pour un élément parfaitement centré, on combine ancre (0.5,0.5) **et** alignment (0.5,0.5) ; un alignment (1,1) aligne le widget par son coin inférieur droit. Des **presets d'ancre** (centre, coins, étirements) accélèrent la configuration.",
        "keypoints": [
          "(0,0) haut-gauche → (1,1) bas-droite ; offsets en **Slate Units**",
          "**Min = Max** : taille fixe ; **Min ≠ Max** : le widget s'étire",
          "**Anchor** = point sur le parent ; **Alignment** = pivot du widget",
          "Centrage : ancre (0.5,0.5) **+** alignment (0.5,0.5)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Canvas Panel : ancres (Anchors) et alignement"
      },
      {
        "title": "Slots et propriétés de layout",
        "body": "Un **Slot** est la couche invisible qui relie un widget enfant à son panel parent ; UMG applique automatiquement le bon type de Slot selon le parent. Chaque type expose des propriétés différentes : un **Canvas Slot** comprend le positionnement **absolu et par ancres** (Anchors, Offsets, Alignment, Size To Content, ZOrder), tandis qu'un **Grid Slot** ne connaît que **lignes et colonnes**. Dans les **Box**, le Slot expose **Size = Auto** (le widget se dimensionne selon son contenu) ou **Fill** (il occupe l'espace disponible restant, avec un coefficient), plus **Padding** et **Horizontal/Vertical Alignment**. On lit/modifie ces propriétés dans la catégorie **Slot** du panneau Details, ou par script : au runtime en Blueprint, seuls des nœuds **Setter** de Slot sont exposés (on caste le Slot vers son type concret, ex. Canvas Panel Slot).",
        "keypoints": [
          "**Slot** = liaison enfant↔panel ; type **imposé par le parent**",
          "**Canvas Slot** : Anchors, Offsets, Alignment, ZOrder",
          "**Box Slot** : **Auto** (contenu) vs **Fill** (espace restant)",
          "En runtime BP, seuls des **Setter** de Slot sont exposés"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Les Slots et propriétés de layout"
      },
      {
        "title": "Box, Overlay, Border, Size Box, Scale Box, Scroll Box",
        "body": "Les conteneurs mono-enfant et à empilement structurent la plupart des UI. **Horizontal Box / Vertical Box** alignent les enfants en une seule rangée ou colonne avec Auto/Fill. **Overlay** superpose plusieurs enfants (fond + contenu par-dessus), chacun avec son alignement. **Border** : un seul enfant, avec brosse/couleur de fond et padding, utile pour un cadre ou une surbrillance. **Size Box** : contraint son enfant à une **Width/Height Override** ou à des **min/max** (fige une dimension). **Scale Box** : met à l'échelle son unique enfant selon un mode d'étirement (**Scale To Fit**, Fill, Scale To Fit X/Y, User Specified) — c'est la bonne approche pour une mise à l'échelle propre selon la résolution, contrairement aux **Render Transforms** (hors calcul de layout, réservés aux animations temporaires). **Scroll Box** rend une zone défilable verticalement/horizontalement quand le contenu dépasse.",
        "keypoints": [
          "**H/V Box** : rangée/colonne ; **Overlay** : superposition alignée",
          "**Border** : un enfant + fond/padding ; **Size Box** : dimension figée",
          "**Scale Box** : mise à l'échelle (préférée aux Render Transforms)",
          "**Scroll Box** : défilement quand le contenu dépasse"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Box, Overlay, Border, Size Box, Scale Box, Scroll Box"
      },
      {
        "title": "Grilles, Widget Switcher, Named Slot, Spacer",
        "body": "Pour les dispositions régulières : **Grid Panel** place les enfants par ligne/colonne avec règles de remplissement, tandis que **Uniform Grid Panel** impose des **cellules de taille identique** (typique d'un inventaire). **Widget Switcher** contient plusieurs enfants mais n'en affiche **qu'un seul à la fois** selon son **Active Widget Index** (parfait pour des onglets ou des états d'écran). **Named Slot** : un emplacement nommé exposé dans un User Widget réutilisable ; le widget parent qui l'instancie peut y **injecter du contenu** différent à chaque usage (base de composition/templating). **Spacer** : un widget vide qui réserve de l'espace ou pousse d'autres éléments dans un Box. Ces conteneurs, combinés à des Box et Overlay, remplacent avantageusement des Canvas Panels imbriqués.",
        "keypoints": [
          "**Grid Panel** : lignes/colonnes ; **Uniform Grid** : cellules égales",
          "**Widget Switcher** : un seul enfant via **Active Widget Index**",
          "**Named Slot** : emplacement rempli par le widget hôte",
          "**Spacer** : espace vide / poussoir dans un Box"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Grilles, Widget Switcher, Named Slot, Spacer"
      },
      {
        "title": "Widgets de texte et d'image",
        "body": "**Text (Text Block)** affiche du texte statique ou dynamique avec une police, une taille, une couleur et un justificatif. **Rich Text Block** va plus loin : il interprète un balisage inline pour appliquer **plusieurs styles dans un même bloc**, via des **décorateurs** et un **jeu de styles** défini dans une **Data Table** (Row Structure de type Rich Text Style Row) ; il gère aussi l'insertion d'images/icônes en ligne (décorateur image). **Image** affiche une texture ou un matériau via un **Slate Brush** (mode Image/Box/Border, tiling) ; pour l'UI on privilégie les **textures** plutôt que les matériaux quand c'est possible (moins coûteux). Pour un texte modifiable par le joueur, on utilise plutôt **Editable Text** ou **Editable Text (Multi-Line)** (voir fiche widgets interactifs).",
        "keypoints": [
          "**Text Block** : texte simple mono-style",
          "**Rich Text Block** : multi-styles via **Data Table** + décorateurs",
          "**Image** : **Slate Brush** (texture/matériau) ; préférer textures",
          "Texte saisissable : **Editable Text** / Multi-Line"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Widgets de texte et d'image"
      },
      {
        "title": "Widgets interactifs et leurs événements",
        "body": "Les widgets interactifs exposent des délégués (événements) à brancher dans le Graph. **Button** : conteneur cliquable avec styles par état (Normal/Hovered/Pressed/Disabled) et événements **OnClicked**, **OnPressed**, **OnReleased**, **OnHovered**, **OnUnhovered**. **Progress Bar** : barre remplie par une valeur **Percent** de 0 à 1 (barres de vie/chargement). **Check Box** : case à états (Checked/Unchecked/Undetermined) avec **OnCheckStateChanged**. **Slider** : curseur renvoyant une valeur (par défaut 0 à 1) avec **OnValueChanged**. **Editable Text** : champ de saisie avec **OnTextChanged** et **OnTextCommitted**. **Combo Box (String)** : liste déroulante d'options avec **OnSelectionChanged**. On relie ces événements soit via le bouton dédié du panneau Details (bind d'événement), soit via le menu contextuel du widget dans le Graph.",
        "keypoints": [
          "**Button** : OnClicked/OnPressed/OnHovered ; styles par état",
          "**Progress Bar** : Percent 0–1 ; **Slider** : OnValueChanged",
          "**Check Box** : OnCheckStateChanged",
          "**Editable Text** : OnTextChanged ; **Combo Box** : OnSelectionChanged"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Widgets interactifs et leurs événements"
      },
      {
        "title": "Bindings : Property Binding vs mise à jour événementielle",
        "body": "Un **Property Binding** relie une propriété de widget (ex. Percent d'une Progress Bar) à une variable ou une fonction. Attention : Slate **interroge (poll) le binding à chaque frame** (comme un Tick), y compris quand la valeur ne change pas — coûteux si beaucoup de champs sont bindés. Piège classique : si vous bindez une propriété puis appelez directement son **Set**, le **binding est cassé**. Epic recommande, pour une UI complexe, l'approche **événementielle** : mettre à jour l'UI **seulement quand la donnée change**, via des **Event Dispatchers**/delegates (ex. un événement `OnHealthChanged` déclenché par le personnage met à jour la barre de vie). Les bindings restent acceptables pour une UI simple avec peu de valeurs. En complément, la case **Is Variable** expose un widget comme variable dans le Graph pour pouvoir le manipuler par code.",
        "keypoints": [
          "**Property Binding** = **polling** chaque frame → coûteux",
          "Appeler **Set** sur une propriété bindée **casse** le binding",
          "Préférer les **Event Dispatchers** : MAJ quand la valeur change",
          "**Is Variable** : expose le widget dans le Graph"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Property Binding vs mise à jour événementielle"
      },
      {
        "title": "Créer et afficher un widget",
        "body": "Le flux standard en Blueprint : **Create Widget** (nœud Construct) instancie un Widget Blueprint à partir d'une **Class** et d'un **Owning Player** (Player Controller) — il crée l'objet mais ne l'affiche pas. On stocke le retour dans une variable, puis on appelle **Add to Viewport** pour le dessiner par-dessus le jeu (ajouté à la racine du viewport, comme une nouvelle fenêtre). **Add to Player Screen** est l'équivalent respectant l'**écran de chaque joueur** en **split-screen** (chaque joueur voit son HUD dans sa portion). **Remove from Parent** retire le widget de son parent et donc de l'affichage (viewport ou écran joueur). On peut aussi imbriquer un widget dans un panel via **Add Child** plutôt que de l'ajouter au viewport. Un **ZOrder** passé à Add to Viewport contrôle l'ordre de superposition entre plusieurs widgets racine.",
        "keypoints": [
          "**Create Widget** : instancie (Class + Owning Player), n'affiche pas",
          "**Add to Viewport** : dessine à l'écran ; **ZOrder** = superposition",
          "**Add to Player Screen** : version split-screen",
          "**Remove from Parent** : retire de l'affichage"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Créer et afficher un widget à l'écran"
      },
      {
        "title": "Widget Component : UI en 3D dans le monde",
        "body": "Pour afficher une UMG **dans l'espace 3D** (panneau de contrôle, barre de vie flottante, écran d'ordinateur en jeu), on ajoute un **Widget Component** à un Actor. Il fournit une surface dans le monde : le widget est d'abord rendu dans un **render target**, puis affiché sur cette surface. Sa propriété **Space** peut être **World** (le panneau vit dans la scène, subit la perspective/l'occlusion, défini par une **Draw Size** en pixels) ou **Screen** (toujours face caméra, façon billboard). Pour permettre l'interaction (clic/pointeur) sur un Widget Component, on utilise un **Widget Interaction Component** : il lance un **raycast** et, s'il touche un Widget Component, transmet les événements de pointeur (survol, clic) au widget touché. C'est la base des UI diégétiques et de l'interaction VR/motion controller.",
        "keypoints": [
          "Rend une UMG sur une surface via **render target**",
          "**Space World** (perspective, Draw Size) vs **Screen** (billboard)",
          "**Widget Interaction Component** : raycast → événements pointeur",
          "Base des **UI diégétiques** / interaction VR"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Widget Component : de l'UMG en 3D dans le monde"
      },
      {
        "title": "Cycle de vie et événements du widget",
        "body": "Un widget a un cycle de vie propre. **Event Pre-Construct** s'exécute aussi en **aperçu design-time** dans l'éditeur (il peut tourner plusieurs fois car le Designer maintient deux instances) : idéal pour prévisualiser des réglages, mais on ne peut pas y manipuler des widgets ajoutés dynamiquement (ils n'entrent pas dans l'arbre affiché). **Event Construct** est l'équivalent d'un BeginPlay : appelé au **runtime** quand le widget est construit/ajouté — c'est là qu'on initialise la logique, s'abonne aux dispatchers, etc. **Event Tick** existe sur les widgets mais doit être **évité autant que possible** (comme On Paint) au profit d'événements. Les événements d'interaction (**OnClicked**, **OnHovered**, etc.) se branchent depuis le Details ou le Graph. On peut aussi surcharger **OnInitialized** (une fois, avant Construct) en C++/BP natif.",
        "keypoints": [
          "**Pre-Construct** : tourne aussi en **design-time** (aperçu)",
          "**Construct** : runtime, ≈ **BeginPlay** (init, abonnements)",
          "**Éviter Event Tick / On Paint** : préférer les événements",
          "**OnClicked/OnHovered** : branchés via Details ou Graph"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Cycle de vie du widget : Pre-Construct, Construct"
      },
      {
        "title": "Gestion de l'input pour l'UI",
        "body": "Basculer entre jeu et UI se pilote via les nœuds d'input du Player Controller. **Set Input Mode UI Only** : toute l'entrée va à l'UI (le jeu ne reçoit plus les touches) — pratique pour un menu plein écran. **Set Input Mode Game and UI** : l'UI et le jeu reçoivent l'entrée (utile pour un inventaire qui laisse bouger la caméra). **Set Input Mode Game Only** : retour au jeu seul. Ces nœuds prennent souvent un widget à **focaliser** et des options (masquer le curseur à la capture, verrouiller la souris au viewport). Le curseur se contrôle séparément par **Show Mouse Cursor** sur le Player Controller. Le **focus** détermine quel widget reçoit le clavier/gamepad : on force le focus avec **Set Keyboard Focus** / **Set User Focus**. Piège fréquent : après un Set Input Mode UI Only mal fermé, ou un clic dans le vide qui reprend le focus au jeu, le curseur peut se comporter de façon inattendue.",
        "keypoints": [
          "**UI Only** : entrée réservée à l'UI ; **Game and UI** : les deux",
          "**Show Mouse Cursor** (Player Controller) = visibilité curseur",
          "**Focus** : Set Keyboard/User Focus dirige le clavier/gamepad",
          "Options : widget à focaliser, capture/verrou souris"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Gérer l'input : basculer entre jeu et UI"
      },
      {
        "title": "Widget Animation (UMG)",
        "body": "UMG intègre un éditeur d'animation **bâti sur Sequencer**. On crée une animation via le bouton **+ (New)** du panneau **Animations**, puis on ajoute des **pistes** (Tracks) sur les widgets et on pose des **keyframes** sur leurs propriétés animables : **Transform** (position/échelle/rotation via Render Transform), **Render Opacity**, **Color and Opacity**, **Margin/Padding**, brosses, etc. On déclenche l'animation dans le Graph avec **Play Animation** (nombre de boucles, mode de lecture, vitesse, PlaybackMode Forward/Reverse) ou en glissant l'animation dans le Graph (Ctrl+glisser) pour obtenir Play/Stop. Les événements **OnAnimationFinished** permettent d'enchaîner. Note d'optimisation : les animations pilotées par **matériau** sont les moins coûteuses (GPU), puis Blueprint, puis Sequencer ; les animations qui **modifient le layout** sont les plus chères. Les Render Transforms animés n'affectent pas le layout, ce qui les rend adaptés aux transitions temporaires.",
        "keypoints": [
          "Éditeur = **Sequencer** ; panneau **Animations**, bouton **+**",
          "Pistes : **Render Transform**, Render Opacity, Color, Margin…",
          "Déclenchement : **Play Animation** ; **OnAnimationFinished**",
          "Coût : matériau < Blueprint < Sequencer < animation de layout"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Widget Animation (UMG), basée sur Sequencer"
      },
      {
        "title": "Invalidation et optimisation UMG",
        "body": "Sans invalidation, Slate **repeint chaque widget chaque frame**. L'**Invalidation Box** met en cache l'information d'affichage de ses enfants : tant qu'un widget ne change pas, Slate réutilise le cache au lieu de repeindre — idéal pour des groupes qui changent **rarement**. La **Global Invalidation** traite toute la fenêtre comme une Invalidation Box, et le **Retainer Box/Panel** aplatit ses enfants en une seule **texture** (avec contrôle de la fréquence de rafraîchissement). Un widget qui change à chaque frame doit être marqué **Volatile** pour ne pas polluer le cache (il repeindra de toute façon). Autres leviers : éviter **Tick/bindings**, préférer les **textures** aux matériaux, **supprimer les widgets inutilisés** (ils consomment mémoire/chargement même invisibles), **ne pas imbriquer profondément les Canvas Panels** (draw calls, coût CPU) et préférer Overlay/Size Box/Box. Outil de diagnostic : le **Widget Reflector** (Ctrl+Shift+W) donne stats et hiérarchie en direct.",
        "keypoints": [
          "**Invalidation Box** / Global / **Retainer** : cache d'affichage",
          "Marquer **Volatile** les widgets qui changent chaque frame",
          "Éviter Tick/bindings, préférer **textures**, retirer widgets inutiles",
          "**Canvas Panels** profonds = coûteux ; **Widget Reflector** (Ctrl+Shift+W)"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Invalidation et optimisation UMG"
      },
      {
        "title": "Common UI (aperçu 5.4)",
        "body": "**Common UI** est un **plugin** (activable dans le menu Plugins), à l'origine développé pour Fortnite et largement utilisé dans Lyra. Il vise les **UI multiplateformes** complexes (menus à couches, sous-menus, popups) et le support propre **manette + clavier/souris**. Sa pièce maîtresse est l'**Input Routing** : une fois par tick, il détermine l'arbre de widgets le plus haut à l'écran et n'y route l'entrée qu'aux **widgets activables** (**Common Activatable Widget**) prêts à la recevoir — d'où une gestion du focus fiable sur plusieurs couches d'UI. Il apporte des classes dédiées (boutons, textes, styles), la **navigation cardinale** (D-pad/stick), la gestion des **icônes de touches par plateforme**, et des piles d'écrans (Activatable Widget Stack). En 5.4, Common UI est mature (marqué comme non-expérimental) mais reste optionnel : pour une UI simple, l'UMG standard suffit ; pour du console/multiplateforme, Common UI structure input et navigation.",
        "keypoints": [
          "**Plugin** (issu de Fortnite/Lyra) pour UI manette/multiplateforme",
          "**Input Routing** : entrée au seul arbre le plus haut",
          "**Common Activatable Widget** : états actif/inactif",
          "Navigation cardinale, icônes par plateforme, piles d'écrans"
        ],
        "versionNote": "Common UI existe depuis UE 5.0 ; considéré mature/prod en 5.4.",
        "tier": 3,
        "front": "Common UI (aperçu 5.4) : UI multiplateformes"
      }
    ],
    "quiz": [
      {
        "q": "Dans un Widget Blueprint, quel onglet sert à la disposition visuelle des éléments ?",
        "choices": [
          "Le Designer",
          "Le Graph",
          "La Palette",
          "La Hierarchy"
        ],
        "answer": 0,
        "explain": "Le Designer est l'éditeur visuel WYSIWYG où l'on place et met en forme les widgets ; le Graph sert à la logique/scripting.",
        "difficulty": "facile",
        "topic": "Widget Blueprint (Designer / Graph)",
        "def": {
          "term": "Widget Blueprint",
          "text": "Asset UMG (UUserWidget) doté de deux onglets : Designer pour la mise en page visuelle, Graph pour la logique."
        }
      },
      {
        "q": "À quoi sert la case à cocher « Is Variable » d'un widget dans la Hierarchy ?",
        "choices": [
          "À le masquer pendant tout le jeu",
          "À en faire une variable du Graph",
          "À activer son binding automatique",
          "À le convertir en widget animé"
        ],
        "answer": 1,
        "explain": "« Is Variable » crée une référence variable du widget dans le Graph, permettant de le manipuler par script (Set Text, Set Visibility, etc.).",
        "difficulty": "moyen",
        "topic": "Widget Blueprint (Designer / Graph)",
        "def": {
          "term": "Is Variable",
          "text": "Case qui expose un widget comme variable dans le Graph, pour le manipuler par script (texte, visibilité, etc.)."
        }
      },
      {
        "q": "Quel panel permet de placer des widgets à des positions arbitraires avec ancres et z-order ?",
        "choices": [
          "Horizontal Box",
          "Canvas Panel",
          "Vertical Box",
          "Grid Panel"
        ],
        "answer": 1,
        "explain": "Le Canvas Panel autorise un placement libre par coordonnées, avec ancrage et ordre de superposition (ZOrder). Les Box, eux, empilent automatiquement.",
        "difficulty": "facile",
        "topic": "Panels de layout et choix",
        "def": {
          "term": "Canvas Panel",
          "text": "Panel de placement libre par coordonnées, ancres et ZOrder ; puissant mais coûteux s'il est profondément imbriqué."
        }
      },
      {
        "q": "Dans un Canvas Panel, que représentent les coordonnées d'ancre (0,0) et (1,1) ?",
        "choices": [
          "Les tailles minimale et maximale du widget parent",
          "Les coins haut-gauche et bas-droite du Canvas",
          "Les marges internes du widget, en pixels",
          "Le centre du Canvas et l'un de ses bords"
        ],
        "answer": 1,
        "explain": "Le Canvas est normalisé : (0,0) désigne le coin supérieur gauche et (1,1) le coin inférieur droit, indépendamment de la résolution réelle.",
        "difficulty": "moyen",
        "topic": "Canvas Panel, ancres et alignement",
        "def": {
          "term": "Ancre (Anchor)",
          "text": "Point de référence normalisé du Canvas : (0,0)=coin haut-gauche, (1,1)=coin bas-droite, indépendant de la résolution."
        }
      },
      {
        "q": "Pourquoi les ancres sont-elles essentielles pour l'adaptation aux résolutions ?",
        "choices": [
          "Elles compressent les textures de l'interface UI",
          "Elles conservent sa position relative au Canvas",
          "Elles désactivent le Tick de chaque widget",
          "Elles augmentent la fréquence d'images du jeu"
        ],
        "answer": 1,
        "explain": "L'ancrage est relatif au Canvas (0 à 1) : le widget conserve sa position/étirement proportionnel quelles que soient la taille d'écran et le ratio.",
        "difficulty": "moyen",
        "topic": "Canvas Panel, ancres et alignement",
        "def": {
          "term": "Adaptation aux résolutions",
          "text": "Grâce à l'ancrage relatif (0–1) au Canvas, un widget garde position et étirement quels que soient l'écran et le ratio."
        }
      },
      {
        "q": "Que se passe-t-il quand l'ancre minimale et l'ancre maximale d'un widget diffèrent (médaillon éclaté) ?",
        "choices": [
          "Le widget disparaît de l'écran",
          "Le widget s'étire avec le Canvas",
          "Le widget devient volatile en cache",
          "Le widget conserve une taille fixe"
        ],
        "answer": 1,
        "explain": "Min = Max donne une taille fixe ancrée en un point ; Min ≠ Max étire le widget entre les deux ancres, donc il se redimensionne avec le Canvas.",
        "difficulty": "difficile",
        "topic": "Canvas Panel, ancres et alignement",
        "def": {
          "term": "Médaillon d'ancre",
          "text": "Repère d'ancrage du Designer : Min=Max fige la taille ; Min≠Max (médaillon éclaté) étire le widget avec le Canvas."
        }
      },
      {
        "q": "Quelle est la différence entre Anchor et Alignment sur un Canvas Slot ?",
        "choices": [
          "Anchor et Alignment sont deux réglages identiques",
          "Anchor cible le parent ; Alignment, le pivot du widget",
          "Anchor définit la couleur ; Alignment définit la taille",
          "Anchor agit en 2D ; Alignment agit en 3D World"
        ],
        "answer": 1,
        "explain": "Anchor situe le point de référence sur le Canvas parent (0–1) ; Alignment (0–1) est le pivot interne du widget. Centrage parfait : ancre (0.5,0.5) + alignment (0.5,0.5).",
        "difficulty": "difficile",
        "topic": "Slots et propriétés de layout",
        "def": {
          "term": "Anchor vs Alignment",
          "text": "Anchor = point de référence sur le parent (0–1) ; Alignment = pivot relatif à la taille du widget. Centrage : (0.5,0.5)."
        }
      },
      {
        "q": "Dans un Vertical/Horizontal Box, quelle différence entre Size « Auto » et « Fill » ?",
        "choices": [
          "Auto prend l'espace ; Fill suit le contenu du widget",
          "Auto suit le contenu ; Fill prend l'espace restant",
          "Auto et Fill produisent exactement le même effet",
          "Fill masque le widget ; Auto le rend visible"
        ],
        "answer": 1,
        "explain": "Auto dimensionne le slot d'après la taille du contenu ; Fill lui fait consommer l'espace restant (avec un coefficient de répartition).",
        "difficulty": "moyen",
        "topic": "Slots et propriétés de layout",
        "def": {
          "term": "Slot Box : Auto / Fill",
          "text": "Dans un H/V Box, Auto dimensionne le slot selon le contenu ; Fill occupe l'espace restant, réparti par un coefficient."
        }
      },
      {
        "q": "Quel panel n'affiche qu'un seul de ses enfants à la fois selon un index actif ?",
        "choices": [
          "Overlay Panel",
          "Widget Switcher",
          "Uniform Grid Panel",
          "Scroll Box"
        ],
        "answer": 1,
        "explain": "Le Widget Switcher contient plusieurs enfants mais n'en montre qu'un via son Active Widget Index (idéal pour des onglets ou états d'écran).",
        "difficulty": "moyen",
        "topic": "Panels de layout et choix",
        "def": {
          "term": "Widget Switcher",
          "text": "Panel qui contient plusieurs enfants mais n'en affiche qu'un via Active Widget Index (onglets, états d'écran)."
        }
      },
      {
        "q": "Quel conteneur superpose ses enfants les uns sur les autres, chacun avec son propre alignement ?",
        "choices": [
          "Overlay",
          "Vertical Box",
          "Canvas Panel",
          "Size Box"
        ],
        "answer": 0,
        "explain": "L'Overlay empile les enfants dans la même zone (ex. fond puis contenu), chaque enfant ayant ses propres alignements horizontal/vertical.",
        "difficulty": "facile",
        "topic": "Panels de layout et choix",
        "def": {
          "term": "Overlay",
          "text": "Panel qui empile ses enfants dans la même zone (fond puis contenu), chacun gardant son propre alignement."
        }
      },
      {
        "q": "Pour contraindre un widget à une largeur/hauteur fixe (ou min/max), lequel utiliser ?",
        "choices": [
          "Scale Box",
          "Size Box",
          "Border",
          "Spacer"
        ],
        "answer": 1,
        "explain": "La Size Box impose une dimension via Width/Height Override ou des min/max, figeant la taille de son enfant.",
        "difficulty": "moyen",
        "topic": "Panels de layout et choix",
        "def": {
          "term": "Size Box",
          "text": "Conteneur mono-enfant qui fige une dimension via Width/Height Override ou des valeurs min/max."
        }
      },
      {
        "q": "Quel conteneur met à l'échelle son unique enfant (approche recommandée pour la mise à l'échelle selon la résolution) ?",
        "choices": [
          "Size Box",
          "Scale Box",
          "Canvas Panel",
          "Scroll Box"
        ],
        "answer": 1,
        "explain": "La Scale Box redimensionne son contenu selon un mode (Scale To Fit, Fill…). Elle est préférée aux Render Transforms, qui ne participent pas au layout.",
        "difficulty": "moyen",
        "topic": "Panels de layout et choix",
        "def": {
          "term": "Scale Box",
          "text": "Conteneur qui met son unique enfant à l'échelle selon un mode (Scale To Fit, Fill…), préféré aux Render Transforms."
        }
      },
      {
        "q": "Pour afficher, dans un même bloc, du texte à plusieurs styles/couleurs et des images en ligne via des décorateurs, quel widget ?",
        "choices": [
          "Text Block",
          "Rich Text Block",
          "Editable Text",
          "Editable Text Box"
        ],
        "answer": 1,
        "explain": "Le Rich Text Block interprète un balisage et applique des styles définis dans une Data Table via des décorateurs, y compris des images inline.",
        "difficulty": "moyen",
        "topic": "Widgets courants et interactifs",
        "def": {
          "term": "Rich Text Block",
          "text": "Widget appliquant plusieurs styles dans un même bloc via décorateurs et Data Table de styles, avec images en ligne."
        }
      },
      {
        "q": "Quel événement un Button expose-t-il lorsqu'il est cliqué ?",
        "choices": [
          "OnValueChanged",
          "OnClicked",
          "OnTextCommitted",
          "OnCheckStateChanged"
        ],
        "answer": 1,
        "explain": "Le Button expose OnClicked (ainsi que OnPressed, OnReleased, OnHovered, OnUnhovered). OnValueChanged appartient au Slider, etc.",
        "difficulty": "facile",
        "topic": "Widgets courants et interactifs",
        "def": {
          "term": "OnClicked (Button)",
          "text": "Délégué déclenché au clic sur un Button ; celui-ci expose aussi OnPressed, OnReleased, OnHovered, OnUnhovered."
        }
      },
      {
        "q": "Quel widget fournit une liste déroulante d'options sélectionnables ?",
        "choices": [
          "Slider Widget",
          "Combo Box (String)",
          "Progress Bar",
          "Groupe de Radio Buttons"
        ],
        "answer": 1,
        "explain": "Le Combo Box (String) affiche une liste déroulante d'options et déclenche OnSelectionChanged à chaque changement de choix.",
        "difficulty": "facile",
        "topic": "Widgets courants et interactifs",
        "def": {
          "term": "Combo Box (String)",
          "text": "Widget de liste déroulante d'options textuelles ; émet OnSelectionChanged à chaque changement de sélection."
        }
      },
      {
        "q": "Quel événement une Check Box déclenche-t-elle quand son état change ?",
        "choices": [
          "OnClicked",
          "OnCheckStateChanged",
          "OnValueChanged",
          "OnToggleStateChanged"
        ],
        "answer": 1,
        "explain": "La Check Box (états Checked/Unchecked/Undetermined) émet OnCheckStateChanged avec le nouvel état.",
        "difficulty": "moyen",
        "topic": "Widgets courants et interactifs",
        "def": {
          "term": "OnCheckStateChanged",
          "text": "Délégué d'une Check Box émis à chaque changement d'état : Checked, Unchecked ou Undetermined."
        }
      },
      {
        "q": "Quel inconvénient de performance présente le Property Binding en UMG ?",
        "choices": [
          "Il consomme de la VRAM en permanence",
          "Il interroge la valeur à chaque frame",
          "Il empêche l'affichage des widgets liés",
          "Il désactive toutes les animations"
        ],
        "answer": 1,
        "explain": "Slate évalue les bindings chaque frame comme un polling ; multiplié sur de nombreux champs, cela gaspille du CPU. D'où l'intérêt des mises à jour événementielles.",
        "difficulty": "moyen",
        "topic": "Property Binding vs Event-driven",
        "def": {
          "term": "Property Binding",
          "text": "Liaison d'une propriété de widget à une fonction/variable, ré-évaluée (poll) chaque frame par Slate — coûteuse à grande échelle."
        }
      },
      {
        "q": "Quelle approche Epic recommande-t-il pour mettre à jour efficacement une UI complexe ?",
        "choices": [
          "Tout binder via Property Binding",
          "Notifier l'UI via des Event Dispatchers",
          "Mettre toute la logique dans l'Event Tick",
          "Augmenter la résolution de rendu du jeu"
        ],
        "answer": 1,
        "explain": "L'approche événementielle (Event Dispatchers/delegates, ex. OnHealthChanged) ne met l'UI à jour que lors d'un changement réel, évitant le polling chaque frame.",
        "difficulty": "moyen",
        "topic": "Property Binding vs Event-driven",
        "def": {
          "term": "Mise à jour événementielle",
          "text": "Actualiser l'UI seulement quand la donnée change, via Event Dispatchers/delegates, au lieu d'un polling chaque frame."
        }
      },
      {
        "q": "Que se passe-t-il si vous bindez une propriété d'un widget puis appelez directement sa fonction Set ?",
        "choices": [
          "Rien ne change à l'écran",
          "Le binding est rompu",
          "Le widget devient volatile",
          "Une animation se déclenche"
        ],
        "answer": 1,
        "explain": "Appeler le Set d'une propriété bindée remplace/annule le binding : la documentation précise que cela casse le binding.",
        "difficulty": "difficile",
        "topic": "Property Binding vs Event-driven",
        "def": {
          "term": "Binding cassé",
          "text": "Appeler directement le Set d'une propriété bindée remplace et annule son binding : la liaison ne s'évalue plus."
        }
      },
      {
        "q": "Quel nœud crée une instance de Widget Blueprint sans encore l'afficher ?",
        "choices": [
          "Add to Viewport",
          "Create Widget",
          "Remove from Parent",
          "Set Input Mode"
        ],
        "answer": 1,
        "explain": "Create Widget instancie le widget à partir d'une Class et d'un Owning Player ; il faut ensuite Add to Viewport (ou Add to Player Screen) pour l'afficher.",
        "difficulty": "facile",
        "topic": "Créer et afficher un widget",
        "def": {
          "term": "Create Widget",
          "text": "Nœud qui instancie un Widget Blueprint (Class + Owning Player) sans l'afficher ; requiert ensuite Add to Viewport."
        }
      },
      {
        "q": "Quelle est la différence entre Add to Viewport et Add to Player Screen ?",
        "choices": [
          "Aucune : deux nœuds strictement équivalents",
          "Player Screen gère le split-screen, pas Viewport",
          "Add to Player Screen retire le widget de l'affichage",
          "Add to Viewport ne fonctionne qu'en mode VR"
        ],
        "answer": 1,
        "explain": "Add to Viewport dessine sur tout le viewport ; Add to Player Screen positionne l'UI dans la portion d'écran du joueur concerné en split-screen.",
        "difficulty": "difficile",
        "topic": "Créer et afficher un widget",
        "def": {
          "term": "Add to Viewport / Player Screen",
          "text": "Add to Viewport dessine sur tout le viewport ; Add to Player Screen respecte la portion d'écran de chaque joueur (split-screen)."
        }
      },
      {
        "q": "À quoi sert un Widget Component ?",
        "choices": [
          "À jouer une animation de widget en boucle",
          "À afficher une UMG dans le monde 3D",
          "À binder les propriétés d'un widget UI",
          "À gérer le focus clavier de l'interface"
        ],
        "answer": 1,
        "explain": "Le Widget Component rend une UMG sur une surface 3D via un render target (Space World ou Screen). Le Widget Interaction Component permet l'interaction par raycast.",
        "difficulty": "moyen",
        "topic": "Widget Component (3D)",
        "def": {
          "term": "Widget Component",
          "text": "Composant rendant une UMG sur une surface 3D via render target ; Space World (perspective) ou Screen (billboard)."
        }
      },
      {
        "q": "Quelle est la différence principale entre Event Pre-Construct et Event Construct ?",
        "choices": [
          "Construct ne s'exécute qu'à la compilation en éditeur",
          "Pre-Construct tourne en design-time, pas Construct",
          "Les deux ne tournent qu'au runtime, à l'identique",
          "Pre-Construct gère l'input clavier du widget UI"
        ],
        "answer": 1,
        "explain": "Pre-Construct tourne dans l'aperçu de l'éditeur (utile pour prévisualiser). Construct, proche d'un BeginPlay, s'exécute au runtime et sert à l'initialisation.",
        "difficulty": "difficile",
        "topic": "Cycle de vie et événements",
        "def": {
          "term": "Pre-Construct / Construct",
          "text": "Pre-Construct s'exécute aussi dans l'aperçu du Designer (design-time) ; Construct, proche d'un BeginPlay, au runtime."
        }
      },
      {
        "q": "Concernant Event Tick sur un widget, quelle est la bonne pratique ?",
        "choices": [
          "L'utiliser pour toute la logique de l'UI",
          "L'éviter au profit des événements",
          "Il est requis pour afficher le widget",
          "Il améliore la performance du rendu"
        ],
        "answer": 1,
        "explain": "La documentation recommande d'éviter On Tick et On Paint pour la logique d'UI et de privilégier Event Dispatchers/delegates.",
        "difficulty": "moyen",
        "topic": "Cycle de vie et événements",
        "def": {
          "term": "Event Tick (widget)",
          "text": "Événement appelé chaque frame ; à éviter pour la logique d'UI (comme On Paint) au profit d'Event Dispatchers/delegates."
        }
      },
      {
        "q": "Pour afficher le curseur et diriger toute l'entrée vers l'UI seule, quelle combinaison utiliser ?",
        "choices": [
          "Set Input Mode Game Only + curseur caché en jeu",
          "Set Input Mode UI Only + Show Mouse Cursor",
          "Remove from Parent puis Add to Viewport",
          "Set Visibility Collapsed sur le widget"
        ],
        "answer": 1,
        "explain": "Set Input Mode UI Only route l'entrée vers l'UI ; la visibilité du curseur se règle séparément par Show Mouse Cursor sur le Player Controller.",
        "difficulty": "moyen",
        "topic": "Gestion de l'input UI",
        "def": {
          "term": "Set Input Mode UI Only",
          "text": "Nœud du Player Controller routant toute l'entrée vers l'UI ; la visibilité du curseur se règle via Show Mouse Cursor."
        }
      },
      {
        "q": "Quel mode d'input permet d'interagir avec l'UI tout en continuant à contrôler le jeu ?",
        "choices": [
          "UI Only",
          "Game and UI",
          "Game Only",
          "Menu and Game"
        ],
        "answer": 1,
        "explain": "Set Input Mode Game and UI dirige l'entrée à la fois vers l'UI et vers le jeu (ex. inventaire où l'on peut encore bouger la caméra).",
        "difficulty": "facile",
        "topic": "Gestion de l'input UI",
        "def": {
          "term": "Input Mode Game and UI",
          "text": "Mode d'entrée où l'UI et le jeu reçoivent l'input (ex. inventaire laissant encore bouger la caméra)."
        }
      },
      {
        "q": "Sur quel outil repose l'éditeur d'animation de widget d'UMG ?",
        "choices": [
          "Le Material Editor",
          "Sequencer",
          "Niagara",
          "Le Behavior Tree"
        ],
        "answer": 1,
        "explain": "L'éditeur d'animation UMG est une implémentation de Sequencer : on crée une animation dans le panneau Animations et on pose des keyframes sur des pistes.",
        "difficulty": "moyen",
        "topic": "Widget Animation",
        "def": {
          "term": "Sequencer (UMG)",
          "text": "Outil d'animation d'Unreal ; l'éditeur d'animation UMG en est une implémentation (panneau Animations, pistes, keyframes)."
        }
      },
      {
        "q": "Quel mécanisme met en cache des groupes de widgets peu changeants pour éviter de les repeindre chaque frame ?",
        "choices": [
          "La Scale Box",
          "L'Invalidation Box",
          "Le Canvas Panel",
          "Le Uniform Grid Panel"
        ],
        "answer": 1,
        "explain": "L'Invalidation Box cache l'info d'affichage de ses enfants : tant qu'ils ne changent pas, Slate réutilise le cache au lieu de repeindre. Un widget changeant chaque frame doit être marqué Volatile.",
        "difficulty": "difficile",
        "topic": "Invalidation et optimisation",
        "def": {
          "term": "Invalidation Box",
          "text": "Conteneur mettant en cache l'affichage de ses enfants peu changeants ; Slate réutilise le cache au lieu de repeindre."
        }
      },
      {
        "q": "Pourquoi Epic déconseille-t-il d'imbriquer profondément des Canvas Panels ?",
        "choices": [
          "Ils ne supportent pas les ancres relatives",
          "Ils sont coûteux en CPU (draw calls, IDs)",
          "Ils cassent les bindings de propriété",
          "Ils désactivent les animations UMG"
        ],
        "answer": 1,
        "explain": "Les Canvas Panels incrémentent les IDs de leurs enfants et impliquent plusieurs draw calls, ce qui est intensif en CPU. La doc recommande Overlays/Size Boxes avec Horizontal/Vertical Boxes.",
        "difficulty": "difficile",
        "topic": "Invalidation et optimisation",
        "def": {
          "term": "Canvas Panel imbriqué",
          "text": "Empiler des Canvas Panels multiplie draw calls et IDs enfants (coût CPU) ; préférer Overlay/Size Box avec des Box."
        }
      },
      {
        "q": "Qu'est-ce que Common UI dans Unreal Engine 5.4 ?",
        "choices": [
          "Un type de matériau réservé à l'interface",
          "Un plugin pour UI multiplateformes et manette",
          "Un panel de layout intégré nativement dans UMG",
          "Un mode d'input spécial du Player Controller"
        ],
        "answer": 1,
        "explain": "Common UI est un plugin (issu de Fortnite/Lyra) pour les UI multiplateformes/manette : son Input Routing ne route l'entrée qu'à l'arbre le plus haut et aux Common Activatable Widgets prêts à la recevoir.",
        "difficulty": "moyen",
        "topic": "Common UI (aperçu 5.4)",
        "def": {
          "term": "Common UI",
          "text": "Plugin (issu de Fortnite/Lyra) pour UI multiplateformes : Input Routing vers l'arbre le plus haut et les Activatable Widgets."
        }
      }
    ],
    "sources": [
      {
        "label": "Widget Blueprints in UMG (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/widget-blueprints-in-umg-for-unreal-engine"
      },
      {
        "label": "UMG Anchors in Unreal Engine UI (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/umg-anchors-in-unreal-engine-ui"
      },
      {
        "label": "UMG Slots in Unreal Engine (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/umg-slots-in-unreal-engine"
      },
      {
        "label": "Property Binding for UMG (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/property-binding-for-umg-in-unreal-engine"
      },
      {
        "label": "Driving UI Updates with Events (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/driving-ui-updates-with-events-in-unreal-engine"
      },
      {
        "label": "UMG Best Practices (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/umg-best-practices-in-unreal-engine"
      },
      {
        "label": "Optimization Guidelines for UMG (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/optimization-guidelines-for-umg-in-unreal-engine"
      },
      {
        "label": "Creating Widgets in Unreal Engine (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/creating-widgets-in-unreal-engine"
      },
      {
        "label": "Widget Components in Unreal Engine (UI 3D, doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/widget-components-in-unreal-engine"
      },
      {
        "label": "Overview of Common UI for Unreal Engine (doc officielle Epic)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-advanced-multiplatform-user-interfaces-with-common-ui-for-unreal-engine"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/SD66UgyHiMM/hqdefault.jpg",
        "caption": "Animer des widgets UMG (pistes d'animation et keyframes) dans UE5",
        "credit": "Just Another Dang How To Channel - YouTube",
        "link": "https://www.youtube.com/watch?v=SD66UgyHiMM"
      },
      {
        "url": "https://img.youtube.com/vi/4Z0fKE-HaA0/hqdefault.jpg",
        "caption": "Menu Pause avec Common UI dans UE5 (navigation manette et clavier)",
        "credit": "Just Another Dang How To Channel - YouTube",
        "link": "https://www.youtube.com/watch?v=4Z0fKE-HaA0"
      }
    ],
    "links": [
      {
        "label": "Doc officielle UE - Animer les widgets UMG (fenetres Animations et Timeline)",
        "url": "https://dev.epicgames.com/documentation/unreal-engine/animating-umg-widgets-in-unreal-engine",
        "kind": "doc"
      },
      {
        "label": "Doc officielle UE - Common UI (UI avancee multi-plateforme, input routing)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/common-ui-plugin-for-advanced-user-interfaces-in-unreal-engine",
        "kind": "doc"
      },
      {
        "label": "Unreal Garden - UI Best Practices (bindings a eviter vs event-driven)",
        "url": "https://unreal-garden.com/tutorials/ui-best-practices/",
        "kind": "blog"
      },
      {
        "label": "YouTube - Common UI : menu Pause (panels, anchors, navigation)",
        "url": "https://www.youtube.com/watch?v=4Z0fKE-HaA0",
        "kind": "youtube"
      }
    ]
  },
  {
    "id": "mesh-anim",
    "num": "06",
    "special": false,
    "title": "Mesh & Animation",
    "summary": "Ce chapitre couvre l'ensemble du pipeline mesh et animation d'Unreal Engine 5.4, du Static Mesh rigide au Skeletal Mesh anime. Cote geometrie statique : composants d'un mesh (vertices, UV, normales), formats d'import (FBX vs OBJ), standards d'export, asset UStaticMesh, canaux UV et LightMaps, LODs, technologie Nanite (virtualisation de geometrie haute densite et ses limites), collisions simples/complexes/convexes et channels, et instancing (ISM/HISM) pour reduire les draw calls, avec les outils de profilage et de debogage (stat, CVars, slomo). Cote animation : Skeletal Mesh et Squelette (Skeleton) partage, skinning et Physics Asset, Animation Sequences et Animation Curves, Animation Blueprint avec sa distinction Event Graph (logique/variables) vs Anim Graph (pose finale / Output Pose), State Machines et regles de transition, Blend Spaces et Aim Offset, Morph Targets (Blendshapes), Anim Montages (slots, sections, blend, notifies), animation Additive et Layered Blend per Bone, Sockets et attachement dynamique, Root Motion et Root Bone, retargeting moderne via IK Rig / IK Retargeter, et Ragdoll / simulation physique.",
    "topics": [
      "Composants d'un mesh 3D",
      "Static Mesh vs Skeletal Mesh",
      "Formats d'import FBX/OBJ",
      "Standards d'import Static Mesh",
      "Asset UStaticMesh, canaux UV et LightMaps",
      "LODs",
      "Nanite",
      "Collisions (simple, complexe, convexe, channels)",
      "Instancing ISM et HISM",
      "Draw calls et profilage",
      "Skeletal Mesh et Squelette (Skeleton)",
      "Skinning et Skin Weights",
      "Physics Asset et bodies",
      "Ragdoll et simulation physique",
      "Animation Sequence et Animation Curves",
      "Animation Blueprint",
      "Event Graph vs Anim Graph",
      "Output Pose",
      "State Machine et regles de transition",
      "Blend Space et Aim Offset",
      "Morph Targets / Blendshapes",
      "Anim Montage, slots et sections",
      "Anim Notify et Anim Notify State",
      "Animation Additive",
      "Layered Blend per Bone",
      "Sockets et attachement dynamique",
      "Root Motion et Root Bone",
      "IK Retargeting (IK Rig / IK Retargeter)",
      "Debogage (CVars, stat, slomo)"
    ],
    "fiches": [
      {
        "title": "Composants d'un mesh 3D, Static vs Skeletal Mesh et formats FBX/OBJ",
        "body": "Un **mesh** est la structure fondamentale d'un objet 3D : il definit la geometrie et l'apparence. Il se compose de **vertices** (sommets) et **triangles** formant la geometrie de base, d'**UVs** (coordonnees 2D servant a plaquer les textures) et de **normales** (vecteurs definissant l'orientation de surface, cruciaux pour l'eclairage et les normal maps). Unreal distingue deux familles. Le **Static Mesh** est un objet **rigide** sans deformation (pipeline d'asset traditionnel) : decors, batiments, objets physiques, acteurs mobiles simples (portes, plateformes). Le **Skeletal Mesh** est **deformable** : il necessite un squelette (rig) et des animations pour le mouvement et la deformation, typiquement les personnages. Le contenu artistique est cree dans des logiciels DCC externes (3ds Max, **Maya**, **Blender**, ZBrush, Photoshop) puis importe. Le **FBX** est le format d'import standard car il transporte la **geometrie, le rig (squelette) ET les animations** ; c'est le format oblige pour les Skeletal Meshes et les Animation Sequences. L'**OBJ** est un format de geometrie simple, sans rig ni animation.",
        "keypoints": [
          "Mesh = vertices + triangles, **UVs** (textures), **normales** (eclairage)",
          "**Static Mesh** = rigide ; **Skeletal Mesh** = deformable via squelette",
          "Contenu cree en externe (Maya, Blender) puis importe",
          "**FBX** = geometrie + rig + anims ; **OBJ** = geometrie seule"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Mesh 3D, Static vs Skeletal, formats FBX/OBJ"
      },
      {
        "title": "Static Mesh : standards d'import, asset UStaticMesh, UV et LODs",
        "body": "Standards d'un **Static Mesh** : format **FBX** ; echelle **1 unite = 1 cm** ; **pivot** (origine) au centre inferieur ou au point de rotation naturel ; **orientation** avant selon l'axe **+X**. Cote textures, un mesh peut avoir des **UV qui se chevauchent** sur le canal texture mais doit posseder un **canal UV separe sans chevauchement pour la LightMap**. L'asset **UStaticMesh** est un conteneur reutilisable : une seule instance d'asset peut etre placee de nombreuses fois (instancing). Il expose des **slots de materiaux** (un par canal, correspondant aux ID de polygones du logiciel 3D) et plusieurs **canaux UV** : **UV0** est le canal par defaut des textures, **UV1** est souvent reserve a la **lightmap**. Les **LODs (Levels of Detail)** reduisent le nombre de triangles avec la distance ; crees manuellement ou generes par le moteur, ils limitent le **popping**. Limite mobile : 65 535 sommets max ; sur PC la limite depend des performances.",
        "keypoints": [
          "Echelle 1 unite = 1 cm ; orientation avant vers **+X**",
          "**UV0** = textures ; **UV1** = LightMap (sans chevauchement)",
          "**UStaticMesh** = asset reutilisable avec slots de materiaux",
          "**LODs** : reduisent les triangles avec la distance (anti-popping)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Static Mesh : import, UStaticMesh, UV et LODs"
      },
      {
        "title": "Nanite : virtualisation de geometrie haute densite (UE5)",
        "body": "**Nanite** est une technologie de rendu de mesh d'Unreal Engine 5 permettant d'importer et d'utiliser directement des meshes **haute resolution** (des millions de polygones) sans impact majeur sur les performances. Fonctionnement : Nanite gere automatiquement les niveaux de detail via un systeme de **clusters de triangles** et elimine les clusters non visibles par la camera (**occlusion culling** au niveau du cluster, plus fin que le culling par objet). Il **ignore les LODs traditionnels** et reduit donc la re-topologie et la creation manuelle de LODs. Activation : cocher **Build Nanite** a l'import. Limitations : **pas de deformation** (donc pas de Skeletal Meshes animes), **pas de World Position Offset (WPO)**, **pas de materiaux translucides**, et **stockage SSD** requis pour le streaming. Candidat ideal : mesh statique a tres haut nombre de triangles pour de grands environnements.",
        "keypoints": [
          "Rend des meshes a millions de polygones via clusters de triangles",
          "Occlusion culling par cluster, LODs geres automatiquement",
          "Active a l'import via l'option **Build Nanite**",
          "Limites : pas de deformation (pas de Skeletal), pas de WPO/translucide"
        ],
        "versionNote": "En UE 5.4, Nanite est reserve aux meshes statiques (aucune deformation). Le support experimental des Nanite Skeletal Meshes n'apparait qu'a partir de la 5.5 ; en 5.4 la limitation sur les Skeletal Meshes est totale.",
        "tier": 2,
        "front": "Nanite : geometrie haute densite (UE5)"
      },
      {
        "title": "Collisions des Static Meshes : simple, complexe, convexe et channels",
        "body": "Les **Simple Collisions** utilisent des primitives (boite, sphere, capsule) : methode par defaut **recommandee** car peu couteuse. Les **Complex Collisions** reposent sur la geometrie reelle (per-poly / per-triangle) : tres couteuses, a eviter pour les assets statiques du monde. Le parametre **Collision Complexity** de l'editeur controle le type utilise : **Use Simple Only** (recommande) ou **Use Complex as Simple** (force la geometrie du mesh, deconseille car lourd). La **Convex Decomposition (Auto-Convex Collision)** genere dans UE des primitives simples mais precises en couvrant une forme complexe avec plusieurs **convex shapes** (ajustee via Hole Count, Max Whole Verts, Precision). A l'import, si le mesh n'a pas de collision, UE la genere (Generate Missing Collisions) ; les collisions custom **UCX**/**UBX** creees en 3D sont importees. Les **Collision Channels** definissent la reaction aux autres objets (**Block**, **Overlap**, **Ignore**) et les **Presets** (NoCollision, BlockAll) accelerent l'attribution. Visualisation via Show -> Simple Collisions.",
        "keypoints": [
          "**Simple** (boite/sphere/capsule) = recommande, peu couteux",
          "**Complex** (per-poly) = couteux, a eviter",
          "**Convex Decomposition** : plusieurs convex pour formes complexes",
          "**Collision Channels** : Block / Overlap / Ignore + Presets"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Collisions Static Mesh : simple, complexe, convexe"
      },
      {
        "title": "Instancing (ISM/HISM), draw calls, profilage et debogage",
        "body": "Un **Draw Call** est une instruction envoyee au GPU pour configurer et dessiner un objet ; c'est un goulot d'etranglement majeur cote **CPU**. L'**Instancing** consiste a n'effectuer qu'un seul appel de rendu pour dessiner de nombreuses copies du meme mesh (le CPU envoie au GPU un tableau des transformations). Chaque **instance ne stocke que sa Transform** ; le Mesh, les Materiaux et la Collision sont **partages**. L'**ISM (Instanced Static Mesh Component)** est le composant de base ; le **HISM (Hierarchical ISM)** ajoute la gestion hierarchique des **LODs** et le **culling** par distance. Limite : toutes les instances partagent le meme materiau ; pour varier on utilise les **Per-Instance Custom Data** lues par le shader. Usages : feuillage, structures modulaires, foules. Nanite rend le HISM moins critique (LODs/culling geres au cluster). Cote debogage, les **Console Variables (CVars)** se modifient au runtime via la **console** (touche tilde) sans recompiler ; les commandes de profilage **stat FPS** et **stat unit** montrent la charge **CPU/GPU** et les draw calls ; le **slomo** controle l'echelle temporelle globale (**< 1** ralentit tout le systeme, **> 1** accelere).",
        "keypoints": [
          "**Draw Call** = goulot CPU ; instancing = 1 appel pour N copies",
          "Instance stocke sa Transform ; mesh/materiaux/collision partages",
          "**ISM** = base ; **HISM** = ISM + LODs hierarchiques + culling",
          "Profilage : **stat FPS**, **stat unit** ; **CVars** au runtime"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Instancing (ISM/HISM), draw calls et profilage"
      },
      {
        "title": "Skeletal Mesh, Squelette (Skeleton) et skinning",
        "body": "Un **Skeletal Mesh** sert aux modeles necessitant une **deformation** (personnages, creatures). Il se compose d'un **ensemble de polygones** formant la surface (skin) et d'un **ensemble hierarchique d'os** (le **Squelette / Skeleton**). Les **Bones** sont organises en **hierarchie parent-enfant** (colonne, bras, doigts). Le mouvement des bones tire et modifie la position des vertices via les **Skin Weights** : c'est la difference essentielle avec le Static Mesh rigide. A l'import FBX on coche **Import Mesh** (skin) et **Import Skeleton** (nouveau squelette), ou on decoche Import Skeleton pour reutiliser un squelette existant (ex : SK_Mannequin). La premiere fois, le moteur cree deux assets : le **Skeletal Mesh** (geometrie) et le **Skeleton** (structure osseuse). Point cle : plusieurs Skeletal Meshes ayant la **meme hierarchie osseuse peuvent partager le meme Skeleton**, donc la meme **librairie d'animations**. Le respect des **conventions de nommage** est crucial pour le partage d'animations et le retargeting. L'edition se fait dans l'editeur Skeletal Mesh (Persona), qui permet aussi d'ajouter des sockets et de generer un Physics Asset.",
        "keypoints": [
          "Skeletal Mesh = skin (polygones) + **Skeleton** (hierarchie d'os)",
          "**Skin Weights** : les bones deforment les vertices associes",
          "Import : Import Mesh + Import Skeleton (decocher pour reutiliser)",
          "Skeleton partage = librairie d'animations partagee"
        ],
        "versionNote": "L'edition directe du squelette dans l'editeur (Skeletal Mesh Editing Tools : creer un os, le renommer root, reparenter le Hips) est une fonctionnalite 5.6, absente en UE 5.4. En 5.4 ces modifications se font en externe (Blender/Maya).",
        "tier": 2,
        "front": "Skeletal Mesh, Skeleton et skinning"
      },
      {
        "title": "Physics Asset, bodies, contraintes et Ragdoll",
        "body": "Le **Physics Asset** est un asset secondaire genere avec le Skeletal Mesh (generable a l'import). Il definit les **Bodies** (corps physiques) et les **Constraints/Joints** (contraintes articulaires). Les **Bodies** sont des formes **simplifiees** (capsules, spheres, boites) enveloppant les bones ; generees automatiquement, elles s'ajustent manuellement. Les formes simples sont obligatoires : le per-poly coute trop cher au runtime physique. Les **Joints** connectent les bodies et appliquent des **limites angulaires** (ex : empecher un genou de plier a l'envers) ; on ajuste le **Rotation Stiffness** et les limites. Le **Ragdoll** bascule le personnage d'une animation controlee par l'Anim Blueprint a une **simulation physique complete** : on l'active via **Set All Bodies Below Simulate Physics** sur le Skeletal Mesh Component, en ciblant un bone (ex : Pelvis) pour simuler ce body et tous ceux en dessous. Pour eviter le pop, on lisse via **Set All Bodies Below Physics Blend Weight** (0 = anime, 1 = physique) pilote par une Timeline/courbe. Variantes : **Partial Ragdoll** (un seul membre), **Physical Animation Component** (impulses / hit reactions), **Get Up Animation** (retour a la locomotion selon l'orientation au sol).",
        "keypoints": [
          "**Physics Asset** = Bodies (formes simples) + Joints (limites)",
          "Bodies simplifies obligatoires (pas de per-poly)",
          "Ragdoll : **Set All Bodies Below Simulate Physics** (ex. Pelvis)",
          "Blend via **Physics Blend Weight** (0 anime -> 1 physique)"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Physics Asset, bodies et Ragdoll"
      },
      {
        "title": "Animation Sequences et Animation Curves",
        "body": "Une **Animation Sequence** est une ressource d'animation unique jouable sur un Skeletal Mesh. Elle contient des **images cles (keyframes)** specifiant la position, la rotation et l'echelle de chaque os a un instant donne ; la lecture des keyframes avec un blend entre elles genere le mouvement. Proprietes de base : **duree** et **looping** (bouclage). Contrainte : chaque Animation Sequence **cible un squelette specifique et ne peut etre jouee que sur ce Skeleton** ; pour partager une anim, les meshes doivent utiliser le meme Skeleton (sinon retargeting). A l'import, la propriete **Skeleton** choisit le squelette pilote ; si elle est vide, UE cree un nouveau squelette. Les **Animation Curves** portees par une sequence transmettent des informations au **Gameplay** : evenements temporels (ex : courbe d'atterrissage), poids d'action (ex : Turn Yaw Weight pour savoir si un virage est termine), et controle logique lu par l'AnimBP ou le BP de personnage pour piloter transitions et etats.",
        "keypoints": [
          "Anim Sequence = keyframes (pos/rot/echelle des os) + duree + loop",
          "Liee a UN seul **Skeleton** ; partage entre memes squelettes",
          "Skeleton vide a l'import => nouveau squelette cree",
          "**Animation Curves** : transmettent des valeurs au gameplay"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Animation Sequence et Animation Curves"
      },
      {
        "title": "Animation Blueprint : Event Graph vs Anim Graph",
        "body": "Un **Animation Blueprint (AnimBP)** est un Blueprint specialise qui controle l'animation d'un Skeletal Mesh en jeu. Il comporte **deux graphes**. L'**Event Graph** controle la **logique de mise a jour** : c'est un Blueprint classique (noeuds, execution, fonctions, variables). A chaque update (Tick), il recupere des donnees du personnage (**Pawn Owner**, **Character Movement Component**) et met a jour des **variables** (ex : Ground Speed, Is Falling / Is In Air). L'**Anim Graph** controle la **logique de pose** : il **evalue la pose finale** du Skeletal Mesh pour la frame courante (echantillonnage de sequences, blends, skeletal controls). Il utilise des noeuds comme les **State Machines** et **Blend Spaces**, et se consolide en une **Output Pose** : l'instantane (rotation + translation de tous les os) applique au mesh a chaque image. Principe cle : l'Event Graph **calcule les variables**, l'Anim Graph **les consomme** pour decider quelle pose jouer.",
        "keypoints": [
          "**AnimBP** = Blueprint specialise avec 2 graphes",
          "**Event Graph** = logique/variables (Ground Speed, Is Falling)",
          "**Anim Graph** = evaluation de la pose finale (**Output Pose**)",
          "Event Graph produit les variables consommees par l'Anim Graph"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Animation Blueprint : Event Graph vs Anim Graph"
      },
      {
        "title": "State Machine et regles de transition",
        "body": "Une **State Machine** (machine a etats), placee dans l'Anim Graph, divise l'animation en une serie d'**etats** (ex : Idle, Walk, Run, Jump). Chaque etat contient l'animation ou le Blend Space a jouer. Les etats sont relies par des **regles de transition** qui controlent le passage (blend) d'un etat a l'autre, evitant un reseau Blueprint complexe. Les **regles de transition sont des conditions booleennes** basees sur les variables du personnage : ex la vitesse (**Ground Speed**) pour Idle -> Walk, ou un booleen d'etat (**Is Falling**) pour aller vers Jump. On utilise des **seuils** pour eviter les transitions involontaires (ex : revenir a Idle si vitesse <= 5). Si plusieurs regles sont vraies simultanement, le moteur applique la **Priorite** : la transition de priorite **la plus basse** (ex 1) s'execute d'abord. La **Blend Duration** adoucit le changement (0.0s = pop). Les **State Aliases** regroupent des sorties de plusieurs etats vers une destination commune. Toute State Machine a un **Entry Point**, et les etats peuvent declencher des evenements **On State Entry** / **On State Exit**.",
        "keypoints": [
          "Etats (Idle, Walk, Run, Jump) contenant anim ou Blend Space",
          "Transitions = conditions booleennes (Ground Speed) + seuils",
          "**Priorite** : la transition de priorite la plus basse d'abord",
          "**Blend Duration** lisse la transition (0.0s => pop)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "State Machine et regles de transition"
      },
      {
        "title": "Blend Space et Aim Offset",
        "body": "Un **Blend Space** melange plusieurs poses/animations selon **un ou deux axes**. Cas typique de locomotion : deux axes = la **vitesse (Speed)** (Idle a vitesse max) et la **direction (Yaw)** (avant, gauche, arriere, droite). On ajoute les animations par **drag and drop** dans la grille ; la plage de chaque axe (ex 0 a 500 pour la vitesse, -180 a 180 pour la direction) doit correspondre aux seuils du jeu. L'**Interpolation Time (smoothing)** adoucit la transition entre echantillons pour eviter le **popping**. Un Blend Space ne fonctionne qu'entre animations partageant le **meme Skeleton**. Un **Aim Offset** est un type particulier de Blend Space utilisant des poses **Additive** : il combine des poses d'inclinaison (haute/basse/gauche/droite) pour construire la pose de visee selon la rotation du controleur (Yaw et Pitch). Pour etre compatible, l'animation doit etre en additif **Mesh Space**. Il existe aussi des versions 1D (un seul axe).",
        "keypoints": [
          "**Blend Space** melange des poses selon 1 ou 2 axes (Speed/Direction)",
          "Ajout des anims par drag and drop ; plages calees sur le jeu",
          "**Interpolation Time** (smoothing) evite le popping",
          "**Aim Offset** = Blend Space de poses Additive (Mesh Space)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Blend Space et Aim Offset"
      },
      {
        "title": "Morph Targets (Blendshapes)",
        "body": "Les **Morph Targets** (appeles **Blendshapes** dans Maya) deforment la **surface** du mesh en enregistrant et interpolant les positions des vertices entre une **pose de base (poids 0)** et une **pose cible (poids 1)**. Contrainte majeure : le mesh modifie doit **conserver le nombre exact ET l'ordre des vertices** du mesh de base ; toute addition/suppression de vertices invalide le morph. Ils sont crees dans un DCC externe (Blender, Maya, 3ds Max) et importes en cochant **Import Morph Targets** a l'import FBX. L'animation est pilotee par une valeur flottante **Weight** (via Blueprint **Set Morph Target** ou des Timelines) : plage par defaut **0 a 1**, depassable (valeurs negatives = deformation inverse, > 1 = deformation exageree). Usages : expressions faciales, mouvements musculaires, corrections anti-clipping lors des rotations osseuses, deformations d'objets sans rig. Optimisation : le calcul, historiquement couteux en **CPU**, peut etre decharge sur le **GPU** via une option des **Project Settings (Engine > Rendering)**. Chaque **LOD** doit avoir ses morphs correspondants, **nommes identiquement**, pour eviter le popping.",
        "keypoints": [
          "Interpole les positions de vertices (poids 0 -> 1)",
          "Doit conserver le nombre ET l'ordre exact des vertices",
          "Import via **Import Morph Targets** ; pilote par un **Weight**",
          "Optimisation **GPU** (Project Settings > Rendering)"
        ],
        "versionNote": "La creation/sculpt de Morph Targets directement dans l'editeur de Skeletal Mesh est un outil experimental introduit en UE 5.6, absent en 5.4 : en 5.4 les morphs se creent obligatoirement dans un DCC externe.",
        "tier": 3,
        "front": "Morph Targets (Blendshapes) : deformer la surface"
      },
      {
        "title": "Anim Montage (slots, sections, blend, notifies) et Sockets",
        "body": "L'**Anim Montage** est un conteneur (wrapper) d'animation pour les **actions ponctuelles** hors du flux de locomotion (attaques, sorts). Les Montages sont **joues a la demande** (via Blueprint) et peuvent interrompre ou se superposer a l'animation de base. Chaque Montage est joue dans un **Slot** defini dans l'AnimBP, qui controle **quelle partie du corps** est affectee (Default Slot, Upper Body, Full Body) ; les slots sont geres dans l'**Anim Slot Manager** du Skeleton. Une animation dans un Montage se decoupe en **Sections** nommees, jouables dans n'importe quel ordre (ex : phases d'un combo). **Blend In** definit la duree de melange avec l'animation precedente, **Blend Out** avec la suivante (0.0s = pop). Les **Notifies** sont des marqueurs temporels : un **Anim Notify** declenche un evenement **instantane** a une frame (son de pas, particule, camera shake) ; un **Anim Notify State** definit une **fenetre de duree** (activer un collider d'arme pendant le swing). Ils synchronisent le gameplay avec l'animation (degats a la frame d'impact). Un **Socket** est un point d'attachement logique fixe sur un bone (cree par clic droit dans le Skeleton Editor, stocke dans le **Skeleton**) pour attacher armes, accessoires ou FX ; l'attachement runtime se fait via le noeud **AttachToComponent / AttachComponentToComponent** en specifiant le **Socket Name**.",
        "keypoints": [
          "**Montage** = actions ponctuelles (attaques), joue a la demande",
          "**Slot** = partie du corps ; **Sections** = decoupage nomme (combos)",
          "**Anim Notify** = instantane ; **Notify State** = fenetre de duree",
          "**Socket** = point d'attache sur un bone (via AttachToComponent)"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Anim Montage (slots, sections, notifies) et Sockets"
      },
      {
        "title": "Animation Additive et Layered Blend per Bone",
        "body": "Une animation **Additive** est une transformation stockee **relativement a une pose de reference** (pose de base) : elle ne contient que la difference pour atteindre la pose finale, et est **ajoutee par-dessus** l'animation de base en cours (ex : marche). Deux modes : **Local Space** (transformations relatives aux bones parents, pour des deformations mineures comme la respiration) et **Mesh Space** (dans l'espace du Skeletal Mesh, necessaire quand l'additif change fortement l'orientation des bones, ex : **Aim Offset**). Usages : finition/nuance (respiration, inclinaison), reactions (recul/recoil, flinch/hit reacts), visee (le haut du corps s'oriente vers la cible independamment des jambes). Le noeud **Layered Blend per Bone (LBPB)** est l'outil principal pour melanger **deux poses via un masque osseux** : il prend une **Base Pose** (ex locomotion) et superpose une **Blend Pose** (ex tir) uniquement sur les bones specifies et leurs enfants. Parametres cles : les **Branch Filters** (liste des bones ou commence la superposition, ex spine_01, clavicle_l) et le **Blend Depth** (nombre de bones successifs du melange progressif ; profondeur 0 = changement immediat). Avantage : reutilisabilite massive et combinaison d'actions par partie du corps.",
        "keypoints": [
          "**Additive** = difference vs pose de reference, ajoutee sur la base",
          "**Local Space** (respiration) vs **Mesh Space** (Aim Offset)",
          "**LBPB** : melange Base Pose + Blend Pose via un masque osseux",
          "**Branch Filters** (ex. spine_01) + **Blend Depth** progressif"
        ],
        "versionNote": "",
        "tier": 3,
        "front": "Animation Additive et Layered Blend per Bone"
      },
      {
        "title": "Root Motion, Root Bone et IK Retargeting",
        "body": "En mouvement **In-Place** (traditionnel), c'est le **Character Movement Component** qui deplace la capsule de collision, l'animation devant etre synchronisee. Avec le **Root Motion**, c'est **l'animation elle-meme** qui deplace la capsule, via le deplacement du **Root Bone**. Le Root Bone est le point d'origine et la **racine de la hierarchie** : il doit etre le **premier os (index 0)**. Le Root Motion doit etre **active sur l'asset d'animation** (Anim Sequence ou Anim Montage) ; sinon l'animation joue mais le personnage glisse (sliding/moonwalking). Dans l'AnimBP, il est souvent gere par des Montages joues dans des slots. Probleme Mixamo : les squelettes commencent souvent au **Hips/Pelvis** sans Root dedie ; solution = ajouter manuellement un os root (addon Blender comme mixamo_converter). Reglages : **Enable + Force Root Lock** sur les sequences, et dans le **Class Defaults** de l'AnimBP, **Root Motion Mode = Root Motion from Everything**. Le **Retargeting** transfere des animations entre squelettes structurellement differents (nombre d'os, proportions) via trois assets : **IK Rig Source** (squelette donneur), **IK Rig Target** (squelette receveur) et **IK Retargeter** (mappage et calcul du transfert). Un IK Rig definit un **Retarget Root** et des **Chains** (chaines segmentant le corps, chacune definie par un os de debut et de fin). Les **Chain Name** doivent correspondre entre Source et Target (Autocreate Retarget Chains pour les bipedes). L'IK Retargeter aligne les deux squelettes dans leur **pose de reference** (T-Pose/A-Pose) et permet d'editer la pose du Target.",
        "keypoints": [
          "In-Place : la capsule bouge ; **Root Motion** : l'anim la bouge",
          "**Root Bone** = racine, premier os (index 0)",
          "Mixamo commence au Hips => ajouter un os root (Blender)",
          "Retargeting : **IK Rig** Source + Target + **IK Retargeter**"
        ],
        "versionNote": "Le pipeline moderne IK Rig / IK Retargeter est pleinement disponible et mis en avant en UE 5.4. En revanche, l'ajout d'un os root directement dans l'editeur de Skeletal Mesh releve des outils 5.6 ; en 5.4 on passe par Blender/Maya.",
        "tier": 3,
        "front": "Root Motion, Root Bone et IK Retargeting"
      }
    ],
    "quiz": [
      {
        "q": "Quels sont les composants fondamentaux qui definissent la geometrie de base d'un mesh 3D ?",
        "choices": [
          "Les normales et les coordonnées UV",
          "Les matériaux et les textures",
          "Les vertices et les triangles",
          "Les sockets et les collisions"
        ],
        "answer": 2,
        "explain": "La geometrie de base d'un mesh est composee de vertices (sommets) et de triangles. Les UVs servent au plaquage des textures et les normales (orientation de surface) au calcul de l'eclairage, mais ce sont les vertices et triangles qui forment la structure geometrique.",
        "difficulty": "facile",
        "topic": "Composants d'un mesh 3D",
        "def": {
          "term": "Géométrie d'un mesh",
          "text": "Les vertices (sommets 3D) reliés par des triangles forment la surface géométrique de base d'un mesh ; les UV et les normales viennent s'y ajouter ensuite."
        }
      },
      {
        "q": "Quelle affirmation decrit correctement la difference essentielle entre Static Mesh et Skeletal Mesh ?",
        "choices": [
          "Le Static Mesh est rigide, le Skeletal Mesh se déforme via un squelette",
          "Le Static Mesh se déforme librement, le Skeletal Mesh reste figé et rigide",
          "Le Skeletal Mesh ne peut recevoir aucun matériau ni aucune texture appliquée",
          "Le Static Mesh doit obligatoirement être importé au format d'image PNG"
        ],
        "answer": 0,
        "explain": "Le Static Mesh represente un objet rigide sans deformation (pipeline d'asset traditionnel), tandis que le Skeletal Mesh necessite un squelette (rig) et des animations, ce qui permet la deformation et le mouvement (typiquement les personnages).",
        "difficulty": "facile",
        "topic": "Static Mesh vs Skeletal Mesh",
        "def": {
          "term": "Static Mesh vs Skeletal Mesh",
          "text": "Le Static Mesh est un objet rigide sans déformation (décors, props) ; le Skeletal Mesh se déforme grâce à un squelette et des animations (personnages)."
        }
      },
      {
        "q": "Pourquoi le format FBX est-il prefere a l'OBJ pour importer un Skeletal Mesh anime ?",
        "choices": [
          "Parce que l'OBJ ne gère ni les textures ni les matériaux du mesh",
          "Parce que le FBX compresse davantage les sommets et les normales",
          "Parce que l'OBJ reste totalement incompatible avec le moteur Nanite",
          "Parce que le FBX transporte la géométrie, le rig et les animations"
        ],
        "answer": 3,
        "explain": "Le FBX est le standard d'echange car il transporte la geometrie, mais aussi les donnees de rig (squelette) et d'animation si presentes. L'OBJ est un format de geometrie simple qui ne transporte ni rig ni animation.",
        "difficulty": "facile",
        "topic": "Formats d'import FBX/OBJ",
        "def": {
          "term": "FBX vs OBJ",
          "text": "Le FBX est le format d'échange standard : il transporte géométrie, rig (squelette) et animations. L'OBJ ne contient qu'une géométrie simple, sans rig ni animation."
        }
      },
      {
        "q": "Selon les standards d'import Unreal, a quoi correspond une unite et quelle orientation avant doit avoir un mesh ?",
        "choices": [
          "1 unité = 1 mètre, orientation frontale vers -Z",
          "1 unité = 1 centimètre, orientation frontale vers +X",
          "1 unité = 1 pouce, orientation frontale vers +Y",
          "1 unité = 1 pixel, orientation frontale totalement libre"
        ],
        "answer": 1,
        "explain": "Le standard Unreal est 1 unite = 1 cm. Tous les modeles doivent avoir leur dimension avant orientee vers l'axe positif des X (+X), avec un pivot place a un endroit pratique pour le placement.",
        "difficulty": "moyen",
        "topic": "Standards d'import Static Mesh",
        "def": {
          "term": "Standards d'import Unreal",
          "text": "Convention d'import d'un mesh dans Unreal : échelle 1 unité = 1 cm, orientation avant vers l'axe +X, pivot au point de placement ou de rotation naturel."
        }
      },
      {
        "q": "Dans l'asset UStaticMesh, a quoi sont typiquement dedies les canaux UV0 et UV1 ?",
        "choices": [
          "UV0 pour les textures de base, UV1 pour la lightmap",
          "UV0 pour la collision, UV1 pour la simulation physique",
          "UV0 pour la lightmap, UV1 pour les animations",
          "UV0 et UV1 restent toujours strictement identiques"
        ],
        "answer": 0,
        "explain": "UV0 est le canal par defaut pour les textures (chevauchement autorise pour maximiser l'usage de la texture). UV1 est souvent reserve a la lightmap et doit avoir des UV disposees uniformement sans chevauchement.",
        "difficulty": "moyen",
        "topic": "Asset UStaticMesh, canaux UV et LightMaps",
        "def": {
          "term": "Canaux UV (UV0/UV1)",
          "text": "Coordonnées 2D de plaquage. UV0 sert aux textures (chevauchement permis) ; UV1 est souvent réservé à la lightmap et doit être dépourvu de chevauchement."
        }
      },
      {
        "q": "Quel est le role principal des LODs (Levels of Detail) d'un Static Mesh classique ?",
        "choices": [
          "Convertir automatiquement le mesh statique en Skeletal Mesh animé",
          "Augmenter progressivement le nombre de triangles avec la distance",
          "Réduire le nombre de triangles selon la distance à la caméra",
          "Générer les UV de lightmap sans le moindre chevauchement possible"
        ],
        "answer": 2,
        "explain": "Les LODs reduisent le decompte de triangles en fonction de la distance a la camera. Bien faits, ils minimisent la visibilite des changements (popping). Ils peuvent etre crees manuellement ou generes par le moteur.",
        "difficulty": "facile",
        "topic": "LODs",
        "def": {
          "term": "LOD (Level of Detail)",
          "text": "Versions simplifiées d'un mesh affichées selon la distance à la caméra : moins de triangles de loin, ce qui réduit le coût de rendu et limite le popping."
        }
      },
      {
        "q": "En UE 5.4, laquelle de ces limitations de Nanite est correcte ?",
        "choices": [
          "Nanite ne fonctionne qu'avec des meshes de moins de mille triangles",
          "Nanite impose obligatoirement des matériaux entièrement translucides",
          "Nanite remplace purement le Character Movement Component standard",
          "Nanite ne supporte pas la déformation des Skeletal Meshes animés"
        ],
        "answer": 3,
        "explain": "Nanite ne supporte pas la deformation du mesh (donc pas de Skeletal Meshes animes), ni le World Position Offset (WPO), ni les materiaux translucides. En 5.4, la restriction sur les Skeletal Meshes est totale ; il gere en revanche des millions de polygones via des clusters de triangles et l'occlusion culling.",
        "difficulty": "moyen",
        "topic": "Nanite",
        "def": {
          "term": "Nanite",
          "text": "Système de géométrie virtualisée d'UE5 : rend des meshes à des millions de polygones via des clusters de triangles. Réservé aux meshes statiques (pas de déformation) en 5.4."
        }
      },
      {
        "q": "Quel type de collision est recommande par defaut pour les Static Meshes de l'environnement ?",
        "choices": [
          "Les collisions simples à base de primitives géométriques",
          "Les collisions complexes per-poly (Use Complex as Simple)",
          "Aucune collision, entièrement gérée par le système Nanite",
          "Les collisions calculées à partir des coordonnées UV"
        ],
        "answer": 0,
        "explain": "Les Simple Collisions (primitives : boite, sphere, capsule) sont la methode par defaut et recommandee car peu couteuses. Les collisions complexes (per-poly) sont tres couteuses et a eviter pour les assets statiques du monde.",
        "difficulty": "facile",
        "topic": "Collisions (simple, complexe, convexe, channels)",
        "def": {
          "term": "Collision simple vs complexe",
          "text": "La collision simple utilise des primitives (boîte, sphère, capsule), peu coûteuse et recommandée. La complexe suit la géométrie per-poly, précise mais lourde."
        }
      },
      {
        "q": "A quoi sert la Convex Decomposition (Auto-Convex Collision) dans UE5 ?",
        "choices": [
          "À générer les textures diffuses et les cartes de lightmap",
          "À couvrir une forme complexe avec plusieurs convex shapes",
          "À supprimer définitivement toute collision présente sur un mesh",
          "À convertir un Static Mesh rigide en un Skeletal Mesh animé"
        ],
        "answer": 1,
        "explain": "La Convex Decomposition genere directement dans UE des primitives de collision simples mais precises, en creant une enveloppe fidele avec plusieurs convex shapes pour couvrir des formes complexes (arcades) impossibles a couvrir avec une seule boite. On l'ajuste via Hole Count, Max Whole Verts et Precision.",
        "difficulty": "moyen",
        "topic": "Collisions (simple, complexe, convexe, channels)",
        "def": {
          "term": "Convex Decomposition",
          "text": "Auto-Convex Collision : décompose une forme concave en plusieurs volumes convexes simples, offrant une collision plus fidèle qu'une primitive unique, sans coût per-poly."
        }
      },
      {
        "q": "Quelle est la difference principale entre un ISM et un HISM ?",
        "choices": [
          "Le HISM ne fonctionne que pour les Skeletal Meshes animés",
          "L'ISM est plus récent et remplace désormais le HISM",
          "Le HISM interdit totalement l'usage de plusieurs instances",
          "Le HISM ajoute les LODs hiérarchiques et le culling"
        ],
        "answer": 3,
        "explain": "L'ISM (Instanced Static Mesh Component) est le composant de base. Le HISM (Hierarchical ISM) est une variante avancee qui integre la gestion hierarchique des LODs et le culling, regroupant les instances par distance pour occulter efficacement des groupes entiers.",
        "difficulty": "moyen",
        "topic": "Instancing ISM et HISM",
        "def": {
          "term": "ISM vs HISM",
          "text": "L'ISM (Instanced Static Mesh) dessine N copies d'un mesh en un seul draw call. Le HISM (Hierarchical ISM) y ajoute des LODs hiérarchiques et le culling par distance."
        }
      },
      {
        "q": "De quelles deux parties est compose un Skeletal Mesh ?",
        "choices": [
          "Une lightmap dédiée et un matériau entièrement translucide",
          "Une collision simple et une collision complexe per-poly",
          "Un ensemble de polygones (skin) et une hiérarchie d'os",
          "Un Blend Space animé et une State Machine de locomotion"
        ],
        "answer": 2,
        "explain": "Un Skeletal Mesh est compose d'un ensemble de polygones constituant la surface (le skin) et d'un ensemble hierarchique d'os interconnectes (le Squelette) utilises pour animer les sommets des polygones via les Skin Weights.",
        "difficulty": "facile",
        "topic": "Skeletal Mesh et Squelette (Skeleton)",
        "def": {
          "term": "Skeletal Mesh",
          "text": "Mesh déformable composé d'une surface de polygones (le skin) et d'une hiérarchie d'os (le Squelette) qui, via les skin weights, déplacent les vertices."
        }
      },
      {
        "q": "Comment les os (bones) d'un squelette deforment-ils la surface d'un Skeletal Mesh ?",
        "choices": [
          "Grâce aux Skin Weights liant chaque vertex aux bones",
          "Grâce aux UV de la lightmap projetés sur la surface",
          "Grâce aux Collision Channels définis sur le mesh animé",
          "Grâce au Character Movement Component du personnage"
        ],
        "answer": 0,
        "explain": "Le mouvement des bones tire et modifie la position des vertices auxquels ils sont associes via les Skin Weights (poids de skinning). C'est la difference essentielle avec un Static Mesh rigide.",
        "difficulty": "moyen",
        "topic": "Skinning et Skin Weights",
        "def": {
          "term": "Skin Weights",
          "text": "Poids de skinning associant chaque vertex à un ou plusieurs os. Ils déterminent dans quelle mesure le mouvement de chaque bone déforme la surface du mesh."
        }
      },
      {
        "q": "Quelle fonction Blueprint declenche typiquement le Ragdoll sur un Skeletal Mesh Component ?",
        "choices": [
          "Play Montage at Section sur le Skeletal Mesh Component animé",
          "Set All Bodies Below Simulate Physics sur un bone donné",
          "Add Movement Input orienté vers le sol sous le pion joueur",
          "Set Morph Target Weight appliqué sur tout le corps"
        ],
        "answer": 1,
        "explain": "Le Ragdoll s'active via Set All Bodies Below Simulate Physics sur le Skeletal Mesh Component. Cette fonction prend le nom d'un bone racine (ex : Pelvis) et applique la simulation physique a ce Body et a tous ceux situes en dessous dans la hierarchie. Les Bodies doivent etre des formes simples.",
        "difficulty": "difficile",
        "topic": "Ragdoll et simulation physique",
        "def": {
          "term": "Ragdoll",
          "text": "Bascule d'un personnage vers une simulation physique complète. Activé par Set All Bodies Below Simulate Physics sur un bone (ex. Pelvis) et tous ses enfants."
        }
      },
      {
        "q": "Que contient une Animation Sequence et a quel squelette est-elle liee ?",
        "choices": [
          "Des textures animées, compatible avec tous les squelettes",
          "Des matériaux dynamiques, liée au Physics Asset du mesh",
          "Des Console Variables, totalement indépendante du squelette",
          "Des keyframes des os, liée à un seul Skeleton précis"
        ],
        "answer": 3,
        "explain": "Une Animation Sequence contient des images cles specifiant la position, la rotation et l'echelle de chaque os. Elle cible un squelette specifique et ne peut etre jouee que sur ce Skeleton ; pour partager une anim, les meshes doivent utiliser le meme Skeleton.",
        "difficulty": "moyen",
        "topic": "Animation Sequence et Animation Curves",
        "def": {
          "term": "Animation Sequence",
          "text": "Ressource d'animation contenant des keyframes (position, rotation, échelle des os). Liée à un Skeleton précis, elle ne peut se jouer que sur ce squelette."
        }
      },
      {
        "q": "Dans un Animation Blueprint, quel est le role respectif de l'Event Graph et de l'Anim Graph ?",
        "choices": [
          "L'Event Graph évalue la pose, l'Anim Graph lit le clavier",
          "Les deux graphes exécutent exactement le même traitement interne",
          "L'Event Graph met à jour les variables, l'Anim Graph la pose",
          "L'Event Graph gère les collisions, l'Anim Graph les matériaux"
        ],
        "answer": 2,
        "explain": "L'Event Graph controle la logique de mise a jour : il recupere des donnees (Pawn Owner, Character Movement Component) et met a jour des variables (Ground Speed, Is Falling). L'Anim Graph controle la logique de pose : il evalue la pose finale (Output Pose) en consommant ces variables.",
        "difficulty": "moyen",
        "topic": "Event Graph vs Anim Graph",
        "def": {
          "term": "Event Graph vs Anim Graph",
          "text": "Dans l'AnimBP, l'Event Graph met à jour la logique et les variables (vitesse, états) ; l'Anim Graph évalue la pose finale (Output Pose) qui consomme ces variables."
        }
      },
      {
        "q": "Sur quoi reposent les regles de transition d'une State Machine ?",
        "choices": [
          "Sur des conditions booléennes basées sur les variables",
          "Sur le nombre total de triangles composant le mesh affiché",
          "Sur la résolution de la lightmap appliquée au personnage",
          "Sur le format du fichier source importé (FBX ou bien OBJ)"
        ],
        "answer": 0,
        "explain": "Les regles de transition sont des conditions booleennes (Vrai/Faux) basees sur les variables du personnage, comme la vitesse (Ground Speed) pour passer de Idle a Walk, ou Is Falling pour passer a Jump. On utilise des seuils pour eviter les transitions involontaires.",
        "difficulty": "moyen",
        "topic": "State Machine et regles de transition",
        "def": {
          "term": "Règle de transition",
          "text": "Condition booléenne (vrai/faux) reliant deux états d'une State Machine. Basée sur les variables du personnage (Ground Speed, Is Falling), souvent avec des seuils."
        }
      },
      {
        "q": "Pour une locomotion de marche, quels deux axes pilote-t-on typiquement dans un Blend Space 2D ?",
        "choices": [
          "La résolution d'affichage et le nombre total de triangles",
          "La couleur du matériau et son niveau global d'opacité",
          "Le nombre d'os du squelette et le nombre de sockets",
          "La vitesse (Speed) et la direction (Yaw) du déplacement"
        ],
        "answer": 3,
        "explain": "Un Blend Space melange des poses selon un ou deux axes. Pour la marche, on utilise deux facteurs : la vitesse (Idle a vitesse max) et la direction (avant, gauche, arriere, droite), car l'animation a jouer differe selon la direction. L'Interpolation Time adoucit les transitions pour eviter le popping.",
        "difficulty": "moyen",
        "topic": "Blend Space et Aim Offset",
        "def": {
          "term": "Blend Space",
          "text": "Asset mélangeant plusieurs animations selon un ou deux axes continus (ex. vitesse et direction). L'Interpolation Time lisse les transitions pour éviter le popping."
        }
      },
      {
        "q": "Qu'est-ce qu'un Aim Offset et quel type d'animation utilise-t-il ?",
        "choices": [
          "Un type de collision reposant sur des formes per-poly",
          "Un Blend Space de poses Additive pilotant la visée",
          "Un niveau de LOD automatique calculé selon la distance",
          "Un conteneur de sections nommées comme le Montage"
        ],
        "answer": 1,
        "explain": "Un Aim Offset est un type de Blend Space utilisant des poses Additive. Il combine des poses d'inclinaison (haute/basse/gauche/droite) pour creer dynamiquement la pose de visee selon la rotation du controleur (Yaw et Pitch). Pour etre compatible, l'animation doit etre en additif Mesh Space.",
        "difficulty": "difficile",
        "topic": "Blend Space et Aim Offset",
        "def": {
          "term": "Aim Offset",
          "text": "Blend Space particulier composé de poses additives (Mesh Space) combinées pour orienter la visée (haut/bas/gauche/droite) selon le Yaw et le Pitch du contrôleur."
        }
      },
      {
        "q": "Quelle contrainte technique majeure un Morph Target doit-il imperativement respecter ?",
        "choices": [
          "Doubler le nombre de vertices présents sur le mesh de base",
          "Utiliser exclusivement le canal UV1 réservé à la lightmap",
          "Conserver le nombre exact et l'ordre des vertices de base",
          "Être importé uniquement au format OBJ sans aucun rig associé"
        ],
        "answer": 2,
        "explain": "Pour qu'un Morph Target (Blendshape) soit valide, il doit imperativement conserver le nombre exact et l'ordre des vertices du mesh de base. Toute operation d'edition geometrique (ajout/suppression de vertices) invalide le morph. Il est pilote par une valeur Weight (0 a 1, depassable).",
        "difficulty": "moyen",
        "topic": "Morph Targets / Blendshapes",
        "def": {
          "term": "Morph Target (Blendshape)",
          "text": "Déformation de surface interpolant les positions des vertices entre pose de base (0) et cible (1). Exige le même nombre et le même ordre de vertices que la base."
        }
      },
      {
        "q": "A quoi sert un Anim Montage et comment est-il declenche ?",
        "choices": [
          "À jouer des actions ponctuelles à la demande via Blueprint",
          "À gérer la locomotion continue déclenchée par la State Machine",
          "À générer les UV de lightmap du personnage à l'import",
          "À définir la hiérarchie complète des os du squelette"
        ],
        "answer": 0,
        "explain": "L'Anim Montage est un conteneur (wrapper) d'animation pour les actions ponctuelles hors du flux de locomotion (attaques, sorts). Les Montages sont joues a la demande via Blueprint, dans un Slot qui definit la partie du corps affectee, et peuvent se decouper en Sections nommees.",
        "difficulty": "moyen",
        "topic": "Anim Montage, slots et sections",
        "def": {
          "term": "Anim Montage",
          "text": "Conteneur d'animation pour actions ponctuelles (attaques, sorts), joué à la demande via Blueprint dans un Slot, et découpé en Sections nommées jouables librement."
        }
      },
      {
        "q": "Quelle est la difference entre un Anim Notify et un Anim Notify State ?",
        "choices": [
          "L'Anim Notify possède une durée, l'Anim Notify State est instantané",
          "L'Anim Notify est instantané, l'Anim Notify State a une durée",
          "Les deux marqueurs sont strictement et totalement identiques",
          "L'Anim Notify gère les collisions, l'Anim Notify State les textures"
        ],
        "answer": 1,
        "explain": "Un Anim Notify declenche un evenement unique et instantane a une frame (son de pas, camera shake, FX). Un Anim Notify State definit une fenetre temporelle active du debut a la fin du marqueur (ex : activer un collider d'arme pendant la duree du swing).",
        "difficulty": "moyen",
        "topic": "Anim Notify et Anim Notify State",
        "def": {
          "term": "Anim Notify / Notify State",
          "text": "Marqueurs sur une animation. L'Anim Notify déclenche un événement instantané à une frame ; l'Anim Notify State ouvre une fenêtre active avec un début et une fin."
        }
      },
      {
        "q": "Qu'est-ce qu'une animation Additive et comment est-elle appliquee ?",
        "choices": [
          "Une animation qui remplace entièrement la pose de base courante",
          "Une collision complexe additionnée à la géométrie du mesh animé",
          "Un niveau de détail supplémentaire réservé aux personnages",
          "Une différence par rapport à une pose de référence ajoutée"
        ],
        "answer": 3,
        "explain": "Une animation Additive est une transformation stockee relativement a une pose de reference (pose de base) : elle ne contient que la difference pour atteindre la pose finale, et est ajoutee par-dessus l'animation de base. Elle peut etre en Local Space (ex respiration) ou Mesh Space (ex Aim Offset).",
        "difficulty": "difficile",
        "topic": "Animation Additive",
        "def": {
          "term": "Animation Additive",
          "text": "Transformation stockée comme la différence par rapport à une pose de référence. Elle s'ajoute par-dessus l'animation de base, en Local Space ou en Mesh Space."
        }
      },
      {
        "q": "A quoi sert le noeud Layered Blend per Bone (LBPB) et son parametre Blend Depth ?",
        "choices": [
          "À supprimer définitivement certains os du squelette importé du personnage",
          "À mélanger deux poses via un masque osseux, Blend Depth = zone fondue",
          "À transformer un Blend Space existant en une State Machine de locomotion",
          "À régler la résolution de la lightmap os par os sur le mesh animé"
        ],
        "answer": 1,
        "explain": "Le Layered Blend per Bone melange deux poses (Base Pose + Blend Pose) via un masque osseux defini par les Branch Filters (ex spine_01). Le Blend Depth est le nombre de bones successifs sur lesquels le melange s'applique progressivement (profondeur 0 = changement immediat).",
        "difficulty": "difficile",
        "topic": "Layered Blend per Bone",
        "def": {
          "term": "Layered Blend per Bone",
          "text": "Nœud mélangeant une Base Pose et une Blend Pose via un masque osseux (Branch Filters). Le Blend Depth fixe le nombre d'os sur lesquels le mélange est progressif."
        }
      },
      {
        "q": "Qu'est-ce qu'un Socket et ou est-il enregistre ?",
        "choices": [
          "Un matériau, enregistré directement dans le Static Mesh",
          "Une CVar de débogage, enregistrée dans la console runtime",
          "Un point d'attache sur un os, stocké dans le Skeleton",
          "Un LOD de distance, enregistré dans le Physics Asset lié"
        ],
        "answer": 2,
        "explain": "Un Socket est un point d'attachement logique et modifiable, fixe sur un bone specifique (cree par clic droit sur le bone dans le Skeleton Editor). Il est enregistre dans l'asset Skeleton : tous les meshes partageant ce Skeleton partagent les memes sockets. On y attache armes/accessoires/FX via AttachToComponent + Socket Name.",
        "difficulty": "moyen",
        "topic": "Sockets et attachement dynamique",
        "def": {
          "term": "Socket",
          "text": "Point d'attachement logique fixé sur un os, créé et stocké dans l'asset Skeleton. Sert à fixer armes, accessoires ou FX via AttachToComponent et le Socket Name."
        }
      },
      {
        "q": "Quelle est la difference fondamentale entre le mouvement In-Place et le Root Motion ?",
        "choices": [
          "En In-Place la capsule bouge seule, en Root Motion l'animation la bouge",
          "Le Root Motion désactive complètement toute animation du mesh",
          "In-Place et Root Motion désignent exactement le même mécanisme",
          "En Root Motion, c'est toujours le Movement Component qui bouge la capsule"
        ],
        "answer": 0,
        "explain": "En In-Place, c'est le Character Movement Component qui deplace la capsule de collision. Avec le Root Motion active sur l'asset d'animation, c'est l'animation elle-meme qui deplace la capsule via le deplacement du Root Bone (qui doit etre le premier os, index 0).",
        "difficulty": "moyen",
        "topic": "Root Motion et Root Bone",
        "def": {
          "term": "Root Motion",
          "text": "Mode où l'animation déplace la capsule via le Root Bone (premier os, index 0), au lieu du Character Movement Component. À activer sur l'asset d'animation."
        }
      },
      {
        "q": "Quels sont les trois assets du pipeline moderne de retargeting IK en UE 5.4 ?",
        "choices": [
          "Static Mesh, Skeletal Mesh et le Physics Asset lié",
          "Blend Space, State Machine et un Anim Montage",
          "Canal UV0, canal UV1 et la texture de Lightmap",
          "IK Rig Source, IK Rig Target et l'IK Retargeter"
        ],
        "answer": 3,
        "explain": "Le retargeting moderne (mis en avant en 5.4) utilise trois assets : l'IK Rig Source (squelette donneur d'animations), l'IK Rig Target (squelette receveur) et l'IK Retargeter (mappage et calcul du transfert). Les noms de Chains doivent correspondre entre Source et Target.",
        "difficulty": "moyen",
        "topic": "IK Retargeting (IK Rig / IK Retargeter)",
        "def": {
          "term": "Retargeting IK",
          "text": "Transfert d'animations entre squelettes différents via trois assets : IK Rig Source (donneur), IK Rig Target (receveur) et IK Retargeter (mappage des Chains)."
        }
      },
      {
        "q": "Que permettent les Console Variables (CVars) dans Unreal Engine ?",
        "choices": [
          "Compiler automatiquement tous les Blueprints ouverts du projet",
          "Modifier des paramètres au runtime, sans recompiler le code",
          "Importer des Skeletal Meshes accompagnés de leurs animations",
          "Générer les collisions convexes de tous les Static Meshes"
        ],
        "answer": 1,
        "explain": "Les Console Variables (CVars) sont des parametres modifiables en temps reel (runtime) via la console (touche tilde/backtick), sans recompiler. Elles permettent de basculer des fonctionnalites ou d'activer le debogage. Les commandes stat FPS et stat unit affichent la repartition de charge CPU/GPU.",
        "difficulty": "moyen",
        "topic": "Debogage (CVars, stat, slomo)",
        "def": {
          "term": "Console Variable (CVar)",
          "text": "Paramètre modifiable au runtime depuis la console (touche tilde), sans recompiler. Sert à activer du débogage ou à basculer des fonctionnalités du moteur."
        }
      },
      {
        "q": "Quel est l'effet d'une valeur de slomo inferieure a 1 dans Unreal Engine ?",
        "choices": [
          "Cela accélère uniquement la vitesse de lecture des animations",
          "Cela supprime la totalité des draw calls envoyés au GPU",
          "Cela ralentit l'échelle temporelle globale de tout le jeu",
          "Cela active automatiquement le mode Ragdoll du personnage"
        ],
        "answer": 2,
        "explain": "Le slomo controle l'echelle temporelle globale (time scale), ce qui impacte l'ensemble du systeme et pas seulement la vitesse des animations. Une valeur inferieure a 1 ralentit le jeu (slow motion), tandis qu'une valeur superieure a 1 accelere l'execution.",
        "difficulty": "facile",
        "topic": "Debogage (CVars, stat, slomo)",
        "def": {
          "term": "Slomo (time scale)",
          "text": "Commande console réglant l'échelle temporelle globale du jeu. Une valeur < 1 ralentit tout le système (pas que les animations), une valeur > 1 l'accélère."
        }
      }
    ],
    "sources": [
      {
        "label": "Animation Blueprints in Unreal Engine (EventGraph / AnimGraph) - Epic Games Docs",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-blueprints-in-unreal-engine"
      },
      {
        "label": "State Machines in Unreal Engine - Epic Games Docs",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/state-machines-in-unreal-engine"
      },
      {
        "label": "Blend Spaces in Unreal Engine - Epic Games Docs",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blend-spaces-in-unreal-engine"
      },
      {
        "label": "Aim Offset in Unreal Engine - Epic Games Docs",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/aim-offset-in-unreal-engine"
      },
      {
        "label": "Animation Montage in Unreal Engine - Epic Games Docs",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/animation-montage-in-unreal-engine"
      },
      {
        "label": "IK Rig Animation Retargeting in Unreal Engine - Epic Games Docs",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine"
      },
      {
        "label": "IK Retargeting - 5.4 Features at a Glance - Epic Developer Community",
        "url": "https://dev.epicgames.com/community/learning/talks-and-demos/vwG7/unreal-engine-ik-retargeting-5-4-features-at-a-glance"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/etRZu5UG_S0/hqdefault.jpg",
        "caption": "Machine a etats d'un Animation Blueprint (Idle / Walk / Run / Jump) dans UE5",
        "credit": "Ryan Laley - YouTube",
        "link": "https://www.youtube.com/watch?v=etRZu5UG_S0"
      },
      {
        "url": "https://img.youtube.com/vi/0Ab_MeAh6_k/hqdefault.jpg",
        "caption": "Blend Space : melange d'animations de locomotion selon la vitesse et la direction",
        "credit": "Ryan Laley - YouTube",
        "link": "https://www.youtube.com/watch?v=0Ab_MeAh6_k"
      }
    ],
    "links": [
      {
        "label": "Doc officielle UE - Blend Spaces (melange d'animations 1D / 2D, Aim Offset)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/blend-spaces-in-unreal-engine",
        "kind": "doc"
      },
      {
        "label": "Forum Epic - Tutoriel communautaire : creer un Animation Blueprint + Blend Space de zero",
        "url": "https://forums.unrealengine.com/t/community-tutorial-build-an-animation-blueprint-from-scratch-and-add-custom-animations-using-a-blend-space/2251914",
        "kind": "forum"
      },
      {
        "label": "YouTube - Ryan Laley : Animation Blueprint Part 1 (State Machines)",
        "url": "https://www.youtube.com/watch?v=etRZu5UG_S0",
        "kind": "youtube"
      },
      {
        "label": "Blog MoCap Online - Guide complet Animation Blueprint UE5 (state machine, blend space, montages)",
        "url": "https://mocaponline.com/blogs/mocap-news/animation-blueprint-unreal-engine-5-guide",
        "kind": "blog"
      }
    ]
  },
  {
    "id": "ia",
    "num": "07",
    "special": false,
    "title": "Intelligence Artificielle",
    "summary": "Ce chapitre couvre l'IA de jeu vidéo dans Unreal Engine 5.4, de la théorie à la pratique. On part de la philosophie de l'IA (donner l'illusion d'intelligence, une IA au service du jeu), de la notion d'agent et des grands domaines (déplacement/navigation, perception, décision, planification, apprentissage). On étudie les techniques décisionnelles (FSM, Decision Tree, Behavior Tree, Utility, AI Planner) puis, en détail, le Behavior Tree d'Unreal : Root, Task, composites Sequence et Selector, Decorators (Observer Aborts), Services et Blackboard, pilotés par un AI Controller via le nœud Run Behavior Tree. Côté perception, on met en place l'AIPerception Component (sens Sight/Hearing/Touch/Damage) et l'AIPerceptionStimuliSource. Côté navigation, on couvre le NavMesh (RecastNavMesh, Recast & Detour), le Nav Mesh Bounds Volume, les NavMesh Invokers, les NavLink Proxies, l'évitement Detour Crowd et l'EQS. Le TP construit un NPC qui patrouille aléatoirement (GetRandomLocation + MoveTo) et chasse le joueur à vue.",
    "topics": [
      "Philosophie de l'IA de jeu",
      "Agent intelligent",
      "Domaines de l'IA",
      "Déplacement et navigation",
      "NavMesh et pathfinding (A*, Dijkstra)",
      "Perception (sens, cônes de vision)",
      "IA décisionnelle et techniques",
      "FSM",
      "Decision Tree",
      "Behavior Tree",
      "Composites (Sequence, Selector)",
      "Decorators et Observer Aborts",
      "Services",
      "Blackboard",
      "AI Controller et Run Behavior Tree",
      "AI Perception et Stimuli Source",
      "Nav Mesh Bounds Volume",
      "NavMesh Invokers et NavLink Proxy",
      "Detour Crowd",
      "EQS",
      "AI MoveTo et mise en place TP"
    ],
    "fiches": [
      {
        "title": "L'IA dans le jeu vidéo : philosophie et définitions",
        "body": "Dans les jeux, l'IA désigne la mise en œuvre d'un **comportement apparemment intelligent** chez divers agents. L'objectif n'est pas de simuler une vraie intelligence, mais de donner au joueur **l'illusion d'une intelligence**. Principes clés du cours : l'**IA est au service du jeu**, pas l'inverse ; une IA ultra-performante ne fait pas forcément un bon jeu ; **tricher est tout à fait envisageable** ; et surtout, **une bonne IA est celle que l'on ne voit pas**. Le lead IA de Naughty Dog (The Last of Us) résume : le but des NPC qui cherchent le joueur n'est pas de le trouver, mais de **présenter un gameplay intéressant**. Une IA de jeu se compose à parts égales d'**algorithmes génériques 'état de l'art'** (souvent issus de la recherche, réutilisables), d'**heuristiques** (règles qui marchent dans la plupart des cas, spécifiques au jeu) et de **hacks** (solutions sur-mesure à des cas particuliers). Même un algorithme générique devra presque toujours être adapté au jeu cible.",
        "keypoints": [
          "But : donner l'**illusion** d'intelligence, pas la performance max",
          "L'IA est **au service du jeu** ; tricher est acceptable",
          "Une bonne IA est **celle qu'on ne voit pas**",
          "IA = algorithmes génériques + heuristiques + hacks"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Philosophie de l'IA de jeu : à quoi sert-elle ?"
      },
      {
        "title": "L'agent intelligent et les domaines de l'IA",
        "body": "Une entité autonome dotée d'une IA est appelée un **agent** (agent intelligent / interactif). Il possède un **système de senseurs**, un **système décisionnel** et des **actions à effectuer**. Un agent a toujours des **entrées (inputs)** (données, informations, événements) et des **sorties (outputs)** (actions, ordres, données). L'agent standard est le **NPC** (soldat ennemi, allié, adversaire de plateau, armée), mais un agent peut aussi être un **gestionnaire de difficulté (game director)**, un tutoriel interactif, un générateur de terrain, un match-maker ou un simulateur de joueur (test/équilibrage). L'IA de jeu regroupe plusieurs **domaines interconnectés** correspondant à des niveaux d'abstraction : le **déplacement/la navigation** (niveau le plus bas), la **perception**, la **décision** (réaction à une situation), la **planification de tâches / élaboration de stratégies**, et l'**apprentissage**.",
        "keypoints": [
          "Agent = **senseurs** + **décisionnel** + **actions**",
          "Toujours des **inputs** et des **outputs**",
          "Formes : NPC, game director, générateur, match-maker",
          "5 domaines : navigation, perception, décision, planif., apprentissage"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "L'agent intelligent et les domaines de l'IA"
      },
      {
        "title": "Le déplacement : individuel, groupe et navigation",
        "body": "Le **déplacement** est fondamental dès qu'un agent doit se mouvoir dans l'espace ; c'est le niveau le plus bas de l'IA, fortement lié à l'animation. On distingue trois aspects. Le **déplacement individuel** doit synchroniser animation et mouvement en prenant en compte des paramètres de réglage (**accélération, vitesse maximum, vitesse angulaire**) ; des techniques comme le **steering** sont utilisées. Dans Unreal, cet aspect est natif via le component **Character Movement** (équivalent du Character Controller d'Unity). Le **déplacement de groupe** coordonne plusieurs agents : déplacement en **formation**, en **nuée (flocking)**, ou simulations proie-prédateur (predator-prey). La **navigation** permet à un agent de trouver son chemin dans un niveau, essentielle en présence d'obstacles statiques ou dynamiques ; on cherche généralement le **chemin le plus court** d'un point A à un point B, à l'aide de **données de navigation** (graphe, mesh de navigation) et d'un algorithme de **pathfinding**.",
        "keypoints": [
          "3 aspects : individuel, de groupe, navigation",
          "Individuel : **steering**, accél., vitesse max/angulaire",
          "Unreal : component **Character Movement**",
          "Groupe : formation, **flocking**, predator-prey"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Déplacement : individuel, groupe, navigation"
      },
      {
        "title": "NavMesh, pathfinding, Dijkstra et A*",
        "body": "Les moteurs modernes utilisent des **navigation meshes (Nav Meshes)**. Un **NavMesh** est une structure **précalculée (générée à la demande)**, composée de **polygones convexes (souvent des triangles)** basés sur les meshes de collision. On peut générer plusieurs NavMesh selon les **contraintes des agents** (taille, capacité à monter/sauter…), **modifier le coût de déplacement par zone**, et compléter ces données statiques par des **modificateurs dynamiques** (zones amovibles, destructibles). Pour naviguer, on relie les polygones connexes par leur **barycentre** (position moyenne des vertices) ; le chemin brut étant peu crédible, on applique du **smoothing** (raycasts pour 'couper' le chemin). Le **pathfinding** trouve le chemin optimal : **Dijkstra** s'étend à tous les nœuds connectés en gardant la plus courte distance connue jusqu'à atteindre l'arrivée, puis remonte le chemin ; l'**algorithme A\\*** fonctionne comme Dijkstra mais ajoute la **pondération d'une heuristique** (une distance, ou une distance modifiée par le type de sol) pour estimer le score d'un nœud. Les trois systèmes de navigation les plus courants sont les **points de navigation**, les **grilles** et les **maillages (meshes)**.",
        "keypoints": [
          "**NavMesh** = polygones convexes précalculés depuis les collisions",
          "**A\\*** = Dijkstra + **heuristique** (coût restant estimé)",
          "Lien par barycentre + **smoothing** (raycasts)",
          "UE 5.4 : **RecastNavMesh** (Recast génère, Detour route)"
        ],
        "versionNote": "Sous UE 5.4, générer un NavMesh crée un acteur RecastNavMesh, basé sur la bibliothèque open source Recast & Detour (Recast génère le maillage, Detour gère le pathfinding).",
        "tier": 2,
        "front": "NavMesh et pathfinding : Dijkstra vs A*"
      },
      {
        "title": "La perception : sens et gestion",
        "body": "La **perception** permet à un agent de **collecter de façon autonome** des données sur son environnement, données ensuite exploitées par l'aspect décisionnel. On gère principalement quatre sens : la **vue**, le **toucher**, l'**ouïe** et l'**odorat**. Chaque sens se gère différemment : la **vue** via des **cônes de visibilité** définis par une **distance + un angle** ; le **toucher** via la **détection de collision** sur l'agent ; l'**ouïe/odorat** via un **trigger de zone avec atténuation** (par distance/obstacles). Plus le jeu est exigeant, plus la perception est évoluée : les jeux d'**infiltration** sont parmi les plus poussés (vision périphérique, zone de vie, détection de mouvement, d'anomalies du décor…). Unreal propose un composant dédié : l'**AIPerception Component**.",
        "keypoints": [
          "Perception = **collecte autonome** de données pour décider",
          "Sens : vue, toucher, ouïe, odorat",
          "Vue = **cônes** (distance + angle) ; toucher = collision",
          "Unreal : **AIPerception Component**"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "La perception : les sens de l'agent"
      },
      {
        "title": "L'IA décisionnelle et ses techniques",
        "body": "L'**IA décisionnelle** permet à un agent de **choisir l'action la plus adaptée** à une situation ; c'est un aspect essentiel présent dans **95% des jeux actuels**, allant d'actions unitaires simples (aller de A à B, tirer) à des suites d'actions complexes (rentrer à la base pour se soigner, fuir pour appeler du renfort). La décision dépend de l'**état courant de l'agent** (propriétés, data, inventaire, états logiques) et des **données de l'environnement** (topologie, position des cibles, visibilité…). Les **données internes** sont accessibles directement via le **Character** ou le **PlayerState** (santé, énergie, vitesse, états) ; les **données externes** viennent du système de perception ou d'**autres agents** (d'où les **systèmes multi-agents** et la communication inter-agents). Plusieurs techniques standardisées existent : **Finite State Machine (FSM)**, **Decision Tree**, **Behavior Tree**, **Utility Systems** et **AI Planner**.",
        "keypoints": [
          "Décider = choisir l'action adaptée (95% des jeux)",
          "Dépend de l'**état de l'agent** + données environnement",
          "Interne via Character/PlayerState ; externe via perception",
          "Techniques : **FSM**, Decision Tree, **BT**, Utility, AI Planner"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "L'IA décisionnelle et ses grandes techniques"
      },
      {
        "title": "FSM et Decision Tree",
        "body": "La **FSM (Finite State Machine / machine à états finis)** est un système historique très répandu (IA, mais aussi états d'animation). Elle gère des **états logiques simples et définis** reliés par des **transitions**, et communique directement avec l'agent. **Avantages** : simple à mettre en place, intuitive, éprouvée. **Limites** : il faut **prévoir à l'avance toutes les transitions possibles** de chaque état pour ne pas rester bloqué ; la structure est difficile à faire évoluer et la maintenance se complexifie à mesure que les états augmentent. Le **Decision Tree** parcourt une **arborescence** pour sélectionner l'action appropriée : chaque **nœud est un point de décision**, la **racine** est la décision initiale, chaque décision s'appuie sur les connaissances de l'agent, et les **feuilles (nœuds terminaux) sont des actions**. **Avantages** : parcours rapide et performant, simple à comprendre. **Limites** : problèmes d'équilibrage, décisions binaires limitantes, fonctionnement très déterministe, comportements complexes lourds à concevoir.",
        "keypoints": [
          "**FSM** : états + transitions ; toutes à prévoir → lourd",
          "**Decision Tree** : arbre, racine = décision initiale",
          "Decision Tree : **feuilles = actions**",
          "Rapides mais binaires et très déterministes"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "FSM et Decision Tree : forces et limites"
      },
      {
        "title": "Behavior Tree : principe, structure et parcours",
        "body": "Le **Behavior Tree (BT)** est l'un des systèmes de décision les plus répandus depuis 20 ans (Halo, Far Cry, BioShock, Alien: Isolation, The Division…) et a été **popularisé par Unreal Engine** ; c'est la configuration d'IA **la plus courante** dans le moteur. Proche du Decision Tree, il réalise les mêmes comportements qu'une FSM mais de façon **plus souple** : comportements complexes facilités, structure plus simple à faire évoluer, plus claire visuellement et plus simple à debugger. Il est constitué de **nodes reliés par des branches**, dans un seul sens. Trois familles de nodes : le **root**, les **leafs** (feuilles) et les **composites**. L'arbre est **exécuté depuis le root à chaque update**, toujours de **gauche à droite**, ce qui évite de rester bloqué et garde l'arbre à jour par rapport aux données ; un node peut rester **en cours plusieurs frames**. Lors de son évaluation, un node renvoie **true** (réussite), **false** (échec) ou **in progress** (en cours). Le **root** est unique, sans parent, point de départ, avec un unique enfant. Les **leafs** n'ont pas d'enfant et correspondent à une action.",
        "keypoints": [
          "**BT** popularisé par Unreal ; config d'IA la plus courante",
          "Plus souple qu'une **FSM**, plus clair, plus debuggable",
          "3 nodes : **root**, **leafs**, **composites**",
          "Parcouru du **root** à chaque update, gauche→droite"
        ],
        "versionNote": "",
        "tier": 1,
        "front": "Behavior Tree : c'est quoi et comment il tourne ?"
      },
      {
        "title": "Behavior Tree dans Unreal : Root, Task, Sequence, Selector",
        "body": "Dans Unreal, le **Root** est unique, constitue le point de départ, ne peut avoir qu'**une seule connexion** et **ne peut recevoir ni décorateurs ni services**. Les **Task** sont les **feuilles** de l'arbre, les nœuds qui **'font' des choses** et n'ont **pas de connexion de sortie** (ex : MoveTo, Wait). Les **nœuds composites** ont un parent et un ou plusieurs enfants et contrôlent le parcours. Le **Sequence** exécute ses enfants **de gauche à droite** et **s'arrête dès qu'un enfant échoue** : si un enfant échoue, la séquence échoue ; si tous réussissent, la séquence réussit (utile pour un ordre précis : courir → se mettre à couvert → tirer). Le **Selector** exécute ses enfants **de gauche à droite** et **s'arrête dès qu'un enfant réussit** : si un enfant réussit, le sélecteur réussit ; si tous échouent, le sélecteur échoue (le cours le décrit comme un genre de switch/case). Il existe aussi le composite **Simple Parallel**.",
        "keypoints": [
          "**Root** : unique, 1 connexion, ni décorateur ni service",
          "**Task** : feuilles ; exécutent une action (MoveTo, Wait)",
          "**Sequence** : échoue au 1er échec ; réussit si tous OK",
          "**Selector** : réussit au 1er succès (comme un switch/case)"
        ],
        "versionNote": "Vérifié pour UE 5.4 : les composites disponibles sont Selector, Sequence et Simple Parallel.",
        "tier": 2,
        "front": "BT Unreal : Root, Task, Sequence, Selector"
      },
      {
        "title": "Decorators, Observers, Services et Cooldown",
        "body": "Les **Decorators** (aussi appelés **conditionnels**) s'attachent à un autre nœud et **décident si une branche (voire un seul nœud) peut être exécutée** ; on les place généralement sur des Selectors ou Sequences pour contrôler le choix d'une branche (ex : vérifier une valeur du Blackboard, la portée d'un ennemi, si le joueur est en vie). Si le test est invalide, on passe à la branche suivante. Un décorateur possède la propriété **Observer Aborts** : les **Observers** peuvent **surveiller des valeurs du Blackboard** et **interrompre l'exécution** d'une branche si nécessaire. Les valeurs possibles d'Observer Aborts sont **None**, **Self**, **Lower Priority** et **Both** ('Self' interrompt la branche courante ; 'Lower Priority' interrompt les branches de priorité inférieure ; 'Both' combine les deux). Les **Services** s'attachent aux **nœuds composites** et **s'exécutent à leur fréquence définie** tant que leur branche est active ; ils servent souvent à effectuer des vérifications et à **mettre à jour le Blackboard**. Un **Cooldown** (décorateur) peut espacer les réévaluations (ex : régler cooldown à 0,2 s pour éviter le tremblement d'une IA dont la cible est reset en continu).",
        "keypoints": [
          "**Decorator** = conditionnel : autorise ou non une branche",
          "**Observer Aborts** : None, Self, Lower Priority, Both",
          "**Service** : sur composites, à une fréquence, MAJ le Blackboard",
          "**Cooldown** : espace les réévaluations (0.2 s anti-tremblote)"
        ],
        "versionNote": "Confirmé UE 5.4 : la propriété Observer Aborts d'un décorateur conditionnel prend les valeurs None, Self, Lower Priority, Both. Le BT est event-driven (réévaluation déclenchée par les observers plutôt qu'à chaque frame).",
        "tier": 3,
        "front": "Decorators, Observer Aborts, Services, Cooldown"
      },
      {
        "title": "Blackboard, AI Controller et Run Behavior Tree",
        "body": "Le **Blackboard** est la **mémoire de l'IA** : il stocke les **valeurs clés (keys)** que le Behavior Tree utilise. Il sert d'**interface de stockage** et de **point d'accès unique aux inputs** du BT, évite les références multiples sur les divers agents, et **plusieurs agents peuvent partager un même Blackboard** pour communiquer. Le BT est **géré au niveau du controller** : le **AI Controller** est affecté au Character via la variable **AI Controller Class** (catégorie **Pawn** des Details du Pawn). L'AIController **prend possession** du Pawn et lance l'arbre avec le nœud **Run Behavior Tree** ; une fois l'arbre lancé, il est joué en continu. Dans le TP : on crée un dossier AI, un **BP_NPC** (Character, avec skeletal mesh + classe d'animation), un **AIC_NPCController**, un Behavior Tree **BT_NPC** et un Blackboard **BB_NPC** ; le Blackboard est normalement assigné automatiquement à la racine du BT.",
        "keypoints": [
          "**Blackboard** = mémoire de l'IA ; stocke des **keys**",
          "Plusieurs agents peuvent **partager** un Blackboard",
          "**AI Controller** assigné via AI Controller Class (Pawn)",
          "Il possède le Pawn et lance le BT via **Run Behavior Tree**"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "Blackboard, AI Controller et Run Behavior Tree"
      },
      {
        "title": "AI Perception et Stimuli Source dans Unreal",
        "body": "Pour donner des sens à l'IA, on ajoute un **AIPerception Component** sur l'**AI Controller** et on lui configure un ou plusieurs **sens (Senses)** : **Sight (vue)**, **Hearing (ouïe)**, **Touch**, **Damage**, etc. (chaque sens se règle dans les Details : rayon, angle de vision, affiliation…). Pour qu'un acteur soit **détectable**, il faut lui ajouter le composant **AIPerceptionStimuliSource** et l'**enregistrer comme source pour les sens voulus** (option *Register as Source for Senses* : vue, son, dégâts…). Dans le TP, on ajoute ce composant au **ThirdPersonCharacter**. La détection se gère via l'événement **On Target Perception Updated** de l'AIPerception, dont on utilise le résultat pour mettre à jour une clé du Blackboard (attention à respecter le nom littéral, identique à la variable bool du Blackboard, et à utiliser la fonction Get Blackboard et non la variable). Le cours rappelle qu'on simule la perception humaine par des **traces (line of sight)** intermittentes et un **produit scalaire (dot product)** pour vérifier que la cible est dans la direction du regard de l'IA.",
        "keypoints": [
          "**AIPerception** sur l'AI Controller ; Sight/Hearing/Touch/Damage",
          "Cible détectable = **AIPerceptionStimuliSource** enregistré",
          "Réagir via **On Target Perception Updated**",
          "Simulation : traces (ligne de vue) + **dot product**"
        ],
        "versionNote": "Confirmé UE 5.4 : les sens pré-définis de l'AIPerception incluent Sight, Hearing, Touch et Damage ; un même AIPerceptionStimuliSource peut alimenter plusieurs sens.",
        "tier": 2,
        "front": "AI Perception et Stimuli Source dans Unreal"
      },
      {
        "title": "Navigation dans Unreal : Nav Mesh Bounds Volume, Invokers, NavLink, Detour Crowd, EQS",
        "body": "Pour qu'une IA puisse se déplacer, il faut délimiter la zone navigable en ajoutant à la scène un **Nav Mesh Bounds Volume** (drag & drop, puis ajustement de position/taille) ; la touche **P** (ou Show > Navigation) affiche la zone navigable **en vert**. Par défaut le NavMesh est calculé pour un **agent de taille humaine** ; des agents supplémentaires s'ajoutent dans les **Project Settings**. Pour les **grands environnements** (coûteux à construire entièrement), on utilise les **NavMesh Invokers** : la navigation n'est construite qu'**autour des acteurs porteurs d'un composant NavMesh Invoker**, et les régions se connectent quand deux tels acteurs se rapprochent. Les **NavLink Proxies** connectent des sections de NavMesh **non reliées automatiquement** (corniches, ascenseurs, sauts) et peuvent déclencher des comportements via des *smart links*. L'évitement dynamique entre agents se fait avec **RVO** ou le **Detour Crowd Manager** (échantillonnage RVO adaptatif, inclus dans la classe DetourCrowd AI Controller). Enfin, l'**Environment Query System (EQS)** collecte des données sur l'environnement, pose des questions via des **tests**, et **renvoie l'élément qui correspond le mieux** (trouver le power-up le plus proche, la plus grande menace, une cachette…).",
        "keypoints": [
          "**Nav Mesh Bounds Volume** délimite la zone ; touche **P** = vert",
          "**NavMesh Invokers** : nav construite autour d'acteurs marqués",
          "**NavLink Proxy** : relie des sections non connectées",
          "**Detour Crowd** = évitement foule ; **EQS** = meilleur élément"
        ],
        "versionNote": "Confirmé UE 5.4 : deux méthodes d'évitement, RVO (Reciprocal Velocity Obstacles) et Detour Crowd Manager (adaptatif, inclus dans la classe DetourCrowdAIController). Le NavMesh généré est un RecastNavMesh.",
        "tier": 3,
        "front": "Nav Unreal : Bounds Volume, Invokers, NavLink, EQS"
      },
      {
        "title": "Mise en pratique : patrouille aléatoire puis chasse à vue",
        "body": "Le TP construit un NPC qui **patrouille aléatoirement** puis **chasse le joueur** à vue. On crée une **Task** (bouton *New Task*) qui commence par écouter l'exécution (**Event Receive Execute AI**) et se termine toujours par un **Finish Execute**. La tâche **GetRandomLocation** récupère la position de l'IA et choisit un **point aléatoire sur le NavMesh dans un rayon de 1500** (GetRandomLocationInNavigableRadius), via une variable **publique** de type **BlackboardKeySelector** (nommée BBKey) qui pointe vers une clé du Blackboard. Le vecteur obtenu est stocké dans une clé **Vector** du Blackboard (ex : **targetLocation**). Dans le BT, la séquence **PATROL** enchaîne **GetRandomLocation → MoveTo → Wait** (nœuds déjà fournis) ; avec une seule clé, le BT alimente automatiquement GetRandomLocation et **MoveTo** avec targetLocation. Pour la **chasse**, on ajoute une séquence **Chase** (GetPlayerLocation + MoveTo/ChasePlayer, variable targetFoundLocation). Le choix d'état se fait avec une clé booléenne **playerInFOV** et un **décorateur Blackboard** sur chaque séquence, mis à jour par l'événement On Target Perception Updated. Réglages fins : **Observer Aborts = Both**, un **Cooldown à 0,2 s** contre le tremblement, et un lissage de rotation (décocher *Use Controller Rotation Yaw*, activer *Orient Rotation to Movement* dans le Character Movement).",
        "keypoints": [
          "**Task** : Event Receive Execute AI → **Finish Execute**",
          "**GetRandomLocation** : point NavMesh (rayon 1500) → clé Vector",
          "Séquence **PATROL** : GetRandomLocation → MoveTo → Wait",
          "État via clé **playerInFOV** + décorateur ; Observer Aborts Both"
        ],
        "versionNote": "",
        "tier": 2,
        "front": "TP : NPC qui patrouille puis chasse le joueur"
      }
    ],
    "quiz": [
      {
        "q": "Quelle affirmation résume le mieux la philosophie de l'IA de jeu vidéo présentée dans le cours ?",
        "choices": [
          "L'IA doit être la plus performante possible pour toujours battre le joueur",
          "Une bonne IA reste invisible et donne l'illusion d'intelligence au jeu",
          "L'IA doit rester strictement identique d'un jeu à l'autre pour être fiable",
          "Tricher est totalement proscrit ; l'IA doit jouer de façon équitable"
        ],
        "answer": 1,
        "explain": "Le cours insiste : le but est l'illusion d'intelligence, l'IA est au service du jeu, tricher est envisageable, et une bonne IA est celle que l'on ne voit pas. Une IA ultra-performante ne fait pas forcément un bon jeu.",
        "difficulty": "facile",
        "topic": "Philosophie de l'IA de jeu",
        "def": {
          "term": "Illusion d'intelligence",
          "text": "But de l'IA de jeu : donner au joueur l'impression d'un comportement intelligent, sans simuler une vraie intelligence. L'IA reste au service du jeu."
        }
      },
      {
        "q": "Un agent intelligent est une entité autonome dotée de trois systèmes. Lesquels ?",
        "choices": [
          "Un système de rendu, un système d'input et un système de sauvegarde",
          "Un système de senseurs, un système décisionnel et des actions",
          "Un système de collision, un système d'animation et un système audio",
          "Un système de scoring, un système de niveaux et un système de dialogue"
        ],
        "answer": 1,
        "explain": "Un agent possède un système de senseurs (perception), un système décisionnel (choix des actions) et des actions à effectuer. Il a toujours des inputs (données, événements) et des outputs (actions, ordres).",
        "difficulty": "facile",
        "topic": "Agent intelligent",
        "def": {
          "term": "Agent intelligent",
          "text": "Entité autonome dotée de senseurs, d'un système décisionnel et d'actions. Elle reçoit des inputs (données, événements) et produit des outputs."
        }
      },
      {
        "q": "Quels sont les grands domaines de l'IA de jeu cités dans le cours ?",
        "choices": [
          "Compilation, sérialisation, streaming, éclairage et compression audio",
          "Déplacement, perception, décision, planification, apprentissage",
          "Rendu, physique, animation, streaming et synchronisation",
          "Collision, pathfinding, interface, scoring et diffusion"
        ],
        "answer": 1,
        "explain": "Les domaines interconnectés de l'IA sont le déplacement/la navigation (niveau le plus bas), la perception, la décision, la planification de tâches/stratégies et l'apprentissage.",
        "difficulty": "moyen",
        "topic": "Domaines de l'IA",
        "def": {
          "term": "Domaines de l'IA",
          "text": "Cinq niveaux d'abstraction interconnectés : déplacement/navigation, perception, décision, planification de tâches et apprentissage."
        }
      },
      {
        "q": "Dans Unreal Engine, quel composant natif gère le déplacement individuel d'un Character (équivalent du Character Controller d'Unity) ?",
        "choices": [
          "Nav Mesh Bounds Volume",
          "Character Movement",
          "AIPerception Component",
          "Detour Crowd Manager"
        ],
        "answer": 1,
        "explain": "Le déplacement individuel (synchronisation animation/mouvement, accélération, vitesse max, vitesse angulaire, steering) est natif dans Unreal via le component Character Movement ; l'équivalent Unity est le Character Controller.",
        "difficulty": "moyen",
        "topic": "Déplacement et navigation",
        "def": {
          "term": "Character Movement Component",
          "text": "Composant natif d'Unreal gérant le déplacement d'un Character (marche, saut, accélération, vitesse, rotation). Équivalent du Character Controller d'Unity."
        }
      },
      {
        "q": "Comment est constitué un NavMesh (maillage de navigation) dans un moteur moderne ?",
        "choices": [
          "De sphères de collision réparties autour de chaque acteur mobile",
          "De points de passage placés un à un manuellement par le concepteur",
          "De polygones convexes générés à partir des meshes de collision",
          "De cellules d'une grille régulière calquée sur la minimap du niveau"
        ],
        "answer": 2,
        "explain": "Le NavMesh est une structure précalculée composée de polygones convexes (souvent des triangles) générés à partir des meshes de collision. On peut en générer plusieurs selon les contraintes des agents et moduler le coût par zone.",
        "difficulty": "moyen",
        "topic": "NavMesh et pathfinding (A*, Dijkstra)",
        "def": {
          "term": "NavMesh (maillage de navigation)",
          "text": "Structure précalculée de polygones convexes (souvent des triangles) générés depuis les meshes de collision, servant au pathfinding."
        }
      },
      {
        "q": "Quelle est la différence principale entre l'algorithme A* et l'algorithme de Dijkstra pour le pathfinding ?",
        "choices": [
          "A* ajoute une heuristique pour estimer le coût restant d'un nœud",
          "A* explore les nœuds sans jamais tenir compte des distances",
          "Dijkstra ne peut fonctionner que sur un NavMesh entièrement triangulé",
          "A* garantit un chemin plus long mais calculé beaucoup plus vite"
        ],
        "answer": 0,
        "explain": "A* fonctionne comme Dijkstra mais ajoute une heuristique (une distance, ou une distance modifiée par le type de sol) pour orienter la recherche vers l'arrivée et estimer le score d'un nœud.",
        "difficulty": "moyen",
        "topic": "NavMesh et pathfinding (A*, Dijkstra)",
        "def": {
          "term": "Heuristique (A*)",
          "text": "Estimation du coût restant jusqu'à l'arrivée (souvent une distance). A* l'ajoute à Dijkstra pour orienter la recherche vers le but plus vite."
        }
      },
      {
        "q": "Selon le cours, comment est généralement gérée la vue (vision) d'un agent ?",
        "choices": [
          "Par une détection de collision directement sur le corps de l'agent",
          "Via des cônes de visibilité définis par une distance et un angle",
          "Par un trigger de zone circulaire avec atténuation par la distance",
          "Par une trace verticale projetée depuis le sol sous la cible visée"
        ],
        "answer": 1,
        "explain": "La vue se gère via des cônes de visibilité (distance + angle). Le toucher se gère par détection de collision, et l'ouïe/l'odorat par un trigger de zone avec atténuation.",
        "difficulty": "facile",
        "topic": "Perception (sens, cônes de vision)",
        "def": {
          "term": "Cône de vision",
          "text": "Modélisation de la vue d'un agent par un cône défini par une distance et un angle ; la cible n'est vue que si elle s'y trouve."
        }
      },
      {
        "q": "Les données internes d'un agent (santé, énergie, vitesse, états) lui sont en principe accessibles directement via :",
        "choices": [
          "Le NavMesh et le système EQS de requêtes",
          "Le Detour Crowd Manager de la navigation",
          "Le Character ou le PlayerState de l'agent",
          "Un fichier de configuration externe au moteur"
        ],
        "answer": 2,
        "explain": "Les données internes sont accessibles directement via le Character ou le PlayerState. Les données externes proviennent du système de perception ou d'autres agents (systèmes multi-agents).",
        "difficulty": "moyen",
        "topic": "IA décisionnelle et techniques",
        "def": {
          "term": "Données internes (agent)",
          "text": "État propre à l'agent (santé, énergie, vitesse, états, inventaire), accessible directement via son Character ou son PlayerState."
        }
      },
      {
        "q": "Quelle est une limitation majeure des Finite State Machines (FSM) selon le cours ?",
        "choices": [
          "Toutes les transitions doivent être prévues, d'où une maintenance lourde",
          "Elles ne peuvent gérer qu'un seul et unique état durant toute la partie",
          "Elles imposent obligatoirement un NavMesh valide pour pouvoir fonctionner",
          "Elles restent impossibles à implémenter sans un langage bas niveau"
        ],
        "answer": 0,
        "explain": "La FSM est simple et intuitive, mais elle impose de prévoir toutes les transitions de chaque état pour ne pas rester bloqué ; plus il y a d'états, plus les conditions de transition et la maintenance se complexifient.",
        "difficulty": "moyen",
        "topic": "FSM",
        "def": {
          "term": "FSM (machine à états finis)",
          "text": "Système décisionnel à états logiques reliés par des transitions. Simple et éprouvé, mais toutes les transitions doivent être prévues à l'avance."
        }
      },
      {
        "q": "Dans un Decision Tree, que représentent les nœuds terminaux (feuilles) ?",
        "choices": [
          "Les actions concrètes à exécuter par l'agent",
          "Les points de décision intermédiaires du parcours",
          "Le nœud racine, point de départ de l'arbre",
          "Les transitions logiques entre deux états"
        ],
        "answer": 0,
        "explain": "Dans un Decision Tree, chaque nœud est un point de décision, la racine est la décision initiale et les feuilles (nœuds terminaux) sont les actions à effectuer.",
        "difficulty": "facile",
        "topic": "Decision Tree",
        "def": {
          "term": "Feuille (Decision Tree)",
          "text": "Nœud terminal d'un arbre de décision : il ne contient pas de sous-décision mais l'action concrète à exécuter une fois la branche parcourue."
        }
      },
      {
        "q": "Lorsqu'un node d'un Behavior Tree est évalué, quelles valeurs peut-il renvoyer ?",
        "choices": [
          "Seulement 0 ou 1, jamais de valeur intermédiaire possible",
          "Succès (true), échec (false) ou en cours (in progress)",
          "Un vecteur de position ou une valeur numérique brute",
          "Uniquement vrai ou faux, sans aucun état intermédiaire"
        ],
        "answer": 1,
        "explain": "Un node de BT renvoie true (évaluation réussie), false (échouée) ou in progress (inachevée). C'est ce dernier état qui permet à un node de rester actif pendant plusieurs frames.",
        "difficulty": "moyen",
        "topic": "Behavior Tree",
        "def": {
          "term": "Valeurs de retour (node BT)",
          "text": "Un node de Behavior Tree renvoie true (réussite), false (échec) ou in progress ; ce dernier lui permet de rester actif plusieurs frames."
        }
      },
      {
        "q": "Comment un Behavior Tree est-il parcouru dans Unreal ?",
        "choices": [
          "Depuis le root, à chaque update, de la gauche vers la droite",
          "Depuis les feuilles vers le root, une seule fois au lancement",
          "De la droite vers la gauche, seulement lors d'un événement",
          "Dans un ordre aléatoire redéfini à chacune des frames"
        ],
        "answer": 0,
        "explain": "L'arbre est exécuté depuis le root à chaque update, toujours de gauche à droite. Cela évite de rester bloqué sur une tâche et maintient l'arbre à jour ; un node peut néanmoins durer plusieurs frames.",
        "difficulty": "moyen",
        "topic": "Behavior Tree",
        "def": {
          "term": "Parcours du Behavior Tree",
          "text": "L'arbre est réévalué depuis le root à chaque update, toujours de gauche à droite ; cela évite les blocages et garde l'IA à jour."
        }
      },
      {
        "q": "Comment se comporte un node composite Sequence dans Unreal ?",
        "choices": [
          "Il enchaîne ses enfants de gauche à droite et échoue au premier échec",
          "Il s'arrête et se termine en réussite dès qu'un de ses enfants réussit",
          "Il exécute un unique enfant, choisi aléatoirement à chaque passage",
          "Il parcourt tous ses enfants de la droite vers la gauche sans ordre"
        ],
        "answer": 0,
        "explain": "Le Sequence exécute ses enfants de gauche à droite et s'arrête au premier échec (la séquence échoue alors). Si tous les enfants réussissent, la séquence réussit. Utile pour un ordre précis d'actions.",
        "difficulty": "moyen",
        "topic": "Composites (Sequence, Selector)",
        "def": {
          "term": "Sequence (composite BT)",
          "text": "Composite qui exécute ses enfants de gauche à droite et s'arrête au premier échec. Réussit seulement si tous les enfants réussissent."
        }
      },
      {
        "q": "Comment se comporte un node composite Selector dans Unreal ?",
        "choices": [
          "Il lit ses enfants de gauche à droite et réussit au premier succès",
          "Il ne se termine en réussite que si absolument tous ses enfants réussissent",
          "Il exécute tous ses enfants simultanément, sans jamais s'arrêter",
          "Il ne peut posséder aucun node enfant sous sa branche parente"
        ],
        "answer": 0,
        "explain": "Le Selector exécute ses enfants de gauche à droite et s'arrête au premier succès (le sélecteur réussit alors). Si tous échouent, le sélecteur échoue. Le cours le décrit comme une sorte de switch/case.",
        "difficulty": "moyen",
        "topic": "Composites (Sequence, Selector)",
        "def": {
          "term": "Selector (composite BT)",
          "text": "Composite qui exécute ses enfants de gauche à droite et s'arrête au premier succès. Échoue seulement si tous les enfants échouent."
        }
      },
      {
        "q": "Quelle affirmation est vraie à propos du node Root d'un Behavior Tree dans Unreal ?",
        "choices": [
          "Il peut posséder plusieurs connexions de sortie vers ses différents enfants",
          "Il est unique, n'a qu'une connexion et refuse décorateurs et services",
          "Il correspond directement à une action concrète que l'IA effectue",
          "Il peut recevoir un node parent situé juste au-dessus de lui"
        ],
        "answer": 1,
        "explain": "Le Root est unique, constitue le point de départ, n'a qu'une seule connexion (un seul enfant) et ne peut pas recevoir de décorateurs ni de services.",
        "difficulty": "moyen",
        "topic": "Behavior Tree",
        "def": {
          "term": "Root (Behavior Tree)",
          "text": "Nœud racine unique et point de départ de l'arbre. Il n'a qu'une seule connexion enfant et n'accepte ni décorateur ni service."
        }
      },
      {
        "q": "Que sont les nodes Task dans un Behavior Tree Unreal ?",
        "choices": [
          "Les nœuds racines uniques situés tout en haut de l'arbre",
          "Des conditions logiques attachées aux nœuds composites",
          "Les feuilles de l'arbre qui agissent, sans connexion de sortie",
          "Des services périodiques qui se rattachent en continu au Blackboard"
        ],
        "answer": 2,
        "explain": "Les Task sont les feuilles de l'arbre, les nœuds qui réalisent des actions (MoveTo, Wait, etc.) et n'ont pas de connexion de sortie.",
        "difficulty": "facile",
        "topic": "AI MoveTo et mise en place TP",
        "def": {
          "term": "Task (Behavior Tree)",
          "text": "Feuille du Behavior Tree : nœud qui exécute une action concrète (MoveTo, Wait...) et ne possède pas de connexion de sortie."
        }
      },
      {
        "q": "Un Decorator conditionnel d'un Behavior Tree possède la propriété 'Observer Aborts'. Quelles sont ses valeurs possibles ?",
        "choices": [
          "Success, Failure, Running, Aborted",
          "None, Self, Lower Priority, Both",
          "Start, Stop, Pause, Resume, Reset",
          "Sight, Hearing, Touch, Damage, Smell"
        ],
        "answer": 1,
        "explain": "Observer Aborts prend les valeurs None, Self, Lower Priority et Both. Un observer surveille une valeur du Blackboard et peut interrompre la branche courante (Self), les branches de priorité inférieure (Lower Priority) ou les deux (Both).",
        "difficulty": "difficile",
        "topic": "Decorators et Observer Aborts",
        "def": {
          "term": "Observer Aborts",
          "text": "Propriété d'un décorateur : surveille une clé du Blackboard et interrompt l'exécution. Valeurs : None, Self, Lower Priority, Both."
        }
      },
      {
        "q": "À quoi servent les Services dans un Behavior Tree Unreal ?",
        "choices": [
          "Attachés aux composites, ils tournent à une fréquence et actualisent le Blackboard",
          "Ils constituent les feuilles et déclenchent toutes les actions finales de la branche",
          "Ils remplacent totalement le NavMesh pour la navigation des agents IA",
          "Ils pilotent le rendu et l'animation du personnage contrôlé par l'IA"
        ],
        "answer": 0,
        "explain": "Les Services s'attachent aux nœuds composites et s'exécutent à leur fréquence définie tant que leur branche est exécutée. On les utilise souvent pour effectuer des vérifications et mettre à jour le Blackboard.",
        "difficulty": "moyen",
        "topic": "Services",
        "def": {
          "term": "Service (Behavior Tree)",
          "text": "Nœud attaché à un composite qui s'exécute à une fréquence définie tant que sa branche est active, souvent pour actualiser le Blackboard."
        }
      },
      {
        "q": "Qu'est-ce que le Blackboard dans le système d'IA d'Unreal ?",
        "choices": [
          "Le composant qui gère le rendu graphique du personnage IA contrôlé",
          "La mémoire de l'IA : il stocke les clés lues par le Behavior Tree",
          "Le volume délimitant la zone de navigation des agents mobiles",
          "Un algorithme de recherche du plus court chemin sur le mesh"
        ],
        "answer": 1,
        "explain": "Le Blackboard est la mémoire de l'IA : il stocke des keys, sert de point d'accès unique aux inputs du BT et évite les références multiples. Plusieurs agents peuvent partager un Blackboard pour communiquer.",
        "difficulty": "facile",
        "topic": "Blackboard",
        "def": {
          "term": "Blackboard",
          "text": "Mémoire de l'IA : stocke les clés (keys) exploitées par le Behavior Tree. Point d'accès unique aux données, partageable entre agents."
        }
      },
      {
        "q": "Où le Behavior Tree est-il géré et avec quel nœud est-il lancé ?",
        "choices": [
          "Dans le Character, lancé par le nœud Spawn Actor",
          "Dans l'AI Controller, via le nœud Run Behavior Tree",
          "Dans le Game Mode, via l'événement Begin Play du niveau",
          "Dans le Blackboard, via le nœud Set Blackboard Value"
        ],
        "answer": 1,
        "explain": "Le BT est géré au niveau du controller : l'AI Controller (affecté au Character via AI Controller Class, catégorie Pawn) prend possession du Pawn et lance l'arbre avec le nœud Run Behavior Tree.",
        "difficulty": "moyen",
        "topic": "AI Controller et Run Behavior Tree",
        "def": {
          "term": "Run Behavior Tree",
          "text": "Nœud utilisé dans l'AI Controller pour démarrer un Behavior Tree ; l'AIController possède le Pawn puis joue l'arbre en continu."
        }
      },
      {
        "q": "Pour qu'un personnage joueur soit détectable par une IA équipée d'un AIPerception Component, que faut-il faire ?",
        "choices": [
          "Lui ajouter un second Behavior Tree dédié à la détection",
          "Lui ajouter un AIPerceptionStimuliSource enregistré pour ces sens",
          "Lui ajouter un Nav Mesh Bounds Volume autour de son corps",
          "Lui ajouter un composant Character Movement entièrement dédié à ça"
        ],
        "answer": 1,
        "explain": "Le AIPerception Component (sens Sight, Hearing, Touch, Damage) se place sur l'AI Controller ; l'acteur cible doit porter un AIPerceptionStimuliSource enregistré comme source pour les sens voulus. La détection se traite via l'événement On Target Perception Updated.",
        "difficulty": "moyen",
        "topic": "AI Perception et Stimuli Source",
        "def": {
          "term": "AIPerceptionStimuliSource",
          "text": "Composant à ajouter sur un acteur pour le rendre détectable ; on l'enregistre comme source pour les sens voulus (Register as Source for Senses)."
        }
      },
      {
        "q": "Dans Unreal, quel volume délimite la zone navigable par l'IA, et quelle touche l'affiche en vert ?",
        "choices": [
          "Un Trigger Box de zone, touche T",
          "Un Nav Mesh Bounds Volume, touche P",
          "Un Post Process Volume global, touche V",
          "Un Blocking Volume statique, touche B"
        ],
        "answer": 1,
        "explain": "On ajoute un Nav Mesh Bounds Volume à la scène pour définir la zone navigable ; la touche P (ou Show > Navigation) affiche les zones navigables en vert.",
        "difficulty": "facile",
        "topic": "Nav Mesh Bounds Volume",
        "def": {
          "term": "Nav Mesh Bounds Volume",
          "text": "Volume placé dans la scène pour délimiter la zone navigable par l'IA. La touche P (ou Show > Navigation) affiche le NavMesh en vert."
        }
      },
      {
        "q": "À quoi sert l'Environment Query System (EQS) dans Unreal Engine ?",
        "choices": [
          "À compiler et optimiser tous les shaders utilisés dans le niveau",
          "À interroger l'environnement pour renvoyer le meilleur élément",
          "À animer le squelette et le mesh du personnage contrôlé",
          "À stocker et lire les clés booléennes du Blackboard IA"
        ],
        "answer": 1,
        "explain": "L'EQS collecte des données sur l'environnement, les évalue via des tests et renvoie l'élément le mieux noté. Exemples : trouver la cachette la plus sûre, le power-up le plus proche ou l'ennemi le plus menaçant.",
        "difficulty": "moyen",
        "topic": "EQS",
        "def": {
          "term": "EQS (Environment Query System)",
          "text": "Système qui interroge l'environnement via des tests et renvoie l'élément le mieux noté (cachette, power-up proche, menace la plus forte...)."
        }
      },
      {
        "q": "Quel système gère l'évitement dynamique entre plusieurs agents en foule à l'aide d'un échantillonnage RVO adaptatif ?",
        "choices": [
          "Le Nav Mesh Bounds Volume délimitant la scène navigable",
          "Le Detour Crowd Manager (DetourCrowdAIController)",
          "L'AIPerception Component attaché à l'AI Controller",
          "Le composite Simple Parallel du Behavior Tree"
        ],
        "answer": 1,
        "explain": "Unreal propose deux méthodes d'évitement : RVO (Reciprocal Velocity Obstacles) et le Detour Crowd Manager, qui utilise un échantillonnage RVO adaptatif avec biais vers la direction de l'agent ; il est inclus dans la classe DetourCrowd AI Controller.",
        "difficulty": "difficile",
        "topic": "Detour Crowd",
        "def": {
          "term": "Detour Crowd Manager",
          "text": "Système d'évitement entre agents par échantillonnage RVO adaptatif, inclus dans la classe DetourCrowdAIController. Alternative : RVO simple."
        }
      },
      {
        "q": "Quel élément permet de connecter des sections de NavMesh qui ne sont PAS reliées automatiquement (corniches, ascenseurs, sauts) ?",
        "choices": [
          "Le NavLink Proxy de navigation",
          "Le Detour Crowd Manager d'évitement",
          "Le Blackboard partagé des agents",
          "Le décorateur Cooldown du BT"
        ],
        "answer": 0,
        "explain": "Le NavLink Proxy connecte des sections de NavMesh non reliées automatiquement (corniches, ascenseurs) et peut déclencher des comportements via des smart links. À ne pas confondre avec les NavMesh Invokers, qui ne construisent la navigation qu'autour d'acteurs marqués (grands environnements).",
        "difficulty": "moyen",
        "topic": "NavMesh Invokers et NavLink Proxy",
        "def": {
          "term": "NavLink Proxy",
          "text": "Acteur reliant des sections de NavMesh non connectées automatiquement (corniches, ascenseurs, sauts) ; peut déclencher des smart links."
        }
      },
      {
        "q": "Dans le TP de patrouille, la tâche GetRandomLocation choisit un point aléatoire sur le NavMesh dans un rayon de 1500 autour de l'IA. Où ce résultat est-il stocké et via quel type de variable ?",
        "choices": [
          "Dans un fichier texte externe, via une variable string",
          "Dans le Game Instance global du jeu, via une variable de type int",
          "Dans une clé Vector du Blackboard, via un BlackboardKeySelector",
          "Dans le Nav Mesh Bounds Volume, via une variable booléenne"
        ],
        "answer": 2,
        "explain": "La tâche démarre par Event Receive Execute AI, choisit un point aléatoire sur le NavMesh (rayon 1500) et stocke ce Vector dans une clé du Blackboard (targetLocation) via une variable publique BlackboardKeySelector, avant Finish Execute. La séquence PATROL enchaîne ensuite GetRandomLocation, MoveTo et Wait.",
        "difficulty": "moyen",
        "topic": "AI MoveTo et mise en place TP",
        "def": {
          "term": "BlackboardKeySelector",
          "text": "Variable publique d'une Task qui pointe vers une clé du Blackboard (ici une clé Vector, targetLocation) où stocker le résultat calculé."
        }
      }
    ],
    "sources": [
      {
        "label": "Behavior Tree in Unreal Engine - Overview (dev.epicgames.com)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/behavior-tree-in-unreal-engine---overview"
      },
      {
        "label": "AI Perception in Unreal Engine (dev.epicgames.com)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/ai-perception-in-unreal-engine"
      },
      {
        "label": "Basic Navigation in Unreal Engine (dev.epicgames.com)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/basic-navigation-in-unreal-engine"
      },
      {
        "label": "Using Avoidance With the Navigation System - Detour Crowd / RVO (dev.epicgames.com)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/using-avoidance-with-the-navigation-system-in-unreal-engine"
      },
      {
        "label": "Overview of how to modify the Navigation Mesh - Invokers, NavLink (dev.epicgames.com)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/overview-of-how-to-modify-the-navigation-mesh-in-unreal-engine"
      }
    ],
    "images": [
      {
        "url": "https://img.youtube.com/vi/QJuaB2V79mU/hqdefault.jpg",
        "caption": "Behavior Tree simple dans UE5 (Blackboard, taches, selecteurs)",
        "credit": "Gorka Games - YouTube",
        "link": "https://www.youtube.com/watch?v=QJuaB2V79mU"
      },
      {
        "url": "https://upload.wikimedia.org/wikipedia/commons/f/f4/Pathfinding_A_Star.svg",
        "caption": "Schema de l'algorithme A* - base du pathfinding utilise par le NavMesh",
        "credit": "Dbenzhuser, Wikimedia Commons (CC BY-SA 3.0)",
        "link": "https://commons.wikimedia.org/wiki/File:Pathfinding_A_Star.svg"
      }
    ],
    "links": [
      {
        "label": "Doc officielle UE - Behavior Tree Quick Start (AI Controller, Blackboard, NavMesh)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/behavior-tree-in-unreal-engine---quick-start-guide",
        "kind": "doc"
      },
      {
        "label": "Doc officielle UE - AI Perception (vue, ouie, sens de l'IA)",
        "url": "https://dev.epicgames.com/documentation/en-us/unreal-engine/ai-perception-in-unreal-engine",
        "kind": "doc"
      },
      {
        "label": "Unreal Community Wiki - Blueprint Behavior Tree Tutorial (NavMesh + taches)",
        "url": "https://unrealcommunity.wiki/blueprint-behavior-tree-tutorial-5hggclgn",
        "kind": "wiki"
      },
      {
        "label": "YouTube - GameDevRaw : Behavior Tree & Blackboard (IA, UE5)",
        "url": "https://www.youtube.com/watch?v=CFVRex_aDTg",
        "kind": "youtube"
      }
    ]
  }
]
