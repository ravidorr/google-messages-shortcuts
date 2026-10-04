# Changelog

All notable changes to this project will be documented in this file.

## 1.14.11 - 2026-10-04

### Fixed

- Ignore untrusted shortcut pill clicks so page scripts cannot drive destructive row actions through injected pills
- Make the mark-as-read live validation console helper read-only and document manual shortcut follow-up

## 1.14.10 - 2026-10-04

### Fixed

- Update the mark-as-read live validation console helper to use pill interactions instead of the removed page bridge action API

## 1.14.9 - 2026-10-04

### Fixed

- Restrict the page-world bridge to the read-only capability self-test so page scripts cannot invoke destructive actions
- Fail closed when trash auto-confirm preference storage is unavailable
- Reject row actions while a native dialog is already open and require the exact Move to trash confirm label
- Treat multiple distinct composer editor matches as unsafe unless they are a validated textarea/contenteditable mirror pair

### Changed

- Synchronize roadmap, DOM discovery, and navigation FAB documentation with shipped behavior

## 1.14.8 - 2026-10-04

### Fixed

- Keep compact navigation controls within the available sidebar width and leave them unchanged behind native dialogs

## 1.14.7 - 2026-10-03

### Added

- Automatically match injected conversation row-action pills to the active Google Messages light or dark theme

## 1.14.6 - 2026-10-03

### Added

- Automatically match injected navigation tiles and shortcut badges to the active Google Messages light or dark theme

## 1.14.5 - 2026-10-03

### Fixed

- Keep Google Messages' native Block / report spam confirmation open by leaving its row menu alone while the dialog is displayed

## 1.14.4 - 2026-10-03

### Fixed

- Preserve the native Block / report spam confirmation dialog while dismissing the row menu, so the confirmation remains available to complete the action

## 1.14.3 - 2026-10-03

### Fixed

- Redesign the Start chat, Archived, and Spam & blocked navigation controls as equal icon-over-label tiles with legacy FAB styles fully reset, explicit Material colors, a fixed 300px three-column grid, top-right shortcut badges, inert tile groups behind native modals, and fail-closed navigation shortcuts while a dialog is open

## 1.14.2 - 2026-10-03

### Changed

- Rewrite ROADMAP.md as a forward-looking phase plan and move product principles, feature backlog, and architecture notes into dedicated docs

## 1.14.1 - 2026-10-03

### Fixed

- Ignore page-local shortcuts while conversation row menus are open so Escape closes native menus instead of hijacking focus
- Fail closed to paused when the extension cannot read the pause preference from storage
- Close the sibling discovery overlay before opening the command palette or shortcut help overlay
- Clear stale pending overlay opens when switching between palette and help during label fetch

### Changed

- Align Phase 2 docs and validation copy with actual guard behavior, manifest command count, composer validation status, and info toasts for list boundaries

## 1.14.0 - 2026-10-03

### Added

- Composer focus command (`Alt+M` / `Option+M`) using live-validated aria-label editor selectors inside `mws-message-input`

### Changed

- Composer adapter wires production editor selectors from Phase 2 live validation; draft read, insert, and send remain deferred
- Navigation feedback copy when composer focus is unavailable in the current view

## 1.13.0 - 2026-10-02

### Added

- Guarded page-local keyboard controller with context guards for editable fields, IME composition, native dialogs, repeated keys, and selected text
- Loaded-list navigation: next/previous conversation, open focused row, next/previous unread (loaded rows only), escape-to-list, and in-memory return navigation by conversation link identity
- Filterable command palette (`Ctrl+Shift+P` / `Command+Shift+P`) and shortcut reference overlay (`Shift+/`) driven by command metadata
- Navigation feedback toasts for unavailable, boundary, and fail-closed outcomes
- Composer DOM discovery spike script at `output/composer-discovery-console.js` (composer focus command remains unavailable until live validation)

### Changed

- Phase 2 documentation: RTL and localized validation deferred to Phase 5
- Popup adds a Page navigation section describing loaded-list limits and `Shift+/` help on Google Messages Web

## 1.12.0 - 2026-10-02

### Added

- Optional Chrome command and injected FAB for the shared native Spam & blocked dialog
- Fail-closed English Main menu and drawer-label adapter with a unique dialog-heading postcondition

### Changed

- Open Archived and Start chat now use optional Chrome commands, alongside Spam & blocked; users assign or rebind them in `chrome://extensions/shortcuts`
- Popup navigation shortcuts show Chrome’s actual assignment or **Not assigned**

## 1.11.1 - 2026-10-02

### Fixed

- Keep a live pill-visibility preference change when the content script's initial storage read resolves late
- Skip empty shortcut-pill groups and host styling for archived modal rows

## 1.11.0 - 2026-10-02

### Added

