# Privacy Policy

Messages Shortcut Actions operates locally in your browser.

## Data collection

This extension does not collect, store, or transmit conversation content, contact information, account identifiers, or usage analytics.

## Local processing

When you use a keyboard shortcut:

1. The extension checks whether the active tab is Google Messages Web.
2. The extension sends the shortcut command to the content script in that tab.
3. The content script interacts with the Google Messages page DOM to archive, trash, or mark as unread the selected or hovered conversation.

All of those steps happen on your device.

## Local preferences

The extension stores two popup settings locally with `chrome.storage.local`:

- `autoConfirmTrash`: whether trash shortcuts and pills automatically confirm Google Messages' native Move to trash dialog
- `openConversationOnFocus`: whether hovering or focusing a conversation opens it immediately

These preferences stay on your device. They are not synced or transmitted by this extension.

## Network access

The extension requests host permission for `https://messages.google.com/*` so its content script can run on Google Messages Web. The extension itself does not send your conversation data to any third-party service operated by this project.

## Permissions

- `tabs`: used to identify the active tab and forward shortcut commands to Google Messages Web
- `storage`: used to persist the two local popup preferences described above

## Contact

Report privacy questions through the GitHub repository issue tracker.
