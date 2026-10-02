# Compatibility matrix

Record live validation results from [live-validation-checklist.md](./live-validation-checklist.md). Update this file after each manual compatibility pass or when Google Messages ships a visible UI change.

## Matrix format

| Date | Browser | Extension | Locale | Direction | Scenario | Capability self-test | Notes |
| ---- | ------- | --------- | ------ | --------- | -------- | -------------------- | ----- |
| YYYY-MM-DD | Chrome x.y | x.y.z | en-US | LTR | Baseline list + archive/trash/unread | pass / fail | Link to issue or PR if selectors changed |

### Deferred action evidence fields

When validating pin/unpin, mute/unmute, or unarchive, add a short note per action covering:

| Field | Example values |
| ----- | ---------------- |
| Target view | inbox, archived, group thread |
| Primary selector | `button[data-e2e-conversation-menu-mute]` |
| Source-state signal | muted icon present, pinned placement, archived row marker |
| Postcondition | mute icon appears within 2s, row leaves archived list |
| Delayed render | menu item appears after 300ms throttle |
| Virtualization | row node replaced after pin reorder |
| Failure mode | duplicate selector, missing control, stale target |

Use **approve** only when automation can fail closed with a bounded postcondition. Otherwise keep **defer** or **block**.

### Scenario codes

- `baseline`: signed-in list with read and unread rows
- `archived-view`: archived folder if available
- `group-thread`: group conversation list row
- `rtl`: RTL interface
- `non-en-ltr`: non-English LTR interface
- `slow-dom`: CPU throttling enabled
- `baseline-trash-dialog-open`: Move to trash dialog visible (row menu typically closed)
- `pill-visibility`: Epic A popup visibility modes on inbox rows plus Archived modal absence check
- `start-chat`: Epic B page-level Start chat shortcut and native FAB selector validation

### Capability self-test column

Use **pass** when `runCapabilitySelfTest()` returns `ok: true` (no DOM mutation, no `unsafe` capabilities, and no blocking `unavailable` capabilities outside composer/message pane/connection). Use **fail** when `ok: false`, any capability is `unsafe`, or `summary.blockingUnavailableCapabilityIds` is non-empty. List expected deferred `unavailable` states in Notes.

## Recorded results

