# Roadmap

Keyboard-first productivity for [Google Messages Web](https://messages.google.com/web/) on Chrome and Chromium.

**Current release:** 1.14.2  
**Product principles:** [docs/product-principles.md](docs/product-principles.md)

## At a glance

| Phase | Focus | Status |
| --- | --- | --- |
| 0 | DOM discovery and adapter contracts | Done |
| 1 | Reliable conversation-row actions | Done (1.9.1+) |
| 2 | Page navigation and command discovery | Done (1.13.0+, composer focus 1.14.0) |
| 3 | Feasibility spikes (templates, find, drafts) | Next |
| 4 | Opt-in local content workflows | Blocked on Phase 3 |
| 5 | Internationalization and maintenance | Ongoing |

## Shipped today

### Conversation list (Phase 1)

- Keyboard shortcuts: archive, trash, mark read, mark unread
- Row pills: mute, unmute, block / report spam, unarchive (archived modal)
- Optional Chrome commands: Open Archived, Start chat, Open Spam & blocked
- Injected FABs for Archived and Spam & blocked
- Configurable pill visibility, trash auto-confirm, pause/reset, in-page feedback
- Fail-closed capability self-test and action registry

See [README.md](README.md) and [docs/dom-discovery/phase1-action-decisions.md](docs/dom-discovery/phase1-action-decisions.md).

### Page navigation (Phase 2)

- Guarded page-local keyboard controller (editable fields, IME, dialogs, row menus)
- Loaded-list navigation: next/previous conversation, open, return, escape-to-list
- Unread traversal within loaded rows with boundary feedback
- Command palette (`Ctrl+Shift+P` / `Command+Shift+P`) and shortcut help (`Shift+/`)
- Composer focus (`Alt+M` / `Option+M`) via live-validated editor selectors

Live validation: [docs/dom-discovery/phase2-live-validation.md](docs/dom-discovery/phase2-live-validation.md) and [docs/dom-discovery/compatibility-matrix.md](docs/dom-discovery/compatibility-matrix.md).

## Next up: Phase 3 feasibility spikes

Phase 3 runs three independent spikes. Each produces an evidence report and either a shippable capability contract or a documented stop decision. No user-facing compose or content feature ships until its spike passes the [launch gates](docs/product-principles.md#launch-gates).

| Spike | Goal | Success criteria |
| --- | --- | --- |
| **Templates** | Insert saved snippets at the cursor without overwriting drafts or triggering send | Stable editor focus, draft inspection, cursor insertion, undo preserved |
| **Loaded-message find** | Find text in currently rendered message nodes | Message identity, highlight/navigation, explicit loaded-coverage metadata |
| **Draft recovery** | Snapshot unsent compose text locally with correct account/thread binding | Stable identity keys, debounced mutation observation, review-before-restore |

Spikes that cannot satisfy fail-closed behavior, account isolation, coverage disclosure, and sanitized automated tests are rejected.

## Phase 4: Safe local content workflows

**Prerequisite:** At least one Phase 3 spike passes.

1. Local-data module: namespaced keys, schema migrations, retention, size caps, per-feature opt-in, account invalidation, deletion controls
2. **Templates** (if spike passes): local manager, keyboard invocation, previewed insertion, non-destructive conflict handling
3. **Loaded-message find** (if spike passes): find UI, next/previous match, highlights, coverage facts, clear-data control if any index persists
4. **Draft recovery** (if spike passes): opt-in, 30-day default retention, review-before-restore, never overwrite a non-empty active draft
5. **Older-history loader** (optional, experimental): only after loaded find is dependable; explicit, cancelable, state-safe

Requires [PRIVACY.md](PRIVACY.md) and popup/README updates before any persistent content ships.

## Phase 5: Internationalization and maintenance

1. Extension UI strings, fallback menu labels, and accessibility text in locale resources (`data-e2e-*` selectors remain primary)
2. Priority locales from community feedback, including at least one RTL interface
3. Non-English LTR Google Messages UI chrome and confirm-dialog labels validated before locale claims
4. No-content support report: extension version, capability state, browser version, selector status (explicit user copy/download only)
5. Public compatibility matrix, troubleshooting pause mode, changelog, and feature-request path without analytics
6. Re-run live compatibility whenever Google Messages changes DOM or adapter code changes

RTL layout validation and localized extension UI are Phase 5 work. Phase 2 overlay semantics are complete for English LTR only.

## Not on the roadmap

Pairing/RCS repair, a replacement Messages client, unattended scheduled sending, full-history search, and Firefox support. Rationale: [docs/product-principles.md](docs/product-principles.md#out-of-scope).

## Backlog and architecture

- Prioritized feature ideas with impact/difficulty scores: [docs/feature-backlog.md](docs/feature-backlog.md)
- Module map, testing expectations, and live-validation workflow: [docs/architecture.md](docs/architecture.md)

## How to contribute

Follow [CONTRIBUTING.md](CONTRIBUTING.md). User-facing changes need [CHANGELOG.md](CHANGELOG.md) entries, version bumps, tests, and compatibility-matrix updates when selectors or supported behavior change.
