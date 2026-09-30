# Changelog

All notable changes to this project will be documented in this file.

## 1.1.3 - 2026-09-30

### Changed

- Require complete line and statement coverage in the test suite

## 1.1.2 - 2026-09-30

### Fixed

- Make the coverage-report path assertion independent of checkout depth

## 1.1.1 - 2026-09-30

### Changed

- Enforce 100% branch coverage in the test suite

## 1.1.0 - 2026-09-30

### Added

- Strengthen generated icon, build artifact, package archive, and polling behavior coverage

### Fixed

- Scope trash confirmation fallback matching to the native dialog instead of the full page
- Preserve content-script action failures through the background command router
- Require synchronized release metadata across `package.json`, `manifest.json`, and `package-lock.json`

## 1.0.5 - 2026-09-30

### Changed

- Group existing changelog entries under the extension version in which they shipped

## 1.0.4 - 2026-09-30

### Added

- Replace generated extension artwork with the new product icon

### Fixed

- Generate product icons into custom output directories without requiring a copied source image

## 1.0.3 - 2026-09-30

### Added

- Complete branch coverage for content-script routing failures
- Keep package-lock metadata synchronized with extension version bumps
- Block local commits with unsynchronized package-lock metadata

## 1.0.2 - 2026-09-30

### Added

- Branch coverage above 96% with command and conversation failure-path tests

## 1.0.1 - 2026-09-30

### Added

- `npm run build` to produce a loadable extension in `dist/`
- `generate:icons`, `clean`, and `package` scripts for extension artifacts
- Pull request coverage reports with overall and per-file metrics updated by GitHub Actions
- Community, security, contribution, funding, and GitHub issue and pull request templates
- Shortcut warning ignores Chrome's unassigned extension activation command
- Bundled content script compatible with Chrome's classic content-script loader
- Required synchronized version bumps for every pull request
- Pre-commit validation blocking direct commits to `main`
- Pre-commit validation requiring a new changelog entry and synchronized version metadata

## 1.0.0 - 2026-09-30

### Added

- Manifest V3 extension with Archive and Trash keyboard shortcuts for Google Messages Web
- Background service worker command routing to the active Google Messages tab
- Content script automation for selected or hovered conversation rows
- Language-agnostic `data-e2e-*` selectors with English text fallback
- Popup UI for shortcut status and Chrome shortcut settings guidance
- Vitest unit tests, strict linting, and 90% pre-commit coverage enforcement
- README, MIT license, privacy policy, and extension icons
