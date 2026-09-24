import { useState } from 'react'
import { navigate } from '../../../core/router.js'
import PersonaBg from '../../../components/PersonaBg.jsx'
import { CATEGORIES } from './categories.js'
import { loadScores } from './storage.js'
import FlappyGame from './fun/FlappyGame.jsx'

/* =====================================================================
   ACCUEIL DU BOOTCAMP — la liste des catégories (registre categories.js).
   Le contenu d'une catégorie n'est chargé qu'en l'ouvrant.
   ===================================================================== */
export default function Hub() {
  const [flappy, setFlappy] = useState(false)
  const n = CATEGORIES.length

  return (
    <div className="bootcamp">
      <PersonaBg label="BOOTCAMP" />
      <div className="bc-inner">
        {flappy && <FlappyGame onClose={() => setFlappy(false)} />}
        <button className="bc-back" style={{ marginBottom: 16 }} onClick={() => navigate('/studio')}><span>◄ Retour à l'Atelier</span></button>

        <div className="bc-hero">
          <div>
            <div className="module-sub">RÉVISION · FICHES + QUIZ</div>
            <h1 className="module-head">Game Dev Bootcamp</h1>
            <p className="bc-hero-tag">
              Une catégorie = des chapitres, chacun avec ses <b>cartes mémo</b>, son <b>quiz</b> et un <b>examen blanc</b>.
              Ta progression reste sur cet appareil.
            </p>
          </div>
          <button className="sp-idle-launch" onClick={() => setFlappy(true)} title="Clique le poulet : Super Poulet Flappy !">
            <span className="sp-bird sp-idle" />
            <span className="sp-idle-hint">▸ jouer</span>
          </button>
          <div className="bc-badge"><span><b>{n}</b> catégorie{n > 1 ? 's' : ''}</span></div>
        </div>

        <div className="bc-chapters">
          {CATEGORIES.map((cat) => {
            const exam = loadScores(cat.id).exam
            return (
              <div className="bc-chap" key={cat.id}>
                <div className="bc-chap-top">
                  <span className="bc-chap-num">{cat.num}</span>
                  <span className="bc-chap-title">{cat.title}</span>
                </div>
                {cat.tagline && <p className="bc-chap-sum">{cat.tagline}</p>}
                <div className="bc-chap-meta">
                  {(cat.tags || []).map((t, i) => (<span key={t}>{i > 0 && '· '}{t}</span>))}
                  {exam && exam.best > 0 && (<><span>·</span><span className="bc-chap-best">🏆 examen {exam.best}%</span></>)}
                </div>
                <div className="bc-chap-actions">
                  <button className="bc-mini rev" onClick={() => navigate(`/studio/bootcamp/${cat.id}`)}><span>📖 Ouvrir ▶</span></button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
