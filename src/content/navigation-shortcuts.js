import { COMMAND_OPEN_ARCHIVED, COMMAND_START_CHAT } from '../shared/commands.js';
import {
  isEditableTarget,
  matchesOpenArchivedShortcut,
  matchesStartChatShortcut
} from '../shared/navigation-shortcut-bindings.js';
import { isPaused, PAUSE_STORAGE_KEY } from '../shared/pause-preference.js';
import { isArchivedDialogShellVisible } from './adapters/archived-adapter.js';
import { isNativeDialogOpen } from './adapters/start-chat-adapter.js';
import { showActionFeedback } from './action-feedback.js';
import { handleOpenArchived } from './open-archived-action.js';
import { handleOpenStartChat } from './open-start-chat-action.js';
import { SELECTORS } from './google-messages-dom.js';

const installationRegistry = new WeakMap();

function createInstallation({
  documentRoot = document,
  chromeApi = globalThis.chrome,
  selectors = SELECTORS,
  openArchived = handleOpenArchived,
  openStartChat = handleOpenStartChat,
  matchesArchivedShortcut = matchesOpenArchivedShortcut,
  matchesStartChat = matchesStartChatShortcut,
  getPausedState = async () => {
    if (typeof chromeApi?.storage?.local?.get !== 'function') {
      return false;
    }

    return isPaused(chromeApi);
  }
} = {}) {
  let paused = false;

  async function refreshPausedState() {
    paused = await getPausedState();
  }

  void refreshPausedState();

  async function handleKeydown(event) {
    if (paused || isEditableTarget(event.target)) {
      return;
    }

    if (matchesArchivedShortcut(event)) {
      if (isArchivedDialogShellVisible(documentRoot, selectors)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const result = await openArchived(documentRoot, chromeApi, selectors);

      showActionFeedback(result, COMMAND_OPEN_ARCHIVED, documentRoot);
      return;
    }

    if (matchesStartChat(event)) {
      if (isNativeDialogOpen(documentRoot, selectors)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const result = await openStartChat(documentRoot, chromeApi, selectors);

      showActionFeedback(result, COMMAND_START_CHAT, documentRoot);
    }
  }

  documentRoot.addEventListener('keydown', handleKeydown, true);

  const handlePausePreferenceChange = (changes, areaName) => {
    if (areaName !== 'local' || !changes[PAUSE_STORAGE_KEY]) {
      return;
    }

    paused = changes[PAUSE_STORAGE_KEY].newValue === true;
  };

  chromeApi.storage?.onChanged?.addListener(handlePausePreferenceChange);

  return () => {
    documentRoot.removeEventListener('keydown', handleKeydown, true);
    chromeApi.storage?.onChanged?.removeListener(handlePausePreferenceChange);
  };
}

export function resetNavigationShortcutInstallationsForTests(documentRoot = document) {
  const installation = installationRegistry.get(documentRoot);

  if (!installation) {
    return;
  }

  installation.disconnect();
  installationRegistry.delete(documentRoot);
}

export function installNavigationShortcuts(options = {}) {
  const documentRoot = options.documentRoot ?? document;
  const releaseToken = Symbol('navigation-shortcut-installation');
  let installation = installationRegistry.get(documentRoot);

  if (!installation) {
    installation = {
      disconnect: createInstallation(options),
      tokens: new Set()
    };
    installationRegistry.set(documentRoot, installation);
  }

  installation.tokens.add(releaseToken);

  return () => {
    const activeInstallation = installationRegistry.get(documentRoot);

    if (!activeInstallation) {
      return;
    }

    activeInstallation.tokens.delete(releaseToken);

    if (activeInstallation.tokens.size === 0) {
      activeInstallation.disconnect();
      installationRegistry.delete(documentRoot);
    }
  };
}
