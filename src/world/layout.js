// World layout + the analytic terrain height function shared by the ground mesh,
// the car physics and everything placed on the steppe.

export const ZONES = [
  { id: 'work', label: 'DEVELOPER', x: -38, z: -36, r: 13 },
  { id: 'math', label: 'MATHEMATICIAN', x: 38, z: -40, r: 13 },
  { id: 'photos', label: 'PHOTOGRAPHER', x: 0, z: -80, r: 15 },
  { id: 'contact', label: 'CONTACT', x: 44, z: 24, r: 12 },
]
export const zoneById = Object.fromEntries(ZONES.map((z) => [z.id, z]))

export const SPAWN = { x: 0, z: 14, heading: Math.PI }
export const NAME_POS = { x: 0, z: -2 }
export const GERS = [
  { x: -18, z: 16, r: 2.6, rot: 0.6 },
  { x: -25, z: 11, r: 2.2, rot: 0.2 },
]
export const WORLD_RADIUS = 92

// Dirt tracks between places, as polylines of [x, z].
export const PATHS = [
  [[0, 12], [-18, -10], [-38, -36]],
  [[0, 12], [18, -12], [38, -40]],
  [[-38, -36], [-22, -64], [0, -80]],
  [[38, -40], [22, -66], [0, -80]],
  [[0, 12], [22, 18], [44, 24]],
  [[0, 12], [-12, 15], [-18, 16]],
]

const FLAT = [
  ...ZONES.map((z) => ({ x: z.x, z: z.z, r: z.r + 4 })),
  { x: 0, z: 4, r: 16 },
  ...GERS.map((g) => ({ x: g.x, z: g.z, r: 6 })),
]

export const smoothstep = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const SEGMENTS = PATHS.flatMap((p) => p.slice(1).map((b, i) => [p[i], b]))

export function pathDistance(x, z) {
  let best = Infinity
  for (const [[ax, az], [bx, bz]] of SEGMENTS) {
    const dx = bx - ax, dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    const d = Math.hypot(x - ax - dx * t, z - az - dz * t)
    if (d < best) best = d
  }
  return best
}

export function height(x, z) {
  let h =
    1.4 * Math.sin(x * 0.045) * Math.cos(z * 0.05) +
    0.8 * Math.sin((x + z) * 0.07 + 0.5) +
    0.35 * Math.sin(x * 0.17 + 1.3) * Math.sin(z * 0.13)
  let m = 1
  for (const f of FLAT) m = Math.min(m, smoothstep(f.r, f.r + 14, Math.hypot(x - f.x, z - f.z)))
  m = Math.min(m, 0.4 + 0.6 * smoothstep(2, 9, pathDistance(x, z)))
  h *= m
  // Mountain ring around the valley.
  const r = Math.hypot(x, z), a = Math.atan2(z, x)
  const ridge = 18 + 8 * Math.sin(a * 5 + 1) + 4 * Math.sin(a * 11 + 2) + 2 * Math.sin(a * 23)
  h += smoothstep(88, 140, r) * ridge * (0.8 + 0.2 * Math.sin(r * 0.25 + a * 3))
  return h
}

// Surface normal from finite differences.
export function normal(x, z, out) {
  const e = 0.6
  const hx = height(x + e, z) - height(x - e, z)
  const hz = height(x, z + e) - height(x, z - e)
  const nx = -hx, ny = 2 * e, nz = -hz
  const l = Math.hypot(nx, ny, nz)
  out.set(nx / l, ny / l, nz / l)
  return out
}

// Deterministic pseudo-random, so the world looks the same on every visit.
export function rng(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Landmark placement (shared by rendering and collisions) ──
const wz = ZONES[0], mz = ZONES[1], pz = ZONES[2], cz = ZONES[3]

export const STELES = [-5, 0, 5].map((dx, i) => ({ x: wz.x + dx, z: wz.z - 3 + Math.abs(dx) * 0.35, ry: -dx * 0.07, index: i }))
export const PLINTH = { x: mz.x, z: mz.z }
export const FRAMES = Array.from({ length: 6 }, (_, i) => {
  const a = (-155 + i * 26) * (Math.PI / 180)
  const x = pz.x + Math.cos(a) * 10, z = pz.z + Math.sin(a) * 10
  return { x, z, ry: Math.atan2(pz.x - x, pz.z - z), index: i }
})
export const OVOO = { x: cz.x, z: cz.z - 1 }
export const CONTACT_SIGNS = [
  { x: cz.x - 5, z: cz.z + 3.5, ry: 0.35, key: 'linkedin', text: 'LinkedIn' },
  { x: cz.x + 5, z: cz.z + 3.5, ry: -0.35, key: 'github', text: 'GitHub' },
]
export const SIGNPOST = { x: 8, z: 9 }

export const COLLIDERS = [
  ...GERS.map((g) => ({ x: g.x, z: g.z, r: g.r + 0.3 })),
  ...STELES.map((s) => ({ x: s.x, z: s.z, r: 1.1 })),
  { x: PLINTH.x, z: PLINTH.z, r: 1.9 },
  ...FRAMES.map((f) => ({ x: f.x, z: f.z, r: 0.9 })),
  { x: OVOO.x, z: OVOO.z, r: 4.4 },
  ...CONTACT_SIGNS.map((s) => ({ x: s.x, z: s.z, r: 0.45 })),
  { x: SIGNPOST.x, z: SIGNPOST.z, r: 0.4 },
]
