// Portfolio content. Asset URLs are relative ('/assets/...') so they follow the
// site wherever it is hosted. Project descriptions keep their original HTML markup.

export const bio = [
  `Je m'appelle Marius Piris, étudiant en 3ème année de Game Programming à Isart Digital Paris. Je suis passionné par le développement de jeux vidéo, la création et la conception. Je possède de solides compétences en programmation, notamment en <strong>C++, C, C#, Python et Java</strong>.`,
  `Mon expertise s'étend aux moteurs de jeu tels que <strong>Unreal Engine 5, Unity et Godot</strong>, où j'ai développé des mécaniques de jeu innovantes et optimisé les performances. J'ai également une bonne compréhension des <strong>bases de données</strong> et de la modélisation <strong>UML</strong>, ce qui me permet de concevoir des architectures logicielles robustes.`,
  `Mon parcours m'a permis d'explorer divers aspects du développement, de la <strong>génération procédurale</strong> à l'<strong>intelligence artificielle</strong> (Flocking AI, Behavior Trees), en passant par le <strong>développement multijoueur</strong>. Mon objectif est de fusionner l'art et la technologie pour créer des expériences mémorables et immersives.`,
]

export const cvUrl = '/assets/CV_PIRIS_Marius_GP3.pdf'

export const projects = [
  {
    title: 'Sirius Project',
    description: `Le 'Sirius Project' est une démonstration technique de pointe développée sous <strong>Unreal Engine 5</strong>, axée sur la <strong>génération procédurale de sorts et d'environnements</strong>.
      <br/><br/>
      Ce projet de recherche et développement en <strong>Tech-Art</strong>, réalisé à Isart Digital Paris en 2025, présente un système robuste de création de sorts dynamiques.
      <br/><br/>
      Mes contributions incluent :
      <ul class="list-disc list-inside ml-4 mt-2 space-y-1">
        <li>Mise en place du projet et contrôleur du joueur</li>
        <li>Architecture des systèmes de fabrication et de génération de sorts</li>
        <li>Intégration de la fusion automatisée de shaders et ajout de VFX en temps réel</li>
        <li>Création d'un environnement de jeu entièrement procédural</li>
        <li>Gestion des impacts de sorts sur l'environnement (cratères, propagation du feu, zones de glace)</li>
        <li>Pousse de plantes procédurales en temps réel</li>
      </ul>
      Ce projet offre une expérience visuelle riche et interactive.`,
    link: null,
    images: [
      '/assets/images/Sirius_TechArt0.png',
      '/assets/images/Sirius_TechArt1.png',
      '/assets/images/Sirius_TechArt2.png',
      '/assets/images/Sirius_TechArt3.png',
      '/assets/images/Sirius_TechArt4.png',
    ],
    videoUrl: 'https://www.youtube.com/embed/9DvdSvEg0Sw',
    skills: ['Unreal Engine 5', 'C++', 'Tech-Art', 'Procedural Generation', 'Shaders', 'VFX', 'Game Design', 'Teamwork'],
  },
  {
    title: 'Mytho Logie',
    description: `Plongez dans 'Mytho Logie', un <strong>jeu de puzzle déjanté</strong> avec une <strong>narration à choix multiples</strong>, développé lors de la Game Jam GameWeek d'Isart Digital Paris en 2025.
      <br/><br/>
      Votre mission : placer des stickers sur des affiches pour satisfaire les caprices des dieux et débloquer de nouveaux éléments. Chaque décision compte, vous poussant à choisir entre obéir aux divinités ou suivre vos propres principes.
      <br/><br/>
      En tant que membre clé de l'équipe, j'ai été responsable de :
      <ul class="list-disc list-inside ml-4 mt-2 space-y-1">
        <li>Développement des affiches et des stickers</li>
        <li>Contrôleur du joueur</li>
        <li>Implémentation d'un système de score basé sur une base de données CSV</li>
        <li>Enchaînement fluide des phases de jeu</li>
      </ul>
      Ce projet fut un défi technique stimulant, réalisé en quelques jours, démontrant ma capacité à livrer des solutions créatives sous pression.`,
    link: null,
    images: [
      '/assets/images/MythoLogie1.png',
      '/assets/images/MythoLogie4.png',
      '/assets/images/MythoLogie2.png',
      '/assets/images/MythoLogie3.png',
      '/assets/images/Mytho_Logie_Poster.png',
    ],
    videoUrl: 'https://www.youtube.com/embed/iL_0Sh8zlkU',
    skills: ['Unity', 'C#', 'Puzzle Game', '2D', 'Game Jam', 'Narrative', 'CSV Database'],
  },
  {
    title: 'Super Sushi Speed',
    description: `Plongez dans 'Super Sushi Speed', un <strong>jeu de rythme intense</strong> où vous incarnez un sushi mutant en quête de liberté, développé lors de la Game Jam ScoreSpaceJam en 2024.
      <br/><br/>
      Les niveaux, générés <strong>semi-procéduralement</strong>, augmentent progressivement en difficulté, vous poussant à maîtriser l'alternance gauche/droite en rythme pour avancer, sauter et dasher. Collectez du wasabi pour muter, gagner en vitesse et débloquer de nouvelles capacités comme le double saut.
      <br/><br/>
      Mes contributions inclus :
      <ul class="list-disc list-inside ml-4 mt-2 space-y-1">
        <li>Mise en place du projet et développement du contrôleur du joueur</li>
        <li>Synchronisation précise des inputs avec le rythme</li>
        <li>Création de niveaux procéduraux infinis</li>
        <li>Intégration des animations et processus de build</li>
      </ul>
      Ce fut une expérience palpitante de donner vie à ce sushi lancé à pleine vitesse !`,
    link: 'https://shazalsadepts.itch.io/super-sushi-speed',
    images: [
      'https://img.itch.zone/aW1nLzE0ODU5MzI4LnBuZw==/original/t8kUEc.png',
      'https://img.itch.zone/aW1hZ2UvMjUwMTAwNS8xNDg1NzU5MS5wbmc=/original/SxiYq9.png',
      'https://img.itch.zone/aW1hZ2UvMjUwMTAwNS8xNDg1NzU5My5wbmc=/original/BDTE%2BX.png',
      'https://img.itch.zone/aW1hZ2UvMjUwMTAwNS8xNDg1NzYxNC5wbmc=/original/xyolUF.png',
      'https://img.itch.zone/aW1hZ2UvMjUwMTAwNS8xNDg1NzU5MC5wbmc=/original/2hunOg.png',
    ],
    videoUrl: 'https://www.youtube.com/embed/sdxrkLrejos',
    skills: ['Godot', 'GDScript', 'Rhythm Game', '3D', 'Procedural Generation', 'Game Jam', 'Animations'],
  },
  {
    title: 'Pot Of Greed',
    description: `Réalisé en solo par Marius Piris dans le cadre d'un projet à l'IUT d'Orsay, Paris Saclay en 2024, j'ai géré l'intégralité du développement :
      <ul class="list-disc list-inside ml-4 mt-2 space-y-1">
        <li>Mise en place du projet et contrôleur du joueur</li>
        <li>Système de combinaison procédurale d'objets</li>
        <li>Gestion de l'inventaire à 3 slots</li>
        <li>Animations des personnages et des ennemis</li>
        <li>Processus de build final</li>
      </ul>
      Ce jeu a servi de prototype fondateur pour le futur système de combinaison runique d'Archipelago-JDR.`,
    link: 'https://shazalsadepts.itch.io/pot-of-greed',
    images: [
      'https://img.itch.zone/aW1hZ2UvMjc5MTY4OS8yMDY1ODI2NS5wbmc=/original/4xn%2Bh4.png',
      'https://img.itch.zone/aW1hZ2UvMjc5MTY4OS8xNjY2MzM5My5wbmc=/original/EGuHFu.png',
      'https://img.itch.zone/aW1hZ2UvMjc5MTY4OS8xNjY2MzM5NC5wbmc=/original/1gXAal.png',
      'https://img.itch.zone/aW1hZ2UvMjc5MTY4OS8xNjY2MzM5NS5wbmc=/original/0knbmU.png',
      'https://img.itch.zone/aW1hZ2UvMjc5MTY4OS8xNjY2MzM5Ni5wbmc=/original/UgI%2Bej.png',
    ],
    videoUrl: 'https://www.youtube.com/embed/D75UZmmcu4M',
    skills: ['Unity', 'C#', 'Rogue-Lite', '2D', 'Procedural Generation', 'Speedrun', 'Game Design'],
  },
  {
    title: 'Space Squad',
    description: `'Space Squad' est un projet centré sur l'<strong>intelligence artificielle</strong> : comportements d'ennemis pilotés par <strong>Behavior Trees</strong> et déplacements de groupe en <strong>Flocking</strong>, développé en équipe à Isart Digital.
      <br/><br/>
      Mes contributions incluent :
      <ul class="list-disc list-inside ml-4 mt-2 space-y-1">
        <li>Conception des arbres de comportement (Behavior Trees) des ennemis</li>
        <li>Implémentation du Flocking / Boids pour les déplacements de groupe</li>
        <li>Logique de décision et de ciblage</li>
        <li>Intégration et itérations en équipe</li>
      </ul>`,
    link: 'https://rosago.itch.io/space-squad',
    images: [
      'https://img.itch.zone/aW1hZ2UvMzA2MTE1NS8xODMwNzIyNy5wbmc=/original/roTlwF.png',
      'https://img.itch.zone/aW1hZ2UvMzA2MTE1NS8xODMwNzIxNC5wbmc=/original/Goef2R.png',
    ],
    videoUrl: 'https://www.youtube.com/embed/4000G_UjKd8',
    skills: ['Unity', 'C#', 'AI', 'Behavior Tree', 'Flocking', '3D', 'Teamwork'],
  },
]

