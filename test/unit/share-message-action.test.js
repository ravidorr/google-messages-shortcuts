import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  executeCopyMessageAction,
  executeShareWhatsAppAction,
  findConversationMessageText
} from '../../src/content/share-message-action.js';

function createRow({ name = 'Alice', preview, timestamp = 'Sun' } = {}) {
  const row = document.createElement('mws-conversation-list-item');

  for (const text of [name, timestamp]) {
    const element = document.createElement('span');
    element.textContent = text;
    row.append(element);
  }

  if (preview !== undefined) {
    const snippet = document.createElement('mws-conversation-snippet');
    snippet.textContent = preview;
    row.insertBefore(snippet, row.lastChild);
  }

  return row;
}

describe('share message action', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads only the native snippet element and normalizes whitespace', () => {
    expect(findConversationMessageText(createRow({ preview: '  See you\n at 5  ' })))
      .toBe('See you at 5');
  });

  it('never returns the sender name or timestamp when the message is shorter', () => {
    expect(findConversationMessageText(
      createRow({ name: 'Bartholomew Jefferson-Smith', preview: 'Ok', timestamp: 'Yesterday' })
    )).toBe('Ok');
  });

  it('returns null without a usable snippet element', () => {
    expect(findConversationMessageText(createRow())).toBeNull();
    expect(findConversationMessageText(createRow({ preview: '   ' }))).toBeNull();
  });

  it('copies the message text', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    await expect(executeCopyMessageAction(createRow({ preview: 'See you at 5' }), clipboard))
      .resolves.toEqual({ ok: true });
    expect(clipboard.writeText).toHaveBeenCalledWith('See you at 5');
  });

  it('reports a missing message when copying', async () => {
    const clipboard = { writeText: vi.fn() };

    await expect(executeCopyMessageAction(createRow(), clipboard))
      .resolves.toEqual({ ok: false, reason: 'message-not-found' });
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('reports an unavailable clipboard', async () => {
    await expect(executeCopyMessageAction(createRow({ preview: 'Hello there' }), undefined))
      .resolves.toEqual({ ok: false, reason: 'clipboard-unavailable' });
  });

  it('reports a clipboard write failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error('denied')) };

    await expect(executeCopyMessageAction(createRow({ preview: 'Hello there' }), clipboard))
      .resolves.toEqual({ ok: false, reason: 'clipboard-write-failed' });
    expect(warn).toHaveBeenCalled();
  });

  it('opens WhatsApp with the encoded message in a new tab', () => {
    const openWindow = vi.fn();

    expect(executeShareWhatsAppAction(createRow({ preview: 'שלום? 6 & 7' }), openWindow))
      .toEqual({ ok: true });
    expect(openWindow).toHaveBeenCalledWith(
      `https://wa.me/?text=${encodeURIComponent('שלום? 6 & 7')}`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('does not open WhatsApp when there is no message', () => {
    const openWindow = vi.fn();

    expect(executeShareWhatsAppAction(createRow(), openWindow))
      .toEqual({ ok: false, reason: 'message-not-found' });
    expect(openWindow).not.toHaveBeenCalled();
  });

  it('reports an unavailable window.open', () => {
    expect(executeShareWhatsAppAction(createRow({ preview: 'Hello there' }), null))
      .toEqual({ ok: false, reason: 'window-unavailable' });
  });

  it('reports a window.open that throws', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const openWindow = vi.fn(() => {
      throw new Error('blocked');
    });

    expect(executeShareWhatsAppAction(createRow({ preview: 'Hello there' }), openWindow))
      .toEqual({ ok: false, reason: 'share-open-failed' });
    expect(warn).toHaveBeenCalled();
  });

  it('defaults to window.open', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    expect(executeShareWhatsAppAction(createRow({ preview: 'Hello there' }))).toEqual({ ok: true });
    expect(open).toHaveBeenCalledWith(
      'https://wa.me/?text=Hello%20there',
      '_blank',
      'noopener,noreferrer'
    );
  });
});
