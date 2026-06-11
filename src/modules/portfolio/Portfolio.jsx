import { useState } from 'react'
import GenericModal from '../../components/GenericModal.jsx'
import PersonaBg from '../../components/PersonaBg.jsx'
import { bio, cvUrl, projects, experiences, formations, categorizedSkills } from './data.js'

const LINKEDIN = 'https://www.linkedin.com/in/marius-piris/'

// Mots-clés défilants de la bande verticale (droite).
const KEYWORDS = [
  'Unity', 'Unreal Engine 5', 'Godot', 'C++', 'C#', 'Python', 'Tech-Art',
  'Génération Procédurale', 'Shaders', 'VFX', 'Behavior Trees', 'Flocking AI',
  'Multijoueur', 'Game Design', 'Full Stack', 'UML', 'Optimisation', 'React', 'Gameplay',
]

// Dates : extraites des chaînes "duration" pour trier la timeline et afficher une période courte.
const yearsOf = (s) => (s.match(/\d{4}/g) || []).map(Number)
const periodShort = (s) => {
  const y = yearsOf(s)
  if (!y.length) return ''
  const a = Math.min(...y), b = Math.max(...y)
  return a === b ? String(a) : `${a}–${String(b).slice(2)}`
}
const sortYear = (s) => {
  const y = yearsOf(s)
  return y.length ? Math.max(...y) : 0
}

// Single-page résumé: everything visible at a glance. Projects & experiences
// open a modal for full detail — no sub-menus to dig through.
export default function Portfolio() {
  const [project, setProject] = useState(null)
  const [experience, setExperience] = useState(null)

  // Expériences + formations fusionnées, triées du plus récent au plus ancien.
  const timeline = [
    ...experiences.map((e) => ({ ...e, kind: 'xp' })),
    ...formations.map((f) => ({ ...f, kind: 'edu' })),
  ].sort((a, b) => sortYear(b.duration) - sortYear(a.duration))

  return (
    <div className="resume">
      <PersonaBg label="PROFIL" />
      <div className="resume-main">
      <header className="resume-head">
        <div>
          <div className="module-sub">PROFIL · CV</div>
          <h1 className="module-head">Marius Piris</h1>
          <p className="role-line">
            <b>Développeur de jeux</b> · Unity · Unreal Engine 5 · Godot · Full Stack
          </p>
        </div>
        <div className="resume-actions">
          <a href={cvUrl} download className="btn">
            <span>⬇ Télécharger le CV</span>
          </a>
          <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn ghost">
            <span>in · LinkedIn</span>
          </a>
        </div>
      </header>

      <div className="resume-body">
        {/* Gauche : à propos, timeline, compétences */}
        <div className="resume-left">
          <section className="resume-block resume-intro">
            <span className="module-sub">À propos</span>
            {bio.map((p, i) => (
              <p key={i} className="prose-read mb-2 text-sm" dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </section>

          {/* Timeline chronologique : expériences + formations mêlées */}
          <section className="resume-band">
            <span className="module-sub">Parcours &amp; expériences</span>
            <div className="timeline">
              {timeline.map((it, i) => (
                <div className="tl-item" key={i}>
                  <div className="tl-date">{periodShort(it.duration)}</div>
                  <span className={'tl-dot ' + it.kind} />
                  {it.kind === 'xp' ? (
                    <button className="tl-card p-card text-left" onClick={() => setExperience(it)}>
                      <span className="tl-kind xp">Expérience · {it.company}</span>
                      <h3>{it.title}</h3>
                      <p className="tagline">{it.duration}</p>
                      <div className="mt-2">
                        {it.skills.slice(0, 4).map((s) => (
                          <span key={s} className="chip">
                            {s}
                          </span>
                        ))}
                      </div>
                    </button>
                  ) : (
                    <div className="tl-card p-card edu">
                      <span className="tl-kind edu">Formation · {it.level}</span>
                      <h3>{it.title}</h3>
                      <p className="tagline">
                        {it.school} · {it.duration}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="resume-block">
            <span className="module-sub">Compétences</span>
            {Object.entries(categorizedSkills).map(([category, skills]) => (
              <div key={category} className="skill-cat">
                <span className="cat">{category}</span>
                <div>
                  {skills.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Droite : projets en colonne verticale */}
        <aside className="resume-projects-col">
          <span className="module-sub">Projets</span>
          <div className="proj-vert">
            {projects.map((proj, i) => (
              <button key={i} className="p-card text-left p-0 overflow-hidden" onClick={() => setProject(proj)}>
                <img
                  src={proj.images[0]}
                  alt={proj.title}
                  className="proj-thumb"
                  onError={(e) => {
                    e.target.onerror = null
                    e.target.src = 'https://placehold.co/600x400/6B7280/FFFFFF?text=Image+non+disponible'
                  }}
                />
                <div className="p-2">
                  <h3 className="text-sm">{proj.title}</h3>
                  <div className="mt-1">
                    {proj.skills.slice(0, 3).map((s) => (
                      <span key={s} className="chip">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>

      </div>

      <aside className="kw-band" aria-hidden="true">
        <div className="kw-track">
          {KEYWORDS.concat(KEYWORDS).map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
      </aside>

      {project && <GenericModal item={project} type="project" onClose={() => setProject(null)} />}
      {experience && <GenericModal item={experience} type="experience" onClose={() => setExperience(null)} />}
    </div>
  )
}
