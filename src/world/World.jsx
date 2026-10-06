import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Terrain from './Terrain'
import { Clouds, SKY, SkyDome } from './Sky'
import Vegetation from './Vegetation'
import Car from './Car'
import NameLetters from './NameLetters'
import Landmarks from './Landmarks'
import Zones from './Zones'
import Hobbies from './Hobbies'
import OrbitInput from './OrbitInput'
import Camp from './Camp'

export default function World({ photos, onOpenPhoto, mobile }) {
  return (
    <Canvas
      className="webgl"
      shadows="percentage"
      dpr={[1, mobile ? 1.5 : 1.75]}
      camera={{ fov: mobile ? 55 : 42, near: 0.5, far: 900, position: [8, 14, 30] }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <fog attach="fog" args={[SKY.fog, 70, 230]} />
      <hemisphereLight args={['#cfe2ff', '#8a7a4f', 1.1]} />
      <ambientLight intensity={0.15} />
      <SkyDome />
      <Clouds />
      <Terrain />
      <Vegetation mobile={mobile} />
      <Zones />
      <OrbitInput />
      <Car mobile={mobile} />
      <Suspense fallback={null}>
        <NameLetters />
        <Landmarks photos={photos} onOpenPhoto={onOpenPhoto} />
        <Hobbies />
        <Camp />
      </Suspense>
    </Canvas>
  )
}
