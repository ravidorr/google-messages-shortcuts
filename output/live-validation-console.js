// Paste into Google Messages DevTools console (page context), then copy the printed JSON.
(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const MS = globalThis.MessagesShortcuts;

  if (!MS?.__pageBridgeInstalled) {
    console.log(JSON.stringify({ ok: false, error: 'MessagesShortcuts bridge not installed' }, null, 2));
    return;
  }

  const unreadSelector = '[data-e2e-is-unread="true"]';
  const rowSelector = 'mws-conversation-list-item';
  const getUnreadRows = () => [...document.querySelectorAll(rowSelector)]
    .filter((row) => row.querySelector(unreadSelector));

  const selfTest = await MS.runCapabilitySelfTest();
  const listConversationLink = selfTest.capabilities?.find(
    (entry) => entry.capabilityId === 'list.conversationLink'
  );

  const unreadRowsBefore = getUnreadRows();

  if (unreadRowsBefore.length === 0) {
    console.log(JSON.stringify({
      ok: false,
      error: 'no-unread-rows',
      selfTest: {
        ok: selfTest.ok,
        mutated: selfTest.mutated,
        summary: selfTest.summary,
        listConversationLink
      }
    }, null, 2));
    return;
  }

  const hoverRow = unreadRowsBefore[0];
  const urlBeforeHover = location.href;
  hoverRow.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
  hoverRow.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
  await sleep(600);

  const hoverCheck = {
    unreadMarkerPersists: Boolean(hoverRow.querySelector(unreadSelector)),
    pillGroupPresent: Boolean(hoverRow.querySelector('[data-messages-shortcuts-pill-group]')),
    markReadPillPresent: Boolean(
      [...(hoverRow.querySelectorAll('[data-messages-shortcuts-pill]') || [])]
        .some((pill) => pill.textContent?.includes('Mark as read'))
    ),
    urlUnchanged: location.href === urlBeforeHover
  };

  const pillRow = getUnreadRows()[0];
  let pillResult = { attempted: false };

  if (pillRow) {
    pillRow.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await sleep(400);

    const markReadPill = [...(pillRow.querySelectorAll('[data-messages-shortcuts-pill]') || [])]
      .find((pill) => pill.textContent?.includes('Mark as read'));

    if (markReadPill) {
      const urlBeforePill = location.href;
      markReadPill.click();
      await sleep(2500);

      pillResult = {
        attempted: true,
        unreadCleared: !pillRow.querySelector(unreadSelector),
        paneOpened: location.href !== urlBeforePill
          || Boolean(pillRow.querySelector('a[aria-selected="true"]'))
      };
    } else {
      pillResult = { attempted: false, reason: 'mark-read-pill-not-visible' };
    }
  }

  const shortcutRow = getUnreadRows()[0];
  let shortcutResult = { attempted: false };

  if (shortcutRow) {
    shortcutRow.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await sleep(400);

    const urlBeforeShortcut = location.href;
    const commandResult = await MS.handleCommand('mark-read-conversation');
    await sleep(2500);

    shortcutResult = {
      attempted: true,
      commandOk: commandResult?.ok === true,
      unreadCleared: !shortcutRow.querySelector(unreadSelector),
      paneOpened: location.href !== urlBeforeShortcut
        || Boolean(shortcutRow.querySelector('a[aria-selected="true"]')),
      reason: commandResult?.reason ?? null
    };
  }

  const allPassed = selfTest.ok
    && hoverCheck.unreadMarkerPersists
    && hoverCheck.markReadPillPresent
    && (pillResult.attempted ? pillResult.unreadCleared : false)
    && (shortcutResult.attempted ? shortcutResult.unreadCleared && shortcutResult.commandOk : false);

  console.log(JSON.stringify({
    ok: allPassed,
    extensionVersion: chrome?.runtime?.getManifest?.()?.version ?? 'unknown',
    browser: navigator.userAgent,
    locale: document.documentElement.lang || 'en-US',
    selfTest: {
      ok: selfTest.ok,
      mutated: selfTest.mutated,
      summary: selfTest.summary,
      listConversationLink
    },
    hoverCheck,
    pillResult,
    shortcutResult,
    unreadRowsAvailableInitially: unreadRowsBefore.length
  }, null, 2));
})();
