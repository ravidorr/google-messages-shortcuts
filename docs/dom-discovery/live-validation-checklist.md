# Live DOM validation checklist

Use this checklist against a signed-in Google Messages Web test account before changing selectors, adding row actions, or claiming locale support. Record results in [compatibility-matrix.md](./compatibility-matrix.md).

## Prerequisites

- Chrome or Chromium with the unpacked extension from `dist/`
- A dedicated test account with disposable conversations only
- No personal names, phone numbers, or message content in notes or screenshots committed to the repository

## Session setup

1. Open `https://messages.google.com/web/` and confirm pairing is healthy.
2. Note browser version, extension version, interface locale, and text direction (LTR or RTL).
3. Rebuild and reload the unpacked extension from `dist/`.
4. Run the in-page capability self-test from the Google Messages page console (default context):

   ```javascript
   await globalThis.MessagesShortcuts.runCapabilitySelfTest()
   ```

   If `MessagesShortcuts` is undefined, confirm the extension is enabled on `messages.google.com/web/*` and that `page-world-bridge.js` loaded (Sources > Content scripts).

5. Save capability states, reasons, and the self-test `environment` block (`browserVersion`, `extensionVersion`, `locale`, `direction`) in the compatibility matrix. Do not paste conversation content.

## Checklist

### Native keyboard and focus

- [ ] Tab through the conversation list without triggering unintended sends or menu opens.
- [ ] Confirm Google Messages native shortcuts still work when the extension is enabled.
- [ ] Type in compose fields; verify extension shortcuts do not fire in editable controls.
- [ ] Test IME composition if available (do not commit composed text to real threads unless intentional).

### Conversation list and virtualization

- [ ] Scroll the list until older rows load; note whether row nodes are recycled or removed from the DOM.
- [ ] Select, focus (keyboard), and hover rows; record which attributes change (`aria-selected`, `is-focused`, etc.).
- [ ] Open and close a conversation; note read-state changes on the list row.
- [ ] Repeat with at least one unread and one read row.

### Row menu actions (existing)

- [ ] Archive a disposable test conversation via native UI; record `data-e2e-*` selectors observed.
- [ ] Move a disposable conversation to trash; record confirm dialog selectors and focus behavior.
- [ ] Mark a read conversation unread; confirm unread marker selector updates.
- [ ] Repeat trash with extension auto-confirm disabled and enabled.

### Row menu actions (Phase 1 candidates)

For each action below, open the row menu on a disposable thread and record evidence using this field set in [compatibility-matrix.md](./compatibility-matrix.md):

- target view (inbox, archived, group thread)
- stable primary selector or tested fallback
- source-state signal and precondition
- bounded postcondition signal (not click-only success)
- delayed render behavior
- row reorder or virtualization behavior
- cancellation or failure result

If any field cannot be satisfied safely, mark the action **defer** or **block** in [phase1-action-decisions.md](./phase1-action-decisions.md) and do not implement it.

- [ ] Mark as read (row menu path; open-row path already approved)
- [ ] Pin / unpin
- [ ] Mute / unmute
- [ ] Unarchive (from archived view if available)
- [ ] Block / report spam (note dialogs and irreversible effects)

Optional helper: paste [output/deferred-action-validation-console.js](../../output/deferred-action-validation-console.js) into the Google Messages page console after the capability self-test. Copy only sanitized JSON back into the matrix.

### Account and thread context

- [ ] Switch Google account if multiple accounts are available; note whether list DOM resets.
- [ ] Test a one-to-one thread and a group thread if available.
- [ ] Record whether thread identity can be inferred without storing message text (for future draft recovery spikes only).

### Locales

Run the full checklist for:

- [ ] English (baseline)
- [ ] One non-English LTR interface
- [ ] One RTL interface

For each locale, verify `data-e2e-*` selectors still match before relying on English fallback labels.

### Start chat navigation (Epic B)

For Start chat, record evidence using this field set in [compatibility-matrix.md](./compatibility-matrix.md):

