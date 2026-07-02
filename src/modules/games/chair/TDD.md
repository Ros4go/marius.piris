# CHAIR — Technical Design Document

Living design doc. Companion to `ARCHITECTURE.md` (which describes *how the code
is wired*); this describes *what the game is and why*.

---

## 1. Resources (combat economy)

The combat economy is a small set of **quantities**. Everything an organ does is
expressed as a **verb operating on a quantity** — there is no hard "resource vs
status" split, and no quantity is reserved to a single organ type (the heart
*usually* makes Sang, but a skin could have a skill that makes Sang too).

### 1.1 Producer / carryover model

Any quantity produced at the start of a turn follows one rule:

```
quantité = floor(carryover × restant) + regen
```

- **regen** — how much this turn's producers add (sum across living organs).
- **carryover** — fraction (0…1) of the leftover kept before regen. `0` =
  volatile / "spend-or-lose" (default), `1` = fully hoarded.

The player-facing wording stays a readable sentence
("En début de tour : purge le Sang restant et en produit X") — that is just the
display of `regen = X, carryover = 0`. Relics/organs tweak `carryover` to change
the decay independently of production (e.g. a heart that keeps its Sang, a relic
that stops the Protection from draining).

### 1.2 The quantities

**On you (your gauges)**

| Quantité | 1 point = | Volatilité défaut |
|---|---|---|
| **Sang** | de quoi payer une partie du coût d'un skill (coûts variables) | volatile (purge début de tour) |
| **Protection** | 1 dégât absorbé puis consommé (Bloc, façon Slay the Spire) | volatile |
| **Régénération** | +1 PV à l'organe le plus abîmé en début de tour, puis −1 | décroît seule |
| **Frénésie** | +1 dégât à **toutes** tes attaques (Force STS) | persistante tout le combat |
| **Viande** | 1 unité d'économie (argent, greffe, skills gourmands) | persistante |

**On the enemy (what you inflict)**

| Quantité | 1 point = | Volatilité défaut |
|---|---|---|
| **Bile** | 1 dégât/tour à l'organe puis −1 ; **se propage** à la mort du porteur | décroît seule |
| **Saignement** | l'organe perd 1 PV **quand l'ennemi attaque** puis −1 (ne tick pas seul) | décroît à l'usage |
| **Vulnérabilité** | l'organe subit **+1 dégât de toutes sources** puis −1/tour | décroît seule |

Plus on/off statuses (Immunité, charges d'Esquive…) posés par des skills/passifs.

Legibility: 8 quantities is fine because a player only ever sees the ones *their
organs* and *the enemy* actually use — complexity is spread across runs, not
piled onto one fight.

### 1.3 Bile contagion (detail)

Bile follows the pure STS decay (N, then N−1…). When the **carrier organ dies**
(from Bile *or* a direct hit), the remaining Bile **spreads**:

1. Roll number of recipients K, weighted toward **2** (K=1/K=3 less likely).
2. Pick K organs, **same layer prioritised**, other layers possible at lower
   probability, no duplicates (take fewer if not enough organs).
3. **Split** the remaining Bile as evenly as possible (integers) across them.

Because Bile damage is triangular (N(N+1)/2), splitting *dilutes* the total —
so concentrating Bile = max damage, contagion = never fully wasted but never a
runaway epidemic. That is the intended balance.

### 1.4 The verbs (the organ "lego")

A passive (fires each turn) or a skill (fires on activation) may:

- **Produire** N (toi) — turn-start (passif) or immediate (skill)
- **Dépenser** N — a skill's cost
- **Convertir** N → M — e.g. *Dévorer : −2 Viande → +3 Sang*
- **Appliquer** N à l'ennemi — Bile, Saignement, Vulnérabilité
- **Dégâts directs** / **Soin PV**
- **Accorder un statut** — Immunité, charges d'Esquive, Frénésie…
- **Modifier la volatilité** — the relic lever (`carryover`)

### 1.5 Implementation mapping (engine)

- `pstate` holds the player gauges: `blood` (Sang), `protection`, `regen`,
  `frenesie`, `meat` (Viande).
- Enemy quantities live per-organ on the mob: `_bile`, `_bleeds` (Saignement),
  `_vuln` (keyed by slotKey).
- Turn-start production (`CR.produceTurnResources`) applies the carryover model
  for Protection (and any organ `produces:[{resource,amount,carryover}]`). Sang
  keeps `bloodPool()` (same model, carryover 0).
- Skill `effect.kind` verbs: `damage · heal · retrigger · blood · protect ·
  regen · frenesie · convert · bile · saignement · vulnerabilite`.

---

## 2. Senses — the TAG system (Vue · Ouïe · Lucidité · Digestion)

Perception is **100% tags** — NO scalar levels. Every organ carries `tags: [...]`;
capabilities are the UNION over LIVING organs. (Digestion lives here too → §3.)

### 2.1 The tag grammar

- **Organ tags** — declared in `organs.json`, read generically by the engine.
- **Side tags `gauche` / `droite`** — INJECTED by the slot (`eye_l`/`ear_l` →
  gauche, `eye_r`/`ear_r` → droite), never written on organs. *Where* you graft
  decides the side.
- **Prerequisites are per-organ** — checked on the SAME organ (a blind eye can't
  see the invisible).
- **Orthogonality** — each tag does EXACTLY one thing; no implicit bundling within
  or across families; a single high tag never grants a lower one's effect (`-3`
  does NOT imply `-1`/`-2`).
