// Entry point — imports everything, boots the game.

import { loadData, organResolver, biome as getBiomeData } from './registry.js';
import { WS, initRun, currentRoom, toJSON, fromJSON } from './WorldState.js';
import { on as onTrigger, emit, flush, PRIORITY } from './TriggerBus.js';
import { processTick, descend, advanceTicks } from './TickEngine.js';
import * as BattleEngine from './BattleEngine.js';
import * as TurnCombat from './TurnCombat.js';
import * as CombatHand from './render/CombatHand.js';
import { ORGAN_SLOTS } from './entities/Body.js';
import { init as initInput, on as onInput } from './input/InputHandler.js';
import * as SceneRenderer     from './render/SceneRenderer.js';
import * as MobRenderer       from './render/MobRenderer.js';
import * as HUDRenderer       from './render/HUDRenderer.js';
import * as MinimapRenderer   from './render/MinimapRenderer.js';
import * as BodyFX            from './render/BodyFX.js';
import * as ActionBar         from './render/ActionBar.js';
import * as RoomPanel         from './render/RoomPanel.js';
import * as InspectorPanel    from './render/InspectorPanel.js';
import * as SoundLine         from './render/SoundLine.js';
import * as InventoryRenderer from './render/InventoryRenderer.js';
import * as SensoryFX         from './render/SensoryFX.js';
import * as ReactorPanel       from './render/ReactorPanel.js';
import { addLog } from './render/HUDRenderer.js';
import { scheduleDecay } from './systems/OrganDecaySystem.js';
import * as OrganTriggerSystem from './systems/OrganTriggerSystem.js';
import * as LoreSystem         from './systems/LoreSystem.js';

const SAVE_KEY      = 'chair_save_v1';
const GRAVEYARD_KEY = 'chair_grave_v1';
const HERITAGE_KEY  = 'chair_heritage_v1';

// ── Direction helpers ─────────────────────────────────────────────────────────
const DIR_ORDER  = ['N', 'E', 'S', 'W'];
const _turnLeft  = d => DIR_ORDER[(DIR_ORDER.indexOf(d) + 3) % 4];
const _turnRight = d => DIR_ORDER[(DIR_ORDER.indexOf(d) + 1) % 4];
const _opposite  = d => DIR_ORDER[(DIR_ORDER.indexOf(d) + 2) % 4];
const _dir       = () => WS.player.dir ?? 'S';

// ── State ─────────────────────────────────────────────────────────────────────
let _targetedMobId = null;
let _targetedSlot  = null;
let _inspect       = null;   // inspector focus: {kind:'organ',slot} | {kind:'item',index} | null (= body overview)
let _gameOver      = false;
let _graveyard     = null;   // persists between runs (loaded from localStorage)
let _heritage      = [];     // organs kept between runs via Consigne

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    const base = document.querySelector('meta[name="chair-base"]')?.content
      ?? new URL('.', import.meta.url).pathname.replace(/\/src\/$/, '').replace(/\/$/, '');
    await loadData(base);
  } catch (err) {
    console.error('CHAIR: registry load failed', err);
    addLog('Erreur de chargement des données.', 'sys');
    return;
  }

  try {
    const raw = localStorage.getItem(GRAVEYARD_KEY);
    if (raw) _graveyard = JSON.parse(raw);
  } catch (_) {}

  try {
    const raw = localStorage.getItem(HERITAGE_KEY);
    if (raw) _heritage = JSON.parse(raw);
  } catch (_) {}

  // One-time UI + system wiring (survives between runs)
  ActionBar.setCallback(_handleUiAction);
  InspectorPanel.init();
  SensoryFX.init();
  initInput();
  OrganTriggerSystem.init();
  LoreSystem.init();
  _wireTriggers();
  _wireInputs();
  _wireSaveButtons();
  ReactorPanel.init(document.getElementById('reactor'), {
    onInspect: (slotKey) => { _inspect = { kind: 'organ', slot: slotKey }; render(); },
  });
  InventoryRenderer.init({
    onInspect: (index) => { _inspect = { kind: 'item', index }; render(); },
  });

  _showStartScreen();
}

