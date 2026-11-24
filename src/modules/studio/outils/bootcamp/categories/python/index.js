import { matchGlossary } from './glossary.js'

// Catégorie « Python pour la data » du Bootcamp : numpy, pandas, matplotlib et
// Streamlit d'après les exercices vus, puis la data science refaite en Python
// (descente de gradient, régression linéaire numpy, probabilités simulées).
export default {
  id: 'python', // = nom du JSON et segment d'URL : #/studio/bootcamp/python
  num: '03',
  title: 'Python pour la data',
  kicker: 'NUMPY · PANDAS · STREAMLIT · ML EN PYTHON',
  short: 'PY',
  tagline: "numpy, pandas, matplotlib, Streamlit, puis la data science refaite en Python : descente de gradient, régression linéaire, probabilités simulées. Chaque exercice corrigé.",
  tags: ['Python', 'numpy', 'pandas', 'Streamlit'],
  data: new URL('./data.json', import.meta.url).href, // contenu : data.json à côté
  glossary: matchGlossary,
  goofy: { sub: ['import antigravity.', 'Pas de boucle for, promis.', 'pip install talent.'] },
}
