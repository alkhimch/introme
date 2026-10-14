// Graphics presets, picked on the intro screen.
export const QUALITY = {
  low: {
    label: 'Low', note: 'Fastest · older phones',
    dpr: [0.7, 1], shadows: false, shadowMap: 512, antialias: false,
    grass: 0.35, flowers: 0.4, weather: 0.35, nightLights: false, treeShadows: false,
  },
  medium: {
    label: 'Medium', note: 'Balanced',
    dpr: [1, 1.25], shadows: true, shadowMap: 1024, antialias: true,
    grass: 0.7, flowers: 0.7, weather: 0.7, nightLights: true, treeShadows: false,
  },
  high: {
    label: 'High', note: 'Full detail',
    dpr: [1, 2], shadows: true, shadowMap: 2048, antialias: true,
    grass: 1, flowers: 1, weather: 1, nightLights: true, treeShadows: true,
  },
}
