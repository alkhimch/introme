import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { ZONES, height } from './layout'
import { car, getZone, setZone } from './store'
import { FONT_URL } from './NameLetters'

function ZoneMarker({ zone }) {
  const ring = useRef()
  const y = height(zone.x, zone.z) + 0.06
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff6dc', transparent: true, opacity: 0.35, depthWrite: false }), [])
  useFrame((state) => {
    const active = getZone() === zone.id
    const target = active ? 0.85 + Math.sin(state.clock.elapsedTime * 3) * 0.1 : 0.35
    mat.opacity += (target - mat.opacity) * 0.1
  })
  return (
    <group>
      <mesh ref={ring} position={[zone.x, y, zone.z]} rotation={[-Math.PI / 2, 0, 0]} material={mat}>
        <ringGeometry args={[zone.r - 0.35, zone.r, 72]} />
      </mesh>
      <Text
        font={FONT_URL}
        position={[zone.x, y + 0.02, zone.z + zone.r + 2.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={1.9}
        letterSpacing={0.12}
        color="#fffaf0"
        outlineWidth={0.05}
        outlineColor="#6d5f3f"
        anchorX="center"
        anchorY="middle"
      >
        {zone.label}
      </Text>
    </group>
  )
}

export default function Zones() {
  useFrame(() => {
    let found = null
    for (const z of ZONES) if (Math.hypot(car.x - z.x, car.z - z.z) < z.r + 1.5) found = z.id
    setZone(found)
  })
  return ZONES.map((z) => <ZoneMarker key={z.id} zone={z} />)
}
