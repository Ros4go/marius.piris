// Progression locale (localStorage), cloisonnée par catégorie :
//   bootcamp:<catId>:scores -> { [chapitreId | 'exam']: { best, bestRaw, attempts } }
//   bootcamp:<catId>:known  -> { '<chapitreId>:<index carte>': true }

const key = (catId, what) => `bootcamp:${catId}:${what}`

// Anciennes clés du module « UE5 Blueprint » (avant le Bootcamp) : reprises une
// fois, à la première lecture, pour ne pas perdre la progression existante.
const LEGACY = { 'ue5-blueprint': { scores: 'ue5_blueprint_scores_v1', known: 'ue5_cards_known_v1' } }

function read(catId, what) {
  try {
    const k = key(catId, what)
    let raw = localStorage.getItem(k)
    if (raw === null && LEGACY[catId]) {
      raw = localStorage.getItem(LEGACY[catId][what])
      if (raw !== null) localStorage.setItem(k, raw)
    }
    return JSON.parse(raw) || {}
  } catch {
    return {}
  }
}
function write(catId, what, obj) {
  try { localStorage.setItem(key(catId, what), JSON.stringify(obj)) } catch { /* quota */ }
}

export const loadScores = (catId) => read(catId, 'scores')
export function saveScore(catId, k, pct, raw) {
  const s = loadScores(catId)
  const prev = s[k] || { best: 0, attempts: 0 }
  s[k] = { best: Math.max(prev.best, pct), bestRaw: pct >= prev.best ? raw : prev.bestRaw, attempts: prev.attempts + 1 }
  write(catId, 'scores', s)
  return s[k]
}
export const loadKnown = (catId) => read(catId, 'known')
export const persistKnown = (catId, map) => write(catId, 'known', map)
