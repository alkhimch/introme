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

// Short-lived banner messages (e.g. "GOAL!").
let toast = null
let toastTimer = 0
export function showToast(text, ms = 2200) {
  toast = text; emit()
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast = null; emit() }, ms)
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
