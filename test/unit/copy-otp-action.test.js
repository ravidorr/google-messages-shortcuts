import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  executeCopyOtpAction,
  findConversationOneTimeCode
} from '../../src/content/copy-otp-action.js';

function createRow(...texts) {
  const row = document.createElement('mws-conversation-list-item');

  for (const text of texts) {
    const element = document.createElement('span');
    element.textContent = text;
    row.append(element, '  ');
  }

  return row;
}

describe('copy OTP action', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds the code in the message preview', () => {
    expect(findConversationOneTimeCode(createRow('Bank', 'Your code is 123456', 'Sun')))
      .toBe('123456');
    expect(findConversationOneTimeCode(createRow('Friend', 'hello'))).toBeNull();
  });

  it('ignores digits in a numeric sender name', () => {
    expect(findConversationOneTimeCode(createRow('22395', 'Your verification code is 482913')))
      .toBe('482913');
    expect(findConversationOneTimeCode(createRow('+1 (833) 555-0123', 'Your code is 482913')))
      .toBe('482913');
    expect(findConversationOneTimeCode(createRow('22395', 'Thanks for your order'))).toBeNull();
  });

  it('uses the last text block that contains a code', () => {
    expect(findConversationOneTimeCode(createRow('Your code is 111111', 'Your code is 222222')))
      .toBe('222222');
  });

  it('copies the detected code', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    await expect(executeCopyOtpAction(createRow('Bank', 'Your code is 123456'), clipboard))
      .resolves.toEqual({ ok: true });
    expect(clipboard.writeText).toHaveBeenCalledWith('123456');
  });

  it('reports when no code is found', async () => {
    const clipboard = { writeText: vi.fn() };

    await expect(executeCopyOtpAction(createRow('hello'), clipboard))
      .resolves.toEqual({ ok: false, reason: 'otp-not-found' });
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('reports an unavailable clipboard API', async () => {
    await expect(executeCopyOtpAction(createRow('Your code is 123456'), undefined))
      .resolves.toEqual({ ok: false, reason: 'clipboard-unavailable' });
  });

  it('logs the cause and reports clipboard write failures', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failure = new Error('denied');
    const clipboard = { writeText: vi.fn().mockRejectedValue(failure) };

    await expect(executeCopyOtpAction(createRow('Your code is 123456'), clipboard))
      .resolves.toEqual({ ok: false, reason: 'clipboard-write-failed' });
    expect(warn).toHaveBeenCalledWith(
      '[Messages Shortcut Actions] Failed to copy one-time code.',
      failure
    );
  });
});