- **Combination rule — two tags of the SAME level MERGE into one of the next
  level, recursively (a binary carry):**
  - `X-1` + `X-1` = one `X-2`.
  - `X-1` ×3 = one `X-2` + one `X-1` (the odd one stays) — **NOT** `X-3`.
  - `X-1` ×4 = `X-3` (4 → two `X-2` → one `X-3`).
  Formally: a tag at level L is worth `2^(L-1)` units; sum the units per family;
  the active tiers are the **binary decomposition** of that sum (each set bit = an
  active tag at that level), capped at the family's max defined tier. Applies to
  every numbered family (`echolocation-N`, `ouie-identification-N`,
  `ouie-detection-N`, `map-N`). **Gauge tags** (`invisible`, `digestion`, `chaud`,
  `froid`) use a separate LINEAR rule (+10% each, **NO cap** — keeps scaling);
  **marker tags** (`arcane`) don't stack at all (§2.7).
- **Lateralisation** — **Vue AND Ouïe are lateralised** (left organ → left half of
  the screen, right → right). Lucidité (Plan, Map) & Digestion are global (brain /
  stomach are central slots). A source **in the middle → split in two** (half
  handled by the left side, half by the right).

### 2.2 VUE — lateralised (eyes) · all require `vue` on the same organ

- `vue` — see that half, in **GREYSCALE**. No `vue` → black half. Clear if lit
  (torch) or `vue-nocturne`, penumbra otherwise.
- `vue-couleur` — that half in **colour** (else greyscale).
- `vue-nocturne` — see that half **in the dark** (torch out), amber tint.
- `vue-invisible` — perceive **invisible things** on that half — **mobs OR décor
  elements** (see `invisible`, §2.7).
- `vue-spider` — **quirk, no benefit**: localised like a normal eye but subdivides
  its half into **4 identical copies** (2 spider eyes = 8 sub-views).
- `vue-rayons-x` — see **through the layers**: reveals the enemy's DEEP organs
  (heart/brain) on that half without peeling the outer ones.
- `vue-arcane` — reveals **magical** targets on that half (those bearing `arcane`).
- `vue-thermique` — **heat-only filter**: reads `chaud`/`froid` — hot/living things
  glow, cold things go dark, décor fades (spot creatures hidden behind décor, at the
  cost of décor detail).

### 2.3 OUÏE — lateralised (ears) · the sound bar

