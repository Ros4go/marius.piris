import { useEffect, useRef, useState } from 'react'
import { useRoute, navigate } from './core/router.js'
import { modules, moduleForPath } from './core/modules.js'
import Menu from './components/Menu.jsx'
import Splash from './components/Splash.jsx'
import Shell from './components/Shell.jsx'

export default function App() {
  const route = useRoute()
  const [splash, setSplash] = useState(null)
  const splashTimer = useRef(null)

  useEffect(() => () => clearTimeout(splashTimer.current), [])

  const selectModule = (m) => {
    setSplash({ label: m.label, aoa: m.aoa })
    splashTimer.current = setTimeout(() => {
      setSplash(null)
      if (m.kind === 'external') window.location.href = m.href
      else navigate(m.path)
    }, 450)
  }

  // ----- Home: the launcher IS the landing (no Press Start gate) -----
  if (route === '/') {
    return (
      <div className="stage">
        <Menu modules={modules} onSelect={selectModule} />
        {splash && <Splash label={splash.label} aoa={splash.aoa} />}
      </div>
    )
  }

  // ----- A module route -----
  const mod = moduleForPath(route)
  if (mod) {
    const Comp = mod.component
    return (
      <div className="stage">
        <Shell>
          <Comp />
        </Shell>
        {splash && <Splash label={splash.label} aoa={splash.aoa} />}
      </div>
    )
  }

  // ----- Unknown route -----
  return (
    <div className="stage">
      <Shell>
        <div>
          <h1 className="module-head">404</h1>
          <p className="prose-read mb-6">Cette page n'existe pas.</p>
          <button className="btn" onClick={() => navigate('/')}>
            <span>◄ Retour au menu</span>
          </button>
        </div>
      </Shell>
    </div>
  )
}