function _showStartScreen() {
  const screen = document.getElementById('start-screen');
  if (!screen) { _startGame(); return; }
  screen.classList.remove('hidden');

  const graveEl = document.getElementById('start-grave');
  if (graveEl) {
    graveEl.innerHTML = _graveyard
      ? `Dernière descente — étage <b>${_graveyard.killedAtFloor + 1}</b> · ${_graveyard.kills} ennemis`
      : '';
  }

  document.getElementById('start-btn').onclick = () => {
    screen.classList.add('hidden');
    _startGame();
  };
}

function _startGame() {
  _gameOver      = false;
  _targetedMobId = null;
  _targetedSlot  = null;
  initRun(Date.now() >>> 0);
  descend('gorge', 0);
  BattleEngine.ensureDefaultAlloc();   // seed a default blood split (editable anytime)
  LoreSystem.checkBiomeEntry('gorge');
  SoundLine.start();
  addLog('Vous descendez dans les entrailles du dieu mort.', 'sys');
  render();
}

// ── Input wiring ──────────────────────────────────────────────────────────────
function _wireInputs() {
  onInput('MOVE_FORWARD',  () => _tick({ type: 'MOVE', direction: _dir() }));
  onInput('MOVE_BACK',     () => _tick({ type: 'MOVE', direction: _opposite(_dir()) }));
  onInput('TURN_LEFT',     () => _tick({ type: 'TURN', direction: _turnLeft(_dir()) }));
  onInput('TURN_RIGHT',    () => _tick({ type: 'TURN', direction: _turnRight(_dir()) }));
  onInput('STRAFE_LEFT',   () => _tick({ type: 'MOVE', direction: _turnLeft(_dir()) }));
  onInput('STRAFE_RIGHT',  () => _tick({ type: 'MOVE', direction: _turnRight(_dir()) }));

  document.getElementById('padmini')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) onInput(btn.dataset.action);
  });

  for (let i = 1; i <= 6; i++) {
    onInput(`ACTION_${i}`, () => {
      const btns = document.querySelectorAll('#action-bar .act');
      btns[i - 1]?.click();
    });
  }
}

// ── Save / import ─────────────────────────────────────────────────────────────
function _wireSaveButtons() {
  document.getElementById('save-btn')?.addEventListener('click', _saveGame);
  document.getElementById('import-btn')?.addEventListener('click', () => {
    document.getElementById('import-file')?.click();
  });
  document.getElementById('import-file')?.addEventListener('change', _importGame);

  const settingsBtn  = document.getElementById('settings-btn');
  const settingsMenu = document.getElementById('settings-menu');
  if (settingsBtn && settingsMenu) {
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = settingsMenu.style.display !== 'none';
      settingsMenu.style.display = open ? 'none' : 'block';
      settingsBtn.setAttribute('aria-pressed', String(!open));
    });
    document.addEventListener('click', (e) => {
      if (!settingsMenu.contains(e.target) && e.target !== settingsBtn) {
        settingsMenu.style.display = 'none';
        settingsBtn.setAttribute('aria-pressed', 'false');
      }
    });
  }
}

function _saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(toJSON()));
    addLog('Sauvegarde exportée.', 'sys');
  } catch (e) {
    addLog('Échec de la sauvegarde.', 'warn');
  }
}

