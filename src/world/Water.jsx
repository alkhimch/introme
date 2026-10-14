import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { LAKE, PIER, PIER_ANGLE, RIVER, RIVER_HALF_WIDTH, WATER_Y, height, lakeRadius, rng } from './layout'
import { useSeason, useTimeOfDay } from './store'
import { useEnvironment } from './Sky'

const WATER_COLORS = { spring: '#4b8fb0', summer: '#3b8db3', autumn: '#3c6f88', winter: '#d6e7f0' }
const BRIGHTNESS = { day: 1, evening: 0.68, night: 0.3 }

// Rippling water (or ice in winter) with fog support. `flow` > 0 scrolls the ripples
// along the river; the lake just shimmers.
const vertexShader = /* glsl */ `
  #include <fog_pars_vertex>
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`
const fragmentShader = /* glsl */ `
  #include <fog_pars_fragment>
  uniform float uTime;
  uniform float uFlow;
  uniform float uIce;
  uniform float uLight;
  uniform vec3 uColor;
  uniform vec3 uSky;
  varying vec2 vUv;
  varying vec3 vWorld;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec2 p = vWorld.xz * 0.35;
    vec3 col;
    if (uIce > 0.5) {
      // Ice: pale blue with white cracks and drifted snow patches.
      float cracks = smoothstep(0.03, 0.0, abs(noise(p * 1.3) - 0.5)) * 0.6;
      float drift = smoothstep(0.55, 0.75, noise(p * 0.4 + 3.0));
      col = mix(uColor, vec3(0.97, 0.98, 1.0), cracks + drift * 0.8);
    } else {
      vec2 q = p + vec2(0.0, -uTime * uFlow);
      float w = noise(q * 2.0 + uTime * 0.15) * 0.6 + noise(q * 5.0 - uTime * 0.2) * 0.4;
      col = mix(uColor * 0.82, mix(uColor, uSky, 0.45), w);
      // Sun glints on the ripple crests.
      col += vec3(1.0) * smoothstep(0.82, 0.95, w) * 0.35;
      // Foam along the river banks.
      if (uFlow > 0.0) col = mix(col, vec3(0.92, 0.96, 1.0), smoothstep(0.38, 0.5, abs(vUv.x - 0.5)) * (0.5 + 0.5 * w));
    }
    gl_FragColor = vec4(col * uLight, uIce > 0.5 ? 1.0 : 0.88);
    #include <fog_fragment>
  }
`

function useWaterMaterial(flow) {
  return useMemo(() => new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uFlow: { value: flow }, uIce: { value: 0 }, uLight: { value: 1 },
      uColor: { value: new THREE.Color() }, uSky: { value: new THREE.Color() },
    }]),
    vertexShader, fragmentShader, transparent: true, fog: true, depthWrite: false,
  }), [flow])
}

function riverGeometry() {
  const curve = new THREE.CatmullRomCurve3(RIVER.map(([x, z]) => new THREE.Vector3(x, 0, z)))
  const N = 120, half = RIVER_HALF_WIDTH + 0.6
  const pos = [], uv = [], idx = []
  const len = curve.getLength()
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPointAt(t), tan = curve.getTangentAt(t)
    const nx = -tan.z, nz = tan.x
    pos.push(p.x + nx * half, WATER_Y, p.z + nz * half, p.x - nx * half, WATER_Y, p.z - nz * half)
    uv.push(0, (t * len) / 6, 1, (t * len) / 6)
    if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  return g
}

function lakeGeometry() {
  const shape = new THREE.Shape()
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2, r = lakeRadius(a) + 0.8
    // Shape is built in x/y and rotated onto the ground, so y maps to -z.
    const x = Math.cos(a) * r, y = -Math.sin(a) * r
    i ? shape.lineTo(x, y) : shape.moveTo(x, y)
  }
  const g = new THREE.ShapeGeometry(shape, 1)
  g.rotateX(-Math.PI / 2)
  g.translate(LAKE.x, WATER_Y, LAKE.z)
  return g
}

