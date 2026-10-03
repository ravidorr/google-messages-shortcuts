# Feature backlog

Prioritized ideas scored for impact (1-5, expected value for frequent desktop texters) and difficulty (1-5, including DOM uncertainty, privacy implications, and test burden). Use this when planning work beyond the current [ROADMAP.md](../ROADMAP.md) phase.

Status labels: **Shipped**, **In progress**, **Planned**, **Deferred**, **Blocked**.

## Foundation and reliability

| Item | Impact | Difficulty | Status | Notes |
| --- | --- | --- | --- | --- |
| Centralize selectors, capabilities, and action metadata behind a page-adapter boundary | 5 | 3 | **Shipped** | Phase 0-1 adapter and action registry |
| Non-destructive capability self-test and unsupported-feature state | 5 | 3 | **Shipped** | `runCapabilitySelfTest()` |
| In-page success, failure, and recovery feedback | 4 | 2 | **Shipped** | Status region and toasts |
| Narrow host permission to `/web/*` when verified | 3 | 1 | **Shipped** | Manifest and runtime tab checks |
| Extension pause/reset and content-data deletion control | 5 | 2 | **Partial** | Pause/reset shipped; content-data deletion waits on Phase 4 store |
| Locale-aware action labels and selector fallbacks | 4 | 4 | **Planned** | Phase 5; English fallback only today |

## Keyboard workflow and conversation processing

| Item | Impact | Difficulty | Status | Notes |
| --- | --- | --- | --- | --- |
| Context-aware page keyboard controller | 5 | 4 | **Shipped** | 1.13.0+ with context guards |
| Command palette and `Shift+/` shortcut reference | 5 | 4 | **Shipped** | 1.13.0+ |
| List navigation, open, return, escape-to-list, composer focus | 5 | 4 | **Shipped** | Loaded-list only; composer focus 1.14.0 |
| Next/previous unread and loaded-list coverage indicator | 5 | 4 | **Shipped** | Boundary feedback; no native list filtering |
| Mark-read and mute/unmute after live validation | 4 | 2 | **Shipped** | Through 1.9.1 |
| Configurable pill visibility and selected-row-only targeting | 3 | 2 | **Shipped** | 1.10.0 |
| Block/report spam with confirmation and capability checks | 3 | 3 | **Shipped** | 1.9.0 pill-only, native confirm focus |
| Injected Archived FAB and optional Chrome command | 4 | 3 | **Shipped** | 1.8.0+ |
| Injected Spam & blocked FAB and optional Chrome command | 3 | 3 | **Shipped** | 1.12.0, en-only fallback |
| Optional Chrome command for Start chat (replaces page shortcut) | 3 | 2 | **Shipped** | 1.12.0 |
| Keyboard bulk operations | 4 | 5 | **Deferred** | Blocked until native multi-select state is inspectable |

## Compose and message-content expansion

| Item | Impact | Difficulty | Status | Notes |
| --- | --- | --- | --- | --- |
| Compose-adapter spike: focus, editor read/write, send state | 5 | 5 | **Partial** | Focus shipped 1.14.0; read/insert/send deferred |
| Local templates/snippets with insertion preview | 4 | 4 | **Planned** | Phase 3 spike |
| Current-conversation find for loaded message nodes | 5 | 5 | **Planned** | Phase 3 spike |
| Find coverage metadata (count, oldest/newest timestamps) | 5 | 3 | **Planned** | Phase 4 if find spike passes |
| Explicit load-older-history helper (experimental) | 3 | 5 | **Deferred** | After loaded find is dependable |
| Draft-recovery spike with stable account/conversation key | 4 | 5 | **Planned** | Phase 3 spike |
| Opt-in draft recovery with review-before-restore | 4 | 4 | **Planned** | Phase 4 if spike passes |
| Local data store with schema versioning and retention | 5 | 5 | **Planned** | Phase 4 prerequisite |
| Full cross-conversation content indexing | 4 | 5 | **Deferred** | Requires safe incremental capture and deduplication |
| Scheduled/unattended sending | 2 | 5 | **Out of scope** | Trust and delivery guarantees |

## Trust, accessibility, and delivery

| Item | Impact | Difficulty | Status | Notes |
| --- | --- | --- | --- | --- |
| Privacy policy and disclosures for local-content features | 5 | 2 | **Planned** | Required before Phase 4 ships |
| Overlay accessibility: focus trap, restoration, SR labels, RTL | 5 | 4 | **Partial** | English LTR shipped; RTL Phase 5 |
| Live UI compatibility matrix | 5 | 4 | **In progress** | [compatibility-matrix.md](dom-discovery/compatibility-matrix.md) |
| No content or identifiers in logs or diagnostics | 5 | 2 | **Shipped** | Strict local-only model |
| No-content support report (version, capability, selector status) | 4 | 2 | **Planned** | Phase 5 |
