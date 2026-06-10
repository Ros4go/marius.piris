import { useState } from 'react'
import GenericModal from '../../components/GenericModal.jsx'
import { bio, cvUrl, projects, experiences, formations, categorizedSkills } from './data.js'

const LINKEDIN = 'https://www.linkedin.com/in/marius-piris/'

// Single-page résumé: everything visible at a glance. Projects & experiences
// open a modal for full detail — no sub-menus to dig through.
export default function Portfolio() {
  const [project, setProject] = useState(null)
  const [experience, setExperience] = useState(null)

  return (
    <div>
      <div className="module-sub">PROFIL · CV</div>
      <h1 className="module-head">Marius Piris</h1>
      <p className="role-line">
        <b>Développeur de jeux</b> · Unity · Unreal Engine 5 · Godot · Full Stack
      </p>

      <div className="resume-actions">
        <a href={cvUrl} download className="btn">
          <span>⬇ Télécharger le CV</span>
        </a>
        <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" className="btn ghost">
          <span>in · LinkedIn</span>
        </a>
      </div>

      <div className="resume-grid">
        {/* Colonne gauche : à propos + compétences */}
        <div className="resume-col">
          <div className="resume-block">
            <span className="module-sub">À propos</span>
            {bio.map((p, i) => (
              <p key={i} className="prose-read mb-3 text-sm" dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>

          <div className="resume-block">
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
          </div>
        </div>

        {/* Colonne droite : expériences + parcours */}
        <div className="resume-col">
          <div className="resume-block">
            <span className="module-sub">Expériences</span>
            {experiences.map((exp, i) => (
              <button
                key={i}
                className="p-card xp text-left w-full"
                onClick={() => {
                  setExperience(exp)
                }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg">{exp.title}</h3>
                  <span className="cat" style={{ color: 'var(--red)' }}>
                    {exp.company}
                  </span>
                </div>
                <p className="tagline">{exp.duration}</p>
                <p className="prose-read mt-1 line-clamp-3 text-sm">{exp.description}</p>
              </button>
            ))}
          </div>

          <div className="resume-block">
            <span className="module-sub">Parcours</span>
            {formations.map((f, i) => (
              <div key={i} className="p-card edu">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg">{f.title}</h3>
                  <span className="chip" style={{ margin: 0 }}>
                    {f.level}
                  </span>
                </div>
                <p className="tagline">
                  {f.school} · {f.duration}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projets : grille compacte, détail en modale */}
      <div className="resume-block" style={{ marginTop: 30 }}>
        <span className="module-sub">Projets</span>
        <div className="proj-grid">
          {projects.map((proj, i) => (
            <button
              key={i}
              className="p-card text-left p-0 overflow-hidden"
              onClick={() => {
                setProject(proj)
              }}
            >
              <img
                src={proj.images[0]}
                alt={proj.title}
                className="w-full h-28 object-cover"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = 'https://placehold.co/600x400/6B7280/FFFFFF?text=Image+non+disponible'
                }}
              />
              <div className="p-3">
                <h3 className="text-base">{proj.title}</h3>
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
      </div>

      {project && <GenericModal item={project} type="project" onClose={() => setProject(null)} />}
      {experience && <GenericModal item={experience} type="experience" onClose={() => setExperience(null)} />}
    </div>
  )
}
