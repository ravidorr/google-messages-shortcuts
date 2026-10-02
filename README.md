# Messages Shortcut Actions

Chrome extension for keyboard shortcuts and row pills that automate conversation-list actions in [Google Messages Web](https://messages.google.com/web/): archive, trash, read/unread, mute/unmute, block / report spam, open Archived, Spam & blocked, start chat, and unarchive.

[Install Messages Shortcut Actions from the Chrome Web Store](https://chromewebstore.google.com/detail/messages-shortcut-actions/dhdkppijmdfhgmbedgimkgenbmfhldjn).

## Features

- Archive the active conversation with `Ctrl+Shift+Y` (`Command+Shift+Y` on macOS)
- Move the active conversation to trash with `Ctrl+Shift+D` (`Command+Shift+D` on macOS)
- Mark the active unread conversation as read with `Ctrl+Shift+K` (`Command+Shift+K` on macOS)
- Mark the active read conversation as unread with `Ctrl+Shift+U` (`Command+Shift+U` on macOS)
- Mute, unmute, or block / report spam from row pills (Chrome allows only four keyboard shortcuts per extension)
- Assign optional Chrome shortcuts for Open Archived, Start chat, and Open Spam & blocked
- Open the Archived dialog with the injected Archived FAB beside Start chat
- Open the native Spam & blocked dialog with the injected Spam & blocked FAB
- Rely on Google Messages' native Unarchive controls inside the Archived dialog
- Show Archive and Trash shortcut pills on hovered and focused conversations
- Show a Mark as read pill on unread conversations
- Show a Mark as unread pill on read conversations
- Show Mute, Unmute, and Block / report spam pills on hovered and focused conversations
- Do not show extension pills inside the Archived dialog; use Google Messages' native Unarchive controls there
- Show an Archived FAB beside Start chat when Archived is not already open (modal or sidebar route)
- Optionally open conversations immediately when they are hovered or focused
- Popup UI that shows the effective Chrome shortcut assignments, including optional navigation commands
- Configurable automatic confirmation for the native Move to trash dialog
- Configurable pill visibility: on hover or focus (default), on selected row only, or hidden
- Pause shortcut actions and conversation pills without disabling the extension
- Reset extension preferences from the popup without changing Google Messages
- In-page success and failure feedback with a screen-reader-friendly status region
- Language-agnostic menu targeting through Google Messages `data-e2e-*` attributes, with English text fallback
- Page-local keyboard navigation across currently loaded conversation rows (see Phase 2 below)
- Filterable command palette and `Shift+/` shortcut reference on Google Messages Web

## Requirements

- Google Chrome or another Chromium browser with Manifest V3 support
- An open Google Messages Web tab at `https://messages.google.com/web/*`

## Install locally

1. Clone this repository.
2. Run `npm install`.
3. Run `npm run build`.
4. Open `chrome://extensions`.
5. Enable Developer mode.
6. Click **Load unpacked** and select the `dist/` directory.

## Change shortcuts

Chrome controls extension keyboard shortcuts. Archive, trash, mark as read, and mark as unread have default assignments. Open the extension popup or go to `chrome://extensions/shortcuts` to assign keys for optional navigation commands: Open Archived, Start chat, and Open Spam & blocked.

## Configure trash confirmation

The popup's **Automatically confirm Move to trash** setting controls whether a
trash shortcut or pill automatically confirms Google Messages' native dialog.
It is enabled by default.

## Configure pill visibility

The popup's **Show shortcut pills** setting controls when conversation row
pills appear:

- **On hover or focus** (default): show pills when you hover a row, move
  keyboard focus into it, or Google Messages marks it selected in the list.
- **On selected row only**: show pills only on the row Google Messages marks
  with `is-focused="true"`. Hover and browser keyboard focus alone do not
  show pills.
- **Hidden**: do not show pills. Keyboard shortcuts still work.

Changes apply immediately in open Google Messages tabs.

## Configure conversation opening

The popup's **Open conversations on hover or focus** setting controls whether
hovering or tabbing to a conversation opens it. It is disabled by default, so
these interactions display shortcut pills without marking unread conversations
as read. Clicking a conversation or pressing Enter uses Google Messages'
native behavior.

The **Mark as read** shortcut is an explicit user action. It always clicks the
conversation row link to clear unread state, even when open-on-hover/focus is
disabled. That opens the message pane, which is Google Messages' native
behavior for selecting a conversation.

## Pause or reset the extension

The popup's **Pause shortcut actions and pills** setting disables keyboard
shortcuts and conversation pills on Google Messages Web while leaving native
Google Messages behavior unchanged.

**Reset extension preferences** restores popup defaults only. It does not
archive, trash, or modify conversations and does not store message content.

If Chrome or the operating system already uses a suggested shortcut, Chrome may leave that command unassigned until you choose a different key combination.

## How it works

1. A keyboard command triggers the background service worker.
2. The worker checks that the active tab is Google Messages.
3. The worker sends the command to the content script.
4. The content script finds the hovered conversation row, the keyboard-focused row, or the selected row when neither is present.
5. Archive, trash, and mark-as-unread actions open the row menu and click the matching item.
6. Mark as read clicks the conversation link on unread rows and waits for the unread marker to clear.
7. Trash actions confirm through Google Messages' native dialog when auto-confirm is enabled.
8. Block / report spam opens Google Messages' native dialog and focuses the final confirmation control. You complete the block and any report-spam choice in the native UI.
9. Mark as unread is available only for conversations that are currently read.
10. Mark as read is available only for conversations that are currently unread.
11. Open Archived, Start chat, and Open Spam & blocked are optional Chrome commands. Assign them in `chrome://extensions/shortcuts`; the background worker routes them only to an active Google Messages Web tab.
12. Open Archived succeeds when the Archived dialog shell appears, even if the conversation list is still loading inside the modal. Sidebar route navigation also counts as success but shows guidance to reach the unarchive modal.
13. Open Spam & blocked clicks the native English **Main menu** control, then only a single visible English **Spam & blocked** drawer button. It fails closed when either control is missing or ambiguous, and succeeds only after the native dialog’s matching heading appears.
14. The Archived modal does not show extension pills; unarchive there uses Google Messages' native controls.

## Limitations

- Google Messages owns its private DOM. Menu selectors may break after a UI update.
- Mark as read has no row-menu control in the current en-US UI; the extension uses row-open instead.
- Pin and unpin are not available in Google Messages Web row menus; the extension does not automate them.
- Block / report spam opens Google Messages' native dialog and focuses the final confirmation control. You complete the block and any report-spam choice in the native UI.
- Open Spam & blocked is validated only for the current English UI. The extension does not open it when the Main menu or exact English drawer label is missing or ambiguous.
- Supported locale evidence is documented in [docs/dom-discovery/compatibility-matrix.md](docs/dom-discovery/compatibility-matrix.md). en-US and RTL baseline passes are complete; non-English LTR UI chrome and non-en-US confirm labels are Phase 5 work.
- The extension does not collect or transmit conversation data.
- Shortcut automation depends on Google Messages accepting programmatic clicks in its UI.

## Phase 2: page navigation and discovery (1.13.0)

Page-local shortcuts run only on Google Messages Web. They ignore editable fields, IME composition, native dialogs, repeated key presses, and selected text unless a command is explicitly safe for that context. Pause closes the palette and help overlay and blocks the keyboard controller.

Provisional page-local bindings (validate collisions in your browser and OS before relying on them):

| Action | Binding (Windows/Linux) | Binding (macOS) |
| --- | --- | --- |
| Next conversation | `Alt+ArrowDown` | `Option+ArrowDown` |
| Previous conversation | `Alt+ArrowUp` | `Option+ArrowUp` |
| Open focused conversation | `Alt+Enter` | `Option+Enter` |
| Return to previous conversation | `Alt+[` | `Option+[` |
| Next unread | `Alt+U` | `Option+U` |
| Previous unread | `Alt+Shift+U` | `Option+Shift+U` |
| Return focus to conversation list | `Escape` | `Escape` |
| Command palette | `Ctrl+Shift+P` | `Command+Shift+P` |
| Shortcut reference | `Shift+/` | `Shift+/` |
| Focus composer | `Alt+M` | `Option+M` (unavailable until live DOM validation) |

List and unread navigation operate on **currently loaded rows only**. When unread traversal reaches the end of loaded unread rows, the extension reports a visible boundary message without hiding or filtering the native list. Return navigation stores the last opened conversation link in memory (not persisted), re-queries loaded rows, and fails closed when the target is missing or ambiguous.

The command palette filters **command labels and descriptions only**. It does not index conversations or message content.

Composer focus remains **unavailable** until the Phase 2 DOM discovery spike confirms a stable editor selector. Follow [docs/dom-discovery/phase2-live-validation.md](docs/dom-discovery/phase2-live-validation.md) for the step-by-step live pass and record results in [docs/dom-discovery/compatibility-matrix.md](docs/dom-discovery/compatibility-matrix.md).

## Phase 1 scope (complete)

Phase 1 row actions are implemented and documented through extension **1.9.1**:

- **Keyboard shortcuts (manifest):** Archive, trash, mark as read, mark as unread
- **Row pills:** Mute, unmute, block / report spam (inbox rows only; Archived modal uses native Unarchive)
- **Optional Chrome navigation commands:** Open Archived, Start chat, and Open Spam & blocked. Assign any of them in `chrome://extensions/shortcuts`.

Live validation covers en-US inbox rows, group-thread row menus (group labels may read **Report spam** instead of **Block & report spam**), RTL thread labels with English UI chrome, and the Archived modal. See [docs/dom-discovery/phase1-action-decisions.md](docs/dom-discovery/phase1-action-decisions.md) for approve/defer/block gates.

## DOM discovery and selector health

Phase 0 adds a fail-closed page adapter and a non-destructive capability self-test. The self-test only queries the page; it does not open menus, change read state, or store conversation content. Its result includes an `environment` object with browser version, extension version, locale, and text direction for compatibility notes.

Phase 1 wires matrix-approved row actions through a single action registry. Before running an action, the content script runs the same capability assessment used by the self-test and blocks when list or menu selectors are unavailable or unsafe. Mark as unread prefers English menu fallback text when the primary e2e attribute is missing, matching live en-US validation. Mark as read uses open-row execution because the row menu does not expose a mark-as-read item. Mute, unmute, block / report spam, unarchive, and open Archived follow the same fail-closed capability contract. Paused state, capability blocks, and action outcomes surface through an in-page status region with recovery guidance.

On Google Messages Web, rebuild and reload the unpacked extension from `dist/`, then open DevTools on the page console (not an extension context) and run:

```javascript
await globalThis.MessagesShortcuts.runCapabilitySelfTest()
```

The capability self-test is exposed to the page through a small MAIN-world bridge script. Other console warnings from Google Messages, Grammarly, or service workers are unrelated to this extension.

Contributors document live validation in [docs/dom-discovery/live-validation-checklist.md](docs/dom-discovery/live-validation-checklist.md), record results in [docs/dom-discovery/compatibility-matrix.md](docs/dom-discovery/compatibility-matrix.md), and follow [docs/dom-discovery/fixture-sanitization.md](docs/dom-discovery/fixture-sanitization.md) before adding DOM fixtures. Phase 1 row-action gates live in [docs/dom-discovery/phase1-action-decisions.md](docs/dom-discovery/phase1-action-decisions.md).

Compose focus (page-local `Alt+M` / `Option+M`), loaded-message find, native filter UI focus, and connection diagnostics remain unavailable until live DOM discovery validates their selectors.

## Development

```bash
npm install
npm run build
npm run package
npm run lint
npm test
```

`npm run build` creates a loadable extension in `dist/`, including manifest icons. `npm run package` creates `release/google-messages-shortcuts.zip`. Use `npm run clean` to remove generated build, package, and coverage output. When `package.json` is staged, the pre-commit hook stages all of its changes, runs `npm install`, and stages the rebuilt `package-lock.json`, then runs staged linting and the full test suite with coverage thresholds.

GitHub Actions posts overall and per-file coverage summaries to every pull request.

Every pull request must increase matching versions in `package.json` and `manifest.json`.

## Community and support

- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md) in community spaces.
- Read [SECURITY.md](SECURITY.md) to report vulnerabilities privately.
- Read [SUPPORT.md](SUPPORT.md) for help, bugs, and feature requests.

## License

MIT. See [LICENSE.md](LICENSE.md).
