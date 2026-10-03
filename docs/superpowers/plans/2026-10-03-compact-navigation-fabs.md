# Compact Navigation FABs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render three compact, distinct navigation controls that fit the Google Messages sidebar and show assigned Chrome shortcuts as top-right badges.

**Architecture:** Preserve the native Start chat element and injected archived and Spam & blocked elements, but add extension-scoped compact row styles. A dedicated content module will retrieve the existing browser-command label map once, decorate the three navigation controls with non-interactive badges, and observe the FAB row so it handles buttons injected after startup. The navigation-FAB icon helper becomes command-agnostic so Spam & blocked can render a shield instead of the archive icon.

**Tech Stack:** Manifest V3 content scripts, browser DOM APIs, Chrome commands API messaging, JavaScript modules, Vitest, jsdom.

## Global Constraints

- Retain the existing mouse and keyboard activation behavior and accessible names for all three controls.
- Use the existing `MESSAGE_GET_BROWSER_COMMAND_LABELS` contract and its `Not assigned` sentinel. Never render a badge for an unassigned command.
- Add no production dependency.
- Keep all extension selectors and styles namespaced under `data-messages-shortcuts-*`.
- Write or update Vitest coverage for every code change. Use the localThis naming pattern in new Jest-style test mocks.
- Do not change version metadata or unrelated conversation-row shortcut pills.

---

## File Structure

- Modify `src/content/navigation-fab.js`: compact the FAB row; make its icon cloning helper accept a specific icon path; retain archived behavior.
- Modify `src/content/spam-blocked-fab.js`: request the shield path when creating the Spam & blocked control.
- Create `src/content/navigation-fab-shortcut-badges.js`: fetch navigation command labels, render decorative shortcut badges, and track the dynamically injected FABs.
- Modify `content.js`: install and tear down the badge module with the existing content-script lifecycle.
- Modify `test/unit/navigation-fab.test.js`: cover compact row styles and archive icon preservation.
- Modify `test/unit/spam-blocked-fab.test.js`: verify Spam & blocked renders a shield, not the archive path.
- Create `test/unit/navigation-fab-shortcut-badges.test.js`: cover assigned and unassigned badges, delayed FAB injection, and cleanup.
- Modify `test/unit/content-entry.test.js`: assert the content entry initializes and tears down the new installer.

### Task 1: Compact row and distinct navigation icons

**Files:**

- Modify: `src/content/navigation-fab.js:16-130`
- Modify: `src/content/spam-blocked-fab.js:4-43`
- Modify: `test/unit/navigation-fab.test.js:1-190`
- Modify: `test/unit/spam-blocked-fab.test.js:1-63`

**Interfaces:**

- Produces `copyNavigationFabIcon(startChatContainer, targetWrap, pathData)`, which replaces the cloned icon path with `pathData` and retains fallback SVG behavior.
- Produces `ARCHIVED_FAB_ICON_PATH` and `SPAM_BLOCKED_FAB_ICON_PATH` constants, each containing different SVG paths.
- `createArchivedFab` uses `ARCHIVED_FAB_ICON_PATH`; `createSpamBlockedFab` uses `SPAM_BLOCKED_FAB_ICON_PATH`.

- [ ] **Step 1: Write failing icon and compact-layout tests**

Add these focused assertions to the existing test files:

```javascript
it('adds compact sidebar styles to the navigation FAB row', async () => {
  document.body.innerHTML = startChatFabSurface;
  const localThis = installArchivedFab({ documentRoot: document, chromeApi });

  await vi.waitFor(() => {
    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
  });

  expect(document.querySelector('[data-messages-shortcuts-archived-fab-styles]').textContent)
    .toContain('max-width: 100%');
  expect(document.querySelector('[data-messages-shortcuts-archived-fab-styles]').textContent)
    .toContain('font-size: 12px');
  localThis();
});

it('uses a distinct shield icon for Spam and blocked', () => {
  document.body.innerHTML = startChatFabSurface;
  const fab = createSpamBlockedFab(document.querySelector('mw-fab-link.start-chat'), vi.fn());

  expect(fab.querySelector('mws-icon.fab-icon path').getAttribute('d'))
    .not.toContain('M20.54 5.23');
  expect(fab.querySelector('mws-icon.fab-icon path').getAttribute('d'))
    .toContain('M12 22s8-4');
});
```

