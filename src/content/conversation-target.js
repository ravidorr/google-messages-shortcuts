import { SELECTORS } from './google-messages-dom.js';

export function findConversationRow(documentRoot, selectors = SELECTORS) {
  const hoveredRow = documentRoot.querySelector(selectors.hoveredConversationItem);

  if (hoveredRow) {
    return hoveredRow;
  }

  const focusedRow = documentRoot.querySelector(selectors.focusedConversationItem);

  if (focusedRow) {
    return focusedRow;
  }

  const selectedLink = documentRoot.querySelector(selectors.selectedConversationLink);

  if (selectedLink) {
    const selectedRow = selectedLink.closest(selectors.conversationRow);

    if (selectedRow) {
      return selectedRow;
    }
  }

  return null;
}

export function findRowMenuButton(conversationRow, selectors = SELECTORS) {
  if (!conversationRow) {
    return null;
  }

  return conversationRow.querySelector(selectors.rowMenuButton);
}

export function findConversationLink(conversationRow, selectors = SELECTORS) {
  if (!conversationRow) {
    return null;
  }

  return conversationRow.querySelector(selectors.conversationLink)
    || conversationRow.querySelector('a');
}
