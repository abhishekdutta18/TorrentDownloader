---
description: >-
  Rules for pushing to GitHub, handling authentication, and managing GitHub Personal Access Tokens (PAT) when workflow scopes are required.
trigger: model_decision
---

# GitHub Authentication & Workflow Push Rules

When pushing code to GitHub, especially if the push contains modifications to `.github/workflows/` (GitHub Actions CI/CD files), the default Antigravity OAuth App token does NOT have the `workflow` scope. This will cause the push to be rejected by GitHub with a `refusing to allow an OAuth App to create or update workflow` error.

To avoid repeating this mistake and to consume keys securely from earlier projects built in AG, follow this framework:

## 1. Verify Authentication

Before running `git push` on a commit that modifies GitHub workflows, you MUST use a GitHub Personal Access Token (PAT) with `workflow` scope.

Use the Safe Credentials Protocol to verify if `GITHUB_PAT_WORKFLOW` exists in `~/.env`:

```bash
grep -sq "^GITHUB_PAT_WORKFLOW=" ~/.env
```

If it succeeds (exit code 0), the credential exists. 

## 2. Prompting for Credentials (If Missing)

If the `grep` command fails (the credential is not in `~/.env`), you MUST IMMEDIATELY stop and prompt the user to add it. Provide them with this command to run in their terminal:

```bash
printf "Enter your GitHub PAT with 'workflow' scope (typing hidden): " && read -s val && echo && echo "GITHUB_PAT_WORKFLOW=$val" >> ~/.env && echo "Saved."
```

Do NOT ask the user to paste the key directly into the chat.

## 3. Pushing with the PAT

Once the PAT is confirmed to exist in `~/.env`, run the `git push` command by dynamically extracting the PAT and injecting it into the remote URL. 

To push securely using the PAT without leaking it into the process tree or logs, use a command like this:

```bash
# Extract the remote URL domain and repo path
REPO_URL=$(git remote get-url origin | sed -e 's|https://||' -e 's|git@github.com:|github.com/|')
# Extract the PAT from .env and push
export GITHUB_PAT_WORKFLOW=$(grep "^GITHUB_PAT_WORKFLOW=" ~/.env | cut -d '=' -f2-)
git push "https://${GITHUB_PAT_WORKFLOW}@${REPO_URL}" HEAD
# Unset variable for safety
unset GITHUB_PAT_WORKFLOW
```

> **NOTE:** Always use `BypassSandbox: true` when interacting with git if the sandbox blocks `.git` access.
