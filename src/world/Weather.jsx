import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { height } from './layout'
import { car, useSeason } from './store'

// Particles live in a box that follows the van; anything leaving the box wraps
// round to the other side, so the effect looks endless at a fixed cost.
const BOX = { w: 70, h: 26 }
const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function wrap(v, centre, size) {
  const half = size / 2
  return v < centre - half ? v + size : v > centre + half ? v - size : v
}

function softDot() {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.8)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(c)
}

// ── Winter: falling snow ──
function Snow({ count }) {
  const points = useRef()
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3), speed = new Float32Array(count), phase = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOX.w
      pos[i * 3 + 1] = Math.random() * BOX.h
      pos[i * 3 + 2] = (Math.random() - 0.5) * BOX.w
      speed[i] = 1.6 + Math.random() * 1.6
      phase[i] = Math.random() * 6.28
    }
    return { pos, speed, phase, tex: softDot() }
  }, [count])
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = st.clock.elapsedTime
    const p = points.current.geometry.attributes.position.array
    const ground = height(car.x, car.z)
    for (let i = 0; i < count; i++) {
      const j = i * 3
      p[j] = wrap(p[j] + Math.sin(t * 0.8 + data.phase[i]) * 0.6 * dt + 0.4 * dt, car.x, BOX.w)
      p[j + 2] = wrap(p[j + 2] + Math.cos(t * 0.6 + data.phase[i]) * 0.4 * dt, car.z, BOX.w)
      p[j + 1] -= data.speed[i] * dt
      if (p[j + 1] < ground - 2) p[j + 1] += BOX.h
      else if (p[j + 1] > ground + BOX.h) p[j + 1] -= BOX.h
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.32} map={data.tex} transparent depthWrite={false} color="#ffffff" sizeAttenuation />
    </points>
  )
}

// ── Autumn leaves / spring petals: tumbling little cards ──
function Fluttering({ count, colors, size, fall, drift }) {
  const mesh = useRef()
  const data = useMemo(() => {
    const items = Array.from({ length: count }, () => ({
      p: new THREE.Vector3((Math.random() - 0.5) * BOX.w, Math.random() * BOX.h, (Math.random() - 0.5) * BOX.w),
      r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3(Math.random() * 3 - 1.5, Math.random() * 3 - 1.5, Math.random() * 3 - 1.5),
      fall: fall * (0.7 + Math.random() * 0.6),
      phase: Math.random() * 6.28,
    }))
    return items
  }, [count, fall])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) }), [])
  const placed = useRef(false)
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = st.clock.elapsedTime
    const m = mesh.current
    if (!placed.current) {
      const c = new THREE.Color()
      data.forEach((_, i) => m.setColorAt(i, c.set(colors[i % colors.length])))
      m.instanceColor.needsUpdate = true
      placed.current = true
    }
    const ground = height(car.x, car.z)
    data.forEach((it, i) => {
      it.p.x = wrap(it.p.x + (Math.sin(t * 0.9 + it.phase) * 0.8 + drift) * dt, car.x, BOX.w)
      it.p.z = wrap(it.p.z + Math.cos(t * 0.7 + it.phase) * 0.6 * dt, car.z, BOX.w)
      it.p.y -= it.fall * dt
      if (it.p.y < ground - 1) it.p.y += BOX.h
      else if (it.p.y > ground + BOX.h) it.p.y -= BOX.h
      it.r.x += it.spin.x * dt; it.r.y += it.spin.y * dt; it.r.z += it.spin.z * dt
      tmp.q.setFromEuler(it.r)
      tmp.m.compose(it.p, tmp.q, tmp.s)
      m.setMatrixAt(i, tmp.m)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false}>
      <planeGeometry args={size} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
    </instancedMesh>
  )
}

export default function Weather({ mobile }) {
  const season = useSeason()
  const scale = (mobile ? 0.5 : 1) * (reducedMotion ? 0.4 : 1)
  if (season === 'winter') return <Snow key="snow" count={Math.round(2600 * scale)} />
  if (season === 'autumn') {
    return <Fluttering key="leaves" count={Math.round(320 * scale)} colors={['#e3a42c', '#f0b938', '#d6602a', '#b8452a', '#c98a3a']} size={[0.32, 0.22]} fall={1.3} drift={0.5} />
  }
  if (season === 'spring') {
    return <Fluttering key="petals" count={Math.round(180 * scale)} colors={['#f7d6e6', '#ffffff', '#f2b7cf']} size={[0.16, 0.12]} fall={0.6} drift={0.9} />
  }
  return null
}
