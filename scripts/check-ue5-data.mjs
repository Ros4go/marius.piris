#!/usr/bin/env node
// Vérifie la structure de public/data/ue5-blueprint.json (contenu du Blueprint Bootcamp).
// Lancé avant chaque build (npm run build) et à la main via `npm run check:ue5`.
// Le JSON est édité à la main : ce script attrape une virgule manquante, un index de
// réponse hors limites ou une difficulté inconnue avant que la page ne casse en ligne.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const FILE = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/ue5-blueprint.json')
const DIFFICULTIES = ['facile', 'moyen', 'difficile']
const TIERS = [1, 2, 3]

const errors = []
const err = (where, msg) => errors.push(`${where} : ${msg}`)
const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isArr = (v) => Array.isArray(v)

let chapters
try {
  chapters = JSON.parse(readFileSync(FILE, 'utf8'))
} catch (e) {
  console.error(`✗ ${FILE} : JSON invalide — ${e.message}`)
  process.exit(1)
}
if (!isArr(chapters) || chapters.length === 0) {
  console.error('✗ La racine doit être un tableau de chapitres non vide')
  process.exit(1)
}

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

if (errors.length) {
  console.error(`✗ ue5-blueprint.json : ${errors.length} erreur(s)`)
  for (const e of errors.slice(0, 50)) console.error(`  - ${e}`)
  if (errors.length > 50) console.error(`  … et ${errors.length - 50} de plus`)
  process.exit(1)
}
console.log(`✓ ue5-blueprint.json : ${chapters.length} chapitres, ${nFiches} fiches, ${nQuiz} questions`)
