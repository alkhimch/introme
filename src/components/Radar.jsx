import { useEffect, useRef } from 'react'
import { CAMERA_OFFSET, GERS, NAME_POS, PATHS, WORLD_RADIUS, ZONES } from '../world/layout'
import { car, commands, setStarted } from '../world/store'

const RANGE = 48 // world units from the van to the radar rim
const ZONE_STYLE = {
  work: { color: '#5b9cf5', icon: 'D' },
  hobbies: { color: '#f08a3c', icon: 'H' },
  photos: { color: '#c48ef0', icon: 'P' },
  contact: { color: '#4fd18b', icon: 'C' },
}

// Circular mini-map, rotated to match the follow camera so "up" means "into the screen".
export default function Radar({ mobile }) {
  const canvas = useRef()
  const markers = useRef([])

  useEffect(() => {
    const cv = canvas.current
    const ctx = cv.getContext('2d')
    const [ox, , oz] = mobile ? CAMERA_OFFSET.mobile : CAMERA_OFFSET.desktop
    const len = Math.hypot(ox, oz)
    const fx = -ox / len, fz = -oz / len // world direction that points "up" on screen
    const rx = -fz, rz = fx // world direction that points "right" on screen
    let raf = 0, size = 0, dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      size = cv.clientWidth
      cv.width = cv.height = Math.round(size * dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (time) => {
      raf = requestAnimationFrame(draw)
      const R = size / 2, scale = (R - 6) / RANGE
      const toScreen = (x, z) => {
        const dx = x - car.x, dz = z - car.z
        return [R + (dx * rx + dz * rz) * scale, R - (dx * fx + dz * fz) * scale]
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.beginPath(); ctx.arc(R, R, R - 1, 0, Math.PI * 2); ctx.clip()
      ctx.fillStyle = 'rgba(24, 34, 22, 0.86)'
      ctx.fillRect(0, 0, size, size)

      // Range rings + crosshair
      ctx.strokeStyle = 'rgba(160, 230, 160, 0.16)'; ctx.lineWidth = 1
      for (const f of [0.33, 0.66]) { ctx.beginPath(); ctx.arc(R, R, R * f, 0, Math.PI * 2); ctx.stroke() }
      ctx.beginPath(); ctx.moveTo(R, 0); ctx.lineTo(R, size); ctx.moveTo(0, R); ctx.lineTo(size, R); ctx.stroke()

      // World edge (mountains)
      const [ex, ey] = toScreen(0, 0)
      ctx.strokeStyle = 'rgba(200, 190, 160, 0.5)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(ex, ey, WORLD_RADIUS * scale, 0, Math.PI * 2); ctx.stroke()

      // Dirt tracks
      ctx.strokeStyle = 'rgba(214, 178, 120, 0.75)'; ctx.lineWidth = Math.max(2, 3.5 * scale); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      for (const path of PATHS) {
        ctx.beginPath()
        path.forEach(([x, z], i) => { const [sx, sy] = toScreen(x, z); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy) })
        ctx.stroke()
      }

      // Gers + the name
      ctx.fillStyle = 'rgba(245, 240, 228, 0.85)'
      for (const g of GERS) { const [sx, sy] = toScreen(g.x, g.z); ctx.beginPath(); ctx.arc(sx, sy, Math.max(2, g.r * scale), 0, Math.PI * 2); ctx.fill() }
      { const [sx, sy] = toScreen(NAME_POS.x, NAME_POS.z); ctx.fillRect(sx - 8 * scale * 1.2, sy - 1.5, 16 * scale * 1.2, 3) }

      // Radar sweep
      const a = (time / 1000) * 1.6
      const grad = ctx.createConicGradient ? ctx.createConicGradient(a, R, R) : null
      if (grad) {
        grad.addColorStop(0, 'rgba(120, 255, 140, 0.28)')
        grad.addColorStop(0.12, 'rgba(120, 255, 140, 0)')
        grad.addColorStop(1, 'rgba(120, 255, 140, 0)')
        ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size)
      }
      ctx.restore()

      // Zones: in range → coloured disc; out of range → pinned to the rim
      const placed = []
      ctx.font = `700 ${mobile ? 9 : 10}px "Josefin Sans", sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      // North marker on the rim (drawn first so zone markers sit on top of it)
      { const [nx, ny] = toScreen(car.x, car.z - 1000); const dx = nx - R, dy = ny - R, d = Math.hypot(dx, dy)
        ctx.fillStyle = 'rgba(245, 240, 228, 0.75)'; ctx.fillText('N', R + (dx / d) * (R - 8), R + (dy / d) * (R - 8)) }
      for (const z of ZONES) {
        const st = ZONE_STYLE[z.id]
        let [sx, sy] = toScreen(z.x, z.z)
        const dx = sx - R, dy = sy - R, d = Math.hypot(dx, dy), max = R - 9
        const inside = d <= max
        if (!inside) { sx = R + (dx / d) * max; sy = R + (dy / d) * max }
        if (inside) {
          ctx.fillStyle = st.color + '33'; ctx.strokeStyle = st.color; ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.arc(sx, sy, Math.max(6, z.r * scale), 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        }
        ctx.fillStyle = st.color
        ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#10180f'; ctx.fillText(st.icon, sx, sy + 1)
        placed.push({ id: z.id, x: sx, y: sy })
      }
      markers.current = placed

      // The van, pointing where it drives
      const hx = Math.sin(car.heading), hz = Math.cos(car.heading)
      const ang = Math.atan2(hx * rx + hz * rz, hx * fx + hz * fz)
      ctx.save(); ctx.translate(R, R); ctx.rotate(ang)
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#10180f'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(6, 6); ctx.lineTo(0, 3); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.stroke()
      ctx.restore()

      ctx.strokeStyle = 'rgba(245, 240, 228, 0.55)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(R, R, R - 1, 0, Math.PI * 2); ctx.stroke()
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [mobile])

  const onClick = (e) => {
    const rect = canvas.current.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const hit = markers.current.find((m) => Math.hypot(m.x - x, m.y - y) < 12)
    if (hit) { commands.teleport = hit.id; setStarted() }
  }

  return (
    <div className="radar">
      <canvas ref={canvas} onClick={onClick} role="img" aria-label="Radar map. Click a zone marker to jump there." />
    </div>
  )
}
