import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { CAMERA_OFFSET, COLLIDERS, SPAWN, WORLD_RADIUS, ZONES, height, normal, zoneById } from './layout'
import { camView, car, commands, initCamView, input } from './store'
import { updateVehicleAudio } from '../audio/sound'

const MAX_SPEED = 20, MAX_REVERSE = -8, ACCEL = 16, BRAKE = 34, TURN = 2.1
const CAR_RADIUS = 1.5
const SUN_DIR = new THREE.Vector3(-0.55, 1, 0.45).normalize()

const OLIVE = '#6b7a45', CREAM = '#ece4cf', GLASS = '#1d2730', DARK = '#23211e'

function Wheel({ position, wheelRef }) {
  return (
    <group position={position} ref={wheelRef}>
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.32, 14]} />
          <meshStandardMaterial color={DARK} roughness={0.9} flatShading />
        </mesh>
        <mesh position={[0, position[0] > 0 ? 0.17 : -0.17, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 10]} />
          <meshStandardMaterial color="#9a9a90" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

// UAZ-452 "Purgon" — the van of every countryside trip in Mongolia.
function Van({ bodyRef, wheels }) {
  return (
    <group>
      <group ref={bodyRef}>
        <RoundedBox args={[1.72, 0.95, 3.4]} radius={0.14} position={[0, 0.98, 0]} castShadow>
          <meshStandardMaterial color={OLIVE} roughness={0.7} flatShading />
        </RoundedBox>
        <RoundedBox args={[1.66, 0.8, 3.15]} radius={0.16} position={[0, 1.78, -0.08]} castShadow>
          <meshStandardMaterial color={OLIVE} roughness={0.7} flatShading />
        </RoundedBox>
        <RoundedBox args={[1.6, 0.12, 3.0]} radius={0.05} position={[0, 2.2, -0.08]} castShadow>
          <meshStandardMaterial color={CREAM} roughness={0.8} />
        </RoundedBox>
        {/* Windows */}
        {[-1, 1].map((side) =>
          [1.0, 0.1, -0.8].map((z) => (
            <mesh key={side + '' + z} position={[side * 0.835, 1.82, z]}>
              <boxGeometry args={[0.02, 0.44, 0.68]} />
              <meshStandardMaterial color={GLASS} roughness={0.2} metalness={0.3} />
            </mesh>
          )),
        )}
        <mesh position={[0, 1.84, 1.48]} rotation={[-0.08, 0, 0]}>
          <boxGeometry args={[1.42, 0.5, 0.02]} />
          <meshStandardMaterial color={GLASS} roughness={0.15} metalness={0.3} />
        </mesh>
        {/* Front: grille, headlights, bumpers */}
        <mesh position={[0, 1.05, 1.71]}>
          <boxGeometry args={[0.7, 0.28, 0.02]} />
          <meshStandardMaterial color={DARK} />
        </mesh>
        {[-0.58, 0.58].map((x) => (
          <mesh key={x} position={[x, 1.07, 1.71]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.06, 12]} />
            <meshStandardMaterial color="#fff6d8" emissive="#fff0b8" emissiveIntensity={0.6} />
          </mesh>
        ))}
        {[-0.62, 0.62].map((x) => (
          <mesh key={x} position={[x, 1.0, -1.71]}>
            <boxGeometry args={[0.18, 0.22, 0.04]} />
            <meshStandardMaterial color="#c0392b" emissive="#7a1c12" />
          </mesh>
        ))}
        {[1.75, -1.75].map((z) => (
          <mesh key={z} position={[0, 0.58, z]} castShadow>
            <boxGeometry args={[1.82, 0.16, 0.14]} />
            <meshStandardMaterial color={DARK} />
          </mesh>
        ))}
        {/* Roof rack with luggage */}
        <mesh position={[0, 2.3, -0.2]}>
          <boxGeometry args={[1.4, 0.05, 2.2]} />
          <meshStandardMaterial color="#3a3530" />
        </mesh>
        <mesh position={[-0.25, 2.5, -0.5]} castShadow>
          <boxGeometry args={[0.8, 0.36, 1.1]} />
          <meshStandardMaterial color="#8a5a3c" flatShading />
        </mesh>
        <mesh position={[0.35, 2.47, 0.35]} castShadow>
          <boxGeometry args={[0.6, 0.3, 0.7]} />
          <meshStandardMaterial color="#3f6c8f" flatShading />
        </mesh>
      </group>
      <Wheel position={[-0.86, 0.42, 1.12]} wheelRef={wheels[0]} />
      <Wheel position={[0.86, 0.42, 1.12]} wheelRef={wheels[1]} />
      <Wheel position={[-0.86, 0.42, -1.12]} wheelRef={wheels[2]} />
      <Wheel position={[0.86, 0.42, -1.12]} wheelRef={wheels[3]} />
    </group>
  )
}

