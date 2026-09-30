export const CONVERSATION_OPEN_STORAGE_KEY = 'openConversationOnFocus';

export async function isConversationOpeningEnabled(chromeApi = globalThis.chrome) {
  try {
    const storedPreference = await chromeApi.storage.local.get(
      CONVERSATION_OPEN_STORAGE_KEY
    );

    return storedPreference[CONVERSATION_OPEN_STORAGE_KEY] === true;
  } catch {
    return false;
  }
}

export async function setConversationOpeningEnabled(enabled, chromeApi = globalThis.chrome) {
  await chromeApi.storage.local.set({
    [CONVERSATION_OPEN_STORAGE_KEY]: enabled
  });
}
