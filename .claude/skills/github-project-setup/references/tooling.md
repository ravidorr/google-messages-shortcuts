# Tooling: package.json, scripts, dev dependencies

## package.json essentials

```json
{
  "name": "<kebab-name>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=<NODE_VERSION> <<NEXT_MAJOR>" },
  "packageManager": "npm@<exact>",
  "scripts": {
    "prepare": "husky",
    "lint": "npm run lint:js && npm run lint:css && npm run lint:html && npm run lint:md",
    "lint:js": "eslint --max-warnings=0 .",
    "lint:css": "stylelint --max-warnings=0 \"**/*.css\"",
    "lint:html": "node scripts/lint-html.mjs",
    "lint:md": "markdownlint-cli2",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "check:generated": "node -e \"process.exit(0)\"",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  },
  "lint-staged": null
}
```

Use real values: get the pm version with `npm -v` / `pnpm -v`; `<NEXT_MAJOR>` is the next Node major (e.g. engines `>=22.14.0 <23`). Replace `npm run` with `pnpm run` for pnpm. Drop the `lint-staged: null` line (config lives in `.lintstagedrc.json`). Set `private: false` for published libraries. Replace the `check:generated` stub with real generated-file sync checks (or keep the no-op if none exist).

For libraries: add `exports`, `types`, `files`, and a build script (`tsup` or `tsc`). Library tests may use `vitest`. For web apps pick the framework the user names (Vite default for plain web).

## Dev dependencies (installed exact via .npmrc)

`eslint`, `@eslint/js`, `typescript`, `typescript-eslint`, `stylelint`, `stylelint-config-standard`, `html-validate`, `markdownlint-cli2`, `husky`, `lint-staged`, `vitest`, `@vitest/coverage-v8`, `storybook` plus a framework package (`@storybook/html-vite` for plain web, or the matching framework one).

Install with `<pm> add -D <packages>`. Do not use `--force` or `--legacy-peer-deps`.

## Lessons from the second test run

