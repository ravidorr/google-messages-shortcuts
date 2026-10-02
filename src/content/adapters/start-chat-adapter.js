import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE,
  createCapabilityResult
} from './capability-states.js';

export const START_CHAT_SELECTORS = {
  startChatFab: 'a[data-e2e-start-button]',
  startChatFabContainer: 'mw-fab-link.start-chat',
  nativeDialog: 'mat-dialog-container',
  newConversationSurface:
    'mws-new-conversation, [data-e2e-new-conversation], [data-e2e-new-conversation-view]'
};

export const START_CHAT_CAPABILITY_IDS = {
  entry: 'startChat.entry'
};

export const START_CHAT_NEW_CONVERSATION_PATH = '/web/conversations/new';

function isElementVisible(element) {
  if (element.closest('[hidden]')) {
    return false;
  }

  const view = element.ownerDocument?.defaultView;

  if (view && typeof view.getComputedStyle === 'function') {
    let current = element;

    while (current && current.nodeType === 1) {
      const style = view.getComputedStyle(current);

      if (style.visibility === 'hidden' || style.display === 'none') {
        return false;
      }

      current = current.parentElement;
    }
  }

  return true;
}

export function isViableStartChatButton(element) {
  if (!element?.matches?.('a[data-e2e-start-button]')) {
    return false;
  }

  if (
    element.hasAttribute('disabled')
    || element.getAttribute('aria-disabled') === 'true'
  ) {
    return false;
  }

  return isElementVisible(element);
}

export function findViableStartChatButtons(
  documentRoot,
  selectors = START_CHAT_SELECTORS
) {
  return [...documentRoot.querySelectorAll(selectors.startChatFab)]
    .filter(isViableStartChatButton);
}

export function findStartChatButton(documentRoot, selectors = START_CHAT_SELECTORS) {
  const matches = findViableStartChatButtons(documentRoot, selectors);

  if (matches.length !== 1) {
    return null;
  }

  return matches[0];
}

export function isNativeDialogOpen(documentRoot, selectors = START_CHAT_SELECTORS) {
  return Boolean(documentRoot.querySelector(selectors.nativeDialog));
}

export function isStartChatViewActive(documentRoot, selectors = START_CHAT_SELECTORS) {
  const pathname = documentRoot.defaultView?.location?.pathname || '';

  if (pathname.includes(START_CHAT_NEW_CONVERSATION_PATH)) {
    return true;
  }

  return Boolean(documentRoot.querySelector(selectors.newConversationSurface));
}

function assessStartChatEntryCapability(documentRoot, selectors) {
  const matches = findViableStartChatButtons(documentRoot, selectors);

  if (matches.length === 0) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'Start chat control is not present in the document.',
      'dom-query'
    );
  }

  if (matches.length > 1) {
    return createCapabilityResult(
      CAPABILITY_UNSAFE,
      'Multiple Start chat controls match the primary selector.',
      'dom-query'
    );
  }

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    'Start chat control is present in the document.',
    'dom-query'
  );
}

export function assessStartChatCapabilities(documentRoot, selectors = START_CHAT_SELECTORS) {
  return {
    [START_CHAT_CAPABILITY_IDS.entry]: assessStartChatEntryCapability(documentRoot, selectors)
  };
}

let openStartChatInFlight = false;

export function resetOpenStartChatInFlightForTests() {
  openStartChatInFlight = false;
}

export function waitForStartChatView(
  documentRoot,
  selectors = START_CHAT_SELECTORS,
  timeoutMs = 2000,
  pollIntervalMs = 100
) {
  const maxAttempts = Math.max(1, Math.ceil(timeoutMs / pollIntervalMs));
  let attempt = 0;

  return new Promise((resolve, reject) => {
    const poll = () => {
      if (isStartChatViewActive(documentRoot, selectors)) {
        resolve(true);
        return;
      }

      attempt += 1;

      if (attempt >= maxAttempts) {
        reject(new Error('start-chat-timeout'));
        return;
      }

      setTimeout(poll, pollIntervalMs);
    };

    poll();
  });
}

export async function openStartChat(
  documentRoot,
  selectors = START_CHAT_SELECTORS,
  waitForViewFn = waitForStartChatView,
  options = {}
) {
  if (openStartChatInFlight) {
    return { ok: false, reason: 'action-in-progress' };
  }

  openStartChatInFlight = true;

  try {
    return await openStartChatInternal(documentRoot, selectors, waitForViewFn, options);
  } finally {
    openStartChatInFlight = false;
  }
}

async function openStartChatInternal(
  documentRoot,
  selectors,
  waitForViewFn,
  options
) {
  const timeoutMs = options.timeoutMs ?? 5000;

  if (isStartChatViewActive(documentRoot, selectors)) {
    return { ok: true, alreadyOpen: true };
  }

  if (isNativeDialogOpen(documentRoot, selectors)) {
    return { ok: false, reason: 'native-dialog-open' };
  }

  const startChatButton = findStartChatButton(documentRoot, selectors);
  const matches = findViableStartChatButtons(documentRoot, selectors);

  if (matches.length === 0) {
    return { ok: false, reason: 'start-chat-not-found' };
  }

  if (!startChatButton) {
    return { ok: false, reason: 'start-chat-ambiguous' };
  }

  startChatButton.click();

  try {
    await waitForViewFn(documentRoot, selectors, timeoutMs);
    return { ok: true };
  } catch (_error) {
    if (isStartChatViewActive(documentRoot, selectors)) {
      return { ok: true };
    }

    return { ok: false, reason: 'start-chat-timeout' };
  }
}
