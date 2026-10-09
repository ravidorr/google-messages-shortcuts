# Husky policy

- Every project defines `.husky/pre-commit`. Use `npm` or `pnpm`.
- Do not forget `"prepare": "husky"` so hooks install on `<pm> install`.

| Hook | Scope | Budget |
|---|---|---|
| `pre-commit` | staged files: format/lint-staged, targeted tests, quick generated-file consistency | usually under 10 s |
| `commit-msg` | minimum subject length; Jira-key prefix | instant |
| `pre-push` | branch-wide: full lint, tests with 100% coverage gate (`test:coverage`), changelog presence, one SemVer bump per PR | may be slow |
| `post-commit` | package-lock synchronization (reports drift, never rewrites history) | fast |
| CI | mandatory release, version, security, full-test enforcement | authoritative |

Husky hooks are client-side and can be bypassed, so version/changelog policy is also a required CI gate (`scripts/check-release.mjs`, run in `ci.yml`).

The CI version/changelog gate skips Dependabot PRs (`github.actor != 'dependabot[bot]'`); otherwise every automated dependency PR fails with "package version must change". Batch those updates into a normal release PR with its own bump and changelog entry.

Why version/changelog is pre-push, not pre-commit: developers can make several valid WIP commits before deciding the final version.

Hooks never skipped: do not use `--no-verify`. If a hook cannot run in a fresh worktree, install dependencies first.
