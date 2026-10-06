import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMP, CHILD, DOG_HOME, DOGHOUSE, SWING, WOMAN, campLocal, height } from './layout'
import { car } from './store'

const Std = (props) => <meshStandardMaterial flatShading roughness={0.9} {...props} />

// Horizontal log texture for the cabin walls.
function logTexture() {
  const c = document.createElement('canvas')
  c.width = 64; c.height = 128
  const g = c.getContext('2d')
  for (let i = 0; i < 8; i++) {
    const y = i * 16
    const grad = g.createLinearGradient(0, y, 0, y + 16)
    grad.addColorStop(0, '#a87445'); grad.addColorStop(0.5, '#c08a55'); grad.addColorStop(1, '#7d522d')
    g.fillStyle = grad
    g.fillRect(0, y, 64, 16)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(4, 1.4)
  return t
}

function Window({ position, ry = 0 }) {
  return (
    <group position={position} rotation={[0, ry, 0]}>
      <mesh><boxGeometry args={[1.1, 1.0, 0.08]} /><Std color="#f4efe4" /></mesh>
      <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.9, 0.8, 0.04]} /><meshStandardMaterial color="#9cc4d8" roughness={0.2} metalness={0.2} /></mesh>
      <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.06, 0.8, 0.02]} /><Std color="#f4efe4" /></mesh>
      <mesh position={[0, 0, 0.06]}><boxGeometry args={[0.9, 0.06, 0.02]} /><Std color="#f4efe4" /></mesh>
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0, 0.04]}><boxGeometry args={[0.42, 1.0, 0.05]} /><Std color="#3d6fa8" /></mesh>
      ))}
    </group>
  )
}

