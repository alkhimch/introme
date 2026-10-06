import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { CONTACT_SIGNS, FRAMES, GERS, OVOO, SIGNPOST, STELES, ZONES, height, rng } from './layout'
import { camView, car } from './store'
import { bleat } from '../audio/sound'
import { FONT_URL } from './NameLetters'
import { developer, profile } from '../content'

const STONE = '#8f8a7f', WOOD = '#7a5236', FELT = '#f3eee3', ORANGE = '#d9622b'

const Std = (props) => <meshStandardMaterial flatShading roughness={0.95} {...props} />

// ── Ger (yurt) ──
function Ger({ x, z, r, rot }) {
  const y = height(x, z)
  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[r, r, 1.7, 20]} />
        <Std color={FELT} />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow>
        <coneGeometry args={[r * 1.1, 1.3, 20]} />
        <Std color={FELT} />
      </mesh>
      <mesh position={[0, 2.95, 0]}>
        <cylinderGeometry args={[0.38, 0.45, 0.2, 12]} />
        <Std color={ORANGE} />
      </mesh>
      {[0.35, 1.2, 1.62].map((h) => (
        <mesh key={h} position={[0, h, 0]}>
          <cylinderGeometry args={[r + 0.02, r + 0.02, 0.07, 20]} />
          <Std color="#7a4b2a" />
        </mesh>
      ))}
      <mesh position={[0, 0.7, r]}>
        <boxGeometry args={[0.9, 1.35, 0.12]} />
        <Std color={ORANGE} />
      </mesh>
      <mesh position={[0, 0.7, r + 0.07]}>
        <boxGeometry args={[0.55, 0.9, 0.02]} />
        <Std color="#f2b33d" />
      </mesh>
      <mesh position={[r * 0.45, 3.0, -r * 0.2]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.2, 6]} />
        <Std color="#5d5a55" />
      </mesh>
    </group>
  )
}

// ── Developer: Orkhon-style stone steles carrying the work history ──
function Stele({ x, z, ry, index }) {
  const job = developer.experience[index]
  const y = height(x, z)
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.6, 1.5]} />
        <Std color="#7d786e" />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 3.3, 0.5]} />
        <Std color={STONE} />
      </mesh>
      <mesh position={[0, 3.9, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 0.5, 14, 1, false, -Math.PI / 2, Math.PI]} />
        <Std color={STONE} />
      </mesh>
      {job && (
        <group position={[0, 2.7, 0.26]}>
          <Text font={FONT_URL} fontSize={0.2} maxWidth={1.25} textAlign="center" color="#2f2c27" anchorY="top" lineHeight={1.1}>
            {job.role.toUpperCase()}
          </Text>
          <Text font={FONT_URL} position={[0, -0.75, 0]} fontSize={0.17} maxWidth={1.25} textAlign="center" color="#4a463f" anchorY="top">
            {job.company}
          </Text>
          <Text font={FONT_URL} position={[0, -1.15, 0]} fontSize={0.15} maxWidth={1.25} textAlign="center" color="#5d584f" anchorY="top">
            {job.period}
          </Text>
        </group>
      )}
    </group>
  )
}

// ── Photographer: framed prints standing on the grass ──
function PhotoFrame({ x, z, ry, index, photo, onOpen }) {
  const y = height(x, z)
  const [hover, setHover] = useState(false)
  const tex = useMemo(() => {
    if (!photo) return null
    const t = photo.canvas ? new THREE.CanvasTexture(photo.canvas) : new THREE.TextureLoader().load(photo.url)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [photo])
  const g = useRef()
  useFrame((_, dt) => {
    const s = hover ? 1.06 : 1
    g.current.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, dt * 10))
  })
  if (!photo) return null
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      {[-0.95, 0.95].map((px) => (
        <mesh key={px} position={[px, 1.0, -0.05]} castShadow>
          <boxGeometry args={[0.14, 2.0, 0.14]} />
          <Std color="#5e3f29" />
        </mesh>
      ))}
      <group
        ref={g}
        position={[0, 3.2, 0]}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); if (e.delta < 6) onOpen(index) }}
      >
        <mesh castShadow>
          <boxGeometry args={[2.4, 2.95, 0.14]} />
          <Std color={WOOD} />
        </mesh>
        <mesh position={[0, 0, 0.075]}>
          <planeGeometry args={[2.12, 2.65]} />
          <meshBasicMaterial color="#f2efe8" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[1.92, 2.4]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      </group>
      <Text font={FONT_URL} position={[0, 1.4, 0.12]} fontSize={0.2} color="#fffaf0" outlineWidth={0.015} outlineColor="#3a2a1a" anchorX="center">
        {photo.title}
      </Text>
    </group>
  )
}

