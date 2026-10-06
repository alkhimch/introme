import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { CAMP, ZONES, height, pathDistance, rng, WORLD_RADIUS } from './layout'

function scatter(count, seed, accept) {
  const r = rng(seed), out = []
  let guard = 0
  while (out.length < count && guard++ < count * 20) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * (WORLD_RADIUS + 25)
    const x = Math.cos(a) * d, z = Math.sin(a) * d
    if (pathDistance(x, z) < 2.6) continue
    if (ZONES.some((zn) => Math.hypot(x - zn.x, z - zn.z) < zn.r - 3)) continue
    if (Math.hypot(x, z + 2) < 11) continue // keep the name area clean
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < 10) continue // and the camp yard
    if (accept && !accept(x, z, r)) continue
    out.push({ x, z, y: height(x, z), r: r(), r2: r(), r3: r() })
  }
  return out
}

function Instances({ items, geometry, material, transform, colors, castShadow }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3()
    items.forEach((it, i) => {
      const t = transform(it)
      e.set(t.rx || 0, t.ry || 0, t.rz || 0)
      q.setFromEuler(e)
      p.set(it.x, it.y + (t.dy || 0), it.z)
      s.setScalar(t.s)
      if (t.sy) s.y = t.sy
      m.compose(p, q, s)
      ref.current.setMatrixAt(i, m)
      if (colors) ref.current.setColorAt(i, colors[Math.floor(it.r3 * colors.length)])
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [items, transform, colors])
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow />
}

export default function Vegetation({ mobile }) {
  const data = useMemo(() => {
    const grass = scatter(mobile ? 1800 : 4200, 11, (x, z) => height(x, z) < 8)
    const flowers = scatter(mobile ? 500 : 1200, 23, (x, z, r) => height(x, z) < 6 && Math.sin(x * 0.08) * Math.cos(z * 0.07) > -0.2 + r() * 0.4)
    const rocks = scatter(160, 37)
    return { grass, flowers, rocks }
  }, [mobile])

  const res = useMemo(() => ({
    grassGeo: new THREE.ConeGeometry(0.14, 0.7, 3),
    grassMat: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 }),
    grassColors: ['#8fae4a', '#a7bc5c', '#7c9a42', '#c2b86a'].map((c) => new THREE.Color(c)),
    flowerGeo: new THREE.IcosahedronGeometry(0.13, 0),
    flowerMat: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.8 }),
    flowerColors: ['#f4f1ea', '#f6d44d', '#b58ad8', '#e7798f', '#f4f1ea'].map((c) => new THREE.Color(c)),
    rockGeo: new THREE.DodecahedronGeometry(0.6, 0),
    rockMat: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 }),
    rockColors: ['#8e8a80', '#7b776e', '#a19c90'].map((c) => new THREE.Color(c)),
  }), [])

  const grassT = useMemo(() => (it) => ({ s: 0.7 + it.r * 0.9, ry: it.r2 * 6, rz: (it.r - 0.5) * 0.3, dy: 0.25 }), [])
  const flowerT = useMemo(() => (it) => ({ s: 0.7 + it.r * 0.6, dy: 0.18 }), [])
  const rockT = useMemo(() => (it) => ({ s: 0.4 + it.r * it.r * 1.8, sy: 0.3 + it.r * 0.8, ry: it.r2 * 6, rx: it.r3, dy: 0 }), [])

  return (
    <>
      <Instances items={data.grass} geometry={res.grassGeo} material={res.grassMat} colors={res.grassColors} transform={grassT} />
      <Instances items={data.flowers} geometry={res.flowerGeo} material={res.flowerMat} colors={res.flowerColors} transform={flowerT} />
      <Instances items={data.rocks} geometry={res.rockGeo} material={res.rockMat} colors={res.rockColors} transform={rockT} castShadow />
    </>
  )
}
