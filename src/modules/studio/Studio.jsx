import { Suspense, useEffect } from 'react'
import { useRoute, navigate } from '../../core/router.js'
import PersonaBg from '../../shell/PersonaBg.jsx'
import ErrorBoundary from '../../shell/ErrorBoundary.jsx'
import { CATALOG } from './catalog.js'

// Anciennes URL internes conservées.
const REDIRECTS = {
  '/studio/ue5': '/studio/bootcamp/ue5-blueprint', // ex module « Blueprint Bootcamp »
}

// Redirection déclarative (appeler navigate() pendant le rendu est interdit).
function Redirect({ to }) {
  useEffect(() => { navigate(to) }, [to])
  return null
}

// Mots défilants de la bande verticale (droite) — ambiance arcade / catalogue.
const ATELIER_WORDS = [
  'Arcade', 'Jouer', '1 Avenue Frochot', 'Echoes of Above', 'Worm With a Shotgun', 'Casting Scales', 'Mytho-Logie',
  'Frometons', 'Neuvième Vie', 'Pot of Greed', 'Super Sushi',
  'MarousFive', 'Idle', 'Plateforme', 'Rogue-lite', 'Rythme', 'Guitare', 'Bootcamp',
  'Unity', 'Godot', 'itch.io', 'High Score', 'Combo', 'Insert Coin',
]

// Pixels/braises qui montent en fond (ambiance arcade) — positions/vitesses fixes.
const FX = [
  { l: 6, s: 5, d: 13, t: 0 }, { l: 14, s: 7, d: 17, t: -4 }, { l: 22, s: 4, d: 11, t: -8 },
  { l: 31, s: 6, d: 15, t: -2 }, { l: 42, s: 5, d: 19, t: -10 }, { l: 53, s: 8, d: 14, t: -6 },
  { l: 61, s: 4, d: 12, t: -3 }, { l: 69, s: 6, d: 18, t: -9 }, { l: 77, s: 5, d: 16, t: -1 },
  { l: 85, s: 7, d: 13, t: -7 }, { l: 92, s: 4, d: 20, t: -5 }, { l: 38, s: 4, d: 21, t: -13 },
  { l: 48, s: 6, d: 12, t: -11 }, { l: 18, s: 5, d: 22, t: -15 }, { l: 64, s: 5, d: 17, t: -14 },
  { l: 8, s: 6, d: 19, t: -12 },
]


// One slanted roster panel — character-select style.
function Panel({ item, num }) {
  const external = item.kind === 'external'
  const open = () => {
    if (external) window.open(item.href, '_blank', 'noopener,noreferrer')
    else navigate(item.path)
  }
  return (
    <button
      className={'rpanel ' + (item.cat === 'outil' ? 'outil' : 'jeu')}
      style={{ animationDelay: `${(parseInt(num, 10) - 1) * 0.06}s` }}
      onClick={open}
      title={item.title}
    >
      <div className="rpanel-inner">
        <div
          className={'rpanel-media' + (item.image ? '' : ' noimg')}
          style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}
        >
          {!item.image && <span className="rpanel-emoji" aria-hidden="true">{item.icon || '▣'}</span>}
        </div>
        {/* numéro hors de l'image → non affecté par le Ken Burns */}
        <span className="rpanel-num" aria-hidden="true">{num}</span>
        <div className="rpanel-body">
          <div className="rpanel-title">{item.title}</div>
          <div className="rpanel-chips">
            {item.tags.slice(0, 3).map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          <p className="rpanel-tagline">{item.tagline}</p>
          <span className="rpanel-cta">
            {external ? 'Ouvrir' : 'Jouer'} {external ? '↗' : '▶'}
          </span>
        </div>
      </div>
    </button>
  )
}

// Combined roster: jeux on the left (\), outils on the right (/).
function Roster({ jeux, outils }) {
  return (
    <div>
      <div className="roster-head">
        <span className="roster-title">Jeux<i>{jeux.length}</i></span>
        <span className="roster-head-sep" aria-hidden="true" />
        <span className="roster-title">Outils<i>{outils.length}</i></span>
      </div>
      <div className="roster">
        <span className="carlabel" aria-hidden="true">Jeux</span>
        <div className="roster-side roster-jeux">
          {jeux.map((it, i) => (
            <Panel key={it.id} item={it} num={String(i + 1).padStart(2, '0')} />
          ))}
        </div>
        <div className="roster-sep" aria-hidden="true" />
        <span className="carlabel" aria-hidden="true">Outils</span>
        <div className="roster-side roster-outils">
          {outils.map((it, i) => (
            <Panel key={it.id} item={it} num={String(i + 1).padStart(2, '0')} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Studio() {
  const route = useRoute()

  if (REDIRECTS[route]) return <Redirect to={REDIRECTS[route]} />

  // Page React interne du catalogue (et ses sous-routes, ex. /studio/bootcamp/cuda).
  const page = CATALOG.find(
    (it) => it.kind === 'route' && (route === it.path || route.startsWith(it.path + '/'))
  )
  if (page) {
    const Page = page.component
    const content = (
      <ErrorBoundary key={page.id}>
        <Suspense fallback={null}>
          <Page />
        </Suspense>
      </ErrorBoundary>
    )
    if (!page.back) return content
    return (
      <div>
        <button className="btn ghost mb-6" onClick={() => navigate('/studio')}>
          <span>◄ Retour</span>
        </button>
        {content}
      </div>
    )
  }

  return (
    <div className="studio">
      <PersonaBg />
      <div className="studio-fx" aria-hidden="true">
        {FX.map((p, i) => (
          <span
            key={i}
            style={{ left: p.l + '%', width: p.s, height: p.s, animationDuration: p.d + 's', animationDelay: p.t + 's' }}
          />
        ))}
      </div>
      <div className="studio-inner">
        <div className="module-sub">JEUX &amp; OUTILS</div>
        <h1 className="module-head">L'Atelier</h1>
        <Roster
          jeux={CATALOG.filter((i) => i.cat === 'jeu')}
          outils={CATALOG.filter((i) => i.cat === 'outil')}
        />
      </div>
      <aside className="kw-band" aria-hidden="true">
        <div className="kw-track">
          {ATELIER_WORDS.concat(ATELIER_WORDS).map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      </aside>
    </div>
  )
}