export const experiences = [
  {
    title: 'Développeur Unity 3D',
    company: 'STUDIO ORACLE',
    duration: 'févr. 2025 - mars 2025 · 2 mois',
    description:
      "Développement de jeux 3D avec Unity, axé sur la conception de mécaniques de jeu et l'optimisation. Utilisation de C# et C pour la programmation, et Python pour les outils de production. J'ai également contribué à l'expérience utilisateur et à la production globale des jeux.",
    skills: ['Unity', 'C#', 'C', 'Conception de jeux', 'Production de jeux vidéos', 'Python', 'Expérience utilisateur (UX)', 'Arduino', 'PHP', 'JavaScript', 'React.js'],
  },
  {
    title: 'Développeur web',
    company: 'Bijoux Factory Paris',
    duration: 'juil. 2024 - août 2024 · 2 mois',
    description:
      "Développement d'un système de B2B personnalisé sur Shopify, inclus la création de logiciels Python pour le traitement de données en gros (fiches produits et fiches clients). J'ai travaillé sur la conception d'interfaces homme-machine (IHM) et l'expérience utilisateur pour optimiser les flux e-commerce.",
    skills: ['HTML', 'CSS', 'Liquid', 'Shopify', 'Python', "Conception d’IHM", 'UI', 'JavaScript', "Design d’interface utilisateur", 'Business-to-Business (BtoB)', 'Expérience utilisateur (UX)', 'E-commerce', 'PHP', 'Big data', 'Analyses Big Data'],
  },
  {
    title: 'Développeur Full Stack',
    company: 'CEA',
    duration: 'avr. 2023 - juil. 2023 · 4 mois',
    description:
      "Développement d'un programme Python pour le traitement des données de mesures AQUASPEC (dispositif de mesure pour la spectrométrie neutronique). Création d’une interface graphique avec tkinter, et de graphiques avec seaborn et matplotlib. Gestion de grandes quantités de données avec numpy et pandas, en optimisant les calculs et en utilisant des expressions régulières.",
    skills: ['Python', 'NumPy', 'Pandas', 'Programmation orientée objet (POO)', 'Programmation d’interfaces homme-machine (IHM)', 'Expressions régulières', 'Optimisation'],
  },
  {
    title: 'Responsable de salle',
    company: 'Matipi',
    duration: 'juin 2020 - août 2020 · 3 mois',
    description:
      "Gestion et accueil de la clientèle, organisation complète de la salle et du bar. J'étais en charge de la gestion des réservations individuelles et de groupe, ainsi que du service en salle et au bar, en assurant une excellente relation client.",
    skills: ['Gestion de la relation client (CRM)', 'Gestion de restaurant', 'Service clientèle'],
  },
]