function Cabin() {
  const tex = useMemo(logTexture, [])
  // Two storeys: ground floor F1 + upper floor F2.
  const W = 7, D = 4.6, F1 = 2.8, F2 = 2.6, H = F1 + F2, roofH = 1.9, base = 0.4
  const slope = Math.hypot(D / 2 + 0.5, roofH), ang = Math.atan2(roofH, D / 2 + 0.5)
  const gable = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(0, roofH); sh.closePath()
    return new THREE.ShapeGeometry(sh)
  }, [D, roofH])
  const wallTex = useMemo(() => { const t = tex.clone(); t.repeat.set(4, 2.6); t.needsUpdate = true; return t }, [tex])
  const y = height(CAMP.x, CAMP.z)
  const upper = base + F1 + 0.12
  return (
    <group position={[CAMP.x, y, CAMP.z]} rotation={[0, CAMP.ry, 0]}>
      {/* Stone foundation + log walls */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow><boxGeometry args={[W + 0.3, 0.4, D + 0.3]} /><Std color="#8e8a80" /></mesh>
      <mesh position={[0, base + H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial map={wallTex} roughness={0.95} />
      </mesh>
      {/* Beam between the floors */}
      <mesh position={[0, base + F1, 0]} castShadow><boxGeometry args={[W + 0.12, 0.22, D + 0.12]} /><Std color="#6a4426" /></mesh>
      {/* Corner posts */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => (
        <mesh key={`${sx}${sz}`} position={[sx * W / 2, base + H / 2, sz * D / 2]}><boxGeometry args={[0.22, H, 0.22]} /><Std color="#6a4426" /></mesh>
      ))}
      {/* Gable ends */}
      {[-1, 1].map((side) => (
        <mesh key={side} geometry={gable} position={[side * (W / 2 + 0.001), base + H, 0]} rotation={[0, side * Math.PI / 2, 0]}>
          <meshStandardMaterial map={tex} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Red roof */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, base + H + roofH / 2, side * (D / 4 + 0.25)]} rotation={[side * ang, 0, 0]} castShadow>
          <boxGeometry args={[W + 0.9, 0.14, slope]} />
          <Std color="#b5432f" />
        </mesh>
      ))}
      <mesh position={[0, base + H + roofH + 0.05, 0]}><boxGeometry args={[W + 0.95, 0.16, 0.24]} /><Std color="#8c2f21" /></mesh>
      {/* Chimney */}
      <mesh position={[W / 2 - 1.3, base + H + roofH * 0.9, -0.6]} castShadow><boxGeometry args={[0.55, 1.6, 0.55]} /><Std color="#9a5a44" /></mesh>
      {/* Ground floor: door, porch, steps */}
      <mesh position={[0, base + 1.05, D / 2 + 0.03]}><boxGeometry args={[1.1, 2.1, 0.08]} /><Std color="#3d6fa8" /></mesh>
      <mesh position={[0.35, base + 1.05, D / 2 + 0.09]}><sphereGeometry args={[0.06, 8, 6]} /><meshStandardMaterial color="#e2c25a" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, 0.45, D / 2 + 0.9]} castShadow receiveShadow><boxGeometry args={[3.2, 0.12, 1.7]} /><Std color="#9b6a3e" /></mesh>
      <mesh position={[0, 0.22, D / 2 + 2.0]} receiveShadow><boxGeometry args={[1.6, 0.12, 0.5]} /><Std color="#8a5d36" /></mesh>
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, base + F1 / 2, D / 2 + 1.65]} castShadow><boxGeometry args={[0.14, F1, 0.14]} /><Std color="#7a4f2c" /></mesh>
      ))}
      {/* Upper floor: balcony over the porch, with railing and a door */}
      <mesh position={[0, upper, D / 2 + 0.9]} castShadow receiveShadow><boxGeometry args={[3.4, 0.14, 1.85]} /><Std color="#9b6a3e" /></mesh>
      <mesh position={[0, upper + 0.9, D / 2 + 1.78]}><boxGeometry args={[3.4, 0.08, 0.08]} /><Std color="#f4efe4" /></mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 1.68, upper + 0.9, D / 2 + 0.9]}><boxGeometry args={[0.08, 0.08, 1.8]} /><Std color="#f4efe4" /></mesh>
      ))}
      {Array.from({ length: 13 }, (_, i) => -1.62 + i * 0.27).map((x) => (
        <mesh key={x} position={[x, upper + 0.45, D / 2 + 1.78]}><boxGeometry args={[0.05, 0.85, 0.05]} /><Std color="#f4efe4" /></mesh>
      ))}
      {[-1, 1].flatMap((sd) => [0.35, 0.8, 1.25].map((z) => (
        <mesh key={`${sd}${z}`} position={[sd * 1.68, upper + 0.45, D / 2 + z]}><boxGeometry args={[0.05, 0.85, 0.05]} /><Std color="#f4efe4" /></mesh>
      )))}
      <mesh position={[0, upper + 1.0, D / 2 + 0.03]}><boxGeometry args={[1.0, 1.9, 0.08]} /><Std color="#3d6fa8" /></mesh>
      {/* Windows: ground floor and upper floor */}
      <Window position={[-2.3, base + 1.5, D / 2 + 0.03]} />
      <Window position={[2.3, base + 1.5, D / 2 + 0.03]} />
      <Window position={[-2.3, upper + 1.2, D / 2 + 0.03]} />
      <Window position={[2.3, upper + 1.2, D / 2 + 0.03]} />
      {[base + 1.5, upper + 1.2].flatMap((wy) => [
        <Window key={`r${wy}`} position={[W / 2 + 0.03, wy, 0]} ry={Math.PI / 2} />,
        <Window key={`l${wy}`} position={[-W / 2 - 0.03, wy, 0]} ry={-Math.PI / 2} />,
      ])}
      <Window position={[0, base + H + 0.75, D / 2 - 0.9]} />
      {/* Back wall windows */}
      {[base + 1.5, upper + 1.2].flatMap((wy) => [-2.0, 2.0].map((wx) => (
        <Window key={`b${wy}${wx}`} position={[wx, wy, -D / 2 - 0.03]} ry={Math.PI} />
      )))}
      {/* A little bench by the door */}
      <mesh position={[-2.6, 0.8, D / 2 + 0.6]} castShadow><boxGeometry args={[1.4, 0.1, 0.45]} /><Std color="#7a4f2c" /></mesh>
      {[-3.2, -2.0].map((x) => (
        <mesh key={x} position={[x, 0.6, D / 2 + 0.6]}><boxGeometry args={[0.1, 0.4, 0.4]} /><Std color="#6a4426" /></mesh>
      ))}
    </group>
  )
}

