// Orchestration du combat côté rendu — PARTAGÉE jeu/atelier (zéro duplication).
// Construit les cartes + les cibles depuis TurnCombat et pilote CombatHand /
// CombatFX : c'est l'ancien couple _renderCombatHand/_runEnemyPhase de main.js,
// extrait pour que le simulateur de l'atelier joue EXACTEMENT le même combat
// (viser ses propres organes, afflictions, ressources, défausse, phase ennemie).
// Porte aussi l'état de visée (mob/organe ciblés) et le verrou d'animation.

import { WS, currentRoom } from '../WorldState.js';
import { organResolver, organColor } from '../registry.js';
import { ORGAN_SLOTS } from '../entities/Body.js';
import { SLOT_SHORT } from '../labels.js';
import * as Faculties from '../systems/Faculties.js';
import * as Resources from '../systems/Resources.js';
import * as TurnCombat from '../TurnCombat.js';
import * as CombatHand from './CombatHand.js';
import * as CombatFX from './CombatFX.js';

let _targetedMobId = null;
let _targetedSlot  = null;
let _animating = false;   // the enemy phase animation is playing (locks combat input)
let _rerender  = () => {};

export const target = () => ({ targetedMobId: _targetedMobId, targetedSlot: _targetedSlot });
export const isAnimating = () => _animating;
export function aim(mobId, slotKey) {
  _targetedMobId = mobId;
  _targetedSlot  = slotKey;
  if (TurnCombat.isActive()) TurnCombat.setTarget(mobId, slotKey);
}
export function clearTarget() { _targetedMobId = null; _targetedSlot = null; }

// ── Combat hand (drag-and-drop cards) ──────────────────────────────────────────
export function renderHand(rerender) {
  if (rerender) _rerender = rerender;
  if (!TurnCombat.isActive()) { CombatHand.hide(); return; }
  const room   = currentRoom();
  const active = (room?.mobIds ?? []).map(id => WS.mobs.get(id)).filter(m => m?.lifecycle === 'active');
  const mob    = active.find(m => m.id === _targetedMobId) ?? active[0];

  // Targets for EVERY enemy (each cluster is drawn over its own silhouette), so
  // you can drop a card straight on the mob you want — no pre-selection needed.
  const organs = [];
  active.forEach((mb, mbIdx) => {
    const reach = new Set(TurnCombat.targetable(mb.id, false));
    // `vue-rayons-x` (§2.2): DEEP organs stay hidden ("???", no HP) while sealed
    // behind the outer layers — unless an x-ray eye covers the mob's side.
    const f = active.length <= 1 ? 0.5 : (mbIdx + 0.5) / active.length;
    const mobSide = f < 0.45 ? 'gauche' : f > 0.55 ? 'droite' : null;
    const xray = mobSide ? Faculties.hasOn('vue-rayons-x', mobSide) : Faculties.has('vue-rayons-x');
    for (const k of Object.keys(ORGAN_SLOTS)) {
      const s = mb.body.slots[k];
      if (!s?.organId) continue;
      const def = organResolver(s.organId);
      const maxHp = def?.maxHp ?? 1;
      const hp = s.hp ?? maxHp;
      const locked = !reach.has(k);
      const masked = locked && ORGAN_SLOTS[k].layer === 'deep' && !xray && hp > 0;
      organs.push({ mobId: mb.id, slotKey: k, layer: ORGAN_SLOTS[k].layer,
        name: masked ? '???' : (SLOT_SHORT[k] ?? def?.name ?? k), hp, maxHp, masked,
        color: masked ? null : organColor(s.organId), locked, dead: hp <= 0,
        weak: !masked && TurnCombat.weakRevealed() && TurnCombat.weakSpotOf(mb.id) === k });
    }
  });

  const cards = TurnCombat.hand().map(c => ({
    organKey:   c.organKey,
    skillId:    c.skill.id,
    label:      c.skill.label,
    cost:       (c.skill.cost ?? 0) + (c.skill.couts?.sang ?? 0),
    couts:      c.skill.couts ?? null,
    desc:       c.skill.desc ?? '',
    organName:  organResolver(c.organId)?.name ?? '',
    color:      organColor(c.organId),
    playable:   c.playable,
    needsTarget: ['damage', 'heal', 'retrigger'].includes(c.skill.effect?.kind)
      || (c.skill.effect?.kind === 'res' && Resources.resDef(c.skill.effect.res)?.porteur === 'organe'),
    layerHint:  ORGAN_SLOTS[c.organKey]?.layer ?? 'x',
  }));

  CombatHand.render(cards, {
    blood:      TurnCombat.blood(),
    resources:  TurnCombat.resourcesView(),
    discardCount: TurnCombat.discardCount(),
    discarded:    TurnCombat.discardedCards(),
    mobId:  mob?.id ?? null,
    organs,
    onPlay: (organKey, skillId, mobId, slot, isSelf) => {
      if (_animating) return;
      const kind  = organResolver(WS.player.body.slots[organKey]?.organId)?.skills?.find(s => s.id === skillId)?.effect?.kind;
      const label = organResolver(WS.player.body.slots[organKey]?.organId)?.skills?.find(s => s.id === skillId)?.label ?? '';
      const before = Object.fromEntries(TurnCombat.resourcesView().map(r => [r.def.id, r.val]));
      const ok = TurnCombat.play(organKey, skillId, mobId, slot, isSelf);
      if (ok) {
        CombatFX.playerCast(isSelf ? null : (mobId ?? _targetedMobId), kind, label, organColor(WS.player.body.slots[organKey]?.organId));
        for (const { def, val } of TurnCombat.resourcesView()) CombatFX.resourceDelta(def.id, val - (before[def.id] ?? 0));
      }
      _rerender();
    },
    onEndTurn: () => { runEnemyPhase(); },
  });
}

// Play the enemy phase as a timed sequence so the turn-based flow is legible.
export async function runEnemyPhase() {
  if (_animating || !TurnCombat.isActive()) return;
  _animating = true;
  try {
    const { timeline } = TurnCombat.endTurn();
    await CombatFX.playEnemyPhase(timeline, (evs) => TurnCombat.logEvents(evs));
    TurnCombat.finalizeTurn();
  } finally {
    _animating = false;
  }
  _rerender();
}
