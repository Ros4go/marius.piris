import React from 'react'
import FloatingText from '../../../components/FloatingText.jsx'
import Tooltip from '../../../components/Tooltip.jsx'
import ConsoleAndStatsPanel from './ConsoleAndStatsPanel.jsx'
import './frometons.css'

// Frometons Clicker — incremental game. Ported from the original single-file
// app. Self-contained; persists to localStorage key 'frometonsGame'.
export default function FrometonsGame() {
  const frometonsImage = '/assets/images/Fromecoin.png'
  const [isFrometonsSectionVisible] = React.useState(true)
  const [maxConsoleMessages, setMaxConsoleMessages] = React.useState(10)
  const isMobileRef = React.useRef(window.innerWidth < 768)
  const [floatingTexts, setFloatingTexts] = React.useState([])
  const clickButtonRef = React.useRef(null)
  const [activeTab, setActiveTab] = React.useState('journal')
  const [isMobileConsoleOpen, setIsMobileConsoleOpen] = React.useState(false)
  const [currentSubTab, setCurrentSubTab] = React.useState('upgrades')

  const formatNumber = (num) => new Intl.NumberFormat('fr-FR').format(Math.floor(num))

  const formatTime = (milliseconds) => {
    if (milliseconds === null) return 'N/A'
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor((totalSeconds / 3600) % 24)
    const minutes = Math.floor((totalSeconds / 60) % 60)
    const seconds = totalSeconds % 60
    return `${hours}h ${minutes}m ${seconds}s`
  }

  React.useEffect(() => {
    const handleResize = () => {
      isMobileRef.current = window.innerWidth < 768
      setMaxConsoleMessages(isMobileRef.current ? 3 : 10)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const addConsoleMessage = React.useCallback(
    (text, color = 'text-gray-300') => {
      setConsoleMessages((prev) => {
        const newMessages = [...prev, { id: Date.now(), text, color }]
        return newMessages.slice(Math.max(newMessages.length - maxConsoleMessages, 0))
      })
    },
    [maxConsoleMessages]
  )

  React.useEffect(() => {
    const saveTimer = setTimeout(() => {
      try {
        const stateToSave = JSON.parse(JSON.stringify(gameState))
        localStorage.setItem('frometonsGame', JSON.stringify(stateToSave))
      } catch (error) {
        console.error('Failed to save game state to localStorage:', error)
      }
    }, 100)
    return () => clearTimeout(saveTimer)
  }, [gameState])

  const totalPassiveProduction = React.useMemo(() => {
    const production = { frometons: 0 }
    Object.keys(gameState.cheeseInventory).forEach((cheeseType) => {
      production[cheeseType] = 0
    })
    gameState.buildings.forEach((building) => {
      if (building.currentCount > 0) {
        production[building.selectedProduction] += building.effect * building.currentCount
      }
    })
    return production
  }, [gameState.buildings, gameState.cheeseInventory])

  React.useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => {
        const newCheeseInventory = { ...prev.cheeseInventory }
        const newTotalCheeseProduced = { ...prev.totalCheeseProduced }
        let newFrometons = prev.frometons
        let newTotalFrometonsEarned = prev.totalFrometonsEarned

        for (const type in totalPassiveProduction) {
          let gain = totalPassiveProduction[type]

          if (prev.currentHappenings && prev.currentHappenings.type === 'bonus') {
            gain *= prev.currentHappenings.effect
          } else if (prev.currentHappenings && prev.currentHappenings.type === 'malus') {
            gain /= prev.currentHappenings.effect
          }

          if (type === 'frometons') {
            const frometonMultiplier = prev.cheesePrices[prev.selectedFarmingCheese]?.frometonMultiplier || 1.0
            const actualFrometonGain = gain * frometonMultiplier
            newFrometons += actualFrometonGain
            newTotalFrometonsEarned += actualFrometonGain
          } else {
            newCheeseInventory[type] = (newCheeseInventory[type] || 0) + gain
            newTotalCheeseProduced[type] = (newTotalCheeseProduced[type] || 0) + gain
          }
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
          cheeseInventory: newCheeseInventory,
          totalCheeseProduced: newTotalCheeseProduced,
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [totalPassiveProduction, gameState.selectedFarmingCheese, gameState.currentHappenings, addConsoleMessage])

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

        if (eventType === 'bonus') {
          effect = Math.random() * 0.5 + 1.2
          eventMessage = `BONUS ! Production x${effect.toFixed(1)} pendant ${duration}s !`
          messageColor = 'text-green-400'
        } else {
          effect = Math.random() * 0.5 + 1.5
          eventMessage = `MALUS ! Production divisée par ${effect.toFixed(1)} pendant ${duration}s !`
          messageColor = 'text-red-400'
        }

        setGameState((prev) => ({ ...prev, currentHappenings: { type: eventType, duration, message: eventMessage, effect } }))
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

  const clickFrometon = () => {
    let currentClickPower = gameState.clickPower
    let isCritical = false

    if (Math.random() < gameState.criticalClickChance) {
      currentClickPower *= gameState.criticalClickMultiplier
      isCritical = true
    }

    const frometonMultiplier = gameState.cheesePrices[gameState.selectedFarmingCheese]?.frometonMultiplier || 1.0
    const actualFrometonGain = currentClickPower * frometonMultiplier

    setGameState((prev) => {
      if (prev.gameStartTime === null) {
        prev = { ...prev, gameStartTime: Date.now() }
      }

      const newCheeseInventory = { ...prev.cheeseInventory }
      newCheeseInventory[prev.selectedFarmingCheese] = (newCheeseInventory[prev.selectedFarmingCheese] || 0) + currentClickPower

      const newTotalFrometonsEarned = prev.totalFrometonsEarned + actualFrometonGain
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
        totalClicks: newTotalClicks,
        cheeseInventory: newCheeseInventory,
        totalCheeseProduced: newTotalCheeseProduced,
      }
    })

    setFloatingTexts((prev) => [
      ...prev,
      { id: Date.now(), value: actualFrometonGain, isCritical, x: Math.random() * 40 - 20, y: Math.random() * 40 - 20 },
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
      ? `CRITIQUE ! +${actualFrometonGain.toFixed(1)} ${gameState.selectedFarmingCheese} & Frometons !`
      : `+${actualFrometonGain.toFixed(1)} ${gameState.selectedFarmingCheese} & Frometons.`
    addConsoleMessage(clickMessage, isCritical ? 'text-yellow-300' : 'text-gray-300')
  }

  const handleFloatingTextAnimationEnd = React.useCallback((id) => {
    setFloatingTexts((prev) => prev.filter((text) => text.id !== id))
  }, [])

  const buyUpgrade = (type, index) => {
    setGameState((prev) => {
      const newUpgrades = { ...prev.upgrades }
      const upgrade = newUpgrades[type][index]

      if (type === 'clickPower') {
        if (prev.frometons >= upgrade.cost) {
          const newFrometons = prev.frometons - upgrade.cost
          const newLevel = upgrade.currentLevel + 1
          const newCost = Math.round(upgrade.baseCost * Math.pow(1.5, newLevel))
          addConsoleMessage(`Achat: ${upgrade.name} (Niveau ${newLevel}). Clic +${upgrade.effect.toFixed(1)}.`, 'text-blue-300')
          return {
            ...prev,
            frometons: newFrometons,
            clickPower: prev.clickPower + upgrade.effect,
            upgrades: {
              ...newUpgrades,
              clickPower: newUpgrades.clickPower.map((upg, i) => (i === index ? { ...upg, cost: newCost, currentLevel: newLevel } : upg)),
            },
          }
        }
        addConsoleMessage(`Pas assez de Frometons pour acheter ${upgrade.name}.`, 'text-red-500')
      } else if (type === 'critical') {
        if (prev.frometons >= upgrade.frometonCost && prev.money >= upgrade.moneyCost) {
          const newFrometons = prev.frometons - upgrade.frometonCost
          const newMoney = prev.money - upgrade.moneyCost
          const newLevel = upgrade.currentLevel + 1
          const newFrometonCost = Math.round(upgrade.baseFrometonCost * Math.pow(1.8, newLevel))
          const newMoneyCost = Math.round(upgrade.baseMoneyCost * Math.pow(1.8, newLevel))

          let messageText = ''
          if (upgrade.type === 'chance') {
            messageText = `Achat: ${upgrade.name} (Niveau ${newLevel}). Chance critique +${(upgrade.effect * 100).toFixed(0)}%.`
          } else if (upgrade.type === 'multiplier') {
            messageText = `Achat: ${upgrade.name} (Niveau ${newLevel}). Multiplicateur critique +${upgrade.effect.toFixed(1)}x.`
          }
          addConsoleMessage(messageText, 'text-blue-300')

          let newCriticalClickChance = prev.criticalClickChance
          let newCriticalClickMultiplier = prev.criticalClickMultiplier
          if (upgrade.type === 'chance') {
            newCriticalClickChance = Math.min(1, prev.criticalClickChance + upgrade.effect)
          } else if (upgrade.type === 'multiplier') {
            newCriticalClickMultiplier = prev.criticalClickMultiplier + upgrade.effect
          }

          return {
            ...prev,
            frometons: newFrometons,
            money: newMoney,
            criticalClickChance: newCriticalClickChance,
            criticalClickMultiplier: newCriticalClickMultiplier,
            upgrades: {
              ...newUpgrades,
              critical: newUpgrades.critical.map((upg, i) => (i === index ? { ...upg, frometonCost: newFrometonCost, moneyCost: newMoneyCost, currentLevel: newLevel } : upg)),
            },
          }
        }
        addConsoleMessage(`Pas assez de Frometons ou d'Argent pour acheter ${upgrade.name}.`, 'text-red-500')
      }
      return prev
    })
  }

  const buyBuilding = (index) => {
    setGameState((prev) => {
      const newBuildings = [...prev.buildings]
      const building = newBuildings[index]

      if (prev.money >= building.cost) {
        const newMoney = prev.money - building.cost
        const newCount = building.currentCount + 1
        const newCost = Math.round(building.baseCost * Math.pow(2.0, newCount))
        addConsoleMessage(`Achat: ${building.name} (x${newCount}). Production +${building.effect.toFixed(1)} ${building.selectedProduction}/s.`, 'text-green-300')
        return {
          ...prev,
          money: newMoney,
          buildings: newBuildings.map((bld, i) => (i === index ? { ...bld, cost: newCost, currentCount: newCount } : bld)),
        }
      }
      addConsoleMessage(`Pas assez d'Argent pour acheter ${building.name}.`, 'text-red-500')
      return prev
    })
  }

  const sellCheese = (cheeseType) => {
    setGameState((prev) => {
      const currentCheeseAmount = prev.cheeseInventory[cheeseType] || 0
      const currentPriceData = prev.cheesePrices[cheeseType]
      const currentMarketPrice = currentPriceData?.currentMarketPrice || 0

      if (currentCheeseAmount > 0 && currentMarketPrice > 0) {
        const moneyGained = currentCheeseAmount * currentMarketPrice
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

  return (
    <section className="text-gray-200 flex items-start justify-center">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-start justify-center gap-8">
        <div className="w-full md:w-2/3 p-6 md:p-10 rounded-3xl shadow-2xl border border-gray-700 bg-gray-900/40 animate-fade-in-up text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-8">
            Frometons Clicker
          </h2>

          <div className="flex flex-col items-center mb-10">
            <p className="text-4xl font-bold mb-2">
              Frometons: <span className="text-yellow-300">{formatNumber(gameState.frometons)}</span>
            </p>
            <p className="text-4xl font-bold mb-4">
              Argent: <span className="text-green-400">{formatNumber(gameState.money)}€</span>
            </p>

            <button
              ref={clickButtonRef}
              onClick={clickFrometon}
              className="relative w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center bg-yellow-600 hover:bg-yellow-700 transition-all duration-200 transform hover:scale-105 shadow-xl frometon-button overflow-hidden"
            >
              <img src={frometonsImage} alt="Frometon" className="w-3/4 h-3/4 object-contain" />
              <span className="absolute bottom-2 text-white text-md font-semibold">Click me!</span>
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
            <p className="text-xl mt-4">
              Puissance de clic: <span className="text-teal-300">{gameState.clickPower.toFixed(1)}</span>
            </p>
            <p className="text-xl">
              Production fromages/seconde: <span className="text-blue-300">{formatNumber(totalPassiveProduction[gameState.selectedFarmingCheese] || 0)}</span>
            </p>
            <p className="text-xl">
              Chance critique: <span className="text-red-300">{(gameState.criticalClickChance * 100).toFixed(0)}%</span>
            </p>
            <p className="text-xl">
              Multiplicateur critique: <span className="text-red-300">{gameState.criticalClickMultiplier.toFixed(1)}x</span>
            </p>
            <p className="text-xl">
              Multiplicateur Frometon (actuel): <span className="text-yellow-300">{gameState.cheesePrices[gameState.selectedFarmingCheese]?.frometonMultiplier.toFixed(1) || 1.0}x</span>
            </p>

            <div className="mt-6">
              <label htmlFor="cheese-select" className="text-xl font-semibold mr-2">
                Produire du :
              </label>
              <select
                id="cheese-select"
                value={gameState.selectedFarmingCheese}
                onChange={(e) => setGameState((prev) => ({ ...prev, selectedFarmingCheese: e.target.value }))}
                className="p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {gameState.unlockedCheeses.map((cheese) => (
                  <option key={cheese} value={cheese}>
                    {cheese}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-center flex-wrap gap-2 mb-6 border-b border-gray-700 pb-4">
            {[
              ['upgrades', 'Améliorations'],
              ['buildings', 'Bâtiments'],
              ['market', 'Marché'],
              ['unlocks', 'Débloquer Fromages'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCurrentSubTab(key)}
                className={`px-4 py-2 rounded-t-md font-semibold ${currentSubTab === key ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {currentSubTab === 'upgrades' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-3xl font-semibold text-purple-300 mb-6">Améliorations de Clic</h3>
                  <div className="space-y-4">
                    {gameState.upgrades.clickPower.map((upgrade, index) => (
                      <Tooltip key={index} content={upgrade.description}>
                        <button
                          onClick={() => buyUpgrade('clickPower', index)}
                          disabled={gameState.frometons < upgrade.cost}
                          className={`w-full p-4 rounded-xl shadow-md transition-all duration-200 min-h-[100px] flex flex-col justify-center items-center text-center ${
                            gameState.frometons >= upgrade.cost ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <p className="font-bold text-xl">
                            {upgrade.name} (Niveau {upgrade.currentLevel})
                          </p>
                          <p className="text-sm">Coût: {formatNumber(upgrade.cost)} Frometons</p>
                          <p className="text-sm">Augmente le clic de: {upgrade.effect}</p>
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-3xl font-semibold text-red-300 mb-6">Améliorations Critiques</h3>
                  <div className="space-y-4">
                    {gameState.upgrades.critical.map((upgrade, index) => (
                      <Tooltip key={index} content={upgrade.description}>
                        <button
                          onClick={() => buyUpgrade('critical', index)}
                          disabled={gameState.frometons < upgrade.frometonCost || gameState.money < upgrade.moneyCost}
                          className={`w-full p-4 rounded-xl shadow-md transition-all duration-200 min-h-[100px] flex flex-col justify-center items-center text-center ${
                            gameState.frometons >= upgrade.frometonCost && gameState.money >= upgrade.moneyCost ? 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <p className="font-bold text-xl">
                            {upgrade.name} (Niveau {upgrade.currentLevel})
                          </p>
                          <p className="text-sm">
                            Coût: {formatNumber(upgrade.frometonCost)} Frometons, {formatNumber(upgrade.moneyCost)}€
                          </p>
                          <p className="text-sm">{upgrade.type === 'chance' ? `Chance +${(upgrade.effect * 100).toFixed(0)}%` : `Multiplicateur +${upgrade.effect.toFixed(1)}x`}</p>
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentSubTab === 'buildings' && (
              <div>
                <h3 className="text-3xl font-semibold text-green-300 mb-6">Bâtiments de Fromagerie</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {gameState.buildings.map((building, index) => (
                    <Tooltip key={index} content={building.description}>
                      <div className="bg-gray-700 p-4 rounded-xl shadow-md border border-gray-600 flex flex-col justify-between min-h-[150px]">
                        <p className="font-bold text-xl text-white">
                          {building.name} (x{building.currentCount})
                        </p>
                        <p className="text-sm text-gray-300 mb-2">Coût: {formatNumber(building.cost)}€</p>
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
                          onClick={() => buyBuilding(index)}
                          disabled={gameState.money < building.cost}
                          className={`w-full px-4 py-2 rounded-full font-semibold transition-colors duration-200 ${
                            gameState.money >= building.cost ? 'bg-orange-600 hover:bg-orange-700 text-white transform hover:scale-105' : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Acheter
                        </button>
                      </div>
                    </Tooltip>
                  ))}
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
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-4 mt-8">
            <button
              onClick={exportSave}
              className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-lg font-semibold rounded-full shadow-lg hover:from-gray-700 hover:to-gray-800 transition duration-300 ease-in-out"
            >
              Exporter la sauvegarde
            </button>
            <label className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-lg font-semibold rounded-full shadow-lg hover:from-gray-700 hover:to-gray-800 transition duration-300 ease-in-out cursor-pointer">
              Importer la sauvegarde
              <input type="file" accept=".json" className="hidden" onChange={importSave} />
            </label>
          </div>
        </div>

        {/* Desktop console (sticky) */}
        <div className="hidden md:flex md:flex-col md:w-1/3 md:sticky md:top-4 md:h-[calc(100vh-12rem)] md:max-h-[800px] bg-gray-800 p-6 rounded-3xl shadow-2xl border border-gray-700">
          <ConsoleAndStatsPanel
            gameState={gameState}
            consoleMessages={consoleMessages}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            formatNumber={formatNumber}
            formatTime={formatTime}
            showFixedButton={true}
            clickFrometon={clickFrometon}
            clickButtonRef={null}
          />
        </div>

        {/* Mobile console (fixed) */}
        {isFrometonsSectionVisible && (
          <div className={`md:hidden fixed bottom-0 inset-x-4 z-40 bg-gray-800 p-6 rounded-t-3xl shadow-2xl border border-gray-700 flex flex-col justify-end transition-all duration-300 ease-in-out ${isMobileConsoleOpen ? 'max-h-[50vh] h-[50vh]' : 'max-h-16 h-16'}`}>
            <div className="flex flex-shrink-0 items-center justify-between cursor-pointer pb-2" onClick={() => setIsMobileConsoleOpen(!isMobileConsoleOpen)}>
              <h3 className="text-xl font-semibold text-white">{isMobileConsoleOpen ? 'Console' : 'Console (Tap to open)'}</h3>
              <svg className={`w-6 h-6 text-gray-300 transition-transform duration-300 ${isMobileConsoleOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>

            {isMobileConsoleOpen && (
              <ConsoleAndStatsPanel
                gameState={gameState}
                consoleMessages={consoleMessages}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                formatNumber={formatNumber}
                formatTime={formatTime}
                showFixedButton={true}
                clickFrometon={clickFrometon}
                clickButtonRef={null}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
