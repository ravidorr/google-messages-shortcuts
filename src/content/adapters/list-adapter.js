import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE,
  createCapabilityResult
} from './capability-states.js';
export const LIST_SELECTORS = {
  selectedConversationLink: 'mws-conversation-list-item a[aria-selected="true"]',
  focusedConversationItem: 'mws-conversation-list-item[is-focused="true"]',
  hoveredConversationItem: 'mws-conversation-list-item:hover',
  conversationRow: 'mws-conversation-list-item',
  conversationLink: 'a[data-e2e-conversation]',
  rowMenuButton: 'button[aria-haspopup="menu"], mws-menu-button button',
  unreadConversationMarker: '[data-e2e-is-unread="true"]'
};

export const LIST_CAPABILITY_IDS = {
  targeting: 'list.targeting',
  unreadDetection: 'list.unreadDetection'
};

function findRowMenuButton(conversationRow, selectors) {
  return conversationRow.querySelector(selectors.rowMenuButton);
}

function countRowsWithoutMenuButton(documentRoot, selectors) {
  const rows = documentRoot.querySelectorAll(selectors.conversationRow);
  let missingMenuButtonCount = 0;

  for (const row of rows) {
    if (!findRowMenuButton(row, selectors)) {
      missingMenuButtonCount += 1;
    }
  }

  return {
    rowCount: rows.length,
    missingMenuButtonCount
  };
}

export function assessListCapabilities(documentRoot, selectors = LIST_SELECTORS) {
  const { rowCount, missingMenuButtonCount } = countRowsWithoutMenuButton(
    documentRoot,
    selectors
  );

  if (rowCount === 0) {
    return {
      [LIST_CAPABILITY_IDS.targeting]: createCapabilityResult(
        CAPABILITY_UNAVAILABLE,
        'No conversation rows found in the document.',
        'dom-query'
      ),
      [LIST_CAPABILITY_IDS.unreadDetection]: createCapabilityResult(
        CAPABILITY_UNAVAILABLE,
        'No conversation rows found to verify unread markers.',
        'dom-query'
      )
    };
  }

  if (missingMenuButtonCount > 0) {
    const reason = `${missingMenuButtonCount} conversation row(s) are missing a menu button.`;

    return {
      [LIST_CAPABILITY_IDS.targeting]: createCapabilityResult(
        CAPABILITY_UNSAFE,
        reason,
        'dom-structure'
      ),
      [LIST_CAPABILITY_IDS.unreadDetection]: createCapabilityResult(
        CAPABILITY_UNSAFE,
        reason,
        'dom-structure'
      )
    };
  }

  return {
    [LIST_CAPABILITY_IDS.targeting]: createCapabilityResult(
      CAPABILITY_SUPPORTED,
      'Conversation rows expose menu buttons for targeting.',
      'dom-structure'
    ),
    [LIST_CAPABILITY_IDS.unreadDetection]: createCapabilityResult(
      CAPABILITY_SUPPORTED,
      'Unread marker selector is defined and conversation rows are present.',
      'contract'
    )
  };
}
