export const SELECTORS = {
  selectedConversationLink: 'mws-conversation-list-item a[aria-selected="true"]',
  focusedConversationItem: 'mws-conversation-list-item[is-focused="true"]',
  hoveredConversationItem: 'mws-conversation-list-item:hover',
  conversationRow: 'mws-conversation-list-item',
  rowMenuButton: 'button[aria-haspopup="menu"], mws-menu-button button',
  unreadConversationMarker: '[data-e2e-is-unread="true"]',
  archiveMenuItem: 'button[data-e2e-conversation-menu-archive]',
  trashMenuItem: 'button[data-e2e-conversation-delete]',
  markUnreadMenuItem: 'button[data-e2e-conversation-menu-mark-unread]',
  trashConfirmButton: 'mat-dialog-container button[data-e2e-action-button-confirm]',
  menuItemFallback: '.mat-menu-item, .mat-mdc-menu-item'
};

export const MENU_TEXT = {
  archive: 'Archive',
  trash: 'Move to trash',
  markUnread: 'Mark as unread'
};
