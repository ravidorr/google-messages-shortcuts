# Chrome Web Store Listing — Messages Shortcut Actions

> Last Updated: 2026-10-10

Internal listing metadata for the Chrome Web Store Developer Dashboard. Do not include this file in the packaged extension ZIP.

## Store Listing

**Extension Name**

Messages Shortcut Actions

**Short Description**

Keyboard shortcuts and row actions for Google Messages Web: archive, trash, read/unread, and more.

**Detailed Description**

Messages Shortcut Actions adds keyboard shortcuts, on-row action pills, and list navigation to Google Messages Web in Chrome.

Use default shortcuts to archive, move to trash, mark conversations read or unread, and optional shortcuts to open Archived, start a chat, or open Spam and blocked. Mute, unmute, and block or report spam appear as pills on conversation rows when you hover or focus a row. A compact popup controls trash confirmation, whether conversations open on hover, pill visibility, pause, and reset preferences.

Open the full shortcut guide from the popup for defaults, page-local navigation keys, and limitations. The extension runs only on Google Messages Web and does not read or send your messages to any third-party service.

**Category**

Social & Communication

**Single Purpose**

Provide keyboard shortcuts and conversation-row actions for Google Messages Web.

**Primary Language**

English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
| --- | --- | --- | --- |
| Store Icon | 128×128 PNG | Ready | `icons/icon128.png` |
| Screenshot 1 | 1280×800 or 640×400 | Needs update | (capture from Google Messages with pills/shortcuts) |
| Screenshot 2 | 1280×800 or 640×400 | Not created | |
| Screenshot 3 | 1280×800 or 640×400 | Not created | |
| Small Promo Tile | 440×280 | Not created | |
| Marquee Promo Tile | 1400×560 | Not created | |

### Screenshot Notes

- Show Google Messages conversation list with shortcut pills visible on hover or focus.
- Show the extension popup with preferences and the link to the user guide.
- Optional: command palette or in-page shortcut help (`Shift+/`) on Google Messages.

## Permissions Justification

| Permission / access | Type | Justification |
| --- | --- | --- |
| `storage` | permissions | Saves your popup choices on this device only: trash auto-confirm, open on hover, pill visibility, and pause. Nothing is synced or sent to a server. |
| `tabs` | permissions | Finds the active Google Messages Web tab so keyboard shortcuts from Chrome reach the correct tab and the background worker can route commands safely. |
| `https://messages.google.com/web/*` | content_scripts (matches) | Runs only on Google Messages Web to add shortcuts, pills, navigation, and the popup-linked behavior on pages you already use. No other sites are injected. |

## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

The extension does not collect, store on a server, or transmit conversation content, contacts, or usage analytics. Local preference keys live in `chrome.storage.local` on the device. See [PRIVACY.md](PRIVACY.md).

| Data Type | Collected? | Transmitted Off-Device? | Purpose | Shared with Third Parties? |
| --- | --- | --- | --- | --- |
| Personally identifiable info | No | No | — | No |
| Health info | No | No | — | No |
| Financial info | No | No | — | No |
| Authentication info | No | No | — | No |
| Personal communications | No | No | — | No |
| Location | No | No | — | No |
| Web history | No | No | — | No |
| User activity | No | No | — | No |
| Website content | No | No | — | No |

### Data Use Certification

- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes

## Privacy Policy

**Privacy Policy URL**

https://github.com/ravidorr/google-messages-shortcuts/blob/main/PRIVACY.md

## Distribution

**Visibility:** Public

**Regions:** All regions

## Developer Info

**Publisher Name**

ravidorr

**Contact Email**

raanan@avidor.org

**Support URL / Email**

https://github.com/ravidorr/google-messages-shortcuts/issues and [SUPPORT.md](SUPPORT.md)

**Homepage URL**

https://github.com/ravidorr/google-messages-shortcuts

**Public listing**

https://chromewebstore.google.com/detail/messages-shortcut-actions/dhdkppijmdfhgmbedgimkgenbmfhldjn

## Version History

| Version | Date | Changes | Status |
| --- | --- | --- | --- |
| 1.14.25 | 2026-10-10 | Icon-only action pills with shortcut reveal on hover or focus | Unreleased |
| 1.14.24 | 2026-10-10 | GitHub Pages guide deploy fixes; popup points to hosted user guide | Published |
| 1.14.23 | 2026-10-10 | Compact popup; GitHub Pages user guide | Published |

## Review Notes

### Known Issues / Limitations

- Depends on Google Messages Web DOM; UI changes can break automation until updated.
- Chrome allows four extension keyboard shortcuts; mute, unmute, and block or report spam use row pills.
- Mark-as-read live validation is contributor-only (storage opt-in), not a user-facing feature.

### Rejection History

None recorded.
