import { assessConnectionCapabilities } from './connection-adapter.js';
import { assessComposerCapabilities } from './composer-adapter.js';
import { assessListCapabilities, LIST_SELECTORS } from './list-adapter.js';
import { assessMenuCapabilities, MENU_SELECTORS } from './menu-adapter.js';
import { assessMessagePaneCapabilities } from './message-pane-adapter.js';

export const PAGE_ADAPTER_AREAS = [
  'list',
  'menu',
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
    ...overrides
  };
}

export function assessPageCapabilities(documentRoot, selectors = getPageSelectors()) {
  const listSelectors = {
    selectedConversationLink: selectors.selectedConversationLink,
    focusedConversationItem: selectors.focusedConversationItem,
    hoveredConversationItem: selectors.hoveredConversationItem,
    conversationRow: selectors.conversationRow,
    rowMenuButton: selectors.rowMenuButton,
    unreadConversationMarker: selectors.unreadConversationMarker
  };
  const menuSelectors = {
    archiveMenuItem: selectors.archiveMenuItem,
    trashMenuItem: selectors.trashMenuItem,
    markUnreadMenuItem: selectors.markUnreadMenuItem,
    trashConfirmButton: selectors.trashConfirmButton,
    menuItemFallback: selectors.menuItemFallback
  };
  const list = assessListCapabilities(documentRoot, listSelectors);
  const menu = assessMenuCapabilities(documentRoot, list, menuSelectors);

  return {
    list,
    menu,
    composer: assessComposerCapabilities(),
    messagePane: assessMessagePaneCapabilities(),
    connection: assessConnectionCapabilities()
  };
}
