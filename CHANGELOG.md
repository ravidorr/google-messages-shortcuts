# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Added

- `npm run build` to produce a loadable extension in `dist/`
- `generate:icons`, `clean`, and `package` scripts for extension artifacts
- Pre-commit validation blocking direct commits to `main`
- Pre-commit validation requiring a new changelog entry or synchronized version bumps

## 1.0.0 - 2026-09-30

### Added

- Manifest V3 extension with Archive and Trash keyboard shortcuts for Google Messages Web
- Background service worker command routing to the active Google Messages tab
- Content script automation for selected or hovered conversation rows
- Language-agnostic `data-e2e-*` selectors with English text fallback
- Popup UI for shortcut status and Chrome shortcut settings guidance
- Vitest unit tests, strict linting, and 90% pre-commit coverage enforcement
- README, MIT license, privacy policy, and extension icons
