import { useSyncExternalStore } from 'react'
import { SPAWN } from './layout'

// Per-frame mutable state (read inside useFrame, never triggers React renders).
export const car = { x: SPAWN.x, z: SPAWN.z, y: 0, heading: SPAWN.heading, speed: 0 }
export const input = { forward: false, back: false, left: false, right: false, brake: false }
export const commands = { teleport: null, resetCount: 0 }

// Small React-visible store for UI state.
const ui = { zone: null, started: false }
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l) => (listeners.add(l), () => listeners.delete(l))

export function setZone(zone) {
  if (ui.zone !== zone) { ui.zone = zone; emit() }
}
export const useZone = () => useSyncExternalStore(subscribe, () => ui.zone)
export function getZone() { return ui.zone }

export function setStarted() { if (!ui.started) { ui.started = true; emit() } }
export const useStarted = () => useSyncExternalStore(subscribe, () => ui.started)

// Short-lived banner messages, shown one after another (e.g. a pickup and a race finish together).
let toast = null
let toastTimer = 0
const toastQueue = []
function nextToast() {
  const item = toastQueue.shift()
  toast = item ? item.text : null
  emit()
  if (item) toastTimer = setTimeout(nextToast, item.ms)
}
export function showToast(text, ms = 2200) {
  toastQueue.push({ text, ms })
  if (!toast) { clearTimeout(toastTimer); nextToast() }
}
export const useToast = () => useSyncExternalStore(subscribe, () => toast)

// Orbit camera around the van, driven by mouse/touch drag. Angles in radians.
export const camView = { yaw: 0, pitch: 0, dist: 20, defaults: null }
export function initCamView([x, y, z]) {
  const dist = Math.hypot(x, y, z)
  camView.defaults = { yaw: Math.atan2(x, z), pitch: Math.asin(y / dist), dist }
  Object.assign(camView, camView.defaults)
}
export function resetCamView() { if (camView.defaults) Object.assign(camView, camView.defaults) }

// ── Season (spring / summer / autumn / winter) ──
export const SEASONS = ['spring', 'summer', 'autumn', 'winter']
const SEASON_KEY = 'introme-season'
function defaultSeason() {
  // Match the real season in Mongolia unless the visitor picked one before.
  try { const saved = localStorage.getItem(SEASON_KEY); if (SEASONS.includes(saved)) return saved } catch { /* ignore */ }
  const m = new Date().getMonth()
  return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'
}
let season = defaultSeason()
export function setSeason(s) {
  if (!SEASONS.includes(s) || s === season) return
  season = s
  try { localStorage.setItem(SEASON_KEY, s) } catch { /* ignore */ }
  emit()
}
export const getSeason = () => season
export const useSeason = () => useSyncExternalStore(subscribe, () => season)

// ── Time of day (day / evening / night) ──
export const TIMES = ['day', 'evening', 'night']
const TIME_KEY = 'introme-time'
function defaultTime() {
  try { const saved = localStorage.getItem(TIME_KEY); if (TIMES.includes(saved)) return saved } catch { /* ignore */ }
  const h = new Date().getHours()
  return h >= 21 || h < 6 ? 'night' : h >= 18 ? 'evening' : 'day'
}
let timeOfDay = defaultTime()
export function setTimeOfDay(t) {
  if (!TIMES.includes(t) || t === timeOfDay) return
  timeOfDay = t
  try { localStorage.setItem(TIME_KEY, t) } catch { /* ignore */ }
  emit()
}
export const cycleTimeOfDay = () => setTimeOfDay(TIMES[(TIMES.indexOf(timeOfDay) + 1) % TIMES.length])
export const getTimeOfDay = () => timeOfDay
export const useTimeOfDay = () => useSyncExternalStore(subscribe, () => timeOfDay)

// ── Small persisted UI state helper ──
function persisted(key, fallback, valid) {
  let value = fallback
  try { const raw = localStorage.getItem(key); if (raw !== null) { const v = JSON.parse(raw); if (!valid || valid(v)) value = v } } catch { /* ignore */ }
  return {
    get: () => value,
    set: (v) => { value = v; try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* ignore */ } emit() },
  }
}

// ── Graphics quality (chosen on the intro screen) ──
export const QUALITIES = ['low', 'medium', 'high']
export function suggestQuality() {
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  const small = window.innerWidth < 760
  if (small && (cores <= 6 || mem <= 4)) return 'low'
  if (small || cores <= 4 || mem <= 4) return 'medium'
  return 'high'
}
const quality = persisted('introme-quality', typeof window !== 'undefined' ? suggestQuality() : 'medium', (v) => QUALITIES.includes(v))
export const setQuality = (q) => QUALITIES.includes(q) && q !== quality.get() && quality.set(q)
export const getQuality = quality.get
export const useQuality = () => useSyncExternalStore(subscribe, quality.get)

// ── Hidden golden shagai (ankle bones) found so far ──
const found = persisted('introme-shagai', [], Array.isArray)
export const useFound = () => useSyncExternalStore(subscribe, found.get)
export const getFound = found.get
export function collect(id) {
  if (found.get().includes(id)) return false
  found.set([...found.get(), id])
  return true
}
export const resetFound = () => found.set([])

// ── Race from the start gate to the summit ──
const best = persisted('introme-best-race', null, (v) => v === null || typeof v === 'number')
export const getBestRace = best.get
export const useBestRace = () => useSyncExternalStore(subscribe, best.get)
export const setBestRace = (t) => best.set(t)
export const race = { running: false, start: 0 }
let raceTick = 0
export function setRaceRunning(running, start = 0) { race.running = running; race.start = start; raceTick++; emit() }
export const useRace = () => useSyncExternalStore(subscribe, () => raceTick)

// ── Photo mode ──
let photoMode = false
export function setPhotoMode(v) { if (photoMode !== v) { photoMode = v; emit() } }
export const usePhotoMode = () => useSyncExternalStore(subscribe, () => photoMode)
export const getPhotoMode = () => photoMode
export const photoRequest = { pending: false }

// ── Rain (spring / summer / autumn; a heavy snowfall in winter) ──
const rain = persisted('introme-rain', false, (v) => typeof v === 'boolean')
export const useRain = () => useSyncExternalStore(subscribe, rain.get)
export const getRain = rain.get
export const toggleRain = () => rain.set(!rain.get())
