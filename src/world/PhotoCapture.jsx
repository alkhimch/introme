import { useFrame, useThree } from '@react-three/fiber'
import { photoRequest } from './store'

// Renders one frame on request and downloads it as a PNG (works without preserveDrawingBuffer
// because the canvas is read straight after rendering, in the same task).
export default function PhotoCapture() {
  const { gl, scene, camera } = useThree()
  useFrame(() => {
    if (!photoRequest.pending) return
    photoRequest.pending = false
    gl.render(scene, camera)
    const url = gl.domElement.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `alkhimch-steppe-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`
    a.click()
  })
  return null
}
