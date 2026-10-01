import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_EXTENSION_PREFERENCES,
  resetExtensionPreferences
} from '../../src/shared/reset-extension-preferences.js';

describe('reset-extension-preferences', () => {
  it('restores the default extension preferences', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: { set }
      }
    };

    await resetExtensionPreferences(chromeApi);

    expect(set).toHaveBeenCalledWith(DEFAULT_EXTENSION_PREFERENCES);
  });
});
