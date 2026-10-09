# google-messages-shortcuts - Agent Guide

Canonical instructions for AI coding agents. `CLAUDE.md` and `GEMINI.md` point here; edit this file only.

## Project

Chrome extension for Google Messages Web that provides keyboard shortcuts, navigation, and accessible conversation-action controls.

## Commands

- Install: `npm install`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Test: `npm run test`
- Coverage: `npm run test:coverage` (100% lines, functions, branches, statements; mandatory on push and in CI)
- Build: `npm run build`

## Rules

- Never commit with `--no-verify`. Fix the cause when a hook fails.
- This repository uses GitHub issues for ticketing.
- Linters are strict (ESLint, Stylelint, html-validate, markdownlint). Do not weaken rules to pass.
- UI work uses the tokens and components in `/design-system`. No hard-coded colors or spacing.
- Pin Node 24.21.0 via `.nvmrc` and npm 11.19.0 via `package.json`. Keep `package-lock.json` committed.
- Pull requests that change `src/`, `package.json`, or `tsconfig.json` update `CHANGELOG.md` and bump the version once per pull request. Docs-only, test-only, and tooling-only pull requests do not.
- Track open work in `TODO.md`.

## Layout

- `design-system/` - tokens, components, showcase
- `.husky/` - git hooks (pre-commit fast, pre-push broad)
- `.github/` - CI, release, Dependabot, templates
