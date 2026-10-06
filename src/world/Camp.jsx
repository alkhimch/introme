import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMP, SWING, WOMAN, height } from './layout'
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
  const W = 7, D = 4.6, H = 2.8, roofH = 1.9
  const slope = Math.hypot(D / 2 + 0.5, roofH), ang = Math.atan2(roofH, D / 2 + 0.5)
  const gable = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(0, roofH); sh.closePath()
    return new THREE.ShapeGeometry(sh)
  }, [D, roofH])
  const y = height(CAMP.x, CAMP.z)
  return (
    <group position={[CAMP.x, y, CAMP.z]} rotation={[0, CAMP.ry, 0]}>
      {/* Stone foundation + log walls */}
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow><boxGeometry args={[W + 0.3, 0.4, D + 0.3]} /><Std color="#8e8a80" /></mesh>
      <mesh position={[0, 0.4 + H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
      {/* Gable ends */}
      {[-1, 1].map((side) => (
        <mesh key={side} geometry={gable} position={[side * (W / 2 + 0.001), 0.4 + H, 0]} rotation={[0, side * Math.PI / 2, 0]}>
          <meshStandardMaterial map={tex} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Red roof */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 0.4 + H + roofH / 2, side * (D / 4 + 0.25)]} rotation={[side * ang, 0, 0]} castShadow>
          <boxGeometry args={[W + 0.9, 0.14, slope]} />
          <Std color="#b5432f" />
        </mesh>
      ))}
      <mesh position={[0, 0.4 + H + roofH + 0.05, 0]}><boxGeometry args={[W + 0.95, 0.16, 0.24]} /><Std color="#8c2f21" /></mesh>
      {/* Chimney */}
      <mesh position={[W / 2 - 1.3, 0.4 + H + roofH * 0.9, -0.6]} castShadow><boxGeometry args={[0.55, 1.6, 0.55]} /><Std color="#9a5a44" /></mesh>
      {/* Door, porch, steps */}
      <mesh position={[0, 0.4 + 1.05, D / 2 + 0.03]}><boxGeometry args={[1.1, 2.1, 0.08]} /><Std color="#3d6fa8" /></mesh>
      <mesh position={[0.35, 0.4 + 1.05, D / 2 + 0.09]}><sphereGeometry args={[0.06, 8, 6]} /><meshStandardMaterial color="#e2c25a" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[0, 0.45, D / 2 + 0.9]} castShadow receiveShadow><boxGeometry args={[3.2, 0.12, 1.7]} /><Std color="#9b6a3e" /></mesh>
      <mesh position={[0, 0.22, D / 2 + 2.0]} receiveShadow><boxGeometry args={[1.6, 0.12, 0.5]} /><Std color="#8a5d36" /></mesh>
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 0.4 + 1.3, D / 2 + 1.65]} castShadow><boxGeometry args={[0.14, 2.6, 0.14]} /><Std color="#7a4f2c" /></mesh>
      ))}
      <mesh position={[0, 0.4 + 2.65, D / 2 + 0.95]} rotation={[0.25, 0, 0]} castShadow><boxGeometry args={[3.6, 0.1, 1.9]} /><Std color="#b5432f" /></mesh>
      {/* Windows */}
      <Window position={[-2.3, 0.4 + 1.5, D / 2 + 0.03]} />
      <Window position={[2.3, 0.4 + 1.5, D / 2 + 0.03]} />
      <Window position={[W / 2 + 0.03, 0.4 + 1.5, 0]} ry={Math.PI / 2} />
      <Window position={[-W / 2 - 0.03, 0.4 + 1.5, 0]} ry={-Math.PI / 2} />
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