function Dust({ count = 48 }) {
  const ref = useRef()
  const parts = useMemo(() => Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), life: 0, size: 1 })), [count])
  const state = useRef({ i: 0, t: 0 })
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3() }), [])
  useFrame((_, dt) => {
    const st = state.current
    st.t += dt
    const sp = Math.abs(car.speed)
    if (sp > 4 && st.t > 0.035) {
      st.t = 0
      for (const side of [-0.8, 0.8]) {
        const pt = parts[st.i]
        st.i = (st.i + 1) % count
        const fx = Math.sin(car.heading), fz = Math.cos(car.heading)
        const bx = car.x - fx * 1.4 * Math.sign(car.speed) + fz * side, bz = car.z - fz * 1.4 * Math.sign(car.speed) - fx * side
        pt.p.set(bx, car.y + 0.25, bz)
        pt.v.set((Math.random() - 0.5) * 1.2 - fx * sp * 0.08, 0.8 + Math.random() * 0.8, (Math.random() - 0.5) * 1.2 - fz * sp * 0.08)
        pt.life = 1
        pt.size = 0.2 + Math.min(1, sp / MAX_SPEED) * 0.45
      }
    }
    parts.forEach((pt, i) => {
      pt.life = Math.max(0, pt.life - dt * 0.9)
      pt.p.addScaledVector(pt.v, dt)
      pt.v.multiplyScalar(Math.exp(-dt * 1.5))
      const s = pt.life > 0 ? Math.sin(pt.life * Math.PI) * pt.size * (2 - pt.life) : 0
      tmp.s.setScalar(s)
      tmp.m.compose(pt.p, tmp.q, tmp.s)
      ref.current.setMatrixAt(i, tmp.m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, count]} frustumCulled={false}>
      <icosahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#efe2c4" flatShading roughness={1} transparent opacity={0.45} depthWrite={false} />
    </instancedMesh>
  )
}

export default function Car({ mobile }) {
  const root = useRef()
  const body = useRef()
  const wheels = [useRef(), useRef(), useRef(), useRef()]
  const sun = useRef()
  const { camera } = useThree()
  const tmp = useMemo(() => ({
    n: new THREE.Vector3(0, 1, 0), nSmooth: new THREE.Vector3(0, 1, 0),
    x: new THREE.Vector3(), z: new THREE.Vector3(), m: new THREE.Matrix4(),
    camPos: new THREE.Vector3(), look: new THREE.Vector3(), lookSmooth: new THREE.Vector3(SPAWN.x, 0, SPAWN.z),
  }), [])
  const snap = useRef(true)
  const offset = useMemo(() => {
    const o = mobile ? CAMERA_OFFSET.mobile : CAMERA_OFFSET.desktop
    initCamView(o)
    return new THREE.Vector3(...o)
  }, [mobile])
  const steerRef = useRef(0)
  const resetSeen = useRef(0)

  const place = (x, z, heading) => {
    car.x = x; car.z = z; car.heading = heading; car.speed = 0
    car.y = height(x, z)
  }

  useEffect(() => {
    place(SPAWN.x, SPAWN.z, SPAWN.heading)
    camera.position.set(SPAWN.x + offset.x, offset.y, SPAWN.z + offset.z)
    tmp.lookSmooth.set(SPAWN.x, 0, SPAWN.z)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30)

    if (commands.teleport) {
      const z = zoneById[commands.teleport]
      // Park just inside the zone ring, facing its centre.
      if (z) place(z.x, z.z + z.r - 2.5, Math.PI)
      commands.teleport = null
      snap.current = true
    }
    if (commands.resetCount !== resetSeen.current) {
      resetSeen.current = commands.resetCount
      place(SPAWN.x, SPAWN.z, SPAWN.heading)
      snap.current = true
    }

    // ── Arcade driving model ──
    const throttle = (input.forward ? 1 : 0) - (input.back ? 1 : 0)
    if (throttle > 0) car.speed += (car.speed < 0 ? BRAKE : ACCEL) * dt
    else if (throttle < 0) car.speed -= (car.speed > 0.5 ? BRAKE : ACCEL * 0.6) * dt
    else car.speed *= Math.exp(-1.1 * dt)
    if (input.brake) car.speed *= Math.exp(-5 * dt)
    car.speed = Math.max(MAX_REVERSE, Math.min(MAX_SPEED, car.speed))
    if (Math.abs(car.speed) < 0.03 && !throttle) car.speed = 0

    const steerTarget = (input.left ? 1 : 0) - (input.right ? 1 : 0)
    steerRef.current += (steerTarget - steerRef.current) * Math.min(1, dt * 10)
    const grip = Math.max(-1, Math.min(1, car.speed / 5))
    car.heading += steerRef.current * TURN * dt * grip * (1 - Math.abs(car.speed) / (MAX_SPEED * 2.4))

    const fx = Math.sin(car.heading), fz = Math.cos(car.heading)
    // Hills slow you down going up and speed you up going down.
    const slope = height(car.x + fx, car.z + fz) - height(car.x - fx, car.z - fz)
    car.speed -= slope * 4.5 * dt
    let nx = car.x + fx * car.speed * dt, nz = car.z + fz * car.speed * dt

    for (const c of COLLIDERS) {
      const dx = nx - c.x, dz = nz - c.z
      const d = Math.hypot(dx, dz), min = c.r + CAR_RADIUS
      if (d < min && d > 0.0001) {
        nx = c.x + (dx / d) * min
        nz = c.z + (dz / d) * min
        if (Math.abs(car.speed) > 3) car.speed *= -0.25
        else car.speed *= 0.5
      }
    }
    const r = Math.hypot(nx, nz)
    if (r > WORLD_RADIUS) { nx *= WORLD_RADIUS / r; nz *= WORLD_RADIUS / r; car.speed *= 0.6 }
    car.x = nx; car.z = nz
    car.y = height(nx, nz)

    updateVehicleAudio({
      speed: car.speed,
      throttle,
      steer: steerRef.current,
      braking: input.brake || (throttle < 0 && car.speed > 1) || (throttle > 0 && car.speed < -1),
    })

    // ── Orientation: follow the ground normal ──
    normal(car.x, car.z, tmp.n)
    tmp.nSmooth.lerp(tmp.n, Math.min(1, dt * 8)).normalize()
    tmp.z.set(fx, 0, fz)
    tmp.x.crossVectors(tmp.nSmooth, tmp.z).normalize()
    tmp.z.crossVectors(tmp.x, tmp.nSmooth)
    tmp.m.makeBasis(tmp.x, tmp.nSmooth, tmp.z)
    const g = root.current
    g.quaternion.setFromRotationMatrix(tmp.m)
    g.position.set(car.x, car.y, car.z)

    // Body roll into turns, pitch on throttle, a little engine wobble.
    const b = body.current
    const roll = -steerRef.current * Math.min(1, Math.abs(car.speed) / 10) * 0.07
    const pitch = -throttle * 0.025 * (Math.abs(car.speed) < MAX_SPEED - 1 ? 1 : 0)
    b.rotation.z += (roll - b.rotation.z) * Math.min(1, dt * 6)
    b.rotation.x += (pitch - b.rotation.x) * Math.min(1, dt * 4)
    b.position.y = Math.sin(state.clock.elapsedTime * 30) * 0.008 + Math.sin(state.clock.elapsedTime * 7) * 0.012 * Math.min(1, Math.abs(car.speed) / 6)

    wheels.forEach((w, i) => {
      const spin = w.current.children[0]
      spin.rotation.x += (car.speed * dt) / 0.42
      if (i < 2) w.current.rotation.y = steerRef.current * 0.42
    })

    // ── Camera + sun follow ──
    // Orbit offset from the drag-controlled yaw / pitch / distance.
    const cp = Math.cos(camView.pitch)
    offset.set(Math.sin(camView.yaw) * cp * camView.dist, Math.sin(camView.pitch) * camView.dist, Math.cos(camView.yaw) * cp * camView.dist)
    // Inside a zone, frame the space between the van and the zone's landmarks,
    // and leave room for the info panel (right on desktop, bottom on mobile).
    tmp.look.set(car.x + fx * Math.max(0, car.speed) * 0.25, car.y + 1, car.z + fz * Math.max(0, car.speed) * 0.25)
    const zone = ZONES.find((z) => Math.hypot(car.x - z.x, car.z - z.z) < z.r + 1.5)
    if (zone) {
      tmp.look.x += (zone.x - car.x) * 0.55
      tmp.look.z += (zone.z - car.z) * 0.55
      const len = Math.hypot(offset.x, offset.z), dx = -offset.x / len, dz = -offset.z / len
      if (mobile) { tmp.look.x -= dx * 7; tmp.look.z -= dz * 7 }
      else { tmp.look.x += -dz * 7; tmp.look.z += dx * 7 }
    }
    const k = snap.current ? 1 : 1 - Math.exp(-dt * 3.2)
    tmp.lookSmooth.lerp(tmp.look, k)
    tmp.camPos.copy(tmp.lookSmooth).add(offset)
    // Never let a low orbit angle put the camera inside a hill.
    tmp.camPos.y = Math.max(tmp.camPos.y, height(tmp.camPos.x, tmp.camPos.z) + 1.5)
    camera.position.lerp(tmp.camPos, snap.current ? 1 : 1 - Math.exp(-dt * 4))
    camera.lookAt(tmp.lookSmooth)
    snap.current = false

    const s = sun.current
    s.position.set(car.x + SUN_DIR.x * 60, car.y + SUN_DIR.y * 60, car.z + SUN_DIR.z * 60)
    s.target.position.set(car.x, car.y, car.z)
    s.target.updateMatrixWorld()
  })

  return (
    <>
      <directionalLight
        ref={sun}
        intensity={2.4}
        color="#fff1d8"
        castShadow
        shadow-mapSize={[mobile ? 1024 : 2048, mobile ? 1024 : 2048]}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={1}
        shadow-camera-far={140}
        shadow-bias={-0.0008}
        shadow-normalBias={0.04}
      />
      <group ref={root}>
        <Van bodyRef={body} wheels={wheels} />
      </group>
      <Dust />
    </>
  )
}
