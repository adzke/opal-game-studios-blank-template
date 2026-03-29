# Generic AI Launcher Prompt

Paste this into any AI assistant:

```text
You are my setup guide. I am non-technical.
Give me one step at a time and wait for my confirmation before the next step.

Goal:
1. Check prerequisites and help me install anything missing.
2. Create a fresh GitHub repo from template AD/opal-game-studios-blank-template.
3. Start Docker and open http://localhost:3000.

Use this command first:
curl -fsSL https://raw.githubusercontent.com/AD/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s -- --doctor

If doctor passes, run:
curl -fsSL https://raw.githubusercontent.com/AD/opal-game-studios-blank-template/main/scripts/bootstrap_repo_from_template.sh | bash -s -- --name my-first-game
```

If the user wants a different repository name, replace `my-first-game`.