- [ ] **Step 2: Run the focused tests to verify failure**

Run:

```bash
npx vitest run test/unit/navigation-fab.test.js test/unit/spam-blocked-fab.test.js
```

Expected: FAIL because the compact style values and shield SVG path do not exist.

- [ ] **Step 3: Make icon replacement command-specific and compact the row**

Replace the archived-only helper with a generic helper and pass the chosen path from each creator:

```javascript
export function copyNavigationFabIcon(startChatContainer, targetWrap, pathData) {
  const sourceIcon = startChatContainer.querySelector('mws-icon.fab-icon');
  const targetIcon = targetWrap.querySelector('mws-icon.fab-icon');

  if (!targetIcon) {
    return;
  }

  const sourceSvg = findRenderedFabIconSvg(sourceIcon);

  if (sourceSvg) {
    const svgClone = sourceSvg.cloneNode(true);
    const path = svgClone.querySelector('path');

    if (path) {
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'currentColor');
      path.removeAttribute('stroke');
      path.removeAttribute('stroke-width');
    }

    targetIcon.replaceChildren(svgClone);
    return;
  }

  replaceFabIcon(targetIcon, pathData);
}
```

Use `flex: 1 1 0`, `min-width: 0`, compact link padding, `font-size: 12px`, and `max-width: 100%` in the extension-owned FAB row CSS. Keep labels on one line with controlled ellipsis rather than allowing overflow. Define the shield with:

```javascript
export const SPAM_BLOCKED_FAB_ICON_PATH =
  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10M9 9h6M12 6v6';
```

Update imports and replace calls so Archive receives `ARCHIVED_FAB_ICON_PATH` and Spam & blocked receives `SPAM_BLOCKED_FAB_ICON_PATH`.

- [ ] **Step 4: Run focused tests to verify they pass**

Run:

```bash
npx vitest run test/unit/navigation-fab.test.js test/unit/spam-blocked-fab.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit the task**

```bash
git add src/content/navigation-fab.js src/content/spam-blocked-fab.js test/unit/navigation-fab.test.js test/unit/spam-blocked-fab.test.js
git commit -m "fix: compact navigation FABs"
```

### Task 2: Render and maintain shortcut badges

**Files:**

- Create: `src/content/navigation-fab-shortcut-badges.js`
- Modify: `content.js:21-58`
- Create: `test/unit/navigation-fab-shortcut-badges.test.js`
- Modify: `test/unit/content-entry.test.js`

**Interfaces:**

- Consumes `MESSAGE_GET_BROWSER_COMMAND_LABELS`, `UNASSIGNED_SHORTCUT_LABEL`, `COMMAND_START_CHAT`, `COMMAND_OPEN_ARCHIVED`, and `COMMAND_OPEN_SPAM_BLOCKED`.
- Produces `installNavigationFabShortcutBadges(options)` returning an idempotent teardown callback.
- Produces `resetNavigationFabShortcutBadgeInstallationsForTests(documentRoot)`.
- Decorates controls with `[data-messages-shortcuts-navigation-shortcut]` containing shortcut text only when it is assigned.

- [ ] **Step 1: Write failing badge-module tests**

Create `test/unit/navigation-fab-shortcut-badges.test.js` with a FAB row fixture and tests that use a local response function:

```javascript
it('adds badges to all navigation controls with assigned shortcuts', async () => {
  document.body.innerHTML = navigationFabSurface;
  const localThis = vi.fn(async () => ({
    'start-chat': 'Ctrl+Shift+S',
    'open-archived': 'Ctrl+Shift+A',
    'open-spam-blocked': 'Ctrl+Shift+B'
  }));

  const disconnect = installNavigationFabShortcutBadges({
    documentRoot: document,
    getBrowserCommandLabels: localThis
  });

  await vi.waitFor(() => {
    expect(document.querySelectorAll('[data-messages-shortcuts-navigation-shortcut]'))
      .toHaveLength(3);
  });
  expect(localThis).toHaveBeenCalledTimes(1);
  disconnect();
});

