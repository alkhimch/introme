# introme

Personal portfolio of Shinenbayar Alkhimch — a drivable 3D world built with Three.js and React Three Fiber.

Hop in a UAZ-452 "Purgon" and drive across a low-poly Mongolian steppe:

- **Start** — the name in big 3D letters (knock them over), gers and a signpost
- **Developer** — Orkhon-style stone steles carrying the work history
- **Hobbies** — a football goal (drive the ball in), a basketball hoop and CS2-style crates
- **Photographer** — framed prints standing in the grass (click to open)
- **Contact** — an ovoo with khadag, and LinkedIn / GitHub signs

Four seasons (spring, summer, autumn, winter) change the ground, grass, forests, sky, light and weather — falling snow, autumn leaves, spring petals. Three forested hills of pine, larch and birch rise inside the valley — a dirt track spirals up the birch hill to a summit with a Mongolian flag and a bench — and a river runs into a lake with a pier and a rowboat (both freeze in winter). Day, evening and night modes bring sunsets, stars and a moon, lit windows, glowing gers, van headlights, fireflies and crickets. Cranes migrate south in autumn; eagles circle the hills in spring and summer.

Extras: pick Low / Medium / High graphics on the intro screen; find seven hidden golden shagai; race from the start gate to the summit (best time is saved); photo mode (P) to hide the UI and save a PNG; a guestbook board (GitHub Discussions via giscus — set `guestbook.categoryId` in `src/content.js` once Discussions are enabled); camels, goats, yaks and a child on horseback; a Naadam field with wrestlers, an eagle dancer and archery; rain with puddles and a rainbow (B), or a blizzard in winter.

Driving into a zone opens its info panel. The top menu teleports straight to any zone.
Controls: WASD / arrow keys, Space to brake, R to reset, M to mute, 1–4 to change season, N for day/evening/night; drag to look around; on-screen pedals on touch devices.

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
