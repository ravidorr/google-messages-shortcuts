// Paste into Google Messages DevTools console (page context), then copy the printed JSON.
// Run only in an open conversation with a visible composer. Requires MessagesShortcuts bridge.
(async () => {
  const MS = globalThis.MessagesShortcuts;

  if (!MS?.__pageBridgeInstalled) {
    console.log(JSON.stringify({ ok: false, error: 'MessagesShortcuts bridge not installed' }, null, 2));
    return;
  }

  const candidateSelectors = [
    'textarea[data-e2e-message-input]',
    'div[contenteditable="true"][data-e2e-message-input]',
    'textarea[aria-label*="Message" i]',
    'div[contenteditable="true"][aria-label*="Message" i]',
    'mws-message-input textarea',
    'mws-message-input [contenteditable="true"]'
  ];

  const sendCandidateSelectors = [
    'button[data-e2e-send-button]',
    'button[aria-label*="Send" i]',
    'mws-message-input button[type="submit"]'
  ];

  const summarizeMatches = (selector) => {
    const matches = [...document.querySelectorAll(selector)];

    return {
      selector,
      matchCount: matches.length,
      controls: matches.slice(0, 3).map((element) => ({
        tagName: element.tagName,
        contentEditable: element.getAttribute('contenteditable'),
        ariaLabel: element.getAttribute('aria-label'),
        disabled: element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true',
        hidden: element.closest('[hidden]') !== null
      }))
    };
  };

  const selfTest = await MS.runCapabilitySelfTest();

  console.log(JSON.stringify({
    ok: selfTest.ok === true,
    extensionVersion: chrome?.runtime?.getManifest?.()?.version ?? 'unknown',
    browser: navigator.userAgent,
    locale: document.documentElement.lang || 'en-US',
    phase: 'composer-discovery-spike',
    selfTest: {
      ok: selfTest.ok,
      mutated: selfTest.mutated,
      summary: selfTest.summary
    },
    editorCandidates: candidateSelectors.map(summarizeMatches),
    sendCandidates: sendCandidateSelectors.map(summarizeMatches),
    note: 'Sanitized structural evidence only. Approve composer focus when priority-ordered editor resolution finds uniquely matched controls (fail closed only when one selector matches 2+), focusing preserves any existing draft, and no send action occurs. Production resolution order follows composer-dom.js.'
  }, null, 2));
})();
