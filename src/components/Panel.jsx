import { developer, math, profile } from '../content'

function Work() {
  return (
    <>
      <p className="eyebrow">01 — Developer</p>
      <h2>Building software, end to end.</h2>
      <p>{developer.about}</p>
      <ol className="timeline">
        {developer.experience.map((e, i) => (
          <li key={i}>
            <div className="tl-head"><strong>{e.role}</strong><span>{e.period}</span></div>
            <div className="tl-company">{e.company}</div>
            <p>{e.summary}</p>
          </li>
        ))}
      </ol>
      <ul className="chips">{developer.skills.map((s) => <li key={s}>{s}</li>)}</ul>
      <a className="link" href={profile.links.linkedin} target="_blank" rel="noreferrer">Full experience on LinkedIn ↗</a>
    </>
  )
}

function MathPanel() {
  return (
    <>
      <p className="eyebrow">02 — Mathematician</p>
      <h2>{math.heading}</h2>
      <p>{math.text}</p>
      <div className="equations" aria-label="Lorenz equations">
        <div>dx/dt = σ (y − x)</div>
        <div>dy/dt = x (ρ − z) − y</div>
        <div>dz/dt = x y − β z</div>
        <small>σ = 10 · ρ = 28 · β = 8⁄3</small>
      </div>
      <p className="note">The stones on the ground follow the golden angle (137.5°) — the same spiral as sunflower seeds.</p>
    </>
  )
}

function Photos({ photos, onOpenPhoto }) {
  return (
    <>
      <p className="eyebrow">03 — Photographer</p>
      <h2>Through the lens.</h2>
      <p>Click a frame in the field, or pick one here.</p>
      <div className="thumbs">
        {photos.map((p, i) => (
          <button key={i} onClick={() => onOpenPhoto(i)} aria-label={`Open ${p.title}`}>
            <img src={p.url} alt="" loading="lazy" />
            <span>{p.title}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function Contact() {
  return (
    <>
      <p className="eyebrow">04 — Contact</p>
      <h2>Let’s build something.</h2>
      <p>You made it to the ovoo. Walk around it three times clockwise — then say hello.</p>
      <div className="cta-row">
        <a className="btn primary" href={profile.links.linkedin} target="_blank" rel="noreferrer">Connect on LinkedIn</a>
        <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
      </div>
    </>
  )
}

export default function Panel({ zone, onClose, photos, onOpenPhoto }) {
  return (
    <aside className={'panel' + (zone ? ' open' : '')} aria-live="polite" aria-hidden={!zone}>
      {zone && (
        <>
          <button className="panel-close" aria-label="Close panel" onClick={onClose}>×</button>
          <div className="panel-body">
            {zone === 'work' && <Work />}
            {zone === 'math' && <MathPanel />}
            {zone === 'photos' && <Photos photos={photos} onOpenPhoto={onOpenPhoto} />}
            {zone === 'contact' && <Contact />}
          </div>
        </>
      )}
    </aside>
  )
}
