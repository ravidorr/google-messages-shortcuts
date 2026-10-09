# {{PROJECT_NAME}} - Agent Guide

Canonical instructions for AI coding agents. `CLAUDE.md` and `GEMINI.md` point here; edit this file only.

## Project

{{PROJECT_DESCRIPTION}}

## Commands

- Install: `{{PM_INSTALL}}`
- Lint: `{{PM_RUN}} lint`
- Test: `{{PM_RUN}} test`
- Coverage: `{{PM_RUN}} test:coverage` (100% lines, functions, branches, statements; mandatory on push and in CI)
- Build: `{{PM_RUN}} build`

## Rules

- Never commit with `--no-verify`. Fix the cause when a hook fails.
{{TICKET_RULES}}
- Linters are strict (ESLint, Stylelint, html-validate, markdownlint). Do not weaken rules to pass.
- UI work uses the tokens and components in `/design-system`. No hard-coded colors or spacing.
- Pin Node via `.nvmrc`; package manager is `{{PM}}`. Keep the lockfile committed.
- PRs that change `src/`, `package.json`, or `tsconfig.json` update `CHANGELOG.md` and bump the version (one SemVer bump per PR). Docs-only, test-only, and tooling-only PRs do not.
- Track open work in `TODO.md`.

## Layout

- `design-system/` - tokens, components, showcase
- `.husky/` - git hooks (pre-commit fast, pre-push broad)
- `.github/` - CI, release, dependabot, templates
