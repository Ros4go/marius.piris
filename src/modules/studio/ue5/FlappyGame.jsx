import { useEffect, useRef, useState } from 'react'

/* Mini Flappy Bird — le "Super Poulet" (sprite sheet 7 frames de 960px) remplace
   l'oiseau. Tuyaux + sol : vrais assets pixel-art (Megacrash, SimpleStyle1).
   La boîte englobante du poulet est mesurée au chargement (scan alpha) → l'oiseau
   est cadré serré (donc GROS) et la hitbox colle au poulet visible. */

const SHEET = '/assets/images/superpoulet-sheet.gif'
const TILES = '/assets/images/flappy-tiles.png' // 128x112 : 4 pipes (32px) + sol
const BG    = '/assets/images/flappy-bg.png'
const FRAMES = 7
const FW = 960 // largeur d'une frame dans la sheet

// Découpe de flappy-tiles.png (mesurée) — pipe VERT, colonne x0..31 :
const CAP = { sx: 0, sy: 0, sw: 32, sh: 16 }   // chapeau (lèvre)
const BODY = { sx: 0, sy: 26, sw: 32, sh: 30 } // tranche de corps (tuilable)
const GND = { sx: 0, sy: 80, sw: 64, sh: 32 } // sol ÉTÉ seul (x0-63 : herbe verte + terre orange)

const BEST_KEY = 'superpoulet_flappy_best_v2'

// Dimensions logiques du canvas
const W = 360
const H = 600
const GROUND_H = 46
const FLOOR = H - GROUND_H

const BIRD_X = 92
const BIRD_H = 58            // hauteur de rendu VISÉE du poulet (gros)
const HIT_KX = 0.34          // demi-hitbox = fraction de la taille rendue (indulgent)
const HIT_KY = 0.32

const GRAV = 0.46
const FLAP = -7.6
const GAP = 190             // ouverture entre tuyaux
const PW = 64               // largeur des tuyaux à l'écran (sprite 32 × 2)
const PSCALE = PW / 32
const CAP_H = CAP.sh * PSCALE
const SPEED = 2.3
const SPACING = 240

