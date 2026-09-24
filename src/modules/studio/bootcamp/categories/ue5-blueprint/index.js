import { matchGlossary } from './glossary.js'

// Catégorie « UE5 Blueprint » du Bootcamp. Sert de modèle pour les suivantes.
export default {
  id: 'ue5-blueprint', // = nom du JSON et segment d'URL : #/studio/bootcamp/ue5-blueprint
  num: '01',
  title: 'UE5 Blueprint',
  kicker: 'UNREAL ENGINE 5 · BLUEPRINT', // sur-titre de la page catégorie
  short: 'UE5', // filigrane du fond
  tagline: "Éditeur, events, widgets, signaux, IA… : le scripting visuel d'Unreal en fiches + quiz.",
  tags: ['UE5', 'Blueprint', 'Scripting visuel'],
  badge: { name: 'Unreal Engine', version: '5.4' }, // optionnel
  versionLabel: 'UE 5.4', // optionnel : préfixe des notes de version sur les cartes
  data: '/data/bootcamp/ue5-blueprint.json',
  glossary: matchGlossary, // optionnel : (texte) => [{ term, def }] affiché après une réponse
  goofy: { sub: ['Blueprint no diff.', 'Epic Games devrait te recruter.'] }, // optionnel
}
