import { resolvePageCommandFromEvent } from '../shared/page-keymap.js';
import {
  PAGE_COMMAND_OPEN_HELP,
  PAGE_COMMAND_OPEN_PALETTE
} from '../shared/page-commands.js';
import { isPaused, PAUSE_STORAGE_KEY } from '../shared/pause-preference.js';
import {
  closeCommandPalette,
  isCommandPaletteOpen,
  openCommandPalette
} from './command-palette.js';
import {
  createKeyboardContext,
  shouldIgnorePageCommand
} from './keyboard-context-guard.js';
import { startInitialListCursorWatcher } from './initial-list-cursor.js';
import {
  establishInitialListCursor,
  executePageNavigationCommand
} from './page-navigation-actions.js';
import {
  closeShortcutHelpOverlay,
  isShortcutHelpOpen,
  openShortcutHelpOverlay
} from './shortcut-help-overlay.js';

const installationRegistry = new WeakMap();

function createInstallation({
  documentRoot = document,
  chromeApi = globalThis.chrome,
  executeNavigationCommand = executePageNavigationCommand,
  establishInitialCursor = establishInitialListCursor,
  openPalette = openCommandPalette,
  openHelp = openShortcutHelpOverlay,
  getPausedState = async () => isPaused(chromeApi)
} = {}) {
  let paused = false;

  async function refreshPausedState() {
    paused = await getPausedState();
  }

  void refreshPausedState();
  const disconnectInitialListCursorWatcher = startInitialListCursorWatcher({
    documentRoot,
    chromeApi,
    establishInitialCursor
  });

  function handleKeydown(event) {
    if (paused) {
      return;
    }

    if (isCommandPaletteOpen() || isShortcutHelpOpen()) {
      return;
    }

    const command = resolvePageCommandFromEvent(event);

    if (!command) {
      return;
    }

    const context = createKeyboardContext(event, documentRoot);

    if (shouldIgnorePageCommand(context)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (command === PAGE_COMMAND_OPEN_PALETTE) {
      void openPalette(documentRoot, chromeApi);

      return;
    }

    if (command === PAGE_COMMAND_OPEN_HELP) {
      void openHelp(documentRoot, chromeApi);

      return;
    }

    void executeNavigationCommand(command, documentRoot, chromeApi);
  }

  documentRoot.addEventListener('keydown', handleKeydown, true);

  const handlePausePreferenceChange = (changes, areaName) => {
    if (areaName !== 'local' || !changes[PAUSE_STORAGE_KEY]) {
      return;
    }

    paused = changes[PAUSE_STORAGE_KEY].newValue === true;

    if (paused) {
      closeCommandPalette(documentRoot);
      closeShortcutHelpOverlay(documentRoot);
    }
  };

  chromeApi.storage?.onChanged?.addListener(handlePausePreferenceChange);

  return () => {
    disconnectInitialListCursorWatcher();
    documentRoot.removeEventListener('keydown', handleKeydown, true);
    chromeApi.storage?.onChanged?.removeListener(handlePausePreferenceChange);
    closeCommandPalette(documentRoot);
    closeShortcutHelpOverlay(documentRoot);
  };
}

export function resetKeyboardControllerInstallationsForTests(documentRoot = document) {
  const installation = installationRegistry.get(documentRoot);

  if (!installation) {
    return;
  }

  installation.disconnect();
  installationRegistry.delete(documentRoot);
}

export function installKeyboardController(options = {}) {
  const documentRoot = options.documentRoot ?? document;
  const releaseToken = Symbol('keyboard-controller-installation');
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
