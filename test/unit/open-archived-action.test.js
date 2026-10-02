import { describe, expect, it, vi } from 'vitest';
import { handleOpenArchived } from '../../src/content/open-archived-action.js';
import * as archivedAdapter from '../../src/content/adapters/archived-adapter.js';

describe('open-archived-action', () => {
  it('opens the archived modal when the extension is active', async () => {
    vi.spyOn(archivedAdapter, 'openArchivedModal')
      .mockResolvedValueOnce({ ok: true });

    const localThis = await handleOpenArchived(document, {
      storage: {
        local: {
          get: vi.fn(async () => ({}))
        }
      }
    });

    expect(localThis).toEqual({ ok: true });
  });

  it('returns extension-paused when shortcuts are paused', async () => {
    const localThis = await handleOpenArchived(document, {
      storage: {
        local: {
          get: vi.fn(async () => ({ extensionPaused: true }))
        }
      }
    });

    expect(localThis).toEqual({ ok: false, reason: 'extension-paused' });
  });
});
