import { describe, expect, it } from 'vitest';
import {
  isConversationRead,
  isConversationUnread
} from '../../src/content/conversation-read-state.js';

function createConversationRow({ unread = false } = {}) {
  const row = document.createElement('mws-conversation-list-item');

  if (unread) {
    const marker = document.createElement('span');
    marker.setAttribute('data-e2e-is-unread', 'true');
    row.append(marker);
  }

  return row;
}

describe('conversation read state', () => {
  it('detects unread conversations from the unread marker', () => {
    const row = createConversationRow({ unread: true });

    expect(isConversationUnread(row)).toBe(true);
    expect(isConversationRead(row)).toBe(false);
  });

  it('treats conversations without the unread marker as read', () => {
    const row = createConversationRow();

    expect(isConversationUnread(row)).toBe(false);
    expect(isConversationRead(row)).toBe(true);
  });

  it('returns false for missing rows', () => {
    expect(isConversationUnread(null)).toBe(false);
    expect(isConversationRead(null)).toBe(false);
  });
});
