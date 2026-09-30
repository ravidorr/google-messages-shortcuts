import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../shared/commands.js';
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

async function confirmTrash(documentRoot) {
  try {
    const confirmButton = await waitForSelector(
      documentRoot,
      SELECTORS.trashConfirmButton
    );

    confirmButton.click();

    return { ok: true };
  } catch (_primaryError) {
    try {
      const fallbackButton = await waitForElement(
        documentRoot,
        'button, .mat-focus-indicator',
        MENU_TEXT.trash
      );

      fallbackButton.click();

      return { ok: true };
    } catch (fallbackError) {
      return {
        ok: false,
        reason: fallbackError.message
      };
    }
  }
}

export async function runConversationAction(documentRoot, command, selectors = SELECTORS) {
  const conversationRow = findConversationRow(documentRoot, selectors);

  if (!conversationRow) {
    return { ok: false, reason: 'no-target' };
  }

  const menuButton = findRowMenuButton(conversationRow, selectors);

  if (!menuButton) {
    return { ok: false, reason: 'menu-button-not-found' };
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

    return confirmTrash(documentRoot);
  }

  return { ok: false, reason: 'unknown-command' };
}
