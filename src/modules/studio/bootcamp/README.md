# Game Dev Bootcamp

Module de révision par catégories (fiches mémo + quiz + examen blanc).
Route : `#/studio/bootcamp`, puis `#/studio/bootcamp/<id>` pour une catégorie.

## Ajouter une catégorie

1. Le contenu : `public/data/bootcamp/<id>.json` (structure décrite dans `data.js`).
   `npm run check:bootcamp` vérifie tous les JSON ; `npm run build` le lance aussi.
2. La config : `categories/<id>/index.js`, sur le modèle de `categories/ue5-blueprint/index.js`,
   avec éventuellement un glossaire ou des messages propres à la catégorie.
3. Une ligne dans `categories.js`.

La progression est gardée dans le localStorage sous `bootcamp:<id>:scores` et `bootcamp:<id>:known`.

## Arborescence

- `Bootcamp.jsx` : point d'entrée, lit l'URL et affiche le hub ou une catégorie.
- `Hub.jsx` : accueil, liste des catégories.
- `Category.jsx` : une catégorie, charge son JSON et enchaîne les vues.
- `views/` : ChapterList, CardsView, QuizSetup, QuizView, ResultView, ResourcesPanel.
- `data.js`, `storage.js`, `helpers.jsx`, `goofy.js` : chargement, progression, utilitaires.
- `glossary.js` : fabrique de glossaire commune ; chaque catégorie fournit sa liste de termes.
- `fun/` : Dominicus et le Super Poulet Flappy, communs à toutes les catégories.
- `bootcamp.css` : styles, préfixe `bc-`.
