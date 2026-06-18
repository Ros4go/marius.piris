// Méta-progression du Frometons Clicker : prestige (Croûtes), gacha de reliques
// (boosters), Fromification Lunaire (paliers + victoire) et contrats.
// Tout ici est PUR (données + helpers) — l'état vit dans FrometonsGame.

// --- Croûtes (monnaie de prestige) ------------------------------------------
export const CROUTE_SCALE = 1e4 // frometons du run pour 1 Croûte (avant racine)
export const PRESTIGE_UNLOCK = 1e5 // frometons à vie avant que le prestige apparaisse

// Gain de Croûtes pour un run, courbe racine (runs courts & punchy).
export function crouteGain(runFrometons, crouteMult = 1) {
  if (runFrometons < CROUTE_SCALE) return 0
  return Math.floor(Math.sqrt(runFrometons / CROUTE_SCALE) * crouteMult)
}

// --- Fromification Lunaire ---------------------------------------------------
// Jauge PAR RUN (remplie par les frometons du run, reset au prestige).
// Chaque palier franchi → +taux de vente au marché. Le dernier = victoire.
export const MARKET_RATE_PER_PALIER = 0.12 // +12% prix de vente par palier
// 11 paliers : le 11ᵉ est la Lune (cinématique de fin + mode infini ensuite).
export const PALIERS = [
  { f: 1e5 }, { f: 4e5 }, { f: 1e6 }, { f: 5e6 }, { f: 2e7 },
  { f: 1e8 }, { f: 5e8 }, { f: 2e9 }, { f: 1e10 }, { f: 5e10 },
  { f: 2e11, lune: true },
]
export const LUNE_TARGET = PALIERS[PALIERS.length - 1].f

// État de la jauge pour un total de frometons de run donné.
export function lunaState(runFrometons) {
  const rf = runFrometons || 0
  let crossed = 0
  for (const p of PALIERS) if (rf >= p.f) crossed++
  const lune = rf >= LUNE_TARGET
  // paliers de marché = paliers franchis hors palier-Lune
  const marketPaliers = PALIERS.filter((p) => rf >= p.f && !p.lune).length
  const marketBonus = marketPaliers * MARKET_RATE_PER_PALIER
  const nextIndex = PALIERS.findIndex((p) => rf < p.f)
  const next = nextIndex === -1 ? null : PALIERS[nextIndex]
  const prevF = nextIndex <= 0 ? 0 : PALIERS[nextIndex - 1].f
  // progression LINÉAIRE dans le segment courant [prevF, next.f] : « à mi-chemin
  // du prochain palier » = barre à 50 %, ce qui est intuitif.
  let frac = 1
  if (next) {
    frac = Math.max(0, Math.min(1, (rf - prevF) / (next.f - prevF)))
  }
  return { crossed, marketPaliers, marketBonus, next, nextIndex, frac, prevF, lune }
}

// Déblocages PAR RUN selon les paliers franchis (reset au prestige). L'index i
// correspond au palier PALIERS[i]. On révèle le contenu progressivement.
//  - buildings / clickUpgrades / critUpgrades : index dans les listes du jeu
//  - tabs : onglets révélés
export const PALIER_UNLOCKS = [
  { clickUpgrades: [2], buildings: [1], label: '3ᵉ amélioration de clic & 2ᵉ fromagerie' }, // P1 (1e5, ~5 min)
  { tabs: ['prestige'], label: '✨ Prestige' }, // P2 (4e5, ~20 min)
  { critUpgrades: [0], label: 'Clics critiques' }, // P3 (1e6)
  { tabs: ['contracts'], buildings: [2], label: '📜 Contrats & 3ᵉ fromagerie' }, // P4 (5e6, ~1-2 prestiges)
  { tabs: ['unlocks'], label: '🧀 Fromages' }, // P5 (2e7)
  { buildings: [3], label: '4ᵉ fromagerie' }, // P6 (1e8)
  { critUpgrades: [1], label: 'Critique avancé' }, // P7 (5e8)
  { buildings: [4], label: '5ᵉ fromagerie' }, // P8 (2e9)
  { buildings: [5], label: '6ᵉ fromagerie' }, // P9 (1e10)
]

