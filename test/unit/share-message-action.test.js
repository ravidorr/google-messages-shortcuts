import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  executeCopyMessageAction,
  executeShareWhatsAppAction,
  findConversationMessageText
} from '../../src/content/share-message-action.js';

function createRow(...texts) {
  const row = document.createElement('mws-conversation-list-item');

  for (const text of texts) {
    const element = document.createElement('span');
    element.textContent = text;
    row.append(element, '  ');
  }

  return row;
}

describe('share message action', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefers the native snippet element and excludes the sender', () => {
    const row = createRow('Alice');
    const snippet = document.createElement('mws-conversation-snippet');
    snippet.textContent = '  See you\n at 5  ';
    row.append(snippet, createRow('Sun').firstChild);

    expect(findConversationMessageText(row)).toBe('See you at 5');
  });

  it('falls back to the longest text block when there is no snippet element', () => {
    expect(findConversationMessageText(createRow('Alice', 'See you at 5 tonight', 'Sun')))
      .toBe('See you at 5 tonight');
  });

  it('ignores an empty snippet element', () => {
    const row = createRow('Alice', 'Hello there');
    row.append(document.createElement('mws-conversation-snippet'));

    expect(findConversationMessageText(row)).toBe('Hello there');
  });

  it('ignores text inside the extension pill group', () => {
    const row = createRow('Alice');
    const group = document.createElement('div');
    group.setAttribute('data-messages-shortcuts-pill-group', '');
    group.textContent = 'Share on WhatsApp, a very long pill label';
    row.append(group);

    expect(findConversationMessageText(row)).toBeNull();
  });

  it('returns null for rows with fewer than two text blocks', () => {
    expect(findConversationMessageText(createRow('Alice'))).toBeNull();
    expect(findConversationMessageText(createRow())).toBeNull();
  });

  it('copies the message text', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    await expect(executeCopyMessageAction(createRow('Alice', 'See you at 5', 'Sun'), clipboard))
      .resolves.toEqual({ ok: true });
    expect(clipboard.writeText).toHaveBeenCalledWith('See you at 5');
  });

  it('reports a missing message when copying', async () => {
    const clipboard = { writeText: vi.fn() };

    await expect(executeCopyMessageAction(createRow('Alice'), clipboard))
      .resolves.toEqual({ ok: false, reason: 'message-not-found' });
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('reports an unavailable clipboard', async () => {
    await expect(executeCopyMessageAction(createRow('Alice', 'Hello there'), undefined))
      .resolves.toEqual({ ok: false, reason: 'clipboard-unavailable' });
  });

  it('reports a clipboard write failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error('denied')) };

    await expect(executeCopyMessageAction(createRow('Alice', 'Hello there'), clipboard))
      .resolves.toEqual({ ok: false, reason: 'clipboard-write-failed' });
    expect(warn).toHaveBeenCalled();
  });

  it('opens WhatsApp with the encoded message in a new tab', () => {
    const openWindow = vi.fn();

    expect(executeShareWhatsAppAction(createRow('Alice', 'Dinner? 6 & 7', 'Sun'), openWindow))
      .toEqual({ ok: true });
    expect(openWindow).toHaveBeenCalledWith(
      'https://wa.me/?text=Dinner%3F%206%20%26%207',
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('does not open WhatsApp when there is no message', () => {
    const openWindow = vi.fn();

    expect(executeShareWhatsAppAction(createRow('Alice'), openWindow))
      .toEqual({ ok: false, reason: 'message-not-found' });
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('defaults to window.open', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    expect(executeShareWhatsAppAction(createRow('Alice', 'Hello there'))).toEqual({ ok: true });
    expect(open).toHaveBeenCalledOnce();
  });
});
