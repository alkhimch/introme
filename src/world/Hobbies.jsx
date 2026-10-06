import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { BALL_SPAWNS, COLLIDERS, CRATES, GOAL, HOOP, WORLD_RADIUS, ZONES, height } from './layout'
import { car, commands, showToast } from './store'
import { FONT_URL } from './NameLetters'

const zone = ZONES.find((z) => z.id === 'hobbies')
const Std = (props) => <meshStandardMaterial flatShading roughness={0.9} {...props} />
const flat = [-Math.PI / 2, 0, 0]

// ── Ball physics shared by the football and the basketball ──
function useBall(spawn, radius, onUpdate) {
  const s = useMemo(() => ({ p: new THREE.Vector3(spawn.x, height(spawn.x, spawn.z) + radius, spawn.z), v: new THREE.Vector3(), cooldown: 0 }), [spawn, radius])
  const resetSeen = useRef(commands.resetCount)
  const tmp = useMemo(() => ({ axis: new THREE.Vector3(), q: new THREE.Quaternion() }), [])
  const reset = () => { s.p.set(spawn.x, height(spawn.x, spawn.z) + radius + 1, spawn.z); s.v.set(0, 0, 0) }

  useFrame((_, delta, ...rest) => {
    const dt = Math.min(delta, 1 / 30)
    if (commands.resetCount !== resetSeen.current) { resetSeen.current = commands.resetCount; reset() }
    // Van contact: transfer the van's velocity along the contact normal.
    const dx = s.p.x - car.x, dz = s.p.z - car.z, d = Math.hypot(dx, dz), min = radius + 1.5
    if (d < min && d > 0.001) {
      const nx = dx / d, nz = dz / d
      s.p.x = car.x + nx * min; s.p.z = car.z + nz * min
      const cvx = Math.sin(car.heading) * car.speed, cvz = Math.cos(car.heading) * car.speed
      const rel = (cvx - s.v.x) * nx + (cvz - s.v.z) * nz
      if (rel > 0) {
        s.v.x += nx * rel * 1.7; s.v.z += nz * rel * 1.7
        s.v.y += Math.min(6, rel * 0.35)
      }
    }
    s.v.y -= 20 * dt
    s.p.addScaledVector(s.v, dt)
    const ground = height(s.p.x, s.p.z) + radius
    if (s.p.y < ground) {
      s.p.y = ground
      s.v.y = s.v.y < -1.5 ? -s.v.y * 0.55 : 0
      const f = Math.exp(-dt * 0.7)
      s.v.x *= f; s.v.z *= f
    }
    for (const c of COLLIDERS) {
      const cx = s.p.x - c.x, cz = s.p.z - c.z, cd = Math.hypot(cx, cz), cm = c.r + radius
      if (cd < cm && cd > 0.0001) {
        const nx = cx / cd, nz = cz / cd
        s.p.x = c.x + nx * cm; s.p.z = c.z + nz * cm
        const vn = s.v.x * nx + s.v.z * nz
        if (vn < 0) { s.v.x -= 1.6 * vn * nx; s.v.z -= 1.6 * vn * nz }
      }
    }
    const r = Math.hypot(s.p.x, s.p.z)
    if (r > WORLD_RADIUS) { s.p.x *= WORLD_RADIUS / r; s.p.z *= WORLD_RADIUS / r; s.v.x *= -0.5; s.v.z *= -0.5 }
    onUpdate(s, dt, reset, tmp)
  })
  return s
}

function rollMesh(mesh, s, dt, radius, tmp) {
  mesh.position.copy(s.p)
  const sp = Math.hypot(s.v.x, s.v.z)
  if (sp > 0.01) {
    tmp.axis.set(s.v.z, 0, -s.v.x).normalize()
    tmp.q.setFromAxisAngle(tmp.axis, (sp * dt) / radius)
    mesh.quaternion.premultiply(tmp.q)
  }
}