Without `ouie` the bar does nothing (and later, some sounds become inaudible).

- `ouie` — bar shows the **waveforms only**: no text, no localisation (sources
  stacked at CENTRE). You sense that *something* sounds, not what.
- **Echolocation family** (localisation + sound-shaders):
  - `echolocation-1` — sources placed **approximately** on the bar (near centre).
  - `echolocation-2` — sources placed **precisely** at their real position.
  - `echolocation-3` — subtle **dotted shader over the SCENE** (not UI), **always
    on**, density ∝ sound; a **light vision substitute** (blind + this = you faintly
    "see" by sound; renders ABOVE the blind black halves).
  - `echolocation-4` — a **toggle button** in the bar drawing the dotted shader over
    **EVERYTHING, incl. the UI**.
- **Identification family** (bar text):
  - `ouie-identification-1` — generic **"Créature"** per source (NPC/enemy
    indistinct; same for every source type).
  - `ouie-identification-2` — enemy **name** + dialogue with **random words erased**.
  - `ouie-identification-3` — everything written **clearly**.
  - `ouie-identification-4` — fine, discreet **filter buttons** atop the bar (show
    only chosen sound types).
- **Detection family** (enemy rooms flagged RED on the minimap — leans on Map §2.5):
  - `ouie-detection-1` — IF the map predicts rooms **1** away → flag enemy rooms red.
  - `ouie-detection-2` — IF the map predicts **2** away → flag enemy rooms red.
  - `ouie-detection-3` — IF the map predicts **3+** away → flag enemy rooms red.
  - `ouie-detection-4` — even if the map does NOT predict that far (but map
    unlocked): flag enemy rooms red, AND for rooms not already predicted, draw them
    in **red dotted outline** up to **3** away.
  - `ouie-detection-5` — even if the map is **LOCKED** (no `map` tag): flag enemy
    rooms red + red-dotted up to 3 away, AND draw those rooms dotted on the locked
    map.

**Bar rule — display EVERYTHING.** Tags are independent → the bar must compose/stack
every present reading, never "clearest wins". Mechanism still TBD.

### 2.4 LUCIDITÉ — Plan — global (brain), CHANNELLED by a sense

The brain reasons the enemy plan, but you need a **sense to receive it**: the Plan
tags **depend on a Vue OR Ouïe tag** — with neither, the telegraph is imperceptible
even with a brain. The DISPLAY channel follows the sense you have:
- via **Vue** → the visual telegraph over the enemy (current behaviour);
- via **Ouïe** → shown in the **sound bar**, localised like any other sound;
- both → both channels.

- `plan` — read the telegraph: which attack + which target (without a sense channel,
  or without `plan`: just "prépare un coup…").
- `plan-degats` — also the numeric **damage**.
- `plan-faille` — reveal the **weak point** (bonus damage applies only once revealed
  — no accidental crits).

### 2.5 LUCIDITÉ — Map — global (brain)

Without any `map` tag the minimap is **LOCKED**: present on the UI but **all rooms
greyed, and you can't even place yourself**.

- `map-1` — place just the **player + current room**. No memory of past rooms.
- `map-2` — player + current + **adjacent rooms reachable by doors**.
- `map-3` — the above + **predict rooms 2** away.
- `map-4` — the above + **predict rooms 3** away.

Prediction range feeds `ouie-detection`: map-2 predicts 1, map-3 predicts 2, map-4
predicts 3. Enemy CONTENT is otherwise revealed by nothing except `ouie-detection`.

### 2.6 DIGESTION — global (stomach + tongue) → Hunger (§3)

`digestion` is a **gauge tag** (like `invisible`, §2.7): **each `digestion` = +10%
eat yield, NO cap**. 1 tag = 10% (eat 10 HP to restore 1), 10 = 100% (1:1), 15 =
150% (×1.5 → over-heal), and so on. No `digestion-forte` — just stack `digestion`.

### 2.7 Property tags — "gauge" (linear 10%) & markers

