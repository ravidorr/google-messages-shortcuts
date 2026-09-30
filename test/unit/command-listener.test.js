import { describe, expect, it, vi } from 'vitest';
import { handleCommandEvent } from '../../src/background/command-listener.js';
import { COMMAND_ARCHIVE } from '../../src/shared/commands.js';

describe('handleCommandEvent', () => {
  it('returns success when routing succeeds', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => [{
          id: 1,
          url: 'https://messages.google.com/web/conversations'
        }]),
        sendMessage: vi.fn(async () => ({ ok: true }))
      }
    };

    const result = await handleCommandEvent(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({ ok: true });
  });

  it('logs and returns route failures', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => []),
        sendMessage: vi.fn()
      }
    };

    const result = await handleCommandEvent(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({ ok: false, reason: 'no-active-tab' });
    expect(warnSpy).toHaveBeenCalled();
  });

  it('handles unexpected routing errors', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => {
          throw new Error('tabs unavailable');
        }),
        sendMessage: vi.fn()
      }
    };

    const result = await handleCommandEvent(COMMAND_ARCHIVE, chromeApi);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('route-error');
    expect(warnSpy).toHaveBeenCalled();
  });

  it('handles non-Error routing failures', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => {
          throw 'tabs unavailable';
        }),
        sendMessage: vi.fn()
      }
    };

    const result = await handleCommandEvent(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({
      ok: false,
      reason: 'route-error',
      error: 'tabs unavailable'
    });
    expect(warnSpy).toHaveBeenCalled();
  });
});