function soccerGeometry(r) {
  const g = new THREE.IcosahedronGeometry(r, 1)
  const base = new THREE.IcosahedronGeometry(1, 0)
  const centers = []
  const bp = base.attributes.position
  for (let i = 0; i < bp.count; i++) {
    const v = new THREE.Vector3(bp.getX(i), bp.getY(i), bp.getZ(i)).normalize()
    if (!centers.some((c) => c.distanceTo(v) < 0.01)) centers.push(v)
  }
  const p = g.attributes.position, colors = new Float32Array(p.count * 3), c = new THREE.Vector3()
  for (let i = 0; i < p.count; i += 3) {
    c.set(0, 0, 0)
    for (let k = 0; k < 3; k++) c.add(new THREE.Vector3(p.getX(i + k), p.getY(i + k), p.getZ(i + k)))
    c.normalize()
    const dark = centers.some((cc) => cc.dot(c) > 0.93)
    for (let k = 0; k < 3; k++) colors.set(dark ? [0.12, 0.12, 0.12] : [0.96, 0.96, 0.94], (i + k) * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

function Football() {
  const R = 0.55
  const mesh = useRef()
  const geo = useMemo(() => soccerGeometry(R), [])
  useBall(BALL_SPAWNS.football, R, (s, dt, reset, tmp) => {
    // Goal: ball fully past the goal line between the posts.
    s.cooldown = Math.max(0, s.cooldown - dt)
    if (!s.cooldown && s.p.z < GOAL.z - R && Math.abs(s.p.x - GOAL.x) < GOAL.width / 2 - 0.2 && s.p.y < GOAL.height) {
      s.cooldown = 3
      showToast('GOAL! ⚽')
      setTimeout(reset, 1600)
    }
    if (mesh.current) rollMesh(mesh.current, s, dt, R, tmp)
  })
  return (
    <mesh ref={mesh} geometry={geo} castShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.6} />
    </mesh>
  )
}

function Basketball() {
  const R = 0.5
  const mesh = useRef()
  useBall(BALL_SPAWNS.basketball, R, (s, dt, reset, tmp) => { if (mesh.current) rollMesh(mesh.current, s, dt, R, tmp) })
  return (
    <group ref={mesh}>
      <mesh castShadow>
        <sphereGeometry args={[R, 18, 12]} />
        <Std color="#d9692a" roughness={0.8} />
      </mesh>
      {[[0, 0, 0], [Math.PI / 2, 0, 0], [0, Math.PI / 2, 0]].map((rot, i) => (
        <mesh key={i} rotation={rot}>
          <torusGeometry args={[R * 1.002, 0.018, 4, 32]} />
          <meshStandardMaterial color="#2a1a10" />
        </mesh>
      ))}
    </group>
  )
}

function Goal() {
  const { x, z, width: w, depth: d, height: h } = GOAL
  const y = height(x, z)
  const net = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', wireframe: true, transparent: true, opacity: 0.55 }), [])
  const post = (px, py, pz, sx, sy, sz, k) => (
    <mesh key={k} position={[px, py, pz]} castShadow>
      <boxGeometry args={[sx, sy, sz]} />
      <meshStandardMaterial color="#fbfbf8" roughness={0.5} />
    </mesh>
  )
  return (
    <group position={[x, y, z]}>
      {post(-w / 2, h / 2, 0, 0.16, h, 0.16, 'l')}
      {post(w / 2, h / 2, 0, 0.16, h, 0.16, 'r')}
      {post(0, h, 0, w + 0.16, 0.16, 0.16, 't')}
      <mesh position={[0, h / 2, -d]} material={net}><planeGeometry args={[w, h, 10, 5]} /></mesh>
      <mesh position={[0, h, -d / 2]} rotation={[Math.PI / 2, 0, 0]} material={net}><planeGeometry args={[w, d, 10, 3]} /></mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(sd * w) / 2, h / 2, -d / 2]} rotation={[0, Math.PI / 2, 0]} material={net}><planeGeometry args={[d, h, 3, 5]} /></mesh>
      ))}
      {/* Penalty box + centre spot painted on the grass */}
      {[[0, 0.02, 3.6, w + 6, 0.12], [-(w + 6) / 2, 0.02, 1.8, 0.12, 3.6], [(w + 6) / 2, 0.02, 1.8, 0.12, 3.6]].map(([lx, ly, lz, sx, sz], i) => (
        <mesh key={i} position={[lx, ly, lz]} rotation={flat}>
          <planeGeometry args={[sx, sz]} />
          <meshBasicMaterial color="#f7f5ee" />
        </mesh>
      ))}
      <mesh position={[0, 0.02, 0]} rotation={flat}>
        <planeGeometry args={[w + 8, 0.12]} />
        <meshBasicMaterial color="#f7f5ee" />
      </mesh>
      <mesh position={[0, 0.02, BALL_SPAWNS.football.z - z]} rotation={flat}>
        <ringGeometry args={[2.2, 2.34, 48]} />
        <meshBasicMaterial color="#f7f5ee" />
      </mesh>
    </group>
  )
}

