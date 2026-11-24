import { lazy } from 'react'

// Chargement à la demande robuste aux déploiements.
//
// Après un déploiement, les fichiers JS / CSS changent de nom (hash). Un visiteur
// qui a encore l'ancienne page en cache réclame alors des fichiers supprimés :
// l'import échoue (404). Au lieu d'un écran blanc, on recharge la page une fois
// pour récupérer la nouvelle version. Si l'échec persiste juste après un
// rechargement, on laisse l'erreur remonter à l'ErrorBoundary (shell/).

const KEY = 'reload-apres-deploiement'
const DELAI_MS = 10000 // pas deux rechargements automatiques en moins de 10 s

function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < DELAI_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    return false // stockage indisponible : pas de rechargement automatique
  }
  window.location.reload()
  return true
}

// React.lazy + rechargement unique si le module est introuvable.
export function lazyPage(load) {
  return lazy(() =>
    load().catch((err) => {
      if (reloadOnce()) return new Promise(() => {}) // la page se recharge, on n'affiche rien
      throw err
    })
  )
}

// Même filet pour les CSS préchargées par Vite (« Unable to preload CSS … »).
export function installReloadOnPreloadError() {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce()) event.preventDefault()
  })
}
