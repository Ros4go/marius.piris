import { matchGlossary } from './glossary.js'

// Catégorie « CUDA » du Bootcamp : comprendre la programmation GPU avec CUDA,
// sans supposer de cours ni de support préalable. Le contenu se suffit à lui-même :
// pourquoi le GPU, le modèle de programmation, le matériel, la mémoire, puis la
// performance et l'écosystème. Peu de code et peu de calcul : on vise la compréhension.
export default {
  id: 'cuda', // = segment d'URL : #/studio/bootcamp/cuda
  num: '04',
  title: 'CUDA : programmation GPU',
  kicker: 'CUDA · GPU · CALCUL PARALLÈLE',
  short: 'GPU',
  tagline: "Comprendre le calcul sur GPU : pourquoi c'est rapide, comment on organise des milliers de threads, ce qui se passe dans la carte, comment la mémoire fait la vitesse, et les outils et bibliothèques de l'écosystème.",
  tags: ['CUDA', 'GPU', 'Parallélisme', 'NVIDIA'],
  data: new URL('./data.json', import.meta.url).href, // contenu : data.json à côté
  glossary: matchGlossary,
  goofy: { sub: ['1024 threads par bloc, pas un de plus.', '__syncthreads() et tout le monde attend.', 'Ton GPU chauffe pour toi.'] },
}
