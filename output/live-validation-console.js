// Paste into Google Messages DevTools console (page context), then copy the printed JSON.
// Destructive debug validation: requires enableMarkAsReadLiveValidation in chrome.storage.local.
// Use disposable unread test threads only.
(async () => {
  const MS = globalThis.MessagesShortcuts;

  if (!MS?.__pageBridgeInstalled) {
    console.log(JSON.stringify({ ok: false, error: 'MessagesShortcuts bridge not installed' }, null, 2));
    return;
  }

  try {
    const result = await MS.runMarkAsReadLiveValidation();
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, null, 2));
  }
})();
