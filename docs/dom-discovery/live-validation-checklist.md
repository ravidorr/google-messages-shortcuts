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

5. Save capability states and reasons in the compatibility matrix. Do not paste conversation content.

## Checklist

### Native keyboard and focus

- [ ] Tab through the conversation list without triggering unintended sends or menu opens.
- [ ] Confirm Google Messages native shortcuts still work when the extension is enabled.
- [ ] Type in search and compose fields; verify extension shortcuts do not fire in editable controls.
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

### Slow and partial DOM

- [ ] Throttle CPU in DevTools and repeat one archive and one trash flow.
- [ ] Confirm capability self-test completes without clicks, focus changes, or DOM mutations.

## Exit criteria

- Compatibility matrix row filled for every checked environment.
- Phase 1 action decisions updated with approve, defer, or block per action.
- Any new fixture captured only after [fixture-sanitization.md](./fixture-sanitization.md) scrubbing.
