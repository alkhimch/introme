import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { TREES } from './layout'
import { useSeason } from './store'
import { SNOW, TREE_LOOK } from './seasons'

// Conifers (pine, larch) are three stacked cones; birches are a white trunk with two
// leafy blobs. Everything is instanced, and recoloured / reshaped when the season changes.
const CONE_LAYERS = [
  { y: 1.3, r: 1.45, h: 1.9 },
  { y: 2.35, r: 1.12, h: 1.7 },
  { y: 3.25, r: 0.78, h: 1.45 },
]
const BIRCH_BLOBS = [
  { y: 3.0, x: 0.15, s: 1.15 },
  { y: 3.9, x: -0.2, s: 0.85 },
]

const conifers = TREES.filter((t) => t.species !== 'birch')
const birches = TREES.filter((t) => t.species === 'birch')

function useInstances(items, count, write) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color()
    const e = new THREE.Euler()
    items.forEach((t, i) => {
      const out = write(t, i, c)
      e.set(0, t.ry, 0); q.setFromEuler(e)
      p.set(out.x ?? t.x, t.y + out.y, out.z ?? t.z)
      s.set(out.sx, out.sy, out.sx)
      m.compose(p, q, s)
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c)
    })
    ref.current.count = count
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  })
  return ref
}

function leafColor(t, season, c, extraSnow = 0) {
  const look = TREE_LOOK[t.species][season]
  c.set(look.leaf[Math.floor(t.v * look.leaf.length)])
  // Light variation per tree so the forest isn't a flat block of colour.
  c.offsetHSL(0, 0, (t.v - 0.5) * 0.06)
  if (look.snow) c.lerp(SNOW, Math.min(1, look.snow + extraSnow))
  return look
}

function Layer({ layer, li, season, geometry, material }) {
  const ref = useInstances(conifers, conifers.length, (t, i, c) => {
    const look = leafColor(t, season, c, li * 0.12)
    // Larch sheds its needles in winter: a slimmer, twiggy crown.
    const k = look.bare ? 0.62 : t.species === 'larch' ? 0.85 : 1
    return { y: layer.y * t.s, sx: t.s * k * (t.species === 'larch' ? 0.82 : 1), sy: t.s * (t.species === 'larch' ? 1.12 : 1) }
  })
  return <instancedMesh ref={ref} args={[geometry, material, conifers.length]} castShadow receiveShadow />
}

function Blob({ blob, season, geometry, material }) {
  const ref = useInstances(birches, birches.length, (t, i, c) => {
    const look = leafColor(t, season, c)
    const k = look.bare ? 0.55 : 1
    const ox = Math.cos(t.ry) * blob.x * t.s, oz = -Math.sin(t.ry) * blob.x * t.s
    return { x: t.x + ox, z: t.z + oz, y: blob.y * t.s, sx: blob.s * t.s * k, sy: blob.s * t.s * k * 1.15 }
  })
  return <instancedMesh ref={ref} args={[geometry, material, birches.length]} castShadow receiveShadow />
}

export default function Trees() {
  const season = useSeason()
  const res = useMemo(() => {
    const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.9 })
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 })
    return {
      cones: CONE_LAYERS.map((l) => new THREE.ConeGeometry(l.r, l.h, 7)),
      blob: new THREE.IcosahedronGeometry(1, 0),
      trunk: new THREE.CylinderGeometry(0.13, 0.2, 1, 6).translate(0, 0.5, 0),
      leafMat, trunkMat,
    }
  }, [])

  // Trunks: brown for conifers, white bark for birches.
  const trunks = useInstances(TREES, TREES.length, (t, i, c) => {
    const birch = t.species === 'birch'
    c.set(birch ? '#ece8df' : t.species === 'larch' ? '#7a5534' : '#5e4330')
    if (season === 'winter' && !birch) c.lerp(new THREE.Color('#d9dde2'), 0.15)
    return { y: 0, sx: t.s * (birch ? 0.8 : 1), sy: t.s * (birch ? 3.4 : 1.6) }
  })

  return (
    <group>
      <instancedMesh ref={trunks} args={[res.trunk, res.trunkMat, TREES.length]} castShadow receiveShadow />
      {CONE_LAYERS.map((l, i) => (
        <Layer key={i} layer={l} li={i} season={season} geometry={res.cones[i]} material={res.leafMat} />
      ))}
      {BIRCH_BLOBS.map((b, i) => (
        <Blob key={i} blob={b} season={season} geometry={res.blob} material={res.leafMat} />
      ))}
    </group>
  )
}
