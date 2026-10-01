import { populateShortcutList } from './popup-view.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_MUTE,
  COMMAND_TRASH,
  COMMAND_UNMUTE
} from '../shared/commands.js';
import {
  isConversationOpeningEnabled,
  setConversationOpeningEnabled
} from '../shared/conversation-open-preference.js';
import {
  isPaused,
  setPaused
} from '../shared/pause-preference.js';
import { resetExtensionPreferences } from '../shared/reset-extension-preferences.js';
import {
  isTrashConfirmationEnabled,
  setTrashConfirmationEnabled
} from '../shared/trash-confirmation-preference.js';

const SHORTCUT_COMMANDS = [
  COMMAND_ARCHIVE,
  COMMAND_TRASH,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_MUTE,
  COMMAND_UNMUTE
];

export function updateShortcutWarning(commands, documentRoot = document) {
  const warning = documentRoot.getElementById('shortcut-warning');
  const hasMissingShortcut = SHORTCUT_COMMANDS.some((commandName) => {
    const command = commands.find((entry) => entry.name === commandName);

    return !command?.shortcut;
  });

  warning.hidden = !hasMissingShortcut;
}

export function bindShortcutsLink(documentRoot = document, chromeApi = chrome) {
  const link = documentRoot.getElementById('shortcuts-link');

  link.addEventListener('click', (event) => {
    event.preventDefault();
    chromeApi.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
}

export async function bindTrashConfirmationPreference(
  documentRoot = document,
  chromeApi = chrome
) {
  const checkbox = documentRoot.getElementById('auto-confirm-trash');

  checkbox.checked = await isTrashConfirmationEnabled(chromeApi);
  checkbox.addEventListener('change', async () => {
    const previousValue = !checkbox.checked;

    checkbox.disabled = true;

    try {
      await setTrashConfirmationEnabled(checkbox.checked, chromeApi);
    } catch (error) {
      checkbox.checked = previousValue;
      console.warn('[Messages Shortcut Actions] Failed to save trash confirmation preference.', error);
    } finally {
      checkbox.disabled = false;
    }
  });
  checkbox.disabled = false;
}

export async function bindPausePreference(
  documentRoot = document,
  chromeApi = chrome
) {
  const checkbox = documentRoot.getElementById('pause-extension');

  checkbox.checked = await isPaused(chromeApi);
  checkbox.addEventListener('change', async () => {
    const previousValue = !checkbox.checked;

    checkbox.disabled = true;

    try {
      await setPaused(checkbox.checked, chromeApi);
    } catch (error) {
      checkbox.checked = previousValue;
      console.warn('[Messages Shortcut Actions] Failed to save pause preference.', error);
    } finally {
      checkbox.disabled = false;
    }
  });
  checkbox.disabled = false;
}

export async function bindResetExtensionPreferences(
  documentRoot = document,
  chromeApi = chrome
) {
  const resetButton = documentRoot.getElementById('reset-extension-preferences');
  const status = documentRoot.getElementById('reset-status');
  const trashCheckbox = documentRoot.getElementById('auto-confirm-trash');
  const openCheckbox = documentRoot.getElementById('open-conversation-on-focus');
  const pauseCheckbox = documentRoot.getElementById('pause-extension');

  resetButton.addEventListener('click', async () => {
    resetButton.disabled = true;
    status.hidden = true;
    status.textContent = '';

    try {
      await resetExtensionPreferences(chromeApi);
      trashCheckbox.checked = true;
      openCheckbox.checked = false;
      pauseCheckbox.checked = false;
      status.textContent = 'Extension preferences restored to defaults.';
      status.hidden = false;
    } catch (error) {
      status.textContent = 'Could not reset extension preferences. Try again.';
      status.hidden = false;
      console.warn('[Messages Shortcut Actions] Failed to reset extension preferences.', error);
    } finally {
      resetButton.disabled = false;
    }
  });
  resetButton.disabled = false;
}

export async function bindConversationOpenPreference(
  documentRoot = document,
  chromeApi = chrome
) {
  const checkbox = documentRoot.getElementById('open-conversation-on-focus');

  checkbox.checked = await isConversationOpeningEnabled(chromeApi);
  checkbox.addEventListener('change', async () => {
    const previousValue = !checkbox.checked;

    checkbox.disabled = true;

    try {
      await setConversationOpeningEnabled(checkbox.checked, chromeApi);
    } catch (error) {
      checkbox.checked = previousValue;
      console.warn('[Messages Shortcut Actions] Failed to save conversation open preference.', error);
    } finally {
      checkbox.disabled = false;
    }
  });
  checkbox.disabled = false;
}

export async function initializePopup(chromeApi = chrome, documentRoot = document) {
  bindShortcutsLink(documentRoot, chromeApi);

  const shortcutList = documentRoot.getElementById('shortcut-list');
  const commands = await chromeApi.commands.getAll();

  populateShortcutList(shortcutList, commands);
  updateShortcutWarning(commands, documentRoot);
  await bindTrashConfirmationPreference(documentRoot, chromeApi);
  await bindConversationOpenPreference(documentRoot, chromeApi);
  await bindPausePreference(documentRoot, chromeApi);
  await bindResetExtensionPreferences(documentRoot, chromeApi);
}
