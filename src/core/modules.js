import Studio from '../modules/studio/Studio.jsx'
import Portfolio from '../modules/portfolio/Portfolio.jsx'
import Contact from '../modules/contact/Contact.jsx'

// THE MODULE REGISTRY — single source of truth for the launcher menu + routes.
//
// To add a new facet of the site later, add ONE entry here:
//   - internal page:   { kind: 'route', path: '/xxx', component: MyComp }
//   - standalone page: { kind: 'external', href: '/xxx.html' }
// (For a new game/tool, just add it to the CATALOG inside Studio.jsx instead.)
//
// `group`:  'module'  -> highlighted as a primary module in the launcher
//           'about'   -> shown smaller, in the secondary row (CV / contact)
// `aoa` (all-out attack) toggles the red splash flavour on selection.

export const modules = [
  // --- Modules (the point of the site) ---
  { id: 'studio', num: '01', label: 'Jeux & Outils', en: 'ARCADE & ATELIER', kind: 'route', path: '/studio', component: Studio, group: 'module' },
  { id: 'jdr', num: '02', label: 'Archipelago', en: 'JDR · WIKI', kind: 'external', href: '/archipelago.html', group: 'module' },
  // --- À propos (the CV is just one part) ---
  { id: 'portfolio', num: '03', label: 'Profil', en: 'CV · RÉSUMÉ', kind: 'route', path: '/portfolio', component: Portfolio, group: 'about' },
  { id: 'contact', num: '04', label: 'Contact', en: 'ME JOINDRE', kind: 'route', path: '/contact', component: Contact, group: 'about', aoa: true },
]

// Find the route module that owns a given path (supports sub-routes like /studio/frometons).
export function moduleForPath(path) {
  return modules.find(
    (m) => m.kind === 'route' && (path === m.path || path.startsWith(m.path + '/'))
  )
}
