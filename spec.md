# Blank Game Template Specification

## Purpose
This specification defines a reusable blank game starter that keeps the same core architecture and operational model as the current Marble Race project, but removes Marble Race-specific systems and replaces them with a minimal authenticated game. The result should be a clean template that can be cloned to start new game projects without re-deciding infrastructure, authentication, or quality policy.

## Product Summary
- Use the same monorepo shape as the current project:
  - `apps/web` for the Next.js App Router frontend
  - `packages/game` for shared game logic, rendering helpers, auth helpers, and browser-side game code
  - `server` for the Bun + Express + Socket.io backend
- Use Docker as the default runtime path for all services.
- Put Nginx in front of the Next.js app and backend API.
- Use Postgres for persistence and SuperTokens for authentication.
- Ship a blank white-themed authenticated game instead of race/economy systems.
- Ship strict linting, mandatory TDD, and a 90% global line-coverage floor from day one.

## Non-Goals
- No economy, ledger, store, leaderboard, friends, matchmaking, private lobbies, jackpots, or progression systems in v1.
- No native simulator sidecars or Rust runtime path in v1.
- No theme toggle in v1. The template defaults to one white/light theme.
- No need to preserve Marble Race visual identity, assets, or gameplay loops.

## Required Repository Structure
The blank template must use this structure:

```text
.
├── AGENTS.md
├── gemini.md
├── plan.md
├── task.md
├── spec.md
├── docker-compose.yml
├── docker-compose.debug.yml
├── Dockerfile
├── Dockerfile.dev
├── package.json
├── .eslintrc.json
├── vitest.config.js
├── apps/
│   └── web/
├── packages/
│   └── game/
├── server/
└── tests/
```

## Architecture

### Monorepo
- Root `package.json` must define workspaces for `apps/*` and `packages/*`.
- `apps/web` contains the Next.js application and route structure.
- `packages/game` contains:
  - browser auth bootstrap for `supertokens-web-js`
  - blank game scene/bootstrap code
  - shared UI helpers and styles
- `server` contains:
  - Express app setup
  - SuperTokens server initialization
  - Postgres access
  - migration runner
  - protected game state endpoints
  - Socket.io scaffold

### Runtime Services
`docker-compose.yml` is the source of truth for local development and verification. It must define these services:

- `nginx`
  - image: `nginx:alpine`
  - exposes `${WEB_PORT:-3000}:80`
  - mounts `ops/nginx.conf` as read-only
  - depends on `web` and `server`
- `web`
  - built from `apps/web/Dockerfile`
  - runs the Next.js production server
- `server`
  - built from root `Dockerfile`
  - runs `bun server/index.js`
- `migrate`
  - built from root image
  - runs `bun server/migrate.js`
  - depends on Postgres health
- `supertokens`
  - image: `supertokens/supertokens-postgresql:latest`
  - points to the same Postgres container
- `db`
  - image: `postgres:15-alpine`
  - persistent named volume
  - healthcheck via `pg_isready`

### Optional Debug Runtime
- `docker-compose.debug.yml` may be included for hot reload and local bind mounts.
- The project’s primary verification path remains:

```bash
docker compose up --build
```

## Reverse Proxy
Nginx must sit in front of the app and proxy these paths:

- `/` -> `web:3000`
- `/api/` -> `server:3001`
- `/auth/` -> `server:3001`
- `/socket.io/` -> `server:3001`

Proxy config must preserve:
- `Host`
- upgrade headers for websockets
- HTTP/1.1

Default local URL:

```text
http://localhost:3000
```

## Authentication

### Provider and Recipes
The template must use SuperTokens with:
- `EmailPassword`
- `Session`

Server-side initialization must match the working pattern in this project:
- framework: `express`
- `connectionURI` from `SUPERTOKENS_CONNECTION_URI`
- `appInfo.apiDomain` from `API_DOMAIN`
- `appInfo.websiteDomain` from `WEBSITE_DOMAIN`
- `apiBasePath: '/auth'`
- `websiteBasePath: '/auth'`

### Client Bootstrap
`packages/game/src/auth.js` must initialize `supertokens-web-js` with:
- `Session.init({ tokenTransferMethod: 'header' })`
- `EmailPassword.init()`

The web app must initialize auth once from a root provider component rendered in `apps/web/app/layout.jsx`.

### Required Auth UX
The blank template must include fully working:
- signup
- signin
- signout
- forgot-password flow
- reset-password flow
- protected route redirect to `/login`
- session-backed `/api/me`

Required routes:
- `/login`
- `/auth/reset-password`
- `/game`

### Protected Routes
- `apps/web/app/(protected)/layout.jsx` must wrap protected pages in a client-side auth guard.
- The guard must use `Session.doesSessionExist()`.
- If no session exists, redirect to `/login?redirectTo=<current-path>`.

