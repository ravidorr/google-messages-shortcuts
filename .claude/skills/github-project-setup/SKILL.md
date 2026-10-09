---
name: github-project-setup
description: Scaffolds a new GitHub project or audits and updates an existing one to the standard baseline (editorconfig, llms.txt, Husky hooks, .github workflows, .npmrc, .nvmrc, strict linters, design system, agent and policy docs). Use when the user wants to create a new repo or project, bootstrap or scaffold a project, set up a GitHub project, or bring an existing project up to standard. Trigger phrases - "new GitHub project", "create a new project", "bootstrap a repo", "set up project standards", "update my project to the standard", "audit project setup". Supports web apps, static sites, Chrome extensions, Node libraries, and CLI or backend services. Do NOT use for ordinary feature work in a project that is already set up.
metadata:
  author: Raanan Avidor
  version: 1.0.0
---

# GitHub Project Setup

Create a new GitHub project, or audit and update an existing one, so it carries the standard baseline files, hooks, linters, CI, and design system.

## Important (read first)

- **NEVER push directly to `main`. Ever. No exceptions, including the first commit and "small fixes".** All changes go on a branch and reach `main` only through a pull request that the user merges. The repo is created with GitHub's own initial commit (`gh repo create ... --add-readme`, which is not a push), the scaffold is committed on `chore/project-baseline`, pushed as that branch, and opened as a draft PR. The generated `pre-push` hook also refuses any push to `main`. If a fix is needed after the PR is open, commit it on the same branch or a new branch, never on `main`.
- NEVER commit with `--no-verify`. Husky hooks must pass legitimately. If a hook cannot run (missing `node_modules` etc.), fix the environment.
- ALWAYS open PRs as **drafts**. PR title: `<JIRA-KEY> - <Jira ticket title>`. PR description: no section titles, a short intro, bullets of actual changes, and end with `[Jira](<ticket-url>)`; for the frontend repository also add `[Lookaside](<lookaside-url>)`.
- Code coverage is **100%** (lines, functions, branches, statements) and mandatory on `git push` (pre-push) and in CI. Never lower thresholds, add blanket excludes, or use ignore comments to pass; see `references/tooling.md`.
- **Independent review before showing any plan or Markdown file.** Whenever you create a plan or any Markdown file (README, AGENT.md, CHANGELOG, policy docs, the audit report, etc.), first run an independent review of it: spawn a fresh subagent (Agent tool, `general-purpose` or `pr-review-toolkit:code-reviewer`) that has not seen your reasoning, give it only the file path(s) and the requirements, and ask it to check accuracy, unfilled placeholders, broken links, contradictions with the other docs, and markdownlint compliance. Fix what it finds, then show the result to the user. Mention that the review ran and what it changed.
- The default branch is always `main`. New repos: `git init -b main` (or `git init --initial-branch=main`), and `gh repo create` pushes `main`. Never create `master`. Workflows, branch protection, `check-release.mjs` (`origin/main`), and Dependabot all assume `main`.
- **This skill is self-contained: run it directly.** Do not invoke or follow other workflow skills (brainstorming, writing-plans, executing-plans, git worktrees, "superpowers"-style spec/plan flows) for this job. Do not create spec or plan documents, do not create a worktree or a feature branch, and do not ask one question at a time. Work in the target directory on `main`. (In a Cursor run these flows produced `docs/superpowers/...` files, a `.worktrees/` branch, and a dozen approval pauses; `gh repo create --source .` even failed inside the worktree.)
- **Never invent values.** Contact emails, owners, names, and licenses come from the user or from the defaults in this skill. If a value is missing, ask in the Step 1 batch.
- **Pre-decided choices (do not ask, do not pause):**
  - Jest needs `ts-node` (for `jest.config.ts`), `ts-jest`, `@types/jest`, and `jest` installed in the same first dependency step.
  - TypeScript stays below 7 while `ts-jest` does (pin the newest 6.x exactly).
  - `npm audit` blocks only on production dependencies (`--omit=dev`); dev-tooling advisories are informational. Never drop or swap a mandated linter (markdownlint-cli2, Stylelint, html-validate, ESLint) because of a dev-dependency audit finding, and never treat Prettier as a Markdown linter.
  - The release gate is file-based and skips the first push of a branch and Dependabot PRs.
  - The Lighthouse job is removed for non-web projects.