function _importGame(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      fromJSON(data);
      _gameOver = false;
      addLog('Sauvegarde importée.', 'sys');
      render();
      _updateBattle();
    } catch (_) {
      addLog('Fichier invalide.', 'warn');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ── TriggerBus wiring ─────────────────────────────────────────────────────────
function _wireTriggers() {
  onTrigger('ORGAN_DAMAGED', (e) => {
    const who = e.target === 'player' ? 'Vous' : (WS.mobs.get(e.target)?.name ?? e.target);
    addLog(`${who} -${e.data?.dmg ?? '?'} [${e.data?.slotKey ?? '?'}]`, 'damage');
    if (e.target === 'player') {
      SoundLine.excite('FACE', 0.6 + (e.data?.dmg ?? 1) * 0.05);
    } else {
      SoundLine.excite(Math.random() < 0.5 ? 'G' : 'D', 0.4);
    }
  });

  onTrigger('ATTACK_MISSED', (e) => {
    addLog(e.data?.invisible ? 'Vous frappez dans le vide — cible invisible.' : 'Attaque ratée.', 'sys');
    SoundLine.excite('FACE', 0.1);
  });

  onTrigger('ORGAN_DESTROYED', (e) => {
    const who = e.target === 'player' ? 'Votre' : ((WS.mobs.get(e.target)?.name ?? '') + ' —');
    addLog(`${who} ${e.data?.slotKey ?? '?'} DÉTRUIT`, 'death');
    SoundLine.excite('FACE', 1.0);
  });

  onTrigger('MOB_DIED', (e) => {
    const mob = WS.mobs.get(e.target);
    addLog(`${mob?.name ?? '?'} est mort.`, 'death');
    SoundLine.excite('G', 0.5);
    SoundLine.excite('D', 0.5);
    if (WS.player.runStats) WS.player.runStats.kills++;
  });

  onTrigger('PLAYER_DIED', () => {
    _gameOver = true;
    _graveyard = {
      body:          WS.player.body.toJSON(),
      killedAtFloor: WS.player.floorIdx,
      kills:         WS.player.runStats?.kills ?? 0,
      harvests:      WS.player.runStats?.harvests ?? 0,
    };
    try { localStorage.setItem(GRAVEYARD_KEY, JSON.stringify(_graveyard)); } catch (_) {}
    SoundLine.stop();
    addLog('VOUS ÊTES MORT.', 'death');
    _showDeathScreen();
  });

  onTrigger('ORGAN_HARVESTED', (e) => {
    const def = organResolver(e.data?.organId);
    addLog(`Récolté : ${def?.name ?? e.data?.organId} [${e.data?.quality ?? '?'}]`, 'harvest');
    if (e.data?.invId) scheduleDecay(e.data.invId);
    if (WS.player.runStats) WS.player.runStats.harvests++;
  });

  onTrigger('DODGE', () => {
    addLog('Esquive !', 'sys');
    SoundLine.excite('G', 0.2);
  });

  onTrigger('HEART_ULTIMATE', () => {
    addLog('★ DERNIER SOUFFLE — Le cœur tient encore.', 'death');
    SoundLine.excite('FACE', 0.5);
  });

  onTrigger('LICH_REVIVE', () => {
    addLog('★ RÉSURRECTION — La Liche se relève.', 'death');
    SoundLine.excite('FACE', 0.8);
    SoundLine.excite('G', 0.6);
  });

  onTrigger('SKILL_CANCELLED', (e) => {
    addLog(`✗ ${e.data?.skillName ?? 'Skill'} — interrompu !`, 'sys');
    SoundLine.excite('FACE', 0.45);
    SoundLine.excite(Math.random() < 0.5 ? 'G' : 'D', 0.3);
  });

  onTrigger('MOB_SKILL_FIRED', (e) => {
    switch (e.data?.type) {
      case 'dodge':   addLog('◈ Ennemi esquive le prochain coup.', 'sys'); break;
      case 'harden':  addLog('◈ Ennemi se durcit — +4 ARM pendant ~9s.', 'sys'); break;
      case 'heal':    addLog(`◈ Ennemi régénère +2 HP [${e.data?.slotKey ?? '?'}].`, 'sys'); break;
      case 'analyse': addLog(`◈ Ennemi analyse · cible [${e.data?.slotKey ?? '?'}].`, 'sys'); break;
    }
    SoundLine.excite(Math.random() < 0.5 ? 'G' : 'D', 0.35);
  });

  onTrigger('ORGAN_GRAFTED', (e) => {
    const def = organResolver(e.data?.organId);
    addLog(`Greffé : ${def?.name ?? e.data?.organId} → [${e.target}]`, 'harvest');
  });

  onTrigger('ORGAN_REMOVED', (e) => {
    const def = organResolver(e.data?.organId);
    addLog(`Retiré : ${def?.name ?? e.data?.organId}`, 'sys');
    if (e.data?.id) scheduleDecay(e.data.id);
  });

  onTrigger('LORE_FIRED', (e) => {
    addLog(`✦ ${e.data?.text ?? ''}`, 'sys');
  });

  onTrigger('PARANOIA_EVENT', () => {
    addLog('✦ Quelque chose tourne dans votre crâne.', 'sys');
    SoundLine.excite('FACE', 0.35);
  });

  onTrigger('INFECTION_PURGED', (e) => {
    addLog(`✦ Infection purgée (×${e.data?.purged ?? 1}).`, 'sys');
  });

  onTrigger('ORGAN_HEALED', (e) => {
    const src = e.data?.source === 'life_steal' ? 'vol vital' : 'soin';
    addLog(`✦ [${e.data?.slotKey ?? '?'}] +${e.data?.amount ?? 1} HP (${src}).`, 'sys');
  });

  onTrigger('BATTLE_STARTED', (e) => {
    addLog(`⚔ Combat — pool de sang : ${e.data?.bloodPool ?? '?'} 💉.`, 'sys');
    _targetedSlot = 'skin';
  });

  onTrigger('SKILL_DODGE', (e) => {
    addLog(`★ ESQUIVE — ${e.data?.charges ?? 1} attaque(s) bloquée(s).`, 'sys');
    SoundLine.excite('G', 0.3);
  });

  onTrigger('SKILL_HARDEN', (e) => {
    addLog(`★ DURCIR — absorbera ${e.data?.absorb ?? 8} dégâts.`, 'sys');
  });

  onTrigger('SKILL_AIM', (e) => {
    addLog(`☞ VISER — prochaine frappe → [${e.data?.aimedSlot ?? '?'}].`, 'sys');
  });

  onTrigger('SKILL_LISTEN', (e) => {
    addLog(`◉ ÉCOUTER — skill ennemi repoussé · ${e.data?.intent ?? '?'}`, 'sys');
    SoundLine.excite(Math.random() < 0.5 ? 'G' : 'D', 0.15);
  });

  onTrigger('ANALYSE', (e) => {
    if (e.data?.slotKey) {
      addLog(`✦ ANALYSE — vulnérable : [${e.data.slotKey}]`, 'sys');
    } else {
      addLog('✦ ANALYSE — aucune faiblesse détectée.', 'sys');
    }
  });
}

// ── Battle management ─────────────────────────────────────────────────────────
function _updateBattle() {
  if (_gameOver) return;
  const room = currentRoom();
  const hasActiveMobs = (room?.mobIds ?? []).some(id => WS.mobs.get(id)?.lifecycle === 'active');
  if (hasActiveMobs && !TurnCombat.isActive()) {
    TurnCombat.start(render, _onCombatEnd, addLog);
    render();
  }
}

function _onCombatEnd(reason) {
  if (reason === 'dead') {
    emit({ type: 'PLAYER_DIED', source: 'combat', target: 'player', data: {}, priority: PRIORITY.MOB });
    flush(PRIORITY.MOB);
    return;
  }
  _targetedMobId = null;
  _targetedSlot  = null;
  advanceTicks(1);
  render();
}

// ── Tick ──────────────────────────────────────────────────────────────────────
function _tick(action) {
  if (_gameOver) return;
  const result = processTick(action);
  if (!result.ok) {
    if (result.reason !== 'no_room' && result.reason !== 'in_combat') {
      addLog(`⚠ ${result.reason}`, 'sys');
    }
    return;
  }
  if (_gameOver) return;  // player may have died during processTick
  if (WS.player.runStats) {
    WS.player.runStats.floorReached = Math.max(
      WS.player.runStats.floorReached ?? 0, WS.player.floorIdx
    );
  }
  render();
  _updateBattle();
}

// ── UI action dispatch ────────────────────────────────────────────────────────
function _handleUiAction(act) {
  if (_gameOver) return;

  switch (act.action) {
    case 'CARD':
      TurnCombat.play(act.organKey, act.skillId, TurnCombat.state.targetMobId, TurnCombat.state.targetSlot);
      render();
      break;
    case 'END_TURN':
      TurnCombat.endTurn();
      render();
      break;
    case 'WAIT':
      _tick({ type: 'WAIT' });
      break;
    case 'INSPECT_SELF':
      _inspect = null;
      render();
      break;
    case 'HARVEST_OPEN':
      _openHarvestUI();
      break;
    case 'GRAFT_OPEN':
      _openGraftUI();
      break;
    case 'AMPUTATE_OPEN':
      _openAmputateUI();
      break;
    case 'DESCEND': {
      const curFloor    = WS.floors[WS.player.floorIdx];
      const curBiomeId  = curFloor?.biomeId ?? 'gorge';
      const curBiomeDef = getBiomeData(curBiomeId);
      const nextIdx     = WS.player.floorIdx + 1;

      // Le Fond last floor → ending
      if (curBiomeDef?.id === 'le-fond' && WS.player.floorIdx >= curBiomeDef.floorRange[1] - 1) {
        _showEnding();
        break;
      }
      // End of Gorge (strateIndex 0) → Carrefour
      if (curBiomeDef?.strateIndex === 0 && WS.player.floorIdx >= curBiomeDef.floorRange[1] - 1) {
        _showCarrefour(nextIdx);
        break;
      }
      // End of a mid strate (1 or 2) → Le Fond
      if (curBiomeDef && WS.player.floorIdx >= curBiomeDef.floorRange[1] - 1 && curBiomeDef.strateIndex >= 1) {
        descend('le-fond', nextIdx);
        addLog('Vous descendez vers Le Fond.', 'sys');
      } else {
        descend(curBiomeId, nextIdx);
        addLog(`Descente — étage ${nextIdx + 1}.`, 'sys');
      }
      _targetedMobId = null;
      _targetedSlot  = null;
      render();
      break;
    }
  }
}

// ── Run management ────────────────────────────────────────────────────────────
function _showDeathScreen() {
  const panel = RoomPanel.container();
  panel.innerHTML = `
    <div class="room-title">✝ Vous êtes mort</div>
    <div class="room-body" id="_death-body"></div>`;
  panel.classList.add('active');

  const body = panel.querySelector('#_death-body');
  const stats = document.createElement('div');
  stats.className = 'insp-dim';
  stats.innerHTML = `<p>Étage atteint : <b>${(WS.player.floorIdx ?? 0) + 1}</b></p>
    <p>Ennemis tués : <b>${WS.player.runStats?.kills ?? 0}</b></p>
    <p>Organes récoltés : <b>${WS.player.runStats?.harvests ?? 0}</b></p>`;
  body.appendChild(stats);

  const btn = document.createElement('button');
  btn.className = 'dealbtn';
  btn.textContent = 'NOUVELLE RUN';
  btn.addEventListener('click', _startNewRun);
  body.appendChild(btn);

  document.getElementById('action-bar').innerHTML = '';
}

function _startNewRun() {
  BattleEngine.stop(false);
  SoundLine.stop();
  _showStartScreen();
}

function _saveHeritage() {
  try { localStorage.setItem(HERITAGE_KEY, JSON.stringify(_heritage)); } catch (_) {}
}

function _showEnding() {
  _gameOver = true;
  SoundLine.stop();

  const panel = RoomPanel.container();
  const path = WS.player.biomePath ?? 'poumons';
  const endTitle = path === 'poumons' ? 'Fin — L\'Air' : 'Fin — La Chair';

  panel.innerHTML = `
    <div class="room-title">${endTitle}</div>
    <div class="room-body" id="_end-body"></div>`;
  panel.classList.add('active');

  const body = panel.querySelector('#_end-body');
  const text = document.createElement('div');
  text.className = 'insp-dim';
  text.style.lineHeight = '1.8';
  text.innerHTML = path === 'poumons'
    ? '<p>Vous avez traversé les poumons du dieu mort.</p><p>Vous en êtes sorti par en haut.</p><p>L\'air vous appartient désormais.</p>'
    : '<p>Vous avez traversé ses entrailles.</p><p>Vous êtes devenu sa chair.</p><p>Le fond n\'a plus de fond.</p>';
  body.appendChild(text);

  const stats = document.createElement('div');
  stats.className = 'insp-dim';
  stats.style.marginTop = '1em';
  stats.innerHTML = `<p>Étage atteint : <b>${(WS.player.floorIdx ?? 0) + 1}</b></p>
    <p>Ennemis tués : <b>${WS.player.runStats?.kills ?? 0}</b></p>
    <p>Organes récoltés : <b>${WS.player.runStats?.harvests ?? 0}</b></p>`;
  body.appendChild(stats);

  const btn = document.createElement('button');
  btn.className = 'dealbtn';
  btn.textContent = 'RECOMMENCER';
  btn.addEventListener('click', _startNewRun);
  body.appendChild(btn);

  document.getElementById('action-bar').innerHTML = '';
}

function _showCarrefour(nextIdx) {
  const panel = RoomPanel.container();
  panel.innerHTML = `
    <div class="room-title">⬦ Carrefour</div>
    <div class="room-body" id="_carf-body">
      <p class="insp-dim">La gorge se divise. Air ou Chair ?</p>
    </div>`;
  panel.classList.add('active');

  const body = panel.querySelector('#_carf-body');
  const b1 = document.createElement('button');
  b1.className = 'dealbtn';
  b1.innerHTML = 'Trachée <em style="font-variant:normal;margin-left:6px;font-size:.6em;color:var(--bone)">Air · Les Poumons</em>';
  b1.addEventListener('click', () => _choosePath('poumons', nextIdx));
  body.appendChild(b1);

  const b2 = document.createElement('button');
  b2.className = 'dealbtn';
  b2.innerHTML = 'Œsophage <em style="font-variant:normal;margin-left:6px;font-size:.6em;color:var(--bone)">Chair · Les Entrailles</em>';
  b2.addEventListener('click', () => _choosePath('estomac', nextIdx));
  body.appendChild(b2);
}

function _choosePath(biomeId, nextIdx) {
  const idx = nextIdx ?? (WS.player.floorIdx + 1);
  WS.player.biomePath = biomeId;
  descend(biomeId, idx);
  addLog(biomeId === 'poumons'
    ? 'Trachée · les Poumons vous accueillent.'
    : 'Œsophage · les Entrailles s\'ouvrent.', 'sys');
  LoreSystem.checkBiomeEntry(biomeId);
  _targetedMobId = null;
  _targetedSlot  = null;
  render();
  return;
}

// ── Main render ───────────────────────────────────────────────────────────────
function render() {
  SceneRenderer.render();
  MobRenderer.render({
    focusedMobId: _targetedMobId,
    onFocus: (mobId) => {
      _targetedMobId = mobId;
      _targetedSlot  = null;
      if (TurnCombat.isActive()) TurnCombat.setTarget(mobId, null);
      render();
    },
  });
  HUDRenderer.render();
  MinimapRenderer.render();
  InventoryRenderer.render();

  ReactorPanel.render();

  RoomPanel.render({
    targetedMobId:    _targetedMobId,
    targetedSlot:     _targetedSlot,
    onAimMob: (mobId, slotKey) => {
      _targetedMobId = mobId;
      _targetedSlot  = slotKey;
      if (TurnCombat.isActive()) TurnCombat.setTarget(mobId, slotKey);
      render();
    },
    onTick:           (action) => _tick(action),
    onSave:           _saveGame,
    onChoosePath:     _choosePath,
    onRender:         render,
    heritage:         _heritage,
    onHeritageChange: _saveHeritage,
  });

  // Inspector: an organ or a picked-up item (each with a back button) if one is
  // selected and still present, else the body overview.
  const _back = () => { _inspect = null; render(); };
  if (_inspect?.kind === 'organ') {
    const s = WS.player.body?.slots?.[_inspect.slot];
    if (s?.organId) InspectorPanel.showOrgan(s.organId, s.hp, _inspect.slot, _back);
    else { _inspect = null; InspectorPanel.showBody(WS.player.body); }
  } else if (_inspect?.kind === 'item') {
    const it = WS.player.inventory?.[_inspect.index];
    if (it?.organId) InspectorPanel.showOrgan(it.organId, it.hp, null, _back);
    else { _inspect = null; InspectorPanel.showBody(WS.player.body); }
  } else {
    InspectorPanel.showBody(WS.player.body);
  }

  ActionBar.render();
  _renderCombatHand();
  BodyFX.apply();
  SensoryFX.applyBodyState();

  const _curFloor = WS.floors[WS.player.floorIdx];
  if (_curFloor) {
    const _app = document.getElementById('chair-app');
    if (_app) {
      _app.dataset.biome = _curFloor.biomeId;
      _applyBiomePalette(_app, _curFloor.biomeId);
    }
  }
}

// Drive the biome colours from biomes.json (the single source of truth) by
// writing the palette onto the game element's CSS custom properties.
function _applyBiomePalette(el, biomeId) {
  const p = getBiomeData(biomeId)?.palette;
  if (!p) return;
  const map = { '--meat': p.meat, '--blood': p.blood, '--thread': p.thread, '--torch': p.torch, '--torch-hot': p.torchHot };
  for (const [k, v] of Object.entries(map)) if (v) el.style.setProperty(k, v);
}

// ── Combat hand (drag-and-drop cards) ──────────────────────────────────────────
function _renderCombatHand() {
  if (!TurnCombat.isActive()) { CombatHand.hide(); return; }
  const room   = currentRoom();
  const active = (room?.mobIds ?? []).map(id => WS.mobs.get(id)).filter(m => m?.lifecycle === 'active');
  const mob    = active.find(m => m.id === _targetedMobId) ?? active[0];

  // Targets for EVERY enemy (each cluster is drawn over its own silhouette), so
  // you can drop a card straight on the mob you want — no pre-selection needed.
  const organs = [];
  for (const mb of active) {
    const reach = new Set(TurnCombat.targetable(mb.id, false));
    for (const k of Object.keys(ORGAN_SLOTS)) {
      const s = mb.body.slots[k];
      if (!s?.organId) continue;
      const def = organResolver(s.organId);
      const maxHp = def?.maxHp ?? 1;
      const hp = s.hp ?? maxHp;
      organs.push({ mobId: mb.id, slotKey: k, layer: ORGAN_SLOTS[k].layer, name: def?.name ?? k, hp, maxHp, locked: !reach.has(k), dead: hp <= 0 });
    }
  }

  const cards = TurnCombat.hand().map(c => ({
    organKey:   c.organKey,
    skillId:    c.skill.id,
    label:      c.skill.label,
    cost:       c.skill.cost ?? 0,
    desc:       c.skill.desc ?? '',
    organName:  organResolver(c.organId)?.name ?? '',
    playable:   c.playable,
    needsTarget: ['damage', 'heal', 'retrigger'].includes(c.skill.effect?.kind),
    layerHint:  ORGAN_SLOTS[c.organKey]?.layer ?? 'x',
  }));

  CombatHand.render(cards, {
    blood:  TurnCombat.blood(),
    mobId:  mob?.id ?? null,
    organs,
    onPlay: (organKey, skillId, mobId, slot, isSelf) => { TurnCombat.play(organKey, skillId, mobId, slot, isSelf); render(); },
    onEndTurn: () => { TurnCombat.endTurn(); render(); },
  });
}

// ── Harvest UI ────────────────────────────────────────────────────────────────
function _openHarvestUI() {
  const panel = RoomPanel.container();
  panel.innerHTML = `
    <div class="room-title">✦ Récolte</div>
    <div class="room-body" id="_harv-body"></div>`;
  panel.classList.add('active');

  const body = panel.querySelector('#_harv-body');
  const { floorIdx, pos } = WS.player;
  const cadavers = [...WS.cadavers.values()].filter(c =>
    (c.lifecycle === 'fresh' || c.lifecycle === 'decaying') &&
    c.pos?.floorIdx === floorIdx && c.pos?.x === pos.x && c.pos?.y === pos.y
  );

  if (!cadavers.length) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Aucun cadavre ici.';
    body.appendChild(p);
    _appendBackBtn(body);
    return;
  }

  for (const cad of cadavers) {
    const mob    = WS.mobs.get(cad.mobId);
    const header = document.createElement('p');
    header.className = 'insp-dim';
    header.style.cssText = 'font-variant:small-caps;color:var(--torch-hot);margin-bottom:4px';
    header.textContent = mob?.name ?? 'Cadavre';
    body.appendChild(header);

    const organs = cad.body.equippedOrgans();
    if (!organs.length) {
      const note = document.createElement('p');
      note.className = 'insp-dim';
      note.textContent = 'Vide.';
      body.appendChild(note);
      continue;
    }

    for (const { slot: slotKey, organId, hp } of organs) {
      const def = organResolver(organId);
      if (!def) continue;
      const quality = def.getQuality(hp ?? def.maxHp);
      const price   = def.getSellPrice(hp ?? def.maxHp);

      const btn = document.createElement('button');
      btn.className = 'dealbtn';
      btn.innerHTML = `${def.name} <em style="font-variant:normal;font-size:.6em;color:var(--bone)">[${quality.name}] · ${price}💀</em>`;
      btn.addEventListener('click', () => {
        _tick({ type: 'HARVEST', cadaverId: cad.id, slotKey });
        _openHarvestUI();
      });
      body.appendChild(btn);
    }
  }

  _appendBackBtn(body);
}

