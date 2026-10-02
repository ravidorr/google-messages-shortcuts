import { isValidCommand } from '../shared/commands.js';
import { isTrashConfirmationEnabled } from '../shared/trash-confirmation-preference.js';
import {
  assessBlockReportSpamConfirmCapabilityAfterRender,
  assessRowActionCapability,
  assessTrashConfirmCapabilityAfterRender
} from './action-capability-preflight.js';
import {
  findArchivedConversationRow,
  findConversationLink,
  findConversationRow,
  findRowMenuButton
} from './conversation-target.js';
import { findUnarchiveButtonForRow } from './adapters/archived-adapter.js';
import {
  hasConversationNavigationStarted,
  waitForConversationRead
} from './conversation-read-state.js';
import {
  findBlockReportSpamConfirmControl,
  findLabelMatchedMenuItem
} from './adapters/menu-adapter.js';
import { MENU_TEXT, SELECTORS } from './google-messages-dom.js';
import { beginMenuAction, endMenuAction } from './menu-action-overlay.js';
import { waitForTargetRowPostcondition } from './row-postcondition.js';
import {
  EXECUTION_KIND_ARCHIVED_MODAL_CLICK,
  EXECUTION_KIND_BLOCK_REPORT_SPAM_WITH_NATIVE_CONFIRM,
  EXECUTION_KIND_MENU_CLICK,
  EXECUTION_KIND_OPEN_ROW,
  EXECUTION_KIND_TRASH_WITH_CONFIRM,
  getRowAction,
  SELECTOR_STRATEGY_FALLBACK_FIRST,
  SELECTOR_STRATEGY_LABEL_MATCHED,
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

async function clickLabelMatchedMenuItem(
  documentRoot,
  primarySelector,
  expectedLabel,
  selectors,
  wrongStateReason
) {
  const matchedItem = findLabelMatchedMenuItem(
    documentRoot,
    primarySelector,
    expectedLabel,
    selectors
  );

  if (matchedItem) {
    matchedItem.click();

    return { ok: true };
  }

  if (documentRoot.querySelector(primarySelector)) {
    return { ok: false, reason: wrongStateReason };
  }

  try {
    const fallbackItem = await waitForElement(
      documentRoot,
      selectors.menuItemFallback,
      expectedLabel
    );

    fallbackItem.click();

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error.message
    };
  }
}

