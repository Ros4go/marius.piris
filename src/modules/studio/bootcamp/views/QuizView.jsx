import { useRef, useState } from 'react'
import { rand, renderRich } from '../helpers.jsx'

/* =====================================================================
   VUE QUIZ
   ===================================================================== */
export default function QuizView({ category, title, subtitle, questions, onExit, onFinish }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [log, setLog] = useState([])
  const [birds, setBirds] = useState([])
  const wrongCount = useRef(0)
  const birdSeq = useRef(0)

  // Une erreur -> N oiseaux traversent l'écran (1 à la 1re faute, 2 à la 2e, …)
  const flyBirds = (n) => {
    const add = Array.from({ length: n }, (_, i) => ({
      id: ++birdSeq.current,
      top: 6 + rand() * 68,
      delay: i * 0.22,
      dur: 2.6 + rand() * 1.3,
    }))
    setBirds((b) => [...b, ...add])
  }
  const removeBird = (id) => setBirds((b) => b.filter((x) => x.id !== id))

  const q = questions[idx]
  const answered = selected !== null
  const isLast = idx === questions.length - 1
  // Glossaire : définitions des termes complexes présents dans la question (sinon rien).
  const glossHits = answered && category.glossary ? category.glossary(q.q + ' ' + q.choices.join(' ')) : []

  const choose = (i) => {
    if (answered) return
    const ok = i === q.answer
    setSelected(i)
    if (ok) setScore((s) => s + 1)
    else { wrongCount.current += 1; flyBirds(wrongCount.current) }
    setLog((l) => [...l, { q: q.q, chosen: q.choices[i], correct: q.choices[q.answer], ok }])
  }
  const next = () => {
    if (isLast) { onFinish(score, questions.length, log); return }
    setIdx((i) => i + 1); setSelected(null)
  }

  return (
    <div className="bc-quiz">
      <div className="sp-flock" aria-hidden="true">
        {birds.map((b) => (
          <div
            key={b.id}
            className="sp-flybird"
            style={{ top: b.top + '%', animationDelay: b.delay + 's', animationDuration: b.dur + 's' }}
            onAnimationEnd={() => removeBird(b.id)}
          >
            <span className="sp-bird" />
          </div>
        ))}
      </div>
      <div className="bc-subhead" style={{ marginBottom: 12 }}>
        <button className="bc-back" onClick={onExit}><span>◄ Quitter</span></button>
        <span className="bc-subtitle" style={{ fontSize: 'clamp(18px,2.6vw,24px)' }}>{title}</span>
      </div>
      {subtitle && <div className="bc-quiz-sub">{subtitle}</div>}

      <div className="bc-prog">
        <span className="bc-prog-txt">{idx + 1}/{questions.length}</span>
        <div className="bc-prog-bar"><div className="bc-prog-fill" style={{ width: `${(idx / questions.length) * 100}%` }} /></div>
        <span className="bc-prog-score">{score} pt{score > 1 ? 's' : ''}</span>
      </div>

      <div className="bc-qcard" key={idx}>
        <span className={'bc-qdiff ' + q.difficulty}>{q.difficulty}</span>
        {q.topic && <span className="bc-qtopic">{q.topic}</span>}
        <div className="bc-qtext">{renderRich(q.q)}</div>

        <div className="bc-choices">
          {q.choices.map((c, i) => {
            let cls = 'bc-choice'
            if (answered) { if (i === q.answer) cls += ' correct'; else if (i === selected) cls += ' wrong' }
            return (
              <button key={i} className={cls} disabled={answered} onClick={() => choose(i)}>
                <span className="k"><span>{String.fromCharCode(65 + i)}</span></span>
                <span>{renderRich(c)}</span>
                {answered && i === q.answer && <span className="mark">✓</span>}
                {answered && i === selected && i !== q.answer && <span className="mark">✕</span>}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={'bc-explain ' + (selected === q.answer ? 'ok' : 'ko')}>
            <div className="head">{selected === q.answer ? '✓ Correct !' : '✕ Raté'}</div>
            <p>{renderRich(q.explain)}</p>
            {q.source && (
              <div className="bc-sources" style={{ marginTop: 8 }}>
                <a className="bc-src" href={q.source.url} target="_blank" rel="noopener noreferrer">{q.source.label}</a>
              </div>
            )}
          </div>
        )}

        {answered && glossHits.map((g) => (
          <div className="bc-def" key={g.term}>
            <span className="bc-def-head">💡 Définition · {g.term}</span>
            <p>{renderRich(g.def)}</p>
          </div>
        ))}
      </div>

      {answered && (
        <div className="bc-quiz-foot">
          <button className="btn" onClick={next}><span>{isLast ? 'Voir le résultat ▶' : 'Suivant ▶'}</span></button>
        </div>
      )}
    </div>
  )
}
