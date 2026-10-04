import {
  COMMAND_OPEN_ARCHIVED,
  COMMAND_OPEN_SPAM_BLOCKED,
  COMMAND_START_CHAT,
  isNavigationCommand,
  isValidCommand
} from '../shared/commands.js';
import { isPaused } from '../shared/pause-preference.js';
import { showActionFeedback } from './action-feedback.js';
import { runConversationAction } from './conversation-action.js';
import { handleOpenArchived } from './open-archived-action.js';
import { handleOpenSpamBlocked } from './open-spam-blocked-action.js';
import { handleOpenStartChat } from './open-start-chat-action.js';
import { isNativeDialogOpen } from './keyboard-context-guard.js';

const STEP_LABELS = {
  'no-target': 'find the selected or hovered conversation row',
  'menu-button-not-found': 'find the conversation menu button',
  'unknown-command': 'recognize the shortcut command',
  'capability-blocked': 'run the action because a required DOM capability is unavailable or unsafe'
};

export function warnActionFailure(step, error) {
  const stepLabel = STEP_LABELS[step] || step;

  console.warn(
    `[Messages Shortcut Actions] Failed to ${stepLabel}.`,
    error instanceof Error ? error.message : error
  );
}

function shouldWarnActionFailure(result) {
  return !result.ok
    && result.reason !== 'no-target'
    && result.reason !== 'already-unread'
    && result.reason !== 'already-read'
    && result.reason !== 'extension-paused';
}

export async function handleCommand(
  command,
  documentRoot = document,
  chromeApi = chrome
) {
  if (!isValidCommand(command)) {
    warnActionFailure('unknown-command', command);
    const result = { ok: false, reason: 'unknown-command' };
    showActionFeedback(result, command, documentRoot);

    return result;
  }

  if (await isPaused(chromeApi)) {
    const result = { ok: false, reason: 'extension-paused' };
    showActionFeedback(result, command, documentRoot);

    return result;
  }

  if (isNavigationCommand(command)) {
    if (isNativeDialogOpen(documentRoot)) {
      const result = { ok: false, reason: 'native-dialog-open' };
      showActionFeedback(result, command, documentRoot);

      return result;
    }

    try {
      let result;

      if (command === COMMAND_OPEN_ARCHIVED) {
        result = await handleOpenArchived(documentRoot, chromeApi);
      } else if (command === COMMAND_START_CHAT) {
        result = await handleOpenStartChat(documentRoot, chromeApi);
      } else if (command === COMMAND_OPEN_SPAM_BLOCKED) {
        result = await handleOpenSpamBlocked(documentRoot, chromeApi);
      } else {
        result = { ok: false, reason: 'unknown-command' };
      }

      if (shouldWarnActionFailure(result)) {
        warnActionFailure(result.reason, result.reason);
      }

      showActionFeedback(result, command, documentRoot);

      return result;
    } catch (error) {
      warnActionFailure('execute-action', error);

      const result = {
        ok: false,
        reason: 'execute-action-failed',
        error: error instanceof Error ? error.message : String(error)
      };
      showActionFeedback(result, command, documentRoot);

      return result;
    }
  }

  if (isNativeDialogOpen(documentRoot)) {
    const result = { ok: false, reason: 'native-dialog-open' };
    showActionFeedback(result, command, documentRoot);

    return result;
  }

  try {
    const result = await runConversationAction(documentRoot, command);

    if (shouldWarnActionFailure(result)) {
      warnActionFailure(result.reason, result.reason);
    }

    showActionFeedback(result, command, documentRoot);

    return result;
  } catch (error) {
    warnActionFailure('execute-action', error);

    const result = {
      ok: false,
      reason: 'execute-action-failed',
      error: error instanceof Error ? error.message : String(error)
    };
    showActionFeedback(result, command, documentRoot);

    return result;
  }
}

export function installMessageListener(chromeApi = chrome) {
  const listener = (message, _sender, sendResponse) => {
    if (!message?.command) {
      sendResponse({ ok: false, reason: 'missing-command' });

      return false;
    }

    handleCommand(message.command, document, chromeApi).then((result) => {
      sendResponse(result);
    });

    return true;
  };

  chromeApi.runtime.onMessage.addListener(listener);

  return () => {
    chromeApi.runtime.onMessage.removeListener(listener);
  };
}
