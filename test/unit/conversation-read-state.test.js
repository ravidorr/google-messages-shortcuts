import { describe, expect, it, vi } from 'vitest';
import {
  isConversationRead,
  isConversationUnread,
  waitForConversationRead
} from '../../src/content/conversation-read-state.js';
import { POLL_INTERVAL_MS } from '../../src/content/wait-for-element.js';

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

  it('resolves when the unread marker disappears', async () => {
    vi.useFakeTimers();
    const row = createConversationRow({ unread: true });

    const resultPromise = waitForConversationRead(row, undefined, 200);

    setTimeout(() => {
      row.querySelector('[data-e2e-is-unread="true"]').remove();
    }, POLL_INTERVAL_MS);

    await vi.runAllTimersAsync();

    expect(await resultPromise).toEqual({ ok: true });
    vi.useRealTimers();
  });

  it('returns a timeout failure when the row stays unread', async () => {
    vi.useFakeTimers();
    const row = createConversationRow({ unread: true });

    const resultPromise = waitForConversationRead(row, undefined, 50);

    await vi.runAllTimersAsync();

    expect(await resultPromise).toEqual({
      ok: false,
      reason: 'Timed out waiting for conversation to become read'
    });
    vi.useRealTimers();
  });
});
