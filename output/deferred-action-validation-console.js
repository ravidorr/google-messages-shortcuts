// Paste into Google Messages DevTools console (page context), then copy the printed JSON.
// Run only on disposable test conversations. Requires MessagesShortcuts page bridge.
(async () => {
  const MS = globalThis.MessagesShortcuts;

  if (!MS?.__pageBridgeInstalled) {
    console.log(JSON.stringify({ ok: false, error: 'MessagesShortcuts bridge not installed' }, null, 2));
    return;
  }

  const selfTest = await MS.runCapabilitySelfTest();
  const rowSelector = 'mws-conversation-list-item';
  const menuButtonSelector = 'button[aria-haspopup="menu"], mws-menu-button button';
  const menuPanelSelector = '.conversation-actions-menu[role="menu"], [role="menu"].conversation-actions-menu';
  const startChatSelector = 'a[data-e2e-start-button]';
  const startChatMatches = [...document.querySelectorAll(startChatSelector)];

  const rows = [...document.querySelectorAll(rowSelector)];
  const sampleRow = rows[0] ?? null;
  const menuButton = sampleRow?.querySelector(menuButtonSelector) ?? null;

  const observedControls = [
    'button[data-e2e-conversation-menu-block]',
    'button[data-e2e-conversation-menu-mute]',
    'button[data-e2e-conversation-menu-pin]',
    'button[data-e2e-unarchive-button]',
    'button[data-e2e-archived-button], a[data-e2e-archived-button], button[data-e2e-archived-list-button]',
    'button[data-e2e-settings-button], a[data-e2e-settings-button]',
    'input[type="text"], input[type="text"], input[aria-label*="Filter" i], input[placeholder*="Filter" i]',
    'button[aria-haspopup="menu"], button.menu-button, button.mat-mdc-icon-button',
    'button[data-e2e-account-button], button[data-e2e-user-menu-button], button[data-e2e-profile-button]',
    'header img, [role="banner"] img',
    startChatSelector
  ].map((selector) => ({
    selector,
    matchCount: document.querySelectorAll(selector).length
  }));

  const startChatProbe = startChatMatches.slice(0, 3).map((element) => ({
    tagName: element.tagName,
    href: element.getAttribute('href'),
    hidden: element.hidden,
    ariaDisabled: element.getAttribute('aria-disabled'),
    display: getComputedStyle(element).display,
    visibility: getComputedStyle(element).visibility
  }));

  console.log(JSON.stringify({
    ok: selfTest.ok === true,
    extensionVersion: chrome?.runtime?.getManifest?.()?.version ?? 'unknown',
    browser: navigator.userAgent,
    locale: document.documentElement.lang || 'en-US',
    selfTest: {
      ok: selfTest.ok,
      mutated: selfTest.mutated,
      summary: selfTest.summary
    },
    list: {
      rowCount: rows.length,
      hasMenuButton: Boolean(menuButton),
      menuPanelOpen: Boolean(document.querySelector(menuPanelSelector))
    },
    startChat: {
      selector: startChatSelector,
      matchCount: startChatMatches.length,
      pathname: location.pathname,
      newConversationSurfaceCount: document.querySelectorAll(
        'mws-new-conversation, [data-e2e-new-conversation], [data-e2e-new-conversation-view]'
      ).length,
      controls: startChatProbe
    },
    observedControls,
    note: 'Sanitized structural evidence only. Run with the row menu closed for a clean self-test pass. With the menu open on a non-muted row, menu.unmute may block self-test until the row is muted or the menu closes. Open archived discovery order: data-e2e-archived-list-button, bottom-nav data-e2e-archived-button (sidebar route), account menu, list header overflow, app header menu, Settings, then localized Archived labels. Start chat postcondition: pathname includes /web/conversations/new or a validated new-conversation surface selector.'
  }, null, 2));
})();

// Block / report spam dialog probe (run with the native dialog open after choosing the menu item):
// console.log(JSON.stringify({
//   phase: 'block-report-spam-dialog',
//   dialogOpen: Boolean(document.querySelector('mat-dialog-container')),
//   confirmButtonCount: document.querySelectorAll('mat-dialog-container button[data-e2e-action-button-confirm]').length,
//   confirmControls: [...document.querySelectorAll('mat-dialog-container button[data-e2e-action-button-confirm]')].slice(0, 3)
//     .map((el) => ({
//       label: el.textContent?.trim(),
//       e2e: el.getAttribute('data-e2e-action-button-confirm') !== null
//         ? 'data-e2e-action-button-confirm'
//         : null,
//       role: el.getAttribute('role'),
//       checked: el.getAttribute('aria-checked')
//     })),
//   dialogCheckboxes: [...document.querySelectorAll('mat-dialog-container input[type="checkbox"]')].slice(0, 3)
//     .map((el) => ({
//       label: el.getAttribute('aria-label') || el.closest('label')?.textContent?.trim() || null,
//       checked: el.checked
//     }))
// }, null, 2));

// Archived modal probe (run with the "Archived" dialog open):
// console.log(JSON.stringify({
//   phase: 'archived-modal',
//   dialogOpen: Boolean(document.querySelector('mat-dialog-container')),
//   unarchiveButtonCount: document.querySelectorAll('button[data-e2e-unarchive-button]').length,
//   unarchiveControls: [...document.querySelectorAll('button[data-e2e-unarchive-button]')].slice(0, 3)
//     .map((el) => ({ label: el.textContent?.trim(), e2e: 'data-e2e-unarchive-button' }))
// }, null, 2));

