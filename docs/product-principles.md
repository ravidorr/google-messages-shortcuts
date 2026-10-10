# Product principles

Messages Shortcut Actions targets **keyboard-first personal productivity for frequent desktop texters** on Chrome and Chromium browsers. The extension stays **free, open source, local-only, and telemetry-free**.

## Core commitments

- Conversation-list actions remain the stable core.
- Compose and message-content workflows are in scope, but each begins with a feasibility spike because the codebase originally automated only conversation-row menus.
- Persistent content features must be explicitly enabled, scoped to the active Google account, retention-configurable, and removable. Default: no message indexing; draft recovery defaults to a conservative 30-day retention when it ships.
- Current-conversation find starts with loaded messages only. A user-started older-history loader is a later experiment, never an implicit scan and never described as complete history coverage.
- Internationalization is a dedicated track for Google Messages interfaces and extension UI.

## Shortcut assignment model

The extension uses a hybrid Chrome Commands model:

- **Default Chrome commands:** Archive, trash, mark unread, and mark read ship with suggested keys in the manifest.
- **Optional Chrome commands:** Open Archived, Start chat, and Open Spam & blocked have no `suggested_key`. Users assign or rebind them in `chrome://extensions/shortcuts`.
- **Popup disclosure:** The popup shows extension preferences, the installed version, and a link to the GitHub Pages user guide. The guide documents default Chrome commands, optional command assignment via `chrome://extensions/shortcuts`, and page-local shortcuts. Navigation FABs remain available when no optional Chrome shortcut is assigned.
- **Page-local shortcuts:** Do not add new fixed page-level `keydown` shortcuts for navigation that could have been Chrome commands. A content-script listener supports unlimited page-local combinations, but those bindings are not visible or rebindable in Chrome's shortcut manager and can conflict with browser, OS, or Google Messages behavior.
- **Guard rules:** `keydown` handlers for in-page interactions must ignore editable controls, IME composition, repeated keys, selected text where relevant, and native dialogs. Use `event.code` for physical-key matching when layout independence matters. Call `preventDefault()` only after an action is safe to run.

## Scope boundaries

### Feasible now or after live DOM validation

- Additional conversation-row menu actions: mark read, mute/unmute, unarchive (archived modal), and block/report spam (shipped).
- Navigation: optional Chrome commands for Open Archived, Start chat, and Open Spam & blocked; page-local list navigation, palette, and help overlay.
- Command palette, keyboard help, list focus/navigation, improved feedback, preference controls, and a selector-health check.
- Templates, loaded-message find, and draft recovery **only after** compose/message feasibility spikes demonstrate stable DOM anchors and account/conversation identity.
- Local-only storage using `chrome.storage.local` or IndexedDB, with explicit consent and data lifecycle controls.

### Conditional and gated

- **Unread traversal:** Implement only if unread markers are reliable across loaded and virtualized list items, and disclose coverage (loaded rows only today).
- **Older-message loading:** Experimental, user-triggered, cancelable, and bounded; ship only if it does not silently mutate state or produce misleading coverage.
- **International support:** Data attributes first, localized fallback strings second. Each locale receives a manual compatibility test before claiming support.
- **Notifications/reminders:** Possible with new permissions and careful UX, but not a first commitment because they expand scope and cannot guarantee delivery while Chrome or the computer is unavailable.

### Out of scope

- Repairing Google Messages pairing, phone synchronization, RCS delivery, or browser page-load failures. The extension can surface observed status and troubleshooting guidance but cannot fix Google's service.
- A replacement Google Messages client or a direct protocol integration. There is no supported consumer API for that path.
- Guaranteed delivery confirmation, unattended scheduled sending, or a complete backup/recovery product.
- Full-history global find before the extension proves safe content capture, stable identity, and correct virtualized-list behavior.
- Firefox support, by product decision.

## Launch gates

Do not ship user-facing work unless these gates pass:

- **Row actions:** Do not implement until the live UI exposes a stable primary selector or a locale-tested fallback.
- **Compose/content features:** Do not ship until its spike establishes stable targets, a fail-closed state, a privacy disclosure, and a full deletion path.
- **Find coverage:** Do not claim "find all messages" unless coverage across unloaded history has been proven. Initial copy must say "find loaded messages in this conversation."
- **Draft recovery:** Do not restore drafts automatically or over a non-empty native draft.
- **Keyboard workflows:** Ship a capability only if the core workflow can be completed without a pointer, preserves normal typing and IME behavior, and passes accessibility/focus tests.
