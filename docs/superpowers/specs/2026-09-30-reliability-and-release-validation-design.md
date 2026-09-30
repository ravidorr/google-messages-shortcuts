# Reliability and release validation design

## Goal

Fix the reviewed runtime reliability defects, align local release validation with
continuous integration, strengthen release-tooling tests, and publish version
`1.1.0`.

## Runtime behavior

The trash confirmation fallback will search only within the native dialog. It
will no longer search the whole document, preventing it from re-clicking the
menu action when both controls use the text "Move to trash".

The background command router will return a validated response from the content
script. An action result with `ok: false` will retain its failure reason rather
than being converted to `{ ok: true }`.

## Release validation

The pre-commit validation will require:

1. A new changelog entry.
2. A version increase in both `package.json` and `manifest.json`.
3. Equal versions across `package.json`, `manifest.json`, and the root entries
   in `package-lock.json`.

Contributor and pull request instructions will state that all three version
files must be synchronized, including the lockfile regeneration step.

## Tests

Tests will:

- Verify the dialog confirmation control, not the menu item, is clicked by the
  fallback.
- Preserve failures returned by the content script through the background
  router.
- Exercise the stricter release-validation contract.
- Generate every icon size and validate image dimensions and invalid-source
  failures.
- Inspect ZIP entries and contents rather than only its magic bytes.
- Append an element after polling begins to validate waiting behavior.
- Use fake timers or focused mocks for menu fallback timeout paths.
- Include release scripts in enforced coverage.

## Release

The package, manifest, and lockfile versions will be changed to `1.1.0`, with
an Unreleased changelog entry describing the fixes. The changes will be
verified, committed, pushed, and proposed in a draft pull request.
