// Messages « goofy » affichés en fin de quiz, peu importe le résultat.
// Communs à toutes les catégories ; une catégorie peut en ajouter via sa config :
//   goofy: { main: [...], sub: [...] }

export const GOOFY = [
  "T'ES LE MEILLEUR",
  'VAS Y',
  'Dominique sa m*r*',
  'Vas y mon fréro tié le Hugo Boss !',
  "Mon bro c'est lui le plus cho",
  'Dominique a aucune chance',
  'Tu vas tout défoncer',
  'Tié un tigre du Bengale',
  'Tié la troisième roue du vélo',
  'Tié un ventilateur sous canicule',
]
export const GOOFY_SUB = [
  'Le contrôle il va rien comprendre.',
  'On lâche rien.',
  'Encore un run et tu es incollable.',
  "C'est pas de la chance, c'est du talent.",
]

export const goofyMain = (cat) => GOOFY.concat((cat && cat.goofy && cat.goofy.main) || [])
export const goofySub = (cat) => GOOFY_SUB.concat((cat && cat.goofy && cat.goofy.sub) || [])
