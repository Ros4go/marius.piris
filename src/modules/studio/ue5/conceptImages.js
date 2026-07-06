// Vraies images d'Unreal Engine (captures éditeur / miniatures de tutos réels),
// mappées par concept. Toutes hotlinkables et vérifiées (200 + type image).
// Aucune n'est un schéma : le but est de reconnaître les vrais éléments du moteur.
// L'ordre compte : la 1re règle dont un mot-clé matche (mot entier) gagne.

const yt = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`
const ytLink = (id) => `https://www.youtube.com/watch?v=${id}`

export const CONCEPT_IMAGES = [
  // --- Signaux / communication ---
  { k: ['event dispatcher', 'dispatcher', 'broadcast', 'observateur', 's\'abonner', 'bind event'],
    url: yt('5GYsTTcGGJo'), caption: 'Event Dispatchers (Bind / Broadcast) dans l\'éditeur', credit: 'Buvesa · YouTube', link: ytLink('5GYsTTcGGJo') },

  // --- IA ---
  { k: ['behavior tree', 'blackboard', 'selector', 'sequence', 'decorator', 'service', 'ai controller', 'behaviour tree'],
    url: yt('QJuaB2V79mU'), caption: 'Behavior Tree & Blackboard dans l\'éditeur', credit: 'Gorka Games · YouTube', link: ytLink('QJuaB2V79mU') },

  // --- Animation ---
  { k: ['state machine', 'anim graph', 'animation blueprint', 'transition d\'anim', 'animbp'],
    url: yt('etRZu5UG_S0'), caption: 'Animation Blueprint & State Machine', credit: 'Ryan Laley · YouTube', link: ytLink('etRZu5UG_S0') },
  { k: ['blend space', 'blendspace', 'aim offset'],
    url: yt('0Ab_MeAh6_k'), caption: 'Blend Space (mélange d\'animations)', credit: 'Ryan Laley · YouTube', link: ytLink('0Ab_MeAh6_k') },

  // --- Widgets / UMG ---
  { k: ['animer', 'animation umg', 'widget animation', 'timeline umg', 'séquenceur'],
    url: yt('SD66UgyHiMM'), caption: 'Animer un Widget UMG', credit: 'YouTube', link: ytLink('SD66UgyHiMM') },
  { k: ['common ui'],
    url: yt('4Z0fKE-HaA0'), caption: 'Common UI (interfaces avancées)', credit: 'YouTube', link: ytLink('4Z0fKE-HaA0') },
  { k: ['canvas panel', 'ancre', 'ancres', 'anchor', 'anchors', 'alignment'],
    url: yt('u4tfL6UpRWE'), caption: 'Canvas Panel & ancres dans le Designer UMG', credit: 'Ryan Laley · YouTube', link: ytLink('u4tfL6UpRWE') },
  { k: ['barre de vie', 'health bar', 'progress bar', 'create widget', 'add to viewport', 'hud'],
    url: yt('RdGWzXk_9n0'), caption: 'Créer une barre de vie (Create Widget / Add to Viewport)', credit: 'Maimute · YouTube', link: ytLink('RdGWzXk_9n0') },
  { k: ['widget', 'umg', 'canvas', 'panel', 'slot', 'z-order', 'binding'],
    url: yt('u4tfL6UpRWE'), caption: 'Le Designer UMG dans l\'éditeur', credit: 'Ryan Laley · YouTube', link: ytLink('u4tfL6UpRWE') },

  // --- Events / input ---
  { k: ['enhanced input', 'input action', 'mapping context', 'input modifier', 'trigger state'],
    url: yt('j53dLKWihE0'), caption: 'Enhanced Input (Input Actions & Mapping Contexts)', credit: 'YouTube', link: ytLink('j53dLKWihE0') },
  { k: ['event tick', 'begin play', 'beginplay', 'overlap', 'custom event'],
    url: yt('4AUR78-56jk'), caption: 'Event Begin Play & Event Tick', credit: 'YouTube', link: ytLink('4AUR78-56jk') },

  // --- Fonctions ---
  { k: ['pure', 'impure', 'getter'],
    url: yt('U5gnrHWm1d0'), caption: 'Fonctions pure vs impure', credit: 'YouTube', link: ytLink('U5gnrHWm1d0') },

  // --- Variables & types ---
  { k: ['type de variable', 'types de variable', 'float', 'real', 'boolean', 'integer', 'vector', 'rotator', 'variable'],
    url: yt('oKGJECvQJA8'), caption: 'Les variables et leurs types (couleurs des broches)', credit: 'YouTube', link: ytLink('oKGJECvQJA8') },

  // --- Blueprint / Event Graph (capture propre) ---
  { k: ['event graph', 'node', 'nœud', 'noeud', 'broche', 'pin', 'cast', 'branch', 'blueprint'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Ue_bp.png', caption: 'Un Event Graph de Blueprint (nœuds et broches)', credit: 'Wikimedia Commons · CC BY-SA', link: 'https://commons.wikimedia.org/wiki/File:Ue_bp.png' },

  // --- Éditeur / découverte ---
  { k: ['viewport', 'outliner', 'content browser', 'content drawer', 'details panel', 'interface', 'éditeur', 'actor', 'place actor'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Ue_ss.png', caption: 'L\'interface de l\'éditeur Unreal Engine', credit: 'Wikimedia Commons · CC BY-SA', link: 'https://commons.wikimedia.org/wiki/File:Ue_ss.png' },
  { k: ['epic games launcher', 'bibliothèque', 'projet', 'template', 'installer', 'moteur'],
    url: yt('k-zMkzmduqI'), caption: 'Prise en main d\'UE5 (launcher, projet, éditeur)', credit: 'Unreal Sensei · YouTube', link: ytLink('k-zMkzmduqI') },
]

// Match "mot entier" (évite que "Unreal" attrape "real").
const isWord = (c) => c != null && /[a-z0-9àâäçéèêëîïôöùûü]/i.test(c)
function containsWord(hay, needle) {
  let from = 0
  while (true) {
    const i = hay.indexOf(needle, from)
    if (i < 0) return false
    if (!isWord(hay[i - 1]) && !isWord(hay[i + needle.length])) return true
    from = i + 1
  }
}

// Renvoie la 1re image dont un mot-clé apparaît (mot entier) dans `text`, sinon null.
export function imageFor(text) {
  const low = ' ' + String(text || '').toLowerCase() + ' '
  for (const im of CONCEPT_IMAGES) {
    if (im.k.some((kw) => containsWord(low, kw))) return im
  }
  return null
}
