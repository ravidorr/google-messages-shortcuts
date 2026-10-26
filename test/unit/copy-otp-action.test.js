import { describe, expect, it, vi } from 'vitest';
import {
  executeCopyOtpAction,
  findConversationOneTimeCode
} from '../../src/content/copy-otp-action.js';

function createRow(text) {
  const row = document.createElement('mws-conversation-list-item');
  row.textContent = text;

  return row;
}

describe('copy OTP action', () => {
  it('finds the code in the row text', () => {
    expect(findConversationOneTimeCode(createRow('Bank Your code is 123456'))).toBe('123456');
    expect(findConversationOneTimeCode(createRow('Friend hello'))).toBeNull();
  });

  it('copies the detected code', async () => {
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };

    await expect(executeCopyOtpAction(createRow('Your code is 123456'), clipboard))
      .resolves.toEqual({ ok: true });
    expect(clipboard.writeText).toHaveBeenCalledWith('123456');
  });

  it('reports when no code is found', async () => {
    const clipboard = { writeText: vi.fn() };

    await expect(executeCopyOtpAction(createRow('hello'), clipboard))
      .resolves.toEqual({ ok: false, reason: 'otp-not-found' });
    expect(clipboard.writeText).not.toHaveBeenCalled();
  });

  it('reports clipboard failures', async () => {
    const clipboard = { writeText: vi.fn().mockRejectedValue(new Error('denied')) };

    await expect(executeCopyOtpAction(createRow('Your code is 123456'), clipboard))
      .resolves.toEqual({ ok: false, reason: 'clipboard-write-failed' });
  });
});
