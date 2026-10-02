import {
  populateNavigationShortcutList,
  populateShortcutList,
  renderExtensionVersion
} from './popup-view.js';
import { MANIFEST_COMMANDS } from '../shared/commands.js';
import {
  isConversationOpeningEnabled,
  setConversationOpeningEnabled
} from '../shared/conversation-open-preference.js';
import {
  DEFAULT_PILL_VISIBILITY,
  getPillVisibility,
  setPillVisibility
} from '../shared/pill-visibility-preference.js';
import {
  isPaused,
  setPaused
} from '../shared/pause-preference.js';
import { resetExtensionPreferences } from '../shared/reset-extension-preferences.js';
import {
  isTrashConfirmationEnabled,
  setTrashConfirmationEnabled
} from '../shared/trash-confirmation-preference.js';

const SHORTCUT_COMMANDS = MANIFEST_COMMANDS;

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
  chromeApi = chrome,
  { syncPillVisibilityPreference } = {}
) {
  const resetButton = documentRoot.getElementById('reset-extension-preferences');
  const status = documentRoot.getElementById('reset-status');
  const trashCheckbox = documentRoot.getElementById('auto-confirm-trash');
  const openCheckbox = documentRoot.getElementById('open-conversation-on-focus');
  const pillVisibilitySelect = documentRoot.getElementById('pill-visibility');
  const pauseCheckbox = documentRoot.getElementById('pause-extension');

  resetButton.addEventListener('click', async () => {
    resetButton.disabled = true;
    status.hidden = true;
    status.textContent = '';

    try {
      await resetExtensionPreferences(chromeApi);
      trashCheckbox.checked = true;
      openCheckbox.checked = false;
      pillVisibilitySelect.value = DEFAULT_PILL_VISIBILITY;
      syncPillVisibilityPreference?.(DEFAULT_PILL_VISIBILITY);
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

export async function bindPillVisibilityPreference(
  documentRoot = document,
  chromeApi = chrome
) {
  const select = documentRoot.getElementById('pill-visibility');
  let currentValue = await getPillVisibility(chromeApi);

  select.value = currentValue;
  select.addEventListener('change', async () => {
    const previousValue = currentValue;

    select.disabled = true;

    try {
      await setPillVisibility(select.value, chromeApi);
      currentValue = select.value;
    } catch (error) {
      select.value = previousValue;
      console.warn('[Messages Shortcut Actions] Failed to save pill visibility preference.', error);
    } finally {
      select.disabled = false;
    }
  });
  select.disabled = false;

  return (value = select.value) => {
    currentValue = value;
    select.value = value;
  };
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
  renderExtensionVersion(documentRoot, chromeApi);

  const shortcutList = documentRoot.getElementById('shortcut-list');
  const navigationShortcutList = documentRoot.getElementById('navigation-shortcut-list');
  const commands = await chromeApi.commands.getAll();

  populateShortcutList(shortcutList, commands);
  populateNavigationShortcutList(navigationShortcutList, documentRoot);
  updateShortcutWarning(commands, documentRoot);
  await bindTrashConfirmationPreference(documentRoot, chromeApi);
  await bindConversationOpenPreference(documentRoot, chromeApi);
  const syncPillVisibilityPreference = await bindPillVisibilityPreference(documentRoot, chromeApi);
  await bindPausePreference(documentRoot, chromeApi);
  await bindResetExtensionPreferences(documentRoot, chromeApi, {
    syncPillVisibilityPreference
  });
}
