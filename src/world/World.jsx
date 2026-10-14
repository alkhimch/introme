import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Terrain from './Terrain'
import { Clouds, SeasonEnvironment, SkyDome, StarsAndMoon } from './Sky'
import Vegetation from './Vegetation'
import Car from './Car'
import NameLetters from './NameLetters'
import Landmarks from './Landmarks'
import Zones from './Zones'
import Hobbies from './Hobbies'
import OrbitInput from './OrbitInput'
import Camp from './Camp'
import Herds from './Herds'
import Trees from './Trees'
import Weather from './Weather'
import Water from './Water'
import Birds from './Birds'

export default function World({ photos, onOpenPhoto, mobile }) {
  return (
    <Canvas
      className="webgl"
      shadows="percentage"
      dpr={[1, mobile ? 1.5 : 1.75]}
      camera={{ fov: mobile ? 55 : 42, near: 0.5, far: 900, position: [8, 14, 30] }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <SeasonEnvironment />
      <SkyDome />
      <StarsAndMoon />
      <Clouds />
      <Terrain />
      <Vegetation mobile={mobile} />
      <Trees />
      <Water />
      <Birds />
      <Weather mobile={mobile} />
      <Zones />
      <OrbitInput />
      <Car mobile={mobile} />
      <Suspense fallback={null}>
        <NameLetters />
        <Landmarks photos={photos} onOpenPhoto={onOpenPhoto} />
        <Hobbies />
        <Camp />
        <Herds />
      </Suspense>
    </Canvas>
  )
}
