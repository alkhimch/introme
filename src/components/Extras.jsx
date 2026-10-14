import { useEffect, useState } from 'react'
import { SHAGAI } from '../world/layout'
import { photoRequest, race, setPhotoMode, useBestRace, useFound, usePhotoMode, useRace } from '../world/store'
import { formatTime } from '../world/Race'

function RaceClock() {
  useRace()
  const [now, setNow] = useState(performance.now())
  useEffect(() => {
    if (!race.running) return
    let raf = 0
    const tick = () => { setNow(performance.now()); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [race.running])
  const best = useBestRace()
  if (race.running) return <span className="pill racing" aria-live="off">⏱ {formatTime(now - race.start)}</span>
  if (best !== null) return <span className="pill" title="Best time from the start gate to the summit">🏁 {formatTime(best)}</span>
  return null
}

// Small HUD row: golden shagai found, race clock / best time, photo mode.
export default function Extras() {
  const found = useFound()
  return (
    <div className="extras">
      <span className="pill" title="Golden shagai found — they're hidden around the steppe">
        <span aria-hidden="true">🦴</span> {found.length}/{SHAGAI.length}
      </span>
      <RaceClock />
      <button className="pill" onClick={() => setPhotoMode(true)} title="Photo mode (P)">📷</button>
    </div>
  )
}

export function PhotoBar() {
  const on = usePhotoMode()
  useEffect(() => {
    if (!on) return
    const key = (e) => { if (e.code === 'Escape') setPhotoMode(false) }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [on])
  if (!on) return null
  return (
    <div className="photo-bar" role="toolbar" aria-label="Photo mode">
      <span>📷 Photo mode · drag to frame · scroll to zoom</span>
      <button className="btn primary" onClick={() => { photoRequest.pending = true }}>Save image</button>
      <button className="btn" onClick={() => setPhotoMode(false)}>Exit</button>
    </div>
  )
}
