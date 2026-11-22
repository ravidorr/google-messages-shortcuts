import { describe, expect, it } from 'vitest';
import { getPillDefinitionsForRow } from '../../src/content/row-action-registry.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_BLOCK_REPORT_SPAM,
  COMMAND_COPY_MESSAGE,
  COMMAND_COPY_OTP,
  COMMAND_SHARE_WHATSAPP,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_MUTE,
  COMMAND_TRASH,
  COMMAND_UNMUTE
} from '../../src/shared/commands.js';
import { archivedModalSurface } from '../fixtures/dom/list-states.js';

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
      { command: COMMAND_UNMUTE, label: 'Unmute', shortcutKey: 'unmute' },
      {
        command: COMMAND_BLOCK_REPORT_SPAM,
        label: 'Block / report spam',
        shortcutKey: 'blockReportSpam'
      }
    ]);
    expect(getPillDefinitionsForRow(unreadRow)).toEqual([
      { command: COMMAND_ARCHIVE, label: 'Archive', shortcutKey: 'archive' },
      { command: COMMAND_TRASH, label: 'Trash', shortcutKey: 'trash' },
      { command: COMMAND_MARK_READ, label: 'Mark as read', shortcutKey: 'markRead' },
      { command: COMMAND_MUTE, label: 'Mute', shortcutKey: 'mute' },
      { command: COMMAND_UNMUTE, label: 'Unmute', shortcutKey: 'unmute' },
      {
        command: COMMAND_BLOCK_REPORT_SPAM,
        label: 'Block / report spam',
        shortcutKey: 'blockReportSpam'
      }
    ]);
  });

  it('does not show extension pills inside the archived modal', () => {
    document.body.innerHTML = archivedModalSurface;
    const archivedRow = document.getElementById('fixture-archived-row');

    expect(getPillDefinitionsForRow(archivedRow)).toEqual([]);
  });

  it('adds a copy one-time code pill only for rows with a detectable code', () => {
    const row = createConversationRow();
    row.textContent = 'Bank Your verification code is 482913';

    expect(getPillDefinitionsForRow(row)).toContainEqual({
      command: COMMAND_COPY_OTP,
      label: 'Copy one-time code',
      ariaLabel: 'Copy last one-time code',
      shortcutKey: 'copyOtp'
    });
  });

  it('adds message pills only for rows with message text', () => {
    const row = createConversationRow();
    row.append(
      Object.assign(document.createElement('span'), { textContent: 'Alice' }),
      Object.assign(document.createElement('span'), { textContent: 'See you at 5' })
    );
    const commands = getPillDefinitionsForRow(row).map(({ command }) => command);

    expect(commands).toContain(COMMAND_COPY_MESSAGE);
    expect(commands).toContain(COMMAND_SHARE_WHATSAPP);
    expect(getPillDefinitionsForRow(row)).toContainEqual({
      command: COMMAND_SHARE_WHATSAPP,
      label: 'Share on WhatsApp',
      ariaLabel: 'Share latest message on WhatsApp',
      shortcutKey: 'shareWhatsapp'
    });

    const emptyCommands = getPillDefinitionsForRow(createConversationRow())
      .map(({ command }) => command);

    expect(emptyCommands).not.toContain(COMMAND_COPY_MESSAGE);
    expect(emptyCommands).not.toContain(COMMAND_SHARE_WHATSAPP);
  });

  it.each([
    ['digits without a keyword', 'Bank Your balance is 482913'],
    ['a keyword without digits', 'Bank Your code is in the app'],
    ['an empty row', '']
  ])('omits the copy one-time code pill for %s', (_label, text) => {
    const row = createConversationRow();
    row.textContent = text;

    expect(getPillDefinitionsForRow(row).map(({ command }) => command))
      .not.toContain(COMMAND_COPY_OTP);
  });
});
