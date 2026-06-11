import PersonaBg from '../../components/PersonaBg.jsx'

// Chaque réseau a son slug Simple Icons (logo) + sa couleur de marque (chaînes hex sans #).
const LINKS = [
  { label: 'LinkedIn', en: 'Profil pro', href: 'https://www.linkedin.com/in/marius-piris/', slug: 'linkedin', color: '0A66C2' },
  { label: 'GitHub', en: 'Mon code', href: 'https://github.com/ros4go', slug: 'github', color: 'E6E6E6' },
  { label: 'itch.io', en: 'Mes jeux', href: 'https://rosago.itch.io/', slug: 'itchdotio', color: 'FA5C5C' },
  { label: 'Twitch', en: 'En live', href: 'https://www.twitch.tv/ros4go', slug: 'twitch', color: '9146FF' },
  { label: 'YouTube', en: 'Mes vidéos', href: 'https://www.youtube.com/@Ros4go', slug: 'youtube', color: 'FF0000' },
  { label: 'Instagram', en: 'Insta', href: 'https://instagram.com/marius_piris', slug: 'instagram', color: 'E4405F' },
  { label: 'Deezer', en: 'Ma musique', href: 'https://www.deezer.com/fr/profile/6627317661', slug: 'deezer', color: 'EF5466' },
  { label: 'Linktree', en: 'Tous mes liens', href: 'https://linktr.ee/marius.piris', slug: 'linktree', color: '43E660' },
]

export default function Contact() {
  return (
    <div className="contact">
      <PersonaBg label="RÉSEAUX" />
      <div className="contact-inner">
        <h1 className="module-head">Contact</h1>

        <div className="contact-grid">
          {LINKS.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ci"
              style={{ '--brand': '#' + l.color, '--d': `${i * 0.7}s`, animationDelay: `${i * 0.05}s` }}
            >
            <img
              className="ci-ic"
              src={`https://cdn.simpleicons.org/${l.slug}/${l.color}`}
              alt=""
              aria-hidden="true"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <span className="ci-txt">
              <span className="ci-lab">{l.label}</span>
              <span className="ci-en">{l.en}</span>
            </span>
            <span className="ci-go" aria-hidden="true">↗</span>
          </a>
        ))}
        </div>
      </div>
    </div>
  )
}
