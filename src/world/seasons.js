// Every season-dependent colour and light lives here, so the look of each season
// can be tuned in one place.
import * as THREE from 'three'

const C = (hex) => new THREE.Color(hex)

export const SEASON_LOOK = {
  spring: {
    label: 'Spring', icon: '🌸',
    sky: { top: '#5aa2e2', horizon: '#e8f1dc', fog: '#e2ecd8', near: 70, far: 230 },
    sun: { color: '#fff5e2', intensity: 2.4 }, hemi: { sky: '#d6e8ff', ground: '#7f9055', intensity: 1.1 },
    ground: { a: C('#93cc5c'), b: C('#6cab45'), dry: C('#b7c86f'), dirt: C('#a9865a'), snowLine: 19 },
    grass: ['#86c24f', '#9fd35f', '#6fae42', '#b4d06b'], grassScale: 0.85,
    flowers: ['#f7d6e6', '#f6d44d', '#ffffff', '#e48bb0', '#b9a0e8', '#f6d44d'], flowerShare: 1,
    rocks: ['#8e8a80', '#7b776e', '#a19c90'], cloud: '#ffffff',
  },
  summer: {
    label: 'Summer', icon: '☀️',
    sky: { top: '#4f8fd0', horizon: '#f3dcb4', fog: '#e9d6b5', near: 70, far: 230 },
    sun: { color: '#fff1d8', intensity: 2.4 }, hemi: { sky: '#cfe2ff', ground: '#8a7a4f', intensity: 1.1 },
    ground: { a: C('#a3b65a'), b: C('#87a34b'), dry: C('#c7b874'), dirt: C('#b08d5e'), snowLine: 24 },
    grass: ['#8fae4a', '#a7bc5c', '#7c9a42', '#c2b86a'], grassScale: 1,
    flowers: ['#f4f1ea', '#f6d44d', '#b58ad8', '#e7798f', '#f4f1ea'], flowerShare: 0.75,
    rocks: ['#8e8a80', '#7b776e', '#a19c90'], cloud: '#ffffff',
  },
  autumn: {
    label: 'Autumn', icon: '🍂',
    sky: { top: '#5b8ac6', horizon: '#f6ca92', fog: '#eccfa6', near: 65, far: 220 },
    sun: { color: '#ffe3bc', intensity: 2.2 }, hemi: { sky: '#e6d8c4', ground: '#8a6a3a', intensity: 1.1 },
    ground: { a: C('#bba763'), b: C('#9f8d50'), dry: C('#cdb677'), dirt: C('#a07c55'), snowLine: 21, litter: C('#b0733a') },
    grass: ['#c9a94e', '#b8913f', '#d9be6a', '#a07c38'], grassScale: 0.9,
    flowers: ['#c97a3a', '#d9a441', '#8f5a2e'], flowerShare: 0.25,
    rocks: ['#8e8a80', '#7b776e', '#a19c90'], cloud: '#fff7ee',
  },
  winter: {
    label: 'Winter', icon: '❄️',
    sky: { top: '#8fb2d8', horizon: '#eaf0f5', fog: '#e2e9f0', near: 45, far: 175 },
    sun: { color: '#eef3ff', intensity: 1.75 }, hemi: { sky: '#e8f0fa', ground: '#b9c3cf', intensity: 1.35 },
    ground: { a: C('#f2f5f8'), b: C('#e1e8ef'), dry: C('#e9edf1'), dirt: C('#cfc7b9'), snowLine: -100, patch: C('#a9a68c') },
    grass: ['#dfe2d2', '#cfccb2', '#eceee8', '#c6c1a6'], grassScale: 0.45,
    flowers: [], flowerShare: 0,
    rocks: ['#c9ccd0', '#b5b8bc', '#dde0e3'], cloud: '#e9edf2',
  },
}

// Tree foliage per species per season. `bare` = leafless (smaller, twiggy crown).
export const TREE_LOOK = {
  pine: {
    spring: { leaf: ['#3f7040', '#4a7d45'] }, summer: { leaf: ['#2f5a33', '#36633a'] },
    autumn: { leaf: ['#2f5631', '#3a5f35'] }, winter: { leaf: ['#2f5a33', '#36633a'], snow: 0.55 },
  },
  larch: {
    spring: { leaf: ['#a6d46c', '#93c95e'] }, summer: { leaf: ['#5f8f45', '#6b9a4c'] },
    autumn: { leaf: ['#e3a42c', '#f0b938', '#d58b25'] }, winter: { leaf: ['#8f8478', '#7d746a'], snow: 0.45, bare: true },
  },
  birch: {
    spring: { leaf: ['#b9de7c', '#a6d36b'] }, summer: { leaf: ['#6fa24a', '#7cab52'] },
    autumn: { leaf: ['#f2c230', '#f5d24a', '#e58a2c'] }, winter: { leaf: ['#a39a8f', '#958c82'], snow: 0.3, bare: true },
  },
}
export const SNOW = C('#f4f7fa')

// ── Time of day: blended on top of the season's daylight look ──
export const TIME_LOOK = {
  day: { label: 'Day', icon: '☀️' },
  evening: {
    label: 'Evening', icon: '🌇', mix: 0.65,
    sky: { top: '#3e5a9c', horizon: '#f39a5a', fog: '#d99a78' },
    sun: { color: '#ffae72', scale: 0.7 }, hemi: { sky: '#e0b8a8', ground: '#5a4a52', scale: 0.75 },
    cloud: '#f4b79a', sunDir: [-0.95, 0.32, 0.25], stars: 0.15, ambient: 0.12, lights: 0.6,
  },
  night: {
    label: 'Night', icon: '🌙', mix: 0.88,
    sky: { top: '#060c22', horizon: '#1c2950', fog: '#141d38' },
    sun: { color: '#9fb6ff', scale: 0.22 }, hemi: { sky: '#3c4c80', ground: '#141826', scale: 0.42 },
    cloud: '#3a4468', sunDir: [0.45, 0.85, -0.35], stars: 1, ambient: 0.08, lights: 1,
  },
}

// Final environment for a season + time of day.
export function environment(season, time) {
  const s = SEASON_LOOK[season], t = TIME_LOOK[time]
  const base = {
    top: C(s.sky.top), horizon: C(s.sky.horizon), fog: C(s.sky.fog), near: s.sky.near, far: s.sky.far,
    sunColor: C(s.sun.color), sunIntensity: s.sun.intensity,
    hemiSky: C(s.hemi.sky), hemiGround: C(s.hemi.ground), hemiIntensity: s.hemi.intensity,
    cloud: C(s.cloud), sunDir: [-0.55, 1, 0.45], stars: 0, ambient: 0.15, lights: 0,
  }
  if (!t.mix) return base
  const k = t.mix
  base.top.lerp(C(t.sky.top), k)
  base.horizon.lerp(C(t.sky.horizon), k)
  base.fog.lerp(C(t.sky.fog), k)
  base.sunColor.lerp(C(t.sun.color), k)
  base.sunIntensity *= t.sun.scale
  base.hemiSky.lerp(C(t.hemi.sky), k)
  base.hemiGround.lerp(C(t.hemi.ground), k)
  base.hemiIntensity *= t.hemi.scale
  base.cloud.lerp(C(t.cloud), k)
  base.sunDir = t.sunDir
  base.stars = t.stars
  base.ambient = t.ambient
  base.lights = t.lights
  if (time === 'night') { base.near *= 0.8; base.far *= 0.85 }
  return base
}