### Local User Sync
The blank template must preserve the same local user synchronization pattern as the current project.

On signup:
- collect `username`, `email`, and `password`
- create SuperTokens user
- insert a row into the local `users` table with:
  - `username`
  - `password` set to a managed placeholder such as `managed_by_supertokens`
  - `email`
  - `supertokens_id`

On signin:
- if a local row already exists for `supertokens_id`, use it
- if missing, search by email
- if email exists, link `supertokens_id`
- if email does not exist, create a new local user row using a fallback username derived from the email prefix

On session hydration:
- protected backend routes must call `verifySession()`
- then hydrate the local app user from the `users` table
- if the local user is missing, fetch the SuperTokens user and recreate or relink the local row

### Socket.io Parity
- Keep Socket.io initialized in the backend for architectural parity with the current repo.
- Keep a socket auth middleware that can read a token from:
  - `socket.handshake.auth.token`
  - `Authorization` header
  - `sAccessToken` cookie
- The blank starter game does not need active realtime features in v1.

## Database

### Core Tables
The blank template must have at minimum these tables.

#### `users`
```sql
users(
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  supertokens_id TEXT UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### `game_profiles`
```sql
game_profiles(
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  best_score INTEGER NOT NULL DEFAULT 0,
  last_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Migration Policy
- `server/db.js` may create baseline tables if missing.
- `server/migrate.js` must run SQL migrations from `server/migrations/`.
- `migrate` container must complete successfully before the `server` container starts serving traffic.

## API Contract

### Public Routes
The blank template must expose:
- `GET /health`
- `GET /api/me`
- `GET /api/game/state`
- `POST /api/game/reset`
- SuperTokens-managed `/auth/*`

### `GET /api/me`
- Protected route
- Returns the hydrated local user
- Minimum response shape:

```json
{
    "id": 1,
    "username": "player1",
    "sessionId": "session-handle"
}
```

### `GET /api/game/state`
- Protected route
- Returns the authenticated player’s persisted game state
- Minimum response shape:

```json
{
    "bestScore": 4,
    "lastScore": 2
}
```

### `POST /api/game/reset`
- Protected route
- Resets `last_score` to `0`
- Does not clear `best_score`
- Returns the updated persisted state

## Frontend Application

### Framework
- Next.js App Router
- React client components where browser APIs or rendering engines are needed
- `next/dynamic` with `ssr: false` for DOM-dependent game modules if needed

### Required Pages

#### `/`
- Public landing page
- Explains the template briefly
- Includes Web Awesome CTA buttons:
  - sign in
  - create account
  - go to game when already authenticated

#### `/login`
- Auth page for sign in, sign up, forgot password, and reset token state
- Must use Web Awesome form controls and Tailwind layout classes
- Must follow the working auth pattern from the current project

#### `/auth/reset-password`
- Reuses the login/auth shell and supports SuperTokens reset token handling

#### `/game`
- Protected route
- Renders the minimal starter game and a small stats panel

### Theme and Design System
- Tailwind CSS is allowed for layout, spacing, sizing, typography placement, and utility styling only.
- All interactive controls must use Web Awesome components.
- The starter theme is white/light:
  - white panels
  - off-white page background
  - dark neutral text
  - soft gray borders
  - one accent color for actions and focus states
- No galaxy theme, no purple bias, no dark default.

### Root Layout
`apps/web/app/layout.jsx` must:
- initialize the auth provider
- set global metadata
- include the Web Awesome stylesheet import through global CSS
- define a light theme class on `<html>` and `<body>`
- expose `NEXT_PUBLIC_API_ORIGIN` when needed

## Blank Starter Game

### Technology
- Three.js for rendering
- Rapier for physics
- logic placed in `packages/game`

### Gameplay Loop
The blank starter game is intentionally small but must be real gameplay, not a static placeholder.

Required behavior:
- Render a flat plane
- Render one controllable white sphere
- Render one collectible target at a time
- Move the sphere with keyboard input on desktop
- Provide a simple touch-friendly movement UI or tap control on mobile
- Detect collisions with the collectible
- Increment score when collected
- Spawn a new collectible at another valid position
- Show current score live
- Allow restart from the UI
- Persist `best_score` and `last_score` per authenticated user through backend APIs

### Game UI
The `/game` page must contain:
- the game canvas
- current score
- best score
- restart button
- sign out button
- a small authenticated user label

All buttons and form-like controls must be Web Awesome components.

## Environment Variables
The template must support these variables:

```text
WEB_PORT
DATABASE_URL
SUPERTOKENS_CONNECTION_URI
API_DOMAIN
WEBSITE_DOMAIN
JWT_SECRET
NEXT_PUBLIC_API_ORIGIN
```

Expected defaults for local Docker:
- `WEB_PORT=3000`
- `DATABASE_URL=postgres://template_user:template_pass@db:5432/template_game`
- `SUPERTOKENS_CONNECTION_URI=http://supertokens:3567`
- `API_DOMAIN=http://localhost:3000`
- `WEBSITE_DOMAIN=http://localhost:3000`

## Policy Files

### `AGENTS.md`
The blank template must ship a root `AGENTS.md` that defines:
- Docker-first workflow
- mandatory TDD
- required quality gates
- strict coverage governance
- monorepo layout expectations
- Web Awesome + Tailwind UI rules
- Next.js frontend scope
- Bun/Express backend scope
- QA/reliability expectations

It must explicitly require:
- `npm run lint`
- `npx vitest run`
- `npx vitest run --coverage`
- global line coverage `>= 90%`

### `gemini.md`
The blank template must ship a root `gemini.md` that mirrors the quality contract in simpler operator-facing language:
- stack summary
- runtime URL
- mandatory Red -> Green -> Refactor workflow
- lint gate
- test gate
- coverage gate at `>= 90%`
- delivery checklist for every addition

### `plan.md`
- Tracks major workstreams for the blank template and future feature additions.
- Must be updated before major features.

### `task.md`
- Tracks concrete implementation tasks and status.
- Must remain aligned with `plan.md`.

## ESLint Contract
The template must ship a strict root `.eslintrc.json`.

`npm run lint` must run:

```bash
eslint . --max-warnings=0
```

The config must enforce at minimum:
- 4-space indentation
- Unix line endings
- single quotes
- semicolons
- `no-unused-vars: error`
- `complexity: ["error", 10]`
- `max-lines: ["error", 500]`
- `eqeqeq: ["error", "always"]`
- `curly: ["error", "all"]`
- `prefer-const: "error"`
- `no-var: "error"`

Allowed relaxations:
- narrow overrides for tests only
- test overrides may disable `complexity` and `max-lines`
- test overrides must not weaken core runtime files

## Testing and QA

### Mandatory Gates
No change is complete until all of these pass:

```bash
npm run lint
npx vitest run
npx vitest run --coverage
```

Global line coverage must remain:

```text
>= 90%
```

### Required Test Coverage

#### Auth
- signup creates a local user row
- signin succeeds with valid credentials
- signin relinks a local row by email when `supertokens_id` is missing
- session hydration recreates a missing local row from SuperTokens
- `/api/me` rejects unauthenticated requests
- `/api/me` returns authenticated user data
- forgot-password flow can request a reset
- reset-password flow accepts a valid token
- protected route guard redirects unauthenticated users to login
- signout returns the user to guest state

#### Game
- authenticated `/game` page renders
- score increments when the collectible is picked up
- restart resets the live score
- `POST /api/game/reset` clears only `last_score`
- `best_score` persists across reloads
- `last_score` persists until reset or replacement

#### Runtime and Infrastructure
- Postgres container becomes healthy
- migration container runs before the server
- `GET /health` returns success
- Nginx forwards `/`
- Nginx forwards `/api/`
- Nginx forwards `/auth/`
- Docker smoke verification works with `docker compose up --build`

## Implementation Guidance

### Backend
- Base the server auth and hydration flow on the working `server/supertokens.js`, `server/app.js`, and `server/middleware.js` patterns in this repo.
- Keep CORS aligned with `API_DOMAIN`, `WEBSITE_DOMAIN`, localhost, and Docker local development.
- Use `verifySession()` plus a `hydrateUser` middleware array for protected routes.

### Frontend
- Base the client auth setup on the working `SupertokensProvider` and auth guard pattern in this repo.
- Keep the login page implementation pattern compatible with `EmailPassword.signIn`, `EmailPassword.signUp`, `EmailPassword.sendPasswordResetEmail`, `EmailPassword.submitNewPassword`, and `Session.getAccessToken()`.

### Shared Package
- Place reusable browser auth helpers in `packages/game/src/auth.js`.
- Keep the blank game bootstrap in `packages/game/src/`.
- Export game bootstrap and auth modules from the package entrypoint.

## Acceptance Criteria
- A new project created from this spec can boot fully through Docker.
- Visiting `http://localhost:3000` reaches the app through Nginx.
- Users can sign up, sign in, sign out, request password reset, and complete password reset.
- Authenticated users can open `/game`.
- The starter game is playable, persists `best_score` and `last_score`, and can be reset.
- The repo includes `AGENTS.md`, `gemini.md`, `plan.md`, `task.md`, and strict ESLint policy.
- Lint, tests, and coverage gates are part of the default development contract.

## Defaults and Assumptions
- Keep the same high-level project architecture as this repo even though the starter feature set is much smaller.
- Keep Socket.io scaffolded for future parity, even if v1 uses only REST endpoints.
- Use a white/light design system as the only starter theme.
- Prefer ASCII-only source and config files unless a dependency requires otherwise.