- **Owner validation:** the owner must be exactly the `gh` login or an org the user belongs to. Check `gh api user -q .login` and `gh api user/orgs -q '.[].login'`; a near-miss such as `ravidor` for `ravidorr` is a typo to fix, not a new account to attempt.
- **Template fidelity.** Copy templates from `assets/` verbatim and only fill placeholders. Do not substitute weaker or different content: ESLint must keep `strictTypeChecked`, `.npmrc` must keep `registry` and `engine-strict` and must not add `fund=false` or `audit=false`, `CLAUDE.md` must use `@AGENT.md`, `llms.txt` keeps its description line and sections, `pre-push` and `ci.yml` must call `scripts/check-release.mjs`. Adding to a template is fine; removing or weakening is not (ask first). The test run you review later is judged against these.
- **Read `references/tooling.md` "Lessons from the first test repo" before generating CI, release, and release-gate files.** Key points: the release gate is file-based (only `package.json`, `tsconfig.json`, `src/**` demand a bump), `semver` and tests ship with the gate script, pin the latest GitHub Actions majors looked up at generation time, keep `typescript` below 7 for ts-jest, and run `typecheck` in CI, release, and pre-push.
- **Linters are mandatory for every project:** ESLint (JS/TS), Stylelint (CSS), html-validate (HTML), and markdownlint-cli2 (Markdown) are always installed, configured, wired into `lint` and lint-staged, even if a file type does not exist yet. Prettier may be added but never replaces them.
- **Visibility is explicit.** Always pass `--private` or `--public` to `gh repo create` per the user's answer (there is no default: always ask) and read the visibility back with `gh repo view --json visibility` before reporting. Repos created public by accident must be flagged immediately.
- **Branch protection is part of the job**, not optional cleanup, and GitHub shows "Your main branch isn't protected" until it is done. Never end the run with that banner. Right after the first CI run on `main` finishes (so the `quality` check exists), apply the protection from `references/github-setup.md` (required check `quality`, required PR review, no force pushes or deletions, linear history) and verify with `gh api repos/<owner>/<name>/branches/main/protection`. On a private repo under the free plan the API refuses (403) and rulesets do too: that outcome was announced to the user at the visibility question, so just report it. Otherwise, if the API refuses, fall back to a repository ruleset; if that is refused too, report the exact error and the manual fix (Settings > Branches > Add rule), and mark the run as incomplete.
- Planning artifacts (specs, plans, brainstorming docs from other skills) are not part of the baseline: do not commit them to the repo unless the user asks.
- **Do not stop until the whole job is finished.** Run every step through the quality checklist (files created, deps installed, lint, tests at 100% coverage, hooks passing, initial commit, and the remote steps once confirmed) without pausing for permission on minor matters. If you find a plan inconsistency (for example a config needing a dependency that a later task installs), fix it yourself by reordering or merging tasks, note it in the final summary, and keep going; do not ask. Pause only for: the explicit confirmation gates in this skill (creating the remote, pushing, branch protection, overwriting existing files in update mode), missing information only the user has, or a genuine blocker you cannot resolve after trying. End with a report of what was done, what failed, and anything skipped.
- Never write credentials into any file. `.npmrc` may only reference `${NPM_TOKEN}`.
- Never overwrite an existing file without showing the diff and getting a yes (update mode).
- Remote repo visibility is **always asked**, never defaulted (see Step 1, item 9). Creating a remote repo, pushing, and changing branch protection are outward-facing: confirm the final plan before executing.
- Templates live in `assets/` (copy and fill placeholders). Rationale and rules live in `references/`. Read the relevant reference before generating that file.

## Bundled files: locate them first (do this before Step 0)

This skill ships templates (`assets/`), rules (`references/`), and a verifier (`scripts/verify-baseline.sh`) next to this `SKILL.md`. Set `SKILL_DIR` to the first of these that contains `assets/` and `references/`:

1. The directory of this `SKILL.md` (the "Base directory" line or the path the skill was loaded from).
2. `~/.claude/skills/github-project-setup`, then `.claude/skills/github-project-setup` in the current project.
3. Other agents' skill folders: `~/.cursor/skills/github-project-setup`, `~/.codex/skills/github-project-setup`, `~/.agents/skills/github-project-setup`.
4. A clone of the skill repository, if the user has published one: `gh repo clone <owner>/<skills-repo> /tmp/github-project-setup-skill` (ask the user for the repo; never guess it).

All `assets/...`, `references/...`, and `scripts/...` paths below are relative to `SKILL_DIR`. If the sandbox cannot read outside the project, ask the user to copy the folder into the project (`cp -R ~/.claude/skills/github-project-setup .claude/skills/`) or to grant read access, then continue.

If none is found: do not improvise or recreate the templates from memory. Stop and tell the user exactly which paths were checked and the two ways to fix it (copy the folder into the project, or publish it to a private GitHub repo and give you the name). This is the only place a missing file may stop the run.

## Step 0: Pick the mode

Detect with `git rev-parse --show-toplevel` and `ls`. If the user did not say, ask:

