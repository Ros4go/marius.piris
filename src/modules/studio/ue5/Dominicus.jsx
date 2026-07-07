import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/* Dominicus — apparaît sur les fiches / quiz après ~1 min d'inactivité.
   Sort d'un bord de l'écran (crâne en premier), s'arrête au niveau des yeux.
   Clic = il repart vite, puis cooldown aléatoire 3–15 min. */

const SIDES = ['bottom', 'top', 'left', 'right']
const IDLE = 60_000 // 1 min avant apparition possible
const pick = (a) => a[Math.floor(Math.random() * a.length)]

export default function Dominicus({ active }) {
  const [side, setSide] = useState('bottom')
  const [shown, setShown] = useState(false)
  const [fast, setFast] = useState(false)
  const cooldown = useRef(0) // timestamp avant lequel il ne peut pas revenir
  const shownRef = useRef(false)
  const armRef = useRef(() => {})

  useEffect(() => { shownRef.current = shown }, [shown])

  useEffect(() => {
    if (!active) { setShown(false); shownRef.current = false; return }
    let t
    const arm = () => {
      clearTimeout(t)
      if (shownRef.current) return
      const wait = Math.max(IDLE, cooldown.current - Date.now())
      t = setTimeout(() => {
        if (shownRef.current || Date.now() < cooldown.current) { arm(); return }
        setSide(pick(SIDES)); setFast(false); setShown(true)
      }, wait)
    }
    armRef.current = arm
    const onActivity = () => { if (!shownRef.current) arm() }
    arm()
    window.addEventListener('pointerdown', onActivity)
    window.addEventListener('keydown', onActivity)
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', onActivity)
      window.removeEventListener('keydown', onActivity)
    }
  }, [active])

  const dismiss = () => {
    setFast(true)
    setShown(false)
    shownRef.current = false
    cooldown.current = Date.now() + (3 + Math.random() * 12) * 60_000 // 3–15 min
    setTimeout(() => armRef.current(), 60)
  }

  if (!active) return null

  // Portal sur <body> : sinon un ancêtre transformé/filtré rend le position:fixed
  // relatif à lui → Dominicus devient atteignable au scroll. Épinglé au viewport ici.
  return createPortal(
    <div
      className={`dom-wrap dom-${side}${shown ? ' on' : ''}${fast ? ' fast' : ''}`}
      aria-hidden={!shown}
    >
      <img
        className="dom-img"
        src="/assets/images/dominicus-maximus.png"
        alt=""
        draggable="false"
        onClick={dismiss}
        title="chut…"
      />
    </div>,
    document.body,
  )
}
