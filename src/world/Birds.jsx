import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { HILLS } from './layout'
import { car, useSeason, useTimeOfDay } from './store'

// A low-poly bird: body, neck/head, two flapping wings.
function Bird({ birdRef, wingL, wingR, body, wing, tip, scale = 1, neck = true }) {
  return (
    <group ref={birdRef} scale={scale}>
      <mesh castShadow><boxGeometry args={[0.32, 0.28, 1.3]} /><meshStandardMaterial color={body} flatShading /></mesh>
      {neck && (
        <group position={[0, 0.06, 0.75]}>
          <mesh rotation={[0.3, 0, 0]}><boxGeometry args={[0.1, 0.1, 0.6]} /><meshStandardMaterial color={body} flatShading /></mesh>
          <mesh position={[0, 0.08, 0.32]}><boxGeometry args={[0.14, 0.14, 0.2]} /><meshStandardMaterial color="#1e1a17" flatShading /></mesh>
          <mesh position={[0, 0.07, 0.48]}><boxGeometry args={[0.04, 0.04, 0.2]} /><meshStandardMaterial color="#c9a43a" /></mesh>
        </group>
      )}
      {[[wingL, 1], [wingR, -1]].map(([ref, sd]) => (
        <group key={sd} ref={ref} position={[sd * 0.14, 0.05, 0.05]}>
          <mesh position={[sd * 0.75, 0, 0]}><boxGeometry args={[1.5, 0.05, 0.6]} /><meshStandardMaterial color={wing} flatShading /></mesh>
          <mesh position={[sd * 1.65, 0, -0.05]}><boxGeometry args={[0.35, 0.05, 0.45]} /><meshStandardMaterial color={tip} flatShading /></mesh>
        </group>
      ))}
      <mesh position={[0, 0, -0.75]}><boxGeometry args={[0.36, 0.05, 0.35]} /><meshStandardMaterial color={tip} flatShading /></mesh>
    </group>
  )
}

function useBirdRefs(n) {
  return useMemo(() => Array.from({ length: n }, () => ({ bird: { current: null }, l: { current: null }, r: { current: null }, phase: Math.random() * 6 })), [n])
}

// ── Autumn: cranes migrating south in a V ──
const V_SIZE = 9
function CraneFlock({ seed }) {
  const birds = useBirdRefs(V_SIZE)
  const flock = useRef(null)
  const reset = () => {
    // Enter from the north of the van, heading south with a little drift.
    const off = (Math.random() - 0.5) * 120
    flock.current = { x: car.x + off, z: car.z - 160 - seed * 60, y: 21 + Math.random() * 6, heading: 0.15 * (Math.random() - 0.5) }
  }
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    if (!flock.current) reset()
    const f = flock.current
    f.x += Math.sin(f.heading) * 9 * dt
    f.z += Math.cos(f.heading) * 9 * dt
    if (f.z - car.z > 170) reset()
    const t = st.clock.elapsedTime
    birds.forEach((b, i) => {
      if (!b.bird.current) return
      const row = Math.ceil(i / 2), side = i === 0 ? 0 : i % 2 ? 1 : -1
      const lx = side * row * 2.6, lz = -row * 2.4
      const c = Math.cos(f.heading), s = Math.sin(f.heading)
      b.bird.current.position.set(f.x + lx * c + lz * s, f.y + Math.sin(t * 0.7 + i) * 0.4, f.z - lx * s + lz * c)
      b.bird.current.rotation.y = f.heading
      const flap = Math.sin(t * 4 + b.phase) * 0.45
      b.l.current.rotation.z = flap
      b.r.current.rotation.z = -flap
    })
  })
  return birds.map((b, i) => (
    <Bird key={i} birdRef={b.bird} wingL={b.l} wingR={b.r} body="#9aa0a6" wing="#a9aeb3" tip="#2a2826" scale={0.9} />
  ))
}

// ── Spring / summer: eagles circling over the forested hills ──
function Eagles() {
  const birds = useBirdRefs(2)
  const orbits = useMemo(() => [
    { hill: HILLS[0], r: 22, y: 26, speed: 0.22 },
    { hill: HILLS[1], r: 18, y: 23, speed: -0.27 },
  ], [])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    birds.forEach((b, i) => {
      if (!b.bird.current) return
      const o = orbits[i], a = t * o.speed + i * 2
      const x = o.hill.x + Math.cos(a) * o.r, z = o.hill.z + Math.sin(a) * o.r
      b.bird.current.position.set(x, o.y + Math.sin(t * 0.5 + i) * 1.5, z)
      // Face along the circle and bank into the turn.
      b.bird.current.rotation.set(0, Math.atan2(-Math.sin(a) * Math.sign(o.speed), Math.cos(a) * Math.sign(o.speed)), Math.sign(o.speed) * 0.35)
      // Mostly gliding, with an occasional burst of wingbeats.
      const flapping = Math.sin(t * 0.4 + i * 3) > 0.7
      const flap = flapping ? Math.sin(t * 6 + b.phase) * 0.4 : 0.08
      b.l.current.rotation.z = flap
      b.r.current.rotation.z = -flap
    })
  })
  return birds.map((b, i) => (
    <Bird key={i} birdRef={b.bird} wingL={b.l} wingR={b.r} body="#4a3524" wing="#5a412b" tip="#2b2018" scale={1.25} neck={false} />
  ))
}

export default function Birds() {
  const season = useSeason()
  const time = useTimeOfDay()
  if (time === 'night') return null
  if (season === 'autumn') return [0, 1].map((i) => <CraneFlock key={i} seed={i} />)
  if (season === 'spring' || season === 'summer') return <Eagles />
  return null
}
