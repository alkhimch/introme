import { Text } from '@react-three/drei'
import { zoneById, height } from './layout'
import { useSeason } from './store'
import { FONT_URL } from './NameLetters'

const Std = (props) => <meshStandardMaterial flatShading roughness={0.95} {...props} />

// A wooden notice board with pinned notes — driving up to it opens the guestbook panel.
export default function GuestbookBoard() {
  const z = zoneById.guestbook
  const y = height(z.x, z.z)
  const winter = useSeason() === 'winter'
  const notes = [['#fff4c2', -0.75, 0.25, 0.1], ['#cfe8ff', 0.1, 0.35, -0.08], ['#ffd6e0', 0.85, 0.2, 0.06], ['#d8f5c8', -0.35, -0.35, -0.05], ['#fff4c2', 0.55, -0.4, 0.12]]
  return (
    <group position={[z.x, y, z.z]} rotation={[0, 0.5, 0]}>
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]} castShadow><boxGeometry args={[0.16, 2.2, 0.16]} /><Std color="#5e3f29" /></mesh>
      ))}
      <mesh position={[0, 1.7, 0]} castShadow><boxGeometry args={[2.7, 1.5, 0.1]} /><Std color="#9b6a3e" /></mesh>
      <mesh position={[0, 2.55, 0.1]} rotation={[0.5, 0, 0]} castShadow><boxGeometry args={[3.0, 0.08, 0.6]} /><Std color="#b5432f" /></mesh>
      {winter && <mesh position={[0, 2.62, 0.13]} rotation={[0.5, 0, 0]}><boxGeometry args={[3.0, 0.06, 0.6]} /><Std color="#f4f7fa" /></mesh>}
      {notes.map(([c, x, ny, rz], i) => (
        <mesh key={i} position={[x, 1.7 + ny, 0.06]} rotation={[0, 0, rz]}><planeGeometry args={[0.5, 0.42]} /><Std color={c} /></mesh>
      ))}
      <Text font={FONT_URL} position={[0, 2.25, 0.07]} fontSize={0.2} letterSpacing={0.15} color="#fff4dc" anchorX="center">GUESTBOOK</Text>
    </group>
  )
}
