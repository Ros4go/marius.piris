// ============================================================
// UE5 BLUEPRINT — accès au contenu de révision (fiches + quiz)
//
// Le contenu vit dans public/data/ue5-blueprint.json et se modifie
// directement dans ce fichier. Il n'y a pas de script de génération :
// l'ancien consolidate.mjs n'a jamais été versionné, et les supports de
// cours dont il partait non plus. Le JSON est servi tel quel et chargé à
// la demande quand on ouvre le module, donc il ne pèse pas dans le bundle.
//
// Avant chaque build, scripts/check-ue5-data.mjs vérifie sa structure
// (aussi lançable à la main : npm run check:ue5).
//
// Structure d'un chapitre :
//   { id, num, special, title, summary, topics: [..],
//     fiches: [{ title, body, keypoints: [..], versionNote?, tier: 1|2|3, front? }],
//     quiz:   [{ q, choices: [..], answer: <index dans choices>, explain,
//                difficulty: 'facile'|'moyen'|'difficile', topic?, def? }],
//     sources: [{ label, url }],
//     images:  [{ url, caption, credit, link }],
//     links:   [{ label, url, kind }] }
// ============================================================

export const UE5_DATA_URL = '/data/ue5-blueprint.json'

let pending = null

// Charge (une seule fois par session) puis met en cache la liste des chapitres.
// En cas d'échec, le cache est vidé pour qu'un « Réessayer » relance la requête.
export function loadChapters() {
  if (!pending) {
    pending = fetch(UE5_DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} sur ${UE5_DATA_URL}`)
        return res.json()
      })
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('format inattendu : un tableau de chapitres est attendu')
        return data
      })
      .catch((e) => {
        pending = null
        throw e
      })
  }
  return pending
}
