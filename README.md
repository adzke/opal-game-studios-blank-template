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

## Generic AI Launcher (Any Assistant)

If a user opens any AI assistant (Codex, ChatGPT, Claude, Gemini) and wants guided setup without clone/fork steps, have them paste this prompt:

```text
You are my setup guide. I am non-technical.
Give me one step at a time and wait for my confirmation before the next step.

Goal:
1. Check prerequisites and help me install anything missing.
2. Create a fresh GitHub repo from template adzke/opal-game-studios-blank-template.
3. Start Docker and open http://localhost:3000.

Use this command first:
curl -fsSL https://raw.githubusercontent.com/adzke/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s -- --doctor

If doctor passes, run:
curl -fsSL https://raw.githubusercontent.com/adzke/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s -- --name my-first-game
```

This flow uses the generic script at `scripts/bootstrap_repo_from_template.sh`.
