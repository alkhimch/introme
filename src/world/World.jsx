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
import Summit from './Summit'
import Collectibles from './Collectibles'
import Race from './Race'
import GuestbookBoard from './Guestbook'
import Naadam from './Naadam'
import PhotoCapture from './PhotoCapture'
import { QUALITY } from './quality'
import { useQuality } from './store'

export default function World({ photos, onOpenPhoto, mobile }) {
  const qualityName = useQuality()
  const q = QUALITY[qualityName]
  return (
    <Canvas
      key={qualityName}
      className="webgl"
      shadows={q.shadows ? 'percentage' : false}
      dpr={q.dpr}
      camera={{ fov: mobile ? 55 : 42, near: 0.5, far: 900, position: [8, 14, 30] }}
      gl={{ antialias: q.antialias, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <SeasonEnvironment />
      <SkyDome />
      <StarsAndMoon />
      <Clouds />
      <Terrain />
      <Vegetation mobile={mobile} quality={q} />
      <Trees quality={q} />
      <Water />
      <Birds />
      <Weather mobile={mobile} quality={q} />
      <Zones />
      <OrbitInput />
      <PhotoCapture />
      <Car mobile={mobile} quality={q} />
      <Suspense fallback={null}>
        <NameLetters />
        <Landmarks photos={photos} onOpenPhoto={onOpenPhoto} />
        <Hobbies />
        <Camp />
        <Herds />
        <Summit />
        <Collectibles />
        <Race />
        <GuestbookBoard />
        <Naadam />
      </Suspense>
    </Canvas>
  )
}
