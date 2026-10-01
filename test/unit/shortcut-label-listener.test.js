import { describe, expect, it, vi } from 'vitest';
import {
  getShortcutLabels,
  installShortcutLabelListener
} from '../../src/background/shortcut-label-listener.js';
import {
  getConversationShortcutLabels,
  MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS
} from '../../src/shared/shortcut-labels.js';

describe('shortcut label listener', () => {
  it('maps the conversation command shortcuts', () => {
    expect(getConversationShortcutLabels([
      { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
      { name: 'trash-conversation', shortcut: 'Ctrl+Shift+D' },
      { name: 'mark-read-conversation', shortcut: 'Ctrl+Shift+K' },
      { name: 'mark-unread-conversation', shortcut: 'Ctrl+Shift+U' }
    ])).toEqual({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D',
      markRead: 'Ctrl+Shift+K',
      markUnread: 'Ctrl+Shift+U'
    });
  });

  it('uses a stable label for commands without a shortcut', () => {
    expect(getConversationShortcutLabels([])).toEqual({
      archive: 'Not assigned',
      trash: 'Not assigned',
      markRead: 'Not assigned',
      markUnread: 'Not assigned'
    });
  });

  it('loads labels from Chrome commands', async () => {
    const chromeApi = {
      commands: {
        getAll: vi.fn(async () => [
          { name: 'archive-conversation', shortcut: 'Ctrl+Shift+Y' },
          { name: 'trash-conversation', shortcut: 'Ctrl+Shift+D' },
          { name: 'mark-read-conversation', shortcut: 'Ctrl+Shift+K' },
          { name: 'mark-unread-conversation', shortcut: 'Ctrl+Shift+U' }
        ])
      }
    };

    await expect(getShortcutLabels(chromeApi)).resolves.toEqual({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D',
      markRead: 'Ctrl+Shift+K',
      markUnread: 'Ctrl+Shift+U'
    });
  });

  it('ignores unrelated runtime messages', () => {
    const addListener = vi.fn();
    const chromeApi = {
      commands: {
        getAll: vi.fn()
      },
      runtime: {
        onMessage: {
          addListener
        }
      }
    };

    installShortcutLabelListener(chromeApi);

    expect(addListener.mock.calls[0][0]({ type: 'other-message' }, {}, vi.fn())).toBe(false);
  });

  it('returns unassigned labels when Chrome commands cannot be read', async () => {
    const addListener = vi.fn();
    const chromeApi = {
      commands: {
        getAll: vi.fn(async () => {
          throw new Error('commands unavailable');
        })
      },
      runtime: {
        onMessage: {
          addListener
        }
      }
    };
    const sendResponse = vi.fn();

    installShortcutLabelListener(chromeApi);

    expect(
      addListener.mock.calls[0][0](
        { type: MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS },
        {},
        sendResponse
      )
    ).toBe(true);
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        archive: 'Not assigned',
        trash: 'Not assigned',
        markRead: 'Not assigned',
        markUnread: 'Not assigned'
      });
    });
  });
});