| Date | Browser | Extension | Locale | Direction | Scenario | Capability self-test | Notes |
| ---- | ------- | --------- | ------ | --------- | -------- | -------------------- | ----- |
| 2026-10-02 | Chrome 154.0.0.0 | 1.11.0 | en | LTR | start-chat | pass | **Epic B partial pass (selector + self-test).** Inbox self-test: `ok: true`, `mutated: false`, `blockingUnavailable: 0`, `startChat.entry` supported (`dom-query`). Structural probe: 24 rows, `a[data-e2e-start-button]` `matchCount: 1`, `href: /web/conversations/new`, visible (`display: flex`). **Block (resolved in code):** `Command+Shift+N` opened Chrome Incognito on macOS; rebound to `Option+Command+N` / `Ctrl+Alt+N`. Re-test postcondition, dialog suppression, editable-target guard, and collision checks with the new binding before **Approve**. PR #82. |
| 2026-10-02 | Chrome 154.0.0.0 | 1.10.0 | en | LTR | pill-visibility | pass | **Epic A manual pass.** hover-or-focus (default): pills on hover, browser keyboard focus, and `is-focused="true"` rows. selected-row-only: hover and browser focus alone do not show pills; `is-focused="true"` rows do. hidden: no pills; keyboard shortcuts still work. Archived modal: no extension pills under any setting; native Unarchive button only (expected). Virtualized list: visibility policy holds after row rerender. Self-test on inbox: `ok: true`, `mutated: false`, `blockingUnavailable: 0`. environment: Chrome 154 / extension 1.10.0 / locale en / direction ltr. |
| 2026-10-02 | Chrome 154 | 1.9.0 | en | LTR | baseline (block pill automation) | pass | Block / report spam pill opens native dialog, focuses `OK` confirm (`data-e2e-action-button-confirm`), does not auto-click. Cancel verified non-mutating. |
| 2026-10-02 | Chrome 154 | 1.9.0 | en | LTR | baseline (block dialog open) | n/a | Dialog probe: `confirmButtonCount: 1`, confirm label `OK`, `Report spam` checkbox present. Matches `mat-dialog-container button[data-e2e-action-button-confirm]` contract. |
| 2026-10-02 | Chrome 154 | 1.9.0 | en | LTR | baseline (row menu open, block menu item) | n/a | `menuOpen: true`, `button[data-e2e-conversation-menu-block]` `matchCount: 1`. |
| 2026-10-02 | Chrome 154 | 1.9.0 | en | LTR | group-thread (menu open) | n/a | Group row menu: archive/block/mute/trash e2e `matchCount: 1` each; pin `0`; mark unread visible without e2e. Menu label **Report spam** on `data-e2e-conversation-menu-block` (1:1 rows use Block & report spam). Pills visible on hover. |
| 2026-10-02 | Chrome 154 | 1.9.0 | en | LTR | baseline (deferred structural probe) | pass | [deferred-action-validation-console.js](../../output/deferred-action-validation-console.js): `ok: true`, `mutated: false`, 25 rows, `hasMenuButton: true`, `menuPanelOpen: false`. Menu e2e selectors `matchCount: 0` with menu closed (expected). |
| 2026-10-02 | Chrome | 1.8.0 | en-US | LTR | baseline (1.8.0 smoke) | pass | Post-release smoke: archive/trash/mark-read/unread/mute paths unchanged; unarchive pill in Archived modal; Open Archived FAB and `Command+Shift+A` / `Ctrl+Shift+A`. |
| 2026-10-02 | Chrome | 1.8.0 | he (threads) / en (UI chrome) | RTL | rtl + archived-view | pass | **Locale matrix pass (RTL).** Hebrew thread labels; Archived opened via account/header menu discovery; dialog shell success during spinner; unarchive pill exercised on archived row. |
| 2026-10-02 | Chrome | 1.8.0 | en (UI) / he (threads) | LTR | archived-view (desktop FAB + shortcut) | n/a | Manual pass: injected Archived FAB and `Command+Shift+A` open the Archived modal on wide desktop layout. Dialog shell detected during spinner load; list and unarchive controls render afterward. |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline | pass | `ok: true`, `unsafe: 0`, `mutated: false`. List targeting `dom-structure`. Eight capabilities unavailable (composer, message pane, connection) as expected. |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline (row menu open) | pass | Same self-test with `div.conversation-actions-menu` open: `menu.archive` and `menu.trash` `dom-query`; `menu.markUnread` and `menu.trashConfirm` remain `contract` (no live mark-unread e2e; trash dialog not open). |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline (extension automation) | n/a | On disposable read rows: archive, move to trash, trash dialog open, trash cancel, and mark as unread (shortcut/pill) all succeeded. |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline (trash dialog) | n/a | Move to trash dialog opens via extension; cancel without trashing verified; confirm control reachable (matches `data-e2e-action-button-confirm` contract). |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline-trash-dialog-open | pass | Self-test with dialog open: `menu.trashConfirm` `dom-query`; `menu.archive`, `menu.trash`, and `menu.markUnread` `contract` (row menu not open). `ok: true`, `unsafe: 0`, `mutated: false`. |
| 2026-10-01 | Chrome 154 | 1.6.32 | en-US | LTR | baseline | pass | `ok: true`, `unsafe: 0`, `mutated: false`. `list.conversationLink` `dom-structure` supported; seven capabilities supported; eight deferred unavailable (composer, message pane, connection) as expected. |
| 2026-10-01 | Chrome 154 | 1.6.33 | en-US | LTR | baseline (mark-as-read production validation) | pass | Self-test pass on signed-in list (24 unread rows). Open-on-hover/focus disabled: hover kept unread marker and URL unchanged. Mark-as-read pill and `Command+Shift+K` on a hovered unread row (while another read conversation stayed selected) cleared unread state and opened the pane via `a[data-e2e-conversation]`. |
| 2026-10-01 | Chrome 154.0.8037.93 | 1.6.37 | en | LTR | baseline (foundation smoke) | pass | Pause on/off, reset preferences, and mark-as-read on unread row verified. Mark-as-read shows success toast (`Conversation marked as read.`); no false error toast after rerender-timeout fix. |
| 2026-10-01 | Chrome 154.0.8037.93 | 1.6.37 | en | LTR | baseline (deferred structural probe) | pass | [deferred-action-validation-console.js](../../output/deferred-action-validation-console.js): `ok: true`, `mutated: false`, 25 rows, `hasMenuButton: true`, `menuPanelOpen: false`. Pin/mute/unarchive e2e selectors `matchCount: 0` with menu closed (expected). |
| 2026-10-01 | Chrome 154.0.8037.93 | 1.6.37 | en | LTR | baseline (row menu open, pin inspection) | n/a | Overflow menu on promo/business inbox row: Archive, Block & report spam, Move to trash, Mute only. No Pin or Unpin. |
| 2026-10-01 | Chrome 154.0.8037.93 | 1.6.37 | en | LTR | baseline (row menu open, 1:1 SMS pin inspection) | n/a | Overflow menu on 1:1 SMS inbox row: same four items; no Pin or Unpin. Confirms missing control is not thread-type-specific on web. |
| 2026-10-01 | Chrome 154.0.8037.93 | 1.6.37 | en | LTR | baseline (mute/unmute, disposable inbox row) | n/a | Pre-mute with menu open: `button[data-e2e-conversation-menu-mute]` `matchCount: 1`, label `Mute`. Menu items: Archive, Block & report spam, Move to trash, Mute, Mark as unread. Native mute and unmute exercised on same row. Post-mute list-row probes (`data-e2e-muted`, `.muted`, aria muted) all false (candidate signals not validated). Post-unmute probe run with menu closed (`menuLabel: null`). |
| 2026-10-01 | Chrome 154.0.8037.93 | 1.6.37 | en | LTR | archived-view (unarchive attempt) | n/a | Archived UI is a **modal dialog** titled "Archived" with per-row inline **Unarchive** buttons (not row overflow menu). Menu-based probes (`conversation-actions-menu`, `data-e2e-conversation-menu-unarchive`) correctly returned empty. Native unarchive click succeeded; post-unarchive `backInInbox: true`. |
| 2026-10-01 | Chrome 154.0.8037.93 | 1.6.37 | en | LTR | baseline (mute menu toggle) | n/a | After mute on disposable inbox row, menu reopen: `menuPanelOpen: true`, `button[data-e2e-conversation-menu-mute]` label `Unmute`. Bounded postcondition satisfied. |
| 2026-10-01 | Chrome 154.0.8037.93 | 1.6.37 | en | LTR | archived-view (modal selector probe) | n/a | Archived modal open: `mat-dialog-container` present; `button[data-e2e-unarchive-button]` count 25; label `Unarchive`. Not `data-e2e-conversation-menu-unarchive`. |