// ── Contact: an ovoo — a cairn with a pole and khadag strings running to the ground ──
function Ovoo() {
  const { x, z } = OVOO
  const y = height(x, z)
  const stones = useMemo(() => {
    const r = rng(5), out = []
    for (let layer = 0; layer < 9; layer++) {
      const rad = 2.3 - layer * 0.26, n = Math.max(1, Math.round(rad * 7))
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + r() * 0.6
        const rr = rad * (0.55 + r() * 0.45)
        out.push({ p: [Math.cos(a) * rr, 0.18 + layer * 0.24, Math.sin(a) * rr], s: 0.22 + r() * 0.18, ry: r() * 6, c: ['#8e8a80', '#a39e92', '#77736b'][Math.floor(r() * 3)] })
      }
    }
    return out
  }, [])
  const TOP = 5.6, REACH = 4.2
  const strings = ['#2f6fd6', '#f4f1ea', '#2f6fd6', '#f2c94c', '#2f6fd6', '#3aa36b', '#2f6fd6', '#d9483b', '#2f6fd6', '#f4f1ea']
  const len = Math.hypot(REACH, TOP), tilt = Math.atan2(REACH, TOP)
  const ribbons = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    ribbons.current.children.forEach((rb, i) => { rb.children[0].rotation.z = Math.sin(t * 2.4 + i * 1.7) * 0.06 })
  })
  return (
    <group position={[x, y, z]}>
      {stones.map((s, i) => (
        <mesh key={i} position={s.p} scale={s.s} rotation={[0, s.ry, 0]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <Std color={s.c} />
        </mesh>
      ))}
      <mesh position={[0, TOP / 2 + 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, TOP + 0.6, 6]} />
        <Std color={WOOD} />
      </mesh>
      <mesh position={[0, TOP + 0.65, 0]}>
        <coneGeometry args={[0.16, 0.4, 6]} />
        <Std color="#c9a43a" />
      </mesh>
      <group ref={ribbons}>
        {strings.map((c, i) => (
          <group key={i} rotation={[0, (i / strings.length) * Math.PI * 2, 0]}>
            <mesh position={[0, TOP / 2, REACH / 2]} rotation={[-tilt, 0, 0]}>
              <planeGeometry args={[0.16, len]} />
              <meshStandardMaterial color={c} side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Signboard({ x, z, ry, text, href }) {
  const y = height(x, z)
  const [hover, setHover] = useState(false)
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.16, 1.8, 0.16]} />
        <Std color="#5e3f29" />
      </mesh>
      <group
        position={[0, 1.9, 0.1]}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); if (e.delta < 6) window.open(href, '_blank', 'noopener') }}
      >
        <mesh castShadow>
          <boxGeometry args={[2.3, 0.75, 0.12]} />
          <Std color={hover ? '#9a6b47' : WOOD} />
        </mesh>
        <Text font={FONT_URL} position={[0, -0.02, 0.07]} fontSize={0.36} color="#fff4dc" anchorX="center" anchorY="middle">
          {text} ↗
        </Text>
      </group>
    </group>
  )
}

