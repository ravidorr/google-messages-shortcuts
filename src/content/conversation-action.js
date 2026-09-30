import { COMMAND_ARCHIVE, COMMAND_MARK_UNREAD, COMMAND_TRASH } from '../shared/commands.js';
import { isConversationRead } from './conversation-read-state.js';
import { isTrashConfirmationEnabled } from '../shared/trash-confirmation-preference.js';
import { findConversationRow, findRowMenuButton } from './conversation-target.js';
import { MENU_TEXT, SELECTORS } from './google-messages-dom.js';
import { waitForElement, waitForSelector } from './wait-for-element.js';

async function clickMenuAction(documentRoot, primarySelector, fallbackText) {
  try {
    const primaryItem = await waitForSelector(documentRoot, primarySelector);

    primaryItem.click();

    return { ok: true };
  } catch (_primaryError) {
    try {
      const fallbackItem = await waitForElement(
        documentRoot,
        SELECTORS.menuItemFallback,
        fallbackText
      );

      fallbackItem.click();

      return { ok: true };
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
  } else {
    confirmButton.focus();
  }

  return { ok: true };
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

export async function runConversationAction(
  documentRoot,
  command,
  selectors = SELECTORS,
  targetConversationRow,
  chromeApi = chrome
) {
  const conversationRow = targetConversationRow || findConversationRow(documentRoot, selectors);

  if (!conversationRow) {
    return { ok: false, reason: 'no-target' };
  }

  const menuButton = findRowMenuButton(conversationRow, selectors);

  if (!menuButton) {
    return { ok: false, reason: 'menu-button-not-found' };
  }

  if (command === COMMAND_MARK_UNREAD && !isConversationRead(conversationRow, selectors)) {
    return { ok: false, reason: 'already-unread' };
  }

  menuButton.click();

  if (command === COMMAND_ARCHIVE) {
    const archiveResult = await clickMenuAction(
      documentRoot,
      selectors.archiveMenuItem,
      MENU_TEXT.archive
    );

    return archiveResult;
  }

  if (command === COMMAND_TRASH) {
    const trashResult = await clickMenuAction(
      documentRoot,
      selectors.trashMenuItem,
      MENU_TEXT.trash
    );

    if (!trashResult.ok) {
      return trashResult;
    }

    if (!await isTrashConfirmationEnabled(chromeApi)) {
      return confirmTrash(documentRoot, false);
    }

    return confirmTrash(documentRoot);
  }

  if (command === COMMAND_MARK_UNREAD) {
    return clickMenuAction(
      documentRoot,
      selectors.markUnreadMenuItem,
      MENU_TEXT.markUnread
    );
  }

  return { ok: false, reason: 'unknown-command' };
}