// A-frame swing that sways in the wind and gets a push when the van bumps it.
function Swing() {
  const seat = useRef()
  const state = useRef({ a: 0.15, w: 0 })
  const L = 2.3, TOP = 2.9
  const y = height(SWING.x, SWING.z)
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const s = state.current
    const dist = Math.hypot(car.x - SWING.x, car.z - SWING.z)
    if (dist < 3.2 && Math.abs(car.speed) > 1) s.w += Math.sign(car.speed) * Math.min(3, Math.abs(car.speed) * 0.15) * dt * 20
    const wind = Math.sin(st.clock.elapsedTime * 0.7) * 0.04
    s.w += (-9.8 / L) * Math.sin(s.a) * dt + wind * dt
    s.w *= Math.exp(-0.15 * dt)
    s.a = Math.max(-1.1, Math.min(1.1, s.a + s.w * dt))
    seat.current.rotation.x = s.a
  })
  const leg = (x, z, rx) => (
    <mesh key={`${x}${z}`} position={[x, TOP / 2, z]} rotation={[rx, 0, 0]} castShadow>
      <boxGeometry args={[0.14, TOP / Math.cos(0.32), 0.14]} />
      <Std color="#5f6b78" />
    </mesh>
  )
  return (
    <group position={[SWING.x, y, SWING.z]} rotation={[0, SWING.ry, 0]}>
      {[-1.7, 1.7].flatMap((x) => [leg(x, 0.47, -0.32), leg(x, -0.47, 0.32)])}
      <mesh position={[0, TOP, 0]} castShadow><boxGeometry args={[3.7, 0.16, 0.16]} /><Std color="#5f6b78" /></mesh>
      <group ref={seat} position={[0, TOP, 0]}>
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} position={[x, -L / 2, 0]}><cylinderGeometry args={[0.025, 0.025, L, 5]} /><Std color="#d8c9a8" /></mesh>
        ))}
        <mesh position={[0, -L, 0]} castShadow><boxGeometry args={[1.15, 0.08, 0.42]} /><Std color="#d9622b" /></mesh>
      </group>
    </group>
  )
}