export const formations = [
  {
    title: 'RNCP7, Game Programming',
    school: 'ISART DIGITAL Paris',
    duration: 'sept. 2024 - juil. 2026',
    level: 'BAC +5',
    skills: [
      'Unity', 'Unreal Engine', 'Godot',
      'Développement de logiciels et de jeux',
      'Programmation de jeux vidéo (C#, C++, C, HLSL, Shaders)',
      'Réseaux informatiques (UDP, TCP)',
      'Programmation orientée objet (POO)',
      'Interface homme-machine (IHM)',
    ],
  },
  {
    title: 'BUT informatique, Informatique',
    school: "IUT d'Orsay",
    duration: '2021 - 2024',
    level: 'BAC +3',
    skills: [
      'C#', 'UML', 'Conception d’IHM', 'HTML', 'MySQL', 'C', 'Frameworks', 'SGBD',
      'Interactions homme-machine', 'Science informatique', 'PhpMyAdmin', 'JavaScript',
      'Optimisation', 'Réseaux informatiques', 'PHP', 'Java', 'C++', 'Docker',
      'Python', 'MongoDB', 'Programmation orientée objet', 'CSS',
    ],
  },
  {
    title: 'Réorientation',
    school: 'Polytech Nice Sophia',
    duration: '2020 - 2021',
    level: 'N/A',
    skills: ['Optique', 'Mécanique', 'Programmation orientée objet (POO)', 'Programmation', 'Modélisation 3D', 'Mathématiques', 'Python'],
  },
  {
    title: 'Baccalauréat, Scientifique',
    school: 'Lycée Pierre Marie Théas',
    duration: 'juil. 2020',
    level: 'Mention très bien',
    skills: ['Sciences de la vie', 'Science informatique', 'Mathématiques', 'Physique'],
  },
]

