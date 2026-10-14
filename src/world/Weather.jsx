import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { height } from './layout'
import { car, useRain, useSeason, useTimeOfDay } from './store'
import { CAMP, LAKE, PATHS, waterDistance } from './layout'
import { useThree } from '@react-three/fiber'
import { useEnvironment } from './Sky'

// Particles live in a box that follows the van; anything leaving the box wraps
// round to the other side, so the effect looks endless at a fixed cost.
const BOX = { w: 70, h: 26 }
const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function wrap(v, centre, size) {
  const half = size / 2
  return v < centre - half ? v + size : v > centre + half ? v - size : v
}

function softDot() {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.8)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 32, 32)
  return new THREE.CanvasTexture(c)
}

// ── Winter: falling snow ──
function Snow({ count, wind = 0.4 }) {
  const points = useRef()
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3), speed = new Float32Array(count), phase = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * BOX.w
      pos[i * 3 + 1] = Math.random() * BOX.h
      pos[i * 3 + 2] = (Math.random() - 0.5) * BOX.w
      speed[i] = 1.6 + Math.random() * 1.6
      phase[i] = Math.random() * 6.28
    }
    return { pos, speed, phase, tex: softDot() }
  }, [count])
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = st.clock.elapsedTime
    const p = points.current.geometry.attributes.position.array
    const ground = height(car.x, car.z)
    for (let i = 0; i < count; i++) {
      const j = i * 3
      p[j] = wrap(p[j] + Math.sin(t * 0.8 + data.phase[i]) * 0.6 * dt + wind * dt, car.x, BOX.w)
      p[j + 2] = wrap(p[j + 2] + Math.cos(t * 0.6 + data.phase[i]) * 0.4 * dt, car.z, BOX.w)
      p[j + 1] -= data.speed[i] * dt
      if (p[j + 1] < ground - 2) p[j + 1] += BOX.h
      else if (p[j + 1] > ground + BOX.h) p[j + 1] -= BOX.h
    }
    points.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.32} map={data.tex} transparent depthWrite={false} color="#ffffff" sizeAttenuation />
    </points>
  )
}

// ── Autumn leaves / spring petals: tumbling little cards ──
function Fluttering({ count, colors, size, fall, drift }) {
  const mesh = useRef()
  const data = useMemo(() => {
    const items = Array.from({ length: count }, () => ({
      p: new THREE.Vector3((Math.random() - 0.5) * BOX.w, Math.random() * BOX.h, (Math.random() - 0.5) * BOX.w),
      r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      spin: new THREE.Vector3(Math.random() * 3 - 1.5, Math.random() * 3 - 1.5, Math.random() * 3 - 1.5),
      fall: fall * (0.7 + Math.random() * 0.6),
      phase: Math.random() * 6.28,
    }))
    return items
  }, [count, fall])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) }), [])
  const placed = useRef(false)
  useFrame((st, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const t = st.clock.elapsedTime
    const m = mesh.current
    if (!placed.current) {
      const c = new THREE.Color()
      data.forEach((_, i) => m.setColorAt(i, c.set(colors[i % colors.length])))
      m.instanceColor.needsUpdate = true
      placed.current = true
    }
    const ground = height(car.x, car.z)
    data.forEach((it, i) => {
      it.p.x = wrap(it.p.x + (Math.sin(t * 0.9 + it.phase) * 0.8 + drift) * dt, car.x, BOX.w)
      it.p.z = wrap(it.p.z + Math.cos(t * 0.7 + it.phase) * 0.6 * dt, car.z, BOX.w)
      it.p.y -= it.fall * dt
      if (it.p.y < ground - 1) it.p.y += BOX.h
      else if (it.p.y > ground + BOX.h) it.p.y -= BOX.h
      it.r.x += it.spin.x * dt; it.r.y += it.spin.y * dt; it.r.z += it.spin.z * dt
      tmp.q.setFromEuler(it.r)
      tmp.m.compose(it.p, tmp.q, tmp.s)
      m.setMatrixAt(i, tmp.m)
    })
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[null, null, count]} frustumCulled={false}>
      <planeGeometry args={size} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
    </instancedMesh>
  )
}

