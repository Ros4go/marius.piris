import ue5Blueprint from './categories/ue5-blueprint/index.js'
import dataScience from './categories/data-science/index.js'

// REGISTRE DES CATÉGORIES — source unique de vérité du Bootcamp (hub + routes).
//
// Ajouter une catégorie :
//   1) son contenu : public/data/bootcamp/<id>.json   (structure : voir data.js)
//   2) sa config   : categories/<id>/index.js          (modèle : ue5-blueprint)
//   3) une ligne ici. La page #/studio/bootcamp/<id> existe dès lors.
export const CATEGORIES = [ue5Blueprint, dataScience]

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || null
