# File map: template to destination

Placeholders: `{{PROJECT_NAME}}`, `{{PROJECT_DESCRIPTION}}`, `{{PM}}` (npm|pnpm), `{{PM_RUN}}` (`npm run`|`pnpm run`), `{{PM_EXEC}}` (`npx`|`pnpm exec`), `{{PM_INSTALL}}`, `{{PM_CI}}` (`npm ci`|`pnpm install --frozen-lockfile`), `{{PM_INSTALL_LOCKFILE_ONLY}}` (`npm install --package-lock-only`|`pnpm install --lockfile-only`), `{{LOCKFILE}}` (`package-lock.json`|`pnpm-lock.yaml`), `{{NODE_VERSION}}`, `{{JIRA_PREFIX}}`, `{{JIRA_URL}}`, `{{OWNER}}`, `{{REPO}}`, `{{SITE_URL}}`, `{{CONTACT_EMAIL}}`, `{{SUPPORT_CONTACT}}` (default "open a GitHub issue."), `{{SECURITY_CONTACT_SUFFIX}}` (default empty, or " or email <address>" only if the user gave one), `{{PRIVACY_DATA_USE}}` (no data collected: "No data is collected, so none is used or sold."), `{{TODAY}}`, `{{TICKET_RULES}}` (see below), `{{PRIVACY_DATA_SUMMARY}}`, `{{PRIVACY_THIRD_PARTIES}}`.

`{{TICKET_RULES}}` in `AGENT.md` (and the matching text in `CONTRIBUTING.md`, `commit-msg`, and `PULL_REQUEST_TEMPLATE.md`):
- Jira: two bullets, "Commit subjects start with the Jira key: `{{JIRA_PREFIX}}-123 - Message`." and "Open PRs as drafts. Title: `<JIRA-KEY> - <ticket title>`. Description: short intro, bullets, end with `[Jira](<url>)`."
- No Jira: one bullet, exactly "This repository uses GitHub issues for ticketing." Drop the Jira-key check from `commit-msg` and the `[Jira]` line from the PR template (use "Closes #<issue>" instead). Never write "no ticket-system conventions".
- No Jira also means: use `assets/husky/commit-msg.no-jira` instead of `commit-msg`, `assets/github/PULL_REQUEST_TEMPLATE.no-jira.md` instead of `PULL_REQUEST_TEMPLATE.md`, and edit the two Jira lines in `CONTRIBUTING.md` (commit subjects at least 15 characters; draft PR references the issue with `Closes #<issue>`).
- Private (unpublished) packages: delete the `npm publish --provenance` step and `id-token: write` from `release.yml`; keep them only when `package.json` has `private: false`.
- No-UI projects: in `AGENT.md` replace the UI-tokens rule with "There is no UI. `/design-system` is a placeholder (see `design-system/README.md`).", the layout line with "`design-system/` - placeholder (no UI)", and in `CONTRIBUTING.md` replace the UI rule likewise.
- Privacy must not contradict itself: when no data is collected, say so in every section and state there are no third parties and no network calls.
- `{{CONTACT_EMAIL}}`: never use the user's work email unasked. If no contact was given, rewrite the sentence in `SECURITY.md`, `SUPPORT.md`, and `PRIVACY.md` to point to GitHub private vulnerability reporting and the issue tracker instead of inserting a placeholder phrase.

Note: `ci.yml` and `release.yml` use GitHub `${{ ... }}` expressions. Replace only the `{{UPPER_SNAKE}}` and `{{PM*}}` placeholders; leave `${{ github.* }}` untouched.

| Template (under `assets/`) | Destination |
|---|---|
| `.editorconfig` | `.editorconfig` |
| `.npmrc` | `.npmrc` |
| `.nvmrc` | `.nvmrc` |
| `llms.txt` | `llms.txt` |
| `robots.txt`, `sitemap.xml` | same names (public web only; serve from the site root, e.g. `public/`) |
| `lighthouserc.app.json` / `lighthouserc.static.json` | `lighthouserc.json` (pick one; web only) |
| `husky/*` | `.husky/*` (`chmod +x`) |
| `scripts/check-release.mjs` | `scripts/check-release.mjs` |
| `test/check-release.test.mjs`, `test/check-release-cli.test.mjs` | same paths (tests for the release script; `semver` devDependency required) |
| `scripts/coverage-summary.mjs` | `scripts/coverage-summary.mjs` (PR coverage comment) |
| `vitest.config.ts` | `vitest.config.ts` (100% coverage thresholds) |
| `github/workflows/ci.yml`, `release.yml` | `.github/workflows/*` (never include a Lighthouse job for non-web projects) |
| `github/workflows/ci.lighthouse-job.yml` | web apps and static sites only: append its `lighthouse` job to `ci.yml` |
| `github/dependabot.yml` | `.github/dependabot.yml` |
| `github/PULL_REQUEST_TEMPLATE.md` | `.github/PULL_REQUEST_TEMPLATE.md` |
| `github/ISSUE_TEMPLATE/*` | `.github/ISSUE_TEMPLATE/*` |
| `lint/eslint.config.mjs` | `eslint.config.mjs` |
| `lint/.stylelintrc.json` | `.stylelintrc.json` |
| `lint/.htmlvalidate.json` | `.htmlvalidate.json` |
| `lint/.markdownlint-cli2.jsonc` | `.markdownlint-cli2.jsonc` |
| `lint/.lintstagedrc.json` | `.lintstagedrc.json` |
| `scripts/lint-html.mjs` | `scripts/lint-html.mjs` (`lint:html` script; passes when the project has no HTML) |
| `ts-library/*` (Node/TS library, Jest) | repo root: `tsconfig.json` (src, test, jest config; used by ESLint, typecheck, ts-jest), `tsconfig.build.json` (src only, emits `dist`), `jest.config.ts`, a starter `src/index.ts` with 100% coverage and `test/index.test.ts` |
| `docs/*.md` | repo root (same names) |
| `design-system/*` | `design-system/*` (projects with UI) |
| `design-system-no-ui/README.md` | `design-system/README.md` (projects with no UI; never skip the directory) |

`LICENSE`: generate from `references/licenses.md`.
`.gitignore`: `node_modules/`, `dist/`, `coverage/`, `.lighthouseci/`, `storybook-static/`, `.env*` (except `.env.example`), `.DS_Store`.
`tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`, `noImplicitOverride: true`, `moduleResolution: "bundler"` (or `nodenext` for Node libs/CLIs).
