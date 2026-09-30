import { SELECTORS } from './google-messages-dom.js';

export function isConversationUnread(conversationRow, selectors = SELECTORS) {
  if (!conversationRow) {
    return false;
  }

  return conversationRow.querySelector(selectors.unreadConversationMarker) !== null;
}

export function isConversationRead(conversationRow, selectors = SELECTORS) {
  return Boolean(conversationRow) && !isConversationUnread(conversationRow, selectors);
}