- Page-level Start chat shortcut (`Ctrl+Shift+G` / `Command+Shift+G`) that clicks the native `a[data-e2e-start-button]` control
- Fail-closed Start chat adapter with capability self-test coverage, bounded postcondition checks, and native-dialog suppression
- Popup Navigation shortcuts entry for Start chat
- Sanitized Start chat structural probe in `output/deferred-action-validation-console.js`

### Changed

- Rebind Start chat to `Ctrl+Shift+G` / `Command+Shift+G` after live validation found Chrome opens Incognito on `Command+Shift+N` and split view on `Command+Option+N` (macOS); macOS live pass confirms collision-free shortcut and new-conversation postcondition
- Navigation shortcut handler dispatches both Open Archived and Start chat page-level chords with editable-target, pause, and dialog guards
- DOM discovery docs and Phase 1 decision log record Start chat validation requirements before release sign-off

## 1.10.0 - 2026-10-02

### Added

- Configurable pill visibility preference with three modes: on hover or focus (default), on selected row only, and hidden
- Popup select control for pill visibility with reset support and live updates in open Google Messages tabs

### Changed

- Selected-row-only mode shows pills only when Google Messages marks the row `is-focused="true"`; browser hover and keyboard focus no longer qualify
- Archived modal rows never receive extension pills; native Unarchive controls remain the only row actions there
- Remove archived-modal unarchive pill injection and popup listing for the programmatic-only unarchive action

## 1.9.2 - 2026-10-02

### Changed

- Align README, PRIVACY, popup, ROADMAP, and Phase 1 sign-off docs with the stable 1.9.1 action set and `https://messages.google.com/web/*` content script scope

## 1.9.1 - 2026-10-02

### Changed

- Block / report spam menu capability accepts live group-thread label **Report spam** alongside **Block & report spam**
- Compatibility matrix records en group-thread row menu validation; non-English LTR UI chrome and non-en-US block confirm labels moved to Phase 5
- Validation console note clarifies self-test behavior when the row menu is open on a non-muted row

## 1.9.0 - 2026-10-02

### Added

- Block / report spam row pill that opens Google Messages' native dialog and focuses the final confirmation control without auto-clicking
- Dedicated `EXECUTION_KIND_BLOCK_REPORT_SPAM_WITH_NATIVE_CONFIRM` execution path with fail-closed dialog mapping
- Sanitized block-dialog probe in `output/deferred-action-validation-console.js`

### Changed

- Phase 1 decision log and compatibility matrix record block/report spam as approved for en-US with native focus-only confirmation
- Block / report spam confirm mapping accepts live en-US `OK` dialog label in addition to `Block` and `Block & report spam`

## 1.8.1 - 2026-10-02

### Changed

- Record locale matrix pass (en-US LTR and Hebrew RTL threads) and 1.8.0 live validation sign-off in DOM discovery docs

## 1.8.0 - 2026-10-02

### Added

- Unarchive row pill inside the Archived modal via `EXECUTION_KIND_ARCHIVED_MODAL_CLICK`
- Injected Archived FAB beside Start chat that opens the native Archived dialog
- Page-level Open Archived shortcut (`Ctrl+Shift+A` / `Command+Shift+A`) and popup Navigation shortcuts section
- Archived adapter with entry discovery, modal shell detection, and row-scoped unarchive button lookup
- Account menu, app header menu, and localized Archived label fallbacks for opening Archived on desktop layouts

### Changed

- Context-aware row pills: inbox actions hide in the Archived modal; unarchive shows only there
- Open Archived treats the dialog shell (title visible, list still loading) as success instead of waiting for unarchive controls
- Document archived entry selectors and navigation roadmap items for Start chat and Spam and blocked

### Fixed

- Archived FAB and shortcut false timeout when the Archived dialog opens slowly with a loading spinner
- Archived entry discovery on desktop layouts that expose Archived through account or header menus rather than list header overflow

## 1.7.1 - 2026-10-01

### Fixed

- Remove mute and unmute from the manifest so the extension loads within Chrome's four-command limit

### Changed

- Expose mute and unmute as row pills only; the popup shows "Row pill only" for those actions

## 1.7.0 - 2026-10-01

### Added

- Mute and unmute conversation shortcuts, popup entries, and row pills via the row overflow menu
- Label-matched menu click strategy for toggle items that share one `data-e2e-*` selector
- Menu-label postcondition polling after mute and unmute (`Mute` ↔ `Unmute`)

### Changed

- Record live validation evidence for mute/unmute approval and archived-modal unarchive selector discovery

## 1.6.37 - 2026-10-01

### Fixed

- Wait for delayed mark-as-read state changes and follow the conversation row when Google Messages rerenders it

## 1.6.36 - 2026-10-01

### Added