// ── Warm-season nights: fireflies drifting around the lake and the camp ──
function Fireflies({ count }) {
  const points = useRef()
  const data = useMemo(() => {
    const homes = [LAKE, CAMP, { x: 0, z: 14 }]
    const items = Array.from({ length: count }, (_, i) => {
      const h = homes[i % homes.length], a = Math.random() * 6.28, r = 4 + Math.random() * 12
      return { x: h.x + Math.cos(a) * r, z: h.z + Math.sin(a) * r, phase: Math.random() * 6.28, speed: 0.3 + Math.random() * 0.5 }
    })
    return { items, pos: new Float32Array(count * 3), tex: softDot() }
  }, [count])
  useFrame((st) => {
    const t = st.clock.elapsedTime
    const p = data.pos
    data.items.forEach((f, i) => {
      // Lazy wandering loops, and a slow blink by dipping below the grass.
      const blink = Math.sin(t * 1.7 + f.phase * 3) > -0.3 ? 0 : -3
      p[i * 3] = f.x + Math.sin(t * f.speed + f.phase) * 2.2
      p[i * 3 + 1] = height(f.x, f.z) + 0.8 + Math.sin(t * f.speed * 1.7 + f.phase) * 0.5 + blink
      p[i * 3 + 2] = f.z + Math.cos(t * f.speed * 0.8 + f.phase) * 2.2
    })
    points.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.45} map={data.tex} transparent depthWrite={false} color="#d8ff7a" blending={THREE.AdditiveBlending} sizeAttenuation fog={false} />
    </points>
  )
}

// ── Rain: falling streaks around the van ──
function Rain({ count }) {
  const lines = useRef()
  const data = useMemo(() => {
    const pos = new Float32Array(count * 6), speed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * BOX.w, y = Math.random() * BOX.h, z = (Math.random() - 0.5) * BOX.w
      pos.set([x, y, z, x + 0.06, y + 0.9, z], i * 6)
      speed[i] = 20 + Math.random() * 8
    }
    return { pos, speed }
  }, [count])
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const p = lines.current.geometry.attributes.position.array
    const ground = height(car.x, car.z)
    for (let i = 0; i < count; i++) {
      const j = i * 6
      let x = wrap(p[j] + 1.2 * dt, car.x, BOX.w), z = wrap(p[j + 2], car.z, BOX.w), y = p[j + 1] - data.speed[i] * dt
      if (y < ground - 2) y += BOX.h
      p[j] = x; p[j + 1] = y; p[j + 2] = z
      p[j + 3] = x - 0.06; p[j + 4] = y + 0.9; p[j + 5] = z
    }
    lines.current.geometry.attributes.position.needsUpdate = true
  })
  return (
    <lineSegments ref={lines} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#c9d6e2" transparent opacity={0.55} depthWrite={false} />
    </lineSegments>
  )
}

