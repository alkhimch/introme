import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rng } from './layout'

export const SKY = { top: '#4f8fd0', horizon: '#f3dcb4', fog: '#e9d6b5' }

export function SkyDome() {
  const uniforms = useMemo(
    () => ({ uTop: { value: new THREE.Color(SKY.top) }, uHorizon: { value: new THREE.Color(SKY.horizon) } }),
    [],
  )
  return (
    <mesh scale={400}>
      <sphereGeometry args={[1, 32, 16]} />
      <shaderMaterial
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

// Puffy low-poly clouds drifting over the steppe.
export function Clouds() {
  const group = useRef()
  const clouds = useMemo(() => {
    const r = rng(42)
    return Array.from({ length: 14 }, () => ({
      x: (r() - 0.5) * 260, z: (r() - 0.5) * 260, y: 34 + r() * 14, s: 2.5 + r() * 3,
      puffs: Array.from({ length: 4 + Math.floor(r() * 4) }, (_, i) => [i * 1.4 - 2 + r(), r() * 0.8, (r() - 0.5) * 1.6, 1 + r() * 0.8]),
    }))
  }, [])
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
            <mesh key={j} position={[x, y, z]} scale={s}>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#ffffff" flatShading roughness={1} emissive="#ffffff" emissiveIntensity={0.25} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}
