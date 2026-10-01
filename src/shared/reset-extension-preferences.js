import { CONVERSATION_OPEN_STORAGE_KEY } from './conversation-open-preference.js';
import { PAUSE_STORAGE_KEY } from './pause-preference.js';
import { TRASH_CONFIRMATION_STORAGE_KEY } from './trash-confirmation-preference.js';

export const DEFAULT_EXTENSION_PREFERENCES = {
  [TRASH_CONFIRMATION_STORAGE_KEY]: true,
  [CONVERSATION_OPEN_STORAGE_KEY]: false,
  [PAUSE_STORAGE_KEY]: false
};

export async function resetExtensionPreferences(chromeApi = globalThis.chrome) {
  await chromeApi.storage.local.set(DEFAULT_EXTENSION_PREFERENCES);
}
