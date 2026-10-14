import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { NAADAM, NAADAM_SPOTS, height } from './layout'
import { FONT_URL } from './NameLetters'

const Std = (props) => <meshStandardMaterial flatShading roughness={0.9} {...props} />
const SKIN = '#c98f68'

// A Mongolian wrestler: bare chest, zodog (open vest with sleeves), shuudag (briefs), gutal boots.
function Wrestler({ zodog, armsRef }) {
  return (
    <group>
      {[-0.13, 0.13].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.14, 0.05]}><boxGeometry args={[0.18, 0.28, 0.32]} /><Std color="#7a2a20" /></mesh>
          <mesh position={[0, 0.16, 0.24]} rotation={[0.6, 0, 0]}><boxGeometry args={[0.16, 0.1, 0.14]} /><Std color="#7a2a20" /></mesh>
          <mesh position={[0, 0.55, 0]}><cylinderGeometry args={[0.08, 0.09, 0.55, 6]} /><Std color={SKIN} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.9, 0]}><boxGeometry args={[0.42, 0.2, 0.26]} /><Std color={zodog} /></mesh>
      <mesh position={[0, 1.25, 0]} castShadow><boxGeometry args={[0.46, 0.55, 0.28]} /><Std color={SKIN} /></mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * 0.2, 1.3, 0]}><boxGeometry args={[0.1, 0.5, 0.3]} /><Std color={zodog} /></mesh>
      ))}
      <mesh position={[0, 1.48, -0.1]}><boxGeometry args={[0.48, 0.16, 0.1]} /><Std color={zodog} /></mesh>
      <mesh position={[0, 1.68, 0]} castShadow><sphereGeometry args={[0.15, 10, 8]} /><Std color={SKIN} /></mesh>
      <group ref={armsRef}>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[sd * 0.28, 1.45, 0]} rotation={[-1.1, 0, sd * 0.15]}>
            <mesh position={[0, -0.28, 0]}><cylinderGeometry args={[0.07, 0.08, 0.56, 6]} /><Std color={zodog} /></mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Wrestlers() {
  const pair = useRef()
  const a = useRef()
  const b = useRef()
  const { x, z } = NAADAM_SPOTS.wrestlers
  useFrame((st) => {
    const t = st.clock.elapsedTime
    // Circling slowly while leaning into each other, with the occasional shove.
    pair.current.rotation.y = t * 0.25
    const shove = Math.sin(t * 1.3) * 0.08 + Math.sin(t * 3.1) * 0.03
    a.current.position.z = -0.38 + shove
    b.current.position.z = 0.38 + shove
    a.current.rotation.x = 0.45 + Math.sin(t * 2.2) * 0.04
    b.current.rotation.x = 0.45 - Math.sin(t * 2.2) * 0.04
  })
  return (
    <group position={[x, height(x, z), z]}>
      <group ref={pair}>
        <group ref={a} position={[0, 0, -0.38]}><Wrestler zodog="#c4272f" /></group>
        <group ref={b} position={[0, 0, 0.38]} rotation={[0, Math.PI, 0]}>
          <group><Wrestler zodog="#1f4f9a" /></group>
        </group>
      </group>
    </group>
  )
}

// The winner's eagle dance (devekh): arms spread like wings, slowly flapping.
function EagleDancer() {
  const root = useRef()
  const arms = useRef()
  const { x, z } = NAADAM_SPOTS.dancer
  useFrame((st) => {
    const t = st.clock.elapsedTime
    root.current.rotation.y = Math.sin(t * 0.4) * 1.2
    root.current.position.y = height(x, z) + Math.abs(Math.sin(t * 1.6)) * 0.08
    arms.current.children.forEach((arm, i) => {
      const sd = i === 0 ? -1 : 1
      arm.rotation.set(0, 0, sd * (1.35 + Math.sin(t * 1.6) * 0.35))
    })
  })
  return (
    <group ref={root} position={[x, height(x, z), z]}>
      <Wrestler zodog="#c4272f" armsRef={arms} />
    </group>
  )
}

