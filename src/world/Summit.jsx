import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { SUMMIT, SUMMIT_BENCH, SUMMIT_FLAG, height, rng } from './layout'
import { car, showToast, useSeason } from './store'
import { FONT_URL } from './NameLetters'

const Std = (props) => <meshStandardMaterial flatShading roughness={0.9} {...props} />

// Mongolian flag: red–blue–red with a simplified golden Soyombo on the hoist side.
function flagTexture() {
  const c = document.createElement('canvas')
  c.width = 240; c.height = 120
  const g = c.getContext('2d')
  g.fillStyle = '#c4272f'; g.fillRect(0, 0, 240, 120)
  g.fillStyle = '#015197'; g.fillRect(80, 0, 80, 120)
  g.fillStyle = '#f9cf02'
  const cx = 40
  // flame
  g.beginPath(); g.moveTo(cx, 10); g.lineTo(cx - 7, 24); g.lineTo(cx + 7, 24); g.fill()
  // sun and moon
  g.beginPath(); g.arc(cx, 31, 6, 0, Math.PI * 2); g.fill()
  g.beginPath(); g.arc(cx, 41, 8, 0, Math.PI); g.fill()
  // triangles, bars and yin-yang disc
  g.beginPath(); g.moveTo(cx - 9, 52); g.lineTo(cx + 9, 52); g.lineTo(cx, 60); g.fill()
  g.fillRect(cx - 9, 62, 18, 4)
  g.beginPath(); g.arc(cx, 76, 8, 0, Math.PI * 2); g.fill()
  g.fillRect(cx - 9, 86, 18, 4)
  g.beginPath(); g.moveTo(cx - 9, 92); g.lineTo(cx + 9, 92); g.lineTo(cx, 100); g.fill()
  g.fillRect(cx - 16, 50, 4, 52); g.fillRect(cx + 12, 50, 4, 52)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Flag() {
  const y = height(SUMMIT_FLAG.x, SUMMIT_FLAG.z)
  const cloth = useRef()
  const geo = useMemo(() => new THREE.PlaneGeometry(2.0, 1.0, 16, 4).translate(1.0, 0, 0), [])
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo])
  const tex = useMemo(flagTexture, [])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    const p = geo.attributes.position.array
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i]
      p[i + 2] = Math.sin(x * 3 - t * 6) * 0.12 * x
      p[i + 1] = base[i + 1] - x * 0.04
    }
    geo.attributes.position.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    <group position={[SUMMIT_FLAG.x, y, SUMMIT_FLAG.z]}>
      <mesh position={[0, 2.4, 0]} castShadow><cylinderGeometry args={[0.06, 0.08, 4.8, 8]} /><meshStandardMaterial color="#d8d8d2" metalness={0.4} roughness={0.4} /></mesh>
      <mesh position={[0, 4.85, 0]}><sphereGeometry args={[0.1, 8, 6]} /><meshStandardMaterial color="#e2c25a" metalness={0.6} roughness={0.3} /></mesh>
      <mesh ref={cloth} geometry={geo} position={[0.05, 4.2, 0]} castShadow>
        <meshStandardMaterial map={tex} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    </group>
  )
}

function Bench() {
  const { x, z, ry } = SUMMIT_BENCH
  const winter = useSeason() === 'winter'
  return (
    <group position={[x, height(x, z), z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[1.8, 0.1, 0.5]} /><Std color="#8a5d36" /></mesh>
      <mesh position={[0, 0.85, -0.24]} rotation={[-0.15, 0, 0]} castShadow><boxGeometry args={[1.8, 0.45, 0.08]} /><Std color="#8a5d36" /></mesh>
      {[-0.75, 0.75].map((lx) => (
        <mesh key={lx} position={[lx, 0.25, 0]}><boxGeometry args={[0.1, 0.5, 0.45]} /><Std color="#5e3f29" /></mesh>
      ))}
      {winter && <mesh position={[0, 0.58, 0]}><boxGeometry args={[1.75, 0.06, 0.45]} /><Std color="#f4f7fa" /></mesh>}
    </group>
  )
}

// A little cairn at the foot of the flagpole.
function Cairn() {
  const stones = useMemo(() => {
    const r = rng(12), out = []
    for (let i = 0; i < 14; i++) {
      const layer = Math.floor(i / 5), a = r() * 6.28, rr = 0.7 - layer * 0.25
      out.push({ p: [Math.cos(a) * rr, 0.15 + layer * 0.28, Math.sin(a) * rr], s: 0.22 + r() * 0.12 })
    }
    return out
  }, [])
  // The flagpole rises out of the cairn.
  const at = SUMMIT_FLAG
  const y = height(at.x, at.z)
  return (
    <group position={[at.x, y, at.z]}>
      {stones.map((s, i) => (
        <mesh key={i} position={s.p} scale={s.s} castShadow><dodecahedronGeometry args={[1, 0]} /><Std color={i % 2 ? '#8e8a80' : '#a39e92'} /></mesh>
      ))}
    </group>
  )
}

export default function Summit() {
  const reached = useRef(false)
  useFrame(() => {
    const d = Math.hypot(car.x - SUMMIT.x, car.z - SUMMIT.z)
    if (d < 5 && !reached.current) { reached.current = true; showToast('Summit reached! 🏔', 2600) }
    else if (d > 12) reached.current = false
  })
  const y = height(SUMMIT.x, SUMMIT.z)
  return (
    <group>
      <Flag />
      <Bench />
      <Cairn />
      <Text font={FONT_URL} position={[SUMMIT.x, y + 0.05, SUMMIT.z]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.7} letterSpacing={0.2} color="#fffaf0" outlineWidth={0.03} outlineColor="#6d5f3f" anchorX="center" anchorY="middle">
        SUMMIT
      </Text>
    </group>
  )
}