## Selector evidence log

| Feature area | Primary selector / signal | Fallback | Locale tested | Confidence (1-5) | Last verified |
| ------------ | ------------------------- | -------- | ------------- | ---------------- | ------------- |
| List row | `mws-conversation-list-item` | n/a | en-US live | 5 | 2026-10-01 |
| Row menu button | `button[aria-haspopup="menu"], mws-menu-button button` | n/a | en-US live | 5 | 2026-10-01 |
| Unread marker | `[data-e2e-is-unread="true"]` | n/a | en-US live | 5 | 2026-10-01 |
| Archive | `button[data-e2e-conversation-menu-archive]` | English "Archive" | en-US live | 5 | 2026-10-01 |
| Trash | `button[data-e2e-conversation-delete]` | English "Move to trash" | en-US live | 5 | 2026-10-01 |
| Mark unread | `button[data-e2e-conversation-menu-mark-unread]` (absent live) | English "Mark as unread" via `.mat-mdc-menu-item` | en-US live | 5 | 2026-10-01 |
| Mark as read (menu) | _not present_ | n/a | en-US live | 5 | 2026-10-01 |
| Mark as read (open row) | `a[data-e2e-conversation]` inside `mws-conversation-list-item` | n/a | en-US live | 5 | 2026-10-01 |
| Trash confirm | `mat-dialog-container button[data-e2e-action-button-confirm]` | English "Move to trash" | en-US live | 5 | 2026-10-01 |
| Block and report spam (menu) | `button[data-e2e-conversation-menu-block]` | English "Block & report spam" or "Report spam" (group threads) | en-US live + group-thread live | 5 | 2026-10-02 |
| Block and report spam (confirm) | `mat-dialog-container button[data-e2e-action-button-confirm]` | English "OK", "Block", or "Block & report spam" | en-US live (OK, 2026-10-02) + fixtures | 5 | 2026-10-02 |
| Mute / unmute (menu toggle) | `button[data-e2e-conversation-menu-mute]` (same node; label `Mute` ↔ `Unmute`) | English "Mute" / "Unmute" | en live | 5 | 2026-10-01 |
| Mute state (list row) | _not used_ (menu-label toggle is postcondition) | n/a | en live | n/a | 2026-10-01 |
| Unarchive (archived modal) | `button[data-e2e-unarchive-button]` in `mat-dialog-container` | English "Unarchive" | en + he (RTL threads) live | 5 | 2026-10-02 |
| Open archived (modal entry) | `button[data-e2e-archived-list-button], a[data-e2e-archived-list-button]` | Direct modal entry, bottom-nav route, account menu, search overflow, app header menu, Settings, then localized "Archived" labels | en + he (RTL threads) live | 5 | 2026-10-02 |
| Open archived (dialog shell) | `mat-dialog-container` with heading "Archived" | Unarchive controls may render after spinner | en + he (RTL threads) live | 5 | 2026-10-02 |
| Open archived (sidebar route) | `button[data-e2e-archived-button], a[data-e2e-archived-button]` | Any visible route control outside dialog; bottom navigation on narrow layouts | en live | 5 | 2026-10-01 |
| Start chat FAB anchor | `a[data-e2e-start-button]` inside `mw-fab-link.start-chat` | n/a | en live | 5 | 2026-10-02 |
| Start chat postcondition | URL path `/web/conversations/new` or `mws-new-conversation` / `[data-e2e-new-conversation-view]` | n/a | not validated (shortcut blocked) | 3 | Epic B gate |
| Start chat shortcut | `Ctrl+Alt+N` / `Option+Command+N` (page-level) | n/a | rebound after macOS **block** on `Command+Shift+N` (Chrome Incognito) | 3 | 2026-10-02 |
| Pin (web row menu) | _not present_ | n/a | en live | 5 | 2026-10-01 |
| Unpin (web row menu) | _not present_ | n/a | en live | 5 | 2026-10-01 |
| Composer | _not validated_ | n/a | n/a | 1 | Phase 0 gate |
| Message pane | _not validated_ | n/a | n/a | 1 | Phase 0 gate |
| Connection status | _not validated_ | n/a | n/a | 1 | Phase 0 gate |

