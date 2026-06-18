import React from 'react'
import { createPortal } from 'react-dom'
import FloatingText from '../../../components/FloatingText.jsx'
import Tooltip from '../../../components/Tooltip.jsx'
import ConsoleAndStatsPanel from './ConsoleAndStatsPanel.jsx'
import {
  BOOSTERS,
  PALIERS,
  PALIER_UNLOCKS,
  RARITY_META,
  RELICS,
  RELIC_BY_ID,
  computeRelicEffects,
  contractProgress,
  crouteGain,
  lunaState,
  makeContract,
  rewardLabel,
  rollRelic,
  unlockedContent,
} from './frometonsMeta.js'
import './frometons.css'
import './frometonsUI.css'

// Identifiants strictement croissants pour les clés React (messages console,
// textes flottants). Date.now() peut se répéter dans la même milliseconde →
// clés dupliquées → bugs d'affichage (messages au milieu, ordre cassé).
let _uidSeq = 0
const nextUid = () => ++_uidSeq

const MAX_CONSOLE = 50 // nb de messages conservés (assez pour scroller l'historique)

// --- Succès ------------------------------------------------------------------
// check(g) reçoit le gameState. `secret` masque titre/desc tant que verrouillé.
const ACHIEVEMENTS = [
  // Progression
  { id: 'first-click', icon: '🖱️', title: 'Premier Frometon', desc: 'Faire son tout premier clic.', check: (g) => g.totalClicks >= 1 },
  { id: 'clicker', icon: '💪', title: 'Doigté de Fromager', desc: 'Atteindre 500 clics au total.', check: (g) => g.totalClicks >= 500 },
  { id: 'tendinite', icon: '🩹', title: 'Tendinite', desc: 'Cliquer 10 000 fois. Pense à tes poignets.', check: (g) => g.totalClicks >= 10000 },
  { id: 'first-building', icon: '🏭', title: 'Industrialisation', desc: 'Posséder son premier bâtiment.', check: (g) => g.buildings.some((b) => b.currentCount > 0) },
  { id: 'second-cheese', icon: '🧀', title: 'Affineur', desc: 'Débloquer un second fromage.', check: (g) => g.unlockedCheeses.length >= 2 },
  { id: 'all-cheese', icon: '🍽️', title: 'Plateau de Fromages', desc: 'Débloquer les 7 fromages.', check: (g) => g.unlockedCheeses.length >= 7 },
  { id: 'millionaire', icon: '💰', title: 'Magnat du Fromage', desc: 'Gagner 1 000 000 € au total.', check: (g) => g.totalMoneyEarned >= 1e6 },
  { id: 'diogene', icon: '📦', title: 'Syndrome de Diogène', desc: 'Stocker 1 000 000 d’un même fromage sans le vendre.', check: (g) => Object.values(g.cheeseInventory || {}).some((v) => v >= 1e6) },
  // Méta : prestige & reliques
  { id: 'first-prestige', icon: '🔄', title: 'Éternel Recommencement', desc: 'Faire son premier prestige.', check: (g) => (g.prestigeCount || 0) >= 1 },
  { id: 'prestige-veteran', icon: '♾️', title: 'Boucle Temporelle', desc: 'Prestiger 10 fois.', check: (g) => (g.prestigeCount || 0) >= 10 },
  { id: 'first-relic', icon: '🔮', title: 'Chasseur de Reliques', desc: 'Obtenir sa première relique.', check: (g) => Object.values(g.relics || {}).some((c) => c > 0) },
  { id: 'legendary', icon: '🌟', title: 'Élu du Fromage', desc: 'Obtenir une relique légendaire.', check: (g) => Object.keys(g.relics || {}).some((id) => g.relics[id] > 0 && RELIC_BY_ID[id]?.rarity === 'legendary') },
  { id: 'moon-king', icon: '🌕', title: 'Roi de la Lune', desc: 'Fromifier la Lune.', check: (g) => g.won === true },
  // Secrets rigolos (nombres mèmes)
  { id: 'cheese-seven', icon: '🔪', title: 'Cheese Seven', desc: 'Posséder pile 67… frometons.', secret: true, check: (g) => /^67(0*)$/.test(String(Math.floor(g.frometons))) },
  { id: 'forty-two', icon: '🌌', title: 'La Grande Question', desc: 'Posséder 42 frometons : la réponse à la Vie, l’Univers et le Fromage.', secret: true, check: (g) => /^42(0*)$/.test(String(Math.floor(g.frometons))) },
  { id: 'sixty-nine', icon: '😏', title: 'Nice.', desc: 'Posséder 69 frometons. Nice.', secret: true, check: (g) => /^69(0*)$/.test(String(Math.floor(g.frometons))) },
  { id: 'leet', icon: '👾', title: 'Éliteux', desc: 'Posséder 1337 frometons. Tu es un h4ck3r du fromage.', secret: true, check: (g) => /^1337(0*)$/.test(String(Math.floor(g.frometons))) },
]

// --- Achat groupé (x1 / x10 / xMax) -----------------------------------------
// On simule chaque achat (coût géométrique + arrondis) plutôt qu'une formule
// fermée : exact, et gère xMax (qty === 'max') sans dépasser les ressources.
function planBuildingPurchase(building, money, qty, costMult = 1) {
  let cost = building.cost
  let count = building.currentCount
  let total = 0
  let n = 0
  const limit = qty === 'max' ? Infinity : qty
  while (n < limit) {
    const eff = Math.round(cost * costMult) // remise éventuelle (relique Négociant)
    if (money - total < eff) break
    total += eff
    count += 1
    cost = Math.round(building.baseCost * Math.pow(2.0, count))
    n += 1
  }
  return { n, total, endCost: cost, endCount: count }
}

function planClickUpgrade(upg, frometons, qty) {
  let cost = upg.cost
  let level = upg.currentLevel
  let total = 0
  let n = 0
  const limit = qty === 'max' ? Infinity : qty
  while (n < limit && frometons - total >= cost) {
    total += cost
    level += 1
    cost = Math.round(upg.baseCost * Math.pow(1.5, level))
    n += 1
  }
  return { n, total, endCost: cost, endLevel: level }
}

function planCritUpgrade(upg, frometons, money, qty) {
  let fCost = upg.frometonCost
  let mCost = upg.moneyCost
  let level = upg.currentLevel
  let fTotal = 0
  let mTotal = 0
  let n = 0
  const limit = qty === 'max' ? Infinity : qty
  while (n < limit && frometons - fTotal >= fCost && money - mTotal >= mCost) {
    fTotal += fCost
    mTotal += mCost
    level += 1
    fCost = Math.round(upg.baseFrometonCost * Math.pow(1.8, level))
    mCost = Math.round(upg.baseMoneyCost * Math.pow(1.8, level))
    n += 1
  }
  return { n, fTotal, mTotal, endFCost: fCost, endMCost: mCost, endLevel: level }
}

// --- Progression hors-ligne --------------------------------------------------
// Applique la production passive accumulée depuis la dernière sauvegarde
// (state.lastSeen). Mute l'état et y dépose un récap (_offlineReport).
const OFFLINE_CAP_S = 8 * 3600 // 8 h max de récolte hors-ligne
function applyOfflineProgress(state) {
  const last = state.lastSeen
  if (!last) return
  const elapsed = Math.floor((Date.now() - last) / 1000)
  if (elapsed < 30) return // trop court : on ignore
  const fx = computeRelicEffects(state.relics)
  const cap = OFFLINE_CAP_S + fx.offlineCapBonusH * 3600 // reliques « Cave fraîche »
  const capped = Math.min(elapsed, cap)

  const perSec = { frometons: 0 }
  state.buildings.forEach((b) => {
    if (b.currentCount > 0) {
      perSec[b.selectedProduction] = (perSec[b.selectedProduction] || 0) + b.effect * b.currentCount * fx.prodMult
    }
  })
  if (Object.values(perSec).every((v) => v === 0)) return

  const report = { seconds: capped, capped: elapsed > cap, frometons: 0, cheese: {} }
  for (const type in perSec) {
    const gain = perSec[type] * capped
    if (gain <= 0) continue
    if (type === 'frometons') {
      const mult = (state.cheesePrices[state.selectedFarmingCheese]?.frometonMultiplier || 1.0) * fx.fromMult
      const g = gain * mult
      state.frometons += g
      state.totalFrometonsEarned += g
      state.runFrometonsEarned = (state.runFrometonsEarned || 0) + g
      report.frometons += g
    } else {
      state.cheeseInventory[type] = (state.cheeseInventory[type] || 0) + gain
      state.totalCheeseProduced[type] = (state.totalCheeseProduced[type] || 0) + gain
      report.cheese[type] = (report.cheese[type] || 0) + gain
    }
  }
  state._offlineReport = report
}

