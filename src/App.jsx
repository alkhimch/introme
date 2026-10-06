import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { photos, profile } from './content'
import { usePhotoSources } from './photos'
import Lightbox from './components/Lightbox'
import Panel from './components/Panel'
import TouchControls from './components/TouchControls'
import useKeyboard from './components/useKeyboard'
import { commands, setStarted, useStarted, useZone } from './world/store'

const World = lazy(() => import('./world/World'))

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const isMobile = typeof window !== 'undefined' && window.innerWidth < 760

const MENU = [
  { id: 'work', label: 'Developer' },
  { id: 'math', label: 'Math' },
  { id: 'photos', label: 'Photos' },
  { id: 'contact', label: 'Contact' },
]

export default function App() {
  const sources = usePhotoSources(photos)
  const started = useStarted()
  const zone = useZone()
  const [dismissed, setDismissed] = useState(null)
  const [open, setOpen] = useState(null)

  const start = useCallback(() => setStarted(), [])
  useKeyboard(start)

  // Re-show a panel whenever the van enters a different zone.
  useEffect(() => { if (zone !== dismissed) setDismissed(null) }, [zone, dismissed])

  const closeLightbox = useCallback(() => setOpen(null), [])
  const nav = useCallback((d) => setOpen((i) => (i + d + sources.length) % sources.length), [sources.length])
  const teleport = (id) => { commands.teleport = id; setStarted() }

  return (
    <>
      <Suspense fallback={<div className="loading">Loading the steppe…</div>}>
        <World photos={sources} onOpenPhoto={setOpen} mobile={isMobile} />
      </Suspense>

      <header className="hud-top">
        <button className="logo" onClick={() => { commands.resetCount++ }} title="Back to start">alkhimch</button>
        <nav aria-label="Jump to">
          {MENU.map((m) => (
            <button key={m.id} className={zone === m.id ? 'active' : ''} onClick={() => teleport(m.id)}>{m.label}</button>
          ))}
          <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="nav-cta">LinkedIn ↗</a>
        </nav>
      </header>

      <Panel zone={zone && zone !== dismissed ? zone : null} onClose={() => setDismissed(zone)} photos={sources} onOpenPhoto={setOpen} />

      {started && !isTouch && (
        <div className="hint" aria-hidden="true">
          <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows to drive · <kbd>Space</kbd> brake · <kbd>R</kbd> reset
        </div>
      )}
      {started && isTouch && <TouchControls />}

      <div className={'intro' + (started ? ' gone' : '')} aria-hidden={started}>
        <div className="intro-card">
          <p className="intro-iam">I am</p>
          <h1>{profile.firstName} <span>{profile.lastName}</span></h1>
          <p className="intro-roles">Developer · Mathematician · Photographer</p>
          <p className="intro-text">Hop in the Purgon and drive across the Mongolian steppe to explore my work.</p>
          <button className="btn primary" onClick={start}>Start driving</button>
          <p className="intro-small">{isTouch ? 'Use the on-screen pedals to drive.' : 'WASD or arrow keys · or use the menu above.'}</p>
        </div>
      </div>

      <Lightbox photos={sources} index={open} onClose={closeLightbox} onNav={nav} />
    </>
  )
}
