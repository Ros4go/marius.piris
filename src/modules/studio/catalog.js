import { lazyPage } from '../../core/lazy.js'
import imgAvenueFrochot from '../../assets/projets/avenue-frochot.webp'
import imgEchoes from '../../assets/projets/echoes-of-above.webp'
import imgWorm from '../../assets/projets/worm-with-a-shotgun.webp'
import imgCastingScales from '../../assets/projets/casting-scales.webp'
import imgMythoLogie from '../../assets/projets/Mytho_Logie_Poster.webp'
import imgFromecoin from './jeux/frometons/Fromecoin.webp'
import imgNeuviemeVie from './jeux/neuvieme-vie/imageLogo/Cat.png'

// Chargés à la demande : ces deux modules pèsent l'essentiel du bundle,
// inutile de les télécharger pour afficher l'accueil ou le catalogue.
const FrometonsGame = lazyPage(() => import('./jeux/frometons/FrometonsGame.jsx'))
const Bootcamp = lazyPage(() => import('./outils/bootcamp/Bootcamp.jsx'))

// CATALOGUE DU STUDIO — source unique des jeux et outils (vignettes + routes).
// Chaque entrée a son dossier : jeux/<id>/ ou outils/<id>/ (sauf les jeux hébergés ailleurs).
//
// AJOUTER UN JEU OU UN OUTIL : une entrée ici suffit.
//   - cat: 'jeu' | 'outil'  (colonne d'affichage)
//   - page React interne -> { kind: 'route', path: '/studio/xxx', component }  (back: true = bouton Retour)
//   - page autonome      -> { kind: 'external', href: '/pages/xxx.html' }
//                           + une ligne dans STANDALONE (vite.config.js) pour servir son HTML
//   - lien externe       -> { kind: 'external', href: 'https://…' }
//   - image (import local ou URL) OU icon (emoji) pour la vignette
export const CATALOG = [
  // --- Jeux (du plus récent au plus ancien) ---
  {
    id: 'avenue-frochot',
    cat: 'jeu',
    title: '1 Avenue Frochot',
    tagline: "Aventure horrifique en FPS : une nuit dans un hôtel où tout le monde ment, mais chaque mensonge cache une part de vérité.",
    image: imgAvenueFrochot,
    kind: 'external',
    href: 'https://rosago.itch.io/1-avenue-frochot',
    tags: ['Horreur', 'Unity', 'Brackeys Jam'],
  },
  {
    id: 'echoes-of-above',
    cat: 'jeu',
    title: 'Echoes of Above',
    tagline: "Action-aventure sur Steam : frappe les projectiles ennemis en plein vol et renvoie-les dans un monde mythologique abandonné des dieux. Projet ISART Digital, en équipe de plus de 20.",
    image: imgEchoes,
    kind: 'external',
    href: 'https://store.steampowered.com/app/4196130/Echoes_of_Above/',
    tags: ['Action', 'Steam', 'ISART Digital'],
  },
  {
    id: 'worm-with-a-shotgun',
    cat: 'jeu',
    title: 'Worm With a Shotgun',
    tagline: "Action en jam de 3 jours : un ver armé d'un fusil à pompe défonce les bâtiments avant de manquer d'oxygène.",
    image: imgWorm,
    kind: 'external',
    href: 'https://komixa.itch.io/worm-with-a-shotgun',
    tags: ['Action', 'Unity', 'Gone Fishing Jam'],
  },
  {
    id: 'casting-scales',
    cat: 'jeu',
    title: 'Casting Scales',
    tagline: 'Rogue-lite musical : ton piano est ton grimoire et ta barre de vie, joue des gammes pour lancer des sorts.',
    image: imgCastingScales,
    kind: 'external',
    href: 'https://rosago.itch.io/casting-scales',
    tags: ['Rythme', 'Rogue-lite', 'Kenney Jam'],
  },
  {
    id: 'mytho-logie',
    cat: 'jeu',
    title: 'Mytho-Logie',
    tagline: "Détourne des affiches de propagande à coups de stickers, au cœur d'une guerre entre Apollon et Artémis.",
    image: imgMythoLogie,
    kind: 'external',
    href: 'https://camille-bonnus.itch.io/mytho-logie',
    tags: ['Simulation', 'Unity', 'itch.io'],
  },
  {
    id: 'frometons-clicker',
    cat: 'jeu',
    title: 'Frometons Clicker',
    tagline: 'Jeu incrémental : produis des frometons et gère un marché fromager.',
    image: imgFromecoin,
    fit: 'contain',
    kind: 'route',
    path: '/studio/frometons',
    component: FrometonsGame,
    back: true, // bouton « Retour » au-dessus du jeu
    tags: ['Idle', 'React', 'Web'],
  },
  {
    id: 'neuvieme-vie',
    cat: 'jeu',
    title: 'La Neuvième Vie',
    tagline: "Jeu d'aventure et de plateforme 2D, 100% JavaScript.",
    image: imgNeuviemeVie,
    fit: 'contain',
    kind: 'external',
    href: '/games/neuvieme-vie/index.html',
    tags: ['Plateforme', '2D', 'JavaScript'],
  },
  {
    id: 'pot-of-greed',
    cat: 'jeu',
    title: 'Pot Of Greed',
    tagline: "Rogue-lite 2D solo : combinaison procédurale d'objets et inventaire.",
    image: 'https://img.itch.zone/aW1hZ2UvMjc5MTY4OS8yMDY1ODI2NS5wbmc=/original/4xn%2Bh4.png',
    kind: 'external',
    href: 'https://shazalsadepts.itch.io/pot-of-greed',
    tags: ['Rogue-lite', 'Unity', 'itch.io'],
  },
  {
    id: 'super-sushi-speed',
    cat: 'jeu',
    title: 'Super Sushi Speed',
    tagline: 'Jeu de rythme : un sushi mutant dans des niveaux semi-procéduraux.',
    image: 'https://img.itch.zone/aW1hZ2UvMjUwMTAwNS8xNDg1NzU5MS5wbmc=/original/SxiYq9.png',
    kind: 'external',
    href: 'https://shazalsadepts.itch.io/super-sushi-speed',
    tags: ['Rythme', 'Godot', 'itch.io'],
  },
  {
    id: 'guitare',
    cat: 'outil',
    title: 'MarousFive',
    tagline: 'Manche & modes, accords + doigtés, jeu de notes et métronome.',
    icon: '🎸',
    kind: 'external',
    href: '/pages/guitare.html',
    tags: ['Guitare', 'Modes', 'Métronome'],
  },
  {
    id: 'bootcamp',
    cat: 'outil',
    title: 'Game Dev Bootcamp',
    tagline: 'Réviser le game dev par catégories : fiches mémo + quiz + examen blanc. UE5 Blueprint, data science, Python, CUDA.',
    icon: '🎓',
    kind: 'route',
    path: '/studio/bootcamp', // et ses sous-routes /studio/bootcamp/<catégorie>
    component: Bootcamp,
    tags: ['Révision', 'Quiz', 'UE5'],
  },
  {
    id: 'redac-emails',
    cat: 'outil',
    title: 'Premier jet',
    tagline: "Aide à la rédaction d'emails de candidature : stage, alternance ou poste.",
    icon: '✉️',
    kind: 'external',
    href: '/pages/generateur-emails.html',
    tags: ['Emails', 'Candidature', 'Rédaction'],
  },
]
