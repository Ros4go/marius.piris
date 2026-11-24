import { useEffect, useMemo, useState } from 'react'
import { TIERS, renderRich } from '../helpers.jsx'
import { loadKnown, persistKnown } from '../storage.js'
import ResourcesPanel from './ResourcesPanel.jsx'

/* =====================================================================
   VUE CARTES (flashcards) — recto/verso, tiers, je maîtrise / à revoir
   ===================================================================== */
export default function CardsView({ category, chapter, onBack, onQuiz }) {
  const [tier, setTier] = useState(0) // 0 = tous
  const [onlyReview, setOnlyReview] = useState(false)
  const [known, setKnown] = useState(() => loadKnown(category.id))
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
    setKnown(next); persistKnown(category.id, next)
    goNext()
  }
  const resetKnown = () => {
    const next = { ...known }
    withIdx.forEach(({ i }) => delete next[keyOf(i)])
    setKnown(next); persistKnown(category.id, next)
    setIdx(0); setFlipped(false)
  }

  const atEnd = idx >= deck.length
  const cur = deck[idx]
  const tierMeta = (t) => TIERS.find((x) => x.id === t) || TIERS[1]

  return (
    <div className="bc-cards">
      <div className="bc-subhead">
        <button className="bc-back" onClick={onBack}><span>◄ Chapitres</span></button>
        <span className="bc-subtitle">{chapter.title}</span>
      </div>

      {/* Filtres par tier */}
      <div className="bc-filters">
        <button className={'bc-fchip' + (tier === 0 ? ' on' : '')} onClick={() => setFilter(0)}>
          Tout <i>{tierCounts[0]}</i>
        </button>
        {TIERS.map((t) => (
          <button key={t.id} className={'bc-fchip ' + t.cls + (tier === t.id ? ' on' : '')} onClick={() => setFilter(t.id)}>
            {t.label} <i>{tierCounts[t.id]}</i>
          </button>
        ))}
        <span className="bc-filters-sep" />
        <button className={'bc-fchip review' + (onlyReview ? ' on' : '')} onClick={() => setOnlyReview((v) => !v)}>
          ↻ À revoir <i>{reviewInTier}</i>
        </button>
        <span className="bc-known-count">✓ {knownInTier} maîtrisée{knownInTier > 1 ? 's' : ''}</span>
      </div>

      {resCount > 0 && (
        <div className="bc-extras">
          <button className="bc-linkbtn" onClick={() => setShowRes((v) => !v)}>
            {showRes ? '▾ Masquer' : '▸ Voir'} les ressources &amp; exemples ({resCount})
          </button>
          {showRes && <ResourcesPanel images={chapter.images} links={chapter.links} />}
        </div>
      )}

      {/* Le paquet */}
      {atEnd ? (
        <div className="bc-deck-end">
          <div className="bc-deck-end-emoji">{reviewInTier === 0 ? '🏆' : '💪'}</div>
          <h3>{reviewInTier === 0 ? 'Paquet maîtrisé !' : 'Fin du paquet'}</h3>
          <p>
            {knownInTier} maîtrisée{knownInTier > 1 ? 's' : ''} · {reviewInTier} à revoir
            {tier !== 0 ? ` (niveau ${tierMeta(tier).label})` : ''}.
          </p>
          <div className="bc-deck-end-btns">
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
          <div className="bc-deck-prog">
            <span>{idx + 1} / {deck.length}</span>
            <div className="bc-prog-bar"><div className="bc-prog-fill" style={{ width: `${(idx / deck.length) * 100}%` }} /></div>
            <button className="bc-linkbtn small" onClick={resetKnown} title="Remettre tout à zéro">réinitialiser</button>
          </div>

          <button
            className={'bc-card' + (flipped ? ' flipped' : '') + (isKnown(cur.i) ? ' isknown' : '')}
            onClick={() => setFlipped((v) => !v)}
            aria-label="Retourner la carte"
          >
            {!flipped ? (
              <div className="bc-card-face cface-front" key="front">
                <span className={'bc-tier-badge ' + tierMeta(cur.f.tier || 2).cls}>{tierMeta(cur.f.tier || 2).label}</span>
                {isKnown(cur.i) && <span className="bc-card-known">✓ maîtrisée</span>}
                <div className="bc-card-front-text">{renderRich(cur.f.front || cur.f.title)}</div>
                <span className="bc-card-hint">clique pour retourner ↻</span>
              </div>
            ) : (
              <div className="bc-card-face cface-back" key="back">
                <div className="bc-card-back-title">{cur.f.title}</div>
                <ul className="bc-keypoints">
                  {(cur.f.keypoints && cur.f.keypoints.length ? cur.f.keypoints : [cur.f.body]).map((k, j) => (
                    <li key={j}>{renderRich(k)}</li>
                  ))}
                </ul>
                {cur.f.versionNote && (
                  <div className="bc-vnote"><span>⚙️</span><span>{category.versionLabel && <b>{category.versionLabel} — </b>}{renderRich(cur.f.versionNote)}</span></div>
                )}
                {cur.f.body && (cur.f.keypoints && cur.f.keypoints.length > 0) && (
                  <div className="bc-detail">
                    <span
                      className="bc-linkbtn"
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setDetail((v) => !v) }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setDetail((v) => !v) } }}
                    >
                      {detail ? '▾ Masquer le détail' : '▸ Détail'}
                    </span>
                    {detail && <p className="bc-detail-body">{renderRich(cur.f.body)}</p>}
                  </div>
                )}
              </div>
            )}
          </button>

          {/* Barre d'actions */}
          <div className="bc-card-actions">
            <button className="bc-navbtn" onClick={goPrev} disabled={idx === 0}>‹ Préc.</button>
            {flipped ? (
              <>
                <button className="bc-mark review" onClick={() => mark(false)}>↻ À revoir</button>
                <button className="bc-mark know" onClick={() => mark(true)}>✓ Je maîtrise</button>
              </>
            ) : (
              <button className="bc-mark reveal" onClick={() => setFlipped(true)}>Voir la réponse</button>
            )}
            <button className="bc-navbtn" onClick={goNext}>Suiv. ›</button>
          </div>
        </>
      ) : (
        <div className="bc-deck-end">
          <div className="bc-deck-end-emoji">🗂️</div>
          <h3>Aucune carte ici</h3>
          <p>Aucune carte pour ce filtre. Change de niveau ou décoche « À revoir ».</p>
          <button className="btn ghost" onClick={() => { setTier(0); setOnlyReview(false) }}><span>Voir toutes les cartes</span></button>
        </div>
      )}

      <div className="bc-cards-foot">
        <button className="btn" onClick={onQuiz}><span>⚡ Lancer le quiz du chapitre ▶</span></button>
      </div>
    </div>
  )
}
