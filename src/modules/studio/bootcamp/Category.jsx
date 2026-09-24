import { useEffect, useState } from 'react'
import { navigate } from '../../../core/router.js'
import PersonaBg from '../../../components/PersonaBg.jsx'
import { loadCategoryData } from './data.js'
import { loadScores } from './storage.js'
import { ROUND, TIERS, shuffle, prepareQuestion } from './helpers.jsx'
import Dominicus from './fun/Dominicus.jsx'
import ChapterList from './views/ChapterList.jsx'
import CardsView from './views/CardsView.jsx'
import QuizSetup from './views/QuizSetup.jsx'
import QuizView from './views/QuizView.jsx'
import ResultView from './views/ResultView.jsx'

/* =====================================================================
   UNE CATÉGORIE — charge son JSON puis enchaîne les vues :
   home (chapitres) | cards | setup | quiz | result
   ===================================================================== */
export default function Category({ category }) {
  const [view, setView] = useState('home')
  const [chapter, setChapter] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [result, setResult] = useState(null)
  const [scores, setScores] = useState(() => loadScores(category.id))

  // Contenu (chapitres, fiches, quiz) chargé à la demande — voir data.js.
  const [chapters, setChapters] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let alive = true
    setLoadError(null)
    loadCategoryData(category).then(
      (data) => { if (alive) setChapters(data) },
      (e) => { if (alive) setLoadError(e) }
    )
    return () => { alive = false }
  }, [category, reloadKey])

  useEffect(() => {
    const inner = document.querySelector('.content-inner')
    if (inner) inner.scrollTop = 0
  }, [view, chapter])

  const openCards = (c) => { setChapter(c); setView('cards') }
  const openSetup = (c) => { setChapter(c); setView('setup') }

  const startChapterQuiz = (c, diff) => {
    // 'tout' = toutes les questions du chapitre, sans plafond ; 'mix' = mélange
    // plafonné à ROUND ; sinon on filtre par difficulté (plafonné à ROUND).
    const pool = diff === 'mix' || diff === 'tout' ? c.quiz : c.quiz.filter((q) => q.difficulty === diff)
    const limit = diff === 'tout' ? pool.length : ROUND
    const questions = shuffle(pool).slice(0, limit).map((raw) => prepareQuestion(raw, c.title))
    const dlab = diff === 'tout' ? 'Tout' : diff === 'mix' ? 'Mélange' : TIERS.find((t) => t.diff === diff)?.label
    const lead = diff === 'tout' ? 'Intégrale' : 'Manche'
    setQuiz({ kind: 'chapter', title: c.title, subtitle: `${lead} · ${dlab} · ${questions.length} questions`, questions, storeKey: c.id, chapter: c, diff })
    setView('quiz')
  }
  const startExam = (size, diff = 'mix') => {
    const all = chapters.flatMap((c) => c.quiz.map((raw) => ({ raw, chap: c.title })))
    const pool = diff === 'mix' ? all : all.filter((x) => x.raw.difficulty === diff)
    const chosen = shuffle(pool).slice(0, Math.min(size, pool.length))
    const questions = chosen.map(({ raw, chap }) => prepareQuestion(raw, chap))
    const dlab = diff === 'mix' ? 'Mélange' : TIERS.find((t) => t.diff === diff)?.label
    setQuiz({ kind: 'exam', title: `Examen blanc · ${questions.length} questions`, subtitle: `Toutes matières · ${dlab} · dans le désordre`, questions, storeKey: 'exam', examSize: size, examDiff: diff })
    setView('quiz')
  }

  const finishQuiz = (score, total, log) => { setResult({ score, total, log }); setView('result') }
  const backChapters = () => { setScores(loadScores(category.id)); setView('home') }
  const backHub = () => navigate('/studio/bootcamp')

  return (
    <div className="bootcamp">
      <PersonaBg label={category.short || 'BOOTCAMP'} />
      <Dominicus active={view === 'cards' || view === 'quiz'} />
      <div className="bc-inner">
        {loadError && (
          <div className="bc-deck-end">
            <div className="bc-deck-end-emoji">⚠️</div>
            <h3>Contenu indisponible</h3>
            <p>Impossible de charger les fiches et les quiz ({String(loadError.message || loadError)}).</p>
            <div className="bc-deck-end-btns">
              <button className="btn" onClick={() => setReloadKey((k) => k + 1)}><span>↻ Réessayer</span></button>
              <button className="btn ghost" onClick={backHub}><span>◄ Retour au Bootcamp</span></button>
            </div>
          </div>
        )}
        {!loadError && !chapters && <p className="bc-hero-tag">Chargement du contenu…</p>}
        {chapters && view === 'home' && (
          <ChapterList category={category} chapters={chapters} scores={scores} onCards={openCards} onQuiz={openSetup} onExam={startExam} onBack={backHub} />
        )}
        {view === 'cards' && chapter && (
          <CardsView category={category} chapter={chapter} onBack={backChapters} onQuiz={() => openSetup(chapter)} />
        )}
        {view === 'setup' && chapter && (
          <QuizSetup chapter={chapter} onBack={backChapters} onStart={(diff) => startChapterQuiz(chapter, diff)} />
        )}
        {view === 'quiz' && quiz && (
          <QuizView category={category} title={quiz.title} subtitle={quiz.subtitle} questions={quiz.questions} onExit={backChapters} onFinish={finishQuiz} />
        )}
        {view === 'result' && result && quiz && (
          <ResultView
            category={category}
            score={result.score} total={result.total} log={result.log}
            title={quiz.title} storeKey={quiz.storeKey} canContinue
            onRetry={() => { if (quiz.kind === 'exam') startExam(quiz.examSize, quiz.examDiff); else startChapterQuiz(quiz.chapter, quiz.diff) }}
            onBack={backChapters}
          />
        )}
      </div>
    </div>
  )
}