- target view (inbox, archived sidebar, archived modal, narrow layout)
- primary selector count for `a[data-e2e-start-button]`
- shortcut collision outcome for `Ctrl+Shift+G` / `Command+Shift+G` against Google Messages, browser, and OS shortcuts
- bounded postcondition (URL path `/web/conversations/new` or validated new-conversation surface selector)
- behavior while a native dialog is open (Archived modal, trash confirm, block dialog)
- editable-target guard (compose field, IME composition if available; Google Messages Web has no filter field in scope)
- delayed render or virtualization behavior on the Start chat FAB

Optional helper: paste [output/deferred-action-validation-console.js](../../output/deferred-action-validation-console.js) into the Google Messages page console and copy the sanitized `startChat` probe JSON into the matrix.

- [x] Native Start chat FAB selector count is exactly one on the inbox (2026-10-02, Chrome 154, extension 1.11.0, en LTR: `matchCount: 1`)
- [x] Page-level shortcut opens the new-conversation view without browser or Google Messages collisions (2026-10-02, macOS Chrome: `Command+Shift+G` pass after rebinding from Incognito and split-view chords)
- [ ] Shortcut is ignored inside editable controls and while a native dialog is open
- [x] Capability self-test reports `startChat.entry` as supported on the inbox (2026-10-02: `dom-query`, self-test `ok: true`)

### Spam & blocked navigation (Epic C)

For the shared native Spam & blocked dialog, record:

- one visible, exact-label entry in the native navigation drawer
- zero or multiple entry matches as a fail-closed state
- one matching heading and one `mat-dialog-container` after opening
- immediate and delayed postcondition checks, repeated after closing the dialog
- normal and narrow layouts

- [x] Inbox self-test is non-mutating and passes (2026-10-02, Chrome 154, extension 1.11.1, en LTR).
- [x] Native drawer exposes one visible Spam & blocked `BUTTON`; no `data-e2e-*` entry selector observed.
- [x] Native dialog postcondition is one heading plus one `mat-dialog-container`, immediately and after 1s, repeated twice.
- [x] Narrow-layout dialog check passes.
- [ ] Validate the exact fallback label in each additional supported locale before claiming locale support.

### Phase 2 page navigation

Follow [phase2-live-validation.md](./phase2-live-validation.md) for the full step-by-step pass. Record results in [compatibility-matrix.md](./compatibility-matrix.md) under scenario `phase2-navigation`.

Quick checklist:

- [ ] Steps 1–2: session metadata and capability self-test
- [ ] Step 3: context guards (editables, native dialogs, pause)
- [ ] Steps 4–6: loaded-list navigation, unread boundaries, return navigation
- [ ] Steps 7–8: command palette and shortcut help overlay
- [ ] Step 9: key collision matrix for every provisional binding
- [ ] Step 10: composer discovery spike ([composer-discovery-console.js](../../output/composer-discovery-console.js))
- [ ] Step 11: compatibility matrix row added

### Pill visibility (Epic A)

- [x] With default **On hover or focus**, confirm pills appear on hover, browser keyboard focus, and Google Messages `is-focused="true"` rows.
- [x] Switch to **On selected row only**; confirm hover and browser focus alone do not show pills, but `is-focused="true"` rows do.
- [x] Switch to **Hidden**; confirm no pills render while keyboard shortcuts still work.
- [x] Open the Archived modal and confirm extension shortcut pills do not appear under any visibility setting; native Unarchive controls remain the only row actions there.
- [x] Scroll the virtualized list; confirm visibility policy holds after row rerenders.

### Slow and partial DOM

- [ ] Throttle CPU in DevTools and repeat one archive and one trash flow.
- [ ] Confirm capability self-test completes without clicks, focus changes, or DOM mutations.

## Exit criteria

- Compatibility matrix row filled for every checked environment.
- Phase 1 action decisions updated with approve, defer, or block per action.
- Any new fixture captured only after [fixture-sanitization.md](./fixture-sanitization.md) scrubbing.