- **Git must be 2.32 or newer** (lint-staged 17 refuses to run otherwise, which blocks the pre-commit hook). Check `git --version` before the first commit. If an older git shadows a newer one on PATH (seen: `/usr/local/bin/git` 2.31.0 before Apple's `/usr/bin/git` 2.54.0), run git commands with the newer one first on PATH (`PATH="/usr/bin:$PATH"`) and tell the user; never bypass the hook.

- Cursor first run lessons: it hit an `ERESOLVE`-free but broken Jest config load with TypeScript 7, `ts-node` missing from the first install, and five high audit findings from `markdownlint-cli2` (dev-only); all are handled by the pre-decided choices in `SKILL.md`.

- Generated folders (`coverage/`, `dist/`) contain CSS and HTML that Stylelint would lint after the first coverage run; `.stylelintrc.json` therefore sets `ignoreFiles` for them (pre-push runs `lint` before tests, so this only shows up on the second push).
- `lint:html` must be `node scripts/lint-html.mjs`: `html-validate` exits with an error when no HTML files match (libraries have none). `lint:css` needs `stylelint --allow-empty-input`.
- Add `globals` as a devDependency; ESLint config uses `globals.node` for plain `.js/.mjs` files, turns off `explicit-function-return-type` for them (TypeScript keeps it), and allows `console` in `scripts/**`.
- Typed linting needs every linted TS file in a tsconfig: `tsconfig.json` includes `src`, `test`, and `jest.config.ts`; `tsconfig.build.json` includes only `src`. `build` uses `tsc -p tsconfig.build.json`, `typecheck` uses `tsc --noEmit`.
- Markdown templates under `.github/` (issue and PR templates) are excluded in `.markdownlint-cli2.jsonc`; doc tables use spaced pipes (`| --- |`) to satisfy MD060.
- `npm audit --audit-level=high` fails on day one because dev tooling (markdownlint-cli2, stylelint) pulls transitive high advisories whose suggested fix is a nonsensical downgrade. CI blocks on `audit --omit=dev` and reports the full audit as informational (`continue-on-error`).
- `packageManager` must match the npm bundled with the pinned Node (`nvm use <node>; npm -v`), not the system npm.
- A newly installed `npm install-scripts` warning for `@parcel/watcher` and `unrs-resolver` is expected; do not set `ignore-scripts`.
- Look up latest action majors at generation time: checkout v7, setup-node v7, upload-artifact v7 as of 2026-10-09.

## Lessons from the first test repo (PRs 1-7)

- **Release gate is file-based, not "every PR".** `scripts/check-release.mjs` (tested, in `assets/scripts/`) only demands a version bump and changelog section when `package.json`, `tsconfig.json`, or `src/**` changed. The first naive gate failed every Dependabot, docs, and workflow PR and took two fixes (PRs 5 and 7). It compares semver with the `semver` package (hand-rolled compares broke on prereleases; Codex review caught it), validates tags (`--tag`), and extracts release notes in Node (`--extract-release-notes`) instead of awk. Install `semver` as a devDependency and copy `assets/test/check-release*.test.mjs` (they import from `@jest/globals`; for Vitest change the import to `vitest`).
- **Known tradeoff:** a Dependabot PR that changes `package.json` (even only devDependencies) trips the gate and needs a manual version bump plus changelog entry (PR 4). This is intentional and decided: keep the gate strict, do not make `requiresRelease` ignore devDependency-only diffs, and do not offer that change again.
- **GitHub Actions versions go stale immediately.** The first Dependabot PRs bumped `actions/checkout` 4 to 7 and `actions/setup-node` 4 to 6 (latest is now 7). Look up the latest majors at generation time (`gh api repos/actions/checkout/releases/latest -q .tag_name`, same for setup-node, upload-artifact) and pin those. Templates use the latest majors known at the last update (checkout v7, setup-node v7, upload-artifact v7); still re-check at generation time.
- **TypeScript 7 vs ts-jest.** `ts-jest` (and tooling using the JS compiler API) requires `typescript <7`; Dependabot's TS 7 bump fails `npm ci` with ERESOLVE (PR 3, closed). Working fix (PR 6): `"typescript": "npm:@typescript/typescript6@6.0.3"` for ts-jest and ESLint, plus `"@typescript/native": "npm:typescript@7.0.2"` for `tsc`. The Dependabot template ignores TypeScript majors until the toolchain supports them.
- **Typecheck in CI, hooks and release.** Script: `"typecheck": "tsc --noEmit && tsc -p tsconfig.test.json --noEmit"` with a `tsconfig.test.json` that includes `src`, `test`, and the Jest config. `ci.yml`, `release.yml`, and `pre-push` all run it.
- **Document the release policy** in `CONTRIBUTING.md` (template updated).
- **Independent AI review pays off:** Codex reviews on PRs 5 to 7 found real defects (semver compare, lockfile). Keep the independent-review rule.

**First install with ts-jest:** never install `typescript@latest` (it may be 7+ and fails `npm ci` with ERESOLVE). Install the newest 6.x exactly (`<pm> add -D typescript@6.0.3`, check the latest 6.x with `npm view typescript@6 version`), or, if the user wants TypeScript 7 for `tsc`, use the alias pair from the lessons above in the first install. Re-check ts-jest's peer range (`npm view ts-jest peerDependencies`) at generation time; if it now supports 7, use 7 and drop the alias and the Dependabot ignore.

## Coverage (100% is mandatory)

Copy `assets/vitest.config.ts`. Thresholds are 100% for lines, functions, branches, and statements, over all of `src/` (`all: true`). Add the script `"test:coverage": "vitest run --coverage"`. It is mandatory on `git push` (pre-push) and in CI (`ci.yml`, `release.yml`). pre-commit may still run only targeted tests (`vitest related --run`).

Jest instead of Vitest (only if the project already uses it or the user asks): install everything the first run needs in the same initial dependency step, never in a later task: `jest`, `ts-jest`, `@types/jest`, and `ts-node` (required to load `jest.config.ts`). Set `coverageReporters: ['text', 'lcov', 'json-summary']` (the PR coverage comment needs `json-summary`) and `coverageThreshold.global` to 100 for `lines`, `functions`, `branches`, `statements`, with `collectCoverageFrom: ['src/**/*.{ts,tsx}']`, and script `"test:coverage": "jest --coverage"`. Plans must order tasks so every config file's tooling is installed in or before the task that creates the config.

Coverage is shown on every PR: `ci.yml` runs `scripts/coverage-summary.mjs`, writes the table to the job summary, and posts or updates a single PR comment (`gh pr comment --edit-last --create-if-none`, needs `pull-requests: write`). Fork and Dependabot PRs get the job summary only, because their token is read-only. The coverage reporter list must include `json-summary` for both Vitest and Jest.

Rules:
- Never lower a threshold, add blanket `exclude` entries, or use `/* v8 ignore */` to get green. If code is genuinely untestable (entry-point glue), ask the user before excluding it and record the reason in the config.
- Generated code and `*.stories.*` / `*.d.ts` are the only default exclusions.
- Non-Vitest stacks: use the equivalent hard gate (e.g. `pytest --cov-fail-under=100`, `go test -cover` with a 100% check).
- Update mode: if existing coverage is below 100%, report the gap and ask before enabling the gate, since it will fail pushes and CI until tests are added.