Two tag shapes that do NOT use the §2.1 binary merge:

**Gauge tags** — each copy = +10%, linear, **NO cap** (keeps scaling; some effects
saturate naturally). Some come in **OPPOSING PAIRS** (one adds, one subtracts; the
NET value is what counts — net can go negative).
- `invisible` (entity) — −10% opacity per tag; saturates at 10 (opacity 0, more does
  nothing). Countered by the viewer's `vue-invisible` (matching side) or, if it
  emits sound, by echolocation. (Inert for now.)
- `digestion` (player, §2.6) — +10% eat yield per tag; does NOT cap (150% = ×1.5).
- `chaud` (entity) — heat gauge; `froid` (entity) — cold gauge. Temperature markers
  for now (0–100% in 10% steps), READ by `vue-thermique`. Reserved for future
  elemental damage / reactions.
- `bruyant` / `calme` — **PAIR, on ANY organ (or mob)**: net sonorité of the organ,
  ±10% per tag. This REPLACES the ad-hoc `sonorite` JSON field — sound emission
  becomes tags like everything else. (Heartbeat noise = `bruyant` on the heart.)
- `luminescent` / `sombre` — **PAIR, on ANY organ**: net light emitted, ±10% per
  tag. Luminescent organs = a faint backup glow when the torch dies (between
  `vue-nocturne` and blackness). **Net NEGATIVE light converts into invisibility**:
  each −10% below zero = one `invisible` stack on the bearer.

**Marker tags** — boolean, no value, no standalone effect; read by a matching sense.
- `arcane` (entity) — "this target is magical". No effect yet; REVEALED by
  `vue-arcane`.

### 2.7b Body & utility tags (player organs)

- `pompe` *(gauge)* — +10% Sang produced per turn (heart).
- `second-souffle` *(marker)* — survive ONE extra tick heartless (extends the
  existing heart-grace).
- `garde-manger` *(gauge)* — +10% max satiety (pushes Famine back).
- `fermentation` *(capacity)* — while Gavé, increased chance to produce a **déchet
  organique** (already-coded valuable).
- `estomac-de-fer` *(marker)* — never vomit while Gavé.
- `memoire` *(marker)* — the map REMEMBERS visited rooms (the memory `map-1`/`map-2`
  lack — a real brain trade-off).
- `plan-anticipation` *(capacity)* — see the telegraph **2 turns** ahead (req a
  Plan channel like the other plan tags).
- `compatible` / `incompatible` — **PAIR**: graft cost. Baseline = **5 ticks**;
  each `compatible` REMOVES ticks, each `incompatible` ADDS ticks (assumed ±1
  tick/tag, **floor 1**). An `incompatible` organ is a powerful organ you pay for
  in vulnerable graft time.
- `hyper-compatible` *(marker)* — the ONLY way to graft in **0 ticks** (instant);
  `compatible` stacking alone never goes below 1.
- `photophobe` *(marker, first NEGATIVE tag)* — this organ/mob suffers in full
  light.

### 2.7c Doctrine — tags vs skills (decided 2026-07)