// A person in a deel who turns towards the van and waves when it comes close.
// Used for the woman and (scaled down, with a pointed hat and little hops) the child.
function Person({ spot, scale = 1, deelColor, sashColor, braid = false, hat = false, hop = false, waveSpeed = 7 }) {
  const root = useRef()
  const arm = useRef()
  const body = useRef()
  const y = height(spot.x, spot.z)
  const deel = useMemo(() => {
    const pts = [[0.0, 0], [0.36, 0], [0.33, 0.35], [0.27, 0.75], [0.22, 0.95], [0.25, 1.2], [0.2, 1.38], [0.08, 1.45], [0, 1.45]]
    return new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), 14)
  }, [])
  const state = useRef({ yaw: 0, wave: 0 })
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = st.clock.elapsedTime
    const dx = car.x - spot.x, dz = car.z - spot.z, d = Math.hypot(dx, dz)
    const near = d < 15
    const s = state.current
    const target = near ? Math.atan2(dx, dz) - spot.ry : 0
    const diff = ((target - s.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    s.yaw += diff * Math.min(1, dt * 3)
    root.current.rotation.y = spot.ry + s.yaw
    s.wave += ((near ? 1 : 0) - s.wave) * Math.min(1, dt * 4)
    arm.current.rotation.z = 0.2 + s.wave * 2.3
    arm.current.rotation.x = s.wave * Math.sin(t * waveSpeed) * 0.35
    body.current.position.y = hop ? s.wave * Math.abs(Math.sin(t * 6)) * 0.18 : Math.sin(t * 1.6) * 0.008
  })
  const skin = '#d9a77f', hair = '#1e1714'
  return (
    <group position={[spot.x, y, spot.z]} ref={root} scale={scale}>
      <group ref={body}>
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.06, 0.04]} castShadow><boxGeometry args={[0.16, 0.12, 0.3]} /><Std color="#2b2420" /></mesh>
        ))}
        <mesh geometry={deel} position={[0, 0.1, 0]} castShadow><Std color={deelColor} /></mesh>
        <mesh position={[0, 0.1 + 0.95, 0]}><cylinderGeometry args={[0.235, 0.24, 0.16, 14]} /><Std color={sashColor} /></mesh>
        <mesh position={[0.1, 0.1 + 1.28, 0.17]} rotation={[0.2, 0, -0.6]}><boxGeometry args={[0.04, 0.32, 0.03]} /><Std color={sashColor} /></mesh>
        <mesh position={[0, 1.62, 0]}><cylinderGeometry args={[0.06, 0.07, 0.12, 8]} /><Std color={skin} /></mesh>
        <mesh position={[0, 1.8, 0]} castShadow><sphereGeometry args={[0.17, 12, 10]} /><Std color={skin} /></mesh>
        <mesh position={[0, 1.85, -0.02]}><sphereGeometry args={[0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} /><Std color={hair} /></mesh>
        {braid && <mesh position={[0, 1.45, -0.17]} rotation={[0.12, 0, 0]}><cylinderGeometry args={[0.045, 0.03, 0.6, 6]} /><Std color={hair} /></mesh>}
        {hat && (
          <group position={[0, 1.93, 0]}>
            <mesh><cylinderGeometry args={[0.21, 0.21, 0.08, 14]} /><Std color="#2b2420" /></mesh>
            <mesh position={[0, 0.17, 0]}><coneGeometry args={[0.17, 0.3, 12]} /><Std color="#c8423b" /></mesh>
            <mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.035, 6, 4]} /><Std color="#f2c94c" /></mesh>
          </group>
        )}
        {[-0.06, 0.06].map((x) => (
          <mesh key={x} position={[x, 1.82, 0.155]}><sphereGeometry args={[0.018, 6, 4]} /><meshBasicMaterial color={hair} /></mesh>
        ))}
        <group position={[-0.24, 1.42, 0]} rotation={[0, 0, -0.2]}>
          <mesh position={[0, -0.3, 0]} castShadow><cylinderGeometry args={[0.06, 0.07, 0.6, 7]} /><Std color={deelColor} /></mesh>
          <mesh position={[0, -0.63, 0]}><sphereGeometry args={[0.055, 8, 6]} /><Std color={skin} /></mesh>
        </group>
        <group ref={arm} position={[0.24, 1.42, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow><cylinderGeometry args={[0.06, 0.07, 0.6, 7]} /><Std color={deelColor} /></mesh>
          <mesh position={[0, -0.63, 0]}><sphereGeometry args={[0.055, 8, 6]} /><Std color={skin} /></mesh>
        </group>
      </group>
    </group>
  )
}

