import { sfx } from '../../core/audio.js'

const LINKS = [
  { label: 'LinkedIn', en: 'PROFIL PRO', href: 'https://www.linkedin.com/in/marius-piris/' },
  { label: 'GitHub', en: 'CODE', href: 'https://github.com/ros4go' },
  { label: 'itch.io', en: 'MES JEUX', href: 'https://rosago.itch.io/' },
  { label: 'Twitch', en: 'EN LIVE', href: 'https://www.twitch.tv/ros4go' },
  { label: 'YouTube', en: 'VIDÉOS', href: 'https://www.youtube.com/@Ros4go' },
  { label: 'Instagram', en: 'INSTA', href: 'https://instagram.com/marius_piris' },
  { label: 'Deezer', en: 'MUSIQUE', href: 'https://www.deezer.com/fr/profile/6627317661' },
  { label: 'Linktree', en: 'TOUS MES LIENS', href: 'https://linktr.ee/marius.piris' },
]

export default function Contact() {
  return (
    <div className="max-w-3xl">
      <div className="module-sub">All-Out Attack</div>
      <h1 className="module-head">Contact</h1>
      <p className="prose-read text-lg mb-8">
        N'hésitez pas à me contacter pour toute collaboration, opportunité ou simplement pour discuter !
      </p>
      <div className="flex flex-col gap-3 max-w-md">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="mi show"
            onMouseEnter={sfx.blip}
            onClick={sfx.select}
            style={{ textDecoration: 'none' }}
          >
            <span className="num">↗</span>
            <span>
              <span className="lab">{l.label}</span>
              <span className="en">{l.en}</span>
            </span>
            <span className="arrow">►</span>
          </a>
        ))}
      </div>
    </div>
  )
}