// ── Signpost at the start, pointing to each zone ──
function Signpost() {
  const { x, z } = SIGNPOST
  const y = height(x, z)
  const names = { work: 'Developer', hobbies: 'Hobbies', photos: 'Photography', contact: 'Contact' }
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.7, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 3.4, 6]} />
        <Std color="#5e3f29" />
      </mesh>
      {ZONES.map((zn, i) => {
        const a = Math.atan2(zn.x - x, zn.z - z)
        return (
          <group key={zn.id} position={[0, 3.0 - i * 0.48, 0]} rotation={[0, a - Math.PI / 2, 0]}>
            <mesh position={[1.05, 0, 0]} castShadow>
              <boxGeometry args={[2.1, 0.38, 0.08]} />
              <Std color={i % 2 ? '#8a5d3d' : WOOD} />
            </mesh>
            {[0.045, -0.045].map((off) => (
              <Text key={off} font={FONT_URL} position={[1.0, -0.01, off]} rotation={[0, off < 0 ? Math.PI : 0, 0]} fontSize={0.22} color="#fff4dc" anchorX="center" anchorY="middle">
                {names[zn.id]}
              </Text>
            ))}
          </group>
        )
      })}
    </group>
  )
}

// ── A small flock of sheep that scatters when the van drives through ──
function Sheep() {
  const flock = useMemo(() => {
    const r = rng(99)
    return Array.from({ length: 16 }, () => {
      const x = -52 + (r() - 0.5) * 18, z = -6 + (r() - 0.5) * 18
      return { x, z, hx: x, hz: z, heading: r() * 6.28, speed: 0, t: r() * 10, black: r() > 0.85, bleatIn: r() * 3 }
    })
  }, [])
  const refs = useRef([])
  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)
    flock.forEach((s, i) => {
      const dx = s.x - car.x, dz = s.z - car.z, d = Math.hypot(dx, dz)
      // Bleat when the van comes close (louder and more often the closer it is).
      s.bleatIn -= dt
      if (d < 16 && s.bleatIn <= 0) {
        s.bleatIn = (d < 9 ? 1.5 : 4) + Math.random() * 4
        const pan = (dx * Math.cos(camView.yaw) - dz * Math.sin(camView.yaw)) / 10
        bleat(Math.max(0.15, 1 - d / 16), pan)
      }
      if (d < 9) { s.heading = Math.atan2(dx, dz) + Math.sin(i) * 0.4; s.speed = 6 }
      else {
        s.t -= dt
        if (s.t < 0) {
          s.t = 2 + Math.random() * 5
          const hx = s.hx - s.x, hz = s.hz - s.z
          s.heading = Math.hypot(hx, hz) > 10 ? Math.atan2(hx, hz) : s.heading + (Math.random() - 0.5) * 2
          s.speed = Math.random() > 0.5 ? 0.8 : 0
        }
        s.speed *= Math.exp(-dt * 0.8)
      }
      s.x += Math.sin(s.heading) * s.speed * dt
      s.z += Math.cos(s.heading) * s.speed * dt
      const g = refs.current[i]
      if (!g) return
      const hop = s.speed > 2 ? Math.abs(Math.sin(state.clock.elapsedTime * 14 + i)) * 0.25 : 0
      g.position.set(s.x, height(s.x, s.z) + hop, s.z)
      g.rotation.y += (((s.heading - g.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * Math.min(1, dt * 6)
    })
  })
  return flock.map((s, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)}>
      <mesh position={[0, 0.75, 0]} scale={[0.6, 0.5, 0.8]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <Std color={s.black ? '#3a3633' : '#f1ece0'} />
      </mesh>
      <mesh position={[0, 0.95, 0.75]} castShadow>
        <boxGeometry args={[0.32, 0.36, 0.4]} />
        <Std color="#2b2724" />
      </mesh>
      {[[-0.25, 0.4], [0.25, 0.4], [-0.25, -0.4], [0.25, -0.4]].map(([lx, lz], k) => (
        <mesh key={k} position={[lx, 0.25, lz]}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <Std color="#2b2724" />
        </mesh>
      ))}
    </group>
  ))
}

export default function Landmarks({ photos, onOpenPhoto }) {
  return (
    <>
      {GERS.map((g, i) => <Ger key={i} {...g} />)}
      {STELES.map((s) => <Stele key={s.index} {...s} />)}
      {FRAMES.map((f) => <PhotoFrame key={f.index} {...f} photo={photos[f.index]} onOpen={onOpenPhoto} />)}
      <Ovoo />
      {CONTACT_SIGNS.map((s) => <Signboard key={s.link} {...s} href={profile.links[s.link]} />)}
      <Signpost />
      <Sheep />
    </>
  )
}