// A fluffy little dog that never stops running laps of the camp yard —
// and runs circles around the van whenever it visits.
function Dog() {
  const root = useRef()
  const legs = useRef([])
  const tail = useRef()
  const head = useRef()
  const s = useRef({ x: DOG_HOME.x, z: DOG_HOME.z, heading: 0, phase: 0, t: 0 })
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const d = s.current
    d.t += dt
    const vanDist = Math.hypot(car.x - DOG_HOME.x, car.z - DOG_HOME.z)
    let tx, tz
    if (vanDist < 16) {
      // Orbit the van at a safe distance.
      const a = d.t * 1.3
      tx = car.x + Math.cos(a) * 4.2; tz = car.z + Math.sin(a) * 4.2
    } else {
      // Figure-of-eight laps around the yard.
      const a = d.t * 0.55
      const p = campLocal(0.5 + Math.sin(a) * 6, 11 + Math.sin(a * 2) * 2.5)
      tx = p.x; tz = p.z
    }
    const dx = tx - d.x, dz = tz - d.z, dist = Math.hypot(dx, dz)
    const speed = Math.min(7, dist * 3)
    if (dist > 0.05) {
      const want = Math.atan2(dx, dz)
      const diff = ((want - d.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      d.heading += diff * Math.min(1, dt * 8)
      d.x += Math.sin(d.heading) * speed * dt
      d.z += Math.cos(d.heading) * speed * dt
    }
    d.phase += speed * dt * 3.2
    const hop = Math.abs(Math.sin(d.phase)) * 0.09 * Math.min(1, speed / 3)
    root.current.position.set(d.x, height(d.x, d.z) + hop, d.z)
    root.current.rotation.y = d.heading
    legs.current.forEach((l, i) => { if (l) l.rotation.x = Math.sin(d.phase + (i < 2 ? 0 : Math.PI)) * 0.8 * Math.min(1, speed / 2) })
    tail.current.rotation.z = Math.sin(st.clock.elapsedTime * 18) * 0.6
    head.current.rotation.x = Math.sin(d.phase) * 0.06
  })
  const fur = '#d9a35a', cream = '#f6ead5'
  return (
    <group ref={root}>
      <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[0.38, 0.32, 0.72]} /><Std color={fur} /></mesh>
      <mesh position={[0, 0.36, 0.2]}><boxGeometry args={[0.3, 0.22, 0.3]} /><Std color={cream} /></mesh>
      <group ref={head} position={[0, 0.66, 0.38]}>
        <mesh castShadow><boxGeometry args={[0.32, 0.3, 0.3]} /><Std color={fur} /></mesh>
        <mesh position={[0, -0.06, 0.2]}><boxGeometry args={[0.18, 0.14, 0.16]} /><Std color={cream} /></mesh>
        <mesh position={[0, -0.02, 0.29]}><boxGeometry args={[0.07, 0.06, 0.03]} /><meshBasicMaterial color="#1e1714" /></mesh>
        {[-0.09, 0.09].map((x) => (
          <mesh key={x} position={[x, 0.05, 0.155]}><boxGeometry args={[0.04, 0.05, 0.01]} /><meshBasicMaterial color="#1e1714" /></mesh>
        ))}
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.21, -0.02]} rotation={[0, 0, x > 0 ? -0.2 : 0.2]}><coneGeometry args={[0.07, 0.16, 4]} /><Std color="#b97f3d" /></mesh>
        ))}
      </group>
      <group ref={tail} position={[0, 0.58, -0.36]}>
        <mesh position={[0, 0.1, -0.04]} rotation={[-0.5, 0, 0]}><torusGeometry args={[0.1, 0.045, 5, 8, Math.PI * 1.4]} /><Std color={fur} /></mesh>
      </group>
      {[[-0.12, 0.25], [0.12, 0.25], [-0.12, -0.25], [0.12, -0.25]].map(([x, z], i) => (
        <group key={i} ref={(el) => (legs.current[i] = el)} position={[x, 0.3, z]}>
          <mesh position={[0, -0.14, 0]}><boxGeometry args={[0.09, 0.28, 0.09]} /><Std color={i < 2 ? cream : fur} /></mesh>
        </group>
      ))}
    </group>
  )
}