it('omits the badge for an unassigned command', async () => {
  document.body.innerHTML = navigationFabSurface;
  const disconnect = installNavigationFabShortcutBadges({
    documentRoot: document,
    getBrowserCommandLabels: vi.fn(async () => ({
      'start-chat': 'Not assigned',
      'open-archived': 'Ctrl+Shift+A',
      'open-spam-blocked': 'Not assigned'
    }))
  });

  await vi.waitFor(() => {
    expect(document.querySelectorAll('[data-messages-shortcuts-navigation-shortcut]'))
      .toHaveLength(1);
  });
  disconnect();
});
```

Also test that badges appear after the Spam & blocked FAB is appended, are not announced by assistive technology (`aria-hidden="true"`), are removed on teardown, and that `content.js` calls the installer and reset function.

- [ ] **Step 2: Run the focused test to verify failure**

Run:

```bash
npx vitest run test/unit/navigation-fab-shortcut-badges.test.js test/unit/content-entry.test.js
```

Expected: FAIL because the module and installer imports do not exist.

- [ ] **Step 3: Implement the navigation badge installer**

Create `src/content/navigation-fab-shortcut-badges.js` that injects scoped CSS, fetches the label map once, and observes DOM changes until the FAB row is removed:

```javascript
function createShortcutBadge(documentRoot, shortcut) {
  const badge = documentRoot.createElement('span');
  badge.setAttribute('data-messages-shortcuts-navigation-shortcut', '');
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = shortcut;
  return badge;
}

function applyShortcutBadge(documentRoot, selector, shortcut) {
  const control = documentRoot.querySelector(selector);

  if (!control || shortcut === UNASSIGNED_SHORTCUT_LABEL) {
    return;
  }

  control.querySelector('[data-messages-shortcuts-navigation-shortcut]')
    ?.remove();
  control.append(createShortcutBadge(documentRoot, shortcut));
}
```

Map Start chat to `a[data-e2e-start-button]`, Archived to
`[data-messages-shortcuts-archived-fab]`, and Spam & blocked to
`[data-messages-shortcuts-spam-blocked-fab]`. The module must create a
positioned control host, a small top-right badge style, catch failed message
requests by using an all-unassigned map, and remove its style and badges during
teardown.

Install the module in `content.js` next to the archived and Spam installers:

```javascript
const disconnectNavigationFabShortcutBadges = installNavigationFabShortcutBadges();
// ...
disconnectNavigationFabShortcutBadges();
resetNavigationFabShortcutBadgeInstallationsForTests();
```

- [ ] **Step 4: Run focused badge and content-entry tests**

Run:

```bash
npx vitest run test/unit/navigation-fab-shortcut-badges.test.js test/unit/content-entry.test.js
```

Expected: PASS.

- [ ] **Step 5: Run lint and the full test suite**

Run:

```bash
npm run lint && npm test
```

Expected: both commands exit 0 with all coverage thresholds met.

- [ ] **Step 6: Commit the task**

```bash
git add content.js src/content/navigation-fab-shortcut-badges.js test/unit/navigation-fab-shortcut-badges.test.js test/unit/content-entry.test.js
git commit -m "feat: show navigation shortcut badges"
```

## Plan Self-Review

- Spec coverage: Task 1 makes the three controls compact and fixes the duplicated Spam & blocked archive icon. Task 2 renders decorative top-right badges on Start chat, Archived, and Spam & blocked only for assigned commands, including the dynamically injected Spam control. Existing activation is explicitly preserved.
- Placeholder scan: no deferred work, unscoped test instruction, or placeholder language remains.
- Type and interface consistency: the new installer and reset function names match the content-entry integration, and its label contract uses the existing browser-command label map.
