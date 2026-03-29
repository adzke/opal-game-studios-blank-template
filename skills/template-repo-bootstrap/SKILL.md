---
name: template-repo-bootstrap
description: Bootstrap a brand new GitHub repository from a template with fresh history, verify local prerequisites (git, docker, gh), ensure GitHub CLI authentication, start the project with Docker Compose, and open http://localhost:3000. Use when a user asks for a non-technical setup flow instead of manual clone or fork steps.
---

# Template Repo Bootstrap

Run this skill when a user wants a fresh game project from `adzke/opal-game-studios-blank-template` with minimal terminal steps.

## Required Inputs

- Repository name (example: `my-first-game`)

## Optional Inputs

- Visibility: `private` (default), `public`, or `internal`
- Parent folder where the new project should be created
- GitHub owner/org override
- Template repo override

## Workflow

1. Prefer URL-first execution for non-technical users:
`curl -fsSL https://raw.githubusercontent.com/adzke/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s --`
2. If the script reports missing tools, talk the user through the exact install hints it prints and ask them to rerun the same URL command.
3. If the script triggers `gh auth login -w`, tell the user to complete browser sign-in and rerun the same URL command.
4. If the user prefers explicit checks first, run URL + doctor mode:
`curl -fsSL https://raw.githubusercontent.com/adzke/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s -- --doctor`
5. For explicit naming, run:
`curl -fsSL https://raw.githubusercontent.com/adzke/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s -- --name <repo-name>`
6. Confirm the script started Docker with `docker compose up --build -d`.
7. Confirm the browser opened `http://localhost:3000` (or tell the user to open it manually if auto-open is unavailable).

## Non-Technical Guidance Style

- Use short, plain-language instructions.
- Give one action at a time, then wait for the user to confirm.
- Prefer copy/paste-ready commands.
- If a step fails, repeat only the current step instead of introducing new commands.
- Do not mention fork/clone theory unless the user asks. Focus on progress.

## Key Rules

- Use template creation for fresh history:
`gh repo create <name> --template adzke/opal-game-studios-blank-template --clone`
- Do not use plain `git clone` when the user wants a fresh independent history.
- Keep instructions plain-language and beginner-friendly.
