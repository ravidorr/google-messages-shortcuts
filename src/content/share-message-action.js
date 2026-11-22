const PILL_GROUP_SELECTOR = '[data-messages-shortcuts-pill-group]';
const SNIPPET_SELECTOR = 'mws-conversation-snippet';
const WHATSAPP_SHARE_URL = 'https://wa.me/';

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

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
    const text = normalizeText(node.nodeValue);

    if (text) {
      blocks.push(text);
    }
  }

  return blocks;
}

// Prefers the native snippet element. Without it, the longest visible text
// block is the best guess: sender names and timestamps are shorter than the
// message preview. The sender name is deliberately never included.
export function findConversationMessageText(conversationRow) {
  const snippet = conversationRow.querySelector(SNIPPET_SELECTOR);
  const snippetText = snippet ? normalizeText(snippet.textContent) : '';

  if (snippetText) {
    return snippetText;
  }

  const blocks = getTextBlocks(conversationRow);

  if (blocks.length < 2) {
    return null;
  }

  return blocks.reduce((longest, block) => (block.length > longest.length ? block : longest));
}

export async function executeCopyMessageAction(
  conversationRow,
  clipboard = globalThis.navigator?.clipboard
) {
  const text = findConversationMessageText(conversationRow);

  if (!text) {
    return { ok: false, reason: 'message-not-found' };
  }

  if (typeof clipboard?.writeText !== 'function') {
    return { ok: false, reason: 'clipboard-unavailable' };
  }

  try {
    await clipboard.writeText(text);
  } catch (error) {
    console.warn('[Messages Shortcut Actions] Failed to copy message.', error);

    return { ok: false, reason: 'clipboard-write-failed' };
  }

  return { ok: true };
}

export function executeShareWhatsAppAction(
  conversationRow,
  openWindow = globalThis.window?.open?.bind(globalThis.window)
) {
  const text = findConversationMessageText(conversationRow);

  if (!text) {
    return { ok: false, reason: 'message-not-found' };
  }

  const shareUrl = `${WHATSAPP_SHARE_URL}?text=${encodeURIComponent(text)}`;

  // `noopener` makes window.open return null even on success, so a blocked
  // pop-up cannot be told apart from a opened one. The click is a user gesture,
  // which keeps pop-up blocking unlikely.
  openWindow(shareUrl, '_blank', 'noopener,noreferrer');

  return { ok: true };
}
