export const TRASH_CONFIRMATION_STORAGE_KEY = 'autoConfirmTrash';

export async function isTrashConfirmationEnabled(chromeApi = chrome) {
  try {
    const storedPreference = await chromeApi.storage.local.get(
      TRASH_CONFIRMATION_STORAGE_KEY
    );

    return storedPreference[TRASH_CONFIRMATION_STORAGE_KEY] !== false;
  } catch {
    return true;
  }
}

export async function setTrashConfirmationEnabled(enabled, chromeApi = chrome) {
  await chromeApi.storage.local.set({
    [TRASH_CONFIRMATION_STORAGE_KEY]: enabled
  });
}
