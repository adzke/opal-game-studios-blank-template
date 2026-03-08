Original prompt: PLEASE IMPLEMENT THIS PLAN: # Blank Game Starter Base

## Progress Log
- 2026-03-08: Started greenfield implementation from spec.md and prior plan. Using ../marble_race only as a reference for auth/runtime patterns.
- 2026-03-08: Created repo directory skeleton for apps/web, packages/game, server, ops, and tests.
- 2026-03-08: In progress on root workspace/config/docs bootstrap.
- 2026-03-08: Added root workspace/tooling/docs, Docker/compose files, and Nginx proxy config.
- 2026-03-08: Added frontend app scaffold, shared game package, backend auth/persistence skeleton, and initial migration.
- 2026-03-08: In progress on automated tests and post-implementation validation.
- 2026-03-08: Installed dependencies and passed `npm run lint`, `npx vitest run`, and `npx vitest run --coverage` with 91.54% global line coverage.
- 2026-03-08: Completed Docker compose build and in-container runtime verification for `/`, `/api/me` (401 through Nginx), `/socket.io/` polling, and backend `/health`.
- 2026-03-08: Host-side `curl http://localhost:3000` remained unreachable from this sandbox, so runtime verification used in-container probes instead of host-network probes.
- 2026-03-08: Fixed auth navigation bug where visible Web Awesome buttons were not a reliable path into register/forgot flows. Signup API itself was healthy; page controls now use direct links for auth-mode navigation and the visible submit button bridges to `requestSubmit()`.
- 2026-03-09: Fixed debug Docker startup issue where bind-mounting the repo hid image-installed dependencies, leaving `web` without `next` on PATH. `docker-compose.debug.yml` now repopulates the anonymous `node_modules` volume on startup and launches the web app with `bunx next`.
- 2026-03-09: Fixed Bun-based Docker build freeze in `migrate`/`server` images by keeping Bun install layers manifest-only. Bun 1.3.10 still treated the copied lockfile as frozen during Docker installs, so the Dockerfiles now avoid copying lockfiles into Bun build layers and the debug self-heal path uses plain `bun install`.
- 2026-03-09: Reproduced signed-in `/game` failure in a real browser. Root cause was `GamePageClient` calling `initGame` while the loading screen was still rendered, so `containerRef.current` was null and the page showed `A game container is required.` Split game boot into fetch-first and mount-after-render phases, and tightened the game page test to require a real container element.
- 2026-03-09: Verified the `/game` fix in-browser with Playwright after sign-in. `window.render_game_to_text()` returned live state and a right-arrow input moved the player from `x: 0` to `x: 5.55`. `npm run lint` and full `npx vitest run` passed after the fix.
- 2026-03-09: Simplified the auth page to a single centered card and removed the left marketing panel. Added an auth-page test to keep the promo panel off the login route. `npm run lint` and `npx vitest run tests/web/authpage.test.jsx` passed.
