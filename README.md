# opal-game-studios-blank-template

Docker-first blank game starter with:
- Next.js App Router frontend in `apps/web`
- shared browser/game runtime in `packages/game`
- Bun + Express + Socket.io backend in `server`
- Postgres + SuperTokens auth behind Nginx

Primary local runtime:

```bash
docker compose up --build
```
