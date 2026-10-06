// Mutable, frame-friendly state shared between the DOM and the WebGL scene.
// `section` is a continuous value: 0 = hero, 1 = developer, 2 = math, 3 = photos, 4 = contact.
export const scrollState = { section: 0, photosOffset: 10 }

export const SECTIONS = ['hero', 'work', 'math', 'photos', 'contact']

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function updateSectionFromScroll() {
  const vh = window.innerHeight
  let s = 0
  for (let i = 1; i < SECTIONS.length; i++) {
    const el = document.getElementById(SECTIONS[i])
    if (!el) continue
    const top = el.getBoundingClientRect().top
    // Morph starts when a section's top passes 65% of the viewport and ends at 15%.
    s += Math.min(1, Math.max(0, (0.65 * vh - top) / (0.5 * vh)))
  }
  scrollState.section = s
  const photos = document.getElementById('photos')
  if (photos) {
    const r = photos.getBoundingClientRect()
    scrollState.photosOffset = (r.top + r.height / 2 - vh / 2) / vh
  }
}
