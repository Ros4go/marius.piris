import { useRoute, navigate, segments } from '../../core/router.js'
import FrometonsGame from '../games/frometons/FrometonsGame.jsx'

// Combined "Jeux & Outils" hub. Everything interactive lives here, one click away.
//
// AJOUTER UN MODULE : une entrée dans CATALOG suffit.
//   - cat: 'jeu' | 'outil'  (section d'affichage)
//   - page React interne   -> { kind: 'route', path: '/studio/xxx' }  (+ rendu ci-dessous)
//   - page autonome / lien -> { kind: 'external', href: '/xxx.html' }
//   - image OU icon (emoji) pour la vignette
const CATALOG = [
  {
    id: 'frometons-clicker',
    cat: 'jeu',
    title: 'Frometons Clicker',
    tagline: 'Jeu incrémental : produis des frometons et gère un marché fromager.',
    image: '/assets/images/Fromecoin.png',
    fit: 'contain',
    kind: 'route',
    path: '/studio/frometons',
    tags: ['Idle', 'React', 'Web'],
  },
  {
    id: 'neuvieme-vie',
    cat: 'jeu',
    title: 'La Neuvième Vie',
    tagline: "Jeu d'aventure et de plateforme 2D, 100% JavaScript.",
    image: '/NeuviemeVie/imageLogo/Cat.png',
    fit: 'contain',
    kind: 'external',
    href: '/NeuviemeVie/index.html',
    tags: ['Plateforme', '2D', 'JavaScript'],
  },
  {
    id: 'pot-of-greed',
    cat: 'jeu',
    title: 'Pot Of Greed',
    tagline: "Rogue-lite 2D solo : combinaison procédurale d'objets et inventaire.",
    image: 'https://img.itch.zone/aW1hZ2UvMjc5MTY4OS8yMDY1ODI2NS5wbmc=/original/4xn%2Bh4.png',
    kind: 'external',
    href: 'https://shazalsadepts.itch.io/pot-of-greed',
    tags: ['Rogue-lite', 'Unity', 'itch.io'],
  },
  {
    id: 'super-sushi-speed',
    cat: 'jeu',
    title: 'Super Sushi Speed',
    tagline: 'Jeu de rythme : un sushi mutant dans des niveaux semi-procéduraux.',
    image: 'https://img.itch.zone/aW1hZ2UvMjUwMTAwNS8xNDg1NzU5MS5wbmc=/original/SxiYq9.png',
    kind: 'external',
    href: 'https://shazalsadepts.itch.io/super-sushi-speed',
    tags: ['Rythme', 'Godot', 'itch.io'],
  },
  {
    id: 'guitare',
    cat: 'outil',
    title: 'MarousFive',
    tagline: 'Manche & modes, accords + doigtés, jeu de notes et métronome.',
    icon: '🎸',
    kind: 'external',
    href: '/guitare.html',
    tags: ['Guitare', 'Modes', 'Métronome'],
  },
]

function Strip({ item, num }) {
  const external = item.kind === 'external'
  const open = () => {
    if (external) window.open(item.href, '_blank', 'noopener,noreferrer')
    else navigate(item.path)
  }
  return (
    <button
      className="gstrip"
      style={{ animationDelay: `${(parseInt(num, 10) - 1) * 0.07}s` }}
      onClick={open}
    >
      <div className="gstrip-halftone" />

      <div className="gstrip-content">
        <span className="gstrip-num" aria-hidden="true">{num}</span>
        <div className="gstrip-main">
          <div className="gstrip-title">{item.title}</div>
          <p className="gstrip-tagline">{item.tagline}</p>
        </div>
        <div className="gstrip-right">
          <div className="gstrip-chips">
            {item.tags.slice(0, 3).map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
          </div>
          <span className="gstrip-cta">
            <span>{external ? 'Ouvrir' : 'Jouer'}</span>
            <span className="gstrip-arrow">{external ? '↗' : '▶'}</span>
          </span>
        </div>
      </div>

      <div className="gstrip-band">
        {item.image ? (
          <img
            src={item.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <span className="gstrip-band-icon">{item.icon || '▣'}</span>
        )}
        <div className="gstrip-band-halftone" />
      </div>
    </button>
  )
}

function Section({ label, items }) {
  return (
    <div style={{ marginBottom: 38 }}>
      <span className="module-sub" style={{ display: 'block', marginBottom: 16 }}>
        {label}
      </span>
      <div className="studio-strips">
        {items.map((it, i) => (
          <Strip key={it.id} item={it} num={String(i + 1).padStart(2, '0')} />
        ))}
      </div>
    </div>
  )
}

export default function Studio() {
  const route = useRoute()
  const seg = segments(route) // ['studio'] or ['studio','frometons']

  if (seg[1] === 'frometons') {
    return (
      <div>
        <button
          className="btn ghost mb-6"
          onClick={() => {
            navigate('/studio')
          }}
        >
          <span>◄ Retour</span>
        </button>
        <FrometonsGame />
      </div>
    )
  }

  return (
    <div className="studio">
      <div className="studio-bg" aria-hidden="true">
        <span className="studio-bar b1" />
        <span className="studio-bar b2" />
        <span className="studio-bar b3" />
      </div>
      <div className="studio-inner">
        <div className="module-sub">JEUX &amp; OUTILS</div>
        <h1 className="module-head">L'Atelier</h1>
        <Section label="Jeux" items={CATALOG.filter((i) => i.cat === 'jeu')} />
        <Section label="Outils" items={CATALOG.filter((i) => i.cat === 'outil')} />
      </div>
    </div>
  )
}
