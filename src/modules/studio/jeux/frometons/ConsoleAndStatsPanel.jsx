import React from 'react'

// Console (journal d'événements) + statistiques du Frometons Clicker.
const ConsoleAndStatsPanel = React.memo(
  ({
    gameState,
    consoleMessages,
    activeTab,
    setActiveTab,
    formatNumber,
    formatShort,
    formatTime,
    showFixedButton = false,
    clickFrometon,
    blockKeyRepeat,
    achievementsDef = [],
    production = {},
    info = {},
    clickButtonRef,
    compact = false,
  }) => {
    const fmt = formatShort || formatNumber

    // Auto-scroll « collant » : on suit le bas UNIQUEMENT si l'utilisateur y est
    // déjà. S'il a remonté lire l'historique, on ne le ramène pas en bas de force.
    const scrollRef = React.useRef(null)
    const stickRef = React.useRef(true)
    const onScroll = () => {
      if (activeTab !== 'journal') return
      const el = scrollRef.current
      if (el) stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48
    }
    React.useLayoutEffect(() => {
      if (activeTab !== 'journal') return
      const el = scrollRef.current
      if (el && stickRef.current) el.scrollTop = el.scrollHeight
    }, [consoleMessages, activeTab])

    const Tab = ({ id, label }) => (
      <button onClick={() => setActiveTab(id)} className={`fcc-tab ${activeTab === id ? 'active' : ''}`}>
        {label}
      </button>
    )
    const Row = ({ label, value, color }) => (
      <div className="fcc-row">
        <span className="fcc-row-l">{label}</span>
        <span className="fcc-row-v" style={color ? { color } : undefined}>{value}</span>
      </div>
    )
    const Section = ({ title }) => <h4 className="fcc-sec">{title}</h4>

    return (
      <div className="flex flex-col h-full">
        <div className="fcc-tabs">
          <Tab id="journal" label="Journal" />
          <Tab id="stats" label="Stats" />
          <Tab id="achievements" label="Succès" />
        </div>

        <div ref={scrollRef} onScroll={onScroll} className="flex-grow overflow-y-auto pr-1.5">
          {activeTab === 'journal' && (
            <div className="flex flex-col gap-1 text-left text-sm">
              {consoleMessages.length === 0 && <p className="text-gray-500 italic">Aucun événement pour l'instant…</p>}
              {consoleMessages.map((msg) => (
                <p key={msg.id} className={msg.color}>
                  <span className="text-gray-500 text-xs">[{new Date(msg.time).toLocaleTimeString()}] </span>
                  {msg.text}
                </p>
              ))}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="text-left">
              <Section title="Progression" />
              <Row label="Temps de jeu" value={formatTime(gameState.gameStartTime ? Date.now() - gameState.gameStartTime : 0)} color="#ffe27a" />
              <Row label="Prestiges" value={fmt(info.prestiges || 0)} color="#ffc24d" />
              <Row label="Croûtes" value={fmt(info.croutes || 0)} color="#ffc24d" />
              <Row label="Reliques" value={info.relics || 0} color="#c084fc" />
              <Row label="Lune fromifiée" value={info.won ? '🌕 Oui' : 'Non'} color={info.won ? '#ffd166' : '#9aa0c8'} />

              <Section title="Run en cours" />
              <Row label="Frometons (run)" value={fmt(info.runF || 0)} color="#ffe27a" />
              <Row label="Palier" value={`${info.palier || 0} / ${info.totalPaliers || 11}`} color="#ffd166" />
              <Row label="Mult. frometon" value={`×${(info.fmMult || 1).toFixed(1)}`} color="#ffe27a" />
              <Row label="Puissance de clic" value={fmt(info.clickEff || 0)} color="#5eead4" />
              <Row label="Production /s" value={fmt(info.prodEff || 0)} color="#f0892f" />

              <Section title="À vie" />
              <Row label="Total clics" value={fmt(gameState.totalClicks)} color="#ffe27a" />
              <Row label="Frometons gagnés" value={fmt(gameState.totalFrometonsEarned)} color="#ffe27a" />
              <Row label="Argent gagné" value={`${fmt(gameState.totalMoneyEarned)}€`} color="#7ee0a0" />
              <Row label="Contrats remplis" value={fmt(info.contractsCompleted || 0)} color="#7ee0a0" />
              <Row label="Goldens cliqués" value={fmt(info.goldensCollected || 0)} color="#ffd166" />

              <Section title="Production / s (usines)" />
              {Object.keys(production).length === 0 ? (
                <p className="text-sm text-gray-500 italic">Aucune — achète des bâtiments.</p>
              ) : (
                Object.entries(production).map(([type, rate]) => (
                  <Row key={type} label={type === 'frometons' ? '🧀 Frometons' : type} value={`${fmt(rate)} /s`} color="#f0892f" />
                ))
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="flex flex-col gap-2 text-left">
              <p className="text-xs text-gray-400 mb-1">
                {achievementsDef.filter((a) => (gameState.achievements || {})[a.id]).length}/{achievementsDef.length} débloqués
              </p>
              {achievementsDef.map((a) => {
                const got = gameState.achievements && gameState.achievements[a.id]
                const hidden = a.secret && !got
                return (
                  <div key={a.id} className={`flex items-center gap-3 p-2 rounded-lg border ${got ? 'bg-white/5 border-yellow-500/60' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
                    <span className="text-2xl flex-shrink-0">{got ? a.icon : hidden ? '❔' : '🔒'}</span>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm ${got ? 'text-yellow-300' : 'text-gray-300'}`}>{hidden ? 'Succès secret' : a.title}</p>
                      <p className="text-xs text-gray-400">{hidden ? 'À toi de le découvrir…' : a.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {showFixedButton && (
          <div className="fcc-foot">
            <div className="fcc-foot-stats">
              <span>🧀 <b className="text-yellow-300">{fmt(gameState.frometons)}</b></span>
              <span>💰 <b className="text-green-400">{fmt(gameState.money)}€</b></span>
            </div>
            <button onClick={clickFrometon} onKeyDown={blockKeyRepeat} ref={clickButtonRef} className="fcc-foot-btn">
              Click
            </button>
          </div>
        )}
      </div>
    )
  }
)

export default ConsoleAndStatsPanel
