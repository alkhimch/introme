import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { camView, resetCamView } from './store'

export const PITCH_MIN = 0.18, PITCH_MAX = 1.45, DIST_MIN = 9, DIST_MAX = 48

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

// Drag to orbit, wheel / pinch to zoom, double-click to reset.
export default function OrbitInput() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    const el = gl.domElement
    const pointers = new Map()
    let pinch = 0
    el.style.cursor = 'grab'

    const down = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      el.setPointerCapture?.(e.pointerId)
      if (pointers.size === 1) el.style.cursor = 'grabbing'
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinch = Math.hypot(a.x - b.x, a.y - b.y)
      }
    }
    const move = (e) => {
      const prev = pointers.get(e.pointerId)
      if (!prev) return
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y
      prev.x = e.clientX; prev.y = e.clientY
      if (pointers.size === 1) {
        camView.yaw -= dx * 0.006
        camView.pitch = clamp(camView.pitch + dy * 0.005, PITCH_MIN, PITCH_MAX)
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (pinch > 0) camView.dist = clamp(camView.dist * (pinch / d), DIST_MIN, DIST_MAX)
        pinch = d
      }
    }
    const up = (e) => {
      pointers.delete(e.pointerId)
      if (pointers.size < 2) pinch = 0
      if (!pointers.size) el.style.cursor = 'grab'
    }
    const wheel = (e) => {
      e.preventDefault()
      camView.dist = clamp(camView.dist * Math.exp(e.deltaY * 0.0012), DIST_MIN, DIST_MAX)
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('dblclick', resetCamView)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('dblclick', resetCamView)
    }
  }, [gl])
  return null
}