// The dog's own little kennel, with a food bowl and a bone.
function Doghouse() {
  const y = height(DOGHOUSE.x, DOGHOUSE.z)
  const W = 1.25, D = 1.45, H = 0.95, roofH = 0.55
  const ang = Math.atan2(roofH, W / 2 + 0.12), slope = Math.hypot(W / 2 + 0.12, roofH)
  const gable = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(0, roofH); sh.closePath()
    return new THREE.ShapeGeometry(sh)
  }, [])
  return (
    <group position={[DOGHOUSE.x, y, DOGHOUSE.z]} rotation={[0, DOGHOUSE.ry, 0]}>
      <mesh position={[0, 0.06, 0]} receiveShadow><boxGeometry args={[W + 0.15, 0.12, D + 0.15]} /><Std color="#7a4f2c" /></mesh>
      <mesh position={[0, 0.12 + H / 2, 0]} castShadow receiveShadow><boxGeometry args={[W, H, D]} /><Std color="#c48a4f" /></mesh>
      {/* Plank lines */}
      {[0.32, 0.6, 0.88].map((h) => (
        <mesh key={h} position={[0, 0.12 + h, 0]}><boxGeometry args={[W + 0.01, 0.025, D + 0.01]} /><Std color="#9b6a3e" /></mesh>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={sd} geometry={gable} position={[0, 0.12 + H, sd * (D / 2 + 0.001)]} rotation={[0, sd > 0 ? 0 : Math.PI, 0]}>
          <Std color="#c48a4f" side={THREE.DoubleSide} />
        </mesh>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * (W / 4 + 0.06), 0.12 + H + roofH / 2, 0]} rotation={[0, 0, -sd * ang]} castShadow>
          <boxGeometry args={[slope, 0.08, D + 0.35]} />
          <Std color="#b5432f" />
        </mesh>
      ))}
      {/* Arched doorway */}
      <mesh position={[0, 0.12 + 0.3, D / 2 + 0.005]}><boxGeometry args={[0.5, 0.6, 0.02]} /><meshBasicMaterial color="#1e1612" /></mesh>
      <mesh position={[0, 0.12 + 0.6, D / 2 + 0.005]}><circleGeometry args={[0.25, 14, 0, Math.PI]} /><meshBasicMaterial color="#1e1612" /></mesh>
      {/* Bowl + bone */}
      <mesh position={[0.45, 0.07, D / 2 + 0.55]}><cylinderGeometry args={[0.17, 0.13, 0.1, 12]} /><Std color="#3d6fa8" /></mesh>
      <mesh position={[0.45, 0.115, D / 2 + 0.55]}><cylinderGeometry args={[0.13, 0.13, 0.01, 12]} /><Std color="#8a5a3c" /></mesh>
      <group position={[-0.35, 0.05, D / 2 + 0.6]} rotation={[0, 0.6, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.3, 6]} /><Std color="#f4efe4" /></mesh>
        {[-0.16, 0.16].flatMap((x) => [-0.035, 0.035].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0, z]}><sphereGeometry args={[0.045, 6, 4]} /><Std color="#f4efe4" /></mesh>
        )))}
      </group>
    </group>
  )
}

// A dark tabby cat with a white chest patrolling round the back of the cabin, sitting down at each corner for a wash.
const CAT_ROUTE = [[4.4, 1.6], [4.4, -3.3], [-4.4, -3.3], [-4.4, 1.6]].map(([x, z]) => campLocal(x, z))

