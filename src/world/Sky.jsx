import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rng } from './layout'
import { useSeason, useTimeOfDay } from './store'
import { environment } from './seasons'

// Environment for the current season + time of day.
export function useEnvironment() {
  const season = useSeason(), time = useTimeOfDay()
  return useMemo(() => environment(season, time), [season, time])
}

export function SkyDome() {
  const env = useEnvironment()
  const uniforms = useMemo(() => ({ uTop: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() } }), [])
  const mat = useRef()
  useEffect(() => {
    const u = mat.current.uniforms
    u.uTop.value.copy(env.top)
    u.uHorizon.value.copy(env.horizon)
  }, [env])
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

// Fog, fill light and ambient light follow the season and time of day.
export function SeasonEnvironment() {
  const env = useEnvironment()
  const scene = useThree((s) => s.scene)
  const hemi = useRef()
  const amb = useRef()
  useEffect(() => {
    if (!scene.fog) scene.fog = new THREE.Fog(env.fog, env.near, env.far)
    scene.fog.color.copy(env.fog)
    scene.fog.near = env.near
    scene.fog.far = env.far
    hemi.current.color.copy(env.hemiSky)
    hemi.current.groundColor.copy(env.hemiGround)
    hemi.current.intensity = env.hemiIntensity
    amb.current.intensity = env.ambient
  }, [env, scene])
  return (
    <>
      <hemisphereLight ref={hemi} />
      <ambientLight ref={amb} />
    </>
  )
}

// Stars and a moon, faded in for the evening and night.
export function StarsAndMoon() {
  const env = useEnvironment()
  const stars = useMemo(() => {
    const r = rng(9), n = 1600, pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const u = r() * 2 * Math.PI, v = 0.06 + r() * 0.94
      const y = v, rad = Math.sqrt(1 - y * y)
      pos.set([Math.cos(u) * rad * 360, y * 360, Math.sin(u) * rad * 360], i * 3)
    }
    return pos
  }, [])
  const group = useRef()
  const camera = useThree((s) => s.camera)
  useFrame(() => { group.current.position.set(camera.position.x, 0, camera.position.z) })
  if (env.stars <= 0) return <group ref={group} />
  const [mx, my, mz] = env.sunDir
  const l = Math.hypot(mx, my, mz)
  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={1.6} sizeAttenuation={false} transparent opacity={env.stars} fog={false} depthWrite={false} />
      </points>
      {env.stars > 0.5 && (
        <mesh position={[(mx / l) * 300, (my / l) * 300, (mz / l) * 300]}>
          <sphereGeometry args={[9, 20, 14]} />
          <meshBasicMaterial color="#f4f1dc" fog={false} />
        </mesh>
      )}
    </group>
  )
}

// Puffy low-poly clouds drifting over the steppe.
export function Clouds() {
  const env = useEnvironment()
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
    mat.color.copy(env.cloud)
    mat.emissive.copy(env.cloud)
  }, [env, mat])
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