- **New**: empty or non-existent directory, or user says "new project".
- **Update**: existing repo (has `package.json` or `.git`).

## Step 1: Gather inputs (ask everything not already known)

Ask in one batch with AskUserQuestion; do not guess:

1. Project name, one-sentence description, target directory.
2. **Project kind**: web app / static site, Chrome extension, Node library, CLI or backend service, or other (ask the stack and adapt).
3. **Package manager**: `npm` or `pnpm` (always ask; no default).
4. **Node version**: look up the current active LTS (use WebSearch, or `nvm ls-remote --lts | tail`) and propose it pinned exactly.
5. **License**: default is **MIT, copyright Raanan Avidor**. Do not ask unless the user wants something else (Apache-2.0 / proprietary UNLICENSED, or a different holder). Never use "Ravidor" as the holder.
6. **Public site?** (web only). Needed for `robots.txt`, `sitemap.xml`, and the canonical base URL.
7. **Design system approach**: Storybook + CSS tokens (default). Also offer to generate a Claude Design system artifact from it afterwards.
8. **Ticket system**: Jira (prefix for the commit-msg check, e.g. `APP`, and ticket URL base) or none, in which case the project uses GitHub issues. See `{{TICKET_RULES}}` in `references/file-map.md`.
9. **GitHub owner**: ALWAYS ask which GitHub owner (personal account or organization) the repo should be created under, and confirm that owner is one the user has permission to create repositories in. Never guess or reuse an owner from the git config or a previous project without asking. Verify access before creating anything: `gh auth status` (active account and scopes include `repo`), `gh api user/orgs -q '.[].login'` to list orgs, and for an org `gh api orgs/<org>/memberships/<login> -q .role` (member roles may be blocked from creating repos; if so, tell the user and ask for another owner). **Ask the visibility question every time, with no default and with this warning in the question text:** "Should the repository be private or public? If it is private, the main branch will NOT be protected and the CI checks will NOT be required to merge (GitHub only allows branch protection and rulesets on private repos with a paid plan). If it is public, the main branch is protected and the `quality` check is required." Also ask whether to push, and (public, or private on a paid plan) whether to configure branch protection. **Plan check:** branch protection and rulesets are unavailable on private repos for personal accounts on the free plan (HTTP 403 "Upgrade to GitHub Pro or make this repository public"). Check the plan early (`gh api user -q .plan.name`; empty or `free` means free; for an org `gh api orgs/<org> -q .plan.name`). If the user answers private on a free plan, restate that the branch will not be protected and the checks will not be required, skip the protection step, and list "branch protection not applied (private repo on a free plan)" in the final report as a known limitation, not a failure.
10. Security and support contact email.

## Step 2: Decide the file set

Always (every kind):

`.editorconfig`, `.gitignore`, `.npmrc`, `.nvmrc`, `package.json` (with `engines` and `packageManager`), `.husky/`, `.github/`, linter configs, `AGENT.md`, `CLAUDE.md`, `GEMINI.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE`, `PRIVACY.md`, `README.md`, `SECURITY.md`, `SUPPORT.md`, `TODO.md`, `llms.txt`, `design-system/`.

Conditional:

| File | Create when |
|---|---|
| `robots.txt`, `sitemap.xml` | Public web app or static site only. Skip for libraries, CLIs, backends, extensions. |
| `lighthouserc.json` | Web app or static site (and extension options/popup pages only if served over http). Skip otherwise. |
| `design-system/` | **Always.** Projects with UI get the full design system (`assets/design-system/`). Projects with no UI (libraries, CLIs, backends) get only `assets/design-system-no-ui/README.md` stating "no UI". Do not ask. |
| Lighthouse step in `ci.yml` | Same as `lighthouserc.json`. |

Kind-specific notes: see `references/project-kinds.md`.

## Step 3: New mode workflow

