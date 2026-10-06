// Each generator returns a Float32Array of `count` xyz points, roughly within radius ~2.2.

const rand = (a, b) => a + Math.random() * (b - a)

export function sphere(count, r = 2) {
  const out = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const rad = Math.sqrt(1 - y * y)
    const th = golden * i
    const rr = r * (1 + rand(-0.01, 0.01))
    out.set([Math.cos(th) * rad * rr, y * rr, Math.sin(th) * rad * rr], i * 3)
  }
  return out
}

// Points scattered along the edges of a 4×4×4 lattice: reads as structure / code.
export function lattice(count, size = 3.2, cells = 4) {
  const out = new Float32Array(count * 3)
  const step = size / cells
  const h = size / 2
  for (let i = 0; i < count; i++) {
    const axis = i % 3
    const a = Math.floor(Math.random() * (cells + 1)) * step - h
    const b = Math.floor(Math.random() * (cells + 1)) * step - h
    const t = rand(-h, h)
    const p = axis === 0 ? [t, a, b] : axis === 1 ? [a, t, b] : [a, b, t]
    // Small jitter keeps it organic rather than CAD-perfect.
    out.set(p.map((v) => v + rand(-0.015, 0.015)), i * 3)
  }
  return out
}

// Ordered samples along one Lorenz trajectory, so particles can "flow" by index.
export function lorenz(count, scale = 0.085) {
  const out = new Float32Array(count * 3)
  const sigma = 10, rho = 28, beta = 8 / 3, dt = 0.004
  let x = 0.1, y = 0, z = 0
  for (let i = 0; i < 2000; i++) {
    const dx = sigma * (y - x), dy = x * (rho - z) - y, dz = x * y - beta * z
    x += dx * dt; y += dy * dt; z += dz * dt
  }
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 3; k++) {
      const dx = sigma * (y - x), dy = x * (rho - z) - y, dz = x * y - beta * z
      x += dx * dt; y += dy * dt; z += dz * dt
    }
    out.set([x * scale, (z - 25) * scale, y * scale], i * 3)
  }
  return out
}

// Camera aperture: outer barrel rings + iris blades.
export function aperture(count, R = 2.1, blades = 7) {
  const out = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const kind = Math.random()
    let p
    if (kind < 0.38) {
      const th = rand(0, Math.PI * 2)
      const ring = Math.random() < 0.6 ? R : R * 1.12
      p = [Math.cos(th) * ring, Math.sin(th) * ring, rand(-0.35, 0.35)]
    } else {
      const k = Math.floor(Math.random() * blades)
      const a0 = (k / blades) * Math.PI * 2
      const dir = a0 + Math.PI * 0.62
      const t = rand(0, R * 1.25)
      const sx = Math.cos(a0) * R, sy = Math.sin(a0) * R
      let px = sx + Math.cos(dir) * t, py = sy + Math.sin(dir) * t
      const len = Math.hypot(px, py)
      if (len > R) { px *= R / len; py *= R / len }
      p = [px, py, rand(-0.04, 0.04)]
    }
    out.set(p, i * 3)
  }
  return out
}

// Rasterise a word with the page font and sample its filled pixels.
// Result is normalised to width 1, centred on the origin.
export function textPoints(word, count, font = '"Josefin Sans", sans-serif') {
  const W = 1400, H = 300
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  let size = 220
  ctx.font = `600 ${size}px ${font}`
  while (ctx.measureText(word).width > W * 0.94 && size > 20) {
    size -= 6
    ctx.font = `600 ${size}px ${font}`
  }
  ctx.fillText(word, W / 2, H / 2 + size * 0.08)
  const data = ctx.getImageData(0, 0, W, H).data
  const pts = []
  let minX = W, maxX = 0
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 128) {
        pts.push(x, y)
        if (x < minX) minX = x
        if (x > maxX) maxX = x
      }
    }
  }
  const out = new Float32Array(count * 3)
  const n = pts.length / 2
  const width = Math.max(1, maxX - minX)
  const cx = (minX + maxX) / 2
  for (let i = 0; i < count; i++) {
    const j = n ? Math.floor(Math.random() * n) : 0
    const px = n ? pts[j * 2] + rand(-1, 1) : 0
    const py = n ? pts[j * 2 + 1] + rand(-1, 1) : 0
    out.set([(px - cx) / width, -(py - H / 2) / width, rand(-0.012, 0.012)], i * 3)
  }
  return out
}
