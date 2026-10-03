import {
  COMMAND_OPEN_ARCHIVED,
  COMMAND_OPEN_SPAM_BLOCKED,
  COMMAND_START_CHAT
} from '../shared/commands.js';
import {
  getFallbackBrowserCommandLabelMap,
  MESSAGE_GET_BROWSER_COMMAND_LABELS
} from '../shared/browser-command-labels.js';
import { UNASSIGNED_SHORTCUT_LABEL } from '../shared/shortcut-labels.js';
import { isNativeDialogOpen } from './keyboard-context-guard.js';
import {
  ARCHIVED_FAB_ATTRIBUTE,
  ARCHIVED_FAB_ROW_ATTRIBUTE
} from './navigation-fab.js';
import { SPAM_BLOCKED_FAB_ATTRIBUTE } from './spam-blocked-fab.js';

const BADGE_ATTRIBUTE = 'data-messages-shortcuts-navigation-shortcut';
const BADGE_HOST_ATTRIBUTE = 'data-messages-shortcuts-navigation-shortcut-host';
const STYLE_SELECTOR = 'style[data-messages-shortcuts-navigation-shortcut-styles]';
const NATIVE_MODAL_OPEN_ATTRIBUTE = 'data-messages-shortcuts-native-modal-open';
const START_CHAT_SELECTOR = 'a[data-e2e-start-button]';
const installationRegistry = new WeakMap();

const NAVIGATION_CONTROLS = [
  { command: COMMAND_START_CHAT, selector: START_CHAT_SELECTOR },
  { command: COMMAND_OPEN_ARCHIVED, selector: `[${ARCHIVED_FAB_ATTRIBUTE}]` },
  { command: COMMAND_OPEN_SPAM_BLOCKED, selector: `[${SPAM_BLOCKED_FAB_ATTRIBUTE}]` }
];

function addStyles(documentRoot) {
  const existingStyle = documentRoot.querySelector(STYLE_SELECTOR);

  if (existingStyle) {
    return existingStyle;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-navigation-shortcut-styles', '');
  style.textContent = `
    .gm-nav-row[${ARCHIVED_FAB_ROW_ATTRIBUTE}] [${BADGE_HOST_ATTRIBUTE}] {
      position: relative !important;
    }

    .gm-nav-row[${ARCHIVED_FAB_ROW_ATTRIBUTE}] [${BADGE_ATTRIBUTE}] {
      align-items: center;
      background: #ffffff;
      border: 1px solid #c4c7c5;
      border-radius: 999px;
      box-sizing: border-box;
      color: #1f1f1f;
      display: inline-flex;
      font: 600 10px/14px system-ui, sans-serif;
      height: 16px;
      max-width: calc(100% - 4px);
      overflow: hidden;
      padding: 0 4px;
      position: absolute;
      right: -2px;
      text-overflow: ellipsis;
      top: -6px;
      white-space: nowrap;
      z-index: 1;
    }
  `;
  documentRoot.head.append(style);

  return style;
}

function createShortcutBadge(documentRoot, shortcut) {
  const badge = documentRoot.createElement('span');
  badge.setAttribute(BADGE_ATTRIBUTE, '');
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = shortcut;
  return badge;
}

function applyShortcutBadge(documentRoot, selector, shortcut) {
  const control = documentRoot.querySelector(selector);

  if (!control) {
    return;
  }

  const existingBadge = control.querySelector(`[${BADGE_ATTRIBUTE}]`);

  if (shortcut === UNASSIGNED_SHORTCUT_LABEL) {
    existingBadge?.remove();
    control.removeAttribute(BADGE_HOST_ATTRIBUTE);
    return;
  }

  if (existingBadge?.textContent === shortcut) {
    return;
  }

  existingBadge?.remove();
  control.setAttribute(BADGE_HOST_ATTRIBUTE, '');
  control.append(createShortcutBadge(documentRoot, shortcut));
}

function removeBadges(documentRoot) {
  documentRoot.querySelectorAll(`[${BADGE_ATTRIBUTE}]`).forEach((badge) => badge.remove());
  documentRoot.querySelectorAll(`[${BADGE_HOST_ATTRIBUTE}]`).forEach((control) => {
    control.removeAttribute(BADGE_HOST_ATTRIBUTE);
  });
}

export function syncNavigationTileModalState(documentRoot = document) {
  const row = documentRoot.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);

  if (!row) {
    return;
  }

  const modalOpen = isNativeDialogOpen(documentRoot);

  if (modalOpen) {
    row.setAttribute(NATIVE_MODAL_OPEN_ATTRIBUTE, '');
    row.inert = true;
  } else {
    row.removeAttribute(NATIVE_MODAL_OPEN_ATTRIBUTE);
    row.inert = false;
  }

  for (const { selector } of NAVIGATION_CONTROLS) {
    const control = documentRoot.querySelector(selector);

    if (!control) {
      continue;
    }

    if (modalOpen) {
      control.setAttribute('aria-disabled', 'true');
    } else {
      control.removeAttribute('aria-disabled');
    }
  }
}

function createInstallation({
  documentRoot = document,
  chromeApi = globalThis.chrome,
  getBrowserCommandLabels = () => chromeApi.runtime.sendMessage({
    type: MESSAGE_GET_BROWSER_COMMAND_LABELS
  })
} = {}) {
  const style = addStyles(documentRoot);
  let labels = getFallbackBrowserCommandLabelMap();
  let active = true;

  function refresh() {
    if (!active) {
      return;
    }

    for (const { command, selector } of NAVIGATION_CONTROLS) {
      applyShortcutBadge(documentRoot, selector, labels[command]);
    }

    syncNavigationTileModalState(documentRoot);
  }

  void Promise.resolve()
    .then(getBrowserCommandLabels)
    .then((loadedLabels) => {
      if (!active) {
        return;
      }

      labels = { ...getFallbackBrowserCommandLabelMap(), ...loadedLabels };
      refresh();
    })
    .catch(() => {
      refresh();
    });

  const observer = new MutationObserver(refresh);
  observer.observe(documentRoot.body, { childList: true, subtree: true });
  refresh();

  return () => {
    active = false;
    observer.disconnect();
    removeBadges(documentRoot);
    syncNavigationTileModalState(documentRoot);
    style.remove();
  };
}

export function resetNavigationFabShortcutBadgeInstallationsForTests(documentRoot = document) {
  installationRegistry.get(documentRoot)?.disconnect();
  installationRegistry.delete(documentRoot);
}

export function installNavigationFabShortcutBadges(options = {}) {
  const documentRoot = options.documentRoot ?? document;
  const existing = installationRegistry.get(documentRoot);

  if (existing) {
    return existing.disconnect;
  }

  const installation = { disconnect: createInstallation(options) };
  installationRegistry.set(documentRoot, installation);

  return installation.disconnect;
}
