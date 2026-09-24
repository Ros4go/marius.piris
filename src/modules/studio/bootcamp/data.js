// Chargement du contenu d'une catégorie : public/data/bootcamp/<id>.json, servi
// tel quel et récupéré à la demande (jamais dans le bundle JS). Mis en cache par
// catégorie ; en cas d'échec le cache est vidé pour qu'un « Réessayer » relance.
//
// Structure attendue d'un JSON (un tableau de chapitres) :
//   { id, num, special, title, summary, topics: [..],
//     fiches: [{ title, body, keypoints: [..], versionNote?, tier: 1|2|3, front? }],
//     quiz:   [{ q, choices: [..], answer: <index dans choices>, explain,
//                difficulty: 'facile'|'moyen'|'difficile', topic?, def? }],
//     sources: [{ label, url }], images: [{ url, caption, credit, link }],
//     links: [{ label, url, kind }] }
// Vérifiée avant chaque build par scripts/check-bootcamp-data.mjs.

const cache = new Map()

export function loadCategoryData(category) {
  if (!cache.has(category.id)) {
    const p = fetch(category.data)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} sur ${category.data}`)
        return res.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('format inattendu : un tableau de chapitres est attendu')
        return data
      })
      .catch((e) => {
        cache.delete(category.id)
        throw e
      })
    cache.set(category.id, p)
  }
  return cache.get(category.id)
}
