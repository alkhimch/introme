// ─────────────────────────────────────────────────────────────
// All personal content lives here. Edit this file to update the site.
// Items marked TODO are placeholders — fill them in from LinkedIn.
// ─────────────────────────────────────────────────────────────

export const profile = {
  firstName: 'Shinenbayar',
  lastName: 'Alkhimch',
  // Words the hero particles morph through, after "I am".
  heroWords: ['Shinenbayar', 'Developer', 'Mathematician', 'Photographer'],
  tagline: 'Brother of two. Builder of things. Finder of patterns.',
  location: 'Ulaanbaatar, Mongolia', // TODO: confirm
  links: {
    linkedin: 'https://www.linkedin.com/in/shinenbayar',
    github: 'https://github.com/alkhimch',
  },
}

export const developer = {
  // TODO: replace with your LinkedIn "About" section.
  about:
    'I build software end to end — from data models and APIs to interfaces people enjoy using. ' +
    'I like problems where engineering meets mathematics.',
  // TODO: replace with your LinkedIn "Experience" entries (newest first).
  experience: [
    { role: 'Software Developer', company: 'TODO: Company', period: 'TODO: 20XX — Present', summary: 'TODO: one line about what you built or owned.' },
    { role: 'TODO: Previous role', company: 'TODO: Company', period: 'TODO: 20XX — 20XX', summary: 'TODO: one line about impact.' },
  ],
  // TODO: replace with your LinkedIn "Skills".
  skills: ['JavaScript', 'TypeScript', 'Vue / Nuxt', 'React', 'Three.js', 'Node.js', 'Python', 'SQL'],
}

export const math = {
  heading: 'Mathematics',
  text:
    'Mathematics taught me to look for the simple rule underneath complicated behaviour. ' +
    'The shape you see is the Lorenz attractor: three short equations that never repeat themselves.',
}

// Put your photos in /public/photos and list them here, e.g.
//   { src: 'photos/steppe.jpg', title: 'Steppe, 2023' }
// Entries without `src` render as generated placeholder prints.
export const photos = [
  { title: 'Steppe at dawn', palette: ['#f3b27a', '#6d5a8c', '#1d2340'] },
  { title: 'Blue hour', palette: ['#7fb4d9', '#2c4a7a', '#0b1426'] },
  { title: 'Gobi', palette: ['#f6d29b', '#c4734a', '#3a1f1a'] },
  { title: 'Khövsgöl', palette: ['#bfe3e6', '#3f7f8c', '#10282e'] },
  { title: 'City lights', palette: ['#ffcf6e', '#a4405e', '#140c1c'] },
  { title: 'Winter', palette: ['#eef2f6', '#8fa3b8', '#2a3644'] },
]
