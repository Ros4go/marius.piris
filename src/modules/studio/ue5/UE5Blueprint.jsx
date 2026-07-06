import { useEffect, useMemo, useRef, useState } from 'react'
import { navigate } from '../../../core/router.js'
import PersonaBg from '../../../components/PersonaBg.jsx'
import { CHAPTERS } from './ue5Data.js'
import { matchGlossary } from './glossary.js'
import './ue5.css'

/* ---------------------------------------------------------------------
   Messages "goofy" affichés en fin de quiz — peu importe le résultat.
--------------------------------------------------------------------- */
const GOOFY = [
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
const GOOFY_SUB = [
  'Le contrôle il va rien comprendre.',
  'Blueprint no diff.',
  'On lâche rien.',
  'Encore un run et tu es incollable.',
  'Epic Games devrait te recruter.',
  "C'est pas de la chance, c'est du talent.",
]

const CONFETTI_COLORS = ['#ec0016', '#fdf6ee', '#ffb300', '#61d36f', '#3aa0ff']
const SCORES_KEY = 'ue5_blueprint_scores_v1'
const KNOWN_KEY = 'ue5_cards_known_v1'
const ROUND = 10 // questions max par manche de quiz

// Tiers de difficulté (partagés cartes + quiz)
const TIERS = [
  { id: 1, label: 'Facile', diff: 'facile', cls: 'facile' },
  { id: 2, label: 'Moyen', diff: 'moyen', cls: 'moyen' },
  { id: 3, label: 'Difficile', diff: 'difficile', cls: 'difficile' },
]
const DIFF_TO_TIER = { facile: 1, moyen: 2, difficile: 3 }
const KIND_ICON = { reddit: '👽', forum: '💬', wiki: '📚', youtube: '▶', blog: '✍', doc: '📄' }
const KIND_LABEL = { reddit: 'Reddit', forum: 'Forum', wiki: 'Wiki', youtube: 'YouTube', blog: 'Blog', doc: 'Doc' }

/* ---------- utils ---------- */
const rand = () => Math.random()
function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)]

function loadScores() {
  try { return JSON.parse(localStorage.getItem(SCORES_KEY)) || {} } catch { return {} }
}
function saveScore(key, pct, raw) {
  const s = loadScores()
  const prev = s[key] || { best: 0, attempts: 0 }
  s[key] = { best: Math.max(prev.best, pct), bestRaw: pct >= prev.best ? raw : prev.bestRaw, attempts: prev.attempts + 1 }
  try { localStorage.setItem(SCORES_KEY, JSON.stringify(s)) } catch { /* quota */ }
  return s[key]
}
function loadKnown() {
  try { return JSON.parse(localStorage.getItem(KNOWN_KEY)) || {} } catch { return {} }
}
function persistKnown(map) {
  try { localStorage.setItem(KNOWN_KEY, JSON.stringify(map)) } catch { /* quota */ }
}

// Rendu "markdown-léger" : **gras** et `code`
function renderRich(text) {
  if (!text) return null
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i}>{p.slice(1, -1)}</code>
    return <span key={i}>{p}</span>
  })
}

// Question brute -> jouable (choix mélangés, bon index recalculé)
function prepareQuestion(raw, chapTitle) {
  const correctText = raw.choices[raw.answer]
  const choices = shuffle(raw.choices)
  return {
    q: raw.q, topic: raw.topic, difficulty: raw.difficulty || 'moyen',
    explain: raw.explain, source: raw.source, def: raw.def, chapter: chapTitle,
    choices, answer: choices.indexOf(correctText),
  }
}

