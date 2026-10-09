import {
  getFallbackBrowserCommandLabelMap,
  MESSAGE_GET_BROWSER_COMMAND_LABELS
} from '../shared/browser-command-labels.js';
import {
  COMMAND_SOURCE_BROWSER,
  filterCommandRegistryEntries,
  getCommandRegistryEntries
} from './page-command-registry.js';
import { closeShortcutHelpOverlay } from './shortcut-help-overlay.js';
import { restoreFocus, trapTabKey } from './overlay-focus-trap.js';

export const COMMAND_PALETTE_ROOT_SELECTOR = '[data-messages-shortcuts-command-palette]';
export const COMMAND_PALETTE_STYLE_SELECTOR = 'style[data-messages-shortcuts-command-palette-styles]';

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
  if (documentRoot.querySelector(COMMAND_PALETTE_STYLE_SELECTOR)) {
    return;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-command-palette-styles', '');
  style.textContent = `
    [data-messages-shortcuts-command-palette] {
      align-items: flex-start;
      background: rgba(32, 33, 36, 0.45);
      display: flex;
      inset: 0;
      justify-content: center;
      padding-top: 10vh;
      position: fixed;
      z-index: 2147483647;
    }

    [data-messages-shortcuts-command-palette-panel] {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.28);
      color: #202124;
      max-height: min(70vh, 640px);
      overflow: hidden;
      width: min(640px, calc(100vw - 32px));
    }

    [data-messages-shortcuts-command-palette-input] {
      border: 0;
      border-bottom: 1px solid #dadce0;
      box-sizing: border-box;
      font: 500 16px/24px system-ui, sans-serif;
      outline: none;
      padding: 16px 18px;
      width: 100%;
    }

    [data-messages-shortcuts-command-palette-list] {
      list-style: none;
      margin: 0;
      max-height: calc(min(70vh, 640px) - 57px);
      overflow: auto;
      padding: 8px 0;
    }

    [data-messages-shortcuts-command-palette-item] {
      align-items: center;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      padding: 10px 18px;
    }

    [data-messages-shortcuts-command-palette-item][data-selected="true"] {
      background: #e8f0fe;
    }

    [data-messages-shortcuts-command-palette-label] {
      font: 500 14px/20px system-ui, sans-serif;
    }

    [data-messages-shortcuts-command-palette-meta] {
      color: #5f6368;
      font: 400 12px/16px system-ui, sans-serif;
      text-align: right;
    }
  `;
  documentRoot.head.append(style);
}

function renderCommandList(listElement, entries, browserLabels) {
  listElement.replaceChildren();

  for (const [index, entry] of entries.entries()) {
    const item = listElement.ownerDocument.createElement('li');
    item.setAttribute('data-messages-shortcuts-command-palette-item', '');
    item.setAttribute('data-selected', index === 0 ? 'true' : 'false');

    const label = listElement.ownerDocument.createElement('span');
    label.setAttribute('data-messages-shortcuts-command-palette-label', '');
    label.textContent = entry.label;

    const meta = listElement.ownerDocument.createElement('span');
    meta.setAttribute('data-messages-shortcuts-command-palette-meta', '');

    if (entry.source === COMMAND_SOURCE_BROWSER) {
      meta.textContent = browserLabels[entry.command] || entry.availability.detail;
    } else if (entry.bindingLabels.length > 0) {
      meta.textContent = entry.bindingLabels.join(' / ');
    } else {
      meta.textContent = entry.availability.detail;
    }

    item.append(label, meta);
    listElement.append(item);
  }
}

function handlePaletteKeydown(event, panel) {
  if (event.key === 'Escape') {
    event.preventDefault();
    closeCommandPalette(panel.ownerDocument);

    return;
  }

  if (trapTabKey(event, panel)) {
    return;
  }

  const listElement = panel.querySelector('[data-messages-shortcuts-command-palette-list]');
  const items = [...listElement.querySelectorAll('[data-messages-shortcuts-command-palette-item]')];

  if (items.length === 0) {
    return;
  }

  const selectedIndex = items.findIndex((item) => item.getAttribute('data-selected') === 'true');
  let nextIndex;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    nextIndex = Math.min(selectedIndex + 1, items.length - 1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    nextIndex = Math.max(selectedIndex - 1, 0);
  } else {
    return;
  }

  for (const [index, item] of items.entries()) {
    item.setAttribute('data-selected', index === nextIndex ? 'true' : 'false');
  }

  if (typeof items[nextIndex]?.scrollIntoView === 'function') {
    items[nextIndex].scrollIntoView({ block: 'nearest' });
  }
}

export function isCommandPaletteOpen() {
  return isOpen;
}

export function closeCommandPalette(documentRoot = document) {
  openGeneration += 1;

  if (!isOpen) {
    openPromise = null;

    return;
  }

  if (keydownListener) {
    documentRoot.removeEventListener('keydown', keydownListener, true);
    keydownListener = null;
  }

  documentRoot.querySelector(COMMAND_PALETTE_ROOT_SELECTOR)?.remove();
  restoreFocus(previousActiveElement);
  previousActiveElement = null;
  isOpen = false;
}

async function mountCommandPalette(documentRoot, chromeApi) {
  const generation = openGeneration;

  ensureStyles(documentRoot);
  previousActiveElement = documentRoot.activeElement;

  const browserLabels = await fetchBrowserCommandLabels(chromeApi);

  if (generation !== openGeneration) {
    return;
  }

  const entries = getCommandRegistryEntries(documentRoot);

  const root = documentRoot.createElement('div');
  root.setAttribute('data-messages-shortcuts-command-palette', '');
  root.setAttribute('role', 'presentation');

  const panel = documentRoot.createElement('div');
  panel.setAttribute('data-messages-shortcuts-command-palette-panel', '');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Messages Shortcut Actions command palette');

  const input = documentRoot.createElement('input');
  input.setAttribute('data-messages-shortcuts-command-palette-input', '');
  input.setAttribute('type', 'text');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-label', 'Filter commands');
  input.setAttribute('placeholder', 'Filter commands');

  const list = documentRoot.createElement('ul');
  list.setAttribute('data-messages-shortcuts-command-palette-list', '');
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Available commands');

  renderCommandList(list, entries, browserLabels);

  input.addEventListener('input', () => {
    const filteredEntries = filterCommandRegistryEntries(entries, input.value);
    renderCommandList(list, filteredEntries, browserLabels);
  });

  panel.append(input, list);
  root.append(panel);
  documentRoot.body.append(root);

  keydownListener = (event) => {
    handlePaletteKeydown(event, panel);
  };
  documentRoot.addEventListener('keydown', keydownListener, true);

  input.focus();
  isOpen = true;
}

export async function openCommandPalette(documentRoot = document, chromeApi = chrome) {
  closeShortcutHelpOverlay(documentRoot);

  if (isOpen) {
    closeCommandPalette(documentRoot);
  }

  if (openPromise) {
    return openPromise;
  }

  openPromise = mountCommandPalette(documentRoot, chromeApi).finally(() => {
    openPromise = null;
  });

  return openPromise;
}

export function resetCommandPaletteForTests(documentRoot = document) {
  closeCommandPalette(documentRoot);
  openPromise = null;
  openGeneration = 0;
}

export function simulateCommandPaletteOpenWithoutListenerForTests() {
  isOpen = true;
  keydownListener = null;
}
