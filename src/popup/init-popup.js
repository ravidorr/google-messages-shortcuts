import { populateShortcutList } from './popup-view.js';
import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../shared/commands.js';

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

export async function initializePopup(chromeApi = chrome, documentRoot = document) {
  bindShortcutsLink(documentRoot, chromeApi);

  const shortcutList = documentRoot.getElementById('shortcut-list');
  const commands = await chromeApi.commands.getAll();

  populateShortcutList(shortcutList, commands);
  updateShortcutWarning(commands, documentRoot);
}
