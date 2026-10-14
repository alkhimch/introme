import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CAMEL_HOME, COW_HOME, GOAT_HOME, HORSE_HOME, RIDER_LOOP, WORLD_RADIUS, YAK_HOME, height, rng } from './layout'
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

// ── Bactrian camels: tall, two humps, unhurried ──
const CAMEL_COLORS = ['#c9a46a', '#b88f58', '#d6b47c']
function Camel({ refs, i, coat }) {
  return (
    <group ref={(el) => (refs.current[i] = el)}>
      <mesh position={[0, 1.55, 0]} castShadow><boxGeometry args={[0.8, 0.85, 1.9]} /><Std color={coat} /></mesh>
      {[0.42, -0.42].map((z) => (
        <mesh key={z} position={[0, 2.1, z]} castShadow><coneGeometry args={[0.36, 0.6, 6]} /><Std color={coat} /></mesh>
      ))}
      <group name="neck" position={[0, 1.7, 0.9]}>
        <mesh position={[0, 0.2, 0.25]} rotation={[-0.9, 0, 0]} castShadow><boxGeometry args={[0.28, 0.8, 0.3]} /><Std color={coat} /></mesh>
        <mesh position={[0, 0.65, 0.5]} rotation={[0.6, 0, 0]}><boxGeometry args={[0.24, 0.55, 0.26]} /><Std color={coat} /></mesh>
        <mesh position={[0, 0.88, 0.72]} rotation={[0.25, 0, 0]} castShadow><boxGeometry args={[0.26, 0.26, 0.5]} /><Std color={coat} /></mesh>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, 1.05, 0.6]}><coneGeometry args={[0.04, 0.12, 4]} /><Std color={coat} /></mesh>
        ))}
      </group>
      <mesh position={[0, 1.55, -0.98]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.08, 0.6, 0.08]} /><Std color="#8a6a3e" /></mesh>
      {[[-0.25, 0.65], [0.25, 0.65], [-0.25, -0.65], [0.25, -0.65]].map(([x, z], k) => (
        <group key={k} name={`leg${k}`} position={[x, 1.15, z]}>
          <mesh position={[0, -0.58, 0]} castShadow><boxGeometry args={[0.16, 1.15, 0.16]} /><Std color={coat} /></mesh>
        </group>
      ))}
    </group>
  )
}

// ── Goats: small, horned, bearded, jittery ──
const GOAT_COLORS = [['#f1ece0', '#8a6a3e'], ['#5a4030', '#2b2420'], ['#2b2420', '#f1ece0'], ['#a07a52', '#5a4030']]
function Goat({ refs, i, coat, horn }) {
  return (
    <group ref={(el) => (refs.current[i] = el)}>
      <mesh position={[0, 0.68, 0]} castShadow><boxGeometry args={[0.38, 0.38, 0.75]} /><Std color={coat} /></mesh>
      <group name="head" position={[0, 0.85, 0.42]}>
        <mesh position={[0, 0.06, 0.08]} castShadow><boxGeometry args={[0.2, 0.22, 0.32]} /><Std color={coat} /></mesh>
        <mesh position={[0, -0.1, 0.18]}><boxGeometry args={[0.06, 0.12, 0.05]} /><Std color={horn} /></mesh>
        {[-0.06, 0.06].map((x) => (
          <mesh key={x} position={[x, 0.24, -0.04]} rotation={[-0.7, 0, x > 0 ? -0.2 : 0.2]}><coneGeometry args={[0.035, 0.26, 4]} /><Std color={horn} /></mesh>
        ))}
      </group>
      <mesh position={[0, 0.8, -0.4]} rotation={[-0.8, 0, 0]}><boxGeometry args={[0.06, 0.16, 0.06]} /><Std color={coat} /></mesh>
      {[[-0.12, 0.25], [0.12, 0.25], [-0.12, -0.25], [0.12, -0.25]].map(([x, z], k) => (
        <group key={k} name={`leg${k}`} position={[x, 0.5, z]}>
          <mesh position={[0, -0.25, 0]}><boxGeometry args={[0.08, 0.5, 0.08]} /><Std color={coat} /></mesh>
        </group>
      ))}
    </group>
  )
}

// ── Yaks: shaggy, dark, with a long skirt of hair ──
const YAK_COLORS = [['#2b2420', '#2b2420'], ['#3b2c22', '#3b2c22'], ['#2b2420', '#f1ece0']]
function Yak({ refs, i, coat, face }) {
  return (
    <group ref={(el) => (refs.current[i] = el)}>
      <mesh position={[0, 1.05, 0]} castShadow><boxGeometry args={[0.95, 0.85, 1.7]} /><Std color={coat} /></mesh>
      <mesh position={[0, 1.45, 0.45]} castShadow><boxGeometry args={[0.85, 0.35, 0.6]} /><Std color={coat} /></mesh>
      <mesh position={[0, 0.65, 0]}><boxGeometry args={[1.08, 0.45, 1.8]} /><Std color={coat} /></mesh>
      <group name="head" position={[0, 1.05, 0.9]}>
        <mesh position={[0, -0.05, 0.22]} castShadow><boxGeometry args={[0.46, 0.45, 0.45]} /><Std color={face} /></mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.32, 0.22, 0.15]} rotation={[0, 0, sd * -1.1]}><coneGeometry args={[0.05, 0.36, 5]} /><Std color="#e8dfc8" /></mesh>
        ))}
      </group>
      <mesh position={[0, 1.0, -0.92]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.14, 0.7, 0.12]} /><Std color={coat} /></mesh>
      {[[-0.3, 0.55], [0.3, 0.55], [-0.3, -0.55], [0.3, -0.55]].map(([x, z], k) => (
        <group key={k} name={`leg${k}`} position={[x, 0.55, z]}>
          <mesh position={[0, -0.27, 0]}><boxGeometry args={[0.2, 0.55, 0.2]} /><Std color={coat} /></mesh>
        </group>
      ))}
    </group>
  )
}

