import { Canvas } from '@react-three/fiber'
import Particles from './Particles'
import Prints from './Prints'

export default function Scene({ photos, onOpenPhoto }) {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 700
  return (
    <Canvas
      className="webgl"
      camera={{ position: [0, 0, 10], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      eventSource={typeof document !== 'undefined' ? document.getElementById('root') : undefined}
      eventPrefix="client"
    >
      <Particles count={mobile ? 4500 : 10000} />
      <Prints photos={photos} onOpen={onOpenPhoto} />
    </Canvas>
  )
}
