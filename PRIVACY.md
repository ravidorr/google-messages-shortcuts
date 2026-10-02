# Privacy Policy

Messages Shortcut Actions operates locally in your browser.

## Data collection

This extension does not collect, store, or transmit conversation content, contact information, account identifiers, or usage analytics.

## Local processing

When you use a keyboard shortcut, row pill, or navigation shortcut:

1. The extension checks whether the active tab is Google Messages Web (`/web/*`).
2. Keyboard shortcuts go through the background service worker to the content script in that tab. Row pills and page-level navigation shortcuts run in the content script on the page you already have open.
3. The content script interacts with the Google Messages page DOM to run the requested action on the selected, focused, or hovered conversation row, or to open native navigation such as the Archived dialog.

Supported actions include archive, move to trash, mark as read, mark as unread, mute, unmute, block / report spam (native dialog focus only; you confirm in Google Messages), open Archived, and unarchive inside the Archived modal.

All of those steps happen on your device.

## Local preferences

The extension stores three popup settings locally with `chrome.storage.local`:

- `autoConfirmTrash`: whether trash shortcuts and pills automatically confirm Google Messages' native Move to trash dialog
- `openConversationOnFocus`: whether hovering or focusing a conversation opens it immediately
- `extensionPaused`: whether shortcut actions and conversation pills are disabled on Google Messages Web

These preferences stay on your device. They are not synced or transmitted by this extension.

Resetting extension preferences from the popup restores those defaults. It does not change Google Messages conversations or store message content.

## Network access

The extension content scripts run only on `https://messages.google.com/web/*`, the Google Messages Web client path validated in Phase 0. The extension itself does not send your conversation data to any third-party service operated by this project.

## Permissions

- `tabs`: used to identify the active tab and forward shortcut commands to Google Messages Web
- `storage`: used to persist the local popup preferences described above

## Contact

Report privacy questions through the GitHub repository issue tracker.
