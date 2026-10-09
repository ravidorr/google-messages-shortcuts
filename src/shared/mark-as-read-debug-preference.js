export const MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY = 'enableMarkAsReadLiveValidation';

export async function isMarkAsReadDebugValidationEnabled(chromeApi = globalThis.chrome) {
  try {
    const storedPreference = await chromeApi.storage.local.get(
      MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY
    );

    return storedPreference[MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY] === true;
  } catch {
    return false;
  }
}
