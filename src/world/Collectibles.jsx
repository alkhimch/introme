import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SHAGAI } from './layout'
import { car, collect, getFound, showToast, useFound } from './store'
import { chime } from '../audio/sound'

// A golden shagai (ankle bone): a knobbly, slightly squashed gem that spins and bobs,
// with a soft glow so it can be spotted from a distance.
function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,220,120,0.9)')
  grad.addColorStop(0.4, 'rgba(255,200,80,0.35)')
  grad.addColorStop(1, 'rgba(255,200,80,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

function Shagai({ spot, onPick }) {
  const g = useRef()
  const picked = useRef(false)
  const res = useMemo(() => ({
    geo: new THREE.DodecahedronGeometry(0.42, 0).scale(0.8, 0.62, 1.1),
    mat: new THREE.MeshStandardMaterial({ color: '#f2c14e', metalness: 0.85, roughness: 0.25, emissive: '#a8740f', emissiveIntensity: 0.35, flatShading: true }),
    glow: glowTexture(),
  }), [])
  useFrame((st) => {
    if (picked.current) return
    const t = st.clock.elapsedTime
    g.current.position.y = spot.y + 1.0 + Math.sin(t * 2 + spot.x) * 0.15
    g.current.rotation.y = t * 1.6
    if (Math.hypot(car.x - spot.x, car.z - spot.z) < 2.6) {
      picked.current = true
      onPick(spot.id)
    }
  })
  return (
    <group ref={g} position={[spot.x, spot.y + 1, spot.z]}>
      <mesh geometry={res.geo} material={res.mat} castShadow />
      <sprite scale={2.4}>
        <spriteMaterial map={res.glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

export default function Collectibles() {
  const found = useFound()
  const onPick = (id) => {
    if (!collect(id)) return
    const n = getFound().length
    if (n >= SHAGAI.length) {
      chime(true)
      showToast(`All ${SHAGAI.length} golden shagai found! 🎉`, 4200)
    } else {
      chime()
      showToast(`Golden shagai ${n}/${SHAGAI.length}`, 1800)
    }
  }
  return SHAGAI.filter((s) => !found.includes(s.id)).map((s) => <Shagai key={s.id} spot={s} onPick={onPick} />)
}
