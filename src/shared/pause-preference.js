export const PAUSE_STORAGE_KEY = 'extensionPaused';

export async function isPaused(chromeApi = globalThis.chrome) {
  try {
    const storedPreference = await chromeApi.storage.local.get(PAUSE_STORAGE_KEY);

    return storedPreference[PAUSE_STORAGE_KEY] === true;
  } catch {
    return true;
  }
}

export async function setPaused(paused, chromeApi = globalThis.chrome) {
  await chromeApi.storage.local.set({
    [PAUSE_STORAGE_KEY]: paused
  });
}
