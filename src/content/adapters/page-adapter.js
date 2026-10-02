import { assessArchivedCapabilities, ARCHIVED_SELECTORS } from './archived-adapter.js';
import { assessStartChatCapabilities } from './start-chat-adapter.js';
import { assessConnectionCapabilities } from './connection-adapter.js';
import { assessComposerCapabilities } from './composer-adapter.js';
import { assessListCapabilities, LIST_SELECTORS } from './list-adapter.js';
import { assessMenuCapabilities, MENU_SELECTORS } from './menu-adapter.js';
import { assessMessagePaneCapabilities } from './message-pane-adapter.js';
import { assessSpamBlockedCapabilities } from './spam-blocked-adapter.js';

export const PAGE_ADAPTER_AREAS = [
  'list',
  'menu',
  'archived',
  'spamBlocked',
  'startChat',
  'composer',
  'messagePane',
  'connection'
];

export function createPageAdapter(documentRoot, selectors = getPageSelectors()) {
  return {
    documentRoot,
    selectors,
    assessCapabilities() {
      return assessPageCapabilities(documentRoot, selectors);
    }
  };
}

export function getPageSelectors(overrides = {}) {
  return {
    ...LIST_SELECTORS,
    ...MENU_SELECTORS,
    ...ARCHIVED_SELECTORS,
    ...overrides
  };
}

export function assessPageCapabilities(documentRoot, selectors = getPageSelectors()) {
  const listSelectors = {
    selectedConversationLink: selectors.selectedConversationLink,
    focusedConversationItem: selectors.focusedConversationItem,
    hoveredConversationItem: selectors.hoveredConversationItem,
    conversationRow: selectors.conversationRow,
    conversationLink: selectors.conversationLink,
    rowMenuButton: selectors.rowMenuButton,
    unreadConversationMarker: selectors.unreadConversationMarker
  };
  const menuSelectors = {
    archiveMenuItem: selectors.archiveMenuItem,
    trashMenuItem: selectors.trashMenuItem,
    markUnreadMenuItem: selectors.markUnreadMenuItem,
    trashConfirmButton: selectors.trashConfirmButton,
    blockReportSpamMenuItem: selectors.blockReportSpamMenuItem,
    blockReportSpamConfirmButton: selectors.blockReportSpamConfirmButton,
    menuItemFallback: selectors.menuItemFallback,
    rowMenuPanel: selectors.rowMenuPanel
  };
  const list = assessListCapabilities(documentRoot, listSelectors);
  const menu = assessMenuCapabilities(documentRoot, list, menuSelectors);

  return {
    list,
    menu,
    archived: assessArchivedCapabilities(documentRoot, selectors),
    spamBlocked: assessSpamBlockedCapabilities(documentRoot, selectors),
    startChat: assessStartChatCapabilities(documentRoot, selectors),
    composer: assessComposerCapabilities(),
    messagePane: assessMessagePaneCapabilities(),
    connection: assessConnectionCapabilities()
  };
}
