import {
  getFallbackBrowserCommandLabelMap,
  MESSAGE_GET_BROWSER_COMMAND_LABELS
} from '../shared/browser-command-labels.js';
import {
  COMMAND_SOURCE_BROWSER,
  getCommandRegistryEntries
} from './page-command-registry.js';
import { getFocusableElements, restoreFocus, trapTabKey } from './overlay-focus-trap.js';

export const SHORTCUT_HELP_ROOT_SELECTOR = '[data-messages-shortcuts-shortcut-help]';
export const SHORTCUT_HELP_STYLE_SELECTOR = 'style[data-messages-shortcuts-shortcut-help-styles]';

let isOpen = false;
let previousActiveElement = null;
let keydownListener = null;
let openPromise = null;
let openGeneration = 0;

async function fetchBrowserCommandLabels(chromeApi = chrome) {
  try {
    const labels = await chromeApi.runtime.sendMessage({
      type: MESSAGE_GET_BROWSER_COMMAND_LABELS
    });

    if (labels && typeof labels === 'object') {
      return labels;
    }
  } catch {
    // Fall through to fallback labels.
  }

  return getFallbackBrowserCommandLabelMap();
}

function ensureStyles(documentRoot) {
  if (documentRoot.querySelector(SHORTCUT_HELP_STYLE_SELECTOR)) {
    return;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-shortcut-help-styles', '');
  style.textContent = `
    [data-messages-shortcuts-shortcut-help] {
      align-items: flex-start;
      background: rgba(32, 33, 36, 0.45);
      display: flex;
      inset: 0;
      justify-content: center;
      padding-top: 10vh;
      position: fixed;
      z-index: 2147483647;
    }

    [data-messages-shortcuts-shortcut-help-panel] {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
      color: #202124;
      max-height: min(75vh, 720px);
      overflow: auto;
      padding: 20px 24px 24px;
      width: min(720px, calc(100vw - 32px));
    }

    [data-messages-shortcuts-shortcut-help-title] {
      font: 600 20px/28px system-ui, sans-serif;
      margin: 0 0 16px;
    }

    [data-messages-shortcuts-shortcut-help-list] {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    [data-messages-shortcuts-shortcut-help-item] {
      border-top: 1px solid #dadce0;
      display: grid;
      gap: 4px 16px;
      grid-template-columns: minmax(0, 1fr) auto;
      padding: 12px 0;
    }

    [data-messages-shortcuts-shortcut-help-label] {
      font: 500 14px/20px system-ui, sans-serif;
    }

    [data-messages-shortcuts-shortcut-help-binding] {
      color: #5f6368;
      font: 400 13px/20px ui-monospace, SFMono-Regular, Menlo, monospace;
      text-align: right;
      white-space: nowrap;
    }

    [data-messages-shortcuts-shortcut-help-status] {
      color: #5f6368;
      font: 400 12px/16px system-ui, sans-serif;
      grid-column: 1 / -1;
    }
  `;
  documentRoot.head.append(style);
}

function renderHelpList(listElement, entries, browserLabels) {
  listElement.replaceChildren();

  for (const entry of entries) {
    const item = listElement.ownerDocument.createElement('li');
    item.setAttribute('data-messages-shortcuts-shortcut-help-item', '');

    const label = listElement.ownerDocument.createElement('span');
    label.setAttribute('data-messages-shortcuts-shortcut-help-label', '');
    label.textContent = entry.label;

    const binding = listElement.ownerDocument.createElement('span');
    binding.setAttribute('data-messages-shortcuts-shortcut-help-binding', '');

    if (entry.source === COMMAND_SOURCE_BROWSER) {
      binding.textContent = browserLabels[entry.command] || 'Not assigned';
    } else {
      binding.textContent = entry.bindingLabels.join(' / ') || 'Page-local';
    }

    const status = listElement.ownerDocument.createElement('span');
    status.setAttribute('data-messages-shortcuts-shortcut-help-status', '');
    status.textContent = `${entry.availability.status}: ${entry.availability.detail}`;

    item.append(label, binding, status);
    listElement.append(item);
  }
}

function handleHelpKeydown(event, panel) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeShortcutHelpOverlay(panel.ownerDocument);

    return;
  }

  trapTabKey(event, panel);
}

export function isShortcutHelpOpen() {
  return isOpen;
}

export function closeShortcutHelpOverlay(documentRoot = document) {
  openGeneration += 1;

  if (!isOpen) {
    return;
  }

  if (keydownListener) {
    documentRoot.removeEventListener('keydown', keydownListener, true);
    keydownListener = null;
  }

  documentRoot.querySelector(SHORTCUT_HELP_ROOT_SELECTOR)?.remove();
  restoreFocus(previousActiveElement);
  previousActiveElement = null;
  isOpen = false;
}

async function mountShortcutHelpOverlay(documentRoot, chromeApi) {
  const generation = openGeneration;

  ensureStyles(documentRoot);
  previousActiveElement = documentRoot.activeElement;

  const browserLabels = await fetchBrowserCommandLabels(chromeApi);

  if (generation !== openGeneration) {
    return;
  }

  const entries = getCommandRegistryEntries(documentRoot);

  const root = documentRoot.createElement('div');
  root.setAttribute('data-messages-shortcuts-shortcut-help', '');
  root.setAttribute('role', 'presentation');

  const panel = documentRoot.createElement('div');
  panel.setAttribute('data-messages-shortcuts-shortcut-help-panel', '');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Messages Shortcut Actions shortcut reference');
  panel.setAttribute('tabindex', '-1');

  const title = documentRoot.createElement('h2');
  title.setAttribute('data-messages-shortcuts-shortcut-help-title', '');
  title.textContent = 'Shortcut reference';

  const list = documentRoot.createElement('ul');
  list.setAttribute('data-messages-shortcuts-shortcut-help-list', '');
  list.setAttribute('role', 'list');

  renderHelpList(list, entries, browserLabels);
  panel.append(title, list);
  root.append(panel);
  documentRoot.body.append(root);

  keydownListener = (event) => {
    handleHelpKeydown(event, panel);
  };
  documentRoot.addEventListener('keydown', keydownListener, true);

  const focusTarget = getFocusableElements(panel)[0] || panel;
  focusTarget.focus();
  isOpen = true;
}

export async function openShortcutHelpOverlay(documentRoot = document, chromeApi = chrome) {
  if (isOpen) {
    closeShortcutHelpOverlay(documentRoot);
  }

  if (openPromise) {
    return openPromise;
  }

  openPromise = mountShortcutHelpOverlay(documentRoot, chromeApi).finally(() => {
    openPromise = null;
  });

  return openPromise;
}

export function resetShortcutHelpForTests(documentRoot = document) {
  closeShortcutHelpOverlay(documentRoot);
  openPromise = null;
  openGeneration = 0;
}

export function simulateShortcutHelpOpenWithoutListenerForTests() {
  isOpen = true;
  keydownListener = null;
}
