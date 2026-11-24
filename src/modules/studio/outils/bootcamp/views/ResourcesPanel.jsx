import { KIND_ICON, KIND_LABEL } from '../helpers.jsx'

// Panneau ressources : images hotlinkées (onError masque une image cassée) + liens communautaires
export default function ResourcesPanel({ images = [], links = [] }) {
  return (
    <div className="bc-res">
      {images.length > 0 && (
        <div className="bc-res-imgs">
          {images.map((im, i) => (
            <a className="bc-res-img" key={i} href={im.link || im.url} target="_blank" rel="noopener noreferrer">
              <img
                src={im.url}
                alt={im.caption || 'illustration'}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => { const w = e.currentTarget.closest('.bc-res-img'); if (w) w.style.display = 'none' }}
              />
              {(im.caption || im.credit) && (
                <span className="cap">{im.caption}{im.credit ? ` — ${im.credit}` : ''}</span>
              )}
            </a>
          ))}
        </div>
      )}
      {links.length > 0 && (
        <div className="bc-res-links">
          {links.map((l, i) => (
            <a className={'bc-reslink ' + (l.kind || 'doc')} key={i} href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}>
              <span className="ic">{KIND_ICON[l.kind] || '🔗'}</span>
              <span className="lab">{l.label}</span>
              <span className="knd">{KIND_LABEL[l.kind] || 'Lien'}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
