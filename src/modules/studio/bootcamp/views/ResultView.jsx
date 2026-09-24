import { useEffect, useMemo, useRef, useState } from 'react'
import { CONFETTI_COLORS, pick, rand, renderRich } from '../helpers.jsx'
import { saveScore } from '../storage.js'
import { goofyMain, goofySub } from '../goofy.js'

/* =====================================================================
   ÉCRAN DE RÉSULTAT — goofy + confettis
   ===================================================================== */
export default function ResultView({ category, score, total, log, title, storeKey, canContinue, onRetry, onBack }) {
  const pct = Math.round((score / total) * 100)
  const goofy = useMemo(() => pick(goofyMain(category)), [])
  const goofySub = useMemo(() => pick(goofySub(category)), [])
  const [best, setBest] = useState(null)
  const savedRef = useRef(false)
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true
    setBest(saveScore(category.id, storeKey, pct, `${score}/${total}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const confetti = useMemo(
    () => Array.from({ length: 46 }, (_, i) => ({
      left: rand() * 100, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: rand() * 0.8, dur: 2.4 + rand() * 1.8, rot: rand() * 360,
    })), []
  )
  const circ = 2 * Math.PI * 78
  const dash = (pct / 100) * circ
  const wrong = log.filter((l) => !l.ok)

  return (
    <div className="bc-result">
      <div className="bc-confetti" aria-hidden="true">
        {confetti.map((c, i) => (
          <i key={i} style={{ left: c.left + '%', background: c.color, animationDelay: c.delay + 's', animationDuration: c.dur + 's', transform: `rotate(${c.rot}deg)` }} />
        ))}
      </div>
      <div className="bc-result-ring">
        <svg viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(253,246,238,0.1)" strokeWidth="12" />
          <circle cx="90" cy="90" r="78" fill="none" stroke="#ec0016" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
        </svg>
        <div className="pct"><span className="big">{pct}%</span><span className="sub">{score} / {total}</span></div>
      </div>

      <div className="bc-goofy">{goofy}</div>
      <div className="bc-goofy-sub">{goofySub}</div>

      <p className="bc-result-detail">
        <b>{title}</b> — {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''} sur <b>{total}</b>.
      </p>
      {best && (
        <div className="bc-result-best">🏆 Meilleur : {best.bestRaw || `${best.best}%`} · {best.attempts} tentative{best.attempts > 1 ? 's' : ''}</div>
      )}

      {wrong.length > 0 && (
        <div className="bc-review">
          <h4>À revoir ({wrong.length})</h4>
          {wrong.map((l, i) => (
            <div className="bc-review-item ko" key={i}>
              <div className="q">{renderRich(l.q)}</div>
              <div className="a">Ta réponse : <span className="bad">{l.chosen}</span> — bonne réponse : <span className="good">{l.correct}</span></div>
            </div>
          ))}
        </div>
      )}

      <div className="bc-result-btns" style={{ marginTop: 22 }}>
        <button className="btn" onClick={onRetry}><span>{canContinue ? '↻ Nouvelle manche' : '↻ Recommencer'}</span></button>
        <button className="btn ghost" onClick={onBack}><span>◄ Chapitres</span></button>
      </div>
    </div>
  )
}
