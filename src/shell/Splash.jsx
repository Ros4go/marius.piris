// Persona cut-in shown briefly during a route transition.
export default function Splash({ label, aoa }) {
  return (
    <div className="splash" style={aoa ? { background: 'var(--red)' } : { background: '#111' }}>
      <div className="big" style={{ color: aoa ? 'var(--black)' : 'var(--red)' }}>
        {label}
      </div>
    </div>
  )
}
