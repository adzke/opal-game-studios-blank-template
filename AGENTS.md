# AGENTS

## Core Workflow
- Docker-first workflow. Use `docker compose up --build` as the primary local runtime verification path.
- Mandatory TDD for every change: Red -> Green -> Refactor.
- Update `plan.md` and `task.md` before major feature work.

## Quality Gates
- `npm run lint`
- `npx vitest run`
- `npx vitest run --coverage`
- Global line coverage must remain `>= 90%`.
- Do not broaden coverage exclusions to hide untested runtime code without explicit approval.

## Monorepo Layout
- `apps/web`: Next.js App Router frontend.
- `packages/game`: shared browser auth bootstrap, starter game runtime, shared styles/helpers.
- `server`: Bun + Express + Socket.io backend, SuperTokens server setup, Postgres access, migrations.

## Frontend Rules
- Use Web Awesome for all interactive controls.
- Use Tailwind for layout and utility styling only.
- Keep the starter theme light: off-white page background, white panels, neutral text, soft gray borders, blue accent.
- Use client components only where browser APIs or canvas rendering are required.

## Backend Rules
- Use `verifySession()` plus `hydrateUser` for protected routes.
- Preserve local user sync between SuperTokens and the `users` table.
- Keep Socket.io scaffolded even when realtime gameplay is not yet used.

## QA Expectations
- Add or update tests before implementation changes.
- Run targeted tests after each meaningful unit of work.
- Treat lint failures as blockers.
- Verify auth flows, protected routes, game persistence, and Docker smoke before considering a change complete.
