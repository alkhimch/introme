import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rng } from './layout'
import { useSeason } from './store'
import { SEASON_LOOK } from './seasons'

export function SkyDome() {
  const season = useSeason()
  const uniforms = useMemo(() => ({ uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() } }), [])
  const mat = useRef()
  useEffect(() => {
    const sky = SEASON_LOOK[season].sky
    const u = mat.current.uniforms
    u.uTop.value.set(sky.top)
    u.uHorizon.value.set(sky.horizon)
  }, [season])
  return (
    <mesh scale={400}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
        ref={mat}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`uniform vec3 uTop; uniform vec3 uHorizon; varying vec3 vP;
          void main(){ float h = normalize(vP).y; vec3 c = mix(uHorizon, uTop, smoothstep(-0.02, 0.45, h)); gl_FragColor = vec4(c,1.0); }`}
      />
    </mesh>
  )
}

// Fog and the sky/ground fill light follow the season.
export function SeasonEnvironment() {
  const season = useSeason()
  const scene = useThree((s) => s.scene)
  const hemi = useRef()
  useEffect(() => {
    const look = SEASON_LOOK[season]
    if (!scene.fog) scene.fog = new THREE.Fog(look.sky.fog, look.sky.near, look.sky.far)
    scene.fog.color.set(look.sky.fog)
    scene.fog.near = look.sky.near
    scene.fog.far = look.sky.far
    hemi.current.color.set(look.hemi.sky)
    hemi.current.groundColor.set(look.hemi.ground)
    hemi.current.intensity = look.hemi.intensity
  }, [season, scene])
  return <hemisphereLight ref={hemi} />
}

// Puffy low-poly clouds drifting over the steppe.
export function Clouds() {
  const season = useSeason()
  const group = useRef()
  const clouds = useMemo(() => {
    const r = rng(42)
    return Array.from({ length: 14 }, () => ({
      x: (r() - 0.5) * 260, z: (r() - 0.5) * 260, y: 34 + r() * 14, s: 2.5 + r() * 3,
      puffs: Array.from({ length: 4 + Math.floor(r() * 4) }, (_, i) => [i * 1.4 - 2 + r(), r() * 0.8, (r() - 0.5) * 1.6, 1 + r() * 0.8]),
    }))
  }, [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1, emissiveIntensity: 0.25 }), [])
  useEffect(() => {
    mat.color.set(SEASON_LOOK[season].cloud)
    mat.emissive.set(SEASON_LOOK[season].cloud)
  }, [season, mat])
  useFrame((_, dt) => {
    for (const c of group.current.children) {
      c.position.x += dt * 1.2
      if (c.position.x > 140) c.position.x = -140
    }
  })
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {c.puffs.map(([x, y, z, s], j) => (
            <mesh key={j} position={[x, y, z]} scale={s} material={mat}>
              <icosahedronGeometry args={[1, 0]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