function Hoop() {
  const { x, z } = HOOP
  const y = height(x, z)
  return (
    <group position={[x, y, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0.02, 2.4]} rotation={flat} receiveShadow>
        <planeGeometry args={[5.5, 5.2]} />
        <meshStandardMaterial color="#b4aa9a" roughness={1} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.13, 3.6, 8]} />
        <meshStandardMaterial color="#3d4a57" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 3.45, 0.35]} castShadow>
        <boxGeometry args={[0.1, 0.1, 0.7]} />
        <meshStandardMaterial color="#3d4a57" />
      </mesh>
      <mesh position={[0, 3.7, 0.72]} castShadow>
        <boxGeometry args={[1.9, 1.2, 0.07]} />
        <meshStandardMaterial color="#fbfbf8" />
      </mesh>
      <mesh position={[0, 3.55, 0.76]}>
        <boxGeometry args={[0.65, 0.48, 0.01]} />
        <meshBasicMaterial color="#d9483b" wireframe />
      </mesh>
      <mesh position={[0, 3.3, 1.08]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.03, 6, 20]} />
        <meshStandardMaterial color="#e2602a" />
      </mesh>
      <mesh position={[0, 3.05, 1.08]}>
        <cylinderGeometry args={[0.32, 0.22, 0.5, 12, 2, true]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.8} />
      </mesh>
    </group>
  )
}

// Classic wooden crate texture: planks with a frame and an X brace.
function crateTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  g.fillStyle = '#b8894f'; g.fillRect(0, 0, 128, 128)
  g.strokeStyle = 'rgba(80,50,20,0.35)'; g.lineWidth = 2
  for (let y = 21; y < 128; y += 21) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke() }
  g.fillStyle = '#8a6335'
  g.fillRect(0, 0, 128, 14); g.fillRect(0, 114, 128, 14); g.fillRect(0, 0, 14, 128); g.fillRect(114, 0, 14, 128)
  g.strokeStyle = '#8a6335'; g.lineWidth = 13
  g.beginPath(); g.moveTo(10, 10); g.lineTo(118, 118); g.stroke()
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Crates() {
  const tex = useMemo(crateTexture, [])
  const base = CRATES[0]
  return (
    <group>
      {CRATES.map((c, i) => (
        <mesh key={i} position={[c.x, height(c.x, c.z) + c.y + c.s / 2, c.z]} rotation={[0, c.ry, 0]} castShadow receiveShadow>
          <boxGeometry args={[c.s, c.s, c.s]} />
          <meshStandardMaterial map={tex} roughness={0.9} />
        </mesh>
      ))}
      <Text font={FONT_URL} position={[base.x + 0.9, height(base.x, base.z) + 0.03, base.z + 5.6]} rotation={flat} fontSize={2.6} color="#e0582f" anchorX="center" anchorY="middle" fillOpacity={0.85}>
        A
      </Text>
      <Text font={FONT_URL} position={[base.x + 0.9, height(base.x, base.z) + 0.03, base.z + 7.3]} rotation={flat} fontSize={0.42} letterSpacing={0.2} color="#fff6dc" anchorX="center" outlineWidth={0.02} outlineColor="#6d5f3f">
        BOMBSITE · CS2
      </Text>
    </group>
  )
}

function SmallLabel({ x, z, children }) {
  return (
    <Text font={FONT_URL} position={[x, height(x, z) + 0.04, z]} rotation={flat} fontSize={0.5} letterSpacing={0.18} color="#fff6dc" anchorX="center" outlineWidth={0.025} outlineColor="#6d5f3f">
      {children}
    </Text>
  )
}

export default function Hobbies() {
  return (
    <group>
      <Goal />
      <Hoop />
      <Crates />
      <Football />
      <Basketball />
      <SmallLabel x={GOAL.x} z={GOAL.z + 5}>FOOTBALL</SmallLabel>
      <SmallLabel x={HOOP.x + 2.4} z={HOOP.z + 3.6}>BASKETBALL</SmallLabel>
      <SmallLabel x={zone.x} z={zone.z + zone.r - 0.8}>DRIVE THE BALL INTO THE GOAL</SmallLabel>
    </group>
  )
}
