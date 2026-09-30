import { populateShortcutList } from './popup-view.js';
import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../shared/commands.js';
import {
  isConversationOpeningEnabled,
  setConversationOpeningEnabled
} from '../shared/conversation-open-preference.js';
import {
  isTrashConfirmationEnabled,
  setTrashConfirmationEnabled
} from '../shared/trash-confirmation-preference.js';

const SHORTCUT_COMMANDS = [COMMAND_ARCHIVE, COMMAND_TRASH];

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
}