// ── Graft UI ──────────────────────────────────────────────────────────────────
function _openGraftUI() {
  const panel = RoomPanel.container();
  const cost = (WS.player?.relics ?? []).includes('relic_suture_noire') ? 3 : 5;
  panel.innerHTML = `
    <div class="room-title">✂ Greffe · <span style="font-size:.7em;letter-spacing:.1em">${cost} ticks</span></div>
    <div class="room-body" id="_graft-body"></div>`;
  panel.classList.add('active');

  const body = panel.querySelector('#_graft-body');
  const inventory = WS.player.inventory;
  if (!inventory.length) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Besace vide.';
    body.appendChild(p);
    _appendBackBtn(body);
    return;
  }

  inventory.forEach((item, idx) => {
    const def = organResolver(item.organId);
    if (!def) return;
    const quality = def.getQuality(item.hp);

    const card = document.createElement('div');
    card.className = 'graft-card';

    const nameEl = document.createElement('div');
    nameEl.className = 'graft-card-name';
    nameEl.textContent = `${def.name} [${quality.name}]`;
    card.appendChild(nameEl);

    const compat = Object.keys(WS.player.body.slots).filter(
      sk => WS.player.body.canFitOrgan(sk, item.organId, organResolver)
    );
    if (compat.length) {
      const slots = document.createElement('div');
      slots.className = 'graft-slots';
      for (const slotKey of compat) {
        const btn = document.createElement('button');
        btn.className = 'act';
        btn.style.cssText = 'flex:none;max-width:none;padding:4px 8px';
        btn.innerHTML = `<b>→ ${slotKey}</b>`;
        btn.addEventListener('click', () => {
          _tick({ type: 'GRAFT', inventoryIndex: idx, slotKey });
          _openGraftUI();
        });
        slots.appendChild(btn);
      }
      card.appendChild(slots);
    } else {
      const note = document.createElement('p');
      note.className = 'insp-dim';
      note.textContent = 'Aucun slot compatible.';
      card.appendChild(note);
    }

    body.appendChild(card);
  });

  _appendBackBtn(body);
}

