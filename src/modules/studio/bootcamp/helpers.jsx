// Constantes et utilitaires partagés par toutes les vues du Bootcamp.

export const ROUND = 10 // questions max par manche de quiz

// Tiers de difficulté (partagés cartes + quiz)
export const TIERS = [
  { id: 1, label: 'Facile', diff: 'facile', cls: 'facile' },
  { id: 2, label: 'Moyen', diff: 'moyen', cls: 'moyen' },
  { id: 3, label: 'Difficile', diff: 'difficile', cls: 'difficile' },
]

// Liens communautaires (panneau ressources) : icône + libellé par type
export const KIND_ICON = { reddit: '👽', forum: '💬', wiki: '📚', youtube: '▶', blog: '✍', doc: '📄' }
export const KIND_LABEL = { reddit: 'Reddit', forum: 'Forum', wiki: 'Wiki', youtube: 'YouTube', blog: 'Blog', doc: 'Doc' }

export const CONFETTI_COLORS = ['#ec0016', '#fdf6ee', '#ffb300', '#61d36f', '#3aa0ff']

export const rand = () => Math.random()
export function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const pick = (arr) => arr[Math.floor(rand() * arr.length)]

// Rendu "markdown-léger" : **gras** et `code`
const NEWLINE = String.fromCharCode(10)
const RICH_SPLIT = new RegExp('([*]{2}[^*]+[*]{2}|`[^`]+`)', 'g')
export function renderRich(text) {
  if (!text) return null
  const parts = String(text).split(RICH_SPLIT)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>
    // Un saut de ligne dans le JSON devient un <br/> : utile pour les corrigés pas à pas
    const lines = p.split(NEWLINE)
    if (lines.length === 1) return <span key={i}>{p}</span>
    return <span key={i}>{lines.map((l, j) => (j === 0 ? l : [<br key={'b' + j} />, l]))}</span>
  })
}

// Question brute (JSON) -> jouable : choix mélangés, bon index recalculé
export function prepareQuestion(raw, chapTitle) {
  const correctText = raw.choices[raw.answer]
  const choices = shuffle(raw.choices)
  return {
    q: raw.q, topic: raw.topic, difficulty: raw.difficulty || 'moyen',
    explain: raw.explain, source: raw.source, def: raw.def, chapter: chapTitle,
    choices, answer: choices.indexOf(correctText),
  }
}
