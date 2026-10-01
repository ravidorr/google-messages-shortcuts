# Compatibility matrix

Record live validation results from [live-validation-checklist.md](./live-validation-checklist.md). Update this file after each manual compatibility pass or when Google Messages ships a visible UI change.

## Matrix format

| Date | Browser | Extension | Locale | Direction | Scenario | Capability self-test | Notes |
| ---- | ------- | --------- | ------ | --------- | -------- | -------------------- | ----- |
| YYYY-MM-DD | Chrome x.y | x.y.z | en-US | LTR | Baseline list + archive/trash/unread | pass / fail | Link to issue or PR if selectors changed |

### Scenario codes

- `baseline`: signed-in list with read and unread rows
- `archived-view`: archived folder if available
- `group-thread`: group conversation list row
- `rtl`: RTL interface
- `non-en-ltr`: non-English LTR interface
- `slow-dom`: CPU throttling enabled
- `baseline-trash-dialog-open`: Move to trash dialog visible (row menu typically closed)

### Capability self-test column

Use **pass** when `runCapabilitySelfTest()` returns `ok: true` (no DOM mutation, no `unsafe` capabilities, and no blocking `unavailable` capabilities outside composer/message pane/connection). Use **fail** when `ok: false`, any capability is `unsafe`, or `summary.blockingUnavailableCapabilityIds` is non-empty. List expected deferred `unavailable` states in Notes.

## Recorded results

| Date | Browser | Extension | Locale | Direction | Scenario | Capability self-test | Notes |
| ---- | ------- | --------- | ------ | --------- | -------- | -------------------- | ----- |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline | pass | `ok: true`, `unsafe: 0`, `mutated: false`. List targeting `dom-structure`. Eight capabilities unavailable (composer, message pane, connection) as expected. |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline (row menu open) | pass | Same self-test with `div.conversation-actions-menu` open: `menu.archive` and `menu.trash` `dom-query`; `menu.markUnread` and `menu.trashConfirm` remain `contract` (no live mark-unread e2e; trash dialog not open). |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline (extension automation) | n/a | On disposable read rows: archive, move to trash, trash dialog open, trash cancel, and mark as unread (shortcut/pill) all succeeded. |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline (trash dialog) | n/a | Move to trash dialog opens via extension; cancel without trashing verified; confirm control reachable (matches `data-e2e-action-button-confirm` contract). |
| 2026-10-01 | Chrome | 1.6.28 | en-US | LTR | baseline-trash-dialog-open | pass | Self-test with dialog open: `menu.trashConfirm` `dom-query`; `menu.archive`, `menu.trash`, and `menu.markUnread` `contract` (row menu not open). `ok: true`, `unsafe: 0`, `mutated: false`. |

## Selector evidence log

| Feature area | Primary selector / signal | Fallback | Locale tested | Confidence (1-5) | Last verified |
| ------------ | ------------------------- | -------- | ------------- | ---------------- | ------------- |
| List row | `mws-conversation-list-item` | n/a | en-US live | 5 | 2026-10-01 |
| Row menu button | `button[aria-haspopup="menu"], mws-menu-button button` | n/a | en-US live | 5 | 2026-10-01 |
| Unread marker | `[data-e2e-is-unread="true"]` | n/a | en-US live | 5 | 2026-10-01 |
| Archive | `button[data-e2e-conversation-menu-archive]` | English "Archive" | en-US live | 5 | 2026-10-01 |
| Trash | `button[data-e2e-conversation-delete]` | English "Move to trash" | en-US live | 5 | 2026-10-01 |
| Mark unread | `button[data-e2e-conversation-menu-mark-unread]` (absent live) | English "Mark as unread" via `.mat-mdc-menu-item` | en-US live | 5 | 2026-10-01 |
| Trash confirm | `mat-dialog-container button[data-e2e-action-button-confirm]` | English "Move to trash" | en-US live | 5 | 2026-10-01 |
| Block and report spam | `button[data-e2e-conversation-menu-block]` | English "Block & report spam" | en-US live | 4 | 2026-10-01 |
| Mute | `button[data-e2e-conversation-menu-mute]` | English "Mute" / "Unmute" (toggle not re-verified) | en-US live | 4 | 2026-10-01 |
| Composer | _not validated_ | n/a | n/a | 1 | Phase 0 gate |
| Message pane | _not validated_ | n/a | n/a | 1 | Phase 0 gate |
| Connection status | _not validated_ | n/a | n/a | 1 | Phase 0 gate |

### Live notes (2026-10-01, en-US)

- Row overflow menu panel uses `role="menu"` and class `conversation-actions-menu`; overlay IDs (`cdk-overlay-*`, `mat-menu-panel-*`) are dynamic and must not be used as selectors.
- Mark as unread: live menu item lacks `data-e2e-conversation-menu-mark-unread` (`primary: null`, `hasFallback: true`), but extension shortcut/pill on a disposable **read** row succeeded via English fallback.
- Archive and move to trash: extension automation succeeded on disposable rows (primary e2e selectors).
- Trash: confirm dialog opens; cancel without trashing verified; auto-confirm path verified when enabled. Self-test with dialog open: `menu.trashConfirm` `dom-query` (primary confirm selector present in DOM).
- Mark unread confidence **5** reflects verified automation on fallback path, not live primary e2e.
- Mute/unmute toggle, block/report spam dialog, locale matrix (non-English, RTL), and group/archived views remain unchecked.
