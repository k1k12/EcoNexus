# Working on EcoNexus

## Branches

| Branch | Purpose |
| --- | --- |
| `main` | The live site. Releases only. |
| `dev` | The default branch. All work lands here first. |
| `type/short-name` | One branch per piece of work, created from `dev`. |

Branch prefixes match commit types: `feat/`, `fix/`, `chore/`, `docs/`, `ci/`.
Names are lowercase with hyphens, for example `fix/migration-heads`.

## Commits

- Format: `type: short description`, lowercase, present tense, no full stop.
  Example: `fix: pin bcrypt so passwords hash again`.
- Types: `feat`, `fix`, `chore`, `docs`, `ci`.
- One small idea per commit.
- Run `git status --short -uall` before `git add`. `.env`, `node_modules`,
  `venv` and `dist` must never appear.

## Pull requests

1. Branch from `dev`, commit in small pieces, push, open a PR into `dev`.
2. Title the PR in commit style.
3. Fill in the template: What, How I checked it, and `Closes #N` if there is
   an issue.
4. The `check` job must be green before merging.
5. Merge with a merge commit, not squash or rebase.

## Releases

1. Open a PR from `dev` into `main` titled `release: vX.Y.Z`.
2. Merge it with a merge commit. Render and Cloudflare Pages deploy from `main`.
3. Tag it: `git tag -a vX.Y.Z -m "..."` on `main`, then push the tag, and
   publish a GitHub release from the tag with a short list of what changed.

## Secrets

- Never commit keys, passwords or real `.env` files. Copy `backend/.env.example`
  to `backend/.env` for local work.
- Live secrets live in the Render and Cloudflare dashboards only.
- If a secret is pushed by mistake, rotate it straight away. Deleting the
  commit is not enough because the history is public.

## Safety

- Unpushed mistake: `git commit --amend` or `git reset`.
- Mistake already on `main` or `dev`: `git revert`. Never rewrite their history.
- Your own unmerged branch: tidy it, then push with `--force-with-lease`.
- Never backdate commits.

## Before you push

```
cd backend && pytest -q tests/pytest
cd frontend && npx expo export --platform web
```
