# introme

Personal portfolio of Shinenbayar Alkhimch — a drivable 3D world built with Three.js and React Three Fiber.

Hop in a UAZ-452 "Purgon" and drive across a low-poly Mongolian steppe:

- **Start** — the name in big 3D letters (knock them over), gers and a signpost
- **Developer** — Orkhon-style stone steles carrying the work history
- **Hobbies** — a football goal (drive the ball in), a basketball hoop and CS2-style crates
- **Photographer** — framed prints standing in the grass (click to open)
- **Contact** — an ovoo with khadag, and LinkedIn / GitHub signs

Driving into a zone opens its info panel. The top menu teleports straight to any zone.
Controls: WASD / arrow keys, Space to brake, R to reset; on-screen pedals on touch devices.

## Edit your content

Everything personal lives in [`src/content.js`](src/content.js). Real photos go in `public/photos/` and are listed in the `photos` array there.

The 3D letters use `public/fonts/josefin-bold.typeface.json`, generated from Josefin Sans by `node scripts/make-typeface.mjs`.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
```

## Deploy

Pushing to `main` builds and deploys via `.github/workflows/deploy.yml`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
