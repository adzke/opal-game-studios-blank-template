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
Handle the setup end-to-end without waiting for my confirmation between steps.
Pause only if you need a required decision from me, I must approve a command, I need to sign in, or something fails.

Before creating the repository, ask me what I want the game / repository to be called.
Suggest 3 short kebab-case names.
If your interface supports structured user input, use it.
If I do not choose a name, use `my-first-game`.

Goal:
1. Check prerequisites and help me install anything missing.
2. Create a fresh GitHub repo from template adzke/opal-game-studios-blank-template.
3. Start Docker and open http://localhost:3000.

Use this command first:
curl -fsSL https://raw.githubusercontent.com/adzke/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s -- --doctor

If doctor passes, immediately run:
curl -fsSL https://raw.githubusercontent.com/adzke/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s -- --name <chosen-repo-name>
```

Suggested repo names:
- moonlit-quest
- crystal-wizard
- dragon-forge

This flow uses the generic script at `scripts/bootstrap_repo_from_template.sh`.
