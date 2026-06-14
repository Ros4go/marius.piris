import { WS } from '../../WorldState.js';
import { organResolver, allOrgans } from '../../registry.js';
import { addLog } from '../HUDRenderer.js';

const ROOM_EFFECT = {
  alveoles:    'wind_dmg',
  ventricules: 'pulse_damage',
  bains_acide: 'acid_baths',
};

export function render(container, room, options = {}) {
  const { onRender } = options;
  const effect = ROOM_EFFECT[room.defId];

  if (effect === 'acid_baths')   return _renderAcid(container);
  if (effect === 'wind_dmg')     return _renderWind(container);
  if (effect === 'pulse_damage') return _renderPulse(container);
  _renderRiddle(container, room, onRender);
}

function _renderAcid(container) {
  const immune = _hasAbility('acid_resist');
  container.innerHTML = `
    <div class="room-title">⬡ Bains d'acide</div>
    <div class="room-body">
      <p class="insp-dim">Les fluides corrodent vos organes externes — 1HP/outer par tick.</p>
      <p class="insp-dim" style="margin-top:6px">
        <span class="${immune ? 'insp-pos' : 'insp-neg'}">${
          immune ? '✓ Résistance acide active.' : '✗ Aucune résistance détectée.'
        }</span>
      </p>
    </div>`;
}

function _renderWind(container) {
  container.innerHTML = `
    <div class="room-title">⬡ Alvéoles</div>
    <div class="room-body">
      <p class="insp-dim">Rafales violentes — 33% de chance par tick de blesser un organe externe.</p>
    </div>`;
}

function _renderPulse(container) {
  const next = 5 - (WS.tick % 5) || 5;
  container.innerHTML = `
    <div class="room-title">⬡ Ventricules</div>
    <div class="room-body">
      <p class="insp-dim">Pulsation cardiaque — 2 dégâts sur un organe aléatoire toutes les 5 ticks.</p>
      <p class="insp-dim" style="margin-top:6px;color:var(--bone-dark)">Prochain pulse : <b>${next}</b> tick(s).</p>
    </div>`;
}

function _renderRiddle(container, room, onRender) {
  if (room._puzzleSolved) {
    container.innerHTML = `
      <div class="room-title">⬡ Énigme</div>
      <div class="room-body"><p class="insp-dim">La chair s'est ouverte. Le passage est libre.</p></div>`;
    return;
  }

  if (!room._puzzle) {
    const pool = allOrgans().filter(o => o.tier === 'common' || o.tier === 'rare');
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    room._puzzle = {
      answer: Math.floor(Math.random() * 3) + 1,
      reward: pick ? { organId: pick.id, hp: pick.maxHp } : null,
    };
  }

  container.innerHTML = `
    <div class="room-title">⬡ Énigme</div>
    <div class="room-body" id="_puzz-body">
      <p class="insp-dim">Trois passages dans la chair. Un seul ne vous brisera pas.</p>
    </div>`;

  const body = container.querySelector('#_puzz-body');
  [1, 2, 3].forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'dealbtn';
    btn.textContent = `Passage ${n}`;
    btn.addEventListener('click', () => {
      if (n === room._puzzle.answer) {
        room._puzzleSolved = true;
        const r = room._puzzle.reward;
        if (r) {
          WS.player.inventory.push({ id: `inv_puzzle_${Date.now()}`, organId: r.organId, hp: r.hp });
          const def = organResolver(r.organId);
          addLog(`Énigme résolue — trouvé : ${def?.name ?? r.organId}.`, 'harvest');
        } else {
          addLog("Énigme résolue. Le passage s'ouvre.", 'sys');
        }
      } else {
        const playerBody = WS.player.body;
        const liveKeys = Object.keys(playerBody.slots).filter(k => {
          const s = playerBody.slots[k];
          return s && (s.hp ?? 1) > 0;
        });
        if (liveKeys.length) {
          const sk = liveKeys[Math.floor(Math.random() * liveKeys.length)];
          const slot = playerBody.slots[sk];
          slot.hp = Math.max(0, (slot.hp ?? 1) - 2);
          addLog(`Passage piégé — [${sk}] -2HP.`, 'damage');
        }
      }
      onRender?.();
    });
    body.appendChild(btn);
  });
}

function _hasAbility(abilityId) {
  const body = WS.player.body;
  if (!body) return false;
  for (const slot of Object.values(body.slots)) {
    if (!slot || (slot.hp ?? 1) <= 0) continue;
    const def = organResolver(slot.organId);
    if (def?.abilities?.includes(abilityId)) return true;
  }
  return false;
}