async function clickMenuAction(
  documentRoot,
  primarySelector,
  fallbackText,
  selectors,
  selectorStrategy = SELECTOR_STRATEGY_PRIMARY_THEN_FALLBACK,
  wrongStateReason = null
) {
  if (selectorStrategy === SELECTOR_STRATEGY_LABEL_MATCHED) {
    return clickLabelMatchedMenuItem(
      documentRoot,
      primarySelector,
      fallbackText,
      selectors,
      wrongStateReason
    );
  }

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

function focusBlockReportSpamConfirmation(confirmButton) {
  confirmButton.focus();

  return { ok: true, pendingBlockReportSpamConfirmation: true };
}

async function prepareBlockReportSpamConfirmation(documentRoot, selectors) {
  let confirmButton = findBlockReportSpamConfirmControl(documentRoot, selectors);

  if (confirmButton) {
    return focusBlockReportSpamConfirmation(confirmButton);
  }

  try {
    await waitForSelector(documentRoot, selectors.blockReportSpamConfirmButton);
  } catch (_primaryError) {
    // Fall through to label-based lookup.
  }

  confirmButton = findBlockReportSpamConfirmControl(documentRoot, selectors);

  if (confirmButton) {
    return focusBlockReportSpamConfirmation(confirmButton);
  }

  try {
    const fallbackButton = await waitForElement(
      documentRoot,
      'mat-dialog-container button, mat-dialog-container .mat-focus-indicator',
      MENU_TEXT.blockReportSpamConfirm
    );

    return focusBlockReportSpamConfirmation(fallbackButton);
  } catch (_fallbackError) {
    try {
      const alternateButton = await waitForElement(
        documentRoot,
        'mat-dialog-container button, mat-dialog-container .mat-focus-indicator',
        MENU_TEXT.blockReportSpamConfirmAlternate
      );

      return focusBlockReportSpamConfirmation(alternateButton);
    } catch (alternateError) {
      return {
        ok: false,
        reason: alternateError.message
      };
    }
  }
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

async function verifyPostClickMenuLabel(
  documentRoot,
  conversationRow,
  action,
  selectors
) {
  if (!action.postClickMenuLabel) {
    return { ok: true };
  }

  const menuButton = findRowMenuButton(conversationRow, selectors);

  if (!menuButton) {
    return { ok: false, reason: 'menu-button-not-found' };
  }

  beginMenuAction(documentRoot);

  try {
    menuButton.click();

    return await waitForTargetRowPostcondition({
      conversationRow,
      isSatisfied: () => Boolean(
        findLabelMatchedMenuItem(
          documentRoot,
          selectors[action.menuItemSelectorKey],
          action.postClickMenuLabel,
          selectors
        )
      ),
      timeoutMs: 2000
    });
  } finally {
    endMenuAction(documentRoot);
  }
}

async function executeMenuClickAction(documentRoot, action, selectors, conversationRow) {
  const clickResult = await clickMenuAction(
    documentRoot,
    selectors[action.menuItemSelectorKey],
    action.fallbackText,
    selectors,
    action.selectorStrategy,
    action.wrongStateReason
  );

  if (!clickResult.ok) {
    return clickResult;
  }

  return verifyPostClickMenuLabel(documentRoot, conversationRow, action, selectors);
}

async function executeOpenRowAction(documentRoot, conversationRow, selectors) {
  const conversationLink = findConversationLink(conversationRow, selectors);

  if (!conversationLink) {
    return { ok: false, reason: 'conversation-link-not-found' };
  }

  conversationLink.click();

  const readResult = await waitForConversationRead(
    documentRoot,
    conversationRow,
    selectors
  );

  if (readResult.ok) {
    return readResult;
  }

  if (hasConversationNavigationStarted(documentRoot, conversationRow, selectors)) {
    return { ok: true, readStatePending: true };
  }

  return readResult;
}

async function executeBlockReportSpamWithNativeConfirmAction(documentRoot, action, selectors) {
  const blockResult = await clickMenuAction(
    documentRoot,
    selectors[action.menuItemSelectorKey],
    action.fallbackText,
    selectors,
    action.selectorStrategy
  );

  if (!blockResult.ok) {
    return blockResult;
  }

  const confirmPreflight = await assessBlockReportSpamConfirmCapabilityAfterRender(
    documentRoot,
    selectors
  );

  if (!confirmPreflight.allowed) {
    return createCapabilityBlockedResult(confirmPreflight);
  }

  return prepareBlockReportSpamConfirmation(documentRoot, selectors);
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

async function executeArchivedModalAction(documentRoot, selectors, conversationRow) {
  const unarchiveButton = findUnarchiveButtonForRow(conversationRow, selectors);

  if (!unarchiveButton) {
    return { ok: false, reason: 'unarchive-button-not-found' };
  }

  unarchiveButton.click();

  return waitForTargetRowPostcondition({
    conversationRow,
    isSatisfied: () => !conversationRow.isConnected
      || !findUnarchiveButtonForRow(conversationRow, selectors),
    timeoutMs: 2000
  });
}

async function executeRowAction(documentRoot, action, selectors, chromeApi, conversationRow) {
  if (action.executionKind === EXECUTION_KIND_OPEN_ROW) {
    return executeOpenRowAction(documentRoot, conversationRow, selectors);
  }

  if (action.executionKind === EXECUTION_KIND_TRASH_WITH_CONFIRM) {
    return executeTrashWithConfirmAction(documentRoot, action, selectors, chromeApi);
  }

  if (action.executionKind === EXECUTION_KIND_BLOCK_REPORT_SPAM_WITH_NATIVE_CONFIRM) {
    return executeBlockReportSpamWithNativeConfirmAction(documentRoot, action, selectors);
  }

  if (action.executionKind === EXECUTION_KIND_ARCHIVED_MODAL_CLICK) {
    return executeArchivedModalAction(documentRoot, selectors, conversationRow);
  }

  if (action.executionKind === EXECUTION_KIND_MENU_CLICK) {
    return executeMenuClickAction(documentRoot, action, selectors, conversationRow);
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
    const conversationRow = targetConversationRow
      || (action.executionKind === EXECUTION_KIND_ARCHIVED_MODAL_CLICK
        ? findArchivedConversationRow(documentRoot, selectors)
        : findConversationRow(documentRoot, selectors));

    if (!conversationRow) {
      return {
        ok: false,
        reason: action.executionKind === EXECUTION_KIND_ARCHIVED_MODAL_CLICK
          ? 'archived-modal-required'
          : 'no-target'
      };
    }

    if (!action.precondition(conversationRow, selectors)) {
      return { ok: false, reason: action.preconditionFailureReason };
    }

    const preflight = assessRowActionCapability(documentRoot, action, selectors);

    if (!preflight.allowed) {
      return createCapabilityBlockedResult(preflight);
    }

    if (
      action.executionKind === EXECUTION_KIND_OPEN_ROW
      || action.executionKind === EXECUTION_KIND_ARCHIVED_MODAL_CLICK
    ) {
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
