// Diagrammes SVG brandés (Persona) — fiables, jamais cassés, on-brand.
// Chacun illustre un concept clé d'un chapitre. Couleurs : rouge #ec0016,
// crème #fdf6ee, or #ffb300, exec-pins blancs, data-pins colorés (comme UE).

const RED = '#ec0016'
const CREAM = '#fdf6ee'
const INK = '#181413'
const GOLD = '#ffb300'
const GREY = '#8a8784'

function Wrap({ caption, children, viewBox }) {
  return (
    <div className="ue5-diagram">
      <svg viewBox={viewBox} role="img" aria-label={caption}>{children}</svg>
      <div className="cap">{caption}</div>
    </div>
  )
}

// 1) Anatomie d'un node Blueprint : exec pins (triangles blancs) + data pins (ronds colorés)
export function NodeAnatomy() {
  return (
    <Wrap caption="Anatomie d'un nœud Blueprint — exec (blanc, ▷) vs data (rond coloré)" viewBox="0 0 520 220">
      {/* node body */}
      <rect x="150" y="40" width="220" height="140" rx="7" fill={INK} stroke={RED} strokeWidth="2" />
      <rect x="150" y="40" width="220" height="30" rx="7" fill={RED} />
      <rect x="150" y="60" width="220" height="10" fill={RED} />
      <text x="260" y="61" fill="#fff" fontFamily="Oswald, sans-serif" fontSize="15" fontWeight="700" textAnchor="middle">Set Health</text>
      {/* exec in */}
      <path d="M150 88 l-16 0 l0 -8 l10 0 l6 6 l-6 6 l-10 0 l0 -4" fill="#fff" />
      <path d="M138 82 l8 6 l-8 6 z" fill="#fff" />
      <text x="128" y="86" fill={CREAM} fontFamily="Inter" fontSize="10" textAnchor="end">exec ▸ entrée</text>
      {/* exec out */}
      <path d="M370 82 l8 6 l-8 6 z" fill="#fff" />
      <text x="392" y="86" fill={CREAM} fontFamily="Inter" fontSize="10">exec ▸ sortie</text>
      {/* data in : Target (bleu), New Value (vert) */}
      <circle cx="150" cy="120" r="6" fill="#3aa0ff" />
      <text x="128" y="124" fill="#9fd0ff" fontFamily="Inter" fontSize="10" textAnchor="end">Target (objet)</text>
      <circle cx="150" cy="150" r="6" fill="#61d36f" />
      <text x="128" y="154" fill="#a8e6b0" fontFamily="Inter" fontSize="10" textAnchor="end">New Value (float)</text>
      {/* data out */}
      <circle cx="370" cy="130" r="6" fill="#61d36f" />
      <text x="392" y="134" fill="#a8e6b0" fontFamily="Inter" fontSize="10">Return</text>
      {/* wires */}
      <path d="M60 88 H134" stroke="#fff" strokeWidth="2.5" fill="none" />
      <path d="M378 88 H470" stroke="#fff" strokeWidth="2.5" fill="none" />
      <path d="M70 120 C110 120 120 120 150 120" stroke="#3aa0ff" strokeWidth="2.5" fill="none" />
      <text x="40" y="92" fill={GREY} fontFamily="Inter" fontSize="9">flux</text>
    </Wrap>
  )
}

