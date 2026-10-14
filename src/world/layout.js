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
export const DOGHOUSE = { ...campLocal(5.1, 3.9), ry: CAMP.ry - 0.35 }

// A river from the north-western mountains feeding a lake (frozen in winter).
export const WATER_Y = -0.5
export const RIVER = [[-104, 84], [-86, 78], [-68, 76], [-50, 73], [-36, 70], [-24, 69]]
export const RIVER_HALF_WIDTH = 2.6
export const LAKE = { x: -14, z: 68, r: 10 }
const RIVER_SEGS = RIVER.slice(1).map((b, i) => [RIVER[i], b])
function segDistance(x, z, segs) {
  let best = Infinity
  for (const [[ax, az], [bx, bz]] of segs) {
    const dx = bx - ax, dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t))
  }
  return best
}
export const riverDistance = (x, z) => segDistance(x, z, RIVER_SEGS)
// Lake shoreline radius at a given angle (slightly irregular, not a perfect circle).
export const lakeRadius = (a) => LAKE.r * (1 + 0.12 * Math.sin(3 * a + 0.4) + 0.06 * Math.sin(5 * a + 1.3))
export function lakeDistance(x, z) {
  const dx = x - LAKE.x, dz = z - LAKE.z
  return Math.hypot(dx, dz) - lakeRadius(Math.atan2(dz, dx))
}
// Distance to the nearest open water edge (negative = in the water).
export const waterDistance = (x, z) => Math.min(riverDistance(x, z) - RIVER_HALF_WIDTH, lakeDistance(x, z))

// Forested hills inside the valley (the car can drive up them).
export const HILLS = [
  { x: -74, z: 14, r: 19, h: 16, mix: { larch: 0.6, pine: 0.4 } },
  { x: 12, z: 56, r: 17, h: 15, mix: { birch: 0.55, larch: 0.45 }, smooth: true, plateau: 5.5 },
  { x: 70, z: -46, r: 16, h: 12, mix: { pine: 0.7, larch: 0.3 } },
]
const hillShape = (d, r) => (d >= r ? 0 : Math.pow(0.5 + 0.5 * Math.cos((Math.PI * d) / r), 1.15))
// Height of one hill at distance d: smooth hills have no bumps and a flat summit plateau.
const hillHeight = (hl, d, x, z) => (d >= hl.r ? 0 : hl.h * hillShape(Math.max(d, hl.plateau || 0), hl.r) * (hl.smooth ? 1 : 0.9 + 0.1 * Math.sin(x * 0.4 + z * 0.3)))
export function hillInfluence(x, z) {
  let m = 0
  for (const hl of HILLS) m = Math.max(m, hillShape(Math.hypot(x - hl.x, z - hl.z), hl.r))
  return m
}

// A switchback-free spiral track up the birch hill to a summit viewpoint.
export const SUMMIT_HILL = HILLS[1]
export const SUMMIT = { x: SUMMIT_HILL.x, z: SUMMIT_HILL.z }
// The hill's own height (without the valley noise), used to lay the road at a steady grade.
const hillOnly = (x, z) => hillHeight(SUMMIT_HILL, Math.hypot(x - SUMMIT_HILL.x, z - SUMMIT_HILL.z), x, z)
export const HILL_ROAD = (() => {
  const h = SUMMIT_HILL, GRADE = 0.12, STEP = 1.4
  let a = Math.atan2(14 - h.z, 0 - h.x), r = h.r - 1
  const pts = [[h.x + Math.cos(a) * r, h.z + Math.sin(a) * r]]
  for (let i = 0; i < 400 && r > (h.plateau || 0) + 0.3; i++) {
    // Walk around the hill; pick the radius that climbs by GRADE over this step.
    const y0 = hillOnly(pts[pts.length - 1][0], pts[pts.length - 1][1])
    a += STEP / Math.max(r, 2)
    let lo = Math.max(0.5, r - STEP), hi = r
    for (let k = 0; k < 20; k++) {
      const mid = (lo + hi) / 2
      const y = hillOnly(h.x + Math.cos(a) * mid, h.z + Math.sin(a) * mid)
      if (y - y0 > GRADE * STEP) lo = mid; else hi = mid
    }
    r = (lo + hi) / 2
    pts.push([h.x + Math.cos(a) * r, h.z + Math.sin(a) * r])
  }
  pts.push([h.x, h.z])
  // Keep every third point so the path network stays light.
  return pts.filter((_, i) => i % 3 === 0 || i === pts.length - 1)
})()

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
  [[0, 12], [4, 26], HILL_ROAD[0]],
  HILL_ROAD,
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
  // Flat banks around the water, then carve the river bed and the lake basin.
  const dr = riverDistance(x, z), dl = lakeDistance(x, z)
  m = Math.min(m, smoothstep(RIVER_HALF_WIDTH, RIVER_HALF_WIDTH + 12, dr), smoothstep(0, 12, dl))
  // The road hill is kept smooth so its track climbs at a steady grade.
  for (const hl of HILLS) if (hl.smooth) m = Math.min(m, smoothstep(hl.r * 0.9, hl.r + 8, Math.hypot(x - hl.x, z - hl.z)))
  h *= m
  h -= 1.5 * smoothstep(RIVER_HALF_WIDTH + 1.2, RIVER_HALF_WIDTH * 0.3, dr)
  h -= 2.2 * smoothstep(1.5, -LAKE.r * 0.5, dl)
  for (const hl of HILLS) h += hillHeight(hl, Math.hypot(x - hl.x, z - hl.z), x, z)
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
  { x: DOGHOUSE.x, z: DOGHOUSE.z, r: 0.95 },
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

