import { matchGlossary } from './glossary.js'

// Catégorie « Data science » du Bootcamp : le cours « From data to AI »
// (Laurent Cetinsoy, Nowledgeable) limité à la partie vue en cours, plus les
// modules Nowledgeable de maths : dérivées, gradient, descente de gradient,
// régression linéaire. Les autres parties du diaporama (deep learning, NLP,
// RL, sécurité…) viendront quand elles auront été vues.
export default {
  id: 'data-science', // = nom du JSON et segment d'URL : #/studio/bootcamp/data-science
  num: '02',
  title: 'Data science',
  kicker: 'DATA · MACHINE LEARNING · MATHS',
  short: 'DATA',
  tagline: "Données, machine learning, régression linéaire et les maths derrière : dérivées, gradient, descente de gradient. Corrigés pas à pas inclus.",
  tags: ['Data', 'Machine learning', 'Maths'],
  data: '/data/bootcamp/data-science.json',
  glossary: matchGlossary,
  goofy: { sub: ['Le gradient descend, toi tu montes.', 'MSE = 0, no diff.', 'Overfitting ? Pas toi.'] },
}