// Contenu débloqué pour un nombre de paliers franchis (run courant).
// Base : boucle jouable + 2 améliorations de clic d'emblée.
export function unlockedContent(crossed) {
  const buildings = new Set([0])
  const clickUpgrades = new Set([0, 1])
  const critUpgrades = new Set()
  const tabs = new Set(['upgrades', 'buildings', 'market'])
  const n = Math.min(crossed, PALIER_UNLOCKS.length)
  for (let i = 0; i < n; i++) {
    const u = PALIER_UNLOCKS[i]
    ;(u.buildings || []).forEach((b) => buildings.add(b))
    ;(u.clickUpgrades || []).forEach((b) => clickUpgrades.add(b))
    ;(u.critUpgrades || []).forEach((b) => critUpgrades.add(b))
    ;(u.tabs || []).forEach((t) => tabs.add(t))
  }
  return { buildings, clickUpgrades, critUpgrades, tabs }
}

// --- Reliques (gacha, bonus permanents, stack infini) ------------------------
// rarity: common | rare | epic | legendary
// Les bonus FLAT (puissance de clic / frometons/s) sont la clé : indépendants du
// clickPower et des bâtiments, ils rendent le re-départ après prestige immédiat.
export const RELICS = [
  // Communes
  { id: 'click_s', rarity: 'common', icon: '🖱️', name: 'Souris Fromagère', desc: '+20 puissance de clic' },
  { id: 'prod_s', rarity: 'common', icon: '🥛', name: 'Petit-Lait', desc: '+12 frometons/s' },
  { id: 'from_s', rarity: 'common', icon: '🧂', name: 'Pincée de Sel', desc: '+6% multiplicateur frometon (clic & passif)' },
  { id: 'cost_s', rarity: 'common', icon: '🏷️', name: 'Négociant', desc: '−4% coût des bâtiments' },
  { id: 'market_s', rarity: 'common', icon: '💱', name: 'Étiquette Dorée', desc: '+12% prix de vente' },
  // Rares
  { id: 'click_r', rarity: 'rare', icon: '🧤', name: 'Gant du Fromager', desc: '+150 puissance de clic' },
  { id: 'prod_r', rarity: 'rare', icon: '🧫', name: 'Ferments Actifs', desc: '+80 frometons/s' },
  { id: 'crit_r', rarity: 'rare', icon: '🔪', name: 'Lame Affûtée', desc: '+8% chance de critique' },
  { id: 'golden_r', rarity: 'rare', icon: '🎣', name: 'Appât Doré', desc: '+35% fréquence des goldens' },
  { id: 'offline_r', rarity: 'rare', icon: '❄️', name: 'Cave Fraîche', desc: '+3h de récolte hors-ligne' },
  // Épiques
  { id: 'click_e', rarity: 'epic', icon: '💪', name: "Poigne d'Acier", desc: '+1 000 puissance de clic' },
  { id: 'prodbig', rarity: 'epic', icon: '⚙️', name: "Chaîne d'Affinage", desc: '+600 frometons/s' },
  { id: 'clickprod', rarity: 'epic', icon: '✋', name: "Doigts d'Or", desc: 'Les clics ajoutent +100% de ta prod/s' },
  { id: 'autobuy', rarity: 'epic', icon: '🤖', name: 'Régisseur', desc: 'Auto-achète le bâtiment le moins cher' },
  { id: 'autosell', rarity: 'epic', icon: '📦', name: 'Marchand Auto', desc: 'Auto-vend les fromages régulièrement' },
  // Légendaires (rares + dosées)
  { id: 'clickmult', rarity: 'legendary', icon: '✊', name: 'Main de Minos', desc: '×5 puissance de clic' },
  { id: 'prod3', rarity: 'legendary', icon: '🕳️', name: 'Trou Noir Fromager', desc: '×3 production passive' },
  { id: 'croute2', rarity: 'legendary', icon: '🧪', name: 'Présure Ancestrale', desc: '×2 gain de Croûtes' },
  { id: 'golden2', rarity: 'legendary', icon: '🌟', name: 'Astre Doré', desc: 'Goldens ×2 (fréquence + récompense)' },
  { id: 'omni', rarity: 'legendary', icon: '🧀', name: 'Frometon Originel', desc: '+2% à TOUT par relique possédée' },
]
export const RELIC_BY_ID = Object.fromEntries(RELICS.map((r) => [r.id, r]))
export const RARITY_META = {
  common: { label: 'Commune', color: '#cbd5e1', glow: 'rgba(203,213,225,0.5)' },
  rare: { label: 'Rare', color: '#60a5fa', glow: 'rgba(96,165,250,0.6)' },
  epic: { label: 'Épique', color: '#c084fc', glow: 'rgba(192,132,252,0.7)' },
  legendary: { label: 'Légendaire', color: '#fbbf24', glow: 'rgba(251,191,36,0.85)' },
}