1. **Remote first, without pushing to `main`** (after the Step 1 answers and plan confirmation): `gh repo create <owner>/<name> --<private|public> --add-readme --description "<desc>"`, then `gh repo clone <owner>/<name> <target-dir>` (or `git init -b main && git remote add origin ... && git fetch && git checkout -B main origin/main` for an existing directory). The default branch is `main` and holds only GitHub's README commit.
1b. Create the branch: `git checkout -b chore/project-baseline`. Everything below happens on this branch.
2. Copy templates from `assets/` per the table in `references/file-map.md`, replacing `{{PLACEHOLDERS}}`.
3. Generate `package.json` (scripts listed in `references/tooling.md`), `LICENSE` from `references/licenses.md`.
4. Make hook files executable (`chmod +x .husky/*`).
5. Install: `<pm> install`, `<pm> add -D` the dev deps in `references/tooling.md` (exact versions via `.npmrc save-exact`), then `<pm> exec husky init` equivalent already covered by the copied hooks. Add a `prepare` script of `husky`.
6. Run `<pm> run lint`, `<pm> test`, and `<pm> run build` (if defined). Fix failures; do not weaken linter rules to pass.
7. Initial commit via the normal commit flow (hooks run). Message follows the project's commit-msg rule.
8. Publish the branch, never `main`: `git push -u origin chore/project-baseline`, set topics, open a **draft** PR (`gh pr create --draft`, title and body per the PR style; GitHub-issues projects use `Closes #<issue>`). After the PR's CI run finishes (so the `quality` check exists), apply branch protection (`references/github-setup.md`). Tell the user the PR is theirs to review and merge; do not merge it yourself without an explicit instruction.
9. Offer: Claude Design system artifact generated from `design-system/` tokens (via the Artifact tool's `quickstart` with intent `design`).

## Step 4: Update mode workflow

1. Audit: for every file in the set from Step 2, classify as `missing`, `drifted` (differs materially from the template/rules), or `ok`. Also check: default branch is `main` (local `git symbolic-ref --short HEAD` and remote `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`; if it is `master` or another name, propose the rename: `git branch -m master main`, `gh api -X POST repos/<owner>/<name>/branches/master/rename -f new_name=main`, then `git fetch && git branch -u origin/main main`, and update workflows and protection rules; confirm first since it affects collaborators), hooks executable, `.nvmrc` matches `engines.node` and CI, `packageManager` set, lockfile committed, forbidden `.npmrc` escape hatches (`legacy-peer-deps`, `force`, `strict-ssl=false`, `ignore-scripts`, unscoped `_authToken`), sitemap referenced from `robots.txt`.
2. Present one table of findings (file, status, proposed action). Ask which to apply.
3. For each approved `drifted` file: show the diff against the template, ask per file: overwrite, merge, or skip. For `missing` files: create after approval.
4. Never delete user content silently; merge keeps project-specific sections (e.g. README body, CHANGELOG history, existing ESLint rules).
5. Run lint/tests, then offer a draft PR following the PR style in Important.

## Step 5: Husky split

pre-commit < 10 s on staged files; pre-push branch-wide; CI authoritative. Details and templates: `references/husky.md`.

## Step 6: Completion loop (mandatory, do not stop before this passes)

First run `bash ~/.claude/skills/github-project-setup/scripts/verify-baseline.sh <project-dir> <web|nonweb>` and fix every `FAIL`. Then re-run the Quality checklist below item by item with real commands (`grep -R '{{' .`, `<pm> run lint`, `<pm> run test:coverage`, `git status`, `git log -1`, `gh repo view` if a remote was created). For every item that fails, fix it and re-check. Repeat until all items pass or a genuine blocker remains. Only then write the final report. Never end a turn with steps still pending, and never report "done" without having run these checks.

## Error handling

- **`gh` not authenticated**: ask the user to run `gh auth login`; continue with files-only and tell them the remote step was skipped.
- **Hook fails on first commit**: read the output, fix the root cause. Never bypass.
- **Node/pm version not installed**: run `nvm install` per `.nvmrc`; for pm use `corepack enable`.
- **Existing project uses another stack** (Python, Go): scaffold only language-neutral files (`.editorconfig`, docs, `.github`, `llms.txt`, Markdown linting) and ask before adding Node tooling.
- **Conflicting existing linter config**: keep it, report the gap, propose a stricter diff.

## Quality checklist

- [ ] All placeholders replaced (`grep -R '{{' .` returns nothing)
- [ ] `.nvmrc` = `engines.node` lower bound = CI node version
- [ ] `.npmrc` contains no credentials or escape hatches
- [ ] `<pm> run lint` and tests pass; hooks run on commit
- [ ] `robots.txt` references `sitemap.xml` (web only), `sitemap.xml` uses absolute HTTPS canonical URLs
- [ ] `CLAUDE.md` and `GEMINI.md` point to `AGENT.md`
- [ ] `llms.txt` links resolve to existing files
- [ ] Remote visibility matches the user's answer; no `--no-verify` anywhere

## Examples

User: "Create a new GitHub project for a Chrome extension called tab-tidy."
Actions: Step 1 questions, file set without robots/sitemap, MV3 `manifest.json` stub, design-system for popup UI, install, lint, commit, ask private or public, confirm and create the repo.
Result: Pushed repo (visibility as chosen) with passing CI scaffold and a summary of files created.

User: "Bring this repo up to standard."
Actions: audit table, per-file diffs and approvals, apply, run lint, offer draft PR.
Result: Only approved files changed, nothing overwritten silently.
