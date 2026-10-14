import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { RACE_GATE, SUMMIT, height } from './layout'
import { car, getBestRace, race, setBestRace, setRaceRunning, showToast } from './store'
import { FONT_URL } from './NameLetters'
import { chime } from '../audio/sound'

export const formatTime = (ms) => {
  const s = ms / 1000
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`
}

function checkerTexture() {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 32
  const g = c.getContext('2d')
  for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) {
    g.fillStyle = (x + y) % 2 ? '#1d1b17' : '#fbf7ee'
    g.fillRect(x * 16, y * 16, 16, 16)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// Start gate: drive through it to start the clock; reach the summit to stop it.
export default function Race() {
  const { x, z, ry, half, dirX, dirZ } = RACE_GATE
  const y = height(x, z)
  const tex = useMemo(checkerTexture, [])
  const prev = useRef({ side: 0, x: car.x, z: car.z, cooldown: 0 })

  useFrame((_, delta) => {
    const p = prev.current
    p.cooldown = Math.max(0, p.cooldown - delta)
    // A sudden jump means a teleport or reset: abandon the run.
    if (Math.hypot(car.x - p.x, car.z - p.z) > 8 && race.running) setRaceRunning(false)
    p.x = car.x; p.z = car.z
    // Which side of the gate line is the van on (along the track direction)?
    const along = (car.x - x) * dirX + (car.z - z) * dirZ
    const across = Math.abs((car.x - x) * dirZ - (car.z - z) * dirX)
    const side = Math.sign(along)
    if (p.side < 0 && side > 0 && across < half && !p.cooldown) {
      setRaceRunning(true, performance.now())
      chime()
      showToast('Go! Race to the summit 🏁', 1600)
      p.cooldown = 2
    }
    p.side = side || p.side
    if (race.running && Math.hypot(car.x - SUMMIT.x, car.z - SUMMIT.z) < 5) {
      const t = performance.now() - race.start
      setRaceRunning(false)
      const best = getBestRace()
      if (best === null || t < best) {
        setBestRace(t)
        chime(true)
        showToast(`⏱ ${formatTime(t)} — new record!`, 3600)
      } else showToast(`⏱ ${formatTime(t)} (best ${formatTime(best)})`, 3200)
    }
  })

  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * half, 1.9, 0]} castShadow>
          <boxGeometry args={[0.22, 3.8, 0.22]} />
          <meshStandardMaterial color="#d9622b" flatShading />
        </mesh>
      ))}
      <mesh position={[0, 3.55, 0]} castShadow>
        <boxGeometry args={[half * 2 + 0.3, 0.55, 0.12]} />
        <meshStandardMaterial map={tex} />
      </mesh>
      {/* Sign board above the banner, lettered on both faces */}
      <mesh position={[0, 4.25, 0]} castShadow>
        <boxGeometry args={[half * 1.7, 0.7, 0.14]} />
        <meshStandardMaterial color="#d9622b" flatShading />
      </mesh>
      {[1, -1].map((sd) => (
        <Text key={sd} font={FONT_URL} position={[0, 4.24, sd * 0.08]} rotation={[0, sd > 0 ? 0 : Math.PI, 0]} fontSize={0.36} letterSpacing={0.12} color="#fffaf0" anchorX="center" anchorY="middle">
          RACE TO THE SUMMIT
        </Text>
      ))}
    </group>
  )
}
