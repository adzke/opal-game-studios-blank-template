# Gemini Operator Guide

## Stack Summary
- Monorepo with `apps/web`, `packages/game`, and `server`.
- Runtime URL: `http://localhost:3000`.
- Frontend: Next.js App Router, React, Tailwind, Web Awesome.
- Game: Three.js + Rapier.
- Backend: Bun, Express, Socket.io, Postgres, SuperTokens.

## Mandatory Workflow
1. Red: write or update failing tests first.
2. Green: implement the smallest change that passes.
3. Refactor: clean up while keeping tests green.

## Non-Negotiable Gates
1. `npm run lint`
2. `npx vitest run`
3. `npx vitest run --coverage`

Coverage must stay at `>= 90%` lines.

## Delivery Checklist
- Tests added or updated first.
- Lint clean.
- Full test suite clean.
- Coverage clean at `>= 90%`.
- Docker runtime path still works with `docker compose up --build`.
- Auth flows, `/game`, persistence, and reset behavior verified.
