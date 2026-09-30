import { runConversationAction } from './conversation-action.js';
import { isValidCommand } from '../shared/commands.js';

const STEP_LABELS = {
  'no-target': 'find the selected or hovered conversation row',
  'menu-button-not-found': 'find the conversation menu button',
  'unknown-command': 'recognize the shortcut command'
};

export function warnActionFailure(step, error) {
  const stepLabel = STEP_LABELS[step] || step;

  console.warn(
    `[Messages Shortcut Actions] Failed to ${stepLabel}.`,
    error instanceof Error ? error.message : error
  );
}

export async function handleCommand(command, documentRoot = document) {
  if (!isValidCommand(command)) {
    warnActionFailure('unknown-command', command);

    return { ok: false, reason: 'unknown-command' };
  }

  try {
    const result = await runConversationAction(documentRoot, command);

    if (!result.ok && result.reason !== 'no-target' && result.reason !== 'already-unread') {
      warnActionFailure(result.reason, result.reason);
    }

    return result;
  } catch (error) {
    warnActionFailure('execute-action', error);

    return {
      ok: false,
      reason: 'execute-action-failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function installMessageListener(chromeApi = chrome) {
  chromeApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message?.command) {
      sendResponse({ ok: false, reason: 'missing-command' });

      return false;
    }

    handleCommand(message.command).then((result) => {
      sendResponse(result);
    });

    return true;
  });
}
