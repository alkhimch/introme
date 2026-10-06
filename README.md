# introme

Personal portfolio of Shinenbayar Alkhimch — a scroll-driven Three.js site built with React Three Fiber.

- **Hero** — particles spell "I am Shinenbayar / Developer / Mathematician / Photographer"
- **Developer** — experience and skills over a rotating lattice
- **Mathematician** — a live, flowing Lorenz attractor
- **Photographer** — prints that develop on a darkroom line under a red safelight
- **Contact** — links to LinkedIn and GitHub

## Edit your content

Everything personal lives in [`src/content.js`](src/content.js). Real photos go in `public/photos/` and are listed in the `photos` array there.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## Deploy

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