export const categorizedSkills = {
  'Moteurs de Jeu': ['Unity', 'Unreal Engine 5', 'Godot'],
  'Langages de Programmation': ['C++', 'C#', 'Python', 'Java', 'GDScript', 'HLSL', 'Shaders', 'JavaScript', 'HTML', 'CSS', 'Liquid', 'PHP', 'C'],
  'Concepts & Architectures': ['Conception de Jeux', 'Génération Procédurale', 'AI Flocking', 'Behavior Trees', 'Développement Multijoueur', 'Optimisation de Performance', 'Débogage', 'Programmation Orientée Objet (POO)', 'UML', 'Conception d’IHM', 'Architecture des systèmes de fabrication'],
  'Bases de Données': ['MySQL', 'MongoDB', 'SGBD', 'CSV Database'],
  'Outils & Technologies Web': ['Shopify', 'React.js', 'Docker', 'PhpMyAdmin'],
  Autres: ['Modélisation 3D (basique)', 'Gestion de Projet', 'Production de jeux vidéos', 'Expérience Utilisateur (UX)', 'UI', "Design d’interface utilisateur", 'Business-to-Business (BtoB)', 'E-commerce', 'Big data', 'Analyses Big Data', 'NumPy', 'Pandas', 'Expressions Régulières', 'Arduino'],
}