export default function FlappyGame({ onClose }) {
  const canvasRef = useRef(null)
  const [phase, setPhase] = useState('ready')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(() => {
    try { return +localStorage.getItem(BEST_KEY) || 0 } catch { return 0 }
  })

  const g = useRef(null)
  const phaseRef = useRef('ready')
  useEffect(() => { phaseRef.current = phase }, [phase])

  // boîte englobante du poulet dans une frame (mesurée au chargement)
  const bbox = useRef({ bx: 0, by: 0, bw: FW, bh: FW })

  const reset = () => {
    g.current = { y: H / 2, vy: 0, pipes: [], t: 0, frame: 0, spawnX: 40, gx: 0, dead: false }
    setScore(0)
  }

  const flap = () => {
    const p = phaseRef.current
    if (p === 'ready') { setPhase('play'); g.current.vy = FLAP }
    else if (p === 'play') { g.current.vy = FLAP }
    else if (p === 'dead') { reset(); setPhase('ready') }
  }

  useEffect(() => {
    reset()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf

    const img = new Image()
    img.src = SHEET
    img.onload = () => measureBird(img)
    const tiles = new Image(); tiles.src = TILES
    const bg = new Image(); bg.src = BG

    // Mesure la boîte englobante opaque en UNION des 7 frames (sur canvas offscreen).
    const measureBird = (image) => {
      try {
        const oc = document.createElement('canvas')
        oc.width = image.naturalWidth; oc.height = image.naturalHeight
        const octx = oc.getContext('2d', { willReadFrequently: true })
        octx.drawImage(image, 0, 0)
        let minx = FW, miny = FW, maxx = 0, maxy = 0
        for (let f = 0; f < FRAMES; f++) {
          const d = octx.getImageData(f * FW, 0, FW, FW).data
          for (let y = 0; y < FW; y += 2) {
            for (let x = 0; x < FW; x += 2) {
              if (d[(y * FW + x) * 4 + 3] > 24) {
                if (x < minx) minx = x; if (x > maxx) maxx = x
                if (y < miny) miny = y; if (y > maxy) maxy = y
              }
            }
          }
        }
        if (maxx > minx && maxy > miny) {
          const pad = 6
          bbox.current = {
            bx: Math.max(0, minx - pad), by: Math.max(0, miny - pad),
            bw: Math.min(FW, maxx - minx + pad * 2), bh: Math.min(FW, maxy - miny + pad * 2),
          }
        }
      } catch { /* canvas tainted / read fail : garde le fallback */ }
    }

    // taille rendue de l'oiseau (dérivée de la bbox)
    const birdSize = () => {
      const bb = bbox.current
      const scale = BIRD_H / bb.bh
      return { rw: bb.bw * scale, rh: BIRD_H }
    }

    const drawPipe = (p) => {
      // corps HAUT (étiré) + chapeau retourné à l'ouverture
      ctx.drawImage(tiles, BODY.sx, BODY.sy, BODY.sw, BODY.sh, p.x, 0, PW, p.gy - CAP_H)
      ctx.save(); ctx.translate(p.x, p.gy); ctx.scale(1, -1)
      ctx.drawImage(tiles, CAP.sx, CAP.sy, CAP.sw, CAP.sh, 0, 0, PW, CAP_H); ctx.restore()
      // corps BAS + chapeau à l'ouverture
      const by = p.gy + GAP
      ctx.drawImage(tiles, CAP.sx, CAP.sy, CAP.sw, CAP.sh, p.x, by, PW, CAP_H)
      ctx.drawImage(tiles, BODY.sx, BODY.sy, BODY.sw, BODY.sh, p.x, by + CAP_H, PW, FLOOR - by - CAP_H)
    }

    const loop = () => {
      const s = g.current
      const playing = phaseRef.current === 'play'
      s.t++
      s.frame = Math.floor(s.t / 5) % FRAMES
      const { rw, rh } = birdSize()
      const hx = rw * HIT_KX, hy = rh * HIT_KY

      if (playing) {
        s.vy += GRAV
        s.y += s.vy
        s.gx -= SPEED   // accumulateur CONTINU : un wrap (% N) créerait un saut au bouclage
        s.spawnX -= SPEED
        if (s.spawnX <= 0) {
          const gy = 70 + Math.random() * (FLOOR - GAP - 150)
          s.pipes.push({ x: W, gy, passed: false })
          s.spawnX = SPACING
        }
        for (const p of s.pipes) {
          p.x -= SPEED
          if (!p.passed && p.x + PW < BIRD_X) { p.passed = true; setScore((v) => v + 1) }
          const inX = BIRD_X + hx > p.x && BIRD_X - hx < p.x + PW
          if (inX && (s.y - hy < p.gy || s.y + hy > p.gy + GAP)) die()
        }
        s.pipes = s.pipes.filter((p) => p.x + PW > -10)
        if (s.y + hy > FLOOR || s.y - hy < 0) die()
      }

      // --- rendu ---
      ctx.imageSmoothingEnabled = false
      // ciel : couleur du pack (fallback) puis le fond complet (nuages + ville),
      // tuilé en parallaxe. Même palette que les tuyaux/sol → cohérent.
      ctx.fillStyle = '#94fdff'; ctx.fillRect(0, 0, W, H)
      if (bg.complete && bg.naturalWidth) {
        const BGS = FLOOR
        const off = (s.gx * 0.35) % BGS
        for (let x = off - BGS; x < W; x += BGS) ctx.drawImage(bg, x, 0, BGS, BGS)
      }
      // tuyaux
      for (const p of s.pipes) drawPipe(p)
      // sol (tuilé + défilant)
      const tw = GND.sw * (GROUND_H / GND.sh)
      const goff = (s.gx) % tw
      for (let x = goff - tw; x < W; x += tw) ctx.drawImage(tiles, GND.sx, GND.sy, GND.sw, GND.sh, x, FLOOR, tw, GROUND_H)

      // oiseau (bbox cadrée serrée → gros ; lissage ON juste pour lui)
      const bb = bbox.current
      const angle = Math.max(-0.5, Math.min(1.1, s.vy / 11))
      ctx.save(); ctx.translate(BIRD_X, s.y); ctx.rotate(angle)
      if (img.complete && img.naturalWidth) {
        ctx.imageSmoothingEnabled = true
        ctx.drawImage(img, s.frame * FW + bb.bx, bb.by, bb.bw, bb.bh, -rw / 2, -rh / 2, rw, rh)
      } else {
        ctx.fillStyle = '#ffb300'; ctx.beginPath(); ctx.arc(0, 0, rh / 2, 0, 7); ctx.fill()
      }
      ctx.restore()

      raf = requestAnimationFrame(loop)
    }

    const die = () => {
      if (phaseRef.current !== 'play') return
      setPhase('dead')
      setScore((v) => {
        setBest((b) => {
          const nb = Math.max(b, v)
          try { localStorage.setItem(BEST_KEY, String(nb)) } catch { /* quota */ }
          return nb
        })
        return v
      })
    }

    raf = requestAnimationFrame(loop)

    const onKey = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap() }
      if (e.code === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="sp-flappy-overlay" onClick={onClose}>
      <div className="sp-flappy" onClick={(e) => e.stopPropagation()}>
        <div className="sp-flappy-head">
          <span className="sp-flappy-title">🐔 Super Poulet</span>
          <span className="sp-flappy-score">Score {score} · 🏆 {best}</span>
          <button className="sp-flappy-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>
        <div className="sp-flappy-stage" onPointerDown={flap}>
          <canvas ref={canvasRef} width={W} height={H} className="sp-flappy-canvas" />
          {phase === 'ready' && (
            <div className="sp-flappy-hint"><b>Clique / Espace</b><span>pour voler</span></div>
          )}
          {phase === 'dead' && (
            <div className="sp-flappy-over">
              <h3>💀 Perdu</h3>
              <p>Score {score} · Record {best}</p>
              <button className="btn" onClick={flap}><span>↻ Rejouer</span></button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
