import { useMemo } from 'react'
import * as THREE from 'three'
import { height, pathDistance, rng, smoothstep } from './layout'

const C = {
  grassA: new THREE.Color('#a3b65a'),
  grassB: new THREE.Color('#87a34b'),
  dry: new THREE.Color('#c7b874'),
  dirt: new THREE.Color('#b08d5e'),
  rock: new THREE.Color('#8d877c'),
  rockDark: new THREE.Color('#6f6b63'),
  snow: new THREE.Color('#f3f1ec'),
}

export default function Terrain() {
  const geometry = useMemo(() => {
    const size = 330, seg = 165
    let g = new THREE.PlaneGeometry(size, size, seg, seg)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)))
    // Non-indexed + per-face colour gives the faceted low-poly look.
    g = g.toNonIndexed()
    g.computeVertexNormals()
    const pos = g.attributes.position, nor = g.attributes.normal
    const colors = new Float32Array(pos.count * 3)
    const rand = rng(7)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i += 3) {
      const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3
      const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3
      const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3
      const slope = 1 - nor.getY(i)
      const n = rand()
      c.copy(C.grassA).lerp(C.grassB, n * 0.7)
      c.lerp(C.dry, smoothstep(0.35, 1, Math.sin(x * 0.05 + 1) * Math.cos(z * 0.04)) * 0.6)
      const dirt = smoothstep(2.4, 1.2, pathDistance(x, z) + (n - 0.5) * 0.8)
      c.lerp(C.dirt, dirt)
      const rocky = Math.max(smoothstep(5, 13, y), smoothstep(0.25, 0.45, slope))
      c.lerp(n > 0.5 ? C.rock : C.rockDark, rocky)
      c.lerp(C.snow, smoothstep(24, 28, y + n * 2))
      for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (i + k) * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </mesh>
  )
}
