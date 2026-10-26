import { extractOneTimeCode } from '../shared/one-time-code.js';

const PILL_GROUP_SELECTOR = '[data-messages-shortcuts-pill-group]';

function getTextBlocks(conversationRow) {
  const walker = conversationRow.ownerDocument.createTreeWalker(
    conversationRow,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => (
        node.parentElement?.closest(PILL_GROUP_SELECTOR)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT
      )
    }
  );
  const blocks = [];

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue.trim();

    if (text) {
      blocks.push(text);
    }
  }

  return blocks;
}

// Each text node is searched on its own so digits in a sender name or number
// never combine with a keyword that sits in the message preview.
export function findConversationOneTimeCode(conversationRow) {
  for (const block of getTextBlocks(conversationRow).reverse()) {
    const code = extractOneTimeCode(block);

    if (code) {
      return code;
    }
  }

  return null;
}

export async function executeCopyOtpAction(
  conversationRow,
  clipboard = globalThis.navigator?.clipboard
) {
  const code = findConversationOneTimeCode(conversationRow);

  if (!code) {
    return { ok: false, reason: 'otp-not-found' };
  }

  if (typeof clipboard?.writeText !== 'function') {
    return { ok: false, reason: 'clipboard-unavailable' };
  }

  try {
    await clipboard.writeText(code);
  } catch (error) {
    console.warn('[Messages Shortcut Actions] Failed to copy one-time code.', error);

    return { ok: false, reason: 'clipboard-write-failed' };
  }

  return { ok: true };
}
