// Glossaire des termes "complexes" d'UE5, expliqués en langage SIMPLE (débutant).
// Une définition ne s'affiche QUE si son terme apparaît (mot entier) dans la
// question/les choix — sinon rien. Volontairement resserré aux termes qui comptent.

export const GLOSSARY = [
  // --- Éditeur & base moteur ---
  { term: 'Actor', aliases: ['actor', 'actors'], def: "Tout objet qu'on place dans un niveau (un mur, une lumière, un personnage). C'est l'équivalent du « GameObject » de Unity." },
  { term: 'Pawn', aliases: ['pawn'], def: "Un Actor qui peut être « piloté » par un joueur ou par une IA (typiquement le corps du personnage)." },
  { term: 'Character', aliases: ['character'], def: "Un Pawn tout équipé pour un personnage qui marche : il a déjà une capsule de collision et de quoi marcher, courir et sauter." },
  { term: 'Controller', aliases: ['playercontroller', 'aicontroller', 'contrôleur'], def: "Le « pilote » qui commande un Pawn. Le PlayerController lit les touches du joueur ; l'AIController fait réfléchir une IA." },
  { term: 'GameMode', aliases: ['gamemode', 'game mode'], def: "Le « règlement » de la partie : quels personnages utiliser, comment on gagne ou on perd." },
  { term: 'GameInstance', aliases: ['gameinstance', 'game instance'], def: "Une mémoire qui reste vivante toute la session, même quand on change de niveau. Pratique pour garder un score entre les niveaux." },
  { term: 'Nanite', aliases: ['nanite'], def: "La techno d'UE5 qui affiche des décors ultra-détaillés (des millions de facettes) sans ramer. Réservée aux objets qui ne se déforment pas (décors)." },
  { term: 'Lumen', aliases: ['lumen'], def: "L'éclairage d'UE5 qui calcule la lumière et les reflets en temps réel : quand tu bouges une lampe, tout s'adapte instantanément." },
  { term: 'Viewport', aliases: ['viewport'], def: "La fenêtre 3D où tu vois ton niveau et où tu déplaces les objets dans l'éditeur." },
  { term: 'Outliner', aliases: ['outliner'], def: "La liste, à droite de l'éditeur, de tous les objets présents dans ton niveau." },
  { term: 'Content Browser', aliases: ['content browser', 'content drawer'], def: "L'explorateur de fichiers de ton projet : tous tes assets (meshes, matériaux, Blueprints, sons) sont rangés là." },

  // --- Blueprint : cœur ---
  { term: 'Macro', aliases: ['macro', 'macros'], def: "Un raccourci qui regroupe plusieurs nœuds pour les réutiliser. Contrairement à une fonction, son contenu est recopié partout où on l'utilise, et elle accepte les nœuds à délai (Delay)." },
  { term: 'Real (le type Float)', aliases: ['real', 'double précision'], def: "Depuis UE5, un nombre à virgule (« Float ») est en fait stocké de façon plus précise (un « double », appelé Real). C'est automatique et ça évite les imprécisions dans les très grands niveaux." },
  { term: 'Cast (Cast To)', aliases: ['cast', 'cast to', 'caster'], def: "Une vérification : « cet objet est-il bien de tel type ? » (ex. « est-ce mon Personnage ? »). Si oui, on peut accéder à ses variables et fonctions ; si non, ça échoue sans planter." },
  { term: 'Blueprint Interface', aliases: ['blueprint interface', 'interface'], def: "Une liste de fonctions qu'un objet « promet » de savoir faire, sans dire comment. Ça permet à deux Blueprints de se parler sans avoir besoin de se connaître précisément." },
  { term: 'Event Dispatcher', aliases: ['event dispatcher', 'dispatcher', 'delegate', 'délégué', 'broadcast'], def: "Un « haut-parleur » : un Blueprint annonce qu'il s'est passé quelque chose (Call), et tous ceux qui « écoutent » (Bind) réagissent. L'émetteur n'a pas besoin de savoir qui l'écoute." },
  { term: 'Fonction pure / impure', aliases: ['pure', 'impure', 'fonction pure'], def: "Une fonction « pure » (verte, sans fil blanc) ne fait que LIRE une valeur, sans rien changer. Une « impure » (avec fil blanc) peut MODIFIER l'état du jeu." },
  { term: 'Construction Script', aliases: ['construction script'], def: "Un graphe qui s'exécute dans l'éditeur, AVANT de jouer, à chaque fois que tu modifies le Blueprint. Sert à préparer/prévisualiser l'objet." },
  { term: 'Branch', aliases: ['branch'], def: "Le nœud « si… alors… sinon » : selon qu'une condition est vraie ou fausse, il envoie le flux d'un côté ou de l'autre." },
  { term: 'Broches (pins)', aliases: ['broche', 'broches', 'pin', 'pins'], def: "Les points de connexion d'un nœud : les blanches (triangles) transportent le « flux » d'exécution, les colorées transportent des valeurs (leur couleur dit le type)." },
  { term: 'Timer', aliases: ['timer', 'timers'], def: "Un minuteur : il déclenche une action après un délai, ou de façon répétée, SANS avoir à surveiller chaque frame (plus léger que l'Event Tick)." },
  { term: 'Event Tick', aliases: ['event tick', 'tick'], def: "Un événement qui se répète à CHAQUE image du jeu (60 fois/seconde). Très pratique mais coûteux : à éviter quand un événement ponctuel suffit." },
  { term: 'Custom Event', aliases: ['custom event', 'custom events'], def: "Un événement que TU crées et que tu peux appeler par son nom depuis ailleurs, pour organiser ou déclencher ta logique." },

  // --- Events & input ---
  { term: 'Enhanced Input', aliases: ['enhanced input'], def: "Le système de contrôles d'UE5 (par défaut depuis la 5.1). On crée des « Input Actions » (Sauter, Tirer) qu'on relie aux touches via un « Mapping Context » ; plus souple que l'ancien système." },
  { term: 'Input Action', aliases: ['input action', 'input actions'], def: "Une intention de jeu (« Sauter », « Tirer ») détachée de la touche : on décide plus tard quelle touche la déclenche." },
  { term: 'Input Mapping Context', aliases: ['input mapping context', 'mapping context'], def: "Le tableau qui associe les touches aux Input Actions. On peut l'activer/désactiver selon la situation (à pied, en voiture, dans un menu)." },
  { term: 'Overlap', aliases: ['overlap', 'overlaps'], def: "Quand deux zones de collision se traversent (ex. le joueur entre dans un déclencheur). Il faut cocher « Generate Overlap Events » sur les DEUX objets." },

  // --- Widgets / UMG ---
  { term: 'UMG', aliases: ['umg'], def: "L'outil d'Unreal pour créer les interfaces (menus, barre de vie, HUD). On construit des « Widgets »." },
  { term: 'Canvas Panel', aliases: ['canvas panel', 'canvas'], def: "Le conteneur d'interface où tu poses tes éléments (boutons, textes) exactement où tu veux sur l'écran. C'est le seul qui utilise les « ancres »." },
  { term: 'Ancres (Anchors)', aliases: ['ancre', 'ancres', 'anchor', 'anchors'], def: "Le point de l'écran auquel un élément d'interface est « accroché » (ex. le coin haut-gauche). Grâce à ça, ton HUD reste bien placé sur toutes les tailles d'écran." },
  { term: 'DPI Scaling', aliases: ['dpi scaling', 'dpi'], def: "La mise à l'échelle automatique de l'interface selon la résolution de l'écran, pour qu'elle ne soit ni minuscule ni géante." },
  { term: 'Property Binding', aliases: ['property binding', 'binding', 'bindings'], def: "Relier un élément d'UI directement à une fonction qui est recalculée À CHAQUE IMAGE. Pratique mais coûteux : mieux vaut mettre à jour l'UI seulement quand la valeur change." },
  { term: 'Widget Component', aliases: ['widget component'], def: "Un composant qui affiche une interface DANS le monde 3D (ex. l'écran d'un ordinateur en jeu, une barre de vie au-dessus d'un ennemi)." },
  { term: 'Z-order', aliases: ['z-order', 'z order'], def: "L'ordre d'empilement des éléments d'interface : plus le nombre est grand, plus l'élément passe DEVANT les autres." },

  // --- Mesh & animation ---
  { term: 'Static Mesh', aliases: ['static mesh'], def: "Un objet 3D rigide qui ne se déforme pas : murs, caisses, décors, accessoires." },
  { term: 'Skeletal Mesh', aliases: ['skeletal mesh'], def: "Un objet 3D qui se déforme grâce à un squelette d'os : les personnages et créatures." },
  { term: 'Skeleton (Squelette)', aliases: ['skeleton', 'squelette'], def: "L'ensemble des « os » d'un personnage. Quand un os bouge, la surface du modèle suit (c'est ce qui l'anime)." },
  { term: 'Animation Blueprint', aliases: ['animation blueprint', 'anim blueprint', 'animbp', 'anim graph'], def: "Le « cerveau » des animations d'un personnage : il choisit quelle animation jouer (marche, course, saut) selon l'état du jeu." },
  { term: 'State Machine', aliases: ['state machine'], def: "Un schéma d'états d'animation (Repos, Course, Saut…) reliés par des règles : « si la vitesse > 0, passer de Repos à Course »." },
  { term: 'Blend Space', aliases: ['blend space', 'blendspace'], def: "Un outil qui mélange doucement plusieurs animations selon une valeur (ex. entre marcher et courir selon la vitesse), sans à-coups." },
  { term: 'Anim Montage', aliases: ['anim montage', 'montage', 'montages'], def: "Une animation d'action ponctuelle (attaque, coup d'épée, sort) qu'on déclenche à la demande depuis un Blueprint." },
  { term: 'Anim Notify', aliases: ['anim notify', 'notify', 'notifies'], def: "Un repère posé sur une animation pour déclencher quelque chose au bon moment (ex. un bruit de pas, ou activer les dégâts d'une épée pile quand elle frappe)." },
  { term: 'Root Motion', aliases: ['root motion', 'root bone'], def: "Quand c'est l'ANIMATION elle-même qui déplace le personnage (mouvement réaliste, calé sur les pas), au lieu de le faire glisser par code." },
  { term: 'LOD', aliases: ['lod', 'lods'], def: "« Niveau de détail » : de loin, l'objet est affiché en version simplifiée (moins de facettes) pour gagner en performance. De près, il repasse en détaillé." },
  { term: 'Ragdoll', aliases: ['ragdoll'], def: "Le corps du personnage qui devient « chiffon » et s'effondre de façon réaliste, piloté par la physique (typiquement à la mort)." },
  { term: 'Socket', aliases: ['socket', 'sockets'], def: "Un point d'accroche posé sur un os (ex. la main) pour y attacher une arme, un accessoire ou un effet." },

  // --- Intelligence artificielle ---
  { term: 'Behavior Tree', aliases: ['behavior tree', 'behaviour tree'], def: "L'« arbre de décision » d'une IA : il enchaîne des actions (Tasks) selon des priorités et des conditions, pour décider quoi faire (patrouiller, poursuivre, attaquer)." },
  { term: 'Blackboard', aliases: ['blackboard'], def: "Le « bloc-notes » de l'IA : il stocke les infos utiles (la cible, l'endroit à rejoindre, a-t-elle vu le joueur ?) que le Behavior Tree lit et écrit." },
  { term: 'NavMesh', aliases: ['navmesh', 'nav mesh', 'navigation'], def: "La zone (surlignée en vert dans l'éditeur) où une IA a le droit de marcher. C'est là-dessus qu'elle calcule son chemin en évitant les obstacles." },
  { term: 'AI Perception', aliases: ['ai perception', 'perception'], def: "Ce qui donne des « sens » à une IA (vue, ouïe) pour qu'elle repère le joueur et réagisse." },
  { term: 'Selector', aliases: ['selector'], def: "Dans un Behavior Tree : essaie ses branches l'une après l'autre et s'arrête à la PREMIÈRE qui réussit (comme un « ou »)." },
  { term: 'Sequence', aliases: ['sequence'], def: "Dans un Behavior Tree : exécute ses branches DANS L'ORDRE et s'arrête dès qu'une échoue (comme un « et »)." },
  { term: 'Decorator', aliases: ['decorator', 'decorators', 'décorateur'], def: "Une condition posée sur une branche d'un Behavior Tree, qui autorise ou bloque son exécution (« seulement si l'IA voit le joueur »)." },
  { term: 'Service', aliases: ['service', 'services'], def: "Dans un Behavior Tree : une petite tâche qui tourne en fond, à intervalle régulier, tant que sa branche est active (ex. vérifier où est le joueur)." },
]

// Match "mot entier" insensible à la casse (évite que "Unreal" attrape "real").
const isWord = (c) => c != null && /[a-z0-9àâäçéèêëîïôöùûü]/i.test(c)
function containsWord(hay, needle) {
  let from = 0
  while (true) {
    const i = hay.indexOf(needle, from)
    if (i < 0) return false
    if (!isWord(hay[i - 1]) && !isWord(hay[i + needle.length])) return true
    from = i + 1
  }
}

// Renvoie jusqu'à `max` définitions dont un terme apparaît (mot entier) dans `text`.
export function matchGlossary(text, max = 2) {
  const low = ' ' + String(text || '').toLowerCase() + ' '
  const hits = []
  for (const g of GLOSSARY) {
    const keys = [g.term, ...(g.aliases || [])]
    if (keys.some((k) => containsWord(low, k.toLowerCase()))) hits.push(g)
  }
  hits.sort((a, b) => b.term.length - a.term.length)
  return hits.slice(0, max)
}
