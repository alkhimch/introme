import { useEffect, useRef } from 'react'
import { developer, guestbook, hobbies, profile } from '../content'

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
            {e.summary && <p>{e.summary}</p>}
          </li>
        ))}
      </ol>
      <ul className="chips">{developer.skills.map((s) => <li key={s}>{s}</li>)}</ul>
      <h3>Education</h3>
      {developer.education.map((e) => (
        <p key={e.title} className="edu"><strong>{e.title}</strong><br />{e.detail} · {e.period}</p>
      ))}
      {developer.honors.length > 0 && (
        <>
          <h3>Honors</h3>
          <ul className="plain">{developer.honors.map((h) => <li key={h}>{h}</li>)}</ul>
        </>
      )}
      <a className="link" href={profile.links.linkedin} target="_blank" rel="noreferrer">Full experience on LinkedIn ↗</a>
    </>
  )
}

function HobbiesPanel() {
  return (
    <>
      <p className="eyebrow">02 — Off the clock</p>
      <h2>Hobbies</h2>
      <ul className="hobbies">
        {hobbies.map((h) => (
          <li key={h.name}>
            <strong>{h.name}</strong>
            <span>{h.text}</span>
          </li>
        ))}
      </ul>
      <p className="note">Push the football into the goal, or knock the basketball around the court.</p>
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
      {profile.email && <p className="note email"><a href={`mailto:${profile.email}`}>{profile.email}</a></p>}
    </>
  )
}

// giscus (GitHub Discussions) comments, once the repo has Discussions switched on.
function Giscus() {
  const box = useRef()
  useEffect(() => {
    const el = box.current
    const s = document.createElement('script')
    s.src = 'https://giscus.app/client.js'
    s.async = true
    s.crossOrigin = 'anonymous'
    Object.entries({
      repo: guestbook.repo, 'repo-id': guestbook.repoId, category: guestbook.category, 'category-id': guestbook.categoryId,
      mapping: 'specific', term: 'Guestbook', strict: '0', 'reactions-enabled': '1', 'emit-metadata': '0',
      'input-position': 'top', theme: 'light', lang: 'en', loading: 'lazy',
    }).forEach(([k, v]) => s.setAttribute(`data-${k}`, v))
    el.appendChild(s)
    return () => { el.innerHTML = '' }
  }, [])
  return <div ref={box} className="giscus-box" />
}

function GuestbookPanel() {
  const ready = Boolean(guestbook.categoryId)
  return (
    <>
      <p className="eyebrow">Guestbook</p>
      <h2>Leave a note.</h2>
      {ready ? (
        <>
          <p>Thanks for driving by! Sign in with GitHub to leave a message.</p>
          <Giscus />
        </>
      ) : (
        <>
          <p>Thanks for driving all the way out here! The guestbook is being set up — until then, I'd love to hear from you directly.</p>
          <div className="cta-row">
            <a className="btn primary" href={profile.links.linkedin} target="_blank" rel="noreferrer">Message me on LinkedIn</a>
            {profile.email && <a className="btn" href={`mailto:${profile.email}`}>Email</a>}
          </div>
        </>
      )}
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
            {zone === 'hobbies' && <HobbiesPanel />}
            {zone === 'photos' && <Photos photos={photos} onOpenPhoto={onOpenPhoto} />}
            {zone === 'contact' && <Contact />}
            {zone === 'guestbook' && <GuestbookPanel />}
          </div>
        </>
      )}
    </aside>
  )
}
