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
import { ARCHIVED_FAB_ATTRIBUTE, ARCHIVED_FAB_ROW_ATTRIBUTE } from './navigation-fab.js';
import {
  NAV_TILE_BADGE_ATTRIBUTE,
  NAV_TILE_BADGE_HOST_CLASS,
  normalizeNavigationTileRow
} from './navigation-tile-styles.js';
import { SPAM_BLOCKED_FAB_ATTRIBUTE } from './spam-blocked-fab.js';

const NATIVE_MODAL_OPEN_ATTRIBUTE = 'data-messages-shortcuts-native-modal-open';
const START_CHAT_SELECTOR = 'a[data-e2e-start-button]';
const installationRegistry = new WeakMap();

const NAVIGATION_CONTROLS = [
  { command: COMMAND_START_CHAT, selector: START_CHAT_SELECTOR },
  { command: COMMAND_OPEN_ARCHIVED, selector: `[${ARCHIVED_FAB_ATTRIBUTE}]` },
  { command: COMMAND_OPEN_SPAM_BLOCKED, selector: `[${SPAM_BLOCKED_FAB_ATTRIBUTE}]` }
];

function createShortcutBadge(documentRoot, shortcut) {
  const badge = documentRoot.createElement('span');
  badge.setAttribute(NAV_TILE_BADGE_ATTRIBUTE, '');
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = shortcut;
  return badge;
}

function applyShortcutBadge(documentRoot, selector, shortcut) {
  const control = documentRoot.querySelector(selector);

  if (!control) {
    return;
  }

  const existingBadge = control.querySelector(`[${NAV_TILE_BADGE_ATTRIBUTE}]`);

  if (shortcut === UNASSIGNED_SHORTCUT_LABEL) {
    existingBadge?.remove();
    control.classList.remove(NAV_TILE_BADGE_HOST_CLASS);
    return;
  }

  if (existingBadge?.textContent === shortcut) {
    control.classList.add(NAV_TILE_BADGE_HOST_CLASS);
    return;
  }

  existingBadge?.remove();
  control.classList.add(NAV_TILE_BADGE_HOST_CLASS);
  control.append(createShortcutBadge(documentRoot, shortcut));
}

function removeBadges(documentRoot) {
  documentRoot.querySelectorAll(`[${NAV_TILE_BADGE_ATTRIBUTE}]`).forEach((badge) => badge.remove());
  documentRoot.querySelectorAll(`.${NAV_TILE_BADGE_HOST_CLASS}`).forEach((control) => {
    control.classList.remove(NAV_TILE_BADGE_HOST_CLASS);
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
}

function createInstallation({
  documentRoot = document,
  chromeApi = globalThis.chrome,
  getBrowserCommandLabels = () => chromeApi.runtime.sendMessage({
    type: MESSAGE_GET_BROWSER_COMMAND_LABELS
  })
} = {}) {
  let labels = getFallbackBrowserCommandLabelMap();
  let active = true;

  function refresh() {
    if (!active) {
      return;
    }

    for (const { command, selector } of NAVIGATION_CONTROLS) {
      applyShortcutBadge(documentRoot, selector, labels[command]);
    }

    const row = documentRoot.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
    normalizeNavigationTileRow(row);
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
