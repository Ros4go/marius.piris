// Fabrique de glossaire, commune à toutes les catégories du Bootcamp.
// Chaque catégorie fournit sa liste [{ term, aliases, def }] et obtient une
// fonction (texte, max) => définitions dont un terme (ou alias) apparaît en
// MOT ENTIER dans le texte. Utilisée par le quiz après une réponse.

const isWord = (c) => c != null && /[a-z0-9àâäçéèêëîïôöùûü]/i.test(c)

function containsWord(hay, needle) {
  let from = 0
  while (from < hay.length) {
    const i = hay.indexOf(needle, from)
    if (i === -1) return false
    if (!isWord(hay[i - 1]) && !isWord(hay[i + needle.length])) return true
    from = i + 1
  }
  return false
}

export function makeGlossaryMatcher(glossary) {
  return function matchGlossary(text, max = 2) {
    const low = ' ' + String(text || '').toLowerCase() + ' '
    const hits = []
    for (const g of glossary) {
      const keys = [g.term, ...(g.aliases || [])]
      if (keys.some((k) => containsWord(low, k.toLowerCase()))) hits.push(g)
    }
    hits.sort((a, b) => b.term.length - a.term.length)
    return hits.slice(0, max)
  }
}
