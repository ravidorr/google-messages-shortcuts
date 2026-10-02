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

  const rows = [...document.querySelectorAll(rowSelector)];
  const sampleRow = rows[0] ?? null;
  const menuButton = sampleRow?.querySelector(menuButtonSelector) ?? null;

  const observedControls = [
    'button[data-e2e-conversation-menu-mute]',
    'button[data-e2e-conversation-menu-pin]',
    'button[data-e2e-unarchive-button]',
    'button[data-e2e-archived-button], a[data-e2e-archived-button], button[data-e2e-archived-list-button]',
    'button[data-e2e-settings-button], a[data-e2e-settings-button]',
    'input[type="search"], input[type="text"], input[aria-label*="Search" i], input[placeholder*="Search" i]',
    'button[aria-haspopup="menu"], button.menu-button, button.mat-mdc-icon-button',
    'button[data-e2e-account-button], button[data-e2e-user-menu-button], button[data-e2e-profile-button]',
    'header img, [role="banner"] img',
    'a[data-e2e-start-button]'
  ].map((selector) => ({
    selector,
    matchCount: document.querySelectorAll(selector).length
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
    observedControls,
    note: 'Sanitized structural evidence only. Open archived discovery order: data-e2e-archived-list-button, bottom-nav data-e2e-archived-button (sidebar route), account menu, search overflow, app header menu, Settings, then localized Archived labels.'
  }, null, 2));
})();

// Archived modal probe (run with the "Archived" dialog open):
// console.log(JSON.stringify({
//   phase: 'archived-modal',
//   dialogOpen: Boolean(document.querySelector('mat-dialog-container')),
//   unarchiveButtonCount: document.querySelectorAll('button[data-e2e-unarchive-button]').length,
//   unarchiveControls: [...document.querySelectorAll('button[data-e2e-unarchive-button]')].slice(0, 3)
//     .map((el) => ({ label: el.textContent?.trim(), e2e: 'data-e2e-unarchive-button' }))
// }, null, 2));
