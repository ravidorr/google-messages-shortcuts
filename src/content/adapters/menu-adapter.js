import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE,
  createCapabilityResult
} from './capability-states.js';

export const MENU_SELECTORS = {
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

export const MENU_CAPABILITY_IDS = {
  archive: 'menu.archive',
  trash: 'menu.trash',
  markUnread: 'menu.markUnread',
  trashConfirm: 'menu.trashConfirm'
};

function assessMenuActionCapability(
  documentRoot,
  primarySelector,
  actionLabel,
  listTargeting
) {
  if (listTargeting.state !== CAPABILITY_SUPPORTED) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      `List targeting is ${listTargeting.state}: ${listTargeting.reason}`,
      listTargeting.evidenceSource
    );
  }

  const matches = documentRoot.querySelectorAll(primarySelector);

  if (matches.length > 1) {
    return createCapabilityResult(
      CAPABILITY_UNSAFE,
      `Multiple elements match the ${actionLabel} menu selector.`,
      'dom-query'
    );
  }

  if (matches.length === 1) {
    return createCapabilityResult(
      CAPABILITY_SUPPORTED,
      `${actionLabel} menu item is present in the document.`,
      'dom-query'
    );
  }

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    `${actionLabel} primary selector is defined; the menu item appears after opening the row menu.`,
    'contract'
  );
}

export function assessMenuCapabilities(documentRoot, listCapabilities, selectors = MENU_SELECTORS) {
  const listTargeting = listCapabilities['list.targeting'];

  return {
    [MENU_CAPABILITY_IDS.archive]: assessMenuActionCapability(
      documentRoot,
      selectors.archiveMenuItem,
      'Archive',
      listTargeting
    ),
    [MENU_CAPABILITY_IDS.trash]: assessMenuActionCapability(
      documentRoot,
      selectors.trashMenuItem,
      'Move to trash',
      listTargeting
    ),
    [MENU_CAPABILITY_IDS.markUnread]: assessMenuActionCapability(
      documentRoot,
      selectors.markUnreadMenuItem,
      'Mark as unread',
      listTargeting
    ),
    [MENU_CAPABILITY_IDS.trashConfirm]: assessTrashConfirmCapability(
      documentRoot,
      selectors.trashConfirmButton,
      listTargeting
    )
  };
}

function assessTrashConfirmCapability(documentRoot, confirmSelector, listTargeting) {
  if (listTargeting.state !== CAPABILITY_SUPPORTED) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      `List targeting is ${listTargeting.state}: ${listTargeting.reason}`,
      listTargeting.evidenceSource
    );
  }

  const matches = documentRoot.querySelectorAll(confirmSelector);

  if (matches.length > 1) {
    return createCapabilityResult(
      CAPABILITY_UNSAFE,
      'Multiple trash confirmation controls match the primary selector.',
      'dom-query'
    );
  }

  if (matches.length === 1) {
    return createCapabilityResult(
      CAPABILITY_SUPPORTED,
      'Trash confirmation control is present in the document.',
      'dom-query'
    );
  }

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    'Trash confirmation selector is defined; the dialog appears after choosing Move to trash.',
    'contract'
  );
}
