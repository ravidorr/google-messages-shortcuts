import { describe, expect, it, vi } from 'vitest';
import {
  isGoogleMessagesUrl,
  routeCommand
} from '../../src/background/command-router.js';
import { COMMAND_ARCHIVE } from '../../src/shared/commands.js';

describe('command-router', () => {
  it('detects Google Messages URLs', () => {
    expect(isGoogleMessagesUrl('https://messages.google.com/web/conversations')).toBe(true);
    expect(isGoogleMessagesUrl('https://example.com')).toBe(false);
    expect(isGoogleMessagesUrl(undefined)).toBe(false);
    expect(isGoogleMessagesUrl('not-a-valid-url')).toBe(false);
  });

  it('rejects invalid commands', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(),
        sendMessage: vi.fn()
      }
    };

    const result = await routeCommand('invalid', chromeApi);

    expect(result).toEqual({ ok: false, reason: 'invalid-command' });
    expect(chromeApi.tabs.query).not.toHaveBeenCalled();
  });

  it('returns no-active-tab when query is empty', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => []),
        sendMessage: vi.fn()
      }
    };

    const result = await routeCommand(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({ ok: false, reason: 'no-active-tab' });
  });

  it('returns not-google-messages-tab for other hosts', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => [{ id: 1, url: 'https://example.com' }]),
        sendMessage: vi.fn()
      }
    };

    const result = await routeCommand(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({ ok: false, reason: 'not-google-messages-tab' });
  });

  it('forwards valid commands to the active tab', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => [{
          id: 42,
          url: 'https://messages.google.com/web/conversations'
        }]),
        sendMessage: vi.fn(async () => ({ ok: true }))
      }
    };

    const result = await routeCommand(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({ ok: true });
    expect(chromeApi.tabs.sendMessage).toHaveBeenCalledWith(42, { command: COMMAND_ARCHIVE });
  });

  it('propagates content script no-target responses', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => [{
          id: 42,
          url: 'https://messages.google.com/web/conversations'
        }]),
        sendMessage: vi.fn(async () => ({ ok: false, reason: 'no-target' }))
      }
    };

    const result = await routeCommand(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({ ok: false, reason: 'no-target' });
  });

  it('rejects invalid content script responses', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => [{
          id: 42,
          url: 'https://messages.google.com/web/conversations'
        }]),
        sendMessage: vi.fn(async () => ({ reason: 'missing-ok' }))
      }
    };

    const result = await routeCommand(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({
      ok: false,
      reason: 'invalid-content-script-response'
    });
  });

  it('handles unavailable content scripts', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => [{
          id: 42,
          url: 'https://messages.google.com/web/conversations'
        }]),
        sendMessage: vi.fn(async () => {
          throw new Error('Could not establish connection');
        })
      }
    };

    const result = await routeCommand(COMMAND_ARCHIVE, chromeApi);

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('content-script-unavailable');
  });

  it('handles non-Error content script failures', async () => {
    const chromeApi = {
      tabs: {
        query: vi.fn(async () => [{
          id: 42,
          url: 'https://messages.google.com/web/conversations'
        }]),
        sendMessage: vi.fn(async () => {
          throw 'Could not establish connection';
        })
      }
    };

    const result = await routeCommand(COMMAND_ARCHIVE, chromeApi);

    expect(result).toEqual({
      ok: false,
      reason: 'content-script-unavailable',
      error: 'Could not establish connection'
    });
  });
});
