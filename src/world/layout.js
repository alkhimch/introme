// World layout + the analytic terrain height function shared by the ground mesh,
// the car physics and everything placed on the steppe.

export const ZONES = [
  { id: 'work', label: 'DEVELOPER', x: -38, z: -36, r: 13 },
  { id: 'hobbies', label: 'HOBBIES', x: 38, z: -40, r: 15 },
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

// Summer-camp cabin near the gers, facing the start area.
export const CAMP = { x: -36, z: 34, ry: 2.06 }
// Convert a point in the cabin's local frame (front = +z) to world space.
export function campLocal(lx, lz) {
  const c = Math.cos(CAMP.ry), s = Math.sin(CAMP.ry)
  return { x: CAMP.x + lx * c + lz * s, z: CAMP.z - lx * s + lz * c }
}
export const SWING = { ...campLocal(-5, 6.5), ry: CAMP.ry }
export const WOMAN = { ...campLocal(1.8, 5.2), ry: CAMP.ry }
export const CHILD = { ...campLocal(2.55, 5.35), ry: CAMP.ry }
export const DOG_HOME = campLocal(0.5, 10)

// Pastures for the herds.
export const HORSE_HOME = { x: 62, z: -8 }
export const COW_HOME = { x: -58, z: 52 }

// Dirt tracks between places, as polylines of [x, z].
export const PATHS = [
  [[0, 12], [-18, -10], [-38, -36]],
  [[0, 12], [18, -12], [38, -40]],
  [[-38, -36], [-22, -64], [0, -80]],
  [[38, -40], [22, -66], [0, -80]],
  [[0, 12], [22, 18], [44, 24]],
  [[0, 12], [-12, 15], [-18, 16]],
  [[-18, 16], [-24, 25], [campLocal(0, 6).x, campLocal(0, 6).z]],
]

const FLAT = [
  ...ZONES.map((z) => ({ x: z.x, z: z.z, r: z.r + 4 })),
  { x: 0, z: 4, r: 16 },
  ...GERS.map((g) => ({ x: g.x, z: g.z, r: 6 })),
  { x: CAMP.x, z: CAMP.z, r: 11 },
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
const wz = ZONES[0], hz = ZONES[1], pz = ZONES[2], cz = ZONES[3]

export const STELES = [-5, 0, 5].map((dx, i) => ({ x: wz.x + dx, z: wz.z - 3 + Math.abs(dx) * 0.35, ry: -dx * 0.07, index: i }))
// Hobbies: football goal at the north edge, basketball hoop west, CS2 crates east.
export const GOAL = { x: hz.x, z: hz.z - 10, width: 5.4, depth: 1.8, height: 2.3 }
export const HOOP = { x: hz.x - 9.5, z: hz.z - 3 }
export const CRATES = [
  { x: hz.x + 8.5, z: hz.z - 4.5, y: 0, s: 1.7, ry: 0.1 },
  { x: hz.x + 10.3, z: hz.z - 4.2, y: 0, s: 1.7, ry: -0.05 },
  { x: hz.x + 9.4, z: hz.z - 4.4, y: 1.7, s: 1.7, ry: 0.2 },
  { x: hz.x + 9.2, z: hz.z - 1.9, y: 0, s: 1.3, ry: 0.4 },
]
export const BALL_SPAWNS = {
  football: { x: hz.x, z: hz.z + 1 },
  basketball: { x: hz.x - 7, z: hz.z + 2 },
}
export const FRAMES = Array.from({ length: 6 }, (_, i) => {
  const a = (-155 + i * 26) * (Math.PI / 180)
  const x = pz.x + Math.cos(a) * 10, z = pz.z + Math.sin(a) * 10
  return { x, z, ry: Math.atan2(pz.x - x, pz.z - z), index: i }
})
export const OVOO = { x: cz.x, z: cz.z - 1 }
export const CONTACT_SIGNS = [
  { x: cz.x - 5, z: cz.z + 3.5, ry: 0.35, link: 'linkedin', text: 'LinkedIn' },
  { x: cz.x + 5, z: cz.z + 3.5, ry: -0.35, link: 'github', text: 'GitHub' },
]
export const SIGNPOST = { x: 8, z: 9 }

export const COLLIDERS = [
  ...GERS.map((g) => ({ x: g.x, z: g.z, r: g.r + 0.3 })),
  ...[-2.2, 0, 2.2].map((lx) => ({ ...campLocal(lx, 0), r: 2.4 })),
  ...[-1.7, 1.7].map((lx) => ({ ...campLocal(-5 + lx, 6.5), r: 0.3 })),
  { x: WOMAN.x, z: WOMAN.z, r: 0.5 },
  { x: CHILD.x, z: CHILD.z, r: 0.35 },
  ...STELES.map((s) => ({ x: s.x, z: s.z, r: 1.1 })),
  { x: GOAL.x - GOAL.width / 2, z: GOAL.z, r: 0.3 },
  { x: GOAL.x + GOAL.width / 2, z: GOAL.z, r: 0.3 },
  ...[-2, -1, 0, 1, 2].map((k) => ({ x: GOAL.x + k * 1.2, z: GOAL.z - GOAL.depth, r: 0.5 })),
  { x: HOOP.x, z: HOOP.z, r: 0.45 },
  ...CRATES.filter((c) => c.y === 0).map((c) => ({ x: c.x, z: c.z, r: c.s * 0.68 })),
  ...FRAMES.map((f) => ({ x: f.x, z: f.z, r: 0.9 })),
  { x: OVOO.x, z: OVOO.z, r: 4.4 },
  ...CONTACT_SIGNS.map((s) => ({ x: s.x, z: s.z, r: 0.45 })),
  { x: SIGNPOST.x, z: SIGNPOST.z, r: 0.4 },
]

// Follow-camera offset from the van (fixed orientation, Bruno-style).
export const CAMERA_OFFSET = { desktop: [7, 13, 15.5], mobile: [9, 19, 21] }
