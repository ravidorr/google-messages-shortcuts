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
  blockReportSpamMenuItem: 'button[data-e2e-conversation-menu-block]',
  trashConfirmButton: 'mat-dialog-container button[data-e2e-action-button-confirm]',
  blockReportSpamConfirmButton: 'mat-dialog-container button[data-e2e-action-button-confirm]',
  menuItemFallback: '.mat-menu-item, .mat-mdc-menu-item',
  rowMenuPanel: '.conversation-actions-menu[role="menu"], [role="menu"].conversation-actions-menu'
};

export const MENU_TEXT = {
  archive: 'Archive',
  trash: 'Move to trash',
  markUnread: 'Mark as unread',
  mute: 'Mute',
  unmute: 'Unmute',
  blockReportSpam: 'Block & report spam',
  blockReportSpamReportOnly: 'Report spam',
  blockReportSpamConfirm: 'Block',
  blockReportSpamConfirmAlternate: 'Block & report spam',
  blockReportSpamConfirmOk: 'OK'
};

export const MENU_CAPABILITY_IDS = {
  archive: 'menu.archive',
  trash: 'menu.trash',
  markUnread: 'menu.markUnread',
  mute: 'menu.mute',
  unmute: 'menu.unmute',
  trashConfirm: 'menu.trashConfirm',
  blockReportSpam: 'menu.blockReportSpam',
  blockReportSpamConfirm: 'menu.blockReportSpamConfirm'
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

export function isBlockReportSpamMenuLabel(label) {
  const normalizedLabel = normalizeMenuLabel(label);

  return normalizedLabel === MENU_TEXT.blockReportSpam
    || normalizedLabel === MENU_TEXT.blockReportSpamReportOnly;
}

export function isBlockReportSpamConfirmLabel(label) {
  const normalizedLabel = normalizeMenuLabel(label);

  return normalizedLabel === MENU_TEXT.blockReportSpamConfirm
    || normalizedLabel === MENU_TEXT.blockReportSpamConfirmAlternate
    || normalizedLabel === MENU_TEXT.blockReportSpamConfirmOk;
}

function isAcceptedMenuLabel(label, acceptedLabels) {
  const normalizedLabel = normalizeMenuLabel(label);

  return acceptedLabels.some(
    (acceptedLabel) => normalizeMenuLabel(acceptedLabel) === normalizedLabel
  );
}

function isTrashConfirmLabel(label) {
  return normalizeMenuLabel(label) === MENU_TEXT.trash;
}

function isTrashConfirmControl(element) {
  return isTrashConfirmLabel(element.textContent || '');
}

function isBlockReportSpamConfirmControl(element) {
  return isBlockReportSpamConfirmLabel(element.textContent || '');
}

function hasTrashConfirmInOpenDialog(documentRoot, selectors = MENU_SELECTORS) {
  return Boolean(findTrashConfirmControl(documentRoot, selectors));
}

export function findTrashConfirmControl(documentRoot, selectors = MENU_SELECTORS) {
  const primaryMatches = [...documentRoot.querySelectorAll(selectors.trashConfirmButton)]
    .filter(isTrashConfirmControl);

  if (primaryMatches.length > 1) {
    return null;
  }

  if (primaryMatches.length === 1) {
    return primaryMatches[0];
  }

  const dialog = documentRoot.querySelector('mat-dialog-container');

  if (!dialog) {
    return null;
  }

  return [...dialog.querySelectorAll('button, .mat-focus-indicator')].find(
    isTrashConfirmControl
  ) ?? null;
}

export function findBlockReportSpamConfirmFallbackControl(documentRoot) {
  const dialog = documentRoot.querySelector('mat-dialog-container');

  if (!dialog) {
    return null;
  }

  return [...dialog.querySelectorAll('button, .mat-focus-indicator')].find(
    isBlockReportSpamConfirmControl
  ) ?? null;
}

export function findBlockReportSpamConfirmControl(
  documentRoot,
  selectors = MENU_SELECTORS
) {
  const primaryMatch = [...documentRoot.querySelectorAll(selectors.blockReportSpamConfirmButton)].find(
    isBlockReportSpamConfirmControl
  );

  return primaryMatch ?? findBlockReportSpamConfirmFallbackControl(documentRoot);
}

export function hasBlockReportSpamConfirmControl(
  documentRoot,
  selectors = MENU_SELECTORS
) {
  return Boolean(findBlockReportSpamConfirmControl(documentRoot, selectors));
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
  selectors,
  alternateMenuLabels = []
) {
  const acceptedMenuLabels = [fallbackText, ...alternateMenuLabels];
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

      if (!isAcceptedMenuLabel(label, acceptedMenuLabels)) {
        const matchedFallbackLabel = acceptedMenuLabels.find(
          (acceptedLabel) => findFallbackMenuItemInOpenRowMenu(documentRoot, acceptedLabel, selectors)
        );

        if (matchedFallbackLabel) {
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
    [MENU_CAPABILITY_IDS.blockReportSpam]: assessMenuActionCapability(
      documentRoot,
      selectors.blockReportSpamMenuItem,
      'Block & report spam',
      MENU_TEXT.blockReportSpam,
      listTargeting,
      selectors,
      [MENU_TEXT.blockReportSpamReportOnly]
    ),
    [MENU_CAPABILITY_IDS.trashConfirm]: assessTrashConfirmCapability(
      documentRoot,
      selectors.trashConfirmButton,
      listTargeting
    ),
    [MENU_CAPABILITY_IDS.blockReportSpamConfirm]: assessBlockReportSpamConfirmCapability(
      documentRoot,
      selectors.blockReportSpamConfirmButton,
      listTargeting,
      selectors
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
    if (isTrashConfirmControl(matches[0])) {
      return createCapabilityResult(
        CAPABILITY_SUPPORTED,
        'Trash confirmation control is present in the document.',
        'dom-query'
      );
    }

    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'Trash confirmation dialog is open but the confirm control was not found.',
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

function assessBlockReportSpamConfirmCapability(
  documentRoot,
  confirmSelector,
  listTargeting,
  selectors = MENU_SELECTORS
) {
  if (listTargeting.state !== CAPABILITY_SUPPORTED) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      `List targeting is ${listTargeting.state}: ${listTargeting.reason}`,
      listTargeting.evidenceSource
    );
  }

  const matchingConfirmControls = [...documentRoot.querySelectorAll(confirmSelector)]
    .filter(isBlockReportSpamConfirmControl);

  if (matchingConfirmControls.length > 1) {
    return createCapabilityResult(
      CAPABILITY_UNSAFE,
      'Multiple block confirmation controls match the primary selector.',
      'dom-query'
    );
  }

  if (matchingConfirmControls.length === 1) {
    return createCapabilityResult(
      CAPABILITY_SUPPORTED,
      'Block confirmation control is present in the document.',
      'dom-query'
    );
  }

  if (isTrashConfirmDialogOpen(documentRoot)) {
    if (findBlockReportSpamConfirmFallbackControl(documentRoot)) {
      return createCapabilityResult(
        CAPABILITY_SUPPORTED,
        'Block confirmation control matched English fallback while the dialog is open.',
        'dom-query-fallback'
      );
    }

    if (hasTrashConfirmInOpenDialog(documentRoot, selectors)) {
      return createCapabilityResult(
        CAPABILITY_SUPPORTED,
        'Block confirmation selector is defined; a different confirmation dialog is open.',
        'contract'
      );
    }

    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'Block confirmation dialog is open but the confirm control was not found.',
      'dom-query'
    );
  }

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    'Block confirmation selector is defined; the dialog appears after choosing Block & report spam.',
    'contract'
  );
}
