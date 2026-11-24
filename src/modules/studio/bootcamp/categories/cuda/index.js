import { matchGlossary } from './glossary.js'

// Catégorie « CUDA » du Bootcamp : le cours ESIEE « Programmation GPU avec CUDA
// en C/C++ » (T. Grandpierre) et ses 7 exercices de TP (hello world, propriétés de
// la carte, racine carrée, produit scalaire, fractale de Julia, histogramme, Sobel).
// Les notions que les TP demandent sans que les slides vues les détaillent
// (événements CUDA, shared memory, atomicAdd, mémoire constante) sont complétées
// d'après « CUDA by Example », le livre dont s'inspire le cours.
export default {
  id: 'cuda', // = nom du JSON et segment d'URL : #/studio/bootcamp/cuda
  num: '04',
  title: 'CUDA : programmation GPU',
  kicker: 'CUDA · C/C++ · GPU · TP ESIEE',
  short: 'GPU',
  tagline: "Du GPU aux kernels : host et device, nvcc, blocs, threads et warps, mémoires, puis les TP corrigés pas à pas : racine carrée, produit scalaire en shared memory, fractale de Julia, histogramme, Sobel.",
  tags: ['CUDA', 'GPU', 'C/C++', 'Parallélisme'],
  data: '/data/bootcamp/cuda.json',
  glossary: matchGlossary,
  goofy: { sub: ['1024 threads par bloc, pas un de plus.', '__syncthreads() et tout le monde attend.', 'Ton GPU chauffe pour toi.'] },
}
