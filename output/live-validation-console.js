// Paste into Google Messages DevTools console (page context), then copy the printed JSON.
// Requires at least two unread conversations: the pill test marks the first row read.
(async () => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const MS = globalThis.MessagesShortcuts;
  const MARK_READ_COMMAND = 'mark-read-conversation';
  const MARK_READ_PILL_SELECTOR = `[data-messages-shortcuts-pill][data-command="${MARK_READ_COMMAND}"]`;

  if (!MS?.__pageBridgeInstalled) {
    console.log(JSON.stringify({ ok: false, error: 'MessagesShortcuts bridge not installed' }, null, 2));
    return;
  }

  const unreadSelector = '[data-e2e-is-unread="true"]';
  const rowSelector = 'mws-conversation-list-item';
  const getUnreadRows = () => [...document.querySelectorAll(rowSelector)]
    .filter((row) => row.querySelector(unreadSelector));

  const dispatchRowPointerOver = (row) => {
    row.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
  };

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

  if (unreadRowsBefore.length < 2) {
    console.log(JSON.stringify({
      ok: false,
      error: 'insufficient-unread-rows',
      message: 'Need at least two unread conversations: the pill test marks the first row read.',
      unreadRowsAvailableInitially: unreadRowsBefore.length,
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
  const pillRow = unreadRowsBefore[0];
  const shortcutRow = unreadRowsBefore[1];
  const urlBeforeHover = location.href;
  dispatchRowPointerOver(hoverRow);
  await sleep(600);

  const hoverCheck = {
    unreadMarkerPersists: Boolean(hoverRow.querySelector(unreadSelector)),
    pillGroupPresent: Boolean(hoverRow.querySelector('[data-messages-shortcuts-pill-group]')),
    markReadPillPresent: Boolean(hoverRow.querySelector(MARK_READ_PILL_SELECTOR)),
    urlUnchanged: location.href === urlBeforeHover
  };

  let pillResult = { attempted: false };

  dispatchRowPointerOver(pillRow);
  await sleep(400);

  const markReadPill = pillRow.querySelector(MARK_READ_PILL_SELECTOR);

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

  let shortcutResult = { attempted: false };

  if (shortcutRow?.querySelector(unreadSelector)) {
    const urlBeforeShortcut = location.href;
    const commandResult = await MS.runConversationAction(MARK_READ_COMMAND, undefined, shortcutRow);
    await sleep(2500);

    shortcutResult = {
      attempted: true,
      commandOk: commandResult?.ok === true,
      unreadCleared: !shortcutRow.querySelector(unreadSelector),
      paneOpened: location.href !== urlBeforeShortcut
        || Boolean(shortcutRow.querySelector('a[aria-selected="true"]')),
      reason: commandResult?.reason ?? null
    };
  } else {
    shortcutResult = { attempted: false, reason: 'shortcut-row-no-longer-unread' };
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
