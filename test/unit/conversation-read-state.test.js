import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  findCurrentConversationRow,
  hasConversationNavigationStarted,
  isConversationRead,
  isConversationUnread,
  READ_STATE_TIMEOUT_REASON,
  waitForConversationRead
} from '../../src/content/conversation-read-state.js';
import { POLL_INTERVAL_MS } from '../../src/content/wait-for-element.js';

function createConversationRow({ unread = false } = {}) {
  const row = document.createElement('mws-conversation-list-item');
  const conversationLink = document.createElement('a');

  conversationLink.setAttribute('data-e2e-conversation', '');
  conversationLink.setAttribute('href', '/web/conversations/test-conversation');
  row.append(conversationLink);

  if (unread) {
    const marker = document.createElement('span');
    marker.setAttribute('data-e2e-is-unread', 'true');
    row.append(marker);
  }

  return row;
}

describe('conversation read state', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

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
    document.body.append(row);

    const resultPromise = waitForConversationRead(document, row, undefined, 200);

    setTimeout(() => {
      row.querySelector('[data-e2e-is-unread="true"]').remove();
    }, POLL_INTERVAL_MS);

    await vi.runAllTimersAsync();

    expect(await resultPromise).toEqual({ ok: true });
    vi.useRealTimers();
  });

  it('resolves when Google Messages replaces the row with a read version', async () => {
    vi.useFakeTimers();
    const unreadRow = createConversationRow({ unread: true });
    const readRow = createConversationRow();

    document.body.append(unreadRow);

    const resultPromise = waitForConversationRead(document, unreadRow, undefined, 200);

    setTimeout(() => {
      unreadRow.replaceWith(readRow);
    }, POLL_INTERVAL_MS);

    await vi.runAllTimersAsync();

    expect(await resultPromise).toEqual({ ok: true });
    vi.useRealTimers();
  });

  it('waits while the row is temporarily removed and resolves once it reappears read', async () => {
    vi.useFakeTimers();
    const unreadRow = createConversationRow({ unread: true });
    const readRow = createConversationRow();

    document.body.append(unreadRow);

    const resultPromise = waitForConversationRead(document, unreadRow, undefined, 200);

    setTimeout(() => {
      unreadRow.remove();
    }, POLL_INTERVAL_MS);

    setTimeout(() => {
      document.body.append(readRow);
    }, POLL_INTERVAL_MS * 2);

    await vi.runAllTimersAsync();

    expect(await resultPromise).toEqual({ ok: true });
    vi.useRealTimers();
  });

  it('tracks the current row by conversation href after virtualization', () => {
    const unreadRow = createConversationRow({ unread: true });
    const readRow = createConversationRow();

    document.body.append(unreadRow);
    unreadRow.replaceWith(readRow);

    const localThis = findCurrentConversationRow(document, unreadRow);

    expect(localThis).toBe(readRow);
    expect(isConversationRead(localThis)).toBe(true);
  });

  it('returns null when the matched conversation link is outside the row container', () => {
    const row = createConversationRow({ unread: true });
    const orphanLink = document.createElement('a');

    orphanLink.setAttribute('data-e2e-conversation', '');
    orphanLink.setAttribute('href', '/web/conversations/test-conversation');
    document.body.append(orphanLink, row);

    const localThis = findCurrentConversationRow(document, row);

    expect(localThis).toBeNull();
  });

  it('returns null when the row is disconnected and not yet re-rendered', () => {
    const row = createConversationRow({ unread: true });

    document.body.append(row);
    row.remove();

    const localThis = findCurrentConversationRow(document, row);

    expect(localThis).toBeNull();
  });

  it('returns null when the matching conversation link is outside a row', () => {
    const row = createConversationRow({ unread: true });
    const matchingLink = document.createElement('a');

    matchingLink.setAttribute('data-e2e-conversation', '');
    matchingLink.setAttribute('href', '/web/conversations/test-conversation');
    document.body.append(matchingLink);

    const localThis = findCurrentConversationRow(document, row);

    expect(localThis).toBeNull();
  });

  it('detects when navigation has started for the target conversation', () => {
    const row = createConversationRow({ unread: true });
    const conversationLink = row.querySelector('a[data-e2e-conversation]');

    conversationLink.setAttribute('aria-selected', 'true');
    document.body.append(row);

    const localThis = hasConversationNavigationStarted(document, row);

    expect(localThis).toBe(true);
  });

  it('returns a timeout failure when the row stays unread', async () => {
    vi.useFakeTimers();
    const row = createConversationRow({ unread: true });
    document.body.append(row);

    const resultPromise = waitForConversationRead(document, row, undefined, 50);

    await vi.runAllTimersAsync();

    expect(await resultPromise).toEqual({
      ok: false,
      reason: READ_STATE_TIMEOUT_REASON
    });
    vi.useRealTimers();
  });
});
