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

## 2. Senses (Vue · Ouïe · Lucidité · Digestion)

### 2.1 Shared grammar

Every faculty follows the SAME model — two independent axes:

- **Niveau (scalar)** — clarity / range / detail. Stacks from all contributing
  organs (+ torch for Vue). A long ladder (0→6): **humans sit at the bottom** so
  there's huge headroom for future organs. The floor is cheap (a human organ gets
  you to "usable"); the top is where rare/legendary organs pile on *extra info*,
  not just "clearer".
- **Mots-clés (discrete)** — special powers, each granted by a SPECIFIC organ
  keyword, NEVER by stacking level: `voir_invisible`, `echolocation`,
  `vision_couleur`, `vision_nocturne`, `vision_fragmentee`…

**Latéralisation** — Vue & Ouïe are computed PER SIDE: left organ → left half of
the screen, right → right half. The torch is shared ambient light. A single
special organ (e.g. one `voir_invisible` eye) only works on its half.

Palier 1 is *below* the comfortable floor: a "degraded" organ that sees/hears
worse but carries another advantage (a keyword, range…) — a real trade-off slot.

### 2.2 The four faculties

**VUE** (eyes + torch) — 3 tiers of value:
- *Clarté* (floor, palier 2 = human eye + torch: clear colour, light gloom).
- *Détails* (the long ladder: enemy organ HP numbers → layer depth → detailed
  telegraph (feeds Lucidité) → **weak point** → hidden decor/loot).
- *Mots-clés* (invisible, colour-puzzle, nocturne, fragmented…).

**OUÏE** (ears) — mirrors Vue. Palier 2 (human ear) = hears ambiance, **NPCs and
the whispers of the dead god** (its floor value = the lore/ambiance channel).
Higher: localise sources → identify them + hear enemy wind-ups (feeds Lucidité) +
detect **noisy-invisible** things → read the enemy heartbeat (locate its vital).
Keyword `echolocation` = point-cloud shader, **playable fully blind**.

**LUCIDITÉ** (brain; fed a little by eyes/ears) — how much of the enemy plan you
read: `0` "prépare un coup…" → attack+target → +exact damage +action order →
**weak point + plan 2 turns ahead**. Fixes redundancy: eye+ear+brain all feed ONE
level instead of three copies of the same info.

**Weak point** — a designated enemy organ takes bonus damage (a crit). It exists
on the enemy regardless, but the **bonus only applies if you've REVEALED it**
(enough Lucidité) — no accidental crits, pure perception reward.

**DIGESTION** (stomach + mouth/tongue) — governs how much eating an organ gives
(hunger filled + regen granted). Human = small; special = large / multi-organ /
converts to other resources.

### 2.3 Visible / Invisible / Sonorité

- **Visible** = the Vue domain (torch, night/colour/fragmented eyes → filters &
  keywords). Enables visual puzzles & hidden decor.
- **Invisible** = revealed by high Vue keyword (`voir_invisible`) OR, if the thing
  **emits sound**, by Ouïe. Silent-invisible → only a seer finds it; noisy-invisible
  → even a blind player "sees" it by ear.
- **Sonorité** = how much noise an organ / decor / creature emits. Detected by
  ears. Its UI is the **bottom bar** (must stay readable — currently masked by the
  cards, to fix). The bar is triple-duty: **detection blips + ambiance (heartbeat)
  + lore (NPC speech, whispers)**.

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
