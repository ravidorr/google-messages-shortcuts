# Messages Shortcut Actions

Chrome extension that archives, trashes, marks as read, or marks as unread the selected or hovered conversation in [Google Messages Web](https://messages.google.com/web/).

[Install Messages Shortcut Actions from the Chrome Web Store](https://chromewebstore.google.com/detail/messages-shortcut-actions/dhdkppijmdfhgmbedgimkgenbmfhldjn).

## Features

- Archive the active conversation with `Ctrl+Shift+Y` (`Command+Shift+Y` on macOS)
- Move the active conversation to trash with `Ctrl+Shift+D` (`Command+Shift+D` on macOS)
- Mark the active unread conversation as read with `Ctrl+Shift+K` (`Command+Shift+K` on macOS)
- Mark the active read conversation as unread with `Ctrl+Shift+U` (`Command+Shift+U` on macOS)
- Mute, unmute, or block / report spam from row pills (Chrome allows only four keyboard shortcuts per extension)
- Open the Archived dialog with `Ctrl+Shift+A` (`Command+Shift+A` on macOS) or the injected Archived FAB beside Start chat
- Unarchive conversations from row pills inside the Archived dialog
- Show Archive and Trash shortcut pills on hovered and focused conversations
- Show a Mark as read pill on unread conversations
- Show a Mark as unread pill on read conversations
- Show Mute, Unmute, and Block / report spam pills on hovered and focused conversations
- Show an Unarchive pill on hovered and focused conversations inside the Archived dialog
- Show an Archived FAB beside Start chat when Archived is not already open (modal or sidebar route)
- Optionally open conversations immediately when they are hovered or focused
- Popup UI that shows the effective Chrome shortcut assignments and page-level navigation shortcuts
- Configurable automatic confirmation for the native Move to trash dialog
- Pause shortcut actions and conversation pills without disabling the extension
- Reset extension preferences from the popup without changing Google Messages
- In-page success and failure feedback with a screen-reader-friendly status region
- Language-agnostic menu targeting through Google Messages `data-e2e-*` attributes, with English text fallback

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

Chrome controls extension keyboard shortcuts. Open the extension popup or go to `chrome://extensions/shortcuts` and assign keys for **Messages Shortcut Actions**.

## Configure trash confirmation

The popup's **Automatically confirm Move to trash** setting controls whether a
trash shortcut or pill automatically confirms Google Messages' native dialog.
It is enabled by default.

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
11. Open Archived runs as a page-level shortcut because Chrome limits extensions to four manifest commands. It discovers the native entry through direct modal controls, bottom navigation, account menu, search overflow, app header menu, or Settings, then localized "Archived" labels.
12. Open Archived succeeds when the Archived dialog shell appears, even if the conversation list is still loading inside the modal. Sidebar route navigation also counts as success but shows guidance to reach the unarchive modal.
13. Unarchive runs only inside the Archived modal and does not use the row overflow menu.

## Limitations

- Google Messages owns its private DOM. Menu selectors may break after a UI update.
- Mark as read has no row-menu control in the current en-US UI; the extension uses row-open instead.
- The extension does not collect or transmit conversation data.
- Shortcut automation depends on Google Messages accepting programmatic clicks in its UI.

## DOM discovery and selector health

Phase 0 adds a fail-closed page adapter and a non-destructive capability self-test. The self-test only queries the page; it does not open menus, change read state, or store conversation content.

Phase 1 wires matrix-approved row actions through a single action registry. Before running an action, the content script runs the same capability assessment used by the self-test and blocks when list or menu selectors are unavailable or unsafe. Mark as unread prefers English menu fallback text when the primary e2e attribute is missing, matching live en-US validation. Mark as read uses open-row execution because the row menu does not expose a mark-as-read item. Paused state, capability blocks, and action outcomes surface through an in-page status region with recovery guidance.

On Google Messages Web, rebuild and reload the unpacked extension from `dist/`, then open DevTools on the page console (not an extension context) and run:

```javascript
await globalThis.MessagesShortcuts.runCapabilitySelfTest()
```

The capability self-test is exposed to the page through a small MAIN-world bridge script. Other console warnings from Google Messages, Grammarly, or service workers are unrelated to this extension.

Contributors document live validation in [docs/dom-discovery/live-validation-checklist.md](docs/dom-discovery/live-validation-checklist.md), record results in [docs/dom-discovery/compatibility-matrix.md](docs/dom-discovery/compatibility-matrix.md), and follow [docs/dom-discovery/fixture-sanitization.md](docs/dom-discovery/fixture-sanitization.md) before adding DOM fixtures. Phase 1 row-action gates live in [docs/dom-discovery/phase1-action-decisions.md](docs/dom-discovery/phase1-action-decisions.md).

Compose, loaded-message search, and connection diagnostics remain unavailable until live DOM discovery validates their selectors.

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