// Panneau ressources : images hotlinkées (onError masque une image cassée) + liens communautaires
function ResourcesPanel({ images = [], links = [] }) {
  return (
    <div className="ue5-res">
      {images.length > 0 && (
        <div className="ue5-res-imgs">
          {images.map((im, i) => (
            <a className="ue5-res-img" key={i} href={im.link || im.url} target="_blank" rel="noopener noreferrer">
              <img
                src={im.url}
                alt={im.caption || 'illustration'}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { const w = e.currentTarget.closest('.ue5-res-img'); if (w) w.style.display = 'none' }}
              />
              {(im.caption || im.credit) && (
                <span className="cap">{im.caption}{im.credit ? ` — ${im.credit}` : ''}</span>
              )}
            </a>
          ))}
        </div>
      )}
      {links.length > 0 && (
        <div className="ue5-res-links">
          {links.map((l, i) => (
            <a className={'ue5-reslink ' + (l.kind || 'doc')} key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}>
              <span className="ic">{KIND_ICON[l.kind] || '🔗'}</span>
              <span className="lab">{l.label}</span>
              <span className="knd">{KIND_LABEL[l.kind] || 'Lien'}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/* =====================================================================
   VUE CARTES (flashcards) — recto/verso, tiers, je maîtrise / à revoir
   ===================================================================== */
function CardsView({ chapter, onBack, onQuiz }) {
  const [tier, setTier] = useState(0) // 0 = tous
  const [onlyReview, setOnlyReview] = useState(false)
  const [known, setKnown] = useState(loadKnown)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [detail, setDetail] = useState(false)

  const [showRes, setShowRes] = useState(false)
  const resCount = (chapter.images?.length || 0) + (chapter.links?.length || 0)

  const keyOf = (i) => `${chapter.id}:${i}`
  const isKnown = (i) => !!known[keyOf(i)]

  const withIdx = useMemo(() => chapter.fiches.map((f, i) => ({ f, i })), [chapter])
  const tierCounts = useMemo(() => {
    const c = { 0: withIdx.length, 1: 0, 2: 0, 3: 0 }
    withIdx.forEach(({ f }) => { c[f.tier || 2]++ })
    return c
  }, [withIdx])

  const byTier = useMemo(
    () => withIdx.filter(({ f }) => tier === 0 || (f.tier || 2) === tier),
    [withIdx, tier]
  )
  const deck = useMemo(
    () => (onlyReview ? byTier.filter(({ i }) => !isKnown(i)) : byTier),
    [byTier, onlyReview, known]
  )
  const knownInTier = byTier.filter(({ i }) => isKnown(i)).length
  const reviewInTier = byTier.length - knownInTier

  // reset la position quand on change de filtre
  useEffect(() => { setIdx(0); setFlipped(false); setDetail(false) }, [tier, onlyReview])

  const setFilter = (t) => { setTier(t) }
  const goNext = () => { setFlipped(false); setDetail(false); setIdx((i) => i + 1) }
  const goPrev = () => { setFlipped(false); setDetail(false); setIdx((i) => Math.max(0, i - 1)) }
  const mark = (val) => {
    const cur = deck[idx]
    if (!cur) return
    const next = { ...known }
    if (val) next[keyOf(cur.i)] = true
    else delete next[keyOf(cur.i)]
    setKnown(next); persistKnown(next)
    goNext()
  }
  const resetKnown = () => {
    const next = { ...known }
    withIdx.forEach(({ i }) => delete next[keyOf(i)])
    setKnown(next); persistKnown(next)
    setIdx(0); setFlipped(false)
  }

  const atEnd = idx >= deck.length
  const cur = deck[idx]
  const tierMeta = (t) => TIERS.find((x) => x.id === t) || TIERS[1]

  return (
    <div className="ue5-cards">
      <div className="ue5-subhead">
        <button className="ue5-back" onClick={onBack}><span>◄ Chapitres</span></button>
        <span className="ue5-subtitle">{chapter.title}</span>
      </div>

      {/* Filtres par tier */}
      <div className="ue5-filters">
        <button className={'ue5-fchip' + (tier === 0 ? ' on' : '')} onClick={() => setFilter(0)}>
          Tout <i>{tierCounts[0]}</i>
        </button>
        {TIERS.map((t) => (
          <button key={t.id} className={'ue5-fchip ' + t.cls + (tier === t.id ? ' on' : '')} onClick={() => setFilter(t.id)}>
            {t.label} <i>{tierCounts[t.id]}</i>
          </button>
        ))}
        <span className="ue5-filters-sep" />
        <button className={'ue5-fchip review' + (onlyReview ? ' on' : '')} onClick={() => setOnlyReview((v) => !v)}>
          ↻ À revoir <i>{reviewInTier}</i>
        </button>
        <span className="ue5-known-count">✓ {knownInTier} maîtrisée{knownInTier > 1 ? 's' : ''}</span>
      </div>

      {resCount > 0 && (
        <div className="ue5-extras">
          <button className="ue5-linkbtn" onClick={() => setShowRes((v) => !v)}>
            {showRes ? '▾ Masquer' : '▸ Voir'} les ressources &amp; exemples ({resCount})
          </button>
          {showRes && <ResourcesPanel images={chapter.images} links={chapter.links} />}
        </div>
      )}

      {/* Le paquet */}
      {atEnd ? (
        <div className="ue5-deck-end">
          <div className="ue5-deck-end-emoji">{reviewInTier === 0 ? '🏆' : '💪'}</div>
          <h3>{reviewInTier === 0 ? 'Paquet maîtrisé !' : 'Fin du paquet'}</h3>
          <p>
            {knownInTier} maîtrisée{knownInTier > 1 ? 's' : ''} · {reviewInTier} à revoir
            {tier !== 0 ? ` (niveau ${tierMeta(tier).label})` : ''}.
          </p>
          <div className="ue5-deck-end-btns">
            {reviewInTier > 0 && (
              <button className="btn" onClick={() => { setOnlyReview(true); setIdx(0); setFlipped(false) }}>
                <span>🎯 Réviser mes {reviewInTier} à revoir</span>
              </button>
            )}
            <button className="btn ghost" onClick={() => { setIdx(0); setFlipped(false) }}><span>↻ Recommencer le paquet</span></button>
            <button className="btn ghost" onClick={onQuiz}><span>⚡ Passer au quiz</span></button>
          </div>
        </div>
      ) : cur ? (
        <>
          <div className="ue5-deck-prog">
            <span>{idx + 1} / {deck.length}</span>
            <div className="ue5-prog-bar"><div className="ue5-prog-fill" style={{ width: `${(idx / deck.length) * 100}%` }} /></div>
            <button className="ue5-linkbtn small" onClick={resetKnown} title="Remettre tout à zéro">réinitialiser</button>
          </div>

          <button
            className={'ue5-card' + (flipped ? ' flipped' : '') + (isKnown(cur.i) ? ' isknown' : '')}
            onClick={() => setFlipped((v) => !v)}
            aria-label="Retourner la carte"
          >
            {!flipped ? (
              <div className="ue5-card-face cface-front" key="front">
                <span className={'ue5-tier-badge ' + tierMeta(cur.f.tier || 2).cls}>{tierMeta(cur.f.tier || 2).label}</span>
                {isKnown(cur.i) && <span className="ue5-card-known">✓ maîtrisée</span>}
                <div className="ue5-card-front-text">{renderRich(cur.f.front || cur.f.title)}</div>
                <span className="ue5-card-hint">clique pour retourner ↻</span>
              </div>
            ) : (
              <div className="ue5-card-face cface-back" key="back">
                <div className="ue5-card-back-title">{cur.f.title}</div>
                <ul className="ue5-keypoints">
                  {(cur.f.keypoints && cur.f.keypoints.length ? cur.f.keypoints : [cur.f.body]).map((k, j) => (
                    <li key={j}>{renderRich(k)}</li>
                  ))}
                </ul>
                {cur.f.versionNote && (
                  <div className="ue5-vnote"><span>⚙️</span><span><b>UE 5.4 — </b>{renderRich(cur.f.versionNote)}</span></div>
                )}
                {cur.f.body && (cur.f.keypoints && cur.f.keypoints.length > 0) && (
                  <div className="ue5-detail">
                    <span
                      className="ue5-linkbtn"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setDetail((v) => !v) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDetail((v) => !v) } }}
                    >
                      {detail ? '▾ Masquer le détail' : '▸ Détail'}
                    </span>
                    {detail && <p className="ue5-detail-body">{renderRich(cur.f.body)}</p>}
                  </div>
                )}
              </div>
            )}
          </button>

          {/* Barre d'actions */}
          <div className="ue5-card-actions">
            <button className="ue5-navbtn" onClick={goPrev} disabled={idx === 0}>‹ Préc.</button>
            {flipped ? (
              <>
                <button className="ue5-mark review" onClick={() => mark(false)}>↻ À revoir</button>
                <button className="ue5-mark know" onClick={() => mark(true)}>✓ Je maîtrise</button>
              </>
            ) : (
              <button className="ue5-mark reveal" onClick={() => setFlipped(true)}>Voir la réponse</button>
            )}
            <button className="ue5-navbtn" onClick={goNext}>Suiv. ›</button>
          </div>
        </>
      ) : (
        <div className="ue5-deck-end">
          <div className="ue5-deck-end-emoji">🗂️</div>
          <h3>Aucune carte ici</h3>
          <p>Aucune carte pour ce filtre. Change de niveau ou décoche « À revoir ».</p>
          <button className="btn ghost" onClick={() => { setTier(0); setOnlyReview(false) }}><span>Voir toutes les cartes</span></button>
        </div>
      )}

      <div className="ue5-cards-foot">
        <button className="btn" onClick={onQuiz}><span>⚡ Lancer le quiz du chapitre ▶</span></button>
      </div>
    </div>
  )
}

/* =====================================================================
   VUE RÉGLAGE DU QUIZ — choix de la difficulté (manche de 10)
   ===================================================================== */
function QuizSetup({ chapter, onBack, onStart }) {
  const counts = useMemo(() => {
    const c = { facile: 0, moyen: 0, difficile: 0 }
    chapter.quiz.forEach((q) => { c[q.difficulty] = (c[q.difficulty] || 0) + 1 })
    return c
  }, [chapter])
  const total = chapter.quiz.length

  const opt = (diff, label, cls, n) => (
    <button className={'ue5-diffopt ' + cls + (n === 0 ? ' disabled' : '')} disabled={n === 0} onClick={() => onStart(diff)}>
      <span className="d-lab">{label}</span>
      <span className="d-n">{n} question{n > 1 ? 's' : ''}</span>
      <span className="d-go">jusqu'à {Math.min(ROUND, n)} par manche ▶</span>
    </button>
  )

  return (
    <div className="ue5-setup">
      <div className="ue5-subhead">
        <button className="ue5-back" onClick={onBack}><span>◄ Chapitres</span></button>
        <span className="ue5-subtitle">{chapter.title}</span>
      </div>
      <p className="ue5-hero-tag" style={{ marginBottom: 18 }}>
        Choisis un niveau. Chaque manche fait <b>{ROUND} questions max</b>, tirées au hasard.
      </p>
      <div className="ue5-diffgrid">
        {opt('mix', 'Mélange', 'mix', total)}
        {opt('facile', 'Facile', 'facile', counts.facile)}
        {opt('moyen', 'Moyen', 'moyen', counts.moyen)}
        {opt('difficile', 'Difficile', 'difficile', counts.difficile)}
      </div>
    </div>
  )
}

/* =====================================================================
   VUE QUIZ
   ===================================================================== */
function QuizView({ title, subtitle, questions, onExit, onFinish }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [log, setLog] = useState([])

  const q = questions[idx]
  const answered = selected !== null
  const isLast = idx === questions.length - 1
  // Glossaire : définitions des termes complexes présents dans la question (sinon rien).
  const glossHits = answered ? matchGlossary(q.q + ' ' + q.choices.join(' ')) : []

  const choose = (i) => {
    if (answered) return
    const ok = i === q.answer
    setSelected(i)
    if (ok) setScore((s) => s + 1)
    setLog((l) => [...l, { q: q.q, chosen: q.choices[i], correct: q.choices[q.answer], ok }])
  }
  const next = () => {
    if (isLast) { onFinish(score, questions.length, log); return }
    setIdx((i) => i + 1); setSelected(null)
  }

  return (
    <div className="ue5-quiz">
      <div className="ue5-subhead" style={{ marginBottom: 12 }}>
        <button className="ue5-back" onClick={onExit}><span>◄ Quitter</span></button>
        <span className="ue5-subtitle" style={{ fontSize: 'clamp(18px,2.6vw,24px)' }}>{title}</span>
      </div>
      {subtitle && <div className="ue5-quiz-sub">{subtitle}</div>}

      <div className="ue5-prog">
        <span className="ue5-prog-txt">{idx + 1}/{questions.length}</span>
        <div className="ue5-prog-bar"><div className="ue5-prog-fill" style={{ width: `${(idx / questions.length) * 100}%` }} /></div>
        <span className="ue5-prog-score">{score} pt{score > 1 ? 's' : ''}</span>
      </div>

      <div className="ue5-qcard" key={idx}>
        <span className={'ue5-qdiff ' + q.difficulty}>{q.difficulty}</span>
        {q.topic && <span className="ue5-qtopic">{q.topic}</span>}
        <div className="ue5-qtext">{renderRich(q.q)}</div>

        <div className="ue5-choices">
          {q.choices.map((c, i) => {
            let cls = 'ue5-choice'
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
          <div className={'ue5-explain ' + (selected === q.answer ? 'ok' : 'ko')}>
            <div className="head">{selected === q.answer ? '✓ Correct !' : '✕ Raté'}</div>
            <p>{renderRich(q.explain)}</p>
            {q.source && (
              <div className="ue5-sources" style={{ marginTop: 8 }}>
                <a className="ue5-src" href={q.source.url} target="_blank" rel="noopener noreferrer">{q.source.label}</a>
              </div>
            )}
          </div>
        )}

        {answered && glossHits.map((g) => (
          <div className="ue5-def" key={g.term}>
            <span className="ue5-def-head">💡 Définition · {g.term}</span>
            <p>{renderRich(g.def)}</p>
          </div>
        ))}
      </div>

      {answered && (
        <div className="ue5-quiz-foot">
          <button className="btn" onClick={next}><span>{isLast ? 'Voir le résultat ▶' : 'Suivant ▶'}</span></button>
        </div>
      )}
    </div>
  )
}

/* =====================================================================
   ÉCRAN DE RÉSULTAT — goofy + confettis
   ===================================================================== */
function ResultView({ score, total, log, title, storeKey, canContinue, onRetry, onBack }) {
  const pct = Math.round((score / total) * 100)
  const goofy = useMemo(() => pick(GOOFY), [])
  const goofySub = useMemo(() => pick(GOOFY_SUB), [])
  const [best, setBest] = useState(null)
  const savedRef = useRef(false)
  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true
    setBest(saveScore(storeKey, pct, `${score}/${total}`))
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
    <div className="ue5-result">
      <div className="ue5-confetti" aria-hidden="true">
        {confetti.map((c, i) => (
          <i key={i} style={{ left: c.left + '%', background: c.color, animationDelay: c.delay + 's', animationDuration: c.dur + 's', transform: `rotate(${c.rot}deg)` }} />
        ))}
      </div>
      <div className="ue5-result-ring">
        <svg viewBox="0 0 180 180">
          <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(253,246,238,0.1)" strokeWidth="12" />
          <circle cx="90" cy="90" r="78" fill="none" stroke="#ec0016" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
        </svg>
        <div className="pct"><span className="big">{pct}%</span><span className="sub">{score} / {total}</span></div>
      </div>

      <div className="ue5-goofy">{goofy}</div>
      <div className="ue5-goofy-sub">{goofySub}</div>

      <p className="ue5-result-detail">
        <b>{title}</b> — {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''} sur <b>{total}</b>.
      </p>
      {best && (
        <div className="ue5-result-best">🏆 Meilleur : {best.bestRaw || `${best.best}%`} · {best.attempts} tentative{best.attempts > 1 ? 's' : ''}</div>
      )}

      {wrong.length > 0 && (
        <div className="ue5-review">
          <h4>À revoir ({wrong.length})</h4>
          {wrong.map((l, i) => (
            <div className="ue5-review-item ko" key={i}>
              <div className="q">{renderRich(l.q)}</div>
              <div className="a">Ta réponse : <span className="bad">{l.chosen}</span> — bonne réponse : <span className="good">{l.correct}</span></div>
            </div>
          ))}
        </div>
      )}

      <div className="ue5-result-btns" style={{ marginTop: 22 }}>
        <button className="btn" onClick={onRetry}><span>{canContinue ? '↻ Nouvelle manche' : '↻ Recommencer'}</span></button>
        <button className="btn ghost" onClick={onBack}><span>◄ Chapitres</span></button>
      </div>
    </div>
  )
}

/* =====================================================================
   VUE ACCUEIL (grille des chapitres)
   ===================================================================== */
function Home({ scores, onCards, onQuiz, onExam, onBackAtelier }) {
  return (
    <div>
      <button className="ue5-back" style={{ marginBottom: 16 }} onClick={onBackAtelier}><span>◄ Retour à l'Atelier</span></button>
      <div className="ue5-hero">
        <div>
          <div className="module-sub">UE5 · BLUEPRINT</div>
          <h1 className="module-head">Blueprint Bootcamp</h1>
        </div>
        <div className="ue5-badge-ue"><span>Unreal Engine <b>5.4</b></span></div>
      </div>

      <div className="ue5-chapters">
        <div className="ue5-exam-card">
          <div className="ue5-exam-txt">
            <h3>Examen <b>blanc</b></h3>
            <p>Questions tirées au hasard dans TOUS les chapitres. La meilleure simulation du jour J.</p>
          </div>
          <div className="ue5-exam-btns">
            <button className="btn ghost" onClick={() => onExam(15)}><span>Éclair · 15 Q</span></button>
            <button className="btn" onClick={() => onExam(30)}><span>Grand examen · 30 Q ▶</span></button>
          </div>
        </div>

        {CHAPTERS.map((c) => {
          const sc = scores[c.id]
          return (
            <div className={'ue5-chap' + (c.special ? ' special' : '')} key={c.id}>
              <div className="ue5-chap-top">
                <span className="ue5-chap-num">{c.num}</span>
                <span className="ue5-chap-title">{c.title}</span>
              </div>
              <div className="ue5-chap-meta">
                <span><b>{c.fiches.length}</b> cartes</span><span>·</span><span><b>{c.quiz.length}</b> questions</span>
                {sc && sc.best > 0 && (<><span>·</span><span className="ue5-chap-best">🏆 {sc.best}%</span></>)}
              </div>
              <div className="ue5-chap-actions">
                <button className="ue5-mini rev" onClick={() => onCards(c)}><span>📖 Cartes</span></button>
                <button className="ue5-mini quiz" onClick={() => onQuiz(c)}><span>⚡ Quiz</span></button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* =====================================================================
   COMPOSANT PRINCIPAL
   ===================================================================== */
export default function UE5Blueprint() {
  const [view, setView] = useState('home') // home | cards | setup | quiz | result
  const [chapter, setChapter] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [result, setResult] = useState(null)
  const [scores, setScores] = useState(loadScores())

  useEffect(() => {
    const inner = document.querySelector('.content-inner')
    if (inner) inner.scrollTop = 0
  }, [view, chapter])

  const openCards = (c) => { setChapter(c); setView('cards') }
  const openSetup = (c) => { setChapter(c); setView('setup') }

  const startChapterQuiz = (c, diff) => {
    const pool = diff === 'mix' ? c.quiz : c.quiz.filter((q) => q.difficulty === diff)
    const questions = shuffle(pool).slice(0, ROUND).map((raw) => prepareQuestion(raw, c.title))
    const dlab = diff === 'mix' ? 'Mélange' : TIERS.find((t) => t.diff === diff)?.label
    setQuiz({ kind: 'chapter', title: c.title, subtitle: `Manche · ${dlab} · ${questions.length} questions`, questions, storeKey: c.id, chapter: c, diff })
    setView('quiz')
  }
  const startExam = (size) => {
    const all = CHAPTERS.flatMap((c) => c.quiz.map((raw) => ({ raw, chap: c.title })))
    const chosen = shuffle(all).slice(0, Math.min(size, all.length))
    const questions = chosen.map(({ raw, chap }) => prepareQuestion(raw, chap))
    setQuiz({ kind: 'exam', title: `Examen blanc · ${questions.length} questions`, subtitle: 'Toutes matières, dans le désordre', questions, storeKey: 'exam', examSize: size })
    setView('quiz')
  }

  const finishQuiz = (score, total, log) => { setResult({ score, total, log }); setView('result') }
  const backHome = () => { setScores(loadScores()); setChapter(null); setView('home') }
  const backChapters = () => { setScores(loadScores()); setView('home') }

  return (
    <div className="ue5">
      <PersonaBg label="UE5" />
      <div className="ue5-inner">
        {view === 'home' && (
          <Home scores={scores} onCards={openCards} onQuiz={openSetup} onExam={startExam} onBackAtelier={() => navigate('/studio')} />
        )}
        {view === 'cards' && chapter && (
          <CardsView chapter={chapter} onBack={backChapters} onQuiz={() => openSetup(chapter)} />
        )}
        {view === 'setup' && chapter && (
          <QuizSetup chapter={chapter} onBack={backChapters} onStart={(diff) => startChapterQuiz(chapter, diff)} />
        )}
        {view === 'quiz' && quiz && (
          <QuizView title={quiz.title} subtitle={quiz.subtitle} questions={quiz.questions} onExit={backChapters} onFinish={finishQuiz} />
        )}
        {view === 'result' && result && quiz && (
          <ResultView
            score={result.score} total={result.total} log={result.log}
            title={quiz.title} storeKey={quiz.storeKey} canContinue
            onRetry={() => { if (quiz.kind === 'exam') startExam(quiz.examSize); else startChapterQuiz(quiz.chapter, quiz.diff) }}
            onBack={backChapters}
          />
        )}
      </div>
    </div>
  )
}