// ── Amputate UI ───────────────────────────────────────────────────────────────
function _openAmputateUI() {
  const panel = RoomPanel.container();
  panel.innerHTML = `
    <div class="room-title">✂ Amputation</div>
    <div class="room-body" id="_amp-body"></div>`;
  panel.classList.add('active');

  const body = panel.querySelector('#_amp-body');
  const slots = Object.entries(WS.player.body.slots)
    .filter(([, slot]) => slot !== null);

  if (!slots.length) {
    const p = document.createElement('p');
    p.className = 'insp-dim';
    p.textContent = 'Aucun organe équipé.';
    body.appendChild(p);
    _appendBackBtn(body);
    return;
  }

  for (const [slotKey, slot] of slots) {
    const def = organResolver(slot.organId);
    if (!def) continue;
    const quality = def.getQuality(slot.hp ?? def.maxHp);

    const btn = document.createElement('button');
    btn.className = 'dealbtn danger';
    btn.innerHTML = `[${slotKey}] ${def.name} <em style="font-variant:normal;font-size:.6em;color:var(--bone)">${quality.name}</em>`;
    btn.addEventListener('click', () => {
      _tick({ type: 'REMOVE_ORGAN', slotKey });
      _openAmputateUI();
    });
    body.appendChild(btn);
  }

  _appendBackBtn(body);
}

function _appendBackBtn(container) {
  const btn = document.createElement('button');
  btn.className = 'dealbtn';
  btn.textContent = '← Retour';
  btn.addEventListener('click', render);
  container.appendChild(btn);
}

// ── Start ─────────────────────────────────────────────────────────────────────
boot();
