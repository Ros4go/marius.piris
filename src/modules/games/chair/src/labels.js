// Single source of truth for organ-slot / organ-type French labels. Imported by
// every renderer/system that used to keep its own private copy (ReactorPanel,
// MobRenderer, InspectorPanel, MobGen).

// Short slot labels (body map, telegraphs) — e.g. "Bras G."
export const SLOT_SHORT = {
  brain: 'Cerveau', eye_l: 'Œil G.', eye_r: 'Œil D.', ear_l: 'Oreille G.', ear_r: 'Oreille D.',
  tongue: 'Langue', heart: 'Cœur', stomach: 'Estomac', skin: 'Peau',
  arm_l: 'Bras G.', arm_r: 'Bras D.', legs: 'Jambes',
};

// Full slot labels (inspector) — e.g. "Bras gauche"
export const SLOT_FULL = {
  brain: 'Cerveau', eye_l: 'Œil gauche', eye_r: 'Œil droit',
  ear_l: 'Oreille gauche', ear_r: 'Oreille droite', tongue: 'Langue',
  heart: 'Cœur', stomach: 'Estomac', skin: 'Peau',
  arm_l: 'Bras gauche', arm_r: 'Bras droit', legs: 'Jambes',
};

// Noun by organ type (mob naming, inspector fallback) — e.g. "Bras"
export const TYPE_NOUN = {
  eye: 'Œil', ear: 'Oreille', arm: 'Bras', legs: 'Jambes',
  heart: 'Cœur', skin: 'Peau', brain: 'Cerveau', stomach: 'Estomac', tongue: 'Langue',
};

