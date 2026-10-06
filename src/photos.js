import { useMemo } from 'react'

// Procedural landscape used until real photos are added in content.js.
function placeholderCanvas([sky, mid, ground], seed) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 640
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 0, 0, 640)
  g.addColorStop(0, mid); g.addColorStop(0.55, sky); g.addColorStop(1, ground)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 640)
  ctx.fillStyle = sky
  ctx.globalAlpha = 0.9
  ctx.beginPath()
  ctx.arc(150 + (seed % 3) * 110, 300 - (seed % 2) * 60, 46, 0, Math.PI * 2)
  ctx.fill()
  for (let layer = 0; layer < 3; layer++) {
    ctx.globalAlpha = 0.55 + layer * 0.2
    ctx.fillStyle = ground
    ctx.beginPath()
    ctx.moveTo(0, 640)
    const base = 380 + layer * 70
    for (let x = 0; x <= 512; x += 8) {
      const y = base - Math.sin(x * 0.008 * (layer + 1) + seed * 1.7) * (40 - layer * 8) - Math.sin(x * 0.03 + seed) * 6
      ctx.lineTo(x, y)
    }
    ctx.lineTo(512, 640)
    ctx.fill()
  }
  // Film grain
  const img = ctx.getImageData(0, 0, 512, 640)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 18
    img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n
  }
  ctx.globalAlpha = 1
  ctx.putImageData(img, 0, 0)
  return c
}

// Resolves content.js photo entries into { title, url, canvas? } without pulling in three.js.
export function usePhotoSources(photos) {
  return useMemo(
    () =>
      photos.map((p, i) => {
        if (p.src) return { ...p, url: p.src }
        const canvas = placeholderCanvas(p.palette || ['#ddd', '#888', '#222'], i + 1)
        return { ...p, canvas, url: canvas.toDataURL('image/jpeg', 0.9) }
      }),
    [photos],
  )
}
