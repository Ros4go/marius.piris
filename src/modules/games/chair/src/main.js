// Entry point — imports everything, boots the game.

import { loadData, organResolver, biome as getBiomeData } from './registry.js';
import { WS, initRun, currentRoom, toJSON, fromJSON } from './WorldState.js';
import { on as onTrigger } from './TriggerBus.js';
import { processTick, descend, advanceTicks, eatInCombat } from './TickEngine.js';
import * as BattleEngine from './BattleEngine.js';
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
import { render as renderSeg } from './render/SegmentBar.js';
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
  _wireBodyDots();

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
  LoreSystem.checkBiomeEntry('gorge');
  SoundLine.start();
  addLog('Vous descendez dans les entrailles du dieu mort.', 'sys');
  const HUMEUR_DESC = {
    fievre:        'Fièvre — les chairs pourrissent vite. La faim s\'accélère.',
    frissons:      'Frissons — les torches brûlent en deux fois moins de ticks.',
    bile_montante: 'Bile montante — votre faim descend plus vite.',
    rigor_mortis:  'Rigor mortis — les mobs sont blindés (+2 ARM).',
    insomnie:      'Insomnie — le dieu murmure dès que l\'humanité flanche.',
  };
  const humDesc = HUMEUR_DESC[WS.humeur];
  if (humDesc) addLog(`✦ Humeur : ${humDesc}`, 'sys');
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

