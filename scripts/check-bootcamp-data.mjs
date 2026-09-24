#!/usr/bin/env node
// Vérifie le contenu du Bootcamp : tous les JSON de public/data/bootcamp/ et leur
// cohérence avec le registre src/modules/studio/bootcamp/categories.js.
// Lancé avant chaque build (npm run build) et à la main via `npm run check:bootcamp`.
// Les JSON sont édités à la main : ce script attrape une virgule manquante, un index
// de réponse hors limites ou une difficulté inconnue avant que la page ne casse.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIR = join(ROOT, 'public', 'data', 'bootcamp')
const REGISTRY = join(ROOT, 'src', 'modules', 'studio', 'bootcamp', 'categories.js')
const DIFFICULTIES = ['facile', 'moyen', 'difficile']
const TIERS = [1, 2, 3]

const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isArr = (v) => Array.isArray(v)

// Valide un tableau de chapitres ; renvoie { errors, chapters, fiches, quiz }.
function validate(chapters) {
  const errors = []
  const err = (where, msg) => errors.push(`${where} : ${msg}`)
  const ids = new Set()
  let nFiches = 0
  let nQuiz = 0
  chapters.forEach((ch, ci) => {
    const where = `chapitre ${ci + 1} (${ch && ch.id ? ch.id : 'sans id'})`
    if (!ch || typeof ch !== 'object') { err(where, 'doit être un objet'); return }
    if (!isStr(ch.id)) err(where, 'id manquant')
    else if (ids.has(ch.id)) err(where, `id en double « ${ch.id} »`)
    else ids.add(ch.id)
    if (!isStr(ch.num)) err(where, 'num manquant')
    if (!isStr(ch.title)) err(where, 'title manquant')
    if (!isStr(ch.summary)) err(where, 'summary manquant')
    if (!isArr(ch.topics) || !ch.topics.every(isStr)) err(where, 'topics doit être un tableau de chaînes')
    for (const k of ['sources', 'images', 'links']) {
      if (ch[k] !== undefined && !isArr(ch[k])) err(where, `${k} doit être un tableau`)
    }
    if (!isArr(ch.fiches)) err(where, 'fiches doit être un tableau')
    else ch.fiches.forEach((f, fi) => {
      const w = `${where}, fiche ${fi + 1}`
      nFiches++
      if (!isStr(f.title)) err(w, 'title manquant')
      const hasKeypoints = isArr(f.keypoints) && f.keypoints.length > 0 && f.keypoints.every(isStr)
      if (!isStr(f.body) && !hasKeypoints) err(w, 'il faut un body ou des keypoints')
      if (f.tier !== undefined && !TIERS.includes(f.tier)) err(w, `tier doit valoir 1, 2 ou 3 (reçu ${JSON.stringify(f.tier)})`)
    })
    if (!isArr(ch.quiz)) err(where, 'quiz doit être un tableau')
    else ch.quiz.forEach((q, qi) => {
      const w = `${where}, question ${qi + 1}`
      nQuiz++
      if (!isStr(q.q)) err(w, 'q (énoncé) manquant')
      if (!isArr(q.choices) || q.choices.length < 2 || !q.choices.every(isStr)) err(w, 'choices doit contenir au moins 2 chaînes')
      else if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.choices.length) {
        err(w, `answer doit être un index entre 0 et ${q.choices.length - 1} (reçu ${JSON.stringify(q.answer)})`)
      }
      if (!isStr(q.explain)) err(w, 'explain manquant')
      if (!DIFFICULTIES.includes(q.difficulty)) err(w, `difficulty doit être facile, moyen ou difficile (reçu ${JSON.stringify(q.difficulty)})`)
    })
  })
  return { errors, chapters: chapters.length, fiches: nFiches, quiz: nQuiz }
}

// Biais de longueur : une bonne réponse nettement plus longue que les mauvaises se
// devine sans connaître le cours. On signale (sans bloquer) les questions où la
// bonne réponse dépasse d'un tiers le plus long des distracteurs.
function lengthBias(chapters) {
  const hits = []
  chapters.forEach((ch) => (ch.quiz || []).forEach((q, qi) => {
    if (!isArr(q.choices) || !Number.isInteger(q.answer) || !q.choices[q.answer]) return
    const good = q.choices[q.answer].length
    const worst = Math.max(...q.choices.filter((_, i) => i !== q.answer).map((c) => String(c).length))
    if (good > 1.34 * worst) hits.push(`${ch.id} q${qi + 1} (${good} vs ${worst} car.)`)
  }))
  return hits
}

let failed = false
const fail = (msg) => { failed = true; console.error('✗ ' + msg) }

// 1) Le registre : chaque catégorie doit pointer vers un JSON existant.
const { CATEGORIES } = await import(pathToFileURL(REGISTRY).href)
const referenced = new Set()
for (const cat of CATEGORIES) {
  if (!isStr(cat.id) || !isStr(cat.data)) { fail(`registre : catégorie sans id ou sans data (${JSON.stringify(cat.id)})`); continue }
  const file = join(ROOT, 'public', cat.data)
  referenced.add(resolve(file))
  if (!existsSync(file)) fail(`registre : « ${cat.id} » pointe vers ${cat.data}, introuvable dans public/`)
}

// 2) Chaque JSON du dossier : structure valide, et rattaché à une catégorie.
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.json')).sort() : []
if (files.length === 0) fail(`aucun JSON dans ${DIR}`)
for (const name of files) {
  const file = join(DIR, name)
  let data
  try {
    data = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    fail(`${name} : JSON invalide — ${e.message}`)
    continue
  }
  if (!isArr(data) || data.length === 0) { fail(`${name} : la racine doit être un tableau de chapitres non vide`); continue }
  const r = validate(data)
  const linked = referenced.has(resolve(file)) ? '' : '  (⚠ aucune catégorie ne le référence dans categories.js)'
  if (r.errors.length) {
    fail(`${name} : ${r.errors.length} erreur(s)`)
    for (const e of r.errors.slice(0, 50)) console.error(`  - ${e}`)
    if (r.errors.length > 50) console.error(`  … et ${r.errors.length - 50} de plus`)
  } else {
    console.log(`✓ ${name} : ${r.chapters} chapitres, ${r.fiches} fiches, ${r.quiz} questions${linked}`)
    const bias = lengthBias(data)
    if (bias.length) console.log(`  ⚠ ${bias.length} question(s) dont la bonne réponse est nettement plus longue : ${bias.slice(0, 6).join(', ')}${bias.length > 6 ? '…' : ''}`)
  }
}
process.exit(failed ? 1 : 0)