// Epic C destination discovery probe.
// Paste this function into the page console, then run:
//   inspectGoogleMessagesDestination('spam')
// After manually opening a native destination, use { waitMs: 1000 } to compare
// immediate and delayed non-mutating snapshots.
//
// It never clicks or focuses an element. The result intentionally excludes text,
// accessible names, URLs, account identifiers, contacts, and message content.
globalThis.inspectGoogleMessagesDestination = async (destination, { waitMs = 0 } = {}) => {
  const destinationTokens = {
    spam: ['spam'],
    blocked: ['blocked']
  };
  const tokens = destinationTokens[destination];

  if (!tokens) {
    throw new Error('Destination must be "spam" or "blocked".');
  }

  const normalize = (value) => value.replace(/\s+/g, ' ').trim().toLowerCase();
  const includesDestination = (element) => {
    const safeAttributes = [
      element.getAttribute('data-e2e'),
      element.getAttribute('aria-label'),
      element.getAttribute('title')
    ].filter(Boolean).join(' ');
    const candidateText = `${safeAttributes} ${element.textContent || ''}`;
    const normalized = normalize(candidateText);

    return tokens.some((token) => normalized.includes(token));
  };
  const isVisible = (element) => {
    if (element.closest('[hidden]') || element.getAttribute('aria-hidden') === 'true') {
      return false;
    }

    const style = getComputedStyle(element);

    return style.display !== 'none' && style.visibility !== 'hidden';
  };
  const toSafeControl = (element) => ({
    tagName: element.tagName,
    role: element.getAttribute('role'),
    dataE2e: element.getAttribute('data-e2e'),
    ariaCurrent: element.getAttribute('aria-current'),
    ariaSelected: element.getAttribute('aria-selected'),
    hidden: !isVisible(element),
    disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true'
  });
  const findDestinationControls = (scope) => [
    ...scope.querySelectorAll('button, a, [role="button"], [role="menuitem"], [role="link"]')
  ].filter((element) => (
    !element.closest('mat-dialog-container') && includesDestination(element)
  ));
  const summarizeScope = (selector) => {
    const scopes = [...document.querySelectorAll(selector)];
    const controls = scopes.flatMap(findDestinationControls);

    return {
      scopeCount: scopes.length,
      destinationControlCount: controls.length,
      controls: controls.slice(0, 5).map(toSafeControl)
    };
  };
  const snapshot = () => {
    const directE2eSelector = `[data-e2e*="${destination}" i]`;
    const directE2eControls = [...document.querySelectorAll(directE2eSelector)]
      .filter((element) => !element.closest('mat-dialog-container'));
    const destinationHeadings = [
      ...document.querySelectorAll('h1, h2, h3, [role="heading"]')
    ].filter(includesDestination);
    const destinationDialogs = [...document.querySelectorAll('mat-dialog-container')]
      .filter((dialog) => includesDestination(dialog));
    const destinationControls = findDestinationControls(document);
    const activeDestinationControls = destinationControls.filter((control) => (
      control.getAttribute('aria-current') === 'page'
      || control.getAttribute('aria-selected') === 'true'
    ));
    const nativeDialogOpen = Boolean(document.querySelector('mat-dialog-container'));
    const editableTargetFocused = document.activeElement?.matches(
      'input, textarea, select, [contenteditable="true"]'
    ) === true;
    const routeMentionsDestination = normalize(location.pathname).includes(destination);

    return {
      locale: document.documentElement.lang || 'unknown',
      direction: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
      pageState: {
        nativeDialogOpen,
        editableTargetFocused,
        narrowLayout: matchMedia('(max-width: 700px)').matches
      },
      selectorCounts: {
        directE2e: directE2eControls.length,
        headings: destinationHeadings.length,
        destinationDialogs: destinationDialogs.length,
        destinationControls: destinationControls.length,
        activeDestinationControls: activeDestinationControls.length
      },
      entryPoints: {
        directE2e: directE2eControls.slice(0, 5).map(toSafeControl),
        sidebarOrBottomNavigation: summarizeScope(
          'mws-bottom-navigation, mws-bottom-nav, [data-e2e-bottom-navigation], nav, aside, mws-navigation-drawer, mws-drawer'
        ),
        accountMenu: summarizeScope('mws-account-menu, [role="menu"], .cdk-overlay-container'),
        listHeaderOverflow: summarizeScope(
          'mws-search, mws-conversations-list-header, mws-conversation-list-header, header, [role="banner"], mws-app-bar, mws-top-app-bar'
        ),
        settings: summarizeScope('mws-settings, [data-e2e-settings-panel], mws-settings-home, [class*="settings"]')
      },
      postcondition: {
        routeMentionsDestination,
        uniqueActiveDestinationControl: activeDestinationControls.length === 1,
        uniqueDestinationHeading: destinationHeadings.length === 1,
        uniqueDestinationDialog: destinationDialogs.length === 1,
        supported: routeMentionsDestination
          || activeDestinationControls.length === 1
          || destinationHeadings.length === 1
          || destinationDialogs.length === 1
      }
    };
  };

  const immediate = snapshot();

  if (!Number.isFinite(waitMs) || waitMs < 0) {
    throw new Error('waitMs must be a non-negative number.');
  }

  if (waitMs === 0) {
    return { destination, readOnly: true, immediate };
  }

  await new Promise((resolve) => setTimeout(resolve, waitMs));

  return {
    destination,
    readOnly: true,
    immediate,
    delayed: snapshot()
  };
};
