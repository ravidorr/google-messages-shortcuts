import { extractOneTimeCode } from '../shared/one-time-code.js';

export function findConversationOneTimeCode(conversationRow) {
  return extractOneTimeCode(conversationRow.textContent ?? '');
}

export async function executeCopyOtpAction(
  conversationRow,
  clipboard = globalThis.navigator?.clipboard
) {
  const code = findConversationOneTimeCode(conversationRow);

  if (!code) {
    return { ok: false, reason: 'otp-not-found' };
  }

  try {
    await clipboard.writeText(code);
  } catch (_error) {
    return { ok: false, reason: 'clipboard-write-failed' };
  }

  return { ok: true };
}
