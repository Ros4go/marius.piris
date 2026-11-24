import ue5Blueprint from './categories/ue5-blueprint/index.js'
import dataScience from './categories/data-science/index.js'
import python from './categories/python/index.js'
import cuda from './categories/cuda/index.js'

// REGISTRE DES CATÉGORIES — source unique de vérité du Bootcamp (hub + routes).
//
// Ajouter une catégorie :
//   1) son contenu : categories/<id>/data.json   (structure : voir data.js)
//   2) sa config   : categories/<id>/index.js    (modèle : ue5-blueprint)
//   3) une ligne ici. La page #/studio/bootcamp/<id> existe dès lors.
export const CATEGORIES = [ue5Blueprint, dataScience, python, cuda]

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || null
