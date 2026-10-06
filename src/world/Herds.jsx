import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { COW_HOME, HORSE_HOME, WORLD_RADIUS, height, rng } from './layout'
import { car } from './store'

const Std = (props) => <meshStandardMaterial flatShading roughness={0.95} {...props} />

// Grazing herd: animals wander around their pasture, put their heads down to graze,
// and run from the van. `flee` is the escape speed, `graze` the wandering speed.
function useHerd({ home, count, spread, seed, flee, graze, fearRadius }) {
  const animals = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, () => {
      const x = home.x + (r() - 0.5) * spread, z = home.z + (r() - 0.5) * spread
      return { x, z, heading: r() * 6.28, speed: 0, t: r() * 6, phase: r() * 6, look: 0, variant: r() }
    })
  }, [home, count, spread, seed])
  const update = (dt) => {
    for (const a of animals) {
      const dx = a.x - car.x, dz = a.z - car.z, d = Math.hypot(dx, dz)
      if (d < fearRadius) {
        a.heading = Math.atan2(dx, dz) + Math.sin(a.variant * 10) * 0.5
        a.speed += (flee - a.speed) * Math.min(1, dt * 3)
      } else {
        a.t -= dt
        if (a.t < 0) {
          a.t = 3 + Math.random() * 6
          const hx = home.x - a.x, hz = home.z - a.z
          a.heading = Math.hypot(hx, hz) > spread * 0.8 ? Math.atan2(hx, hz) : a.heading + (Math.random() - 0.5) * 2
          a.target = Math.random() > 0.45 ? graze : 0
        }
        a.speed += ((a.target || 0) - a.speed) * Math.min(1, dt * 1.5)
      }
      a.x += Math.sin(a.heading) * a.speed * dt
      a.z += Math.cos(a.heading) * a.speed * dt
      const r = Math.hypot(a.x, a.z)
      if (r > WORLD_RADIUS - 4) { a.x *= (WORLD_RADIUS - 4) / r; a.z *= (WORLD_RADIUS - 4) / r; a.heading += Math.PI }
      a.phase += a.speed * dt * 2.4
      // Heads go down to graze while standing still.
      a.look += ((a.speed < 0.3 ? 1 : 0) - a.look) * Math.min(1, dt * 2)
    }
  }
  return { animals, update }
}

function placeAnimal(g, a, dt, hop) {
  g.position.set(a.x, height(a.x, a.z) + hop, a.z)
  const diff = ((a.heading - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  g.rotation.y += diff * Math.min(1, dt * 5)
}

// ── Horses: small, sturdy Mongolian horses that gallop away from the van ──
const HORSE_COLORS = [['#7a4a2a', '#2b2420'], ['#a0592d', '#4a2b18'], ['#2b2420', '#151210'], ['#cfc8bb', '#8e877b']]

function Horse({ refs, i, coat, mane }) {
  return (
    <group ref={(el) => (refs.current[i] = el)}>
      <group name="body">
        <mesh position={[0, 1.15, 0]} castShadow><boxGeometry args={[0.6, 0.62, 1.55]} /><Std color={coat} /></mesh>
        <group name="neck" position={[0, 1.35, 0.68]}>
          <mesh position={[0, 0.3, 0.12]} rotation={[0.55, 0, 0]} castShadow><boxGeometry args={[0.32, 0.75, 0.38]} /><Std color={coat} /></mesh>
          <mesh position={[0, 0.48, 0.02]} rotation={[0.55, 0, 0]}><boxGeometry args={[0.1, 0.7, 0.18]} /><Std color={mane} /></mesh>
          <mesh position={[0, 0.58, 0.45]} rotation={[1.2, 0, 0]} castShadow><boxGeometry args={[0.26, 0.6, 0.28]} /><Std color={coat} /></mesh>
          {[-0.08, 0.08].map((x) => (
            <mesh key={x} position={[x, 0.78, 0.3]}><coneGeometry args={[0.05, 0.14, 4]} /><Std color={coat} /></mesh>
          ))}
        </group>
        <mesh position={[0, 1.15, -0.85]} rotation={[-0.5, 0, 0]}><boxGeometry args={[0.12, 0.7, 0.14]} /><Std color={mane} /></mesh>
      </group>
      {[[-0.2, 0.6], [0.2, 0.6], [-0.2, -0.6], [0.2, -0.6]].map(([x, z], k) => (
        <group key={k} name={`leg${k}`} position={[x, 0.9, z]}>
          <mesh position={[0, -0.45, 0]} castShadow><boxGeometry args={[0.13, 0.9, 0.13]} /><Std color={coat} /></mesh>
          <mesh position={[0, -0.86, 0.02]}><boxGeometry args={[0.15, 0.1, 0.17]} /><Std color="#2b2420" /></mesh>
        </group>
      ))}
    </group>
  )
}

function Horses() {
  const herd = useHerd({ home: HORSE_HOME, count: 7, spread: 20, seed: 314, flee: 10, graze: 0.9, fearRadius: 13 })
  const refs = useRef([])
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    herd.update(dt)
    herd.animals.forEach((a, i) => {
      const g = refs.current[i]
      if (!g) return
      const gallop = Math.min(1, a.speed / 6)
      placeAnimal(g, a, dt, Math.abs(Math.sin(a.phase)) * 0.18 * gallop)
      const body = g.getObjectByName('body')
      body.rotation.x = Math.sin(a.phase * 2) * 0.05 * gallop
      g.getObjectByName('neck').rotation.x = a.look * 0.9 - gallop * 0.15
      for (let k = 0; k < 4; k++) {
        const front = k < 2
        g.getObjectByName(`leg${k}`).rotation.x = Math.sin(a.phase * 2 + (front ? 0 : Math.PI) + (k % 2) * 0.5) * (0.25 + gallop * 0.55)
      }
    })
  })
  return herd.animals.map((a, i) => {
    const [coat, mane] = HORSE_COLORS[Math.floor(a.variant * HORSE_COLORS.length)]
    return <Horse key={i} refs={refs} i={i} coat={coat} mane={mane} />
  })
}

