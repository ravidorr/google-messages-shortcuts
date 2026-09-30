import { SELECTORS } from './google-messages-dom.js';

export function findConversationRow(documentRoot, selectors = SELECTORS) {
  const selectedLink = documentRoot.querySelector(selectors.selectedConversationLink);

  if (selectedLink) {
    const selectedRow = selectedLink.closest(selectors.conversationRow);

    if (selectedRow) {
      return selectedRow;
    }
  }

  const focusedRow = documentRoot.querySelector(selectors.focusedConversationItem);

  if (focusedRow) {
    return focusedRow;
  }

  const hoveredRow = documentRoot.querySelector(selectors.hoveredConversationItem);

  if (hoveredRow) {
    return hoveredRow;
  }

  return null;
}

export function findRowMenuButton(conversationRow, selectors = SELECTORS) {
  if (!conversationRow) {
    return null;
  }

  return conversationRow.querySelector(selectors.rowMenuButton);
}
