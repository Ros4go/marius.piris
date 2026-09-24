import { useMemo } from 'react'
import { ROUND } from '../helpers.jsx'

/* =====================================================================
   VUE RÉGLAGE DU QUIZ — choix de la difficulté (manche de 10)
   ===================================================================== */
export default function QuizSetup({ chapter, onBack, onStart }) {
  const counts = useMemo(() => {
    const c = { facile: 0, moyen: 0, difficile: 0 }
    chapter.quiz.forEach((q) => { c[q.difficulty] = (c[q.difficulty] || 0) + 1 })
    return c
  }, [chapter])
  const total = chapter.quiz.length

  const opt = (diff, label, cls, n, all = false) => (
    <button className={'bc-diffopt ' + cls + (n === 0 ? ' disabled' : '')} disabled={n === 0} onClick={() => onStart(diff)}>
      <span className="d-lab">{label}</span>
      <span className="d-n">{n} question{n > 1 ? 's' : ''}</span>
      <span className="d-go">{all ? `les ${n} d'affilée ▶` : `jusqu'à ${Math.min(ROUND, n)} par manche ▶`}</span>
    </button>
  )

  return (
    <div className="bc-setup">
      <div className="bc-subhead">
        <button className="bc-back" onClick={onBack}><span>◄ Chapitres</span></button>
        <span className="bc-subtitle">{chapter.title}</span>
      </div>
      <p className="bc-hero-tag" style={{ marginBottom: 18 }}>
        Choisis un niveau. Chaque manche fait <b>{ROUND} questions max</b> — sauf <b>Tout</b>, qui enchaîne l'intégrale du chapitre.
      </p>
      <div className="bc-diffgrid">
        {opt('tout', 'Tout', 'tout', total, true)}
        {opt('mix', 'Mélange', 'mix', total)}
        {opt('facile', 'Facile', 'facile', counts.facile)}
        {opt('moyen', 'Moyen', 'moyen', counts.moyen)}
        {opt('difficile', 'Difficile', 'difficile', counts.difficile)}
      </div>
    </div>
  )
}