// ── Cows: slow and unbothered, they amble away when the van gets close ──
const COW_COLORS = [['#2b2420', '#f1ece0'], ['#7a4a2a', '#f1ece0'], ['#a0592d', '#7a4a2a'], ['#f1ece0', '#2b2420']]

function Cow({ refs, i, coat, patch }) {
  return (
    <group ref={(el) => (refs.current[i] = el)}>
      <mesh position={[0, 1.0, 0]} castShadow><boxGeometry args={[0.85, 0.75, 1.6]} /><Std color={coat} /></mesh>
      <mesh position={[0.43, 1.05, 0.15]}><boxGeometry args={[0.02, 0.45, 0.6]} /><Std color={patch} /></mesh>
      <mesh position={[-0.43, 0.95, -0.3]}><boxGeometry args={[0.02, 0.4, 0.5]} /><Std color={patch} /></mesh>
      <group name="head" position={[0, 1.15, 0.85]}>
        <mesh position={[0, 0, 0.2]} castShadow><boxGeometry args={[0.45, 0.45, 0.5]} /><Std color={coat} /></mesh>
        <mesh position={[0, -0.1, 0.48]}><boxGeometry args={[0.38, 0.24, 0.1]} /><Std color="#d8a593" /></mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.26, 0.24, 0.12]} rotation={[0, 0, sd * -0.9]}><coneGeometry args={[0.04, 0.24, 5]} /><Std color="#efe6cf" /></mesh>
        ))}
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.3, 0.1, 0.05]} rotation={[0, 0, sd * 1.2]}><boxGeometry args={[0.08, 0.2, 0.12]} /><Std color={coat} /></mesh>
        ))}
      </group>
      <mesh position={[0, 1.05, -0.86]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.07, 0.65, 0.07]} /><Std color={coat} /></mesh>
      {[[-0.28, 0.6], [0.28, 0.6], [-0.28, -0.6], [0.28, -0.6]].map(([x, z], k) => (
        <group key={k} name={`leg${k}`} position={[x, 0.65, z]}>
          <mesh position={[0, -0.32, 0]} castShadow><boxGeometry args={[0.18, 0.65, 0.18]} /><Std color={coat} /></mesh>
        </group>
      ))}
    </group>
  )
}

function Cows() {
  const herd = useHerd({ home: COW_HOME, count: 6, spread: 16, seed: 2718, flee: 3.2, graze: 0.6, fearRadius: 9 })
  const refs = useRef([])
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    herd.update(dt)
    herd.animals.forEach((a, i) => {
      const g = refs.current[i]
      if (!g) return
      placeAnimal(g, a, dt, 0)
      g.getObjectByName('head').rotation.x = a.look * 0.75 + Math.sin(st.clock.elapsedTime * 1.3 + i) * 0.05 * a.look
      for (let k = 0; k < 4; k++) g.getObjectByName(`leg${k}`).rotation.x = Math.sin(a.phase * 1.6 + (k === 0 || k === 3 ? 0 : Math.PI)) * Math.min(0.5, a.speed * 0.25)
    })
  })
  return herd.animals.map((a, i) => {
    const [coat, patch] = COW_COLORS[Math.floor(a.variant * COW_COLORS.length)]
    return <Cow key={i} refs={refs} i={i} coat={coat} patch={patch} />
  })
}

export default function Herds() {
  return (
    <>
      <Horses />
      <Cows />
    </>
  )
}
