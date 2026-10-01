# Changelog

All notable changes to this project will be documented in this file.

## 1.6.37 - 2026-10-01

### Fixed

- Wait for delayed mark-as-read state changes and follow the conversation row when Google Messages rerenders it

## 1.6.36 - 2026-10-01

### Added

- Popup pause control that disables shortcut actions and conversation pills on Google Messages Web
- Popup reset control that restores extension preferences without changing Google Messages data
- In-page action feedback with a screen-reader-friendly status region and recovery guidance
- Generic row postcondition wait helper for future gated list actions
- Deferred-action validation console helper and expanded DOM discovery evidence fields

### Changed

- Document pause, reset, and feedback behavior in README and PRIVACY
- Keep pin, mute, and unarchive deferred until live validation records bounded postconditions

## 1.6.35 - 2026-10-01

### Added

- Product roadmap covering keyboard-first workflows, privacy boundaries, and delivery phases
- Project guidance that confirms the repository does not use Jira

## 1.6.34 - 2026-10-01

### Added

- Reusable mark-as-read live validation console helper at `output/live-validation-console.js`

### Changed

- Gitignore local `output/` artifacts while keeping the validation console helper tracked

## 1.6.33 - 2026-10-01

### Fixed

- Prefer hovered and keyboard-focused conversation rows over the selected row so mark-as-read shortcuts work while another conversation is open in the pane

### Changed

- Record mark-as-read production validation in the compatibility matrix (self-test on 1.6.32; pill and shortcut pass on 1.6.33)

## 1.6.32 - 2026-10-01

### Added

- Mark as read shortcut and pill for unread conversations via row-open execution (clicks the conversation link and waits for the unread marker to clear)
- Row-menu mark-as-read documented as blocked; open-row path approved in Phase 1 decision log and compatibility matrix

### Fixed

- Use `Ctrl+Shift+K` / `Command+Shift+K` for mark-as-read because `Ctrl+Shift+R` is reserved for hard reload
- Gate open-row actions on `list.conversationLink` instead of menu targeting so mark-as-read works when another row lacks a menu button
- Use a distinct open-envelope icon for mark-as-read pills and popup shortcuts

## 1.6.31 - 2026-10-01

### Fixed

- Wait for trash confirmation controls to render before fail-closed preflight blocks auto-confirm
- Prefer the primary mark-unread e2e selector when it is already present before English fallback polling

## 1.6.30 - 2026-10-01

### Added

- Phase 1 row-action registry for matrix-approved archive, trash, and mark-unread actions with shared pill and popup metadata

### Changed

- Dispatch row actions through the registry with runtime capability preflight that fails closed on unavailable or unsafe selectors
- Mark as unread uses fallback-first menu targeting when the primary e2e selector is absent

## 1.6.29 - 2026-10-01

### Fixed

- Fail the capability self-test when required list or menu capabilities are unavailable, not only when they are unsafe
- Treat missing row-menu and trash-dialog controls as unavailable when those surfaces are open instead of reporting contract-only support

## 1.6.28 - 2026-10-01

### Fixed

- Expose `MessagesShortcuts.runCapabilitySelfTest()` to the Google Messages page console through a MAIN-world bridge script

## 1.6.27 - 2026-10-01

### Added

- Phase 0 DOM discovery docs, page adapter contracts, sanitized list fixtures, and a non-destructive capability self-test exposed as `MessagesShortcuts.runCapabilitySelfTest()`

## 1.6.26 - 2026-10-01

### Fixed

- Replace a duplicate trash confirmation failure test with fallback coverage

## 1.6.25 - 2026-10-01

### Fixed

- Reject unsupported shortcuts before opening a conversation menu

## 1.6.24 - 2026-10-01

### Fixed

- Assert that English fallback actions activate their matching menu controls

## 1.6.23 - 2026-10-01

### Fixed

- Verify shortcut-pill clicks do not propagate to conversation rows

## 1.6.22 - 2026-10-01

### Fixed

- Remove redundant origin-wide host access from the extension manifest

## 1.6.21 - 2026-10-01

### Fixed

- Reject package artifacts that contain files absent from the built distribution

## 1.6.20 - 2026-10-01

### Fixed

- Support Windows package installs and synchronize the Git index after path-limited commits

## 1.6.19 - 2026-10-01

### Fixed

- Regenerate and stage package-lock metadata during commits that include package.json

## 1.6.18 - 2026-10-01

### Fixed

- Enforce changelog metadata validation in pull request CI

## 1.6.17 - 2026-10-01

### Fixed

- Restrict coverage report updates to comments created by GitHub Actions

## 1.6.16 - 2026-10-01

### Fixed

- Skip coverage comment publication for fork pull requests

## 1.6.15 - 2026-10-01

### Fixed

- Serialize conversation actions to prevent concurrent menu interactions

## 1.6.14 - 2026-09-30

### Fixed

- Isolate content-entry tests from retained listeners, observers, and shortcut pills

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
