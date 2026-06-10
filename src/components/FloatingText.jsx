import { useEffect } from 'react'

// Floating "+value" feedback used by the Frometons clicker.
export default function FloatingText({ id, value, isCritical, x, y, onAnimationEnd }) {
  useEffect(() => {
    const timer = setTimeout(() => onAnimationEnd(id), 1000) // matches CSS animation
    return () => clearTimeout(timer)
  }, [id, onAnimationEnd])

  return (
    <div
      style={{ left: '50%', top: '50%', '--x': `${x}px`, '--y': `${y}px` }}
      className={`absolute text-2xl font-bold whitespace-nowrap floating-text ${
        isCritical ? 'text-yellow-300 text-shadow-lg' : 'text-gray-200'
      }`}
    >
      +{value.toFixed(1)}
    </div>
  )
}