function _wireBodyDots() {
  document.querySelectorAll('.slotdot').forEach(dot => {
    dot.addEventListener('click', () => {
      const slotKey = dot.dataset.slot;
      const slot = WS.player.body?.slots[slotKey];
      if (slot?.organId) InspectorPanel.showOrgan(slot.organId, slot.hp, slotKey);
    });
  });
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

  onTrigger('MOB_TELEGRAPH', (e) => {
    const intent = e.data?.intent;
    if (!intent) return;
    const brief = intent.split('·')[0].trim().toLowerCase();
    SoundLine.addSound('FACE', brief, 0.55);
  });

  onTrigger('HALLUCINATION', (e) => {
    const { intensity, tier } = e.data;
    const ch = Math.random() < 0.5 ? 'G' : 'D';
    SoundLine.excite(ch, 0.2 + intensity * 0.008);
    if (intensity > 15) addLog('Quelque chose... vous entend.', 'sys');
    if (intensity > 22) {
      addLog('[HALLUCINATION]', 'death');
      SoundLine.excite('FACE', 0.25);
    }
    if (tier >= 2) {
      const FAKE = ['pas lourds', 'souffle', 'grattement', '...', 'murmure', 'craquement'];
      const loudness = tier >= 3 ? 0.4 : 0.2;
      SoundLine.addSound(ch, FAKE[Math.floor(Math.random() * FAKE.length)], loudness);
    }
  });

  onTrigger('ORGAN_EATEN', (e) => {
    const def    = organResolver(e.data?.organId);
    const hpPart = e.data?.hpTarget
      ? ` · +${e.data?.hpTransfer ?? 0} HP → [${e.data.hpTarget}]`
      : '';
    addLog(`Mangé : ${def?.name ?? e.data?.organId} [${e.data?.quality ?? '?'}] · +${e.data?.satGain} satiété${hpPart}.`, 'harvest');
    SoundLine.excite('FACE', 0.12);
  });

  onTrigger('SKILL_HP_COST', (e) => {
    addLog(`✦ [${e.data?.slotKey ?? '?'}] -${e.data?.cost ?? 1} HP (skill).`, 'damage');
  });

  onTrigger('SKILL_CANCELLED', (e) => {
    addLog(`✗ ${e.data?.skillName ?? 'Skill'} — interrompu !`, 'sys');
    SoundLine.excite('FACE', 0.45);
    SoundLine.excite(Math.random() < 0.5 ? 'G' : 'D', 0.3);
  });

  onTrigger('MOB_SKILL_FIRED', (e) => {
    switch (e.data?.type) {
      case 'dodge':   addLog('◈ Ennemi esquive le prochain coup.', 'sys'); break;
      case 'harden':  addLog('◈ Ennemi se durcit — +4 ARM pendant 3 beats.', 'sys'); break;
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

  onTrigger('RIPOSTE', () => {
    addLog('★ RIPOSTE — vous contre-attaquez.', 'sys');
    SoundLine.excite('FACE', 0.6);
  });

  const _ECHO_LINES = [
    'Tu n\'es pas le premier à descendre.',
    'Je te connais déjà.',
    'La chair que tu portes était mienne.',
    'Tu deviens ce que tu dévores.',
    'Reste encore. Je t\'attends au fond.',
    'Tes organes me reconnaissent.',
    'Tu n\'es plus tout à fait toi.',
  ];
  onTrigger('ECHO_DU_DIEU', () => {
    const line = _ECHO_LINES[Math.floor(Math.random() * _ECHO_LINES.length)];
    addLog(`✦ ${line}`, 'god');
    SoundLine.addSound('FACE', '...', 0.22);
  });

  onTrigger('INFECTION_PURGED', (e) => {
    addLog(`✦ Infection purgée (×${e.data?.purged ?? 1}).`, 'sys');
  });

  onTrigger('ORGAN_HEALED', (e) => {
    const src = e.data?.source === 'life_steal' ? 'vol vital' : 'soin';
    addLog(`✦ [${e.data?.slotKey ?? '?'}] +${e.data?.amount ?? 1} HP (${src}).`, 'sys');
  });

  onTrigger('BATTLE_STARTED', (e) => {
    const bpm = Math.round(60000 / (e.data?.interval ?? 1200));
    addLog(`⚔ Combat — ${bpm} BPM.`, 'sys');
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
  if (hasActiveMobs && !WS.battle.active) {
    BattleEngine.start(_onBattleBeat, _onBattleEnd);
  }
}

function _onBattleBeat() {
  if (_gameOver) return;
  SensoryFX.onBeat();
  render();
}

function _onBattleEnd(explCost) {
  advanceTicks(explCost);
  _targetedMobId = null;
  _targetedSlot  = null;
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
    case 'SKILL':
      BattleEngine.activateSkill(act.slotKey);
      break;
    case 'ATTACK_AUTO': {
      if (!_targetedMobId) {
        const room = currentRoom();
        _targetedMobId = room?.mobIds.find(id => WS.mobs.get(id)?.lifecycle === 'active') ?? null;
      }
      if (_targetedMobId) _tick({ type: 'ATTACK', mobId: _targetedMobId, slotKey: _targetedSlot ?? null });
      break;
    }
    case 'WAIT':
      _tick({ type: 'WAIT' });
      break;
    case 'INSPECT_SELF':
      InspectorPanel.showBody(WS.player.body);
      break;
    case 'MANGER_OPEN':
      _openEatUI();
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
  const hum  = WS.player.body?.humanityWith(organResolver) ?? 0;
  const endTitle = hum >= 60  ? 'Fin — L\'Humain'
                 : path === 'poumons' ? 'Fin — L\'Air'
                 : 'Fin — La Chair';

  panel.innerHTML = `
    <div class="room-title">${endTitle}</div>
    <div class="room-body" id="_end-body"></div>`;
  panel.classList.add('active');

  const body = panel.querySelector('#_end-body');
  const text = document.createElement('div');
  text.className = 'insp-dim';
  text.style.lineHeight = '1.8';
  text.innerHTML = hum >= 60
    ? '<p>Vous avez traversé le dieu mort en restant vous-même.</p><p>Trop humain pour être digéré.</p><p>Il vous a recraché dans le monde des vivants.</p>'
    : path === 'poumons'
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
  MobRenderer.render();
  HUDRenderer.render();
  MinimapRenderer.render();
  InventoryRenderer.render();

  renderSeg(
    document.getElementById('player-seg'),
    WS.player.body,
    {
      twoLine: true,
      onAim: (slotKey) => {
        const slot = WS.player.body.slots[slotKey];
        if (slot) InspectorPanel.showOrgan(slot.organId, slot.hp, slotKey);
      },
    }
  );

  // Sync body silhouette dots with current organ state
  document.querySelectorAll('.slotdot').forEach(dot => {
    const slotKey = dot.dataset.slot;
    const slot = WS.player.body?.slots[slotKey];
    dot.classList.remove('on', 'hurt', 'mut');
    if (!slot?.organId) return;
    const def = organResolver(slot.organId);
    const hp  = slot.hp ?? (def?.maxHp ?? 1);
    if (hp <= 0) return;
    dot.classList.add(def && hp < def.maxHp ? 'hurt' : 'on');
  });

  RoomPanel.render({
    targetedMobId:    _targetedMobId,
    targetedSlot:     _targetedSlot,
    onAimMob: (mobId, slotKey) => {
      _targetedMobId = mobId;
      _targetedSlot  = slotKey;
      if (WS.battle?.active) BattleEngine.setTarget(slotKey);
      render();
    },
    onTick:           (action) => _tick(action),
    onSave:           _saveGame,
    onChoosePath:     _choosePath,
    onRender:         render,
    heritage:         _heritage,
    onHeritageChange: _saveHeritage,
  });

  // Default inspector view: body stats. Overridden when user clicks a segment/item.
  InspectorPanel.showBody(WS.player.body);

  ActionBar.render();
  BodyFX.apply();
  SensoryFX.applyBodyState();

  const _curFloor = WS.floors[WS.player.floorIdx];
  if (_curFloor) {
    const _app = document.getElementById('chair-app');
    if (_app) _app.dataset.biome = _curFloor.biomeId;
  }
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

// ── Eat UI (two-step: pick organ → pick target slot) ─────────────────────────
const _EAT_SAT = { parfait: 30, intact: 25, 'abîmé': 18, cuit: 10, pourri: 4 };

function _openEatUI() {
  const panel = RoomPanel.container();
  panel.innerHTML = `
    <div class="room-title">⬡ Manger</div>
    <div class="room-body" id="_eat-body"></div>`;
  panel.classList.add('active');

  const body = panel.querySelector('#_eat-body');
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
    const satGain = _EAT_SAT[quality.name] ?? 15;
    const hpGain  = item.hp ?? def.maxHp;

    const btn = document.createElement('button');
    btn.className = 'dealbtn';
    btn.innerHTML = `${def.name} <em style="font-variant:normal;font-size:.6em;color:var(--bone)">[${quality.name}] · +${satGain} satiété · ${hpGain} HP</em>`;
    btn.addEventListener('click', () => _openEatTransferUI(idx, def, satGain, hpGain));
    body.appendChild(btn);
  });

  _appendBackBtn(body);
}

function _openEatTransferUI(idx, def, satGain, hpGain) {
  const panel = RoomPanel.container();
  panel.innerHTML = `
    <div class="room-title">⬡ ${def.name} — HP vers...</div>
    <div class="room-body" id="_eat-tr-body"></div>`;
  panel.classList.add('active');

  const body     = panel.querySelector('#_eat-tr-body');
  const inCombat = WS.battle?.active;

  const hint = document.createElement('p');
  hint.className = 'insp-dim';
  hint.textContent = `+${satGain} satiété · ${hpGain} HP à transférer`;
  body.appendChild(hint);

  const _doEat = (targetSlotKey) => {
    if (WS.battle?.active) {
      eatInCombat(idx, targetSlotKey);
      render();
    } else {
      _tick({ type: 'EAT', inventoryIndex: idx, targetSlotKey: targetSlotKey ?? null });
      _openEatUI();
    }
  };

  for (const [slotKey, slot] of Object.entries(WS.player.body.slots)) {
    if (!slot || (slot.hp !== null && slot.hp <= 0)) continue;
    const sdef = organResolver(slot.organId);
    if (!sdef) continue;
    const hp = slot.hp ?? sdef.maxHp;
    if (hp >= sdef.maxHp) continue;

    const btn = document.createElement('button');
    btn.className = 'dealbtn';
    btn.innerHTML = `[${slotKey}] ${sdef.name} <em style="font-variant:normal;font-size:.6em;color:var(--bone)">${hp}/${sdef.maxHp} HP</em>`;
    btn.addEventListener('click', () => _doEat(slotKey));
    body.appendChild(btn);
  }

  const autoBtn = document.createElement('button');
  autoBtn.className = 'dealbtn';
  autoBtn.innerHTML = `Auto <em style="font-variant:normal;font-size:.6em;color:var(--bone)">répare l'organe le plus blessé</em>`;
  autoBtn.addEventListener('click', () => _doEat(null));
  body.appendChild(autoBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'dealbtn';
  backBtn.textContent = '← Retour';
  backBtn.addEventListener('click', _openEatUI);
  body.appendChild(backBtn);
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
