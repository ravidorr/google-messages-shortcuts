import { SELECTORS } from './google-messages-dom.js';
import { POLL_INTERVAL_MS } from './wait-for-element.js';

export const READ_STATE_TIMEOUT_MS = 8000;
export const READ_STATE_TIMEOUT_REASON = 'Timed out waiting for conversation to become read';

export function isConversationUnread(conversationRow, selectors = SELECTORS) {
  if (!conversationRow) {
    return false;
  }

  return conversationRow.querySelector(selectors.unreadConversationMarker) !== null;
}

export function isConversationRead(conversationRow, selectors = SELECTORS) {
  return Boolean(conversationRow) && !isConversationUnread(conversationRow, selectors);
}

export function getConversationHref(conversationRow, selectors = SELECTORS) {
  return conversationRow
    ?.querySelector(selectors.conversationLink)
    ?.getAttribute('href');
}

function findConversationLinkByHref(documentRoot, conversationHref, selectors) {
  if (!conversationHref) {
    return null;
  }

  return [...documentRoot.querySelectorAll(selectors.conversationLink)]
    .find((conversationLink) => conversationLink.getAttribute('href') === conversationHref)
    ?? null;
}

export function findCurrentConversationRow(documentRoot, conversationRow, selectors = SELECTORS) {
  const conversationHref = getConversationHref(conversationRow, selectors);
  const currentConversationLink = findConversationLinkByHref(
    documentRoot,
    conversationHref,
    selectors
  );

  if (currentConversationLink) {
    return currentConversationLink.closest(selectors.conversationRow) || null;
  }

  return conversationRow?.isConnected ? conversationRow : null;
}

export function hasConversationNavigationStarted(
  documentRoot,
  conversationRow,
  selectors = SELECTORS
) {
  const conversationHref = getConversationHref(conversationRow, selectors);
  const currentConversationLink = conversationHref
    ? findConversationLinkByHref(documentRoot, conversationHref, selectors)
    : conversationRow?.querySelector(selectors.conversationLink);

  return currentConversationLink?.getAttribute('aria-selected') === 'true';
}

export function waitForConversationRead(
  documentRoot,
  conversationRow,
  selectors = SELECTORS,
  timeout = READ_STATE_TIMEOUT_MS
) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const poll = () => {
      const currentConversationRow = findCurrentConversationRow(
        documentRoot,
        conversationRow,
        selectors
      );

      if (
        currentConversationRow
        && isConversationRead(currentConversationRow, selectors)
      ) {
        resolve({ ok: true });

        return;
      }

      if (Date.now() - startedAt >= timeout) {
        reject(new Error(READ_STATE_TIMEOUT_REASON));

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
