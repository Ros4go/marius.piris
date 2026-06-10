import { useRef, useState } from 'react'

// Hover tooltip used by the Frometons clicker upgrade/building cards.
export default function Tooltip({ children, content }) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setShow(true), 500)
  }
  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    setShow(false)
  }

  return (
    <div className="relative block w-full" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {show && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-700 rounded-md shadow-lg -top-2 left-1/2 -translate-x-1/2 transform -translate-y-full whitespace-nowrap opacity-0 animate-fade-in-tooltip">
          {content}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-gray-700 translate-y-full"></div>
        </div>
      )}
    </div>
  )
}