// --- Boosters ----------------------------------------------------------------
export const BOOSTERS = [
  { id: 'frais', name: 'Booster Frais', icon: '🧀', price: 3, odds: { common: 0.8, rare: 0.18, epic: 0.02, legendary: 0 } },
  { id: 'affine', name: 'Booster Affiné', icon: '⭐', price: 10, odds: { common: 0.5, rare: 0.35, epic: 0.13, legendary: 0.02 } },
  { id: 'or', name: "Booster d'Or", icon: '👑', price: 30, odds: { common: 0.2, rare: 0.45, epic: 0.28, legendary: 0.07 } },
]

// Tire une rareté selon les odds, puis une relique aléatoire de cette rareté.
// rand01/rand02 : deux nombres [0,1) fournis par l'appelant (évite Math.random ici).
export function rollRelic(booster, rand01, rand02) {
  let acc = 0
  let rarity = 'common'
  for (const r of ['common', 'rare', 'epic', 'legendary']) {
    acc += booster.odds[r] || 0
    if (rand01 < acc) {
      rarity = r
      break
    }
  }
  const pool = RELICS.filter((x) => x.rarity === rarity)
  const relic = pool[Math.floor(rand02 * pool.length)] || pool[0]
  return relic
}

// --- Agrégation des effets de reliques ---------------------------------------
// relics: { [id]: count }. Retourne des multiplicateurs/bonus appliqués partout.
export function computeRelicEffects(relics = {}) {
  const c = (id) => relics[id] || 0
  const total = Object.values(relics).reduce((a, b) => a + b, 0)
  const omni = c('omni') * total * 2 // +2% à tout, par relique possédée, par Originel

  // FLAT : ajoutés directement à la puissance de clic / aux frometons/s. Énervé
  // exprès → relance immédiate après prestige (clickPower repart à 1, bâtiments à 0).
  const clickFlat = c('click_s') * 20 + c('click_r') * 150 + c('click_e') * 1000
  const prodFlat = c('prod_s') * 12 + c('prod_r') * 80 + c('prodbig') * 600

  // % et × (montée en puissance mid/late game)
  const clickPct = omni
  const prodPct = omni
  const fromPct = c('from_s') * 6 + omni
  const marketPct = c('market_s') * 12 + omni
  const costReduce = c('cost_s') * 4
  const critAdd = c('crit_r') * 0.08
  const offlineH = c('offline_r') * 3
  const clickFromProd = c('clickprod') * 1.0
  const goldenFreqPct = c('golden_r') * 35

  const crouteMult = Math.pow(2, c('croute2'))
  const prodMultLeg = Math.pow(3, c('prod3'))
  const goldenLeg = Math.pow(2, c('golden2'))
  const clickMultLeg = Math.pow(5, c('clickmult'))

  return {
    clickFlat,
    prodFlat,
    clickMult: clickMultLeg * (1 + clickPct / 100),
    prodMult: prodMultLeg * (1 + prodPct / 100),
    fromMult: 1 + fromPct / 100,
    marketMult: 1 + marketPct / 100,
    critChanceAdd: critAdd,
    buildingCostMult: Math.max(0.2, 1 - costReduce / 100),
    goldenFreqMult: goldenLeg * (1 + goldenFreqPct / 100), // >1 = plus fréquent
    goldenRewardMult: goldenLeg,
    offlineCapBonusH: offlineH,
    crouteMult,
    clickFromProd, // fraction de la prod/s ajoutée à chaque clic
    autoBuy: c('autobuy') > 0,
    autoSell: c('autosell') > 0,
    totalRelics: total,
  }
}

