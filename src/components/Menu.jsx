import { useEffect, useRef, useState } from 'react'

// Accueil = the launcher itself. Identity (name, portrait) on the left, the
// modules as the headline list, the CV / contact smaller below. No Press Start.
export default function Menu({ modules, onSelect }) {
  const [shown, setShown] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 20)
    return () => clearTimeout(t)
  }, [])

  // Parallax léger : la position de la souris pilote --px / --py (lus par le CSS).
  useEffect(() => {
    const el = heroRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onMove = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', ((e.clientX / window.innerWidth - 0.5) * 2).toFixed(3))
        el.style.setProperty('--py', ((e.clientY / window.innerHeight - 0.5) * 2).toFixed(3))
      })
    }
    const reset = () => {
      el.style.setProperty('--px', '0')
      el.style.setProperty('--py', '0')
    }
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', reset)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', reset)
    }
  }, [])

  const primary = modules.filter((m) => m.group !== 'about')
  const secondary = modules.filter((m) => m.group === 'about')

  const Item = ({ m, i, small }) => (
    <button
      className={`mi${small ? ' small' : ''}${shown ? ' show' : ''}`}
      style={{ animationDelay: `${i * 0.07}s` }}
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
    <section className="hero accueil" ref={heroRef}>
      <div className="stripes" />
      <div className="halftone" />
      <div className="red-slab" />
      <span className="persona-bar b1" />
      <span className="persona-bar b2" />

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
