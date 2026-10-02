import { describe, expect, it, vi } from 'vitest';
import { COMMAND_ARCHIVE } from '../../src/shared/commands.js';

describe('background entry', () => {
  it('registers the command listener', async () => {
    vi.resetModules();

    const addListener = vi.fn();
    globalThis.chrome = {
      commands: {
        onCommand: {
          addListener
        }
      },
      runtime: {
        onMessage: {
          addListener: vi.fn()
        }
      },
      tabs: {
        query: vi.fn(async () => [{
          id: 1,
          url: 'https://messages.google.com/web/conversations'
        }]),
        sendMessage: vi.fn(async () => ({ ok: true }))
      }
    };

    await import('../../background.js');

    expect(addListener).toHaveBeenCalledTimes(1);

    const listener = addListener.mock.calls[0][0];
    await listener(COMMAND_ARCHIVE);

    expect(globalThis.chrome.tabs.sendMessage).toHaveBeenCalled();
  });

  it('returns the effective conversation shortcut labels to content scripts', async () => {
    vi.resetModules();

    const commandListener = vi.fn();
    const messageListener = vi.fn();
    globalThis.chrome = {
      commands: {
        getAll: vi.fn(async () => [
          { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
          { name: 'trash-conversation', shortcut: '' }
        ]),
        onCommand: {
          addListener: commandListener
        }
      },
      runtime: {
        onMessage: {
          addListener: messageListener
        }
      },
      tabs: {
        query: vi.fn(async () => []),
        sendMessage: vi.fn(async () => ({}))
      }
    };

    await import('../../background.js');

    const listener = messageListener.mock.calls[0][0];
    const sendResponse = vi.fn();

    expect(listener({ type: 'get-conversation-shortcut-labels' }, {}, sendResponse)).toBe(true);
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        archive: 'Ctrl+Shift+Y',
        trash: 'Not assigned',
        markRead: 'Not assigned',
        markUnread: 'Not assigned',
        mute: 'Not assigned',
        unmute: 'Not assigned',
        blockReportSpam: 'Not assigned',
        unarchive: 'Not assigned'
      });
    });
  });
});