// French description of every perception/property tag (TDD §2). The inspector
// GENERATES organ descriptions from these — descriptive passives were deleted
// from organs.json (§2.8 #17). Gauge tags show their count next to the label.
export const TAG_FR = {
  // Vue (latéralisé)
  'vue':            { label: 'Vue',              desc: 'Voit sa moitié d\'écran, en nuances de gris.' },
  'vue-couleur':    { label: 'Vue couleur',      desc: 'Sa moitié d\'écran est en couleur.' },
  'vue-nocturne':   { label: 'Vision nocturne',  desc: 'Voit sa moitié dans le noir (teinte ambrée).' },
  'vue-invisible':  { label: 'Voit l\'invisible', desc: 'Perçoit les choses invisibles de sa moitié.' },
  'vue-spider':     { label: 'Œil d\'araignée',  desc: 'Subdivise sa moitié en 4 copies identiques.' },
  'vue-rayons-x':   { label: 'Rayons X',         desc: 'Révèle les organes profonds sans éplucher les couches.' },
  'vue-arcane':     { label: 'Vue arcane',       desc: 'Révèle les cibles magiques de sa moitié.' },
  'vue-thermique':  { label: 'Vue thermique',    desc: 'Lit la chaleur : le vivant brille, le décor s\'efface.' },
  // Ouïe (latéralisé)
  'ouie':                    { label: 'Ouïe',              desc: 'La barre de son montre les ondes de ce côté (sans texte).' },
  'echolocation-1':          { label: 'Écholocation I',    desc: 'Les sons sont localisés approximativement sur la barre.' },
  'echolocation-2':          { label: 'Écholocation II',   desc: 'Les sons sont localisés précisément sur la barre.' },
  'echolocation-3':          { label: 'Écholocation III',  desc: 'Un voile pointillé dessine la scène selon le son (permanent).' },
  'echolocation-4':          { label: 'Écholocation IV',   desc: 'Bouton : le pointillé recouvre TOUT, interface comprise.' },
  'ouie-identification-1':   { label: 'Identification I',  desc: '« Créature » s\'écrit sur la barre, sans plus.' },
  'ouie-identification-2':   { label: 'Identification II', desc: 'Les noms s\'écrivent, des mots sont effacés au hasard.' },
  'ouie-identification-3':   { label: 'Identification III',desc: 'Tout s\'écrit clairement sur la barre.' },
  'ouie-identification-4':   { label: 'Identification IV', desc: 'Boutons de filtre discrets en haut de la barre.' },
  'ouie-detection-1':        { label: 'Détection I',       desc: 'Salles à ennemis en rouge (si la carte prédit à 1).' },
  'ouie-detection-2':        { label: 'Détection II',      desc: 'Salles à ennemis en rouge (si la carte prédit à 2).' },
  'ouie-detection-3':        { label: 'Détection III',     desc: 'Salles à ennemis en rouge (si la carte prédit à 3).' },
  'ouie-detection-4':        { label: 'Détection IV',      desc: 'Ennemis en rouge à 3 salles, même hors prédiction (pointillés).' },
  'ouie-detection-5':        { label: 'Détection V',       desc: 'Ennemis en rouge à 3 salles, même carte verrouillée.' },
  // Lucidité
  'plan':              { label: 'Plan',          desc: 'Lit le télégraphe ennemi : attaque et cible (via un sens).' },
  'plan-degats':       { label: 'Plan · dégâts', desc: 'Lit aussi les dégâts annoncés.' },
  'plan-faille':       { label: 'Plan · faille', desc: 'Révèle le point faible (dégâts bonus si frappé).' },
  'plan-anticipation': { label: 'Anticipation',  desc: 'Lit le plan ennemi un tour à l\'avance.' },
  'map-1':    { label: 'Carte I',   desc: 'Situe le joueur et sa salle (sans mémoire).' },
  'map-2':    { label: 'Carte II',  desc: '+ les salles adjacentes par les portes.' },
  'map-3':    { label: 'Carte III', desc: '+ prédit les salles à 2 de distance.' },
  'map-4':    { label: 'Carte IV',  desc: '+ prédit les salles à 3 de distance.' },
  'memoire':  { label: 'Mémoire',   desc: 'La carte retient les salles visitées.' },
  // Jauges (comptent, ±10 % chacune, sans plafond)
  'digestion':    { label: 'Digestion',    gauge: '+10 % de rendement quand tu manges' },
  'bruyant':      { label: 'Bruyant',      gauge: '+10 % de bruit émis' },
  'calme':        { label: 'Calme',        gauge: '−10 % de bruit émis' },
  'luminescent':  { label: 'Luminescent',  gauge: '+10 % de lumière émise' },
  'sombre':       { label: 'Sombre',       gauge: '−10 % de lumière (négatif → invisibilité)' },
  'pompe':        { label: 'Pompe',        gauge: '+10 % de Sang produit par tour' },
  'garde-manger': { label: 'Garde-manger', gauge: '+10 % de satiété maximale' },
  'fermentation': { label: 'Fermentation', gauge: '+10 % de chance de déchet organique (Gavé)' },
  'invisible':    { label: 'Invisible',    gauge: '−10 % d\'opacité' },
  'chaud':        { label: 'Chaud',        gauge: '+10 % de chaleur' },
  'froid':        { label: 'Froid',        gauge: '+10 % de froid' },
  // Greffe
  'compatible':       { label: 'Compatible',       gauge: '−1 tick de greffe' },
  'incompatible':     { label: 'Incompatible',     gauge: '+1 tick de greffe' },
  'hyper-compatible': { label: 'Hyper-compatible', desc: 'Se greffe instantanément (0 tick).' },
  // Marqueurs & divers
  'second-souffle': { label: 'Second souffle', desc: 'Survit un tick de plus sans cœur.' },
  'estomac-de-fer': { label: 'Estomac de fer', desc: 'Ne vomit jamais en état Gavé.' },
  'photophobe':     { label: 'Photophobe',     desc: 'Souffre en pleine lumière.' },
  'arcane':         { label: 'Arcane',         desc: 'Cette entité est magique.' },
};
