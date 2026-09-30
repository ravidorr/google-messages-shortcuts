# Privacy Policy

Messages Shortcut Actions operates locally in your browser.

## Data collection

This extension does not collect, store, or transmit conversation content, contact information, account identifiers, or usage analytics.

## Local processing

When you use a keyboard shortcut:

1. The extension checks whether the active tab is Google Messages Web.
2. The extension sends the shortcut command to the content script in that tab.
3. The content script interacts with the Google Messages page DOM to archive or trash the selected or hovered conversation.

All of those steps happen on your device.

## Network access

The extension requests host permission for `https://messages.google.com/*` so its content script can run on Google Messages Web. The extension itself does not send your conversation data to any third-party service operated by this project.

## Permissions

- `tabs`: used to identify the active tab and forward shortcut commands to Google Messages Web

## Contact

Report privacy questions through the GitHub repository issue tracker.
