// SpriteFX — le compilateur de sprites paramétriques (organs/relics/structures
// .json "sprite") : formes CSS + calques + animations WAAPI, en pur data.
// PARTAGÉ par la besace (InventoryRenderer), le marchand (TradePanel), les
// figures de salle (RoomPanel) et les aperçus de l'atelier. Sans sprite, chaque
// consommateur garde son rendu historique (classes hud.css / html data).

// Sprite : forme (border-radius) · degrade {cx,cy,stops:[{c,de?,a?}]} — deux
// positions sur un stop = anneau net (l'iris de l'œil) · taille (% de la cellule)
// · ombre (false = sans ombre portée) · eclat {c,alpha,rayon} (halo, cf reliques).
export function spriteStyle(sp, avecTaille = true) {
  if (!sp) return '';
  const out = [];
  if (sp.forme) out.push(`border-radius:${sp.forme}`);
  // un sprite possède ENTIÈREMENT son rendu : sans dégradé, base transparente —
  // sinon la forme CSS historique (.orgshape…) transparaîtrait derrière les calques
  out.push(sp.degrade?.stops?.length ? `background:${_degradeCss(sp.degrade)}` : 'background:none');
  if (avecTaille && sp.taille) out.push(`width:${sp.taille}%;height:${sp.taille}%`);
  const shadows = [];
  if (sp.eclat?.c) {
    const a = Math.round((sp.eclat.alpha ?? 0.4) * 255).toString(16).padStart(2, '0');
    shadows.push(`0 0 ${sp.eclat.rayon ?? 6}px ${sp.eclat.c}${a}`);
  }
  // ombre portée : par défaut seulement quand la base est visible (dégradé) —
  // ombre:true la force (base invisible), ombre:false la retire
  if (sp.ombre === true || (sp.ombre !== false && sp.degrade?.stops?.length)) shadows.push('0 2px 4px #000');
  out.push(`box-shadow:${shadows.join(', ') || 'none'}`);
  if (sp.calques?.length) {
    out.push('position:relative');                    // ancre les calques absolus
    if (sp.decoupe) out.push('overflow:hidden');      // coupe ce qui dépasse la forme
  }
  return out.join(';');
}

// Dégradé radial d'un sprite ou d'un calque : 1 stop = couleur pleine (un
// radial-gradient à 1 stop est du CSS invalide), 2+ = dégradé centré (cx, cy).
function _degradeCss(dg) {
  if (dg.stops.length === 1) return dg.stops[0].c;
  const stops = dg.stops
    .map((s) => s.c + (s.de != null ? ` ${s.de}%` : '') + (s.a != null ? ` ${s.a}%` : ''))
    .join(', ');
  return `radial-gradient(circle at ${dg.cx ?? 50}% ${dg.cy ?? 50}%, ${stops})`;
}

// Calques : petites formes posées PAR-DESSUS la forme de base (yeux, taches,
// détails), avec les MÊMES réglages que la base : {forme?, degrade?, eclat?,
// ombre?, alpha?} + position/taille {x, y, l, h} en % de la forme, CENTRÉES sur
// (x, y), et rotation {rot}. Compat : {c, c2?} = ancien format couleur plate/duo.
function _calqueStyle(k) {
  const l = k.l ?? 20, h = k.h ?? 20;
  const out = [
    'position:absolute', 'display:block',
    `left:${(k.x ?? 50) - l / 2}%`, `top:${(k.y ?? 50) - h / 2}%`,
    `width:${l}%`, `height:${h}%`,
    `border-radius:${k.forme ?? '50%'}`,
  ];
  if (k.degrade?.stops?.length) out.push(`background:${_degradeCss(k.degrade)}`);
  else out.push(k.c2 ? `background:radial-gradient(circle at 35% 30%, ${k.c ?? '#000'}, ${k.c2})` : `background:${k.c ?? '#000'}`);
  if (k.eclat?.c || k.ombre) {
    const shadows = [];
    if (k.eclat?.c) {
      const a = Math.round((k.eclat.alpha ?? 0.4) * 255).toString(16).padStart(2, '0');
      shadows.push(`0 0 ${k.eclat.rayon ?? 6}px ${k.eclat.c}${a}`);
    }
    if (k.ombre) shadows.push('0 2px 4px #000');
    out.push(`box-shadow:${shadows.join(', ')}`);
  }
  if (k.alpha != null) out.push(`opacity:${k.alpha}`);
  if (k.rot) out.push(`transform:rotate(${k.rot}deg)`);
  return out.join(';');
}
// HTML interne de la forme (un <i> par calque) — à insérer DANS le div du sprite.
export function spriteCalques(sp) {
  return (sp?.calques ?? []).map((k) => `<i style="${_calqueStyle(k)}"${spriteAnimAttr(k)}></i>`).join('');
}

// DÉCORATION (categorie "decoration") : wrapper positionné dans la salle (socket
// #gore, plein cadre), accroché au sol / mur / plafond, à --gore-left (position
// horizontale choisie par SceneRenderer hors des portes). Retourne le HTML complet.
export function decorFigure(s) {
  if (!s?.sprite) return '';
  const anc = s.accroche === 'plafond' ? 'top:-2%;' : s.accroche === 'mur' ? 'bottom:26%;' : 'bottom:1%;';
  return `<div style="position:absolute;left:var(--gore-left,36%);${anc}width:${s.spriteTaille ?? 12}%;aspect-ratio:${s.spriteRatio ?? '1 / 1'};">`
    + `<div style="position:relative;width:100%;height:100%;${spriteStyle(s.sprite, false)}"${spriteAnimAttr(s.sprite)}>${spriteCalques(s.sprite)}</div></div>`;
}

