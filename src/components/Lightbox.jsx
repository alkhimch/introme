import { useEffect } from 'react'

export default function Lightbox({ photos, index, onClose, onNav }) {
  useEffect(() => {
    if (index == null) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') onNav(1)
      if (e.key === 'ArrowLeft') onNav(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onClose, onNav])

  if (index == null) return null
  const p = photos[index]
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={p.title} onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={p.url} alt={p.title} />
        <figcaption>
          <button aria-label="Previous photo" onClick={() => onNav(-1)}>←</button>
          <span>{p.title}</span>
          <button aria-label="Next photo" onClick={() => onNav(1)}>→</button>
        </figcaption>
      </figure>
      <button className="lightbox-close" aria-label="Close" onClick={onClose}>×</button>
    </div>
  )
}
