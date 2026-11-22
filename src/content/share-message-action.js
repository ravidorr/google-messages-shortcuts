const SNIPPET_SELECTOR = 'mws-conversation-snippet';
const WHATSAPP_SHARE_URL = 'https://wa.me/';

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

// Reads only the row's native preview element. When that element is missing
// or empty there is no safe way to tell the message apart from the sender
// name or timestamp, so the row has no message text and no pill is offered.
// The preview can be truncated by Google Messages. The selector has not been
// validated against a live account yet; see phase1-action-decisions.md.
export function findConversationMessageText(conversationRow) {
  const snippet = conversationRow.querySelector(SNIPPET_SELECTOR);

  return normalizeText(snippet?.textContent ?? '') || null;
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

  if (typeof openWindow !== 'function') {
    return { ok: false, reason: 'window-unavailable' };
  }

  const shareUrl = `${WHATSAPP_SHARE_URL}?text=${encodeURIComponent(text)}`;

  try {
    // `noopener` makes window.open return null even on success, so a blocked
    // pop-up cannot be told apart from an opened tab. The result is therefore
    // reported as "opening", not "opened".
    openWindow(shareUrl, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.warn('[Messages Shortcut Actions] Failed to open WhatsApp.', error);

    return { ok: false, reason: 'share-open-failed' };
  }

  return { ok: true };
}