**Skills stay structured verbs; they are NOT tags.** A card's power is authored
directly in its `effect` JSON (`amount`, `bleed`, `pierce`, `lifesteal`…) — no
card-modifier tag family (a `saignant` tag would just be a roundabout `bleed:2`).
Tags = what an organ IS (perception, properties, gauges); skills = what it DOES.
Runtime skill modification (relics/curses buffing an organ's cards) is out of
scope for now; if needed later it will modify effects directly.
`passives` should eventually keep only REAL mechanical passives (e.g. Pompe);
descriptive ones duplicating tags should be GENERATED from tags in the inspector.

### 2.8 Implementation status (2026-07) — BUILT

The whole of §2 is implemented (engine: `Faculties.js` v3; tests: `_tests/tags.mjs`,
39 green). Highlights & honest caveats:
- **Binary merge** for numbered families (`tiers`/`tierMax`, per-side); gauges via
  `count`/`net` (no cap); markers via `has`/`grants` (same-organ prereqs).
- **Ouïe lateralised** on the bar (per-ear halves, centre split, per-side clarity,
  stacked identification readings = "display everything", id-4 filter buttons,
  holed-words at id-2, plan-via-ouïe emitters). Echolocation 1/2 = placement,
  3 = always-on scene dot-shader (blindsight), 4 = toggle covering the UI.
- **Map** live-computed from tags each frame (no persistent reveal set anymore):
  locked+greyed baseline, map-1..4, `memoire`, detection 1..5 (red flags + red
  dotted ghosts; 5 pierces a locked map). Detection is GLOBAL (documented
  exception — the map has no screen side).
- **Plan channelled**: visual telegraph needs vue on the mob's side; bar telegraph
  needs an ear; `plan-faille`/weak-point needs a channel too. `plan-anticipation`
  reads a real 2-turn plan QUEUE (what it shows IS next turn's plan).
- **Body tags** wired: pompe (bloodPool ×1+10%/tag), second-souffle (heart grace
  +1 tick), garde-manger (max satiety), fermentation (déchet chance),
  estomac-de-fer (no vomit), compatible/incompatible/hyper-compatible (graft
  ticks, floor 1 / 0), luminescent/sombre (lum-glow when torch dies; net negative
  → player invisible stacks, INERT for now), bruyant/calme (replaces `sonorite`
  everywhere — heart/stomach carry `bruyant`).
- **Entities**: mob `tags` array; `invisible` gauge (partial = translucent for
  everyone; full = veiled unless countered per-side); `arcane`/`chaud`/`froid`
  markers + `vue-arcane`/`vue-thermique` render hooks (no mob content sets them
  yet — data-ready). `vue-rayons-x` unmasks sealed DEEP organs (else "???", no HP).
- **Inspector** generates tag descriptions from `labels.js` TAG_FR; descriptive
  passives were deleted from organs.json (mechanical ones remain).
- **APPROXIMATIONS**: `vue-spider` renders as a faceted-lens overlay (a true 4×
  copy of the half needs a compositor we don't have). `photophobe` is data-only
  (no light-damage system yet). Player invisibility stacks are stored but unused.

---

## 3. Hunger (Faim)

A bell curve with a narrow sweet spot; both extremes punish you.

| Stade | Combat / body | Son émis | Visuel |
|---|---|---|---|
| **Gavé** (overfull) | every X ticks: **vomit** OR (rare) produce a **Déchet organique** | vomit = noise | — |
| **Rassasié** (sweet spot) | **léger bonus** (light Régénération) | — | — |
| **Creux** | — | **gargouillis** (emits sound) | — |
| **Faim** | **+Fringale** (−X flat damage — the mirror of Frénésie) | more | — |
| **Affamé** | +Fringale, **−Sang production** | more | — |
| **Famine** | +Fringale, −Sang, **organ damage/tick**, **deaf** (own noise drowns all) | max | **red bloodied vignette + drunk blur/wobble** |

- **Vomit** (Gavé): noise + loses satiety, but the landing is uncertain — usually
  → Rassasié, a chance to overshoot to **Creux**, a smaller chance to **Faim**.
- **Déchet organique** (rare, Gavé): a besace item with **high sell value** (no
  effect) → returns cleanly to Rassasié. Encourages a "gorge in a safe room to
  farm déchets" greed loop, tied to the Viande economy.
- **Eating an organ** → fills hunger + regens another organ; both scale with the
  **Digestion** faculty. Cannibal/glutton build.
- **Fringale** = a negative-Frénésie resource (−flat damage). They cancel.

### Cross-links (what makes it alive)
- Faim → Sonorité: hungry = noisy = detectable (you're betrayed by noise BEFORE
  you're weakened — the Creux stage).
- Famine → deaf + blind-ish: your own noise floods the bar + vision fails.
- Gavé → economy: déchets organiques sell for Viande.
