// Paste into Google Messages DevTools console (page context), then copy the printed JSON.
// Read-only probe: uses runCapabilitySelfTest and hover visibility checks only.
// Trigger mark-as-read manually with the assigned keyboard shortcut after this probe passes.
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

  const inspectRowHover = async (row) => {
    const urlBeforeHover = location.href;
    dispatchRowPointerOver(row);
    await sleep(600);

    return {
      unreadMarkerPersists: Boolean(row.querySelector(unreadSelector)),
      pillGroupPresent: Boolean(row.querySelector('[data-messages-shortcuts-pill-group]')),
      markReadPillPresent: Boolean(row.querySelector(MARK_READ_PILL_SELECTOR)),
      urlUnchanged: location.href === urlBeforeHover
    };
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
      message: 'Need at least two unread conversations to verify hover pills on multiple rows.',
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

  const hoverCheck = await inspectRowHover(unreadRowsBefore[0]);
  const secondRowHoverCheck = await inspectRowHover(unreadRowsBefore[1]);

  const allPassed = selfTest.ok
    && hoverCheck.unreadMarkerPersists
    && hoverCheck.markReadPillPresent
    && hoverCheck.urlUnchanged
    && secondRowHoverCheck.unreadMarkerPersists
    && secondRowHoverCheck.markReadPillPresent
    && secondRowHoverCheck.urlUnchanged;

  console.log(JSON.stringify({
    ok: allPassed,
    environment: selfTest.environment,
    selfTest: {
      ok: selfTest.ok,
      mutated: selfTest.mutated,
      summary: selfTest.summary,
      listConversationLink
    },
    hoverCheck,
    secondRowHoverCheck,
    unreadRowsAvailableInitially: unreadRowsBefore.length,
    manualFollowUp: 'Use the assigned mark-as-read keyboard shortcut to confirm action behavior.'
  }, null, 2));
})();
