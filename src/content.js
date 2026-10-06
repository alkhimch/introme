// ─────────────────────────────────────────────────────────────
// All personal content lives here. Edit this file to update the site.
// ─────────────────────────────────────────────────────────────

export const profile = {
  firstName: 'Shinenbayar',
  lastName: 'Alkhimch',
  roles: ['Software Developer', 'Photographer'],
  location: 'Ulaanbaatar, Mongolia',
  email: 'gansukhshinenbayr@gmail.com',
  links: {
    linkedin: 'https://www.linkedin.com/in/shinenbayar',
    github: 'https://github.com/alkhimch',
  },
}

export const developer = {
  about:
    'Software developer with over 5 years of experience. I build front-ends with Nuxt, Vue and React ' +
    'and back-ends with Spring Boot and Node.js, mostly for fintech products. ' +
    'These days I’m focused on test-driven development.',
  experience: [
    { role: 'Senior Software Developer', company: 'AiLab LLC', period: 'Mar 2023 — Present' },
    { role: 'Software Engineer', company: 'AiLab LLC', period: 'Jun 2021 — Mar 2023' },
    { role: 'Frontend Developer', company: 'Corex', period: 'Feb 2022 — Apr 2022' },
  ],
  skills: ['Nuxt.js', 'Vue.js', 'React', 'Spring Boot', 'Node.js', 'Test-Driven Development', 'Front-end', 'Team Leadership'],
  education: [
    { title: 'National University of Mongolia', detail: 'B.Sc. Computer Science', period: '2017 — 2021' },
  ],
  honors: ['National Mathematics Olympiad'],
}

export const hobbies = [
  { name: 'Basketball', text: 'Fast breaks and team play.' },
  { name: 'Football', text: 'The beautiful game — try scoring a goal with the van.' },
  { name: 'Counter-Strike 2', text: 'Teamwork, aim and split-second decisions.' },
]

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
