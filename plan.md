# Plan

## Active Workstreams
- Bootstrap root monorepo structure, tooling, and Docker-first runtime.
- Implement shared auth and starter game runtime in `packages/game`.
- Implement Next.js landing, auth, and protected game flows in `apps/web`.
- Implement Bun/Express API, migrations, SuperTokens sync, and socket scaffold in `server`.
- Add tests for auth, game state, routing, infrastructure, and policy contracts.

## Default Delivery Standard
- Follow Red -> Green -> Refactor.
- Keep the starter theme fixed to light mode.
- Keep runtime verification centered on Docker plus required lint/test/coverage gates.
