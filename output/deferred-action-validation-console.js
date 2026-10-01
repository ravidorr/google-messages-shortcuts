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
    'button[data-e2e-conversation-menu-unarchive]'
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
    note: 'Sanitized structural evidence only. Exercise pin, mute, and unarchive manually on disposable threads before approving implementation.'
  }, null, 2));
})();
