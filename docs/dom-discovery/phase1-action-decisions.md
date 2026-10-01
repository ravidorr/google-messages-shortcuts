# Phase 1 row action decisions

Decision gate output for Phase 0. Each action needs a stable primary `data-e2e-*` selector or locale-tested fallback, safe pre/postconditions, and sanitized fixtures before implementation in Phase 1.

States:

- **Approve**: evidence supports implementation in Phase 1 using the existing menu-action pattern.
- **Defer**: needs live validation from [live-validation-checklist.md](./live-validation-checklist.md) before coding.
- **Block**: unsafe, ambiguous, or missing anchors; do not implement until evidence changes.

| Action | Decision | Evidence | Preconditions | Postconditions | Next step |
| ------ | -------- | -------- | ------------- | -------------- | --------- |
| Archive | **Approve** | Live e2e + extension automation verified 2026-10-01 (en-US) | Row with menu button; menu opens | Row leaves active list | Maintain fixtures on DOM changes |
| Move to trash | **Approve** | Live e2e + extension automation, confirm dialog, and cancel verified 2026-10-01 (en-US) | Row with menu button; confirm dialog | Row removed or trashed per native UI | Keep confirmation preference |
| Mark as unread | **Approve** | Live en-US: primary e2e absent; English fallback + shortcut/pill verified 2026-10-01 on read row | Row is read | Unread marker present | Document fallback-first for this UI; recheck e2e on locale passes |
| Mark as read (row menu) | **Block** | Live en-US 2026-10-01: no "Mark as read" item on read or unread row overflow menus | Row is unread | Row shows read state | Do not implement menu path |
| Mark as read (open row) | **Approve** | Live en-US 2026-10-01: clicking `a[data-e2e-conversation]` on unread row clears unread marker | Row is unread | Unread marker absent | `EXECUTION_KIND_OPEN_ROW`; opens message pane natively |
| Pin conversation | **Defer** | No selector in repository | Row menu exposes pin | Pin state visible in list | Live validation; confirm toggle behavior |
| Unpin conversation | **Defer** | No selector in repository | Pinned row | Pin removed | Live validation |
| Mute conversation | **Defer** | Live menu e2e `data-e2e-conversation-menu-mute` observed 2026-10-01; automation not exercised | Row menu exposes mute | Mute state visible | Exercise mute/unmute on disposable row; add fixture |
| Unmute conversation | **Defer** | No selector in repository | Muted row | Mute removed | Live validation |
| Unarchive | **Defer** | No selector in repository | Archived view row | Row returns to inbox | Validate archived folder DOM |
| Block / report spam | **Defer** | Live menu e2e `data-e2e-conversation-menu-block` observed 2026-10-01; automation not exercised | Disposable test thread only | Irreversible or dialog-heavy | Map confirm dialog; explicit confirmation UX before any automation |

## Compose, message, and connection surfaces

| Surface | Decision | Rationale |
| ------- | -------- | --------- |
| Composer adapter | **Block** (feature) | No validated selectors; capability contract returns `unavailable` until live spike |
| Message pane adapter | **Block** (feature) | Loaded-message search deferred to Phase 3 spike |
| Connection status adapter | **Block** (feature) | No validated selectors for pairing/status UI |

These are not row actions but share the same gate: Phase 4 content features must not ship until corresponding spikes pass.

## Sign-off

- Phase 0 code scaffold: adapter contracts, self-test, fixtures, and this decision log.
- Live en-US baseline in [compatibility-matrix.md](./compatibility-matrix.md): self-test pass, row menu inspection, and extension automation for archive, trash (including cancel), and mark as unread (fallback path) recorded 2026-10-01.
- Locale matrix (non-English LTR, RTL), archived/group views, and deferred row actions remain open.
- Revisit deferred actions after each compatibility pass or Google Messages UI update.
