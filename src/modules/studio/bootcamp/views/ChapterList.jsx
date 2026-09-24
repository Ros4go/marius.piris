import { useMemo, useState } from 'react'

/* =====================================================================
   ACCUEIL D'UNE CATÉGORIE — examen blanc + grille des chapitres
   ===================================================================== */
export default function ChapterList({ category, chapters, scores, onCards, onQuiz, onExam, onBack }) {
  const [examDiff, setExamDiff] = useState('mix')
  const examCounts = useMemo(() => {
    const c = { mix: 0, facile: 0, moyen: 0, difficile: 0 }
    chapters.forEach((ch) => ch.quiz.forEach((q) => { c.mix++; c[q.difficulty] = (c[q.difficulty] || 0) + 1 }))
    return c
  }, [chapters])

  return (
    <div>
      <button className="bc-back" style={{ marginBottom: 16 }} onClick={onBack}><span>◄ Bootcamp</span></button>
      <div className="bc-hero">
        <div>
          <div className="module-sub">{category.kicker || 'BOOTCAMP'}</div>
          <h1 className="module-head">{category.title}</h1>
          {category.tagline && <p className="bc-hero-tag">{category.tagline}</p>}
        </div>
        {category.badge && (
          <div className="bc-badge"><span>{category.badge.name} <b>{category.badge.version}</b></span></div>
        )}
      </div>

      <div className="bc-chapters">
        <div className="bc-exam-card">
          <div className="bc-exam-txt">
            <h3>Examen <b>blanc</b></h3>
            <p>Questions tirées au hasard dans TOUS les chapitres.</p>
          </div>
          <div className="bc-exam-side">
            <div className="bc-exam-diff" role="group" aria-label="Difficulté de l'examen">
              {[['mix', 'Mélange'], ['facile', 'Facile'], ['moyen', 'Moyen'], ['difficile', 'Difficile']].map(([d, l]) => (
                <button
                  key={d}
                  className={'bc-exam-chip ' + d + (examDiff === d ? ' on' : '')}
                  disabled={examCounts[d] === 0}
                  aria-pressed={examDiff === d}
                  onClick={() => setExamDiff(d)}
                >{l}<span className="c-n">{examCounts[d]}</span></button>
              ))}
            </div>
            <div className="bc-exam-btns">
              <button className="btn ghost" onClick={() => onExam(15, examDiff)}><span>Éclair · 15 Q</span></button>
              <button className="btn" onClick={() => onExam(30, examDiff)}><span>Grand examen · 30 Q ▶</span></button>
            </div>
          </div>
        </div>

        {chapters.map((c) => {
          const sc = scores[c.id]
          return (
            <div className={'bc-chap' + (c.special ? ' special' : '')} key={c.id}>
              <div className="bc-chap-top">
                <span className="bc-chap-num">{c.num}</span>
                <span className="bc-chap-title">{c.title}</span>
              </div>
              <div className="bc-chap-meta">
                <span><b>{c.fiches.length}</b> cartes</span><span>·</span><span><b>{c.quiz.length}</b> questions</span>
                {sc && sc.best > 0 && (<><span>·</span><span className="bc-chap-best">🏆 {sc.best}%</span></>)}
              </div>
              <div className="bc-chap-actions">
                <button className="bc-mini rev" onClick={() => onCards(c)}><span>📖 Cartes</span></button>
                <button className="bc-mini quiz" onClick={() => onQuiz(c)}><span>⚡ Quiz</span></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
