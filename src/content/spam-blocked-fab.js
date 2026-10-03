import { isPaused } from '../shared/pause-preference.js';
import { showActionFeedback } from './action-feedback.js';
import {
  ARCHIVED_FAB_ROW_ATTRIBUTE,
  copyNavigationFabIcon,
  SPAM_BLOCKED_FAB_ICON_PATH
} from './navigation-fab.js';
import {
  normalizeNavigationTileLink,
  normalizeNavigationTileRow
} from './navigation-tile-styles.js';
import { handleOpenSpamBlocked } from './open-spam-blocked-action.js';
import { COMMAND_OPEN_SPAM_BLOCKED } from '../shared/commands.js';
import { SELECTORS } from './google-messages-dom.js';

export const SPAM_BLOCKED_FAB_ATTRIBUTE = 'data-messages-shortcuts-spam-blocked-fab';
export const SPAM_BLOCKED_FAB_WRAP_ATTRIBUTE = 'data-messages-shortcuts-spam-blocked-fab-wrap';

const installationRegistry = new WeakMap();

function removeSpamBlockedFab(documentRoot) {
  documentRoot.querySelector(`[${SPAM_BLOCKED_FAB_WRAP_ATTRIBUTE}]`)?.remove();
}

export function createSpamBlockedFab(startChatContainer, onClick) {
  const wrap = startChatContainer.cloneNode(true);
  wrap.classList.remove('start-chat');
  wrap.classList.add('spam-blocked-chat');
  wrap.setAttribute('label', 'Spam & blocked');
  wrap.setAttribute(SPAM_BLOCKED_FAB_WRAP_ATTRIBUTE, '');

  const link = wrap.querySelector('a');

  if (!link) {
    throw new Error('Start chat FAB is missing its anchor element.');
  }

  link.removeAttribute('data-e2e-start-button');
  link.setAttribute('href', '#');
  link.setAttribute('role', 'button');
  link.setAttribute('tabindex', '0');
  link.setAttribute(SPAM_BLOCKED_FAB_ATTRIBUTE, '');
  link.setAttribute('aria-label', 'Open Spam and blocked');
  wrap.querySelector('.fab-label')?.replaceChildren('Spam & blocked');
  copyNavigationFabIcon(startChatContainer, wrap, SPAM_BLOCKED_FAB_ICON_PATH);
  normalizeNavigationTileLink(link, 'neutral');

  const activate = (event) => {
    event.preventDefault();
    event.stopPropagation();
    void onClick();
  };

  link.addEventListener('click', activate, true);
  link.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      activate(event);
    }
  }, true);

  return wrap;
}

function createInstallation({
  documentRoot = document,
  chromeApi = globalThis.chrome,
  selectors = SELECTORS,
  openSpamBlocked = handleOpenSpamBlocked
} = {}) {
  let paused = false;
  let inFlight = false;

  async function refresh() {
    paused = await isPaused(chromeApi);

    if (paused || inFlight) {
      removeSpamBlockedFab(documentRoot);
      return;
    }

    if (documentRoot.querySelector(`[${SPAM_BLOCKED_FAB_WRAP_ATTRIBUTE}]`)) {
      return;
    }

    const row = documentRoot.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
    const startChatContainer = row?.querySelector('mw-fab-link.start-chat');

    if (startChatContainer) {
      row.append(createSpamBlockedFab(startChatContainer, handleFabClick));
      normalizeNavigationTileRow(row);
    }
  }

  async function handleFabClick() {
    if (inFlight) {
      return;
    }

    inFlight = true;

    try {
      const result = await openSpamBlocked(documentRoot, chromeApi, selectors);
      showActionFeedback(result, COMMAND_OPEN_SPAM_BLOCKED, documentRoot);
    } finally {
      inFlight = false;
    }
  }

  const observer = new MutationObserver(() => {
    void refresh();
  });
  observer.observe(documentRoot.body, { childList: true, subtree: true });
  void refresh();

  const onStorageChanged = (_changes, areaName) => {
    if (areaName === 'local') {
      void refresh();
    }
  };
  chromeApi.storage?.onChanged?.addListener(onStorageChanged);

  return () => {
    observer.disconnect();
    chromeApi.storage?.onChanged?.removeListener(onStorageChanged);
    removeSpamBlockedFab(documentRoot);
  };
}

export function resetSpamBlockedFabInstallationsForTests(documentRoot = document) {
  installationRegistry.get(documentRoot)?.disconnect();
  installationRegistry.delete(documentRoot);
}

export function installSpamBlockedFab(options = {}) {
  const documentRoot = options.documentRoot ?? document;
  const existing = installationRegistry.get(documentRoot);

  if (existing) {
    return existing.disconnect;
  }

  const installation = { disconnect: createInstallation(options) };
  installationRegistry.set(documentRoot, installation);

  return installation.disconnect;
}
