export const PILL_VISIBILITY_STORAGE_KEY = 'pillVisibility';

export const PILL_VISIBILITY_HOVER_OR_FOCUS = 'hover-or-focus';
export const PILL_VISIBILITY_SELECTED_ROW_ONLY = 'selected-row-only';
export const PILL_VISIBILITY_HIDDEN = 'hidden';

export const PILL_VISIBILITY_MODES = [
  PILL_VISIBILITY_HOVER_OR_FOCUS,
  PILL_VISIBILITY_SELECTED_ROW_ONLY,
  PILL_VISIBILITY_HIDDEN
];

export const DEFAULT_PILL_VISIBILITY = PILL_VISIBILITY_HOVER_OR_FOCUS;

export function isPillVisibilityMode(value) {
  return PILL_VISIBILITY_MODES.includes(value);
}

export function normalizePillVisibility(value) {
  return isPillVisibilityMode(value) ? value : DEFAULT_PILL_VISIBILITY;
}

export async function getPillVisibility(chromeApi = globalThis.chrome) {
  try {
    const storedPreference = await chromeApi.storage.local.get(PILL_VISIBILITY_STORAGE_KEY);

    return normalizePillVisibility(storedPreference[PILL_VISIBILITY_STORAGE_KEY]);
  } catch {
    return DEFAULT_PILL_VISIBILITY;
  }
}

export async function setPillVisibility(mode, chromeApi = globalThis.chrome) {
  if (!isPillVisibilityMode(mode)) {
    throw new TypeError(`Unsupported pill visibility mode: ${mode}`);
  }

  await chromeApi.storage.local.set({
    [PILL_VISIBILITY_STORAGE_KEY]: mode
  });
}
