import { describe, expect, it, vi } from 'vitest';
import {
  isPaused,
  setPaused
} from '../../src/shared/pause-preference.js';

describe('pause-preference', () => {
  it('defaults to unpaused when no value is stored', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({}))
        }
      }
    };

    await expect(isPaused(chromeApi)).resolves.toBe(false);
  });

  it('uses the saved paused value', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ extensionPaused: true }))
        }
      }
    };

    await expect(isPaused(chromeApi)).resolves.toBe(true);
  });

  it('fails closed to paused when storage cannot be read', async () => {
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await expect(isPaused(chromeApi)).resolves.toBe(true);
  });

  it('persists the selected paused state', async () => {
    const set = vi.fn(async () => {});
    const chromeApi = {
      storage: {
        local: { set }
      }
    };

    await setPaused(true, chromeApi);

    expect(set).toHaveBeenCalledWith({ extensionPaused: true });
  });
});
