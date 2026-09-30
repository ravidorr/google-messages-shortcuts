# Reliability and Release Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix action-result handling, enforce consistent release metadata, improve artifact tests, and release version `1.1.0`.

**Architecture:** The background returns validated content-script results. Confirmation fallback selection is scoped to native dialogs. The pre-commit release guard requires changelog and fully synchronized version metadata, while tests exercise generated files and archives.

**Tech Stack:** JavaScript ES modules, Manifest V3, Vitest, Sharp, Archiver.

## Global Constraints

- Preserve Manifest V3 and existing public behavior except the requested fixes.
- Add or update Vitest coverage for every behavior change.
- Require a changelog entry and matching increased versions in `package.json`, `manifest.json`, and `package-lock.json`.
- Release version is exactly `1.1.0`.
- Do not bypass safeguards.
- Create a draft pull request.

### Task 1: Correct action routing and confirmation selection

**Files:** `src/content/conversation-action.js`, `src/background/command-router.js`, `test/unit/conversation-action.test.js`, `test/unit/command-router.test.js`

**Deliverables:**

- Use `mat-dialog-container button, mat-dialog-container .mat-focus-indicator` for the text fallback confirmation lookup.
- Return the `tabs.sendMessage()` response when it has a boolean `ok`; otherwise return `{ ok: false, reason: 'invalid-content-script-response' }`.
- Test both identically labeled menu and dialog controls, asserting the menu action happens once and the dialog confirmation happens once.
- Test that `{ ok: false, reason: 'no-target' }` propagates from the content script.
- Replace real timeout waits with mocks or fake timers.

**Verification:** `npx vitest run test/unit/conversation-action.test.js test/unit/command-router.test.js`

### Task 2: Enforce release metadata and document it

**Files:** `scripts/validate-release-metadata.js`, `test/unit/validate-release-metadata.test.js`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `CHANGELOG.md`

**Deliverables:**

- Make `canCommit()` require a new changelog entry, increased package and manifest versions, matching package and manifest versions, and matching package-lock root versions.
- Read staged `package-lock.json` in the hook and retain the separate lockfile validator.
- Reject changelog-only commits and stale-lockfile version bumps in tests.
- State that contributors must synchronize all three version files and regenerate the lockfile.
- Correct the changelog description of the local safeguard.

**Verification:** `npx vitest run test/unit/validate-release-metadata.test.js test/unit/validate-package-lock-version.test.js && npm run lint:md`

### Task 3: Strengthen artifact and polling coverage

**Files:** `scripts/generate-icons.js`, `test/unit/generate-icons.test.js`, `test/unit/build.test.js`, `test/unit/package.test.js`, `test/unit/wait-for-element.test.js`, `vitest.config.js`, `package.json`, `package-lock.json`

**Deliverables:**

- Verify each generated icon is PNG and has dimensions 16, 32, 48, and 128, and verify missing source images fail.
- Verify the build output icon metadata.
- Inspect package ZIP entries and file contents, with no `dist/` prefix. Add a current package-inspection dev dependency only if existing dependencies cannot inspect ZIP entries.
- Append a matching element after polling begins using fake timers.
- Include scripts in coverage and add focused tests until configured thresholds pass.

**Verification:** `npm test`

### Task 4: Publish the release

**Files:** `package.json`, `package-lock.json`, `manifest.json`, `CHANGELOG.md`, documentation files.

**Deliverables:**

- Set all version metadata to `1.1.0`.
- Add the requested fixes to the Unreleased changelog.
- Retain the approved design and plan documents.

**Verification:** `npm run lint && npm test && npm run build && npm run package && npm run verify:version-bump`

**Delivery:** Commit with hooks enabled, push `fix/reliability-release-validation`, and create a draft PR with the verification commands in its test plan.
