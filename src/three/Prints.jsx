import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { reducedMotion, scrollState } from './state'

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// A print "developing" in the tray: the image blooms out of the paper in noisy patches.
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uDevelop;
  uniform float uHover;
  uniform float uOpacity;
  uniform vec2 uBorder;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec3 paper = vec3(0.95, 0.94, 0.91);
    vec2 inner = (vUv - uBorder) / (1.0 - 2.0 * uBorder);
    vec3 col = paper;
    if (inner.x > 0.0 && inner.x < 1.0 && inner.y > 0.0 && inner.y < 1.0) {
      vec3 img = texture2D(uMap, inner).rgb;
      float n = noise(inner * 5.0) * 0.6 + noise(inner * 13.0) * 0.4;
      float d = smoothstep(n - 0.15, n + 0.15, uDevelop * 1.35 - 0.2);
      col = mix(paper, img, d);
      col *= 1.0 + uHover * 0.08;
    }
    gl_FragColor = vec4(col, uOpacity);
  }
`

function Print({ photo, index, width, x, y, onOpen, visible }) {
  const group = useRef()
  const [hovered, setHovered] = useState(false)
  const since = useRef(0)
  const mat = useRef()
  const height = width * 1.25
  const uniforms = useMemo(
    () => ({
      uMap: { value: photo.texture },
      uDevelop: { value: 0 },
      uHover: { value: 0 },
      uOpacity: { value: 0 },
      uBorder: { value: new THREE.Vector2(0.06, 0.06 / 1.25) },
    }),
    [photo.texture],
  )

  useFrame((state, delta) => {
    const v = visible.current
    const t = state.clock.elapsedTime
    const u = mat.current.uniforms
    // Develop in sequence once the section is on screen.
    since.current = v > 0.55 ? since.current + delta : 0
    const dev = u.uDevelop
    if (since.current > index * 0.3) dev.value = Math.min(1, dev.value + delta * (reducedMotion ? 4 : 0.45))
    else if (v < 0.2) dev.value = Math.max(0, dev.value - delta * 0.8)
    u.uOpacity.value = Math.min(1, v * 2)
    u.uHover.value += ((hovered ? 1 : 0) - u.uHover.value) * 0.15
    const sway = reducedMotion ? 0 : Math.sin(t * 0.8 + index * 1.3) * 0.035
    const g = group.current
    g.rotation.z += ((hovered ? 0 : sway) - g.rotation.z) * 0.1
    const s = 1 + u.uHover.value * 0.06
    g.scale.set(s, s, 1)
    g.position.z = u.uHover.value * 0.4
  })

  return (
    <group position={[x, y, 0]}>
      <group ref={group}>
        <mesh
          position={[0, -height / 2 - 0.05, 0]}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = '' }}
          onClick={(e) => { e.stopPropagation(); onOpen(index) }}
        >
          <planeGeometry args={[width, height]} />
          <shaderMaterial ref={mat} vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} transparent />
        </mesh>
        {/* Clothespin */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[0.07, 0.24, 0.04]} />
          <meshBasicMaterial color="#b98d5f" />
        </mesh>
      </group>
    </group>
  )
}

export default function Prints({ photos, onOpen }) {
  const sources = useMemo(
    () =>
      photos.map((p) => ({
        ...p,
        texture: p.canvas ? new THREE.CanvasTexture(p.canvas) : new THREE.TextureLoader().load(p.url),
      })),
    [photos],
  )
  const { viewport, size } = useThree()
  const root = useRef()
  const visible = useRef(0)

  const layout = useMemo(() => {
    const perRow = size.width >= 900 ? 3 : 2
    const rows = Math.ceil(sources.length / perRow)
    const gap = 0.45
    let width = Math.min(2.0, (viewport.width * 0.86) / perRow - gap)
    const rowH = (w) => w * 1.25 + 0.6
    const maxH = viewport.height * 0.6
    if (rows * rowH(width) > maxH) width = (maxH / rows - 0.6) / 1.25
    const items = sources.map((p, i) => {
      const r = Math.floor(i / perRow)
      const inRow = Math.min(perRow, sources.length - r * perRow)
      const c = i % perRow
      const x = (c - (inRow - 1) / 2) * (width + gap)
      const y = (rows - 1) / 2 * rowH(width) - r * rowH(width) + rowH(width) / 2 - 0.1
      return { x, y }
    })
    const lines = Array.from({ length: rows }, (_, r) => {
      const y = (rows - 1) / 2 * rowH(width) - r * rowH(width) + rowH(width) / 2
      const half = (perRow * (width + gap)) / 2 + 0.4
      const pts = []
      for (let k = 0; k <= 24; k++) {
        const u = k / 24
        pts.push([-half + u * half * 2, y - Math.sin(u * Math.PI) * 0.12, -0.02])
      }
      return pts
    })
    return { width, items, lines }
  }, [sources, viewport.width, viewport.height, size.width])

  const strings = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({ color: '#8a8070', transparent: true, opacity: 0.7 })
    return layout.lines.map((pts) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), mat))
  }, [layout])

  useFrame(() => {
    // photosOffset: distance (in viewport heights) of the section's centre from the screen centre.
    const o = scrollState.photosOffset
    visible.current = Math.max(0, 1 - Math.abs(o) * 1.3)
    // Track the page scroll so the prints stay attached to their section.
    root.current.position.y = -o * viewport.height
    root.current.visible = visible.current > 0.001
  })

  return (
    <group ref={root}>
      {strings.map((obj, i) => <primitive key={i} object={obj} />)}
      {sources.map((p, i) => (
        <Print key={i} photo={p} index={i} width={layout.width} x={layout.items[i].x} y={layout.items[i].y} onOpen={onOpen} visible={visible} />
      ))}
    </group>
  )
}