### Live notes (2026-10-01, en-US)

- Row overflow menu panel uses `role="menu"` and class `conversation-actions-menu`; overlay IDs (`cdk-overlay-*`, `mat-menu-panel-*`) are dynamic and must not be used as selectors.
- Mark as unread: live menu item lacks `data-e2e-conversation-menu-mark-unread` (`primary: null`, `hasFallback: true`), but extension shortcut/pill on a disposable **read** row succeeded via English fallback.
- Mark as read: no row-menu item on read or unread rows (menu path blocked). Open-row spike: programmatic click on `a[data-e2e-conversation]` on an unread row cleared the unread marker.
- Archive and move to trash: extension automation succeeded on disposable rows (primary e2e selectors).
- Trash: confirm dialog opens; cancel without trashing verified; auto-confirm path verified when enabled. Self-test with dialog open: `menu.trashConfirm` `dom-query` (primary confirm selector present in DOM).
- Mark unread confidence **5** reflects verified automation on fallback path, not live primary e2e.
- Mute/unmute toggle remains unchecked on non-en-US passes. Block/report spam dialog automation uses native focus-only confirmation on en-US. Group-thread row menus validated on en (2026-10-02); menu label **Report spam** accepted alongside **Block & report spam**.

### Live notes (2026-10-01, en-US, extension 1.6.32)

- Production self-test on main: `list.conversationLink` reports `dom-structure` supported when conversation rows and `a[data-e2e-conversation]` links are present.
- Open-on-hover/focus disabled: manual hover on an unread row kept the unread marker and left the URL unchanged.

