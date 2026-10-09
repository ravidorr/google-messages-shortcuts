# Contributing

## Setup

```bash
nvm install && nvm use
{{PM_INSTALL}}
```

## Workflow

1. Branch from `main`.
2. Make changes. Hooks run lint on commit and the full suite on push; never bypass them.
3. Commit subjects start with a Jira key: `{{JIRA_PREFIX}}-123 - Message`.
4. If the PR changes `src/`, `package.json`, or `tsconfig.json`, update `CHANGELOG.md` and bump the version in `package.json` (one SemVer bump per PR).
5. Open a **draft** PR titled `<JIRA-KEY> - <ticket title>`.

## Standards

- Strict ESLint, Stylelint, html-validate, and markdownlint must pass.
- Test coverage must be 100% (lines, functions, branches, statements). It is enforced on push and in CI; never lower the thresholds.
- UI changes use `/design-system` tokens and components.
- See [AGENT.md](./AGENT.md) for the full rule list.

## Release policy

When a PR or push to `main` changes `package.json`, `tsconfig.json`, or files under `src/`, CI runs the release gate: the package version must increase (SemVer) and `CHANGELOG.md` must have a non-empty section for that version. PRs that only touch docs, tests, workflows, or tooling do not need a bump. Tagged releases (`vX.Y.Z`) must match `package.json` and have non-empty notes extracted from the changelog.
