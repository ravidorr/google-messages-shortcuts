import {
  PAGE_COMMAND_ESCAPE_TO_LIST,
  PAGE_COMMAND_FOCUS_COMPOSER,
  PAGE_COMMAND_NEXT_CONVERSATION,
  PAGE_COMMAND_NEXT_UNREAD,
  PAGE_COMMAND_OPEN_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_UNREAD,
  PAGE_COMMAND_RETURN_PREVIOUS
} from '../shared/page-commands.js';

export const NAVIGATION_FEEDBACK_ROOT_SELECTOR = '[data-messages-shortcuts-navigation-feedback]';
export const NAVIGATION_FEEDBACK_MESSAGE_SELECTOR = '[data-messages-shortcuts-navigation-feedback-message]';
export const NAVIGATION_FEEDBACK_STYLE_SELECTOR = 'style[data-messages-shortcuts-navigation-feedback-styles]';

const FEEDBACK_VISIBLE_MS = 5000;

let hideTimeoutId;

function clearHideTimeout() {
  if (hideTimeoutId !== undefined) {
    clearTimeout(hideTimeoutId);
    hideTimeoutId = undefined;
  }
}

function ensureFeedbackStyles(documentRoot) {
  if (documentRoot.querySelector(NAVIGATION_FEEDBACK_STYLE_SELECTOR)) {
    return;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-navigation-feedback-styles', '');
  style.textContent = `
    [data-messages-shortcuts-navigation-feedback] {
      bottom: 56px;
      left: 50%;
      max-width: min(420px, calc(100vw - 32px));
      pointer-events: none;
      position: fixed;
      transform: translateX(-50%);
      z-index: 2147483645;
    }

    [data-messages-shortcuts-navigation-feedback-message] {
      background: #174ea6;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.24);
      color: #ffffff;
      font: 500 13px/18px system-ui, sans-serif;
      margin: 0;
      padding: 10px 14px;
    }

    [data-messages-shortcuts-navigation-feedback-message][data-kind="error"] {
      background: #5f2120;
    }

    [data-messages-shortcuts-navigation-feedback-message][data-kind="success"] {
      background: #202124;
    }
  `;
  documentRoot.head.append(style);
}

function ensureFeedbackRoot(documentRoot) {
  ensureFeedbackStyles(documentRoot);

  let root = documentRoot.querySelector(NAVIGATION_FEEDBACK_ROOT_SELECTOR);

  if (root) {
    return root;
  }

  root = documentRoot.createElement('div');
  root.setAttribute('data-messages-shortcuts-navigation-feedback', '');
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('aria-atomic', 'true');
  root.setAttribute('role', 'status');

  const message = documentRoot.createElement('p');
  message.setAttribute('data-messages-shortcuts-navigation-feedback-message', '');
  message.hidden = true;
  root.append(message);
  documentRoot.body.append(root);

  return root;
}

export function getNavigationFeedbackMessage(result, command) {
  if (result?.ok) {
    switch (command) {
      case PAGE_COMMAND_NEXT_CONVERSATION:
      case PAGE_COMMAND_PREVIOUS_CONVERSATION:
        return { kind: 'success', message: 'Moved to another loaded conversation.' };
      case PAGE_COMMAND_OPEN_CONVERSATION:
        return { kind: 'success', message: 'Opened the conversation under the list cursor.' };
      case PAGE_COMMAND_RETURN_PREVIOUS:
        return { kind: 'success', message: 'Returned to the previous conversation.' };
      case PAGE_COMMAND_NEXT_UNREAD:
      case PAGE_COMMAND_PREVIOUS_UNREAD:
        return {
          kind: 'info',
          message: `Moved to an unread conversation in the loaded list (${result.loadedUnreadCount ?? 0} unread loaded).`
        };
      case PAGE_COMMAND_ESCAPE_TO_LIST:
        return { kind: 'success', message: 'Focused the conversation list.' };
      case PAGE_COMMAND_FOCUS_COMPOSER:
        return { kind: 'success', message: 'Focused the message composer.' };
      default:
        return { kind: 'success', message: 'Navigation command completed.' };
    }
  }

  switch (result?.reason) {
    case 'extension-paused':
      return {
        kind: 'info',
        message: 'Messages Shortcut Actions is paused. Resume it from the extension popup.'
      };
    case 'no-rows':
      return { kind: 'info', message: 'No loaded conversations are available to navigate.' };
    case 'at-first-row':
      return { kind: 'info', message: 'Already at the first loaded conversation.' };
    case 'at-last-row':
      return { kind: 'info', message: 'Already at the last loaded conversation.' };
    case 'no-unread-loaded':
      return {
        kind: 'info',
        message: 'No unread conversations are visible in the loaded list. Unloaded items may exist.'
      };
    case 'unread-boundary':
      return {
        kind: 'info',
        message: `Reached the ${command === PAGE_COMMAND_NEXT_UNREAD ? 'last' : 'first'} unread conversation in the loaded list (${result.loadedUnreadCount ?? 0} unread loaded). Unloaded items may exist.`
      };
    case 'cursor-not-found':
      return { kind: 'info', message: 'Could not find the current list cursor in loaded rows.' };
    case 'cursor-ambiguous':
    case 'return-ambiguous':
      return {
        kind: 'error',
        message: 'Multiple loaded conversations matched the return target. The extension blocked the action for safety.'
      };
    case 'return-not-found':
      return {
        kind: 'info',
        message: 'The previous conversation is not uniquely available in the loaded list.'
      };
    case 'no-return-history':
      return { kind: 'info', message: 'No previous extension-opened conversation is available to return to.' };
    case 'composer-unavailable':
      return {
        kind: 'info',
        message: 'Composer focus is unavailable until live DOM discovery validates a stable target.'
      };
    case 'composer-not-found':
      return { kind: 'error', message: 'Could not find the message composer.' };
    case 'composer-ambiguous':
      return {
        kind: 'error',
        message: 'Multiple composer controls matched. The extension blocked the action for safety.'
      };
    case 'list-not-found':
      return { kind: 'error', message: 'Could not find the conversation list.' };
    case 'missing-link-identity':
      return {
        kind: 'error',
        message: 'Could not identify the conversation link safely. The extension blocked the action.'
      };
    default:
      return {
        kind: 'error',
        message: 'Could not complete the navigation command.'
      };
  }
}

export function showNavigationFeedback(result, command, documentRoot = document) {
  const feedback = getNavigationFeedbackMessage(result, command);
  const root = ensureFeedbackRoot(documentRoot);
  const message = root.querySelector(NAVIGATION_FEEDBACK_MESSAGE_SELECTOR);

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

export function resetNavigationFeedbackForTests(documentRoot = document) {
  clearHideTimeout();
  documentRoot.querySelector(NAVIGATION_FEEDBACK_ROOT_SELECTOR)?.remove();
  documentRoot.querySelector(NAVIGATION_FEEDBACK_STYLE_SELECTOR)?.remove();
}
