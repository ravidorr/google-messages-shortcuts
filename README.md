# Messages Shortcut Actions

Chrome extension that archives, trashes, or marks as unread the selected or hovered conversation in [Google Messages Web](https://messages.google.com/web/).

## Features

- Archive the active conversation with `Ctrl+Shift+Y` (`Command+Shift+Y` on macOS)
- Move the active conversation to trash with `Ctrl+Shift+D` (`Command+Shift+D` on macOS)
- Mark the active read conversation as unread with `Ctrl+Shift+U` (`Command+Shift+U` on macOS)
- Show Archive and Trash shortcut pills on hovered and focused conversations
- Show a Mark as unread pill on read conversations
- Optionally open conversations immediately when they are hovered or focused
- Popup UI that shows the effective Chrome shortcut assignments
- Configurable automatic confirmation for the native Move to trash dialog
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

If Chrome or the operating system already uses a suggested shortcut, Chrome may leave that command unassigned until you choose a different key combination.

## How it works

1. A keyboard command triggers the background service worker.
2. The worker checks that the active tab is Google Messages.
3. The worker sends the command to the content script.
4. The content script finds the selected conversation row, or the hovered row if none is selected.
5. The content script opens the row menu and clicks Archive, Move to trash, or Mark as unread.
6. Trash actions confirm through Google Messages' native dialog.
7. Mark as unread is available only for conversations that are currently read.

## Limitations

- Google Messages owns its private DOM. Menu selectors may break after a UI update.
- The extension does not collect or transmit conversation data.
- Shortcut automation depends on Google Messages accepting programmatic clicks in its UI.

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
