import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PILL_VISIBILITY,
  getPillVisibility,
  isPillVisibilityMode,
  normalizePillVisibility,
  PILL_VISIBILITY_HIDDEN,
  PILL_VISIBILITY_HOVER_OR_FOCUS,
  PILL_VISIBILITY_SELECTED_ROW_ONLY,
  setPillVisibility
} from '../../src/shared/pill-visibility-preference.js';

describe('pill-visibility-preference', () => {
  it('defaults to hover-or-focus when no value is stored', async () => {
    const localThis = {
      chromeApi: {
        storage: {
          local: {
            get: vi.fn(async () => ({}))
          }
        }
      }
    };

    await expect(getPillVisibility(localThis.chromeApi)).resolves.toBe(PILL_VISIBILITY_HOVER_OR_FOCUS);
  });

  it('uses the saved visibility mode', async () => {
    const localThis = {
      chromeApi: {
        storage: {
          local: {
            get: vi.fn(async () => ({ pillVisibility: PILL_VISIBILITY_SELECTED_ROW_ONLY }))
          }
        }
      }
    };

    await expect(getPillVisibility(localThis.chromeApi)).resolves.toBe(PILL_VISIBILITY_SELECTED_ROW_ONLY);
  });

  it('defaults to hover-or-focus when storage cannot be read', async () => {
    const localThis = {
      chromeApi: {
        storage: {
          local: {
            get: vi.fn(async () => {
              throw new Error('storage unavailable');
            })
          }
        }
      }
    };

    await expect(getPillVisibility(localThis.chromeApi)).resolves.toBe(DEFAULT_PILL_VISIBILITY);
  });

  it('normalizes unsupported stored values to the default', () => {
    expect(normalizePillVisibility('unsupported')).toBe(DEFAULT_PILL_VISIBILITY);
    expect(normalizePillVisibility(undefined)).toBe(DEFAULT_PILL_VISIBILITY);
    expect(normalizePillVisibility(PILL_VISIBILITY_HIDDEN)).toBe(PILL_VISIBILITY_HIDDEN);
  });

  it('validates supported pill visibility modes', () => {
    expect(isPillVisibilityMode(PILL_VISIBILITY_HOVER_OR_FOCUS)).toBe(true);
    expect(isPillVisibilityMode(PILL_VISIBILITY_SELECTED_ROW_ONLY)).toBe(true);
    expect(isPillVisibilityMode(PILL_VISIBILITY_HIDDEN)).toBe(true);
    expect(isPillVisibilityMode('other')).toBe(false);
  });

  it('persists the selected visibility mode', async () => {
    const localThis = {
      set: vi.fn(async () => {}),
      chromeApi: {
        storage: {
          local: {
            set: vi.fn(async () => {})
          }
        }
      }
    };
    localThis.chromeApi.storage.local.set = localThis.set;

    await setPillVisibility(PILL_VISIBILITY_HIDDEN, localThis.chromeApi);

    expect(localThis.set).toHaveBeenCalledWith({ pillVisibility: PILL_VISIBILITY_HIDDEN });
  });

  it('rejects unsupported visibility modes', async () => {
    const localThis = {
      chromeApi: {
        storage: {
          local: {
            set: vi.fn(async () => {})
          }
        }
      }
    };

    await expect(setPillVisibility('unsupported', localThis.chromeApi)).rejects.toThrow(
      'Unsupported pill visibility mode: unsupported'
    );
  });
});
