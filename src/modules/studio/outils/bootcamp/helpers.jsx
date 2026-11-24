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

// Rendu "markdown-léger" : **gras**, `code` et blocs ```code``` (indentation conservée)
const NEWLINE = String.fromCharCode(10)
const FENCE = '```'
const RICH_SPLIT = new RegExp('(`{3}[^`]+`{3}|[*]{2}[^*]+[*]{2}|`[^`]+`)', 'g')
// Bloc de code : un <code> en display:block (et pas un <pre>) pour rester valide
// dans les <p> et <li> où renderRich est appelé. Les sauts de ligne collés au bloc
// sont retirés, sinon ils ajoutent un <br/> vide avant ou après.
const trimFence = (s) => s.replace(new RegExp('^' + NEWLINE), '').replace(new RegExp(NEWLINE + '$'), '')
export function renderRich(text) {
  if (!text) return null
  const parts = String(text).split(RICH_SPLIT)
  return parts.map((p, i) => {
    if (p.length > 6 && p.startsWith(FENCE) && p.endsWith(FENCE)) {
      return <code key={i} className="bc-codeblock">{trimFence(p.slice(3, -3))}</code>
    }
    if (i > 0 && parts[i - 1].startsWith(FENCE)) p = p.replace(new RegExp('^' + NEWLINE), '')
    if (i < parts.length - 1 && parts[i + 1].startsWith(FENCE) && parts[i + 1].length > 6) p = p.replace(new RegExp(NEWLINE + '$'), '')
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
