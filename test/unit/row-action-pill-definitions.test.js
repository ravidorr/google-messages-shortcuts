import { describe, expect, it } from 'vitest';
import { getPillDefinitionsForRow } from '../../src/content/row-action-registry.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_MUTE,
  COMMAND_TRASH,
  COMMAND_UNMUTE
} from '../../src/shared/commands.js';

function createConversationRow({ unread = false } = {}) {
  const row = document.createElement('mws-conversation-list-item');

  if (unread) {
    const marker = document.createElement('span');
    marker.setAttribute('data-e2e-is-unread', 'true');
    row.append(marker);
  }

  return row;
}

describe('row action pill definitions', () => {
  it('includes read-state-specific pills for each row type', () => {
    const readRow = createConversationRow();
    const unreadRow = createConversationRow({ unread: true });

    expect(getPillDefinitionsForRow(readRow)).toEqual([
      { command: COMMAND_ARCHIVE, label: 'Archive', shortcutKey: 'archive' },
      { command: COMMAND_TRASH, label: 'Trash', shortcutKey: 'trash' },
      { command: COMMAND_MARK_UNREAD, label: 'Mark as unread', shortcutKey: 'markUnread' },
      { command: COMMAND_MUTE, label: 'Mute', shortcutKey: 'mute' },
      { command: COMMAND_UNMUTE, label: 'Unmute', shortcutKey: 'unmute' }
    ]);
    expect(getPillDefinitionsForRow(unreadRow)).toEqual([
      { command: COMMAND_ARCHIVE, label: 'Archive', shortcutKey: 'archive' },
      { command: COMMAND_TRASH, label: 'Trash', shortcutKey: 'trash' },
      { command: COMMAND_MARK_READ, label: 'Mark as read', shortcutKey: 'markRead' },
      { command: COMMAND_MUTE, label: 'Mute', shortcutKey: 'mute' },
      { command: COMMAND_UNMUTE, label: 'Unmute', shortcutKey: 'unmute' }
    ]);
  });
});
