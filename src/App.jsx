import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { developer, math, photos, profile } from './content'
import { updateSectionFromScroll, scrollState } from './three/state'
import { usePhotoSources } from './photos'
import Lightbox from './components/Lightbox'

const Scene = lazy(() => import('./three/Scene'))

function useScrollSync() {
  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = 0
      updateSectionFromScroll()
      // Darkroom safelight glow while the photo section is on screen.
      const glow = Math.max(0, 1 - Math.abs(scrollState.photosOffset) * 1.3)
      document.documentElement.style.setProperty('--safelight', glow.toFixed(3))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick) }
    tick()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
}

export default function App() {
  useScrollSync()
  const sources = usePhotoSources(photos)
  const [open, setOpen] = useState(null)
  const close = useCallback(() => setOpen(null), [])
  const nav = useCallback((d) => setOpen((i) => (i + d + sources.length) % sources.length), [sources.length])
  const year = new Date().getFullYear()

  return (
    <>
      <Suspense fallback={null}>
        <Scene photos={sources} onOpenPhoto={setOpen} />
      </Suspense>

      <header className="nav">
        <a href="#hero" className="logo">alkhimch</a>
        <nav>
          <a href="#work">Work</a>
          <a href="#math">Math</a>
          <a href="#photos">Photos</a>
          <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="nav-cta">LinkedIn ↗</a>
        </nav>
      </header>

      <main>
        <section id="hero" className="hero">
          <h1 className="sr-only">
            I am {profile.firstName} {profile.lastName} — developer, mathematician, photographer.
          </h1>
          <p className="hero-iam" aria-hidden="true">I am</p>
          <p className="hero-tagline">{profile.tagline}</p>
          <a href="#work" className="scroll-hint">Scroll</a>
        </section>

        <section id="work" className="panel left">
          <div className="card">
            <p className="eyebrow">01 — Developer</p>
            <h2>Building software, end to end.</h2>
            <p>{developer.about}</p>
            <ol className="timeline">
              {developer.experience.map((e, i) => (
                <li key={i}>
                  <div className="tl-head">
                    <strong>{e.role}</strong>
                    <span>{e.period}</span>
                  </div>
                  <div className="tl-company">{e.company}</div>
                  <p>{e.summary}</p>
                </li>
              ))}
            </ol>
            <ul className="chips">
              {developer.skills.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <a className="link" href={profile.links.linkedin} target="_blank" rel="noreferrer">Full experience on LinkedIn ↗</a>
          </div>
        </section>

        <section id="math" className="panel right">
          <div className="card">
            <p className="eyebrow">02 — Mathematician</p>
            <h2>{math.heading}</h2>
            <p>{math.text}</p>
            <div className="equations" aria-label="Lorenz equations">
              <div>dx/dt = σ (y − x)</div>
              <div>dy/dt = x (ρ − z) − y</div>
              <div>dz/dt = x y − β z</div>
              <small>σ = 10 · ρ = 28 · β = 8⁄3</small>
            </div>
          </div>
        </section>

        <section id="photos" className="panel photos">
          <div className="photos-head">
            <p className="eyebrow">03 — Photographer</p>
            <h2>Developed in the dark.</h2>
          </div>
          <p className="photos-foot">Tap a print to open it</p>
          {/* Accessible / no-WebGL fallback list */}
          <ul className="sr-only">
            {sources.map((p, i) => (
              <li key={i}><button onClick={() => setOpen(i)}>{p.title}</button></li>
            ))}
          </ul>
        </section>

        <section id="contact" className="panel contact">
          <div className="card center">
            <p className="eyebrow">04 — Contact</p>
            <h2 className="big">Let’s build something.</h2>
            <div className="cta-row">
              <a className="btn primary" href={profile.links.linkedin} target="_blank" rel="noreferrer">Connect on LinkedIn</a>
              <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </div>
          <footer>© {year} {profile.firstName} {profile.lastName} · {profile.location}</footer>
        </section>
      </main>

      <Lightbox photos={sources} index={open} onClose={close} onNav={nav} />
    </>
  )
}
