import { isValidCommand } from '../shared/commands.js';
import { isTrashConfirmationEnabled } from '../shared/trash-confirmation-preference.js';
import {
  assessRowActionCapability,
  assessTrashConfirmCapabilityAfterRender
} from './action-capability-preflight.js';
import {
  findConversationLink,
  findConversationRow,
  findRowMenuButton
} from './conversation-target.js';
import { waitForConversationRead } from './conversation-read-state.js';
import { MENU_TEXT, SELECTORS } from './google-messages-dom.js';
import { beginMenuAction, endMenuAction } from './menu-action-overlay.js';
import {
  EXECUTION_KIND_MENU_CLICK,
  EXECUTION_KIND_OPEN_ROW,
  EXECUTION_KIND_TRASH_WITH_CONFIRM,
  getRowAction,
  SELECTOR_STRATEGY_FALLBACK_FIRST,
  SELECTOR_STRATEGY_PRIMARY_THEN_FALLBACK
} from './row-action-registry.js';
import { waitForElement, waitForSelector } from './wait-for-element.js';

let actionInProgress = false;

function createCapabilityBlockedResult(preflightResult) {
  return {
    ok: false,
    reason: preflightResult.reason,
    capabilityId: preflightResult.capabilityId,
    capabilityState: preflightResult.capabilityState
  };
}

function clickPrimaryMenuItemSync(documentRoot, primarySelector) {
  const primaryItem = documentRoot.querySelector(primarySelector);

  if (!primaryItem) {
    return false;
  }

  primaryItem.click();

  return true;
}

async function clickPrimaryMenuItem(documentRoot, primarySelector) {
  const primaryItem = await waitForSelector(documentRoot, primarySelector);

  primaryItem.click();

  return { ok: true };
}

async function clickFallbackMenuItem(documentRoot, selectors, fallbackText) {
  const fallbackItem = await waitForElement(
    documentRoot,
    selectors.menuItemFallback,
    fallbackText
  );

  fallbackItem.click();

  return { ok: true };
}

async function clickMenuAction(
  documentRoot,
  primarySelector,
  fallbackText,
  selectors,
  selectorStrategy = SELECTOR_STRATEGY_PRIMARY_THEN_FALLBACK
) {
  if (selectorStrategy === SELECTOR_STRATEGY_FALLBACK_FIRST) {
    if (clickPrimaryMenuItemSync(documentRoot, primarySelector)) {
      return { ok: true };
    }

    try {
      return await clickFallbackMenuItem(documentRoot, selectors, fallbackText);
    } catch (_fallbackError) {
      try {
        return await clickPrimaryMenuItem(documentRoot, primarySelector);
      } catch (primaryError) {
        return {
          ok: false,
          reason: primaryError.message
        };
      }
    }
  }

  try {
    return await clickPrimaryMenuItem(documentRoot, primarySelector);
  } catch (_primaryError) {
    try {
      return await clickFallbackMenuItem(documentRoot, selectors, fallbackText);
    } catch (fallbackError) {
      return {
        ok: false,
        reason: fallbackError.message
      };
    }
  }
}

function handleTrashConfirmation(confirmButton, shouldConfirm) {
  if (shouldConfirm) {
    confirmButton.click();

    return { ok: true };
  }

  confirmButton.focus();

  return { ok: true, pendingTrashConfirmation: true };
}

async function confirmTrash(documentRoot, shouldConfirm = true) {
  try {
    const confirmButton = await waitForSelector(
      documentRoot,
      SELECTORS.trashConfirmButton
    );

    return handleTrashConfirmation(confirmButton, shouldConfirm);
  } catch (_primaryError) {
    try {
      const fallbackButton = await waitForElement(
        documentRoot,
        'mat-dialog-container button, mat-dialog-container .mat-focus-indicator',
        MENU_TEXT.trash
      );

      return handleTrashConfirmation(fallbackButton, shouldConfirm);
    } catch (fallbackError) {
      return {
        ok: false,
        reason: fallbackError.message
      };
    }
  }
}

async function executeMenuClickAction(documentRoot, action, selectors) {
  return clickMenuAction(
    documentRoot,
    selectors[action.menuItemSelectorKey],
    action.fallbackText,
    selectors,
    action.selectorStrategy
  );
}

async function executeOpenRowAction(conversationRow, selectors) {
  const conversationLink = findConversationLink(conversationRow, selectors);

  if (!conversationLink) {
    return { ok: false, reason: 'conversation-link-not-found' };
  }

  conversationLink.click();

  return waitForConversationRead(conversationRow, selectors);
}

async function executeTrashWithConfirmAction(documentRoot, action, selectors, chromeApi) {
  const trashResult = await clickMenuAction(
    documentRoot,
    selectors[action.menuItemSelectorKey],
    action.fallbackText,
    selectors,
    action.selectorStrategy
  );

  if (!trashResult.ok) {
    return trashResult;
  }

  const confirmPreflight = await assessTrashConfirmCapabilityAfterRender(documentRoot, selectors);

  if (!confirmPreflight.allowed) {
    return createCapabilityBlockedResult(confirmPreflight);
  }

  if (!await isTrashConfirmationEnabled(chromeApi)) {
    return confirmTrash(documentRoot, false);
  }

  return confirmTrash(documentRoot);
}

async function executeRowAction(documentRoot, action, selectors, chromeApi, conversationRow) {
  if (action.executionKind === EXECUTION_KIND_OPEN_ROW) {
    return executeOpenRowAction(conversationRow, selectors);
  }

  if (action.executionKind === EXECUTION_KIND_TRASH_WITH_CONFIRM) {
    return executeTrashWithConfirmAction(documentRoot, action, selectors, chromeApi);
  }

  if (action.executionKind === EXECUTION_KIND_MENU_CLICK) {
    return executeMenuClickAction(documentRoot, action, selectors);
  }

  return { ok: false, reason: 'unknown-command' };
}

export async function runConversationAction(
  documentRoot,
  command,
  selectors = SELECTORS,
  targetConversationRow,
  chromeApi = chrome
) {
  if (!isValidCommand(command)) {
    return { ok: false, reason: 'unknown-command' };
  }

  const action = getRowAction(command);

  if (!action) {
    return { ok: false, reason: 'unknown-command' };
  }

  if (actionInProgress) {
    return { ok: false, reason: 'action-in-progress' };
  }

  actionInProgress = true;

  try {
    const conversationRow = targetConversationRow || findConversationRow(documentRoot, selectors);

    if (!conversationRow) {
      return { ok: false, reason: 'no-target' };
    }

    if (!action.precondition(conversationRow, selectors)) {
      return { ok: false, reason: action.preconditionFailureReason };
    }

    const preflight = assessRowActionCapability(documentRoot, action, selectors);

    if (!preflight.allowed) {
      return createCapabilityBlockedResult(preflight);
    }

    if (action.executionKind === EXECUTION_KIND_OPEN_ROW) {
      return await executeRowAction(
        documentRoot,
        action,
        selectors,
        chromeApi,
        conversationRow
      );
    }

    const menuButton = findRowMenuButton(conversationRow, selectors);

    if (!menuButton) {
      return { ok: false, reason: 'menu-button-not-found' };
    }

    beginMenuAction(documentRoot);

    try {
      menuButton.click();

      return await executeRowAction(
        documentRoot,
        action,
        selectors,
        chromeApi,
        conversationRow
      );
    } finally {
      endMenuAction(documentRoot);
    }
  } finally {
    actionInProgress = false;
  }
}
