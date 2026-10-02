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
| Unarchive | **Approve** | Live en 2026-10-01 (Chrome 154, 1.6.37): "Archived" modal with inline `button[data-e2e-unarchive-button]` (25 controls observed). Native unarchive succeeded (`backInInbox: true`). Shipped in extension 1.8.0 | Archived modal open; target row visible | Row disappears from archived modal within 2s | Shipped via `EXECUTION_KIND_ARCHIVED_MODAL_CLICK`; pill-only in archived modal |
| Open archived | **Approve** | Manual desktop pass 2026-10-02 (extension 1.8.0): injected Archived FAB and `Command+Shift+A` open the Archived modal through account/header menu discovery; dialog shell detected before unarchive rows finish loading. Shipped in extension 1.8.0 | Inbox visible; Archived dialog closed | Archived dialog shell or sidebar route opens | Shipped: page-level shortcut + injected FAB; fail closed when no native entry is found |
| Start chat | **Approve** | Live en 2026-10-02 (Chrome 154, extension 1.11.0, macOS): inbox self-test pass; `a[data-e2e-start-button]` `matchCount: 1`, visible, `href="/web/conversations/new"`. Rebound to `Ctrl+Shift+G` / `Command+Shift+G` after Chrome blocked `Command+Shift+N` (Incognito) and `Command+Option+N` (split view). Live shortcut opens new-conversation view without collision | Inbox visible; no blocking native dialog; exactly one visible Start chat control | New-conversation view opens (`/web/conversations/new` or validated compose surface) | Shipped in extension 1.11.0 via page-level shortcut; fail closed when dialog open or selector ambiguous |
| Open Spam & blocked | **Approve** (en-only, shipped 1.12.0) | Live discovery 2026-10-02 (Chrome 154, extension 1.11.1): native top-left drawer has exactly one visible matching `BUTTON`; no `data-e2e-*` selector observed. Native open produces one matching heading and one `mat-dialog-container` immediately and after 1s, repeated twice. Extension 1.12.0 live pass: assigned optional Chrome command and injected FAB both opened the dialog without mutating conversation state. | Inbox visible; native dialog closed; exactly one visible drawer entry with exact English label | One matching heading and one native dialog | Shipped through a drawer-scoped English fallback, optional Chrome command, and injected FAB. Revalidate before supporting another locale. |
| Block / report spam | **Approve** | Live menu e2e `data-e2e-conversation-menu-block` observed 2026-10-01; group-thread menu label **Report spam** validated 2026-10-02; confirm dialog mapped to `mat-dialog-container button[data-e2e-action-button-confirm]` with English labels `OK` (live 2026-10-02), `Block`, or `Block & report spam`; extension opens dialog and focuses native confirm without auto-clicking | Disposable test thread only | Native dialog open with confirm control focused | Shipped as pill-only via `EXECUTION_KIND_BLOCK_REPORT_SPAM_WITH_NATIVE_CONFIRM`; user completes native confirmation |

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
- Unarchive **shipped** in extension 1.8.0 via archived-modal execution kind (`button[data-e2e-unarchive-button]` in Archived modal).
- Open archived **shipped** in extension 1.8.0 (page-level shortcut and injected FAB; manual desktop pass 2026-10-02).
- Use [output/deferred-action-validation-console.js](../../output/deferred-action-validation-console.js) for sanitized selector evidence only; do not commit conversation content.

## Sign-off

- Phase 0 code scaffold: adapter contracts, self-test, fixtures, and this decision log.
- Live en-US baseline in [compatibility-matrix.md](./compatibility-matrix.md): self-test pass, row menu inspection, and extension automation for archive, trash (including cancel), and mark as unread (fallback path) recorded 2026-10-01.
- Locale matrix **pass** (2026-10-02): en-US LTR baseline (2026-10-01), RTL with Hebrew thread labels and English UI chrome (2026-10-02, extension 1.8.0), and locale-agnostic primary `data-e2e-*` selectors with localized Archived label fallbacks (`ארכיון`, `Archivados`, etc.). Block/report spam dialog automation approved for en-US with native focus-only confirmation. Group-thread row menus validated on en (2026-10-02). Non-English LTR UI chrome and non-en-US block confirm labels deferred to Phase 5. Pin/unpin blocked for web scope.
- **Phase 1 user-facing sign-off (2026-10-02, extension 1.9.1):** README, PRIVACY, popup, and release notes describe the stable action set; content scripts are scoped to `https://messages.google.com/web/*`. Revisit approved actions after each compatibility pass or Google Messages UI update.
