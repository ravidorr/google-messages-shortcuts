import { describe, expect, it, vi } from 'vitest';
import {
  MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY,
  isMarkAsReadDebugValidationEnabled
} from '../../src/shared/mark-as-read-debug-preference.js';

describe('mark-as-read-debug-preference', () => {
  it('returns true only when the debug flag is explicitly enabled', async () => {
    const localThis = {
      storage: {
        local: {
          get: vi.fn(async () => ({
            [MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY]: true
          }))
        }
      }
    };

    await expect(isMarkAsReadDebugValidationEnabled(localThis)).resolves.toBe(true);
  });

  it('returns false when the debug flag is missing or storage is unavailable', async () => {
    const localThis = {
      storage: {
        local: {
          get: vi.fn(async () => ({}))
        }
      }
    };

    await expect(isMarkAsReadDebugValidationEnabled(localThis)).resolves.toBe(false);

    const failingStorage = {
      storage: {
        local: {
          get: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    await expect(isMarkAsReadDebugValidationEnabled(failingStorage)).resolves.toBe(false);
  });
});
