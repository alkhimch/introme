import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { height, hillInfluence, pathDistance, rng, smoothstep } from './layout'
import { useSeason } from './store'
import { SEASON_LOOK, SNOW } from './seasons'

const ROCK = new THREE.Color('#8d877c')
const ROCK_DARK = new THREE.Color('#6f6b63')

export default function Terrain() {
  const season = useSeason()

  // Geometry plus per-face facts (height, slope, path, hill...) computed once;
  // the colours are repainted from these whenever the season changes.
  const { geometry, faces } = useMemo(() => {
    const size = 330, seg = 165
    let g = new THREE.PlaneGeometry(size, size, seg, seg)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) p.setY(i, height(p.getX(i), p.getZ(i)))
    // Non-indexed + per-face colour gives the faceted low-poly look.
    g = g.toNonIndexed()
    g.computeVertexNormals()
    const pos = g.attributes.position, nor = g.attributes.normal
    const rand = rng(7)
    const list = []
    for (let i = 0; i < pos.count; i += 3) {
      const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3
      const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3
      const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3
      const n = rand()
      const ring = smoothstep(84, 100, Math.hypot(x, z))
      list.push({
        y, n, ring,
        slope: 1 - nor.getY(i),
        dry: smoothstep(0.35, 1, Math.sin(x * 0.05 + 1) * Math.cos(z * 0.04)),
        dirt: smoothstep(2.4, 1.2, pathDistance(x, z) + (n - 0.5) * 0.8),
        hill: hillInfluence(x, z),
      })
    }
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3))
    return { geometry: g, faces: list }
  }, [])

  useEffect(() => {
    const look = SEASON_LOOK[season].ground
    const winter = season === 'winter'
    const colors = geometry.attributes.color.array
    const c = new THREE.Color()
    faces.forEach((f, idx) => {
      c.copy(look.a).lerp(look.b, f.n * 0.7)
      c.lerp(look.dry, f.dry * 0.6)
      // Autumn: leaf litter under the forests on the hills.
      if (look.litter) c.lerp(look.litter, smoothstep(0.15, 0.6, f.hill) * 0.55 * (0.6 + f.n * 0.4))
      // Winter: a few patches of dry grass poke through the snow.
      if (look.patch && f.n < 0.08 && f.ring < 0.5) c.lerp(look.patch, 0.6)
      c.lerp(look.dirt, f.dirt)
      // Rock on the mountain ring and on steep slopes.
      const rocky = Math.max(f.ring * smoothstep(5, 13, f.y), smoothstep(0.3, 0.5, f.slope))
      c.lerp(f.n > 0.5 ? ROCK : ROCK_DARK, rocky * (winter ? 0.35 : 1))
      c.lerp(SNOW, winter ? 0.0 : smoothstep(look.snowLine, look.snowLine + 4, f.y + f.n * 2))
      const o = idx * 9
      for (let k = 0; k < 3; k++) { colors[o + k * 3] = c.r; colors[o + k * 3 + 1] = c.g; colors[o + k * 3 + 2] = c.b }
    })
    geometry.attributes.color.needsUpdate = true
  }, [season, geometry, faces])

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </mesh>
  )
}
