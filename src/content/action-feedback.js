import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH
} from '../shared/commands.js';
import { getRowAction } from './row-action-registry.js';

export const FEEDBACK_ROOT_SELECTOR = '[data-messages-shortcuts-feedback]';
export const FEEDBACK_MESSAGE_SELECTOR = '[data-messages-shortcuts-feedback-message]';
export const FEEDBACK_STYLE_SELECTOR = 'style[data-messages-shortcuts-feedback-styles]';

const FEEDBACK_VISIBLE_MS = 5000;

const SUCCESS_MESSAGES = {
  [COMMAND_ARCHIVE]: 'Conversation archived.',
  [COMMAND_TRASH]: 'Conversation moved to trash.',
  [COMMAND_MARK_READ]: 'Conversation marked as read.',
  [COMMAND_MARK_UNREAD]: 'Conversation marked as unread.'
};

let hideTimeoutId;

function clearHideTimeout() {
  if (hideTimeoutId !== undefined) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = undefined;
  }
}

function ensureFeedbackStyles(documentRoot) {
  if (documentRoot.querySelector(FEEDBACK_STYLE_SELECTOR)) {
    return;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-feedback-styles', '');
  style.textContent = `
    [data-messages-shortcuts-feedback] {
      bottom: 16px;
      left: 50%;
      max-width: min(420px, calc(100vw - 32px));
      pointer-events: none;
      position: fixed;
      transform: translateX(-50%);
      z-index: 2147483646;
    }

    [data-messages-shortcuts-feedback-message] {
      background: #202124;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      color: #ffffff;
      font: 500 13px/18px system-ui, sans-serif;
      margin: 0;
      padding: 10px 14px;
    }

    [data-messages-shortcuts-feedback-message][data-kind="error"] {
      background: #5f2120;
    }

    [data-messages-shortcuts-feedback-message][data-kind="info"] {
      background: #174ea6;
    }
  `;
  documentRoot.head.append(style);
}

function ensureFeedbackRoot(documentRoot) {
  ensureFeedbackStyles(documentRoot);

  let root = documentRoot.querySelector(FEEDBACK_ROOT_SELECTOR);

  if (root) {
    return root;
  }

  root = documentRoot.createElement('div');
  root.setAttribute('data-messages-shortcuts-feedback', '');
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-atomic', 'true');
  root.setAttribute('role', 'status');

  const message = documentRoot.createElement('p');
  message.setAttribute('data-messages-shortcuts-feedback-message', '');
  message.hidden = true;
  root.append(message);
  documentRoot.body.append(root);

  return root;
}

export function getActionFeedbackMessage(result, command) {
  if (result?.ok) {
    const action = getRowAction(command);

    return {
      kind: 'success',
      message: SUCCESS_MESSAGES[command]
        || (action ? `${action.pillLabel} completed.` : 'Action completed.')
    };
  }

  switch (result?.reason) {
    case 'extension-paused':
      return {
        kind: 'info',
        message: 'Messages Shortcut Actions is paused. Resume it from the extension popup.'
      };
    case 'no-target':
      return {
        kind: 'info',
        message: 'Select or hover a conversation first.'
      };
    case 'already-read':
      return {
        kind: 'info',
        message: 'This conversation is already read.'
      };
    case 'already-unread':
      return {
        kind: 'info',
        message: 'This conversation is already unread.'
      };
    case 'action-in-progress':
      return {
        kind: 'info',
        message: 'Another shortcut action is still running. Try again in a moment.'
      };
    case 'capability-blocked':
      return {
        kind: 'error',
        message: 'Could not complete the action. Google Messages may have updated. Try again or run the capability self-test.'
      };
    case 'menu-button-not-found':
      return {
        kind: 'error',
        message: 'Could not open the conversation menu. Select a conversation row and try again.'
      };
    case 'conversation-link-not-found':
      return {
        kind: 'error',
        message: 'Could not open the conversation link. Select a conversation row and try again.'
      };
    case 'unknown-command':
      return {
        kind: 'error',
        message: 'That shortcut is not recognized by this extension.'
      };
    case 'execute-action-failed':
      return {
        kind: 'error',
        message: 'The action failed unexpectedly. Try again or pause and reload the page.'
      };
    default:
      if (typeof result?.reason === 'string' && result.reason.length > 0) {
        return {
          kind: 'error',
          message: 'Could not complete the action. Try again or check the extension popup.'
        };
      }

      return null;
  }
}

export function showActionFeedback(result, command, documentRoot = document) {
  const feedback = getActionFeedbackMessage(result, command);

  if (!feedback) {
    return;
  }

  const root = ensureFeedbackRoot(documentRoot);
  const message = root.querySelector(FEEDBACK_MESSAGE_SELECTOR);

  if (!message) {
    return;
  }

  clearHideTimeout();
  message.hidden = false;
  message.setAttribute('data-kind', feedback.kind);
  message.textContent = feedback.message;

  hideTimeoutId = setTimeout(() => {
    message.hidden = true;
    message.textContent = '';
    message.removeAttribute('data-kind');
    hideTimeoutId = undefined;
  }, FEEDBACK_VISIBLE_MS);
}

export function resetActionFeedbackForTests(documentRoot = document) {
  clearHideTimeout();
  documentRoot.querySelector(FEEDBACK_ROOT_SELECTOR)?.remove();
  documentRoot.querySelector(FEEDBACK_STYLE_SELECTOR)?.remove();
}