function Cat() {
  const root = useRef()
  const body = useRef()
  const tail = useRef()
  const head = useRef()
  const legs = useRef([])
  const s = useRef({ seg: 0, u: 0, dir: 1, sit: 2, phase: 0, heading: 0 })
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const c = s.current
    const t = st.clock.elapsedTime
    let speed = 0
    if (c.sit > 0) {
      c.sit -= dt
    } else {
      const a = CAT_ROUTE[c.seg], b = CAT_ROUTE[c.seg + 1]
      const len = Math.hypot(b.x - a.x, b.z - a.z)
      speed = 1.1
      c.u += (speed * dt * c.dir) / len
      if (c.u >= 1 || c.u <= 0) {
        c.u = Math.min(1, Math.max(0, c.u))
        const atEnd = (c.dir > 0 && c.seg === CAT_ROUTE.length - 2 && c.u === 1) || (c.dir < 0 && c.seg === 0 && c.u === 0)
        if (atEnd) { c.dir = -c.dir; c.sit = 3 + Math.random() * 4 }
        else if (c.dir > 0) { c.seg++; c.u = 0 }
        else { c.seg--; c.u = 1 }
      }
    }
    const a = CAT_ROUTE[c.seg], b = CAT_ROUTE[c.seg + 1]
    const x = a.x + (b.x - a.x) * c.u, z = a.z + (b.z - a.z) * c.u
    if (speed > 0) {
      const want = Math.atan2((b.x - a.x) * c.dir, (b.z - a.z) * c.dir)
      const diff = ((want - c.heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      c.heading += diff * Math.min(1, dt * 6)
    }
    c.phase += speed * dt * 9
    root.current.position.set(x, height(x, z), z)
    root.current.rotation.y = c.heading
    const sitting = c.sit > 0 ? 1 : 0
    body.current.rotation.x += (-0.55 * sitting - body.current.rotation.x) * Math.min(1, dt * 6)
    head.current.rotation.x = sitting ? Math.sin(t * 2) * 0.08 + 0.45 : 0
    head.current.rotation.y = sitting ? Math.sin(t * 0.7) * 0.4 : 0
    tail.current.rotation.z = Math.sin(t * (sitting ? 1.5 : 3)) * 0.35
    legs.current.forEach((l, i) => { if (l) l.rotation.x = speed ? Math.sin(c.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 : 0 })
  })
  const fur = '#47423e', stripe = '#2c2926', belly = '#f1ece0'
  return (
    <group ref={root}>
      <group ref={body} position={[0, 0.22, -0.12]}>
        <group position={[0, 0, 0.12]}>
          <mesh position={[0, 0.07, 0]} castShadow><boxGeometry args={[0.2, 0.18, 0.46]} /><Std color={fur} /></mesh>
          {[-0.1, 0.02, 0.14].map((zz) => (
            <mesh key={zz} position={[0, 0.165, zz]}><boxGeometry args={[0.205, 0.02, 0.05]} /><Std color={stripe} /></mesh>
          ))}
          <mesh position={[0, 0.0, 0.12]}><boxGeometry args={[0.14, 0.08, 0.16]} /><Std color={belly} /></mesh>
          <group ref={head} position={[0, 0.2, 0.26]}>
            <mesh castShadow><boxGeometry args={[0.2, 0.18, 0.18]} /><Std color={fur} /></mesh>
            <mesh position={[0, -0.04, 0.09]}><boxGeometry args={[0.1, 0.07, 0.04]} /><Std color={belly} /></mesh>
            {[-0.06, 0.06].map((xx) => (
              <mesh key={xx} position={[xx, 0.12, -0.01]}><coneGeometry args={[0.045, 0.1, 4]} /><Std color={fur} /></mesh>
            ))}
            {[-0.05, 0.05].map((xx) => (
              <mesh key={xx} position={[xx, 0.02, 0.092]}><boxGeometry args={[0.03, 0.035, 0.005]} /><meshBasicMaterial color="#7bc043" /></mesh>
            ))}
          </group>
          <group ref={tail} position={[0, 0.12, -0.23]}>
            <mesh position={[0, 0.16, -0.06]} rotation={[-0.35, 0, 0]}><cylinderGeometry args={[0.025, 0.03, 0.36, 5]} /><Std color={fur} /></mesh>
            <mesh position={[0, 0.34, -0.1]}><sphereGeometry args={[0.032, 5, 4]} /><Std color={stripe} /></mesh>
          </group>
        </group>
      </group>
      {[[-0.06, 0.12], [0.06, 0.12], [-0.06, -0.14], [0.06, -0.14]].map(([xx, zz], i) => (
        <group key={i} ref={(el) => (legs.current[i] = el)} position={[xx, 0.17, zz]}>
          <mesh position={[0, -0.085, 0]}><boxGeometry args={[0.05, 0.17, 0.05]} /><Std color={i < 2 ? belly : fur} /></mesh>
        </group>
      ))}
    </group>
  )
}

export default function Camp() {
  return (
    <group>
      <Cabin />
      <Swing />
      <Person spot={WOMAN} deelColor="#2f5fa8" sashColor="#e3a82b" braid />
      <Person spot={CHILD} scale={0.58} deelColor="#c8423b" sashColor="#f2c94c" hat hop waveSpeed={10} />
      <Dog />
      <Doghouse />
      <Cat />
    </group>
  )
}
