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
| Pin conversation | **Block** (web) | Live en 2026-10-01 (Chrome 154): no Pin item in row overflow menu on promo sender or 1:1 SMS inbox rows; `button[data-e2e-conversation-menu-pin]` absent with menu open. [Google Messages help](https://support.google.com/messages/answer/10930955): pin action is mobile-only; web displays synced pins but does not expose pin/unpin controls. | n/a on web | n/a on web | Do not implement on Google Messages Web unless Google ships row-menu pin controls |
| Unpin conversation | **Block** (web) | Same as pin: no Unpin in row overflow menu on web; unpin is mobile-initiated per Google docs | Pinned row visible on web (synced from phone) | Pin removed | Do not implement on web; revisit only if web UI adds unpin |
| Mute conversation | **Approve** | Live en 2026-10-01 (Chrome 154, 1.6.37): `button[data-e2e-conversation-menu-mute]` label `Mute`; after native mute, menu reopen shows `Unmute` (`menuPanelOpen: true`) | Row menu exposes mute | Menu label `Unmute` within 2s of click | Implement via existing menu-action pattern; postcondition is menu-label toggle |
| Unmute conversation | **Approve** | Same e2e node as mute; toggle verified (`Mute` ↔ `Unmute`); native unmute exercised on disposable row | Muted row (menu shows Unmute) | Menu label returns to `Mute` | Pair with mute; same selector and execution kind |
| Unarchive | **Approve** | Live en 2026-10-01 (Chrome 154, 1.6.37): "Archived" modal with inline `button[data-e2e-unarchive-button]` (25 controls observed). Native unarchive succeeded (`backInInbox: true`). Not a row-menu action | Archived modal open; target row visible | Row disappears from archived modal within 2s | Implement via `EXECUTION_KIND_ARCHIVED_MODAL_CLICK`; pill-only in archived modal |
| Open archived | **Approve** | Manual desktop pass 2026-10-02 (extension 1.8.0): injected Archived FAB and `Command+Shift+A` open the Archived modal through account/header menu discovery; dialog shell detected before unarchive rows finish loading | Inbox visible; Archived dialog closed | Archived dialog shell or sidebar route opens | Page-level shortcut + injected FAB; fail closed when no native entry is found |
| Block / report spam | **Defer** | Live menu e2e `data-e2e-conversation-menu-block` observed 2026-10-01; automation not exercised | Disposable test thread only | Irreversible or dialog-heavy | Map confirm dialog; explicit confirmation UX before any automation |

## Compose, message, and connection surfaces

| Surface | Decision | Rationale |
| ------- | -------- | --------- |
| Composer adapter | **Block** (feature) | No validated selectors; capability contract returns `unavailable` until live spike |
| Message pane adapter | **Block** (feature) | Loaded-message search deferred to Phase 3 spike |
| Connection status adapter | **Block** (feature) | No validated selectors for pairing/status UI |

These are not row actions but share the same gate: Phase 4 content features must not ship until corresponding spikes pass.

## Foundation release (2026-10-01)

- Pause/reset controls, in-page action feedback, and popup disclosures shipped in extension 1.6.36.
- Pin/unpin are **block** (web): live validation 2026-10-01 confirmed no row-menu controls on Google Messages Web; see [compatibility-matrix.md](./compatibility-matrix.md).
- Mute/unmute **approved** for menu-action implementation (2026-10-01 live validation).
- Unarchive **approved** for archived-modal execution kind (`button[data-e2e-unarchive-button]` in Archived modal).
- Open archived **approved** for page-level shortcut and injected FAB (manual desktop pass 2026-10-02, extension 1.8.0).
- Use [output/deferred-action-validation-console.js](../../output/deferred-action-validation-console.js) for sanitized selector evidence only; do not commit conversation content.

## Sign-off

- Phase 0 code scaffold: adapter contracts, self-test, fixtures, and this decision log.
- Live en-US baseline in [compatibility-matrix.md](./compatibility-matrix.md): self-test pass, row menu inspection, and extension automation for archive, trash (including cancel), and mark as unread (fallback path) recorded 2026-10-01.
- Locale matrix (non-English LTR, RTL), group views, and block/report spam dialog remain open. Pin/unpin blocked for web scope. Mute/unmute and unarchive approved for Phase 1 coding.
- Revisit deferred actions after each compatibility pass or Google Messages UI update.