// Archer (with a bow) shooting arrows at a wall of sur targets.
function Archery() {
  const arrow = useRef()
  const { archer, targets } = NAADAM_SPOTS
  const ay = height(archer.x, archer.z), ty = height(targets.x, targets.z)
  const dir = Math.atan2(targets.x - archer.x, targets.z - archer.z)
  const sur = useMemo(() => {
    const out = []
    for (let row = 0; row < 3; row++) for (let col = 0; col < 8 - row; col++) out.push([(col - (7 - row) / 2) * 0.26, 0.12 + row * 0.22, row])
    return out
  }, [])
  useFrame((st) => {
    // One arrow every 3 seconds, flying in a shallow arc.
    const t = (st.clock.elapsedTime % 3) / 1.1
    const g = arrow.current
    g.visible = t < 1
    if (t >= 1) return
    const sx = archer.x + Math.sin(dir) * 0.6, sz = archer.z + Math.cos(dir) * 0.6
    g.position.set(sx + (targets.x - sx) * t, ay + 1.45 + Math.sin(t * Math.PI) * 1.6 - t * (ay + 1.2 - ty - 0.3), sz + (targets.z - sz) * t)
    g.rotation.set(-(Math.cos(t * Math.PI) * 0.6), dir, 0, 'YXZ')
  })
  return (
    <group>
      <group position={[archer.x, ay, archer.z]} rotation={[0, dir, 0]}>
        <Wrestler zodog="#2f7a4a" />
        {/* Bow held out in front */}
        <mesh position={[0.05, 1.45, 0.62]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.55, 0.025, 4, 16, Math.PI]} />
          <Std color="#6a4426" />
        </mesh>
      </group>
      <group position={[targets.x, ty, targets.z]} rotation={[0, dir, 0]}>
        {sur.map(([x, y, row], i) => (
          <mesh key={i} position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.2, 8]} />
            <Std color={(i + row) % 3 === 0 ? '#c4272f' : '#efe6cf'} />
          </mesh>
        ))}
      </group>
      <group ref={arrow}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.015, 0.015, 0.8, 4]} /><Std color="#d9b38c" /></mesh>
        <mesh position={[0, 0, -0.38]}><boxGeometry args={[0.1, 0.01, 0.12]} /><Std color="#c4272f" /></mesh>
      </group>
    </group>
  )
}

// Ring of colourful flags on poles around the field.
const FLAG_COLORS = ['#1f4f9a', '#c4272f', '#f2c94c', '#3aa36b', '#f4f1ea', '#1f4f9a', '#c4272f', '#f2c94c', '#3aa36b']
function Flags() {
  const group = useRef()
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0); s.lineTo(1.1, -0.3); s.lineTo(0, -0.6); s.closePath()
    return new THREE.ShapeGeometry(s)
  }, [])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    group.current.children.forEach((pole, i) => { pole.children[1].rotation.y = Math.sin(t * 2.5 + i) * 0.35 })
  })
  return (
    <group ref={group}>
      {FLAG_COLORS.map((c, i) => {
        const a = (i / FLAG_COLORS.length) * Math.PI * 2
        const x = NAADAM.x + Math.cos(a) * NAADAM.r, z = NAADAM.z + Math.sin(a) * NAADAM.r
        return (
          <group key={i} position={[x, height(x, z), z]}>
            <mesh position={[0, 1.8, 0]} castShadow><cylinderGeometry args={[0.05, 0.06, 3.6, 6]} /><Std color="#f4efe4" /></mesh>
            <mesh geometry={shape} position={[0.03, 3.5, 0]}>
              <meshStandardMaterial color={c} side={THREE.DoubleSide} roughness={0.8} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

export default function Naadam() {
  const y = height(NAADAM.x, NAADAM.z)
  return (
    <group>
      <Wrestlers />
      <EagleDancer />
      <Archery />
      <Flags />
      <mesh position={[NAADAM.x, y + 0.03, NAADAM.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[NAADAM.r - 0.25, NAADAM.r, 72]} />
        <meshBasicMaterial color="#fff6dc" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <Text font={FONT_URL} position={[NAADAM.x, y + 0.05, NAADAM.z + NAADAM.r + 1.8]} rotation={[-Math.PI / 2, 0, 0]} fontSize={1.5} letterSpacing={0.12} color="#fffaf0" outlineWidth={0.04} outlineColor="#6d5f3f" anchorX="center" anchorY="middle">
        NAADAM
      </Text>
    </group>
  )
}