// Figure de STRUCTURE pilotée par sprite : contenu + style inline du conteneur
// .npc-figure. Sans sprite → le html/CSS legacy de structures.json ; avec sprite →
// taille inline (spriteTaille = % de largeur de la salle, défaut 12) et proportions
// du cadre (spriteRatio, ex "0.8 / 1", défaut carré).
export function structFigure(s) {
  if (!s?.sprite) return { html: s?.html ?? '', style: '' };
  return {
    html: `<div style="position:relative;width:100%;height:100%;${spriteStyle(s.sprite, false)}"${spriteAnimAttr(s.sprite)}>${spriteCalques(s.sprite)}</div>`,
    style: `width:${s.spriteTaille ?? 12}%;aspect-ratio:${s.spriteRatio ?? '1 / 1'};`,
  };
}

// ── Animations de sprites (base ET calques) — WAAPI, données dans "anim": [...] ──
// Chaque entrée : { preset: "clignement"|... } OU custom { prop, de, a, duree,
// easing, allerRetour }. prop : alpha (opacité) · echelle · x/y (dérive en %) ·
// rot (°) · forme (morph de border-radius !) · teinte (hue-rotate sur le dégradé)
// · couleur (fond, aplats seulement). Les transforms se COMPOSENT (composite add).
export const ANIM_PRESETS = {
  clignement:    { doc: 'paupière qui cligne (scaleY)', duree: 3.2, frames: [
    { transform: 'scaleY(1)', offset: 0 }, { transform: 'scaleY(1)', offset: 0.9 },
    { transform: 'scaleY(0.06)', offset: 0.95 }, { transform: 'scaleY(1)', offset: 1 }], composite: 'add' },
  pulsation:     { doc: 'gonfle et dégonfle', duree: 1.4, frames: [{ transform: 'scale(1)' }, { transform: 'scale(1.14)' }], alterne: true, composite: 'add', easing: 'ease-in-out' },
  scintillement: { doc: 'opacité qui vacille', duree: 0.9, frames: [{ opacity: 1 }, { opacity: 0.45 }], alterne: true, easing: 'ease-in-out' },
  derive:        { doc: 'flotte doucement', duree: 2.6, frames: [{ transform: 'translateY(0%)' }, { transform: 'translateY(-9%)' }], alterne: true, composite: 'add', easing: 'ease-in-out' },
  rotation:      { doc: 'tourne en continu', duree: 5, frames: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], easing: 'linear', composite: 'add' },
};
export const ANIM_EASINGS = [
  ['ease-in-out', 'doux'],
  ['linear', 'linéaire'],
  ['ease-in', 'accélère'],
  ['ease-out', 'décélère'],
  ['cubic-bezier(.68,-0.55,.27,1.55)', 'rebond'],
  ['cubic-bezier(.9,0,.1,1)', 'sec'],
  ['steps(3, end)', 'saccadé'],
];

// Attribut porté par le HTML du sprite (encodé : le JSON contient des guillemets).
export function spriteAnimAttr(holder) {
  return holder?.anim?.length ? ` data-anim="${encodeURIComponent(JSON.stringify(holder.anim))}"` : '';
}

function _animFrames(a) {
  if (a.preset && ANIM_PRESETS[a.preset]) {
    const p = ANIM_PRESETS[a.preset];
    return { frames: p.frames, opts: { duration: (a.duree ?? p.duree) * 1000, iterations: Infinity,
      direction: p.alterne ? 'alternate' : 'normal', easing: a.easing ?? p.easing ?? 'linear', composite: p.composite } };
  }
  const F = {
    alpha:   () => [{ opacity: a.de ?? 1 }, { opacity: a.a ?? 0.4 }],
    echelle: () => [{ transform: `scale(${a.de ?? 1})` }, { transform: `scale(${a.a ?? 1.2})` }],
    x:       () => [{ transform: `translateX(${a.de ?? 0}%)` }, { transform: `translateX(${a.a ?? 10}%)` }],
    y:       () => [{ transform: `translateY(${a.de ?? 0}%)` }, { transform: `translateY(${a.a ?? -10}%)` }],
    rot:     () => [{ transform: `rotate(${a.de ?? 0}deg)` }, { transform: `rotate(${a.a ?? 20}deg)` }],
    forme:   () => [{ borderRadius: a.de || '50%' }, { borderRadius: a.a || '30% 70% 60% 40% / 60% 30% 70% 40%' }],
    teinte:  () => [{ filter: `hue-rotate(${a.de ?? 0}deg)` }, { filter: `hue-rotate(${a.a ?? 60}deg)` }],
    couleur: () => [{ backgroundColor: a.de ?? '#6e2c2b' }, { backgroundColor: a.a ?? '#2a0f10' }],
  };
  const mk = F[a.prop];
  if (!mk) return { frames: null };
  const transform = ['echelle', 'x', 'y', 'rot'].includes(a.prop);
  return { frames: mk(), opts: { duration: (a.duree ?? 1.5) * 1000, iterations: Infinity,
    direction: a.allerRetour === false ? 'normal' : 'alternate',
    easing: a.easing ?? 'ease-in-out', ...(transform ? { composite: 'add' } : {}) } };
}

// Lance les animations de tous les sprites d'un conteneur (idempotent par élément).
// À appeler après avoir (re)rempli le DOM : besace, marchand, figures, aperçus.
export function animerSprites(root) {
  for (const el of root?.querySelectorAll?.('[data-anim]') ?? []) {
    if (el._anime) continue;
    el._anime = true;
    let specs;
    try { specs = JSON.parse(decodeURIComponent(el.dataset.anim)); } catch { continue; }
    for (const a of specs) {
      const { frames, opts } = _animFrames(a);
      if (frames) try { el.animate(frames, opts); } catch {}
    }
  }
}