// ── Puddles on the dirt tracks while it rains; they spread out as the rain sets in ──
function Puddles() {
  const mesh = useRef()
  const grow = useRef(0)
  const spots = useMemo(() => {
    const out = []
    let seed = 3
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
    for (const path of PATHS) {
      for (let i = 1; i < path.length; i++) {
        const [ax, az] = path[i - 1], [bx, bz] = path[i]
        const len = Math.hypot(bx - ax, bz - az)
        for (let d = 3; d < len; d += 7 + rnd() * 6) {
          const t = d / len, x = ax + (bx - ax) * t + (rnd() - 0.5) * 2, z = az + (bz - az) * t + (rnd() - 0.5) * 2
          const e = 0.6
          const slope = Math.abs(height(x + e, z) - height(x - e, z)) + Math.abs(height(x, z + e) - height(x, z - e))
          if (slope < 0.25 && waterDistance(x, z) > 3) out.push({ x, z, y: height(x, z), r: 0.7 + rnd() * 1.1, sx: 0.7 + rnd() * 0.6, rot: rnd() * 6 })
        }
      }
    }
    return out
  }, [])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), s: new THREE.Vector3(), p: new THREE.Vector3() }), [])
  useFrame((_, delta) => {
    grow.current = Math.min(1, grow.current + delta * 0.25)
    spots.forEach((sp, i) => {
      tmp.e.set(-Math.PI / 2, 0, sp.rot); tmp.q.setFromEuler(tmp.e)
      const k = sp.r * grow.current
      tmp.s.set(k * sp.sx, k, 1)
      tmp.p.set(sp.x, sp.y + 0.05, sp.z)
      tmp.m.compose(tmp.p, tmp.q, tmp.s)
      mesh.current.setMatrixAt(i, tmp.m)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={mesh} args={[null, null, spots.length]} receiveShadow>
      <circleGeometry args={[1, 14]} />
      <meshStandardMaterial color="#9fb0bf" roughness={0.05} metalness={0.25} transparent opacity={0.62} depthWrite={false} />
    </instancedMesh>
  )
}

// ── Rainbow opposite the sun, while it rains in daylight ──
const rainbowVertex = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const rainbowFragment = /* glsl */ `
  varying vec2 vUv;
  uniform vec2 uRange;
  vec3 hue(float h){ return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
  void main(){
    // RingGeometry uv: distance from centre in [0,1]; map the band to red (outer) → violet (inner).
    float r = length(vUv - 0.5) * 2.0;
    float t = clamp((r - uRange.x) / (uRange.y - uRange.x), 0.0, 1.0);
    float edge = smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.85, t);
    gl_FragColor = vec4(hue(0.8 * (1.0 - t)), 0.38 * edge);
  }
`
function Rainbow() {
  const group = useRef()
  const camera = useThree((s) => s.camera)
  const env = useEnvironment()
  const [sx, , sz] = env.sunDir
  const l = Math.hypot(sx, sz)
  const R = 150, W = 14
  useFrame(() => {
    group.current.position.set(camera.position.x - (sx / l) * 230, -25, camera.position.z - (sz / l) * 230)
    group.current.lookAt(camera.position.x, -25, camera.position.z)
  })
  return (
    <group ref={group}>
      <mesh>
        <ringGeometry args={[R - W, R, 96, 1, 0, Math.PI]} />
        <shaderMaterial vertexShader={rainbowVertex} fragmentShader={rainbowFragment} uniforms={{ uRange: { value: new THREE.Vector2((R - W) / R, 1) } }} transparent depthWrite={false} fog={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function Weather({ mobile, quality }) {
  const season = useSeason()
  const time = useTimeOfDay()
  const rain = useRain()
  const scale = (mobile ? 0.6 : 1) * quality.weather * (reducedMotion ? 0.4 : 1)
  const fireflies = time !== 'day' && (season === 'summer' || season === 'spring')
  if (season === 'winter') return <Snow key={rain ? 'blizzard' : 'snow'} count={Math.round(2600 * scale * (rain ? 2 : 1))} wind={rain ? 6 : 0.4} />
  if (rain) {
    return (
      <>
        <Rain count={Math.round(1800 * scale)} />
        <Puddles />
        {time === 'day' && <Rainbow />}
      </>
    )
  }
  if (season === 'autumn') {
    return <Fluttering key="leaves" count={Math.round(320 * scale)} colors={['#e3a42c', '#f0b938', '#d6602a', '#b8452a', '#c98a3a']} size={[0.32, 0.22]} fall={1.3} drift={0.5} />
  }
  if (season === 'spring') {
    return <>{fireflies && <Fireflies count={Math.round(90 * scale)} />}<Fluttering key="petals" count={Math.round(180 * scale)} colors={['#f7d6e6', '#ffffff', '#f2b7cf']} size={[0.16, 0.12]} fall={0.6} drift={0.9} /></>
  }
  return fireflies ? <Fireflies count={Math.round(140 * scale)} /> : null
}
