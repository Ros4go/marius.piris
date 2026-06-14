// Zero game knowledge — maps hardware events to abstract action strings.
// Consumers call on(actionType, handler) or onAny(handler).

const _bus = new EventTarget();

const KEY_MAP = {
  // Movement (relative to facing direction)
  ArrowUp:   'MOVE_FORWARD',
  z:         'MOVE_FORWARD', Z: 'MOVE_FORWARD',
  ArrowDown: 'MOVE_BACK',
  s:         'MOVE_BACK',    S: 'MOVE_BACK',
  // Turning
  q:         'TURN_LEFT',    Q: 'TURN_LEFT',
  e:         'TURN_RIGHT',   E: 'TURN_RIGHT',
  // Strafing
  ArrowLeft: 'STRAFE_LEFT',
  a:         'STRAFE_LEFT',  A: 'STRAFE_LEFT',
  ArrowRight:'STRAFE_RIGHT',
  d:         'STRAFE_RIGHT', D: 'STRAFE_RIGHT',
  // Numbered actions
  '1': 'ACTION_1', '2': 'ACTION_2', '3': 'ACTION_3',
  '4': 'ACTION_4', '5': 'ACTION_5', '6': 'ACTION_6',
  // Meta
  Escape:    'OPEN_MENU',
};

export function init() {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const action = KEY_MAP[e.key];
    if (!action) return;
    e.preventDefault();
    _emit(action, {});
  });

  // Click on [data-action] elements (desktop padmini + any button)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    _emit(btn.dataset.action, {});
  });

  // Touch presses on any element carrying [data-action]
  document.addEventListener('touchstart', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.preventDefault();
    _emit(btn.dataset.action, {});
  }, { passive: false });
}

export function on(actionType, handler) {
  _bus.addEventListener(actionType, (ev) => handler(ev.detail));
}

function _emit(action, detail) {
  _bus.dispatchEvent(new CustomEvent(action, { detail }));
}
