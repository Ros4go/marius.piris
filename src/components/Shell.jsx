import { sfx } from '../core/audio.js'
import { navigate } from '../core/router.js'

// Route chrome: a thin topbar (brand + back-to-menu) over a full-height
// content area. Modules render their own internal tabs/sub-views inside.
export default function Shell({ children }) {
  return (
    <div className="shell">
      <header className="topbar">
        <button
          className="topbar-btn"
          onMouseEnter={sfx.blip}
          onClick={() => {
            sfx.back()
            navigate('/')
          }}
        >
          ◄ Menu
        </button>
        <div className="brand">
          MARIUS<b>PIRIS</b>
        </div>
        <div className="spacer" />
      </header>
      <main className="content">
        <div className="content-inner page-enter">{children}</div>
      </main>
    </div>
  )
}
