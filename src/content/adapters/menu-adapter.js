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
  muteMenuItem: 'button[data-e2e-conversation-menu-mute]',
  trashConfirmButton: 'mat-dialog-container button[data-e2e-action-button-confirm]',
  menuItemFallback: '.mat-menu-item, .mat-mdc-menu-item',
  rowMenuPanel: '.conversation-actions-menu[role="menu"], [role="menu"].conversation-actions-menu'
};

export const MENU_TEXT = {
  archive: 'Archive',
  trash: 'Move to trash',
  markUnread: 'Mark as unread',
  mute: 'Mute',
  unmute: 'Unmute'
};

export const MENU_CAPABILITY_IDS = {
  archive: 'menu.archive',
  trash: 'menu.trash',
  markUnread: 'menu.markUnread',
  mute: 'menu.mute',
  unmute: 'menu.unmute',
  trashConfirm: 'menu.trashConfirm'
};

export function isConversationRowMenuOpen(documentRoot, selectors = MENU_SELECTORS) {
  const panelSelector = selectors.rowMenuPanel ?? MENU_SELECTORS.rowMenuPanel;

  return Boolean(documentRoot.querySelector(panelSelector));
}

function isTrashConfirmDialogOpen(documentRoot) {
  return Boolean(documentRoot.querySelector('mat-dialog-container'));
}

function normalizeMenuLabel(value) {
  return value.replace(/\s+/g, ' ').trim();
}

export function findLabelMatchedMenuItem(
  documentRoot,
  primarySelector,
  expectedLabel,
  selectors = MENU_SELECTORS
) {
  const primaryItem = documentRoot.querySelector(primarySelector);

  if (primaryItem && normalizeMenuLabel(primaryItem.textContent || '') === expectedLabel) {
    return primaryItem;
  }

  return findFallbackMenuItemInOpenRowMenu(documentRoot, expectedLabel, selectors);
}

export function findFallbackMenuItemInOpenRowMenu(documentRoot, fallbackText, selectors) {
  const panelSelector = selectors.rowMenuPanel ?? MENU_SELECTORS.rowMenuPanel;
  const menu = documentRoot.querySelector(panelSelector);

  if (!menu) {
    return null;
  }

  const items = menu.querySelectorAll(selectors.menuItemFallback);

  for (const item of items) {
    if (item.textContent.trim() === fallbackText) {
      return item;
    }
  }

  return null;
}

function assessMenuActionCapability(
  documentRoot,
  primarySelector,
  actionLabel,
  fallbackText,
  listTargeting,
  selectors
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
    if (isConversationRowMenuOpen(documentRoot, selectors) && fallbackText) {
      const label = normalizeMenuLabel(matches[0].textContent || '');

      if (label !== fallbackText) {
        if (findFallbackMenuItemInOpenRowMenu(documentRoot, fallbackText, selectors)) {
          return createCapabilityResult(
            CAPABILITY_SUPPORTED,
            `${actionLabel} menu item matched English fallback while the row menu is open.`,
            'dom-query-fallback'
          );
        }

        return createCapabilityResult(
          CAPABILITY_UNAVAILABLE,
          `${actionLabel} row menu is open but shows "${label}" instead of "${fallbackText}".`,
          'dom-query'
        );
      }
    }

    return createCapabilityResult(
      CAPABILITY_SUPPORTED,
      `${actionLabel} menu item is present in the document.`,
      'dom-query'
    );
  }

  if (isConversationRowMenuOpen(documentRoot, selectors)) {
    if (findFallbackMenuItemInOpenRowMenu(documentRoot, fallbackText, selectors)) {
      return createCapabilityResult(
        CAPABILITY_SUPPORTED,
        `${actionLabel} menu item matched English fallback while the row menu is open.`,
        'dom-query-fallback'
      );
    }

    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      `${actionLabel} row menu is open but the control was not found.`,
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
      MENU_TEXT.archive,
      listTargeting,
      selectors
    ),
    [MENU_CAPABILITY_IDS.trash]: assessMenuActionCapability(
      documentRoot,
      selectors.trashMenuItem,
      'Move to trash',
      MENU_TEXT.trash,
      listTargeting,
      selectors
    ),
    [MENU_CAPABILITY_IDS.markUnread]: assessMenuActionCapability(
      documentRoot,
      selectors.markUnreadMenuItem,
      'Mark as unread',
      MENU_TEXT.markUnread,
      listTargeting,
      selectors
    ),
    [MENU_CAPABILITY_IDS.mute]: assessMenuActionCapability(
      documentRoot,
      selectors.muteMenuItem,
      'Mute',
      MENU_TEXT.mute,
      listTargeting,
      selectors
    ),
    [MENU_CAPABILITY_IDS.unmute]: assessMenuActionCapability(
      documentRoot,
      selectors.muteMenuItem,
      'Unmute',
      MENU_TEXT.unmute,
      listTargeting,
      selectors
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

  if (isTrashConfirmDialogOpen(documentRoot)) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'Trash confirmation dialog is open but the confirm control was not found.',
      'dom-query'
    );
  }

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    'Trash confirmation selector is defined; the dialog appears after choosing Move to trash.',
    'contract'
  );
}
