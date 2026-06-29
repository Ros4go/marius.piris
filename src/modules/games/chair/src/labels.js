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