// Frometons Clicker — incremental game. Ported from the original single-file
// app. Self-contained; persists to localStorage key 'frometonsGame'.
export default function FrometonsGame() {
  const frometonsImage = '/assets/images/Fromecoin.png'
  const [isFrometonsSectionVisible] = React.useState(true)
  const [floatingTexts, setFloatingTexts] = React.useState([])
  const clickButtonRef = React.useRef(null)
  const [activeTab, setActiveTab] = React.useState('journal')
  const [isMobileConsoleOpen, setIsMobileConsoleOpen] = React.useState(false)
  const [currentSubTab, setCurrentSubTab] = React.useState('upgrades')
  const [buyQty, setBuyQty] = React.useState(1) // 1 | 10 | 'max'
  const [boosterQty, setBoosterQty] = React.useState(1) // 1 | 10 | 'max'
  const [golden, setGolden] = React.useState(null) // { id, x, y, reward }
  const [offlineReport, setOfflineReport] = React.useState(null)
  const [toasts, setToasts] = React.useState([]) // succès en cours d'affichage
  const [confirmReset, setConfirmReset] = React.useState(false)
  const [confirmPrestige, setConfirmPrestige] = React.useState(false)
  const [pull, setPull] = React.useState(null) // { relic, dup } animation d'ouverture de booster
  const [showVictory, setShowVictory] = React.useState(false)

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(Math.floor(num))

  // Notation abrégée pour les gros chiffres (HUD/hero) : 534, 1.2K, 3.4M, 5.6B…
  const SHORT_UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']
  const formatShort = (num) => {
    num = Math.floor(num || 0)
    if (num < 1000) return new Intl.NumberFormat('fr-FR').format(num)
    const tier = Math.min(SHORT_UNITS.length - 1, Math.floor(Math.log10(num) / 3))
    const scaled = num / Math.pow(10, tier * 3)
    return `${scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0)} ${SHORT_UNITS[tier]}`
  }

  const formatTime = (milliseconds) => {
    if (milliseconds === null) return 'N/A'
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor((totalSeconds / 3600) % 24)
    const minutes = Math.floor((totalSeconds / 60) % 60)
    const seconds = totalSeconds % 60
    return `${hours}h ${minutes}m ${seconds}s`
  }

  const initialGameState = {
    frometons: 0,
    money: 0,
    clickPower: 1,
    criticalClickChance: 0.05,
    criticalClickMultiplier: 2,
    cheeseInventory: {
      Comte: 0,
      SaintFelicien: 0,
      Camembert: 0,
      Roquefort: 0,
      Gruyere: 0,
      Emmental: 0,
      Reblochon: 0,
    },
    cheesePrices: {
      Comte: { basePrice: 1.0, frometonMultiplier: 1.0 },
      SaintFelicien: { basePrice: 2.5, frometonMultiplier: 1.5 },
      Camembert: { basePrice: 5.0, frometonMultiplier: 2.0 },
      Roquefort: { basePrice: 7.5, frometonMultiplier: 2.5 },
      Gruyere: { basePrice: 10.0, frometonMultiplier: 3.0 },
      Emmental: { basePrice: 20.0, frometonMultiplier: 4.0 },
      Reblochon: { basePrice: 30.0, frometonMultiplier: 5.0 },
    },
    cheeseWeights: {},
    unlockedCheeses: ['Comte'],
    selectedFarmingCheese: 'Comte',
    upgrades: {
      clickPower: [
        { name: 'Souris Agile', cost: 50, effect: 1, currentLevel: 0, baseCost: 50, description: 'Augmente la puissance de votre clic de 1.' },
        { name: 'Main de Fromager', cost: 500, effect: 10, currentLevel: 0, baseCost: 500, description: 'Augmente la puissance de votre clic de 10.' },
        { name: 'Force du Fromage', cost: 5000, effect: 100, currentLevel: 0, baseCost: 5000, description: 'Augmente la puissance de votre clic de 100.' },
      ],
      critical: [
        { name: 'Aiguiseur de Fromage', frometonCost: 500, moneyCost: 100, effect: 0.01, currentLevel: 0, baseFrometonCost: 500, baseMoneyCost: 100, type: 'chance', description: 'Augmente votre chance de clic critique de 1%.' },
        { name: 'Double Fois Plus', frometonCost: 2500, moneyCost: 500, effect: 0.5, currentLevel: 0, baseFrometonCost: 2500, baseMoneyCost: 500, type: 'multiplier', description: 'Augmente le multiplicateur de vos clics critiques de 0.5x.' },
      ],
    },
    buildings: [
      { name: 'Petite Roue de Fromage', cost: 500, effect: 5, currentCount: 0, baseCost: 500, selectedProduction: 'frometons', description: 'Génère 5 unités du type sélectionné par seconde.' },
      { name: "Cave d'Affinement de Fromage", cost: 5000, effect: 25, currentCount: 0, baseCost: 5000, selectedProduction: 'frometons', description: 'Génère 25 unités du type sélectionné par seconde.' },
      { name: 'Usine Automatisée de Frometons', cost: 50000, effect: 100, currentCount: 0, baseCost: 50000, selectedProduction: 'frometons', description: 'Génère 100 unités du type sélectionné par seconde.' },
      { name: 'Complexe Industriel Fromager', cost: 500000, effect: 500, currentCount: 0, baseCost: 500000, selectedProduction: 'frometons', description: 'Génère 500 unités du type sélectionné par seconde.' },
      { name: 'Mégapole du Fromage', cost: 5000000, effect: 2500, currentCount: 0, baseCost: 5000000, selectedProduction: 'frometons', description: 'Génère 2500 unités du type sélectionné par seconde.' },
      { name: 'Empire Galactique du Fromage', cost: 50000000, effect: 10000, currentCount: 0, baseCost: 50000000, selectedProduction: 'frometons', description: 'Génère 10000 unités du type sélectionné par seconde.' },
    ],
    cheeseUnlockCosts: {
      SaintFelicien: { money: 10000, frometons: 20000 },
      Camembert: { money: 100000, frometons: 200000 },
      Roquefort: { money: 1000000, frometons: 2000000 },
      Gruyere: { money: 10000000, frometons: 20000000 },
      Emmental: { money: 50000000, frometons: 100000000 },
      Reblochon: { money: 100000000, frometons: 200000000 },
    },
    currentHappenings: null,
    totalClicks: 0,
    totalFrometonsEarned: 0,
    totalMoneyEarned: 0,
    totalCheeseProduced: { Comte: 0, SaintFelicien: 0, Camembert: 0, Roquefort: 0, Gruyere: 0, Emmental: 0, Reblochon: 0 },
    gameStartTime: null,
    milestones: {
      100: null, 1000: null, 10000: null, 100000: null,
      1000000: null, 10000000: null, 100000000: null, 1000000000: null,
    },
    cheeseUnlockTimestamps: {
      Comte: null, SaintFelicien: null, Camembert: null, Roquefort: null, Gruyere: null, Emmental: null, Reblochon: null,
    },
    achievements: {}, // { [id]: timestamp } pour les succès débloqués
    // --- Méta-progression (prestige / gacha / lune) ---
    croutes: 0, // monnaie de prestige (persiste au prestige)
    relics: {}, // { [relicId]: count } reliques permanentes (stack infini)
    prestigeCount: 0, // nb de prestiges effectués
    runFrometonsEarned: 0, // frometons gagnés CE run (reset au prestige) → jauge Lune + Croûtes
    won: false, // Lune fromifiée au moins une fois
    contracts: [], // contrats actifs (acceptés)
    contractOffers: [], // 3 propositions de contrat à choisir
    contractsCompleted: 0, // nb de contrats réclamés (stat)
    goldensCollected: 0, // nb de golden frometons cliqués (stat)
  }

  const normalizeCheeseWeights = (weights, unlockedCheeses) => {
    const activeWeights = {}
    let totalWeight = 0
    unlockedCheeses.forEach((cheeseType) => {
      activeWeights[cheeseType] = Math.max(0.01, weights[cheeseType] || 0)
      totalWeight += activeWeights[cheeseType]
    })

    if (totalWeight === 0) {
      const equalWeight = 100 / unlockedCheeses.length
      unlockedCheeses.forEach((cheeseType) => {
        activeWeights[cheeseType] = equalWeight
      })
      return activeWeights
    }

    const normalizedWeights = {}
    unlockedCheeses.forEach((cheeseType) => {
      normalizedWeights[cheeseType] = (activeWeights[cheeseType] / totalWeight) * 100
    })
    return normalizedWeights
  }

  const [gameState, setGameState] = React.useState(() => {
    try {
      const savedState = localStorage.getItem('frometonsGame')
      if (savedState) {
        const parsedState = JSON.parse(savedState)

        const deepMerge = (target, source) => {
          const output = { ...target }
          if (target && typeof target === 'object' && source && typeof source === 'object') {
            Object.keys(source).forEach((key) => {
              if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                output[key] = deepMerge(target[key], source[key])
              } else {
                output[key] = source[key]
              }
            })
          }
          return output
        }

        const mergedState = deepMerge(initialGameState, parsedState)

        Object.keys(initialGameState.cheeseInventory).forEach((cheeseType) => {
          if (typeof mergedState.cheeseInventory[cheeseType] === 'undefined') {
            mergedState.cheeseInventory[cheeseType] = initialGameState.cheeseInventory[cheeseType]
          }
          if (typeof mergedState.cheesePrices[cheeseType] === 'number') {
            mergedState.cheesePrices[cheeseType] = {
              basePrice: mergedState.cheesePrices[cheeseType],
              frometonMultiplier: initialGameState.cheesePrices[cheeseType].frometonMultiplier,
            }
          } else if (typeof mergedState.cheesePrices[cheeseType] === 'undefined') {
            mergedState.cheesePrices[cheeseType] = initialGameState.cheesePrices[cheeseType]
          }
          if (mergedState.cheesePrices[cheeseType].currentMarketPrice !== undefined) delete mergedState.cheesePrices[cheeseType].currentMarketPrice
          if (mergedState.cheesePrices[cheeseType].supplyFactor !== undefined) delete mergedState.cheesePrices[cheeseType].supplyFactor
        })

        if (!mergedState.cheeseWeights || Object.keys(mergedState.cheeseWeights).length === 0 || !mergedState.unlockedCheeses.every((c) => mergedState.cheeseWeights[c] !== undefined)) {
          const numUnlocked = mergedState.unlockedCheeses.length
          if (numUnlocked > 0) {
            const initialEqualWeight = 100 / numUnlocked
            mergedState.cheeseWeights = {}
            mergedState.unlockedCheeses.forEach((cheeseType) => {
              mergedState.cheeseWeights[cheeseType] = initialEqualWeight
            })
          }
        } else {
          mergedState.cheeseWeights = normalizeCheeseWeights(mergedState.cheeseWeights, mergedState.unlockedCheeses)
        }

        mergedState.unlockedCheeses.forEach((cheeseType) => {
          const basePrice = initialGameState.cheesePrices[cheeseType].basePrice
          const currentWeight = mergedState.cheeseWeights[cheeseType]
          let calculatedPrice = basePrice * (currentWeight / 100)
          const minPrice = basePrice * 0.01
          const maxPrice = basePrice * 1.5
          calculatedPrice = Math.max(minPrice, Math.min(maxPrice, calculatedPrice))
          mergedState.cheesePrices[cheeseType] = {
            ...mergedState.cheesePrices[cheeseType],
            currentMarketPrice: calculatedPrice,
          }
        })

        Object.keys(initialGameState.cheeseUnlockCosts).forEach((cheeseType) => {
          if (typeof mergedState.cheeseUnlockCosts[cheeseType] === 'number') {
            mergedState.cheeseUnlockCosts[cheeseType] = {
              money: mergedState.cheeseUnlockCosts[cheeseType],
              frometons: initialGameState.cheeseUnlockCosts[cheeseType].frometons,
            }
          } else if (typeof mergedState.cheeseUnlockCosts[cheeseType] === 'undefined') {
            mergedState.cheeseUnlockCosts[cheeseType] = initialGameState.cheeseUnlockCosts[cheeseType]
          }
        })

        mergedState.buildings = initialGameState.buildings.map((initialBuilding, index) => {
          const savedBuilding = mergedState.buildings[index]
          return {
            ...initialBuilding,
            ...(savedBuilding || {}),
            selectedProduction: savedBuilding?.selectedProduction || initialBuilding.selectedProduction,
          }
        })

        if (mergedState.totalClicks === undefined) mergedState.totalClicks = 0
        if (mergedState.totalFrometonsEarned === undefined) mergedState.totalFrometonsEarned = 0
        if (mergedState.totalMoneyEarned === undefined) mergedState.totalMoneyEarned = 0
        if (mergedState.totalCheeseProduced === undefined) mergedState.totalCheeseProduced = initialGameState.totalCheeseProduced
        if (mergedState.gameStartTime === undefined) mergedState.gameStartTime = null
        if (mergedState.milestones === undefined) mergedState.milestones = initialGameState.milestones
        if (mergedState.cheeseUnlockTimestamps === undefined) mergedState.cheeseUnlockTimestamps = initialGameState.cheeseUnlockTimestamps

        if (mergedState.gameStartTime === null && mergedState.frometons > 0) {
          mergedState.gameStartTime = Date.now()
        }

        mergedState.currentHappenings = null
        // Migration : une sauvegarde antérieure au prestige n'a pas runFrometonsEarned
        // → on l'amorce avec le total à vie (toute la partie = run 1) pour que la jauge
        // Fromification soit cohérente.
        if (parsedState.runFrometonsEarned === undefined) {
          mergedState.runFrometonsEarned = mergedState.totalFrometonsEarned || 0
        }
        // Plus de récompense « booster » dans les contrats : on purge les anciens.
        if (Array.isArray(mergedState.contractOffers)) mergedState.contractOffers = mergedState.contractOffers.filter((o) => o.reward?.kind !== 'booster')
        if (Array.isArray(mergedState.contracts)) mergedState.contracts = mergedState.contracts.filter((c) => c.reward?.kind !== 'booster')
        applyOfflineProgress(mergedState) // récolte hors-ligne depuis lastSeen
        return mergedState
      }
    } catch (error) {
      console.error('Failed to load game state from localStorage:', error)
    }

    const initialWeights = {}
    const numInitialUnlocked = initialGameState.unlockedCheeses.length
    if (numInitialUnlocked > 0) {
      const equalWeight = 100 / numInitialUnlocked
      initialGameState.unlockedCheeses.forEach((cheeseType) => {
        initialWeights[cheeseType] = equalWeight
      })
    }
    const initialPricesWithMarket = { ...initialGameState.cheesePrices }
    initialGameState.unlockedCheeses.forEach((cheeseType) => {
      initialPricesWithMarket[cheeseType] = {
        ...initialPricesWithMarket[cheeseType],
        currentMarketPrice: initialPricesWithMarket[cheeseType].basePrice,
      }
    })

    return { ...initialGameState, cheeseWeights: initialWeights, cheesePrices: initialPricesWithMarket }
  })

  const [consoleMessages, setConsoleMessages] = React.useState([])

  const addConsoleMessage = React.useCallback((text, color = 'text-gray-300') => {
    setConsoleMessages((prev) => {
      const next = [...prev, { id: nextUid(), time: Date.now(), text, color }]
      return next.length > MAX_CONSOLE ? next.slice(next.length - MAX_CONSOLE) : next
    })
  }, [])

  React.useEffect(() => {
    const saveTimer = setTimeout(() => {
      try {
        const stateToSave = JSON.parse(JSON.stringify(gameState))
        stateToSave.lastSeen = Date.now() // horodatage pour la récolte hors-ligne
        delete stateToSave._offlineReport
        localStorage.setItem('frometonsGame', JSON.stringify(stateToSave))
      } catch (error) {
        console.error('Failed to save game state to localStorage:', error)
      }
    }, 100)
    return () => clearTimeout(saveTimer)
  }, [gameState])

  // Effets agrégés des reliques (recalculés seulement quand la collection change).
  const relicFx = React.useMemo(() => computeRelicEffects(gameState.relics), [gameState.relics])
  const relicFxRef = React.useRef(relicFx)
  relicFxRef.current = relicFx
  const gameStateRef = React.useRef(gameState)
  gameStateRef.current = gameState
  const sellCheeseRef = React.useRef(null)

  // État de la jauge Fromification Lunaire (dérivé des frometons du run).
  const luna = React.useMemo(() => lunaState(gameState.runFrometonsEarned), [gameState.runFrometonsEarned])
  // Contenu débloqué CE RUN selon les paliers franchis (onboarding progressif).
  const unlocks = React.useMemo(() => unlockedContent(luna.crossed), [luna.crossed])

  // Ne dépend QUE des bâtiments : sinon cheeseInventory change à chaque clic,
  // ce qui recréait l'objet → l'intervalle de prod se réinitialisait à chaque
  // clic et la production (et son message) ne se déclenchait jamais en cliquant.
  const totalPassiveProduction = React.useMemo(() => {
    const production = { frometons: 0 }
    gameState.buildings.forEach((building) => {
      if (building.currentCount > 0) {
        production[building.selectedProduction] = (production[building.selectedProduction] || 0) + building.effect * building.currentCount
      }
    })
    return production
  }, [gameState.buildings])

  // Production /s par type (frometons + chaque fromage produit par les usines),
  // avec le bonus de production des reliques — pour l'afficher dans la console.
  const productionPerSec = React.useMemo(() => {
    const o = {}
    for (const k in totalPassiveProduction) {
      const v = totalPassiveProduction[k] * relicFx.prodMult
      if (v > 0) o[k] = v
    }
    if (relicFx.prodFlat > 0) o.frometons = (o.frometons || 0) + relicFx.prodFlat // flat reliques
    return o
  }, [totalPassiveProduction, relicFx])

  React.useEffect(() => {
    const interval = setInterval(() => {
      // Message de production chaque seconde (comme les clics), couleur dédiée.
      const g = gameStateRef.current
      const fx = relicFxRef.current
      let eventMult = 1
      if (g.currentHappenings?.type === 'bonus') eventMult = g.currentHappenings.effect
      else if (g.currentHappenings?.type === 'malus') eventMult = 1 / g.currentHappenings.effect
      const prodParts = []
      const fm = (g.cheesePrices[g.selectedFarmingCheese]?.frometonMultiplier || 1.0) * fx.fromMult
      const fromGain = (totalPassiveProduction.frometons || 0) * fx.prodMult * fm * eventMult + fx.prodFlat * eventMult
      if (fromGain > 0) prodParts.push(`+${formatShort(fromGain)} frometons`)
      for (const type in totalPassiveProduction) {
        if (type === 'frometons') continue
        const gain = totalPassiveProduction[type] * fx.prodMult * eventMult
        if (gain > 0) prodParts.push(`+${formatShort(gain)} ${type}`)
      }
      if (prodParts.length) addConsoleMessage(`⚙️ ${prodParts.join(' · ')} /s`, 'text-orange-300')

      setGameState((prev) => {
        const newCheeseInventory = { ...prev.cheeseInventory }
        const newTotalCheeseProduced = { ...prev.totalCheeseProduced }
        let newFrometons = prev.frometons
        let newTotalFrometonsEarned = prev.totalFrometonsEarned
        let newRunFrometons = prev.runFrometonsEarned || 0

        for (const type in totalPassiveProduction) {
          let gain = totalPassiveProduction[type] * relicFx.prodMult // bonus reliques (production)

          if (prev.currentHappenings && prev.currentHappenings.type === 'bonus') {
            gain *= prev.currentHappenings.effect
          } else if (prev.currentHappenings && prev.currentHappenings.type === 'malus') {
            gain /= prev.currentHappenings.effect
          }

          if (type === 'frometons') {
            const frometonMultiplier = (prev.cheesePrices[prev.selectedFarmingCheese]?.frometonMultiplier || 1.0) * relicFx.fromMult
            const actualFrometonGain = gain * frometonMultiplier
            newFrometons += actualFrometonGain
            newTotalFrometonsEarned += actualFrometonGain
            newRunFrometons += actualFrometonGain
          } else {
            newCheeseInventory[type] = (newCheeseInventory[type] || 0) + gain
            newTotalCheeseProduced[type] = (newTotalCheeseProduced[type] || 0) + gain
          }
        }

        // Frometons/s FLAT des reliques (indépendant des bâtiments).
        if (relicFx.prodFlat > 0) {
          let flat = relicFx.prodFlat
          if (prev.currentHappenings?.type === 'bonus') flat *= prev.currentHappenings.effect
          else if (prev.currentHappenings?.type === 'malus') flat /= prev.currentHappenings.effect
          newFrometons += flat
          newTotalFrometonsEarned += flat
          newRunFrometons += flat
        }

        const now = Date.now()
        const currentPlayTime = prev.gameStartTime ? now - prev.gameStartTime : 0
        for (const milestoneValueStr in prev.milestones) {
          const milestoneValue = parseInt(milestoneValueStr)
          if (newTotalFrometonsEarned >= milestoneValue && prev.milestones[milestoneValueStr] === null) {
            prev.milestones[milestoneValueStr] = { timestamp: now, timePlayed: currentPlayTime }
            addConsoleMessage(`Félicitations ! Vous avez atteint ${formatNumber(milestoneValue)} Frometons !`, 'text-yellow-400')
          }
        }

        return {
          ...prev,
          frometons: newFrometons,
          totalFrometonsEarned: newTotalFrometonsEarned,
          runFrometonsEarned: newRunFrometons,
          cheeseInventory: newCheeseInventory,
          totalCheeseProduced: newTotalCheeseProduced,
        }
      })
    }, 1000)
    return () => clearInterval(interval)
    // Deps minimales : le reste est lu via prev.* / refs → l'intervalle ne se
    // réinitialise plus à chaque clic/event (sinon le tick de prod sautait).
  }, [totalPassiveProduction, relicFx, addConsoleMessage])

  React.useEffect(() => {
    const marketRebalanceInterval = setInterval(() => {
      setGameState((prev) => {
        const newCheeseWeights = { ...prev.cheeseWeights }
        const newCheesePrices = { ...prev.cheesePrices }
        const unlockedCheeses = prev.unlockedCheeses
        const numUnlockedCheeses = unlockedCheeses.length

        if (numUnlockedCheeses === 0) return prev

        const idealWeight = 100 / numUnlockedCheeses
        const rebalanceRate = 0.0005

        unlockedCheeses.forEach((cheeseType) => {
          let currentWeight = newCheeseWeights[cheeseType] || 0
          currentWeight += (idealWeight - currentWeight) * rebalanceRate
          currentWeight += (Math.random() - 0.5) * 0.02
          newCheeseWeights[cheeseType] = currentWeight
        })

        const normalizedWeights = normalizeCheeseWeights(newCheeseWeights, unlockedCheeses)

        unlockedCheeses.forEach((cheeseType) => {
          const basePrice = initialGameState.cheesePrices[cheeseType].basePrice
          const currentWeight = normalizedWeights[cheeseType]
          let calculatedPrice = basePrice * (currentWeight / 100)
          const minPrice = basePrice * 0.01
          const maxPrice = basePrice * 1.5
          calculatedPrice = Math.max(minPrice, Math.min(maxPrice, calculatedPrice))
          newCheesePrices[cheeseType] = { ...newCheesePrices[cheeseType], currentMarketPrice: calculatedPrice }
        })

        return { ...prev, cheeseWeights: normalizedWeights, cheesePrices: newCheesePrices }
      })
    }, 10000)
    return () => clearInterval(marketRebalanceInterval)
  }, [addConsoleMessage, gameState.unlockedCheeses])

  React.useEffect(() => {
    let happeningTimeout
    const happeningInterval = setInterval(() => {
      const random = Math.random()
      if (random < 0.7) {
        const eventType = Math.random() < 0.7 ? 'bonus' : 'malus'
        const duration = Math.floor(Math.random() * 15) + 10
        let eventMessage = ''
        let effect = 1
        let messageColor = ''

        let label = ''
        if (eventType === 'bonus') {
          effect = Math.random() * 0.5 + 1.2
          label = `Production & clics ×${effect.toFixed(1)}`
          eventMessage = `BONUS ! ${label} pendant ${duration}s !`
          messageColor = 'text-green-400'
        } else {
          effect = Math.random() * 0.5 + 1.5
          label = `Production & clics ÷${effect.toFixed(1)}`
          eventMessage = `MALUS ! ${label} pendant ${duration}s !`
          messageColor = 'text-red-400'
        }

        setGameState((prev) => ({ ...prev, currentHappenings: { type: eventType, duration, message: eventMessage, effect, label, icon: eventType === 'bonus' ? '🍀' : '☠️', endsAt: Date.now() + duration * 1000 } }))
        addConsoleMessage(eventMessage, messageColor)

        if (happeningTimeout) clearTimeout(happeningTimeout)
        happeningTimeout = setTimeout(() => {
          addConsoleMessage(`L'événement "${eventMessage.split('!')[0].trim()}" est terminé.`, 'text-gray-500')
          setGameState((prev) => ({ ...prev, currentHappenings: null }))
        }, duration * 1000)
      }
    }, 15000)

    return () => {
      clearInterval(happeningInterval)
      if (happeningTimeout) clearTimeout(happeningTimeout)
    }
  }, [addConsoleMessage])

  // Récap hors-ligne : déposé par applyOfflineProgress au chargement, on
  // l'affiche une fois puis on le retire de l'état (jamais persisté).
  React.useEffect(() => {
    if (gameState._offlineReport) {
      setOfflineReport(gameState._offlineReport)
      setGameState((prev) => {
        const n = { ...prev }
        delete n._offlineReport
        return n
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Détection des succès : déclenchée quand les compteurs pertinents changent.
  React.useEffect(() => {
    const unlocked = gameState.achievements || {}
    const newly = ACHIEVEMENTS.filter((a) => !unlocked[a.id] && a.check(gameState))
    if (newly.length === 0) return
    setGameState((prev) => {
      const ach = { ...prev.achievements }
      newly.forEach((a) => {
        ach[a.id] = Date.now()
      })
      return { ...prev, achievements: ach }
    })
    newly.forEach((a) => {
      const key = nextUid()
      setToasts((t) => [...t, { key, icon: a.icon, label: 'Succès débloqué', title: a.title }])
      addConsoleMessage(`🏆 Succès débloqué : ${a.title}`, 'text-yellow-400')
      setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 4500)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.totalClicks, gameState.frometons, gameState.unlockedCheeses, gameState.buildings])

  // Golden Frometon : apparition aléatoire (45–120 s), cliquable 9 s.
  const goldenTimers = React.useRef({})
  const scheduleGolden = React.useRef(() => {})
  React.useEffect(() => {
    const schedule = () => {
      // reliques « Appât doré » / « Astre doré » → goldens plus fréquents
      const delay = (45000 + Math.random() * 75000) / Math.max(1, relicFxRef.current.goldenFreqMult)
      goldenTimers.current.spawn = setTimeout(() => {
        const id = Date.now()
        const kind = Math.random() < 0.5 ? 'frenzy' : 'lump'
        setGolden({ id, x: 6 + Math.random() * 68, y: 14 + Math.random() * 54, kind })
        goldenTimers.current.despawn = setTimeout(() => {
          setGolden(null)
          schedule()
        }, 9000)
      }, delay)
    }
    scheduleGolden.current = schedule
    schedule()
    return () => {
      clearTimeout(goldenTimers.current.spawn)
      clearTimeout(goldenTimers.current.despawn)
    }
  }, [])

  const collectGolden = () => {
    if (!golden) return
    const { kind } = golden
    clearTimeout(goldenTimers.current.despawn)
    setGolden(null)
    setGameState((prev) => ({ ...prev, goldensCollected: (prev.goldensCollected || 0) + 1 }))
    if (kind === 'frenzy') {
      setGameState((prev) => ({
        ...prev,
        currentHappenings: { type: 'bonus', duration: 15, message: 'FRENZY DORÉ ! Production x7 pendant 15s !', effect: 7, label: 'Production & clics ×7', icon: '✨', endsAt: Date.now() + 15000 },
      }))
      addConsoleMessage('✨ Golden Frometon ! FRENZY x7 pendant 15 s !', 'text-yellow-300')
      setTimeout(() => {
        setGameState((prev) => (prev.currentHappenings && prev.currentHappenings.effect === 7 ? { ...prev, currentHappenings: null } : prev))
      }, 15000)
    } else {
      setGameState((prev) => {
        const reward = Math.max(prev.clickPower * 150, prev.frometons * 0.12, 50) * relicFxRef.current.goldenRewardMult
        addConsoleMessage(`✨ Golden Frometon ! +${formatNumber(reward)} Frometons !`, 'text-yellow-300')
        return {
          ...prev,
          frometons: prev.frometons + reward,
          totalFrometonsEarned: prev.totalFrometonsEarned + reward,
          runFrometonsEarned: (prev.runFrometonsEarned || 0) + reward,
        }
      })
    }
    clearTimeout(goldenTimers.current.spawn)
    scheduleGolden.current()
  }

  // Contrats : on génère 3 PROPOSITIONS quand un slot est libre (max 3 actifs).
  // Aucune validation auto : le joueur choisit puis réclame manuellement.
  React.useEffect(() => {
    const active = gameState.contracts || []
    const offers = gameState.contractOffers || []
    if (active.length >= 3 || offers.length > 0) return
    setGameState((prev) => {
      if ((prev.contracts || []).length >= 3 || (prev.contractOffers || []).length > 0) return prev
      return { ...prev, contractOffers: [makeContract(prev, Math.random), makeContract(prev, Math.random), makeContract(prev, Math.random)] }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.contracts, gameState.contractOffers])

  // Notif visible quand un palier franchi débloque du contenu (toast + console).
  const prevCrossedRef = React.useRef(null)
  React.useEffect(() => {
    const cur = luna.crossed
    if (prevCrossedRef.current === null) {
      prevCrossedRef.current = cur
      return
    }
    if (cur > prevCrossedRef.current) {
      for (let i = prevCrossedRef.current; i < cur; i++) {
        const u = PALIER_UNLOCKS[i]
        if (u && u.label) {
          const key = nextUid()
          setToasts((t) => [...t, { key, icon: '🔓', label: 'Palier franchi', title: u.label }])
          setTimeout(() => setToasts((t) => t.filter((x) => x.key !== key)), 4500)
          addConsoleMessage(`🔓 Palier ${i + 1} : ${u.label} débloqué !`, 'text-amber-300')
        }
      }
    }
    prevCrossedRef.current = cur
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luna.crossed])

  // Si l'onglet courant n'est plus débloqué (ex. après prestige), on revient sur
  // Améliorations. Exception : Prestige reste accessible dès qu'on a prestigé / a
  // des Croûtes (pour pouvoir ouvrir des boosters quand on veut).
  React.useEffect(() => {
    const prestigeKept = currentSubTab === 'prestige' && (gameState.prestigeCount > 0 || gameState.croutes > 0)
    if (!unlocks.tabs.has(currentSubTab) && !prestigeKept) setCurrentSubTab('upgrades')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocks, currentSubTab, gameState.prestigeCount, gameState.croutes])

  // Victoire : la Lune est fromifiée.
  React.useEffect(() => {
    if (luna.lune && !gameState.won) {
      setGameState((prev) => ({ ...prev, won: true }))
      setShowVictory(true)
      addConsoleMessage('🌙 TU AS FROMIFIÉ LA LUNE ! Victoire !', 'text-yellow-300')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [luna.lune, gameState.won])

  // Automatisation (reliques Régisseur / Marchand Auto).
  React.useEffect(() => {
    const ids = []
    if (relicFx.autoBuy) ids.push(setInterval(() => autoBuyCheapest(), 3000))
    if (relicFx.autoSell) {
      ids.push(
        setInterval(() => {
          const g = gameStateRef.current
          g.unlockedCheeses.forEach((c) => {
            if ((g.cheeseInventory[c] || 0) > 0 && sellCheeseRef.current) sellCheeseRef.current(c)
          })
        }, 5000)
      )
    }
    return () => ids.forEach(clearInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relicFx.autoBuy, relicFx.autoSell])

  const clickFrometon = () => {
    let currentClickPower = (gameState.clickPower + relicFx.clickFlat) * relicFx.clickMult // flat + % reliques
    let isCritical = false

    // Les clics peuvent inclure une fraction de la prod/s (relique « Doigts d'Or »).
    if (relicFx.clickFromProd > 0) {
      currentClickPower += relicFx.clickFromProd * (totalPassiveProduction.frometons || 0)
    }

    const critChance = Math.min(1, gameState.criticalClickChance + relicFx.critChanceAdd)
    if (Math.random() < critChance) {
      currentClickPower *= gameState.criticalClickMultiplier
      isCritical = true
    }

    // Les événements (FRENZY doré, bonus/malus) s'appliquent aussi aux clics,
    // pas seulement à la production passive.
    const ch = gameState.currentHappenings
    if (ch && ch.type === 'bonus') currentClickPower *= ch.effect
    else if (ch && ch.type === 'malus') currentClickPower /= ch.effect

    const frometonMultiplier = (gameState.cheesePrices[gameState.selectedFarmingCheese]?.frometonMultiplier || 1.0) * relicFx.fromMult
    const actualFrometonGain = currentClickPower * frometonMultiplier

    setGameState((prev) => {
      if (prev.gameStartTime === null) {
        prev = { ...prev, gameStartTime: Date.now() }
      }

      const newCheeseInventory = { ...prev.cheeseInventory }
      newCheeseInventory[prev.selectedFarmingCheese] = (newCheeseInventory[prev.selectedFarmingCheese] || 0) + currentClickPower

      const newTotalFrometonsEarned = prev.totalFrometonsEarned + actualFrometonGain
      const newRunFrometons = (prev.runFrometonsEarned || 0) + actualFrometonGain
      const newTotalClicks = prev.totalClicks + 1
      const newTotalCheeseProduced = { ...prev.totalCheeseProduced, [prev.selectedFarmingCheese]: (prev.totalCheeseProduced[prev.selectedFarmingCheese] || 0) + currentClickPower }

      const now = Date.now()
      const currentPlayTime = prev.gameStartTime ? now - prev.gameStartTime : 0
      for (const milestoneValueStr in prev.milestones) {
        const milestoneValue = parseInt(milestoneValueStr)
        if (newTotalFrometonsEarned >= milestoneValue && prev.milestones[milestoneValueStr] === null) {
          prev.milestones[milestoneValueStr] = { timestamp: now, timePlayed: currentPlayTime }
          addConsoleMessage(`Félicitations ! Vous avez atteint ${formatNumber(milestoneValue)} Frometons !`, 'text-yellow-400')
        }
      }

      return {
        ...prev,
        frometons: prev.frometons + actualFrometonGain,
        totalFrometonsEarned: newTotalFrometonsEarned,
        runFrometonsEarned: newRunFrometons,
        totalClicks: newTotalClicks,
        cheeseInventory: newCheeseInventory,
        totalCheeseProduced: newTotalCheeseProduced,
      }
    })

    setFloatingTexts((prev) => [
      ...prev,
      { id: nextUid(), value: actualFrometonGain, isCritical, x: Math.random() * 40 - 20, y: Math.random() * 40 - 20 },
    ])

    if (clickButtonRef.current) {
      clickButtonRef.current.classList.add('animate-click-pop')
      clickButtonRef.current.addEventListener(
        'animationend',
        () => {
          if (clickButtonRef.current) clickButtonRef.current.classList.remove('animate-click-pop')
        },
        { once: true }
      )
    }

    const clickMessage = isCritical
      ? `CRITIQUE ! +${formatShort(actualFrometonGain)} ${gameState.selectedFarmingCheese} & Frometons !`
      : `+${formatShort(actualFrometonGain)} ${gameState.selectedFarmingCheese} & Frometons.`
    addConsoleMessage(clickMessage, isCritical ? 'text-yellow-300' : 'text-gray-300')
  }

  // Empêche l'auto-clic clavier : un <button> focus relance un click à CHAQUE
  // keydown auto-répété (Entrée/Espace maintenue) → on bloque les répétitions,
  // tout en gardant un clic par appui réel.
  const blockKeyRepeat = React.useCallback((e) => {
    if (e.repeat && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')) e.preventDefault()
  }, [])

  const handleFloatingTextAnimationEnd = React.useCallback((id) => {
    setFloatingTexts((prev) => prev.filter((text) => text.id !== id))
  }, [])

  const buyUpgrade = (type, index, qty = 1) => {
    setGameState((prev) => {
      const upgrade = prev.upgrades[type][index]

      if (type === 'clickPower') {
        const plan = planClickUpgrade(upgrade, prev.frometons, qty)
        if (plan.n === 0) {
          addConsoleMessage(`Pas assez de Frometons pour acheter ${upgrade.name}.`, 'text-red-500')
          return prev
        }
        addConsoleMessage(`Achat: ${upgrade.name} (+${plan.n}, niveau ${plan.endLevel}). Clic +${(upgrade.effect * plan.n).toFixed(1)}.`, 'text-blue-300')
        return {
          ...prev,
          frometons: prev.frometons - plan.total,
          clickPower: prev.clickPower + upgrade.effect * plan.n,
          upgrades: {
            ...prev.upgrades,
            clickPower: prev.upgrades.clickPower.map((upg, i) => (i === index ? { ...upg, cost: plan.endCost, currentLevel: plan.endLevel } : upg)),
          },
        }
      } else if (type === 'critical') {
        const plan = planCritUpgrade(upgrade, prev.frometons, prev.money, qty)
        if (plan.n === 0) {
          addConsoleMessage(`Pas assez de Frometons ou d'Argent pour acheter ${upgrade.name}.`, 'text-red-500')
          return prev
        }
        let newCriticalClickChance = prev.criticalClickChance
        let newCriticalClickMultiplier = prev.criticalClickMultiplier
        if (upgrade.type === 'chance') newCriticalClickChance = Math.min(1, prev.criticalClickChance + upgrade.effect * plan.n)
        else if (upgrade.type === 'multiplier') newCriticalClickMultiplier = prev.criticalClickMultiplier + upgrade.effect * plan.n

        const desc = upgrade.type === 'chance' ? `Chance critique +${(upgrade.effect * plan.n * 100).toFixed(0)}%` : `Multiplicateur critique +${(upgrade.effect * plan.n).toFixed(1)}x`
        addConsoleMessage(`Achat: ${upgrade.name} (+${plan.n}, niveau ${plan.endLevel}). ${desc}.`, 'text-blue-300')

        return {
          ...prev,
          frometons: prev.frometons - plan.fTotal,
          money: prev.money - plan.mTotal,
          criticalClickChance: newCriticalClickChance,
          criticalClickMultiplier: newCriticalClickMultiplier,
          upgrades: {
            ...prev.upgrades,
            critical: prev.upgrades.critical.map((upg, i) => (i === index ? { ...upg, frometonCost: plan.endFCost, moneyCost: plan.endMCost, currentLevel: plan.endLevel } : upg)),
          },
        }
      }
      return prev
    })
  }

  const buyBuilding = (index, qty = 1) => {
    setGameState((prev) => {
      const building = prev.buildings[index]
      const plan = planBuildingPurchase(building, prev.money, qty, relicFx.buildingCostMult)
      if (plan.n === 0) {
        addConsoleMessage(`Pas assez d'Argent pour acheter ${building.name}.`, 'text-red-500')
        return prev
      }
      addConsoleMessage(`Achat: ${building.name} (+${plan.n}, total x${plan.endCount}). Production +${(building.effect * plan.n).toFixed(1)} ${building.selectedProduction}/s.`, 'text-green-300')
      return {
        ...prev,
        money: prev.money - plan.total,
        buildings: prev.buildings.map((bld, i) => (i === index ? { ...bld, cost: plan.endCost, currentCount: plan.endCount } : bld)),
      }
    })
  }

  const sellCheese = (cheeseType) => {
    setGameState((prev) => {
      const currentCheeseAmount = prev.cheeseInventory[cheeseType] || 0
      const currentPriceData = prev.cheesePrices[cheeseType]
      const currentMarketPrice = currentPriceData?.currentMarketPrice || 0

      if (currentCheeseAmount > 0 && currentMarketPrice > 0) {
        // Taux de vente boosté par les reliques (marketMult).
        const moneyGained = currentCheeseAmount * currentMarketPrice * relicFx.marketMult
        const newCheeseInventory = { ...prev.cheeseInventory, [cheeseType]: 0 }

        const newCheeseWeights = { ...prev.cheeseWeights }
        const weightImpactFactor = 0.000005
        const weightReduction = currentCheeseAmount * weightImpactFactor

        newCheeseWeights[cheeseType] = Math.max(0.01, (newCheeseWeights[cheeseType] || 0) - weightReduction)

        const otherUnlockedCheeses = prev.unlockedCheeses.filter((c) => c !== cheeseType)
        if (otherUnlockedCheeses.length > 0) {
          let totalWeightOfOthers = 0
          otherUnlockedCheeses.forEach((c) => {
            totalWeightOfOthers += newCheeseWeights[c] || 0
          })
          otherUnlockedCheeses.forEach((c) => {
            if (totalWeightOfOthers > 0) {
              const share = (newCheeseWeights[c] / totalWeightOfOthers) * weightReduction
              newCheeseWeights[c] = (newCheeseWeights[c] || 0) + share
            } else {
              newCheeseWeights[c] = (newCheeseWeights[c] || 0) + weightReduction / otherUnlockedCheeses.length
            }
          })
        }

        const normalizedWeights = normalizeCheeseWeights(newCheeseWeights, prev.unlockedCheeses)

        const updatedCheesePrices = { ...prev.cheesePrices }
        prev.unlockedCheeses.forEach((c) => {
          const basePrice = initialGameState.cheesePrices[c].basePrice
          const currentWeight = normalizedWeights[c]
          let calculatedPrice = basePrice * (currentWeight / 100)
          const minPrice = basePrice * 0.01
          const maxPrice = basePrice * 1.5
          calculatedPrice = Math.max(minPrice, Math.min(maxPrice, calculatedPrice))
          updatedCheesePrices[c] = { ...updatedCheesePrices[c], currentMarketPrice: calculatedPrice }
        })

        const newTotalMoneyEarned = prev.totalMoneyEarned + moneyGained
        addConsoleMessage(`Vente de ${formatNumber(currentCheeseAmount)} ${cheeseType} pour ${moneyGained.toFixed(2)} Argent.`, 'text-yellow-300')
        return {
          ...prev,
          money: prev.money + moneyGained,
          totalMoneyEarned: newTotalMoneyEarned,
          cheeseInventory: newCheeseInventory,
          cheeseWeights: normalizedWeights,
          cheesePrices: updatedCheesePrices,
        }
      }
      addConsoleMessage(`Pas de ${cheeseType} à vendre ou prix nul.`, 'text-red-500')
      return prev
    })
  }

  const unlockCheese = (cheeseType) => {
    setGameState((prev) => {
      const unlockCost = prev.cheeseUnlockCosts[cheeseType]
      if (!unlockCost) {
        addConsoleMessage(`Coût de déblocage pour ${cheeseType} non défini.`, 'text-red-500')
        return prev
      }
      if (prev.unlockedCheeses.includes(cheeseType)) {
        addConsoleMessage(`${cheeseType} est déjà débloqué.`, 'text-gray-500')
        return prev
      }
      if (prev.money >= unlockCost.money && prev.frometons >= unlockCost.frometons) {
        const now = Date.now()
        const currentPlayTime = prev.gameStartTime ? now - prev.gameStartTime : 0

        const newUnlockedCheeses = [...prev.unlockedCheeses, cheeseType]
        const numNewUnlocked = newUnlockedCheeses.length
        const newEqualWeight = 100 / numNewUnlocked
        const newCheeseWeights = {}
        newUnlockedCheeses.forEach((cheese) => {
          newCheeseWeights[cheese] = newEqualWeight
        })

        const updatedCheesePrices = { ...prev.cheesePrices }
        newUnlockedCheeses.forEach((cheese) => {
          const basePrice = initialGameState.cheesePrices[cheese].basePrice
          const currentWeight = newCheeseWeights[cheese]
          let calculatedPrice = basePrice * (currentWeight / 100)
          const minPrice = basePrice * 0.01
          const maxPrice = basePrice * 1.5
          calculatedPrice = Math.max(minPrice, Math.min(maxPrice, calculatedPrice))
          updatedCheesePrices[cheese] = { ...updatedCheesePrices[cheese], currentMarketPrice: calculatedPrice }
        })

        addConsoleMessage(`Vous avez débloqué le ${cheeseType} !`, 'text-purple-400')
        return {
          ...prev,
          money: prev.money - unlockCost.money,
          frometons: prev.frometons - unlockCost.frometons,
          unlockedCheeses: newUnlockedCheeses,
          cheeseWeights: newCheeseWeights,
          cheesePrices: updatedCheesePrices,
          cheeseUnlockTimestamps: {
            ...prev.cheeseUnlockTimestamps,
            [cheeseType]: { timestamp: now, timePlayed: currentPlayTime },
          },
        }
      }
      let message = `Pas assez de ressources pour débloquer ${cheeseType}.`
      if (prev.money < unlockCost.money) message += ` Manque ${formatNumber(unlockCost.money - prev.money)}€`
      if (prev.frometons < unlockCost.frometons) message += ` Manque ${formatNumber(unlockCost.frometons - prev.frometons)} Frometons`
      addConsoleMessage(message, 'text-red-500')
      return prev
    })
  }

  const setBuildingProduction = (buildingIndex, productionType) => {
    setGameState((prev) => {
      const newBuildings = [...prev.buildings]
      newBuildings[buildingIndex] = { ...newBuildings[buildingIndex], selectedProduction: productionType }
      return { ...prev, buildings: newBuildings }
    })
  }

  sellCheeseRef.current = sellCheese

  // --- Prestige -------------------------------------------------------------
  const prestigeGain = crouteGain(gameState.runFrometonsEarned, relicFx.crouteMult)

  const doPrestige = () => {
    if (prestigeGain < 1) return
    setGameState((prev) => {
      const gain = crouteGain(prev.runFrometonsEarned, relicFx.crouteMult)
      const fresh = JSON.parse(JSON.stringify(initialGameState))
      // Conserver toute la méta-progression + stats à vie.
      fresh.croutes = (prev.croutes || 0) + gain
      fresh.relics = prev.relics
      fresh.prestigeCount = (prev.prestigeCount || 0) + 1
      fresh.won = prev.won
      fresh.achievements = prev.achievements
      fresh.totalClicks = prev.totalClicks
      fresh.totalFrometonsEarned = prev.totalFrometonsEarned
      fresh.totalMoneyEarned = prev.totalMoneyEarned
      fresh.totalCheeseProduced = prev.totalCheeseProduced
      fresh.milestones = prev.milestones
      fresh.cheeseUnlockTimestamps = prev.cheeseUnlockTimestamps
      fresh.gameStartTime = prev.gameStartTime
      fresh.contracts = prev.contracts // baselines = compteurs à vie → survivent au prestige
      fresh.contractOffers = prev.contractOffers
      const eq = fresh.unlockedCheeses.length ? 100 / fresh.unlockedCheeses.length : 0
      fresh.cheeseWeights = {}
      fresh.unlockedCheeses.forEach((c) => {
        fresh.cheeseWeights[c] = eq
        fresh.cheesePrices[c] = { ...fresh.cheesePrices[c], currentMarketPrice: fresh.cheesePrices[c].basePrice }
      })
      return fresh
    })
    setConfirmPrestige(false)
    setGolden(null)
    addConsoleMessage(`🧀 Prestige ! +${prestigeGain} Croûte${prestigeGain > 1 ? 's' : ''}. Ouvre des boosters pour des reliques !`, 'text-yellow-300')
  }

  // --- Boosters / reliques --------------------------------------------------
  const RARITY_RANK = { common: 0, rare: 1, epic: 2, legendary: 3 }
  const buyBooster = (boosterId) => {
    const booster = BOOSTERS.find((b) => b.id === boosterId)
    if (!booster) return
    const owned = gameState.croutes || 0
    const maxAff = Math.floor(owned / booster.price)
    const n = boosterQty === 'max' ? maxAff : Math.min(boosterQty, maxAff)
    if (n < 1) {
      addConsoleMessage(`Pas assez de Croûtes pour ${booster.name}.`, 'text-red-500')
      return
    }
    const results = []
    for (let i = 0; i < n; i++) results.push(rollRelic(booster, Math.random(), Math.random()))
    setGameState((prev) => {
      const relics = { ...prev.relics }
      results.forEach((r) => {
        relics[r.id] = (relics[r.id] || 0) + 1
      })
      return { ...prev, croutes: prev.croutes - booster.price * n, relics }
    })
    if (results.length === 1) {
      // Roulette (style CS:GO) : bande de reliques aléatoires, la gagnante au centre.
      const WIN = 38
      const strip = Array.from({ length: 44 }, (_, i) => (i === WIN ? results[0] : RELICS[Math.floor(Math.random() * RELICS.length)]))
      setPull({ booster, results, phase: 'roll', strip, win: WIN })
      setTimeout(() => setPull((p) => (p ? { ...p, phase: 'reveal' } : null)), 2750)
    } else {
      setPull({ booster, results, phase: 'reveal' })
    }
    const best = results.reduce((a, r) => (RARITY_RANK[r.rarity] > RARITY_RANK[a.rarity] ? r : a), results[0])
    addConsoleMessage(`🎰 ${n}× ${booster.name} — meilleure : ${best.name} (${RARITY_META[best.rarity].label})`, best.rarity === 'legendary' ? 'text-yellow-300' : best.rarity === 'epic' ? 'text-purple-300' : 'text-blue-300')
  }

  // --- Contrats : récompenses + frenzy --------------------------------------
  const applyContractReward = (s, ct) => {
    const r = ct.reward
    if (r.kind === 'money') s.money += r.amount
    else if (r.kind === 'frometons') {
      s.frometons += r.amount
      s.totalFrometonsEarned += r.amount
      s.runFrometonsEarned = (s.runFrometonsEarned || 0) + r.amount
    } else if (r.kind === 'croute') s.croutes = (s.croutes || 0) + r.amount
    else if (r.kind === 'booster') {
      const relic = rollRelic(BOOSTERS[0], Math.random(), Math.random())
      s.relics = { ...s.relics, [relic.id]: (s.relics[relic.id] || 0) + 1 }
    }
    // 'boost' est géré hors updater (triggerFrenzy)
  }

  const triggerFrenzy = (effect, duration) => {
    setGameState((prev) => ({ ...prev, currentHappenings: { type: 'bonus', duration, message: `Frenzy ×${effect} !`, effect, label: `Production & clics ×${effect}`, icon: '🎁', endsAt: Date.now() + duration * 1000 } }))
    setTimeout(() => {
      setGameState((prev) => (prev.currentHappenings && prev.currentHappenings.effect === effect ? { ...prev, currentHappenings: null } : prev))
    }, duration * 1000)
  }

  const currentMetric = (g, metric, cheese) =>
    metric === 'totalCheeseProduced' ? (g.totalCheeseProduced && g.totalCheeseProduced[cheese]) || 0 : g[metric] || 0

  // Accepter une proposition : la baseline est fixée MAINTENANT (ça compte à partir
  // de la validation), et les autres propositions sont remplacées.
  const acceptContract = (offer) => {
    setGameState((prev) => {
      if ((prev.contracts || []).length >= 3) return prev
      const contract = { ...offer, baseline: currentMetric(prev, offer.metric, offer.cheese) }
      return { ...prev, contracts: [...(prev.contracts || []), contract], contractOffers: [] }
    })
  }

  // Réclamer un contrat terminé (manuel) → récompense + slot libéré.
  const claimContract = (key) => {
    const ct = (gameState.contracts || []).find((c) => c.key === key)
    if (!ct || contractProgress(ct, gameState) < ct.target) return
    setGameState((prev) => {
      const c = (prev.contracts || []).find((x) => x.key === key)
      if (!c || contractProgress(c, prev) < c.target) return prev
      const s = { ...prev, relics: { ...prev.relics } }
      applyContractReward(s, c)
      s.contracts = (prev.contracts || []).filter((x) => x.key !== key)
      s.contractsCompleted = (prev.contractsCompleted || 0) + 1
      return s
    })
    addConsoleMessage(`✅ Contrat réclamé : ${ct.label} → ${rewardLabel(ct.reward)}`, 'text-green-400')
    if (ct.reward.kind === 'boost') triggerFrenzy(3, 30)
  }

  // --- Auto-acheteur (relique Régisseur) ------------------------------------
  const autoBuyCheapest = () => {
    setGameState((prev) => {
      let bestIdx = -1
      let bestCost = Infinity
      prev.buildings.forEach((b, i) => {
        const c = Math.round(b.cost * relicFxRef.current.buildingCostMult)
        if (c <= prev.money && c < bestCost) {
          bestCost = c
          bestIdx = i
        }
      })
      if (bestIdx === -1) return prev
      const b = prev.buildings[bestIdx]
      const newCount = b.currentCount + 1
      const newCost = Math.round(b.baseCost * Math.pow(2.0, newCount))
      return {
        ...prev,
        money: prev.money - bestCost,
        buildings: prev.buildings.map((x, i) => (i === bestIdx ? { ...x, currentCount: newCount, cost: newCost } : x)),
      }
    })
  }

  // Réinitialise complètement la partie (efface la sauvegarde + état frais).
  const resetGame = () => {
    try {
      localStorage.removeItem('frometonsGame')
    } catch (e) {
      /* ignore */
    }
    const fresh = JSON.parse(JSON.stringify(initialGameState))
    const eq = fresh.unlockedCheeses.length ? 100 / fresh.unlockedCheeses.length : 0
    fresh.cheeseWeights = {}
    fresh.unlockedCheeses.forEach((c) => {
      fresh.cheeseWeights[c] = eq
      fresh.cheesePrices[c] = { ...fresh.cheesePrices[c], currentMarketPrice: fresh.cheesePrices[c].basePrice }
    })
    fresh.gameStartTime = null
    setGameState(fresh)
    setConsoleMessages([])
    setGolden(null)
    setOfflineReport(null)
    setToasts([])
    setConfirmReset(false)
    addConsoleMessage('🗑️ Partie réinitialisée. Nouveau départ !', 'text-red-400')
  }

  const exportSave = () => {
    const dataStr = JSON.stringify(gameState)
    const downloadLink = document.createElement('a')
    downloadLink.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(dataStr)
    downloadLink.download = 'frometons_save.json'
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
    addConsoleMessage('Sauvegarde exportée !', 'text-gray-400')
  }

  const importSave = (event) => {
    const fileReader = new FileReader()
    fileReader.onload = (e) => {
      try {
        const importedState = JSON.parse(e.target.result)
        if (
          typeof importedState.frometons === 'number' &&
          typeof importedState.money === 'number' &&
          typeof importedState.clickPower === 'number' &&
          importedState.upgrades &&
          Array.isArray(importedState.upgrades.clickPower) &&
          Array.isArray(importedState.upgrades.critical) &&
          Array.isArray(importedState.buildings) &&
          typeof importedState.cheeseInventory === 'object' &&
          typeof importedState.cheesePrices === 'object' &&
          Array.isArray(importedState.unlockedCheeses)
        ) {
          const deepMerge = (target, source) => {
            const output = { ...target }
            if (target && typeof target === 'object' && source && typeof source === 'object') {
              Object.keys(source).forEach((key) => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                  output[key] = deepMerge(target[key], source[key])
                } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                  output[key] = source[key]
                } else {
                  output[key] = source[key]
                }
              })
            }
            return output
          }

          const mergedImportedState = deepMerge(initialGameState, importedState)

          Object.keys(initialGameState.cheeseInventory).forEach((cheeseType) => {
            if (typeof mergedImportedState.cheeseInventory[cheeseType] === 'undefined') {
              mergedImportedState.cheeseInventory[cheeseType] = initialGameState.cheeseInventory[cheeseType]
            }
            if (typeof mergedImportedState.cheesePrices[cheeseType] === 'undefined') {
              mergedImportedState.cheesePrices[cheeseType] = initialGameState.cheesePrices[cheeseType]
            }
            if (mergedImportedState.cheesePrices[cheeseType].currentMarketPrice !== undefined) delete mergedImportedState.cheesePrices[cheeseType].currentMarketPrice
            if (mergedImportedState.cheesePrices[cheeseType].supplyFactor !== undefined) delete mergedImportedState.cheesePrices[cheeseType].supplyFactor
          })

          if (!mergedImportedState.cheeseWeights || Object.keys(mergedImportedState.cheeseWeights).length === 0 || !mergedImportedState.unlockedCheeses.every((c) => mergedImportedState.cheeseWeights[c] !== undefined)) {
            const numUnlocked = mergedImportedState.unlockedCheeses.length
            if (numUnlocked > 0) {
              const initialEqualWeight = 100 / numUnlocked
              mergedImportedState.cheeseWeights = {}
              mergedImportedState.unlockedCheeses.forEach((cheeseType) => {
                mergedImportedState.cheeseWeights[cheeseType] = initialEqualWeight
              })
            }
          } else {
            mergedImportedState.cheeseWeights = normalizeCheeseWeights(mergedImportedState.cheeseWeights, mergedImportedState.unlockedCheeses)
          }

          mergedImportedState.unlockedCheeses.forEach((cheeseType) => {
            const basePrice = initialGameState.cheesePrices[cheeseType].basePrice
            const currentWeight = mergedImportedState.cheeseWeights[cheeseType]
            let calculatedPrice = basePrice * (currentWeight / 100)
            const minPrice = basePrice * 0.01
            const maxPrice = basePrice * 1.5
            calculatedPrice = Math.max(minPrice, Math.min(maxPrice, calculatedPrice))
            mergedImportedState.cheesePrices[cheeseType] = { ...mergedImportedState.cheesePrices[cheeseType], currentMarketPrice: calculatedPrice }
          })

          mergedImportedState.currentHappenings = null
          setGameState(mergedImportedState)
          addConsoleMessage('Sauvegarde importée avec succès !', 'text-green-500')
        } else {
          addConsoleMessage('Fichier de sauvegarde invalide.', 'text-red-500')
        }
      } catch (error) {
        addConsoleMessage("Erreur lors de l'importation de la sauvegarde : " + error.message, 'text-red-500')
      }
    }
    fileReader.readAsText(event.target.files[0])
  }

  const hasCroutes = gameState.croutes > 0 || gameState.prestigeCount > 0
  // Multiplicateur frometon effectif (fromage sélectionné × reliques).
  const fmMult = (gameState.cheesePrices[gameState.selectedFarmingCheese]?.frometonMultiplier || 1) * relicFx.fromMult
  // Fromification de la Lune indexée sur les PALIERS (change nettement à chacun) :
  // racine → la transformation est déjà bien visible dès les premiers paliers.
  const moonCheese = Math.min(1, Math.sqrt((luna.crossed + luna.frac) / PALIERS.length))

  // Données dérivées pour l'onglet Statistiques de la console.
  const consoleInfo = {
    prestiges: gameState.prestigeCount || 0,
    croutes: gameState.croutes || 0,
    relics: relicFx.totalRelics,
    won: gameState.won,
    runF: gameState.runFrometonsEarned || 0,
    palier: luna.crossed,
    totalPaliers: PALIERS.length,
    fmMult,
    clickEff: (gameState.clickPower + relicFx.clickFlat) * relicFx.clickMult * fmMult,
    prodEff: (totalPassiveProduction.frometons || 0) * relicFx.prodMult * fmMult + relicFx.prodFlat,
    contractsCompleted: gameState.contractsCompleted || 0,
    goldensCollected: gameState.goldensCollected || 0,
  }

  return (
    <section className="text-gray-200 flex items-start justify-center">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-start justify-center gap-6">
        <div className="fc-stage w-full md:w-2/3 animate-fade-in-up">
          <div className="fc-stars" aria-hidden="true" />
          <div className="fc-inner">
            <h2 className="fc-title">Frometons Clicker</h2>

            {/* HUD — stats en pastilles (chiffres abrégés) */}
            <div className="fc-hud">
              <span className="fc-pill frometons">
                <span className="ic">🧀</span> <span className="val">{formatShort(gameState.frometons)}</span> frometons
              </span>
              <span className="fc-pill money">
                <span className="ic">💰</span> <span className="val">{formatShort(gameState.money)}€</span>
              </span>
              {hasCroutes && (
                <span className="fc-pill croutes">
                  <span className="ic">🌙</span> <span className="val">{formatShort(gameState.croutes)}</span> croûtes
                </span>
              )}
            </div>

            {/* Event actif mis en avant (bonus/malus/frenzy) */}
            {gameState.currentHappenings && (
              <div className={`fc-event ${gameState.currentHappenings.type === 'malus' ? 'malus' : 'bonus'}`}>
                <span className="fc-event-ic" aria-hidden="true">{gameState.currentHappenings.icon || '⚡'}</span>
                <div className="fc-event-body">
                  <span className="fc-event-title">
                    {gameState.currentHappenings.type === 'malus' ? 'Malus actif' : 'Bonus actif'}
                  </span>
                  <span className="fc-event-desc">{gameState.currentHappenings.label || gameState.currentHappenings.message}</span>
                </div>
                {gameState.currentHappenings.endsAt && (
                  <span className="fc-event-time">{Math.max(0, Math.ceil((gameState.currentHappenings.endsAt - Date.now()) / 1000))}s</span>
                )}
              </div>
            )}

            {/* La Lune EST la jauge de Fromification (anneau = palier en cours, lune = fromification) */}
            <div className="fc-objective">
              <div className="fc-moon-ring" style={{ '--prog': Math.round(luna.frac * 100), '--cheese': moonCheese.toFixed(3) }}>
                <div className="fc-moon" />
              </div>
              <div className="fc-obj-info">
                <div className="t">🌙 Fromification Lunaire</div>
                {luna.next ? (
                  <>
                    <div className="rate">Palier {luna.crossed + 1} · {Math.round(luna.frac * 100)}%</div>
                    <div className="next">
                      <b>{formatShort(gameState.runFrometonsEarned)}</b> / {formatShort(luna.next.f)} frometons {luna.next.lune && '🌕'}
                    </div>
                    <div className="next">
                      {PALIER_UNLOCKS[luna.crossed]?.label ? (
                        <>🔓 Débloque : <b>{PALIER_UNLOCKS[luna.crossed].label}</b></>
                      ) : luna.next.lune ? (
                        <b>Fromifie la Lune pour gagner !</b>
                      ) : (
                        'Continue de produire…'
                      )}
                    </div>
                  </>
                ) : (
                  <div className="rate">🌕 Lune fromifiée !</div>
                )}
              </div>
            </div>

            {/* Le Frometon — centre cliquable */}
            <div className="fc-coin-wrap">
              <button
                ref={clickButtonRef}
                onClick={clickFrometon}
                onKeyDown={blockKeyRepeat}
                className="fc-coin"
                aria-label="Cliquer pour récolter des frometons"
              >
                <img src={frometonsImage} alt="Frometon" />
                {floatingTexts.map((text) => (
                  <FloatingText
                    key={text.id}
                    id={text.id}
                    value={text.value}
                    isCritical={text.isCritical}
                    x={text.x}
                    y={text.y}
                    onAnimationEnd={handleFloatingTextAnimationEnd}
                  />
                ))}
              </button>
              <div className="fc-moon-hint">Clique le frometon</div>
              <div className="fc-moon-stats">
                <span>Clic : <b>{formatShort((gameState.clickPower + relicFx.clickFlat) * relicFx.clickMult * fmMult)}</b></span>
                <span>Prod/s : <b>{formatShort((totalPassiveProduction.frometons || 0) * relicFx.prodMult * fmMult + relicFx.prodFlat)}</b></span>
                <span>Crit : <b>{Math.round(Math.min(1, gameState.criticalClickChance + relicFx.critChanceAdd) * 100)}%</b></span>
              </div>
            </div>

            {/* Fromage produit */}
            <div className="flex items-center justify-center gap-2 mb-5 text-sm text-gray-300">
              <label htmlFor="cheese-select">Produire :</label>
              <select
                id="cheese-select"
                value={gameState.selectedFarmingCheese}
                onChange={(e) => setGameState((prev) => ({ ...prev, selectedFarmingCheese: e.target.value }))}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {gameState.unlockedCheeses.map((cheese) => (
                  <option key={cheese} value={cheese} className="text-black">
                    {cheese}
                  </option>
                ))}
              </select>
              <span className="text-amber-300">×{((gameState.cheesePrices[gameState.selectedFarmingCheese]?.frometonMultiplier || 1) * relicFx.fromMult).toFixed(1)}</span>
            </div>

            <div className="fc-tabs">
              {[
                ['upgrades', '💪 Améliorations'],
                ['buildings', '🏭 Bâtiments'],
                ['market', '💱 Marché'],
                ['unlocks', '🧀 Fromages'],
                ['contracts', '📜 Contrats'],
                ['prestige', '✨ Prestige'],
              ]
                .filter(([key]) => unlocks.tabs.has(key) || (key === 'prestige' && hasCroutes))
                .map(([key, label]) => (
                <button key={key} onClick={() => setCurrentSubTab(key)} className={`fc-tab ${currentSubTab === key ? 'active' : ''}`}>
                  {label}
                </button>
              ))}
            </div>

          {(currentSubTab === 'upgrades' || currentSubTab === 'buildings') && (
            <div className="fc-qty">
              <span className="lbl">Acheter :</span>
              {[
                [1, '×1'],
                [10, '×10'],
                ['max', 'Max'],
              ].map(([q, label]) => (
                <button key={label} onClick={() => setBuyQty(q)} className={buyQty === q ? 'active' : ''}>
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-8">
            {currentSubTab === 'upgrades' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-3xl font-semibold text-purple-300 mb-6">Améliorations de Clic</h3>
                  <div className="space-y-4">
                    {gameState.upgrades.clickPower.map((upgrade, index) => {
                      if (!unlocks.clickUpgrades.has(index)) return null
                      const plan = planClickUpgrade(upgrade, gameState.frometons, buyQty)
                      const affordable = plan.n > 0
                      return (
                      <Tooltip key={index} content={upgrade.description}>
                        <button
                          onClick={() => buyUpgrade('clickPower', index, buyQty)}
                          disabled={!affordable}
                          className={`w-full p-4 rounded-xl shadow-md transition-all duration-200 min-h-[100px] flex flex-col justify-center items-center text-center ${
                            affordable ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <p className="font-bold text-xl">
                            {upgrade.name} (Niveau {upgrade.currentLevel})
                          </p>
                          <p className="text-sm">
                            Coût{affordable && plan.n > 1 ? ` ×${plan.n}` : ''}: {formatNumber(affordable ? plan.total : upgrade.cost)} Frometons
                          </p>
                          <p className="text-sm">Clic +{(upgrade.effect * (affordable ? plan.n : 1)).toFixed(1)}</p>
                        </button>
                      </Tooltip>
                      )
                    })}
                  </div>
                </div>

                <div className={unlocks.critUpgrades.size === 0 ? 'hidden' : ''}>
                  <h3 className="text-3xl font-semibold text-red-300 mb-6">Améliorations Critiques</h3>
                  <div className="space-y-4">
                    {gameState.upgrades.critical.map((upgrade, index) => {
                      if (!unlocks.critUpgrades.has(index)) return null
                      const plan = planCritUpgrade(upgrade, gameState.frometons, gameState.money, buyQty)
                      const affordable = plan.n > 0
                      const mult = affordable ? plan.n : 1
                      return (
                      <Tooltip key={index} content={upgrade.description}>
                        <button
                          onClick={() => buyUpgrade('critical', index, buyQty)}
                          disabled={!affordable}
                          className={`w-full p-4 rounded-xl shadow-md transition-all duration-200 min-h-[100px] flex flex-col justify-center items-center text-center ${
                            affordable ? 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <p className="font-bold text-xl">
                            {upgrade.name} (Niveau {upgrade.currentLevel})
                          </p>
                          <p className="text-sm">
                            Coût{affordable && plan.n > 1 ? ` ×${plan.n}` : ''}: {formatNumber(affordable ? plan.fTotal : upgrade.frometonCost)} Frometons, {formatNumber(affordable ? plan.mTotal : upgrade.moneyCost)}€
                          </p>
                          <p className="text-sm">{upgrade.type === 'chance' ? `Chance +${(upgrade.effect * mult * 100).toFixed(0)}%` : `Multiplicateur +${(upgrade.effect * mult).toFixed(1)}x`}</p>
                        </button>
                      </Tooltip>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {currentSubTab === 'buildings' && (
              <div>
                <h3 className="text-3xl font-semibold text-green-300 mb-6">Bâtiments de Fromagerie</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(() => {
                    return gameState.buildings.map((building, index) => {
                      if (!unlocks.buildings.has(index)) return null
                      const plan = planBuildingPurchase(building, gameState.money, buyQty, relicFx.buildingCostMult)
                      const affordable = plan.n > 0
                      return (
                        <Tooltip key={index} content={building.description}>
                          <div className="relative bg-gray-700 p-4 rounded-xl shadow-md border border-gray-600 flex flex-col justify-between min-h-[150px]">
                            <p className="font-bold text-xl text-white">
                              {building.name} (x{building.currentCount})
                            </p>
                            <p className="text-sm text-gray-300">
                              Coût{affordable && plan.n > 1 ? ` ×${plan.n}` : ''}: {formatNumber(affordable ? plan.total : building.cost)}€
                            </p>
                            <p className="text-sm text-gray-300 mb-2">
                              Production: {building.effect.toFixed(1)} {building.selectedProduction}/s
                            </p>
                            <select
                              value={building.selectedProduction}
                              onChange={(e) => setBuildingProduction(index, e.target.value)}
                              className="p-1 rounded-md bg-gray-600 text-white text-sm border border-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 mb-2"
                            >
                              <option value="frometons">Frometons</option>
                              {gameState.unlockedCheeses.map((cheese) => (
                                <option key={cheese} value={cheese}>
                                  {cheese}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => buyBuilding(index, buyQty)}
                              disabled={!affordable}
                              className={`w-full px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                                affordable ? 'bg-orange-600 hover:bg-orange-700 text-white transform hover:scale-105' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              Acheter{affordable && plan.n > 1 ? ` ×${plan.n}` : ''}
                            </button>
                          </div>
                        </Tooltip>
                      )
                    })
                  })()}
                </div>
              </div>
            )}

            {currentSubTab === 'market' && (
              <div>
                <h3 className="text-3xl font-semibold text-yellow-300 mb-6">Marché des Fromages</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(gameState.cheeseInventory).map(
                    (cheeseType) =>
                      gameState.unlockedCheeses.includes(cheeseType) && (
                        <div key={cheeseType} className="bg-gray-700 p-4 rounded-xl shadow-md border border-gray-600 text-left">
                          <p className="font-bold text-xl text-white">{cheeseType}</p>
                          <p className="text-lg text-gray-300">
                            En stock: <span className="text-blue-300">{formatNumber(gameState.cheeseInventory[cheeseType])}</span> unités
                          </p>
                          <p className="text-lg text-gray-300">
                            Prix actuel: <span className="text-green-300">{gameState.cheesePrices[cheeseType]?.currentMarketPrice.toFixed(2)}€</span>/unité
                          </p>
                          <p className="text-lg text-gray-300">
                            Poids marché: <span className="text-purple-300">{gameState.cheeseWeights[cheeseType]?.toFixed(2)}%</span>
                          </p>
                          <button
                            onClick={() => sellCheese(cheeseType)}
                            disabled={gameState.cheeseInventory[cheeseType] <= 0}
                            className={`mt-3 w-full px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                              gameState.cheeseInventory[cheeseType] > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Vendre tout
                          </button>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {currentSubTab === 'unlocks' && (
              <div>
                <h3 className="text-3xl font-semibold text-teal-300 mb-6">Débloquer de Nouveaux Fromages</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.keys(initialGameState.cheeseUnlockCosts).map(
                    (cheeseType) =>
                      !gameState.unlockedCheeses.includes(cheeseType) && (
                        <div key={cheeseType} className="bg-gray-700 p-4 rounded-xl shadow-md border border-gray-600 text-left">
                          <p className="font-bold text-xl text-white">{cheeseType}</p>
                          <p className="text-lg text-gray-300">
                            Coût: <span className="text-red-300">{formatNumber(gameState.cheeseUnlockCosts[cheeseType].money)}€</span>,{' '}
                            <span className="text-yellow-300">{formatNumber(gameState.cheeseUnlockCosts[cheeseType].frometons)} Frometons</span>
                          </p>
                          <button
                            onClick={() => unlockCheese(cheeseType)}
                            disabled={gameState.money < gameState.cheeseUnlockCosts[cheeseType].money || gameState.frometons < gameState.cheeseUnlockCosts[cheeseType].frometons}
                            className={`mt-3 w-full px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                              gameState.money >= gameState.cheeseUnlockCosts[cheeseType].money && gameState.frometons >= gameState.cheeseUnlockCosts[cheeseType].frometons
                                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            Débloquer
                          </button>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

            {currentSubTab === 'contracts' && (
              <div className="text-left">
                <h3 className="text-3xl font-semibold text-green-300 mb-2">Contrats</h3>
                <p className="text-sm text-gray-400 mb-5">Choisis tes contrats, puis réclame la récompense une fois terminés.</p>

                {/* Contrats acceptés (en cours) */}
                {(gameState.contracts || []).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                    {(gameState.contracts || []).map((ct) => {
                      const prog = contractProgress(ct, gameState)
                      const pct = Math.min(100, Math.round((prog / ct.target) * 100))
                      const done = prog >= ct.target
                      return (
                        <div key={ct.key} className={`p-3 rounded-xl border ${done ? 'bg-gray-700 border-green-500' : 'bg-gray-700 border-gray-600'}`}>
                          <p className="font-semibold text-white text-sm">{ct.label}</p>
                          <div className="h-2 bg-gray-600 rounded-full my-2 overflow-hidden">
                            <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-gray-400">
                            {formatNumber(prog)} / {formatNumber(ct.target)} ({pct}%)
                          </p>
                          <p className="text-xs text-amber-300 mt-1">🎁 {rewardLabel(ct.reward)}</p>
                          <button
                            onClick={() => claimContract(ct.key)}
                            disabled={!done}
                            className={`mt-2 w-full px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${done ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                          >
                            {done ? 'Réclamer 🎁' : 'En cours…'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Propositions : choisir un contrat (max 3 actifs) */}
                {(gameState.contracts || []).length < 3 && (gameState.contractOffers || []).length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-purple-300 mb-2">Nouveau contrat — choisis-en un</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(gameState.contractOffers || []).map((offer) => (
                        <button
                          key={offer.key}
                          onClick={() => acceptContract(offer)}
                          className="p-3 rounded-xl border border-gray-600 bg-gray-800 hover:border-green-400 hover:scale-[1.02] transition-all text-left"
                        >
                          <p className="font-semibold text-white text-sm">{offer.label}</p>
                          <p className="text-xs text-gray-400 mt-1">Objectif : {formatNumber(offer.target)}</p>
                          <p className="text-xs text-amber-300 mt-1">🎁 {rewardLabel(offer.reward)}</p>
                          <span className="inline-block mt-2 text-xs font-semibold text-green-300">Accepter →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentSubTab === 'prestige' && (
              <div className="text-left">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-3xl font-semibold text-amber-300">Prestige</h3>
                    <p className="text-sm text-gray-400">
                      Croûtes : <span className="text-amber-300 font-bold">{formatNumber(gameState.croutes)}</span> · Prestiges : {gameState.prestigeCount}
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmPrestige(true)}
                    disabled={prestigeGain < 1}
                    className={`px-6 py-3 rounded-full font-semibold transition-colors ${prestigeGain >= 1 ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                  >
                    Prestige (+{prestigeGain} Croûte{prestigeGain > 1 ? 's' : ''})
                  </button>
                </div>
                {prestigeGain < 1 && (
                  <p className="text-xs text-gray-500 mb-6">
                    Atteins {formatShort(10000)} frometons dans ce run pour gagner ta 1ʳᵉ Croûte (run : {formatShort(gameState.runFrometonsEarned)}).
                  </p>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <h4 className="text-xl font-semibold text-purple-300">Boosters de reliques</h4>
                  <div className="fc-qty" style={{ margin: 0 }}>
                    <span className="lbl">Ouvrir :</span>
                    {[
                      [1, '×1'],
                      [10, '×10'],
                      ['max', 'Max'],
                    ].map(([q, label]) => (
                      <button key={label} onClick={() => setBoosterQty(q)} className={boosterQty === q ? 'active' : ''}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                  {BOOSTERS.map((b) => {
                    const maxAff = Math.floor((gameState.croutes || 0) / b.price)
                    const n = boosterQty === 'max' ? maxAff : Math.min(boosterQty, maxAff)
                    const ok = n >= 1
                    const oddsStr = ['common', 'rare', 'epic', 'legendary']
                      .filter((r) => b.odds[r] > 0)
                      .map((r) => `${RARITY_META[r].label} ${Math.round(b.odds[r] * 100)}%`)
                      .join(' · ')
                    return (
                      <button
                        key={b.id}
                        onClick={() => buyBooster(b.id)}
                        disabled={!ok}
                        className={`p-4 rounded-xl border text-center transition-all ${ok ? 'bg-gray-700 border-gray-600 hover:border-amber-400 hover:scale-105' : 'bg-gray-800 border-gray-700 opacity-60 cursor-not-allowed'}`}
                      >
                        <div className="text-3xl">{b.icon}</div>
                        <div className="font-bold text-white">{b.name}</div>
                        <div className="text-sm text-amber-300">
                          {ok && n > 1 ? `${n}× = ${formatShort(b.price * n)} 🧀` : `${b.price} 🧀`}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 leading-tight">{oddsStr}</div>
                      </button>
                    )
                  })}
                </div>

                <h4 className="text-xl font-semibold text-purple-300 mb-3">
                  Reliques <span className="text-sm text-gray-400">({relicFx.totalRelics} possédées)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RELICS.map((r) => {
                    const cnt = gameState.relics[r.id] || 0
                    const meta = RARITY_META[r.rarity]
                    return (
                      <div
                        key={r.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border ${cnt > 0 ? 'bg-gray-700/60' : 'bg-gray-800/40 opacity-50'}`}
                        style={{ borderColor: cnt > 0 ? meta.color : '#374151' }}
                      >
                        <span className="text-2xl flex-shrink-0">{cnt > 0 ? r.icon : '🔒'}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: cnt > 0 ? meta.color : '#9ca3af' }}>
                            {r.name} {cnt > 0 && <span className="text-white">×{cnt}</span>}
                          </p>
                          <p className="text-xs text-gray-400">{r.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <button onClick={exportSave} className="fc-btn ghost">
              Exporter
            </button>
            <label className="fc-btn ghost cursor-pointer">
              Importer
              <input type="file" accept=".json" className="hidden" onChange={importSave} />
            </label>
            <button onClick={() => setConfirmReset(true)} className="fc-btn red">
              Réinitialiser
            </button>
          </div>
          </div>
        </div>

        {/* Desktop console (sticky) */}
        <div className="fc-console hidden md:flex md:flex-col md:w-[34%] lg:w-[30%] md:sticky md:top-4 md:h-[calc(100vh-9rem)] md:max-h-[680px] p-4 rounded-2xl shadow-2xl">
          <ConsoleAndStatsPanel
            gameState={gameState}
            consoleMessages={consoleMessages}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            formatNumber={formatNumber}
            formatShort={formatShort}
            formatTime={formatTime}
            showFixedButton={true}
            clickFrometon={clickFrometon}
            blockKeyRepeat={blockKeyRepeat}
            achievementsDef={ACHIEVEMENTS}
            production={productionPerSec}
            info={consoleInfo}
            clickButtonRef={null}
          />
        </div>

      </div>

      {/* Mobile console — rendue via portal sur document.body pour échapper à
          tout ancêtre transformé (sinon position:fixed se cale sur l'ancêtre et
          la console finit au milieu de la page au lieu d'être collée en bas). */}
      {isFrometonsSectionVisible &&
        createPortal(
          <div className={`fc-console md:hidden fixed bottom-0 inset-x-2 z-[60] px-3 pt-2 pb-3 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isMobileConsoleOpen ? 'h-[60vh]' : 'h-12'}`}>
            <div className="flex flex-shrink-0 items-center justify-between cursor-pointer pb-1.5" onClick={() => setIsMobileConsoleOpen(!isMobileConsoleOpen)}>
              <h3 className="text-lg font-semibold text-white">{isMobileConsoleOpen ? 'Console' : 'Console (Tap to open)'}</h3>
              <svg className={`w-6 h-6 text-gray-300 transition-transform duration-300 ${isMobileConsoleOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>

            {isMobileConsoleOpen && (
              <div className="flex-1 min-h-0">
                <ConsoleAndStatsPanel
                  gameState={gameState}
                  consoleMessages={consoleMessages}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  formatNumber={formatNumber}
                  formatShort={formatShort}
                  formatTime={formatTime}
                  showFixedButton={true}
                  clickFrometon={clickFrometon}
                  blockKeyRepeat={blockKeyRepeat}
                  achievementsDef={ACHIEVEMENTS}
                  production={productionPerSec}
                  info={consoleInfo}
                  clickButtonRef={null}
                  compact={true}
                />
              </div>
            )}
          </div>,
          document.body
        )}

      {/* Golden Frometon — cliquable où qu'il apparaisse (portal → viewport). */}
      {golden &&
        createPortal(
          <button
            className="golden-frometon"
            style={{ left: golden.x + 'vw', top: golden.y + 'vh' }}
            onClick={collectGolden}
            aria-label="Golden Frometon — clique vite !"
          >
            <img src={frometonsImage} alt="" />
          </button>,
          document.body
        )}

      {/* Récap progression hors-ligne au retour. */}
      {offlineReport &&
        createPortal(
          <div
            className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setOfflineReport(null)}
          >
            <div
              className="bg-gray-900 border-l-4 border-yellow-500 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-yellow-300 mb-2">Bon retour ! 🧀</h3>
              <p className="text-gray-300 text-sm mb-4">
                Pendant ton absence ({formatTime(offlineReport.seconds * 1000)}
                {offlineReport.capped ? ', plafonné à 8 h' : ''}), tes fromageries ont produit :
              </p>
              {offlineReport.frometons > 0 && (
                <p className="text-xl font-bold mb-1">
                  +{formatNumber(offlineReport.frometons)} <span className="text-yellow-300">Frometons</span>
                </p>
              )}
              {Object.keys(offlineReport.cheese).length > 0 && (
                <div className="text-sm text-gray-300 mb-2">
                  {Object.entries(offlineReport.cheese).map(([t, v]) => (
                    <p key={t}>
                      +{formatNumber(v)} <span className="text-blue-300">{t}</span>
                    </p>
                  ))}
                </div>
              )}
              <button
                onClick={() => setOfflineReport(null)}
                className="mt-4 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-full shadow-lg transition-colors"
              >
                Encaisser
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* Confirmation de réinitialisation. */}
      {confirmReset &&
        createPortal(
          <div
            className="fixed inset-0 z-[85] bg-black/70 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setConfirmReset(false)}
          >
            <div
              className="bg-gray-900 border-l-4 border-red-500 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold text-red-400 mb-2">Réinitialiser la partie ?</h3>
              <p className="text-gray-300 text-sm mb-5">
                Toute ta progression (frometons, bâtiments, succès…) sera <b className="text-red-300">définitivement perdue</b>. Cette action est irréversible.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={resetGame}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors"
                >
                  Tout effacer
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Confirmation de prestige. */}
      {confirmPrestige &&
        createPortal(
          <div className="fixed inset-0 z-[85] bg-black/70 flex items-center justify-center p-4 animate-fade-in" onClick={() => setConfirmPrestige(false)}>
            <div className="bg-gray-900 border-l-4 border-amber-500 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-amber-300 mb-2">Prestige ?</h3>
              <p className="text-gray-300 text-sm mb-1">
                Tu gagnes <b className="text-amber-300">{prestigeGain} Croûte{prestigeGain > 1 ? 's' : ''}</b>.
              </p>
              <p className="text-gray-400 text-xs mb-5">
                Ta run (frometons, argent, bâtiments, fromages, jauge Lune) est remise à zéro. Tes <b className="text-gray-200">reliques</b>, <b className="text-gray-200">Croûtes</b> et succès sont conservés.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setConfirmPrestige(false)} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-semibold transition-colors">
                  Annuler
                </button>
                <button onClick={doPrestige} className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full font-semibold transition-colors">
                  Prestige
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Gacha : ouverture de booster (roulette → révélation simple, ou grille multi). */}
      {pull &&
        createPortal(
          <div className="fc-gacha" onClick={() => pull.phase === 'reveal' && setPull(null)}>
            {pull.phase === 'roll' ? (
              <div className="fc-roulette" onClick={(e) => e.stopPropagation()}>
                <div className="fc-roulette-title">{pull.booster.icon} {pull.booster.name}…</div>
                <div className="fc-roulette-view">
                  <div className="fc-roulette-marker" aria-hidden="true" />
                  <div className="fc-roulette-strip" style={{ '--end': `${-(pull.win * 84 + 38)}px` }}>
                    {pull.strip.map((r, i) => {
                      const m = RARITY_META[r.rarity]
                      return (
                        <div key={i} className="fc-roulette-cell" style={{ borderColor: m.color, boxShadow: `0 0 8px ${m.glow}` }}>
                          {r.icon}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : pull.results.length === 1
              ? (() => {
                  const r = pull.results[0]
                  const m = RARITY_META[r.rarity]
                  const count = gameState.relics[r.id] || 1
                  return (
                    <div className={`fc-gacha-card ${r.rarity}`} style={{ '--rc': m.color, '--rg': m.glow }} onClick={(e) => e.stopPropagation()}>
                      <div className="fc-gacha-rays" aria-hidden="true" />
                      <div className="fc-gacha-burst" aria-hidden="true" />
                      <div className="fc-gacha-rarity">{m.label}</div>
                      <div className="fc-gacha-ic">{r.icon}</div>
                      <div className="fc-gacha-name">{r.name}</div>
                      <div className="fc-gacha-desc">{r.desc}</div>
                      <div className="fc-gacha-dup">Possédée ×{count}</div>
                      <button className="fc-btn fc-gacha-btn" onClick={() => setPull(null)}>Récupérer</button>
                    </div>
                  )
                })()
              : (
                <div className="fc-gacha-multi" onClick={(e) => e.stopPropagation()}>
                  <h3 className="fc-gacha-title">{pull.results.length} reliques obtenues !</h3>
                  <div className="fc-gacha-grid">
                    {pull.results.map((r, i) => {
                      const m = RARITY_META[r.rarity]
                      return (
                        <div key={i} className={`fc-gacha-cell ${r.rarity}`} style={{ '--rc': m.color, '--rg': m.glow, animationDelay: `${Math.min(i * 0.04, 1.4)}s` }} title={`${r.name} — ${r.desc}`}>
                          <span className="ic">{r.icon}</span>
                          <span className="rar" style={{ color: m.color }}>{m.label}</span>
                        </div>
                      )
                    })}
                  </div>
                  <button className="fc-btn fc-gacha-btn" onClick={() => setPull(null)}>Récupérer tout</button>
                </div>
              )}
          </div>,
          document.body
        )}

      {/* Victoire : cinématique — la Lune se mue en frometon géant. */}
      {showVictory &&
        createPortal(
          <div className="fc-cine">
            <div className="fc-cine-stage">
              <div className="fc-cine-rays" aria-hidden="true" />
              <div className="fc-cine-moon" aria-hidden="true" />
              <div className="fc-cine-flash" aria-hidden="true" />
              <img className="fc-cine-coin" src={frometonsImage} alt="" />
            </div>
            <h2 className="fc-cine-title">Tu as fromifié la Lune !</h2>
            <p className="fc-cine-sub">
              La Lune est officiellement un frometon géant. Les astronomes pleurent, les souris exultent. Continue en{' '}
              <b style={{ color: '#ffd166' }}>mode infini</b> : prestige encore et bats ton record !
            </p>
            <button className="fc-cine-btn fc-btn" onClick={() => setShowVictory(false)}>
              Continuer (∞)
            </button>
          </div>,
          document.body
        )}

      {/* Toasts de succès — descendent du haut de l'écran (style Steam). */}
      {toasts.length > 0 &&
        createPortal(
          <div className="fixed top-0 inset-x-0 z-[90] flex flex-col items-center gap-2 pt-3 px-3 pointer-events-none">
            {toasts.map((t) => (
              <div key={t.key} className="achievement-toast">
                <span className="ach-icon" aria-hidden="true">{t.icon}</span>
                <div className="ach-text">
                  <span className="ach-label">{t.label}</span>
                  <span className="ach-title">{t.title}</span>
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}
    </section>
  )
}
