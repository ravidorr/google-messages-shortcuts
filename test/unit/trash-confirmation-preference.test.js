import { describe, expect, it, vi } from 'vitest';
import {
  isTrashConfirmationEnabled,
  setTrashConfirmationEnabled
} from '../../src/shared/trash-confirmation-preference.js';

describe('trash-confirmation-preference', () => {
  it('defaults to enabled when no value is stored', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({}))
        }
      }
    };

    await expect(isTrashConfirmationEnabled(chromeApi)).resolves.toBe(true);
  });

  it('uses the saved enabled value', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ autoConfirmTrash: true }))
        }
      }
    };

    await expect(isTrashConfirmationEnabled(chromeApi)).resolves.toBe(true);
  });

  it('uses the saved disabled value', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ autoConfirmTrash: false }))
        }
      }
    };

    await expect(isTrashConfirmationEnabled(chromeApi)).resolves.toBe(false);
  });

  it('defaults to disabled when storage cannot be read', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await expect(isTrashConfirmationEnabled(chromeApi)).resolves.toBe(false);
  });

  it('persists the selected enabled state', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: { set }
      }
    };

    await setTrashConfirmationEnabled(false, chromeApi);

    expect(set).toHaveBeenCalledWith({ autoConfirmTrash: false });
  });
});
