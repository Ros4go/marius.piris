// Fond Persona animé, réutilisable : barres rouges qui balaient + trame qui dérive
// + filigrane vertical. Full-bleed (casse le padding du conteneur via CSS).
// Le parent doit être en position:relative ; le contenu au-dessus en z-index >= 1.
export default function PersonaBg({ label }) {
  return (
    <div className="persona-bg" aria-hidden="true">
      <span className="persona-bar b1" />
      <span className="persona-bar b2" />
      {label && <span className="persona-wm">{label}</span>}
    </div>
  )
}