### Live notes (2026-10-01, en-US, extension 1.6.33)

- Mark-as-read pill on a hovered unread row cleared the unread marker and opened the message pane (manual pass).
- Mark-as-read keyboard shortcut (`Command+Shift+K`) on a hovered unread row while another read conversation stayed selected: pass with hovered-then-focused-then-selected target resolution.

### Live notes (2026-10-01, en, extension 1.6.37, Chrome 154)

- Foundation smoke pass: pause/reset controls, mark-as-read success feedback after 1.6.37 rerender-timeout fix (no false error toast when conversation opens).
- Deferred structural probe: self-test `ok: true`, `mutated: false`; list row and menu button present; candidate pin/mute/unarchive e2e selectors only queried with menu closed.
- Pin/unpin (web): row overflow menu inspected on promo/business and 1:1 SMS inbox rows. Menu items are Archive, Block & report spam, Move to trash, and Mute only. No Pin or Unpin control; `button[data-e2e-conversation-menu-pin]` not in DOM with menu open. Aligns with [Google Messages pin help](https://support.google.com/messages/answer/10930955) (pin/unpin action mobile-only; pinned rows may sync for display on web). Decision: **block** pin/unpin automation on Google Messages Web.
- Mute/unmute: `button[data-e2e-conversation-menu-mute]` confirmed; label toggles `Mute` → `Unmute` after native mute (menu reopen probe). List-row mute icon not required; menu-label is bounded postcondition. Decision: **approve** for menu-action implementation.
- Unarchive: Archived modal (title "Archived", Done footer) with inline `button[data-e2e-unarchive-button]` per row (`unarchiveCount: 25`). Not a row overflow menu item; do not use `data-e2e-conversation-menu-unarchive`. Native unarchive + `backInInbox: true` verified. Selector **approve**; shipped in extension 1.8.0 via `EXECUTION_KIND_ARCHIVED_MODAL_CLICK`.
- Open archived: bottom navigation `data-e2e-archived-button` opens the Archived **sidebar route**, not the unarchive modal. Extension discovery order: direct modal entry (`data-e2e-archived-list-button`), bottom-nav route, account menu, search overflow, app header menu, Settings, then localized "Archived" labels. Page-level shortcut `Ctrl+Shift+A` / `⇧⌘A` and the injected Archived FAB use that order. Modal success is detected when the dialog shell appears (`mat-dialog-container` + "Archived" heading), even before unarchive controls finish loading. Sidebar route success returns `archived-sidebar-only` feedback because unarchive pills require the modal.
- Open archived (desktop manual pass, 2026-10-02): injected Archived FAB and page-level shortcut open the Archived modal on a wide desktop layout. Initial spinner state resolves without a false timeout once dialog-shell detection is used.

### Live notes (2026-10-02, Epic B Start chat, extension 1.11.0, Chrome 154, en LTR)

- Inbox capability self-test pass: `startChat.entry` supported via `dom-query`; `matchCount: 1` for `a[data-e2e-start-button]` with `href="/web/conversations/new"`, visible, not disabled.
- **Shortcut collision (macOS):** `Command+Shift+N` opens a new Chrome Incognito window. Rebound to `Option+Command+N` / `Ctrl+Alt+N` in extension 1.11.0 to avoid Chrome's Shift+N Incognito chord.
- Postcondition, editable-target, dialog-suppression, and collision checks for the rebound binding remain open validation work before Start chat can move from **Defer** to **Approve**.

### Live notes (2026-10-02, locale matrix sign-off, extension 1.8.0)

- **Locale matrix pass:** en-US LTR baseline revalidated; RTL pass on Hebrew thread labels with English UI chrome (account/header Archived discovery, `ארכיון` label fallback, FAB + shortcut + unarchive pill).
- Primary `data-e2e-*` selectors remain locale-agnostic; localized Archived navigation labels are exact-match fallbacks only within navigation scopes.
- Remaining open validation moved to Phase 5: non-English LTR UI chrome and block/report spam confirm labels outside en-US.
- Phase 1 group-thread row menu validation complete for en (2026-10-02).
