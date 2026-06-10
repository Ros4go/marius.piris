import { useEffect, useState } from 'react'
import { sfx } from '../core/audio.js'

// Accueil = the launcher itself. Identity (name, portrait) on the left, the
// modules as the headline list, the CV / contact smaller below. No Press Start.
export default function Menu({ modules, onSelect }) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 20)
    return () => clearTimeout(t)
  }, [])

  const primary = modules.filter((m) => m.group !== 'about')
  const secondary = modules.filter((m) => m.group === 'about')

  const Item = ({ m, i, small }) => (
    <button
      className={`mi${small ? ' small' : ''}${shown ? ' show' : ''}`}
      style={{ animationDelay: `${i * 0.07}s` }}
      onMouseEnter={sfx.blip}
      onClick={() => onSelect(m)}
    >
      <span className="num">{m.num}</span>
      <span>
        <span className="lab">{m.label}</span>
        <span className="en">{m.en}</span>
      </span>
      <span className="arrow">►</span>
    </button>
  )

  return (
    <section className="hero accueil">
      <div className="stripes" />
      <div className="halftone" />
      <div className="red-slab" />

      <div className="portrait-wrap">
        <img className="portrait" src="/assets/images/marius_profile.png" alt="Marius Piris" />
      </div>

      <div className="hero-inner accueil-inner">
        <div className="kicker">
          <span>ISART DIGITAL · GAME PROGRAMMING</span>
        </div>
        <h1 className="name accueil-name">
          <span className="l1">MARIUS</span>
          <span className="l2">PIRIS</span>
        </h1>
        <p className="accueil-role">
          Développeur de jeux <span className="amp">&amp;</span> full stack
        </p>
        <p className="accueil-stack">Unity · Unreal Engine 5 · Godot</p>

        <nav className="home-menu">
          {primary.map((m, i) => (
            <Item key={m.id} m={m} i={i} />
          ))}
          <div className={'menu-sep' + (shown ? ' show' : '')} style={{ animationDelay: `${primary.length * 0.07}s` }}>
            À PROPOS
          </div>
          {secondary.map((m, i) => (
            <Item key={m.id} m={m} i={primary.length + 1 + i} small />
          ))}
        </nav>
      </div>
    </section>
  )
}