// ── Trees: forests on the hills plus a small birch grove behind the camp ──
function makeTrees() {
  const r = rng(77), out = []
  HILLS.forEach((hl, hi) => {
    const count = Math.round(hl.r * hl.r * 0.17)
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * hl.r * 0.82
      const x = hl.x + Math.cos(a) * d, z = hl.z + Math.sin(a) * d
      if (Math.hypot(x, z) > WORLD_RADIUS + 6) continue
      if (pathDistance(x, z) < 3.2 || Math.hypot(x - SUMMIT.x, z - SUMMIT.z) < 5) continue
      const pick = r()
      let acc = 0, species = 'pine'
      for (const [sp, w] of Object.entries(hl.mix)) { acc += w; if (pick <= acc) { species = sp; break } }
      out.push({ x, z, species, s: 0.8 + r() * 0.6, ry: r() * 6.28, v: r(), hill: hi })
    }
  })
  for (let i = 0; i < 9; i++) {
    const p = campLocal(-7 + (i % 5) * 3.2 + r() * 1.2, -7.5 - Math.floor(i / 5) * 3 - r() * 1.5)
    out.push({ x: p.x, z: p.z, species: 'birch', s: 0.85 + r() * 0.4, ry: r() * 6.28, v: r(), hill: -1 })
  }
  return out.map((t) => ({ ...t, y: height(t.x, t.z) }))
}
export const TREES = makeTrees()
COLLIDERS.push(...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.45 * t.s })))

// Lake pier (pointing towards the start area) and its rowboat — kept solid for the van.
export const PIER_ANGLE = Math.atan2(SPAWN.z - LAKE.z, SPAWN.x - LAKE.x)
export const PIER = (() => {
  const a = PIER_ANGLE, shore = lakeRadius(a) + 1.2
  return { x: LAKE.x + Math.cos(a) * shore, z: LAKE.z + Math.sin(a) * shore, ry: Math.atan2(-Math.cos(a), -Math.sin(a)) }
})()
export function pierLocal(lx, lz) {
  const c = Math.cos(PIER.ry), s = Math.sin(PIER.ry)
  return { x: PIER.x + lx * c + lz * s, z: PIER.z - lx * s + lz * c }
}
COLLIDERS.push(...[1.2, 3.4, 5.6].map((lz) => ({ ...pierLocal(0, lz), r: 0.95 })), { ...pierLocal(1.75, 5.2), r: 1.1 })

// Summit furniture: a flag (in a cairn) and a bench, placed where they are furthest from the road.
function roadClearance(x, z) {
  let best = Infinity
  for (let i = 1; i < HILL_ROAD.length; i++) {
    const [ax, az] = HILL_ROAD[i - 1], [bx, bz] = HILL_ROAD[i]
    const dx = bx - ax, dz = bz - az
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)))
    best = Math.min(best, Math.hypot(x - ax - dx * t, z - az - dz * t))
  }
  return best
}
function freeSpot(radius, avoid) {
  let best = null
  for (let k = 0; k < 72; k++) {
    const a = (k / 72) * Math.PI * 2
    const x = SUMMIT.x + Math.cos(a) * radius, z = SUMMIT.z + Math.sin(a) * radius
    const score = Math.min(roadClearance(x, z), avoid ? Math.hypot(x - avoid.x, z - avoid.z) - 1 : Infinity)
    if (!best || score > best.score) best = { x, z, a, score }
  }
  return best
}
const flagSpot = freeSpot(4.2)
export const SUMMIT_FLAG = { x: flagSpot.x, z: flagSpot.z }
const benchSpot = freeSpot(3.8, SUMMIT_FLAG)
// The bench faces outwards, looking over the valley.
export const SUMMIT_BENCH = { x: benchSpot.x, z: benchSpot.z, ry: Math.PI / 2 - benchSpot.a }
COLLIDERS.push({ ...SUMMIT_FLAG, r: 0.85 }, { ...SUMMIT_BENCH, r: 0.8 })
