import React from 'react'

// Console (event log) + statistics panel for the Frometons clicker.
// Extracted from the clicker so it isn't re-created on every parent render.
const ConsoleAndStatsPanel = React.memo(
  ({
    gameState,
    consoleMessages,
    activeTab,
    setActiveTab,
    formatNumber,
    formatTime,
    showFixedButton = false,
    clickFrometon,
    clickButtonRef,
  }) => {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-shrink-0 justify-around mb-4">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-md font-semibold ${
              activeTab === 'journal' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Journal des événements
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-md font-semibold ${
              activeTab === 'stats' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Statistiques
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2">
          {activeTab === 'journal' && (
            <div className="flex flex-col space-y-2 text-left text-sm">
              {consoleMessages.map((msg) => (
                <p key={msg.id} className={`${msg.color}`}>
                  <span className="text-gray-500 text-xs">[{new Date(msg.id).toLocaleTimeString()}] </span>
                  {msg.text}
                </p>
              ))}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="flex flex-col space-y-2 text-left text-sm stats-scrollbar-container">
              <p className="text-lg text-white">
                Temps de jeu:{' '}
                <span className="text-yellow-300">
                  {formatTime(gameState.gameStartTime ? Date.now() - gameState.gameStartTime : 0)}
                </span>
              </p>
              <p className="text-lg text-white">
                Début de partie:{' '}
                <span className="text-yellow-300">
                  {gameState.gameStartTime ? new Date(gameState.gameStartTime).toLocaleString('fr-FR') : 'N/A'}
                </span>
              </p>
              <p className="text-lg text-white">
                Total Clics: <span className="text-yellow-300">{formatNumber(gameState.totalClicks)}</span>
              </p>
              <p className="text-lg text-white">
                Frometons Totaux Gagnés:{' '}
                <span className="text-yellow-300">{formatNumber(gameState.totalFrometonsEarned)}</span>
              </p>
              <p className="text-lg text-white">
                Argent Total Gagné: <span className="text-green-400">{formatNumber(gameState.totalMoneyEarned)}€</span>
              </p>

              <h4 className="text-xl font-semibold text-purple-300 mt-4 mb-2">Production Totale par Fromage:</h4>
              {Object.keys(gameState.totalCheeseProduced).map((cheeseType) => (
                <p key={cheeseType} className="text-md text-gray-300 ml-4">
                  {cheeseType}: <span className="text-blue-300">{formatNumber(gameState.totalCheeseProduced[cheeseType])}</span>{' '}
                  unités
                </p>
              ))}
            </div>
          )}
        </div>

        {showFixedButton && (
          <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-700 text-center">
            <p className="text-xl font-bold mb-2">
              Frometons: <span className="text-yellow-300">{formatNumber(gameState.frometons)}</span>
            </p>
            <p className="text-xl font-bold mb-4">
              Argent: <span className="text-green-400">{formatNumber(gameState.money)}€</span>
            </p>
            <button
              onClick={clickFrometon}
              ref={clickButtonRef}
              className="w-fit mx-auto px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-md font-semibold rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              Click Frometon
            </button>
          </div>
        )}
      </div>
    )
  }
)

export default ConsoleAndStatsPanel