// Reeds around the shore: green in spring/summer, tawny in autumn, dry in winter.
const REED_COLORS = { spring: ['#6fae42', '#86c24f'], summer: ['#5f8f3a', '#7aa346'], autumn: ['#b8913f', '#a07c38'], winter: ['#c9c2a6', '#b8b090'] }
function Reeds({ season }) {
  const ref = useRef()
  const items = useMemo(() => {
    const r = rng(55), out = []
    for (let i = 0; i < 110; i++) {
      const a = r() * Math.PI * 2, rr = lakeRadius(a) + (r() - 0.3) * 1.6
      // Leave a gap at the pier and at the river mouth.
      if (Math.abs(((a - PIER_ANGLE + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.25) continue
      const x = LAKE.x + Math.cos(a) * rr, z = LAKE.z + Math.sin(a) * rr
      out.push({ x, z, y: Math.max(height(x, z), WATER_Y), s: 0.7 + r() * 0.7, v: r() })
    }
    return out
  }, [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), c = new THREE.Color()
    const cols = REED_COLORS[season]
    items.forEach((it, i) => {
      m.makeScale(it.s * 0.6, it.s * (season === 'winter' ? 0.7 : 1.4), it.s * 0.6).setPosition(it.x, it.y + 0.5 * it.s, it.z)
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c.set(cols[Math.floor(it.v * cols.length)]))
    })
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.instanceColor.needsUpdate = true
  }, [items, season])
  return (
    <instancedMesh ref={ref} args={[null, null, items.length]} castShadow>
      <coneGeometry args={[0.12, 1.2, 4]} />
      <meshStandardMaterial flatShading roughness={1} />
    </instancedMesh>
  )
}

// A wooden pier facing the start area, with a rowboat tied up beside it.
function Pier({ season }) {
  const boat = useRef()
  const { x: sx, z: sz, ry } = PIER
  const deck = WATER_Y + 0.55
  useFrame((st) => {
    if (season === 'winter') { boat.current.position.y = WATER_Y + 0.12; boat.current.rotation.z = 0; return }
    const t = st.clock.elapsedTime
    boat.current.position.y = WATER_Y + 0.15 + Math.sin(t * 1.3) * 0.04
    boat.current.rotation.z = Math.sin(t * 1.1) * 0.05
  })
  return (
    <group position={[sx, 0, sz]} rotation={[0, ry, 0]}>
      <mesh position={[0, deck, 3.4]} castShadow receiveShadow><boxGeometry args={[1.6, 0.12, 7.2]} /><meshStandardMaterial color="#9b6a3e" flatShading /></mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[0, deck + 0.065, 0.3 + i * 0.6]}><boxGeometry args={[1.62, 0.01, 0.04]} /><meshStandardMaterial color="#7a4f2c" /></mesh>
      ))}
      {[0.4, 3.4, 6.6].flatMap((z) => [-0.72, 0.72].map((x) => (
        <mesh key={`${x}${z}`} position={[x, deck - 0.9, z]}><cylinderGeometry args={[0.09, 0.09, 1.9, 6]} /><meshStandardMaterial color="#6a4426" /></mesh>
      )))}
      {season === 'winter' && <mesh position={[0, deck + 0.1, 3.4]}><boxGeometry args={[1.5, 0.06, 7]} /><meshStandardMaterial color="#f4f7fa" flatShading /></mesh>}
      <group ref={boat} position={[1.75, WATER_Y + 0.15, 5.2]}>
        <mesh castShadow><boxGeometry args={[1.0, 0.36, 2.6]} /><meshStandardMaterial color="#c8423b" flatShading /></mesh>
        <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.8, 0.36, 2.3]} /><meshStandardMaterial color="#7a4f2c" flatShading /></mesh>
        <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.95, 0.06, 0.25]} /><meshStandardMaterial color="#9b6a3e" /></mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.7, 0.2, 0.1]} rotation={[0.3, 0, sd * 0.9]}><boxGeometry args={[0.05, 0.05, 1.5]} /><meshStandardMaterial color="#d9b38c" /></mesh>
        ))}
      </group>
    </group>
  )
}

export default function Water() {
  const season = useSeason()
  const time = useTimeOfDay()
  const env = useEnvironment()
  const river = useMemo(riverGeometry, [])
  const lake = useMemo(lakeGeometry, [])
  const riverMat = useWaterMaterial(0.45)
  const lakeMat = useWaterMaterial(0)

  useLayoutEffect(() => {
    for (const mat of [riverMat, lakeMat]) {
      const u = mat.uniforms
      u.uColor.value.set(WATER_COLORS[season])
      u.uSky.value.copy(env.horizon).lerp(env.top, 0.5)
      u.uIce.value = season === 'winter' ? 1 : 0
      u.uLight.value = BRIGHTNESS[time]
      mat.depthWrite = season === 'winter'
      mat.transparent = season !== 'winter'
    }
  }, [season, time, env, riverMat, lakeMat])

  useFrame((_, dt) => {
    riverMat.uniforms.uTime.value += dt
    lakeMat.uniforms.uTime.value += dt
  })

  return (
    <group>
      <mesh geometry={river} material={riverMat} receiveShadow renderOrder={1} />
      <mesh geometry={lake} material={lakeMat} receiveShadow renderOrder={1} />
      <Reeds season={season} />
      <Pier season={season} />
    </group>
  )
}