- Popup pause control that disables shortcut actions and conversation pills on Google Messages Web
- Popup reset control that restores extension preferences without changing Google Messages data
- In-page action feedback with a screen-reader-friendly status region and recovery guidance
- Generic row postcondition wait helper for future gated list actions
- Deferred-action validation console helper and expanded DOM discovery evidence fields

### Changed

- Document pause, reset, and feedback behavior in README and PRIVACY
- Keep pin, mute, and unarchive deferred until live validation records bounded postconditions

## 1.6.35 - 2026-10-01

### Added

- Product roadmap covering keyboard-first workflows, privacy boundaries, and delivery phases
- Project guidance that confirms the repository does not use Jira

## 1.6.34 - 2026-10-01

### Added

- Reusable mark-as-read live validation console helper at `output/live-validation-console.js`

### Changed

- Gitignore local `output/` artifacts while keeping the validation console helper tracked

## 1.6.33 - 2026-10-01

### Fixed

- Prefer hovered and keyboard-focused conversation rows over the selected row so mark-as-read shortcuts work while another conversation is open in the pane

### Changed

- Record mark-as-read production validation in the compatibility matrix (self-test on 1.6.32; pill and shortcut pass on 1.6.33)

## 1.6.32 - 2026-10-01

### Added

- Mark as read shortcut and pill for unread conversations via row-open execution (clicks the conversation link and waits for the unread marker to clear)
- Row-menu mark-as-read documented as blocked; open-row path approved in Phase 1 decision log and compatibility matrix

### Fixed

- Use `Ctrl+Shift+K` / `Command+Shift+K` for mark-as-read because `Ctrl+Shift+R` is reserved for hard reload
- Gate open-row actions on `list.conversationLink` instead of menu targeting so mark-as-read works when another row lacks a menu button
- Use a distinct open-envelope icon for mark-as-read pills and popup shortcuts

## 1.6.31 - 2026-10-01

### Fixed

- Wait for trash confirmation controls to render before fail-closed preflight blocks auto-confirm
- Prefer the primary mark-unread e2e selector when it is already present before English fallback polling

## 1.6.30 - 2026-10-01

### Added

- Phase 1 row-action registry for matrix-approved archive, trash, and mark-unread actions with shared pill and popup metadata

### Changed

- Dispatch row actions through the registry with runtime capability preflight that fails closed on unavailable or unsafe selectors
- Mark as unread uses fallback-first menu targeting when the primary e2e selector is absent

## 1.6.29 - 2026-10-01

### Fixed

- Fail the capability self-test when required list or menu capabilities are unavailable, not only when they are unsafe
- Treat missing row-menu and trash-dialog controls as unavailable when those surfaces are open instead of reporting contract-only support

## 1.6.28 - 2026-10-01

### Fixed

- Expose `MessagesShortcuts.runCapabilitySelfTest()` to the Google Messages page console through a MAIN-world bridge script

## 1.6.27 - 2026-10-01

### Added

- Phase 0 DOM discovery docs, page adapter contracts, sanitized list fixtures, and a non-destructive capability self-test exposed as `MessagesShortcuts.runCapabilitySelfTest()`

## 1.6.26 - 2026-10-01

### Fixed

- Replace a duplicate trash confirmation failure test with fallback coverage

## 1.6.25 - 2026-10-01

### Fixed

- Reject unsupported shortcuts before opening a conversation menu

## 1.6.24 - 2026-10-01

### Fixed

- Assert that English fallback actions activate their matching menu controls

## 1.6.23 - 2026-10-01

### Fixed

- Verify shortcut-pill clicks do not propagate to conversation rows

## 1.6.22 - 2026-10-01

### Fixed

- Remove redundant origin-wide host access from the extension manifest

## 1.6.21 - 2026-10-01

### Fixed

- Reject package artifacts that contain files absent from the built distribution

## 1.6.20 - 2026-10-01

### Fixed

- Support Windows package installs and synchronize the Git index after path-limited commits

## 1.6.19 - 2026-10-01

### Fixed

- Regenerate and stage package-lock metadata during commits that include package.json

## 1.6.18 - 2026-10-01

### Fixed

- Enforce changelog metadata validation in pull request CI

## 1.6.17 - 2026-10-01

### Fixed

- Restrict coverage report updates to comments created by GitHub Actions

## 1.6.16 - 2026-10-01

### Fixed

- Skip coverage comment publication for fork pull requests

## 1.6.15 - 2026-10-01

### Fixed

- Serialize conversation actions to prevent concurrent menu interactions

## 1.6.14 - 2026-09-30

### Fixed

- Isolate content-entry tests from retained listeners, observers, and shortcut pills

## 1.6.13 - 2026-09-30

### Added

- Add browser-level coverage for Google Messages archive, trash, and mark-unread action flows

## 1.6.12 - 2026-09-30

### Added

- Exercise popup initialization against the shipped HTML markup

## 1.6.11 - 2026-09-30

### Added

