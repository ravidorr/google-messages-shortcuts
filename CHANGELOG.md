# Changelog

All notable changes to this project will be documented in this file.

## 1.6.13 - 2026-09-30

### Added

- Add browser-level coverage for Google Messages archive, trash, and mark-unread action flows

## 1.6.12 - 2026-09-30

### Added

- Exercise popup initialization against the shipped HTML markup

## 1.6.11 - 2026-09-30

### Added

- Expand the manifest contract test to cover service worker wiring, content-script scope, commands, and built artifacts

## 1.6.10 - 2026-09-30

### Fixed

- Align background URL routing with the content-script scope for Google Messages Web

## 1.6.9 - 2026-09-30

### Fixed

- Ignore unread-state mutation records outside conversation rows when refreshing shortcut pills

## 1.6.8 - 2026-09-30

### Fixed

- Reference-count conversation shortcut pill installations so partial cleanup no longer removes shared styles or active pills

## 1.6.7 - 2026-09-30

### Fixed

- Document local preference storage and all supported shortcut actions in the privacy policy

## 1.6.6 - 2026-09-30

### Added

- Add a required CI workflow that validates linting, tests, build output, and the release ZIP artifact

## 1.6.5 - 2026-09-30

### Fixed

- Pin third-party GitHub Actions to immutable commit SHAs in CI workflows

## 1.6.4 - 2026-09-30

### Changed

- Use Lucide action icons consistently in shortcut pills and the popup

## 1.6.3 - 2026-09-30

### Changed

- Simplify the popup description and group shortcut configuration help with keyboard shortcuts

## 1.6.2 - 2026-09-30

### Changed

- Compact conversation shortcut pills with action icons and shortcut labels

## 1.6.1 - 2026-09-30

### Fixed

- Contain intermittent Google Messages DOM race errors during shortcut pill cleanup

## 1.6.0 - 2026-09-30

### Added

- Mark the active read conversation as unread with `Ctrl+Shift+U` (`Command+Shift+U` on macOS)
- Show a Mark as unread shortcut pill on read conversations in the conversation list

## 1.5.1 - 2026-09-30

### Fixed

- Prevent duplicate shortcut-pill removal during nested pointer events

## 1.5.0 - 2026-09-30

### Added

- Configurable opening of conversations on hover or focus, disabled by default

## 1.4.1 - 2026-09-30

### Changed

- Update development dependencies to resolve reported security vulnerabilities

## 1.4.0 - 2026-09-30

### Added

- Configurable automatic confirmation for the native Move to trash dialog

## 1.3.0 - 2026-09-30

### Added

- Open the active Google Messages conversation immediately on hover or focus

## 1.2.0 - 2026-09-30

### Added

- Show archive and trash shortcut pills on hovered and focused Google Messages conversations

## 1.1.4 - 2026-09-30

### Changed

- Replace the extension icon with a new extension icon

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