// A woman in a blue deel with a golden sash; she turns and waves when the van comes by.
function Woman() {
  const root = useRef()
  const arm = useRef()
  const body = useRef()
  const y = height(WOMAN.x, WOMAN.z)
  const deel = useMemo(() => {
    const pts = [[0.0, 0], [0.36, 0], [0.33, 0.35], [0.27, 0.75], [0.22, 0.95], [0.25, 1.2], [0.2, 1.38], [0.08, 1.45], [0, 1.45]]
    return new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), 14)
  }, [])
  const state = useRef({ yaw: 0, wave: 0 })
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = st.clock.elapsedTime
    const dx = car.x - WOMAN.x, dz = car.z - WOMAN.z, d = Math.hypot(dx, dz)
    const near = d < 15
    const s = state.current
    // Turn towards the van (relative to her default facing).
    const target = near ? Math.atan2(dx, dz) - WOMAN.ry : 0
    let diff = ((target - s.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI
    s.yaw += diff * Math.min(1, dt * 3)
    root.current.rotation.y = WOMAN.ry + s.yaw
    s.wave += ((near ? 1 : 0) - s.wave) * Math.min(1, dt * 4)
    // Raised arm waving side to side; relaxed arm otherwise.
    arm.current.rotation.z = 0.2 + s.wave * 2.3
    arm.current.rotation.x = s.wave * Math.sin(t * 7) * 0.35
    body.current.position.y = Math.sin(t * 1.6) * 0.008
  })
  return (
    <group position={[WOMAN.x, y, WOMAN.z]} ref={root}>
      <group ref={body}>
        {/* Boots */}
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.06, 0.04]} castShadow><boxGeometry args={[0.16, 0.12, 0.3]} /><Std color="#2b2420" /></mesh>
        ))}
        {/* Deel */}
        <mesh geometry={deel} position={[0, 0.1, 0]} castShadow><Std color="#2f5fa8" /></mesh>
        {/* Sash */}
        <mesh position={[0, 0.1 + 0.95, 0]}><cylinderGeometry args={[0.235, 0.24, 0.16, 14]} /><Std color="#e3a82b" /></mesh>
        {/* Diagonal trim (enger) */}
        <mesh position={[0.1, 0.1 + 1.28, 0.17]} rotation={[0.2, 0, -0.6]}><boxGeometry args={[0.04, 0.32, 0.03]} /><Std color="#e3a82b" /></mesh>
        {/* Neck + head */}
        <mesh position={[0, 1.62, 0]}><cylinderGeometry args={[0.06, 0.07, 0.12, 8]} /><Std color="#d9a77f" /></mesh>
        <mesh position={[0, 1.8, 0]} castShadow><sphereGeometry args={[0.17, 12, 10]} /><Std color="#d9a77f" /></mesh>
        {/* Hair: cap + long braid */}
        <mesh position={[0, 1.85, -0.02]}><sphereGeometry args={[0.18, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} /><Std color="#1e1714" /></mesh>
        <mesh position={[0, 1.45, -0.17]} rotation={[0.12, 0, 0]}><cylinderGeometry args={[0.045, 0.03, 0.6, 6]} /><Std color="#1e1714" /></mesh>
        {/* Eyes */}
        {[-0.06, 0.06].map((x) => (
          <mesh key={x} position={[x, 1.82, 0.155]}><sphereGeometry args={[0.018, 6, 4]} /><meshBasicMaterial color="#1e1714" /></mesh>
        ))}
        {/* Left arm (relaxed) */}
        <group position={[-0.24, 1.42, 0]} rotation={[0, 0, -0.2]}>
          <mesh position={[0, -0.3, 0]} castShadow><cylinderGeometry args={[0.06, 0.07, 0.6, 7]} /><Std color="#2f5fa8" /></mesh>
          <mesh position={[0, -0.63, 0]}><sphereGeometry args={[0.055, 8, 6]} /><Std color="#d9a77f" /></mesh>
        </group>
        {/* Right arm (waves) */}
        <group ref={arm} position={[0.24, 1.42, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow><cylinderGeometry args={[0.06, 0.07, 0.6, 7]} /><Std color="#2f5fa8" /></mesh>
          <mesh position={[0, -0.63, 0]}><sphereGeometry args={[0.055, 8, 6]} /><Std color="#d9a77f" /></mesh>
        </group>
      </group>
    </group>
  )
}

export default function Camp() {
  return (
    <group>
      <Cabin />
      <Swing />
      <Woman />
    </group>
  )
}