- Expand the manifest contract test to cover service worker wiring, content-script scope, commands, and built artifacts

## 1.6.10 - 2026-09-30

### Fixed

- Align background URL routing with the content-script scope for Google Messages Web

## 1.6.9 - 2026-09-30

### Fixed

- Ignore unread-state mutation records outside conversation rows when refreshing shortcut pills

## 1.6.8 - 2026-09-30

### Fixed

- Reference-count conversation shortcut pill installations so partial cleanup no longer removes shared styles or active pills

## 1.6.7 - 2026-09-30

### Fixed

- Document local preference storage and all supported shortcut actions in the privacy policy

## 1.6.6 - 2026-09-30

### Added

- Add a required CI workflow that validates linting, tests, build output, and the release ZIP artifact

## 1.6.5 - 2026-09-30

### Fixed

- Pin third-party GitHub Actions to immutable commit SHAs in CI workflows

## 1.6.4 - 2026-09-30

### Changed

- Use Lucide action icons consistently in shortcut pills and the popup

## 1.6.3 - 2026-09-30

### Changed

- Simplify the popup description and group shortcut configuration help with keyboard shortcuts

## 1.6.2 - 2026-09-30

### Changed

- Compact conversation shortcut pills with action icons and shortcut labels

## 1.6.1 - 2026-09-30

### Fixed

- Contain intermittent Google Messages DOM race errors during shortcut pill cleanup

## 1.6.0 - 2026-09-30

### Added

- Mark the active read conversation as unread with `Ctrl+Shift+U` (`Command+Shift+U` on macOS)
- Show a Mark as unread shortcut pill on read conversations in the conversation list

## 1.5.1 - 2026-09-30

### Fixed

- Prevent duplicate shortcut-pill removal during nested pointer events

## 1.5.0 - 2026-09-30

### Added

- Configurable opening of conversations on hover or focus, disabled by default

## 1.4.1 - 2026-09-30

### Changed

- Update development dependencies to resolve reported security vulnerabilities

## 1.4.0 - 2026-09-30

### Added

- Configurable automatic confirmation for the native Move to trash dialog

## 1.3.0 - 2026-09-30

### Added

- Open the active Google Messages conversation immediately on hover or focus

## 1.2.0 - 2026-09-30

### Added

- Show archive and trash shortcut pills on hovered and focused Google Messages conversations

## 1.1.4 - 2026-09-30

### Changed

- Replace the extension icon with a new extension icon

## 1.1.3 - 2026-09-30

### Changed

- Require complete line and statement coverage in the test suite

## 1.1.2 - 2026-09-30

### Fixed

- Make the coverage-report path assertion independent of checkout depth

## 1.1.1 - 2026-09-30

### Changed

- Enforce 100% branch coverage in the test suite

## 1.1.0 - 2026-09-30

### Added

- Strengthen generated icon, build artifact, package archive, and polling behavior coverage

### Fixed

- Scope trash confirmation fallback matching to the native dialog instead of the full page
- Preserve content-script action failures through the background command router
- Require synchronized release metadata across `package.json`, `manifest.json`, and `package-lock.json`

## 1.0.5 - 2026-09-30

### Changed

- Group existing changelog entries under the extension version in which they shipped

## 1.0.4 - 2026-09-30

### Added

- Replace generated extension artwork with the new product icon

### Fixed

- Generate product icons into custom output directories without requiring a copied source image

## 1.0.3 - 2026-09-30

### Added

- Complete branch coverage for content-script routing failures
- Keep package-lock metadata synchronized with extension version bumps
- Block local commits with unsynchronized package-lock metadata

## 1.0.2 - 2026-09-30

### Added

- Branch coverage above 96% with command and conversation failure-path tests

## 1.0.1 - 2026-09-30

### Added

- `npm run build` to produce a loadable extension in `dist/`
- `generate:icons`, `clean`, and `package` scripts for extension artifacts
- Pull request coverage reports with overall and per-file metrics updated by GitHub Actions
- Community, security, contribution, funding, and GitHub issue and pull request templates
- Shortcut warning ignores Chrome's unassigned extension activation command
- Bundled content script compatible with Chrome's classic content-script loader
- Required synchronized version bumps for every pull request
- Pre-commit validation blocking direct commits to `main`
- Pre-commit validation requiring a new changelog entry and synchronized version metadata

## 1.0.0 - 2026-09-30

### Added

- Manifest V3 extension with Archive and Trash keyboard shortcuts for Google Messages Web
- Background service worker command routing to the active Google Messages tab
- Content script automation for selected or hovered conversation rows
- Language-agnostic `data-e2e-*` selectors with English text fallback
- Popup UI for shortcut status and Chrome shortcut settings guidance
- Vitest unit tests, strict linting, and 90% pre-commit coverage enforcement
- README, MIT license, privacy policy, and extension icons
