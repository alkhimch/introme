import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { aperture, lattice, lorenz, sphere, textPoints } from './shapes'
import { reducedMotion, scrollState } from './state'
import { profile } from '../content'

const vertexShader = /* glsl */ `
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute vec3 aColor;
  varying vec3 vColor;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (10.0 / -mv.z);
    vColor = aColor;
  }
`
const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * a * uOpacity);
  }
`

// Per-section look. Index matches scrollState.section.
const LOOK = [
  { x: 0, z: 0, opacity: 1.0, spin: 0 },      // hero text
  { x: 0.25, z: 0, opacity: 0.9, spin: 0.18 }, // developer lattice
  { x: -0.25, z: 0, opacity: 1.0, spin: 0.1 }, // math lorenz
  { x: 0, z: -4, opacity: 0.35, spin: 0 },     // photos aperture, pushed behind prints
  { x: 0, z: 0, opacity: 0.5, spin: 0.12 },    // contact sphere, dimmed behind the CTA
]

const smooth = (t) => t * t * (3 - 2 * t)

export default function Particles({ count }) {
  const points = useRef()
  const { viewport, size, gl } = useThree()

  const data = useMemo(() => {
    const shapes = [null, lattice(count), lorenz(count), aperture(count), sphere(count)]
    const fallback = sphere(count, 1.4)
    const positions = sphere(count, 6).map((v) => v * (0.5 + Math.random()))
    const colors = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    const speeds = new Float32Array(count)
    const phases = new Float32Array(count)
    const warm = new THREE.Color('#ffd7a8'), cool = new THREE.Color('#b9d4ff'), white = new THREE.Color('#ffffff')
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const r = Math.random()
      c.copy(white).lerp(r < 0.5 ? warm : cool, Math.random() * 0.55)
      colors.set([c.r, c.g, c.b], i * 3)
      scales[i] = 0.5 + Math.random() * Math.random() * 1.6
      speeds[i] = 0.035 + Math.random() * 0.06
      phases[i] = Math.random() * Math.PI * 2
    }
    return { shapes, fallback, positions, colors, scales, speeds, phases, words: null }
  }, [count])

  // Sample hero words once the font is ready, so particles match the original typography.
  useEffect(() => {
    let alive = true
    const font = '600 100px "Josefin Sans"'
    const ready = document.fonts?.load ? document.fonts.load(font) : Promise.resolve()
    ready.catch(() => {}).then(() => {
      if (alive) data.words = profile.heroWords.map((w) => textPoints(w, count))
    })
    return () => { alive = false }
  }, [data, count])

  const uniforms = useMemo(
    () => ({
      uSize: { value: size.width < 700 ? 4.2 : 3.4 },
      uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
      uOpacity: { value: 1 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const s = useRef({ section: 0, word: 0, wordClock: 0 })

  useFrame((state, delta) => {
    const g = points.current
    if (!g) return
    const t = state.clock.elapsedTime
    const st = s.current
    st.section += (scrollState.section - st.section) * Math.min(1, delta * 6)

    // Cycle hero words while the hero is on screen.
    st.wordClock += delta
    if (data.words && st.wordClock > 2.6) {
      st.wordClock = 0
      st.word = (st.word + 1) % data.words.length
    }

    const i0 = Math.min(Math.floor(st.section), LOOK.length - 1)
    const i1 = Math.min(i0 + 1, LOOK.length - 1)
    const f = smooth(Math.min(1, st.section - i0))
    const desktop = size.width >= 900
    const textWidth = Math.min(viewport.width * 0.84, 9)
    const shapeScale = desktop ? 1 : Math.min(1, viewport.width / 5.2)

    const shapeArr = (k) => (k === 0 ? (data.words ? data.words[st.word] : data.fallback) : data.shapes[k])
    const shapeScl = (k) => (k === 0 ? (data.words ? textWidth : 1) : shapeScale)
    const A = shapeArr(i0), B = shapeArr(i1)
    const sa = shapeScl(i0), sb = shapeScl(i1)
    const motion = reducedMotion ? 0 : 1
    const ra = LOOK[i0].spin * t * motion, rb = LOOK[i1].spin * t * motion
    const ca = Math.cos(ra), sna = Math.sin(ra), cb = Math.cos(rb), snb = Math.sin(rb)
    // Lorenz particles flow along the trajectory by shifting their sample index.
    const flow = motion ? Math.floor(t * 8) : 0

    const dt60 = Math.min(delta, 0.1) * 60
    const pos = g.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const ia = (i0 === 2 ? (i + flow) % count : i) * 3
      const ib = (i1 === 2 ? (i + flow) % count : i) * 3
      let ax = A[ia] * sa, ay = A[ia + 1] * sa, az = A[ia + 2] * sa
      let bx = B[ib] * sb, by = B[ib + 1] * sb, bz = B[ib + 2] * sb
      // Spin around Y (text has spin 0 so it always faces the viewer).
      const ax2 = ax * ca + az * sna, az2 = -ax * sna + az * ca
      const bx2 = bx * cb + bz * snb, bz2 = -bx * snb + bz * cb
      const w = Math.sin(t * 0.9 + data.phases[i]) * 0.012 * motion
      const tx = ax2 + (bx2 - ax2) * f + w
      const ty = ay + (by - ay) * f + w
      const tz = az2 + (bz2 - az2) * f
      // Frame-rate independent easing: same convergence time at 20fps and 120fps.
      const k = 1 - Math.pow(1 - Math.min(0.9, data.speeds[i] * (reducedMotion ? 3 : 1)), dt60)
      const j = i * 3
      pos[j] += (tx - pos[j]) * k
      pos[j + 1] += (ty - pos[j + 1]) * k
      pos[j + 2] += (tz - pos[j + 2]) * k
    }
    g.geometry.attributes.position.needsUpdate = true

    // Section-level placement, opacity and a gentle pointer tilt.
    const lx = desktop ? LOOK[i0].x + (LOOK[i1].x - LOOK[i0].x) * f : 0
    const lz = LOOK[i0].z + (LOOK[i1].z - LOOK[i0].z) * f
    const op = LOOK[i0].opacity + (LOOK[i1].opacity - LOOK[i0].opacity) * f
    const ke = 1 - Math.pow(0.92, dt60), kt = 1 - Math.pow(0.95, dt60)
    g.position.x += (lx * viewport.width - g.position.x) * ke
    g.position.z += (lz - g.position.z) * ke
    g.material.uniforms.uOpacity.value = desktop ? op : op * 0.75
    g.rotation.y += (state.pointer.x * 0.18 * motion - g.rotation.y) * kt
    g.rotation.x += (-state.pointer.y * 0.12 * motion - g.rotation.x) * kt
  })

  return (
    <points ref={points} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-aColor" args={[data.colors, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[data.scales, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