// 2) Flux d'exécution : les events déclenchent une chaîne exec gauche→droite
export function ExecFlow() {
  const box = (x, label, fill) => (
    <g>
      <rect x={x} y="55" width="120" height="46" rx="6" fill={INK} stroke={fill} strokeWidth="2" />
      <rect x={x} y="55" width="120" height="18" rx="6" fill={fill} />
      <text x={x + 60} y="68" fill="#0a0908" fontFamily="Oswald" fontSize="11" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
  return (
    <Wrap caption="Un Event lance une chaîne d'exécution (fil blanc) de gauche à droite" viewBox="0 0 520 150">
      {box(20, 'Event BeginPlay', RED)}
      <text x="80" y="94" fill={CREAM} fontFamily="Inter" fontSize="9" textAnchor="middle">déclencheur</text>
      {box(200, 'Print String', CREAM)}
      {box(380, 'Set Variable', CREAM)}
      <path d="M140 78 H200" stroke="#fff" strokeWidth="3" markerEnd="url(#ar)" fill="none" />
      <path d="M320 78 H380" stroke="#fff" strokeWidth="3" markerEnd="url(#ar)" fill="none" />
      <defs>
        <marker id="ar" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#fff" /></marker>
      </defs>
    </Wrap>
  )
}

// 3) Event Dispatcher / Signal : 1 émetteur broadcast → N abonnés (bind)
export function DispatcherFlow() {
  return (
    <Wrap caption="Event Dispatcher (signal) : l'émetteur fait Call/Broadcast, les abonnés réagissent (Bind)" viewBox="0 0 520 240">
      {/* emitter */}
      <rect x="30" y="90" width="150" height="60" rx="8" fill={INK} stroke={RED} strokeWidth="2.5" />
      <text x="105" y="115" fill={CREAM} fontFamily="Oswald" fontSize="13" fontWeight="700" textAnchor="middle">Piège (émetteur)</text>
      <text x="105" y="134" fill={RED} fontFamily="Inter" fontSize="11" textAnchor="middle">Call OnTrigger ▶</text>
      {/* subscribers */}
      {[[350, 30, 'Player', '#3aa0ff'], [350, 105, 'Barre de vie', GOLD], [350, 180, 'Son / VFX', '#61d36f']].map(([x, y, label, c], i) => (
        <g key={i}>
          <rect x={x} y={y} width="150" height="46" rx="8" fill={INK} stroke={c} strokeWidth="2" />
          <text x={x + 75} y={y + 20} fill={CREAM} fontFamily="Oswald" fontSize="12" fontWeight="700" textAnchor="middle">{label}</text>
          <text x={x + 75} y={y + 37} fill={c} fontFamily="Inter" fontSize="10" textAnchor="middle">Bind Event ◀</text>
          <path d={`M180 120 C 260 120, 270 ${y + 23}, ${x} ${y + 23}`} stroke={RED} strokeWidth="2" fill="none" strokeDasharray="5 4" />
        </g>
      ))}
      <text x="255" y="20" fill={GREY} fontFamily="Inter" fontSize="10" textAnchor="middle">1 signal → N abonnés (couplage faible)</text>
    </Wrap>
  )
}

// 4) Communication entre Blueprints : 4 méthodes
export function CommMethods() {
  const row = (y, name, desc, c) => (
    <g>
      <rect x="20" y={y} width="150" height="40" rx="6" fill={INK} stroke={c} strokeWidth="2" />
      <text x="95" y={y + 25} fill={CREAM} fontFamily="Oswald" fontSize="12" fontWeight="700" textAnchor="middle">{name}</text>
      <text x="185" y={y + 25} fill="#cfc9c1" fontFamily="Inter" fontSize="11">{desc}</text>
    </g>
  )
  return (
    <Wrap caption="Les 4 façons de faire communiquer des Blueprints" viewBox="0 0 520 240">
      {row(15, 'Direct / Réf.', 'référence connue → simple, mais couplage fort', '#3aa0ff')}
      {row(65, 'Cast To', 'convertir vers un type précis pour accéder à ses membres', GOLD)}
      {row(115, 'Interface', 'contrat commun → pas besoin de connaître le type exact', '#61d36f')}
      {row(165, 'Event Dispatcher', 'signal broadcast → N abonnés, couplage faible', RED)}
    </Wrap>
  )
}

// 5) Hiérarchie Widget (UMG)
export function WidgetTree() {
  const node = (x, y, w, label, c) => (
    <g>
      <rect x={x} y={y} width={w} height="34" rx="5" fill={INK} stroke={c} strokeWidth="2" />
      <text x={x + w / 2} y={y + 22} fill={CREAM} fontFamily="Oswald" fontSize="12" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
  return (
    <Wrap caption="Hiérarchie d'un Widget UMG : un Panel contient des enfants" viewBox="0 0 520 230">
      {node(180, 12, 160, 'Canvas Panel', RED)}
      <path d="M260 46 V70 H120 V92" stroke={GREY} strokeWidth="1.5" fill="none" />
      <path d="M260 46 V70 H400 V92" stroke={GREY} strokeWidth="1.5" fill="none" />
      {node(50, 92, 140, 'Vertical Box', GOLD)}
      {node(340, 92, 140, 'Image (fond)', '#3aa0ff')}
      <path d="M120 126 V150 H70 V172" stroke={GREY} strokeWidth="1.5" fill="none" />
      <path d="M120 126 V150 H180 V172" stroke={GREY} strokeWidth="1.5" fill="none" />
      {node(20, 172, 100, 'Text (score)', '#61d36f')}
      {node(150, 172, 110, 'Button (jouer)', '#61d36f')}
    </Wrap>
  )
}

// 6) Ancres (Anchors) — s'adaptent à la résolution
export function AnchorsDiagram() {
  return (
    <Wrap caption="Les ancres (Anchors) fixent un widget par rapport aux bords → adaptation multi-résolution" viewBox="0 0 520 220">
      <rect x="30" y="20" width="460" height="180" rx="6" fill="#0c0a09" stroke={GREY} strokeWidth="1.5" />
      {/* corner anchored HUD */}
      <rect x="40" y="30" width="90" height="30" rx="4" fill={INK} stroke={RED} strokeWidth="2" />
      <text x="85" y="49" fill={CREAM} fontFamily="Inter" fontSize="10" textAnchor="middle">Vie (haut-G)</text>
      <circle cx="40" cy="30" r="4" fill={GOLD} />
      {/* bottom right */}
      <rect x="390" y="160" width="90" height="30" rx="4" fill={INK} stroke={RED} strokeWidth="2" />
      <text x="435" y="179" fill={CREAM} fontFamily="Inter" fontSize="10" textAnchor="middle">Mini-map</text>
      <circle cx="480" cy="190" r="4" fill={GOLD} />
      {/* centered */}
      <rect x="215" y="95" width="90" height="30" rx="4" fill={INK} stroke={RED} strokeWidth="2" />
      <text x="260" y="114" fill={CREAM} fontFamily="Inter" fontSize="10" textAnchor="middle">Crosshair</text>
      <circle cx="260" cy="110" r="4" fill={GOLD} />
      <text x="260" y="212" fill={GREY} fontFamily="Inter" fontSize="9" textAnchor="middle">● = point d'ancrage</text>
    </Wrap>
  )
}

// 7) Behavior Tree (IA)
export function BehaviorTree() {
  const node = (x, y, w, label, c, sub) => (
    <g>
      <rect x={x} y={y} width={w} height={sub ? 40 : 30} rx="5" fill={INK} stroke={c} strokeWidth="2" />
      <text x={x + w / 2} y={y + 19} fill={CREAM} fontFamily="Oswald" fontSize="12" fontWeight="700" textAnchor="middle">{label}</text>
      {sub && <text x={x + w / 2} y={y + 33} fill={c} fontFamily="Inter" fontSize="9" textAnchor="middle">{sub}</text>}
    </g>
  )
  return (
    <Wrap caption="Behavior Tree : Root → Composite (Selector/Sequence) → Tasks, cadencé par le Blackboard" viewBox="0 0 520 240">
      {node(210, 10, 100, 'ROOT', RED)}
      <path d="M260 40 V60 H260 V78" stroke={GREY} strokeWidth="1.5" fill="none" />
      {node(190, 78, 140, 'Selector', GOLD, '? choisit 1 branche')}
      <path d="M260 118 V138 H120 V158" stroke={GREY} strokeWidth="1.5" fill="none" />
      <path d="M260 118 V138 H400 V158" stroke={GREY} strokeWidth="1.5" fill="none" />
      {node(50, 158, 140, 'Sequence', '#3aa0ff', '→ tout dans l’ordre')}
      {node(330, 158, 140, 'Task: Patrol', '#61d36f')}
      <path d="M120 198 V214 H70 V214" stroke={GREY} strokeWidth="1.5" fill="none" />
      {node(20, 210, 100, 'MoveTo', '#61d36f')}
      {node(140, 210, 100, 'Attack', '#61d36f')}
    </Wrap>
  )
}

// 8) Fonction pure vs impure
export function PureImpure() {
  return (
    <Wrap caption="Fonction pure (pas de pins exec, verte) vs impure (avec pins exec, bleue)" viewBox="0 0 520 170">
      {/* pure */}
      <rect x="40" y="45" width="160" height="70" rx="7" fill={INK} stroke="#61d36f" strokeWidth="2.5" />
      <rect x="40" y="45" width="160" height="22" rx="7" fill="#2f8f43" />
      <text x="120" y="61" fill="#fff" fontFamily="Oswald" fontSize="12" fontWeight="700" textAnchor="middle">Get Ammo (pure)</text>
      <circle cx="200" cy="92" r="6" fill="#61d36f" />
      <text x="120" y="135" fill="#a8e6b0" fontFamily="Inter" fontSize="10" textAnchor="middle">aucun fil blanc — lit une valeur</text>
      {/* impure */}
      <rect x="320" y="45" width="160" height="70" rx="7" fill={INK} stroke="#3aa0ff" strokeWidth="2.5" />
      <rect x="320" y="45" width="160" height="22" rx="7" fill="#1f6fb0" />
      <text x="400" y="61" fill="#fff" fontFamily="Oswald" fontSize="12" fontWeight="700" textAnchor="middle">Fire (impure)</text>
      <path d="M312 84 l8 6 l-8 6 z" fill="#fff" />
      <path d="M488 84 l8 6 l-8 6 z" fill="#fff" />
      <text x="400" y="135" fill="#9fd0ff" fontFamily="Inter" fontSize="10" textAnchor="middle">fils blancs — modifie l'état</text>
    </Wrap>
  )
}

// 9) Couleurs des types de variables / broches de données
export function PinTypes() {
  const types = [
    ['Boolean', '#8c1c1c'], ['Integer', '#1f9e8f'], ['Float / Real', '#7ee06a'],
    ['String', '#d13b9a'], ['Vector', '#f5c542'], ['Rotator', '#8f7be0'],
    ['Transform', '#e8863a'], ['Object', '#3a7bff'], ['Exec (flux)', '#ffffff'],
  ]
  return (
    <Wrap caption="Chaque type de variable a sa couleur de broche (data) ; l'exec est blanc" viewBox="0 0 520 200">
      {types.map((t, i) => {
        const x = 24 + (i % 3) * 168
        const y = 24 + Math.floor(i / 3) * 56
        const exec = t[0].startsWith('Exec')
        return (
          <g key={i}>
            {exec
              ? <path d={`M${x} ${y - 6} l12 6 l-12 6 z`} fill={t[1]} />
              : <circle cx={x + 6} cy={y} r="8" fill={t[1]} stroke="#0a0908" strokeWidth="1.5" />}
            <text x={x + 24} y={y + 4} fill={CREAM} fontFamily="Oswald, sans-serif" fontSize="14">{t[0]}</text>
          </g>
        )
      })}
    </Wrap>
  )
}

// 10) State Machine d'animation
export function StateMachine() {
  const st = (x, label, c) => (
    <g>
      <rect x={x} y="70" width="120" height="46" rx="23" fill={INK} stroke={c} strokeWidth="2.5" />
      <text x={x + 60} y="98" fill={CREAM} fontFamily="Oswald" fontSize="14" fontWeight="700" textAnchor="middle">{label}</text>
    </g>
  )
  return (
    <Wrap caption="State Machine : des états reliés par des règles de transition booléennes" viewBox="0 0 520 180">
      {st(30, 'Idle', GREY)}
      {st(200, 'Run', RED)}
      {st(370, 'Jump', GOLD)}
      <path d="M150 93 H200" stroke={CREAM} strokeWidth="2" markerEnd="url(#a2)" fill="none" />
      <path d="M320 93 H370" stroke={CREAM} strokeWidth="2" markerEnd="url(#a2)" fill="none" />
      <text x="175" y="84" fill={GREY} fontFamily="Inter" fontSize="9" textAnchor="middle">Speed &gt; 0</text>
      <text x="345" y="84" fill={GREY} fontFamily="Inter" fontSize="9" textAnchor="middle">Is Falling</text>
      <path d="M430 116 q30 40 -60 40 q-90 0 -240 -40" stroke={GREY} strokeWidth="1.6" strokeDasharray="5 4" fill="none" markerEnd="url(#a2)" />
      <text x="255" y="172" fill={GREY} fontFamily="Inter" fontSize="9" textAnchor="middle">landed / stop → retour</text>
      <defs><marker id="a2" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill={CREAM} /></marker></defs>
    </Wrap>
  )
}

// 11) NavMesh & pathfinding
export function NavMeshDiagram() {
  return (
    <Wrap caption="NavMesh : zone navigable (vert) où l'IA calcule un chemin (A*) en évitant les obstacles" viewBox="0 0 520 200">
      <rect x="20" y="20" width="480" height="160" rx="6" fill="#0c0a09" stroke={GREY} strokeWidth="1.5" />
      <path d="M40 40 H480 V160 H40 Z" fill="rgba(97,211,111,0.12)" stroke="rgba(97,211,111,0.5)" strokeWidth="1.5" />
      <rect x="210" y="60" width="90" height="80" rx="4" fill="#241012" stroke={RED} strokeWidth="2" />
      <text x="255" y="104" fill="#ff8f8f" fontFamily="Inter" fontSize="10" textAnchor="middle">obstacle</text>
      <circle cx="70" cy="150" r="9" fill="#3aa0ff" /><text x="70" y="176" fill="#9fd0ff" fontFamily="Inter" fontSize="10" textAnchor="middle">IA</text>
      <circle cx="450" cy="55" r="9" fill={GOLD} /><text x="450" y="80" fill="#ffce6b" fontFamily="Inter" fontSize="10" textAnchor="middle">cible</text>
      <path d="M70 150 C 130 150, 170 150, 190 120 C 205 96, 300 150, 330 120 C 380 80, 420 60, 450 55" stroke={GOLD} strokeWidth="2.5" fill="none" strokeDasharray="6 5" />
    </Wrap>
  )
}

// Mapping mot-clé → illustration (par ordre de priorité). Sert à illustrer une question/carte.
const ILLUS_RULES = [
  { k: ['dispatcher', 'broadcast', 'observateur', 'delegate', 'délégué', 's\'abonn', 'signal'], C: DispatcherFlow },
  { k: ['communication entre', 'direct/cast', 'les 4 méthodes', 'quelle méthode', 'cast to', 'blueprint interface'], C: CommMethods },
  { k: ['pure', 'impure', 'getter'], C: PureImpure },
  { k: ['ancre', 'anchor', 'résolution', 'responsive'], C: AnchorsDiagram },
  { k: ['canvas panel', 'hiérarchie de widget', 'panneau umg', 'vertical box', 'horizontal box', 'overlay'], C: WidgetTree },
  { k: ['behavior tree', 'selector', 'sequence', 'blackboard', 'decorator', 'service', 'task'], C: BehaviorTree },
  { k: ['navmesh', 'nav mesh', 'pathfinding', 'a*', 'move to', 'chemin'], C: NavMeshDiagram },
  { k: ['state machine', 'transition', 'idle', 'anim graph', 'blend space'], C: StateMachine },
  { k: ['type de variable', 'types de variable', 'couleur', 'broche', 'float', 'real', 'boolean', 'integer', 'vector', 'rotator'], C: PinTypes },
  { k: ['broche d\'exécution', 'pin d\'exéc', 'begin play', 'event tick', 'flux d\'exéc', 'chaîne d\'exéc'], C: ExecFlow },
  { k: ['anatomie', 'entrée et sortie du nœud', 'target', 'return value'], C: NodeAnatomy },
]

export function illustrationFor(text) {
  const low = String(text || '').toLowerCase()
  for (const r of ILLUS_RULES) {
    if (r.k.some((kw) => low.includes(kw))) return r.C
  }
  return null
}

// Mapping chapitre → diagramme(s) à insérer en tête des fiches
export const CHAPTER_DIAGRAMS = {
  'bp-bases': [NodeAnatomy],
  'events': [ExecFlow],
  'fonctions': [PureImpure],
  'widgets': [WidgetTree, AnchorsDiagram],
  'widgets-plus': [WidgetTree, AnchorsDiagram],
  'signaux': [DispatcherFlow, CommMethods],
  'ia': [BehaviorTree],
}
