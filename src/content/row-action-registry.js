import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH
} from '../shared/commands.js';
import {
  isConversationRead,
  isConversationUnread
} from './conversation-read-state.js';
import { LIST_CAPABILITY_IDS } from './adapters/list-adapter.js';
import { MENU_CAPABILITY_IDS, MENU_TEXT } from './adapters/menu-adapter.js';

export const ACTION_DECISION_APPROVE = 'approve';

export const SELECTOR_STRATEGY_PRIMARY_THEN_FALLBACK = 'primary-then-fallback';
export const SELECTOR_STRATEGY_FALLBACK_FIRST = 'fallback-first';

export const EXECUTION_KIND_MENU_CLICK = 'menu-click';
export const EXECUTION_KIND_OPEN_ROW = 'open-row';
export const EXECUTION_KIND_TRASH_WITH_CONFIRM = 'trash-with-confirm';

export const APPROVED_ROW_ACTIONS = [
  {
    command: COMMAND_ARCHIVE,
    capabilityId: MENU_CAPABILITY_IDS.archive,
    decision: ACTION_DECISION_APPROVE,
    menuItemSelectorKey: 'archiveMenuItem',
    fallbackText: MENU_TEXT.archive,
    selectorStrategy: SELECTOR_STRATEGY_PRIMARY_THEN_FALLBACK,
    executionKind: EXECUTION_KIND_MENU_CLICK,
    precondition: () => true,
    preconditionFailureReason: null,
    pillLabel: 'Archive',
    popupLabel: 'Archive conversation',
    shortcutKey: 'archive',
    showPillWhenReadOnly: false,
    showPillWhenUnreadOnly: false
  },
  {
    command: COMMAND_TRASH,
    capabilityId: MENU_CAPABILITY_IDS.trash,
    confirmCapabilityId: MENU_CAPABILITY_IDS.trashConfirm,
    decision: ACTION_DECISION_APPROVE,
    menuItemSelectorKey: 'trashMenuItem',
    fallbackText: MENU_TEXT.trash,
    selectorStrategy: SELECTOR_STRATEGY_PRIMARY_THEN_FALLBACK,
    executionKind: EXECUTION_KIND_TRASH_WITH_CONFIRM,
    precondition: () => true,
    preconditionFailureReason: null,
    pillLabel: 'Trash',
    popupLabel: 'Trash conversation',
    shortcutKey: 'trash',
    showPillWhenReadOnly: false,
    showPillWhenUnreadOnly: false
  },
  {
    command: COMMAND_MARK_READ,
    capabilityId: LIST_CAPABILITY_IDS.conversationLink,
    decision: ACTION_DECISION_APPROVE,
    executionKind: EXECUTION_KIND_OPEN_ROW,
    precondition: (conversationRow, selectors) => isConversationUnread(conversationRow, selectors),
    preconditionFailureReason: 'already-read',
    pillLabel: 'Mark as read',
    popupLabel: 'Mark conversation as read',
    shortcutKey: 'markRead',
    showPillWhenReadOnly: false,
    showPillWhenUnreadOnly: true
  },
  {
    command: COMMAND_MARK_UNREAD,
    capabilityId: MENU_CAPABILITY_IDS.markUnread,
    decision: ACTION_DECISION_APPROVE,
    menuItemSelectorKey: 'markUnreadMenuItem',
    fallbackText: MENU_TEXT.markUnread,
    selectorStrategy: SELECTOR_STRATEGY_FALLBACK_FIRST,
    executionKind: EXECUTION_KIND_MENU_CLICK,
    precondition: (conversationRow, selectors) => isConversationRead(conversationRow, selectors),
    preconditionFailureReason: 'already-unread',
    pillLabel: 'Mark as unread',
    popupLabel: 'Mark conversation as unread',
    shortcutKey: 'markUnread',
    showPillWhenReadOnly: true,
    showPillWhenUnreadOnly: false
  }
];

const rowActionByCommand = new Map(
  APPROVED_ROW_ACTIONS.map((action) => [action.command, action])
);

export function getRowAction(command) {
  return rowActionByCommand.get(command) ?? null;
}

export function isApprovedRowAction(command) {
  return rowActionByCommand.has(command);
}

export function getApprovedCommands() {
  return APPROVED_ROW_ACTIONS.map((action) => action.command);
}

export function getPillDefinitionsForRow(conversationRow, selectors) {
  const isRead = isConversationRead(conversationRow, selectors);
  const isUnread = !isRead;

  return APPROVED_ROW_ACTIONS.filter((action) => {
    if (action.showPillWhenReadOnly) {
      return isRead;
    }

    if (action.showPillWhenUnreadOnly) {
      return isUnread;
    }

    return true;
  }).map(({ command, pillLabel, shortcutKey }) => ({
    command,
    label: pillLabel,
    shortcutKey
  }));
}

export function getPopupLabelsByCommand() {
  return Object.fromEntries(
    APPROVED_ROW_ACTIONS.map((action) => [action.command, action.popupLabel])
  );
}