// Generic herd renderer: walk/graze animation driven by each animal's speed.
function Herd({ config, colors, Model, legSwing = 1.6, maxSwing = 0.5, headDown = 0.7 }) {
  const herd = useHerd(config)
  const refs = useRef([])
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    herd.update(dt)
    herd.animals.forEach((a, i) => {
      const g = refs.current[i]
      if (!g) return
      placeAnimal(g, a, dt, 0)
      const head = g.getObjectByName('head') || g.getObjectByName('neck')
      if (head) head.rotation.x = a.look * headDown + Math.sin(st.clock.elapsedTime * 1.3 + i) * 0.05 * a.look
      for (let k = 0; k < 4; k++) {
        const leg = g.getObjectByName(`leg${k}`)
        if (leg) leg.rotation.x = Math.sin(a.phase * legSwing + (k === 0 || k === 3 ? 0 : Math.PI)) * Math.min(maxSwing, a.speed * 0.25)
      }
    })
  })
  return herd.animals.map((a, i) => {
    const c = colors[Math.floor(a.variant * colors.length)]
    const [coat, extra] = Array.isArray(c) ? c : [c, c]
    return <Model key={i} refs={refs} i={i} coat={coat} horn={extra} face={extra} />
  })
}

// A child on a horse, walking slow circles; stops to wave when the van comes by.
function Rider() {
  const root = useRef()
  const horse = useRef([])
  const arm = useRef()
  const s = useRef({ a: 0, phase: 0, speed: 1.6 })
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const r = s.current
    const g = root.current
    const near = Math.hypot(car.x - g.position.x, car.z - g.position.z) < 9
    r.speed += ((near ? 0 : 1.8) - r.speed) * Math.min(1, dt * 2)
    r.a += (r.speed / RIDER_LOOP.r) * dt
    r.phase += r.speed * dt * 2.6
    const x = RIDER_LOOP.x + Math.cos(r.a) * RIDER_LOOP.r, z = RIDER_LOOP.z + Math.sin(r.a) * RIDER_LOOP.r
    g.position.set(x, height(x, z), z)
    g.rotation.y = Math.atan2(-Math.sin(r.a), Math.cos(r.a))
    const hg = horse.current[0]
    if (hg) {
      for (let k = 0; k < 4; k++) {
        const leg = hg.getObjectByName(`leg${k}`)
        if (leg) leg.rotation.x = Math.sin(r.phase + (k === 0 || k === 3 ? 0 : Math.PI)) * 0.35 * Math.min(1, r.speed)
      }
      const neck = hg.getObjectByName('neck')
      if (neck) neck.rotation.x = Math.sin(r.phase) * 0.06
    }
    arm.current.rotation.z = near ? 2.4 + Math.sin(st.clock.elapsedTime * 9) * 0.3 : 0.25
  })
  return (
    <group ref={root}>
      <Horse refs={horse} i={0} coat="#a0592d" mane="#4a2b18" />
      {/* Saddle and rider */}
      <mesh position={[0, 1.5, -0.05]}><boxGeometry args={[0.64, 0.12, 0.6]} /><Std color="#7a2a20" /></mesh>
      <group position={[0, 1.55, -0.05]} scale={0.62}>
        <mesh position={[0, 0.55, 0]} castShadow><cylinderGeometry args={[0.22, 0.32, 1.0, 10]} /><Std color="#e08a2c" /></mesh>
        <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.235, 0.24, 0.12, 10]} /><Std color="#3d6fa8" /></mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.32, 0.05, 0.05]} rotation={[0, 0, sd * 0.5]}><boxGeometry args={[0.14, 0.6, 0.16]} /><Std color="#e08a2c" /></mesh>
        ))}
        <mesh position={[0, 1.22, 0]} castShadow><sphereGeometry args={[0.2, 10, 8]} /><Std color="#d9a77f" /></mesh>
        <mesh position={[0, 1.4, 0]}><coneGeometry args={[0.2, 0.3, 10]} /><Std color="#c8423b" /></mesh>
        <group ref={arm} position={[0.26, 0.95, 0]}>
          <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.06, 0.07, 0.5, 6]} /><Std color="#e08a2c" /></mesh>
        </group>
        <group position={[-0.26, 0.95, 0]} rotation={[0.6, 0, -0.2]}>
          <mesh position={[0, -0.25, 0]}><cylinderGeometry args={[0.06, 0.07, 0.5, 6]} /><Std color="#e08a2c" /></mesh>
        </group>
      </group>
    </group>
  )
}

export default function Herds() {
  return (
    <>
      <Horses />
      <Cows />
      <Herd config={{ home: CAMEL_HOME, count: 5, spread: 18, seed: 1618, flee: 3.6, graze: 0.5, fearRadius: 10 }} colors={CAMEL_COLORS} Model={Camel} legSwing={1.3} headDown={0.5} />
      <Herd config={{ home: GOAT_HOME, count: 9, spread: 14, seed: 577, flee: 6.5, graze: 0.9, fearRadius: 9 }} colors={GOAT_COLORS} Model={Goat} legSwing={2.4} maxSwing={0.7} headDown={0.8} />
      <Herd config={{ home: YAK_HOME, count: 5, spread: 14, seed: 4242, flee: 3, graze: 0.5, fearRadius: 9 }} colors={YAK_COLORS} Model={Yak} headDown={0.6} />
      <Rider />
    </>
  )
}
