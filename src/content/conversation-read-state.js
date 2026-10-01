import { SELECTORS } from './google-messages-dom.js';
import { POLL_INTERVAL_MS } from './wait-for-element.js';

export function isConversationUnread(conversationRow, selectors = SELECTORS) {
  if (!conversationRow) {
    return false;
  }

  return conversationRow.querySelector(selectors.unreadConversationMarker) !== null;
}

export function isConversationRead(conversationRow, selectors = SELECTORS) {
  return Boolean(conversationRow) && !isConversationUnread(conversationRow, selectors);
}

export function waitForConversationRead(conversationRow, selectors = SELECTORS, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const poll = () => {
      if (isConversationRead(conversationRow, selectors)) {
        resolve({ ok: true });

        return;
      }

      if (Date.now() - startedAt >= timeout) {
        reject(new Error('Timed out waiting for conversation to become read'));

        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
  }).catch((error) => ({
    ok: false,
    reason: error.message
  }));
}
