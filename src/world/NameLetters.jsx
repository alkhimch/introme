import { useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { NAME_POS, height } from './layout'
import { car, commands } from './store'
import { profile } from '../content'

export const FONT_URL = 'fonts/josefin-sans-latin-700-normal.woff'
const SIZE = 2.6, DEPTH = 0.7, GAP = 0.32
const HALF_PI = Math.PI / 2

// Big extruded name you can knock over — a nod to Bruno Simon's folio.
export default function NameLetters() {
  const font = useLoader(FontLoader, 'fonts/josefin-bold.typeface.json')
  const word = profile.firstName.toUpperCase()

  const letters = useMemo(() => {
    const items = []
    let cursor = 0
    for (const ch of word) {
      const geo = new TextGeometry(ch, { font, size: SIZE, depth: DEPTH, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2 })
      geo.computeBoundingBox()
      const bb = geo.boundingBox
      const w = bb.max.x - bb.min.x
      // Pivot at bottom-centre so letters tip over their base.
      geo.translate(-(bb.min.x + w / 2), -bb.min.y, -DEPTH / 2)
      items.push({ geo, w, offset: cursor + w / 2 })
      cursor += w + GAP
    }
    const total = cursor - GAP
    return items.map((it) => {
      const x = NAME_POS.x + it.offset - total / 2
      return { ...it, home: new THREE.Vector3(x, height(x, NAME_POS.z), NAME_POS.z), radius: Math.max(0.65, it.w / 2) }
    })
  }, [font, word])

  const sim = useMemo(() => letters.map((l) => ({
    p: l.home.clone(), v: new THREE.Vector3(), yaw: 0, yawV: 0, tilt: 0, tiltV: 0, dir: 0,
  })), [letters])
  const refs = useRef([])
  const resetSeen = useRef(0)
  const q = useMemo(() => ({ a: new THREE.Quaternion(), b: new THREE.Quaternion(), c: new THREE.Quaternion(), y: new THREE.Vector3(0, 1, 0), axis: new THREE.Vector3() }), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    if (commands.resetCount !== resetSeen.current) {
      resetSeen.current = commands.resetCount
      sim.forEach((s, i) => { s.p.copy(letters[i].home); s.v.set(0, 0, 0); s.yaw = s.yawV = s.tilt = s.tiltV = 0 })
    }
    const fx = Math.sin(car.heading), fz = Math.cos(car.heading)
    sim.forEach((s, i) => {
      const l = letters[i]
      // Car hit
      const dx = s.p.x - car.x, dz = s.p.z - car.z
      const d = Math.hypot(dx, dz), min = l.radius + 1.45
      if (d < min && d > 0.001) {
        const nx = dx / d, nz = dz / d
        const sp = Math.abs(car.speed)
        s.p.x = car.x + nx * min
        s.p.z = car.z + nz * min
        if (sp > 1.5) {
          const imp = sp * 0.75
          s.v.x += nx * imp * 0.6 + fx * car.speed * 0.5
          s.v.z += nz * imp * 0.6 + fz * car.speed * 0.5
          s.v.y = Math.min(7, 1.5 + sp * 0.28)
          s.dir = Math.atan2(s.v.x, s.v.z)
          s.tiltV += sp * 0.35
          s.yawV += (Math.random() - 0.5) * sp * 0.5
          car.speed *= 0.86
        }
      }
      // Integrate
      s.v.y -= 22 * dt
      s.p.addScaledVector(s.v, dt)
      const ground = height(s.p.x, s.p.z)
      const grounded = s.p.y <= ground + 0.001
      if (grounded) {
        s.p.y = ground
        if (s.v.y < 0) s.v.y = -s.v.y * 0.25
        if (s.v.y < 0.6) s.v.y = 0
        const f = Math.exp(-dt * 4)
        s.v.x *= f; s.v.z *= f
        s.yawV *= Math.exp(-dt * 5)
      }
      s.yaw += s.yawV * dt
      // Tipping: past ~25° it falls flat, below that it rocks back upright.
      s.tiltV += (s.tilt > 0.45 ? 9 : -9) * dt * (s.tilt > 0 || s.tiltV > 0 ? 1 : 0)
      s.tiltV *= Math.exp(-dt * 1.5)
      s.tilt += s.tiltV * dt
      if (s.tilt > HALF_PI) { s.tilt = HALF_PI; s.tiltV = -Math.abs(s.tiltV) * 0.2 }
      if (s.tilt < 0) { s.tilt = 0; s.tiltV = 0 }

      const m = refs.current[i]
      if (!m) return
      m.position.copy(s.p)
      q.axis.set(Math.cos(s.dir), 0, -Math.sin(s.dir))
      q.a.setFromAxisAngle(q.axis, s.tilt)
      q.b.setFromAxisAngle(q.y, s.yaw)
      m.quaternion.copy(q.a).multiply(q.b)
    })
  })

  return (
    <group>
      {letters.map((l, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} geometry={l.geo} castShadow receiveShadow>
          <meshStandardMaterial color="#f6f0e2" roughness={0.6} />
        </mesh>
      ))}
      <Text
        font={FONT_URL}
        fontSize={0.95}
        letterSpacing={0.18}
        color="#fffaf0"
        outlineWidth={0.03}
        outlineColor="#6d5f3f"
        position={[NAME_POS.x, height(NAME_POS.x, NAME_POS.z + 3) + 0.05, NAME_POS.z + 3]}
        rotation={[-HALF_PI, 0, 0]}
        anchorX="center"
        anchorY="middle"
      >
        DEVELOPER · MATHEMATICIAN · PHOTOGRAPHER
      </Text>
    </group>
  )
}
