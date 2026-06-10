import { useEffect, useState } from 'react'

// Minimal hash router (no dependency). Works on GitHub Pages with no 404 shim.
// Path is everything after '#', always starting with '/'. Default route is '/'.

export function currentPath() {
  const h = window.location.hash.replace(/^#/, '')
  return h.startsWith('/') ? h : '/'
}

export function navigate(path) {
  if (!path.startsWith('/')) path = '/' + path
  if (currentPath() === path) return
  window.location.hash = path
}

export function useRoute() {
  const [path, setPath] = useState(currentPath())
  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return path
}

// Split a route into clean segments: '/jeux/frometons' -> ['jeux', 'frometons']
export function segments(path) {
  return path.split('/').filter(Boolean)
}