// --- Contrats (objectifs courts) ---------------------------------------------
// Récompenses : argent / frometons / boost temporaire. JAMAIS de booster.
// Les Croûtes sont un drop SUPER RARE, réservé aux GROS contrats de fin de partie
// (quand le jeu commence à stagner) → petit coup de pouce pour relancer.
const CROUTE_CONTRACT_MIN_LIFETIME = 5e6 // « le jeu commence à stagner »
const CROUTE_CONTRACT_MIN_TARGET = 1e6 // « gros contrat »
const CROUTE_CONTRACT_CHANCE = 0.06 // super rare
function pickReward(rng, g, type, target) {
  const advanced = (g.totalFrometonsEarned || 0) >= CROUTE_CONTRACT_MIN_LIFETIME
  const bigResource = (type === 'frometons' || type === 'sell') && target >= CROUTE_CONTRACT_MIN_TARGET
  if (advanced && bigResource && rng() < CROUTE_CONTRACT_CHANCE) {
    // montant modeste, indexé sur la force du run (~8% d'un prestige), min 1
    const amount = Math.max(1, Math.floor(crouteGain(g.runFrometonsEarned || 0, 1) * 0.08))
    return { kind: 'croute', amount }
  }
  const r = rng()
  if (r < 0.42) return { kind: 'money', amount: Math.max(100, Math.floor(target * 0.6)) }
  if (r < 0.84) return { kind: 'frometons', amount: Math.max(100, Math.floor(target * 0.6)) }
  return { kind: 'boost' } // frenzy temporaire
}

// Génère un contrat scalé à l'état courant. `rng` : () => [0,1).
export function makeContract(g, rng) {
  const types = ['frometons', 'sell', 'click']
  const unlocked = g.unlockedCheeses || ['Comte']
  types.push('produce')
  const type = types[Math.floor(rng() * types.length)]

  let metric, cheese, target, baseline, label
  if (type === 'frometons') {
    metric = 'totalFrometonsEarned'
    baseline = g.totalFrometonsEarned || 0
    target = Math.max(1000, Math.floor(g.frometons * 1.2 + 1000))
    label = `Produire ${target.toLocaleString('fr-FR')} frometons`
  } else if (type === 'sell') {
    metric = 'totalMoneyEarned'
    baseline = g.totalMoneyEarned || 0
    target = Math.max(500, Math.floor(g.money * 1.5 + 500))
    label = `Vendre pour ${target.toLocaleString('fr-FR')}€ de fromage`
  } else if (type === 'click') {
    metric = 'totalClicks'
    baseline = g.totalClicks || 0
    target = 25 + Math.floor(rng() * 75)
    label = `Cliquer ${target} fois`
  } else {
    cheese = unlocked[Math.floor(rng() * unlocked.length)]
    metric = 'totalCheeseProduced'
    baseline = (g.totalCheeseProduced && g.totalCheeseProduced[cheese]) || 0
    target = Math.max(500, Math.floor((g.frometons || 0) * 0.5 + 500))
    label = `Produire ${target.toLocaleString('fr-FR')} ${cheese}`
  }
  return {
    key: `${type}-${Math.floor(rng() * 1e9)}`,
    type,
    metric,
    cheese,
    label,
    target,
    baseline,
    reward: pickReward(rng, g, type, target),
  }
}

// Progression actuelle d'un contrat (0..target).
export function contractProgress(contract, g) {
  let cur
  if (contract.metric === 'totalCheeseProduced') {
    cur = (g.totalCheeseProduced && g.totalCheeseProduced[contract.cheese]) || 0
  } else {
    cur = g[contract.metric] || 0
  }
  return Math.max(0, Math.min(contract.target, cur - contract.baseline))
}

export function rewardLabel(reward) {
  if (reward.kind === 'money') return `${reward.amount.toLocaleString('fr-FR')}€`
  if (reward.kind === 'frometons') return `${reward.amount.toLocaleString('fr-FR')} frometons`
  if (reward.kind === 'boost') return 'Frenzy ×3 (30s)'
  if (reward.kind === 'croute') return `+${reward.amount} Croûte`
  if (reward.kind === 'booster') return 'Booster Frais gratuit'
  return ''
}
