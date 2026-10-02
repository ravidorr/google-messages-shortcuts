import { isPaused } from '../shared/pause-preference.js';
import {
  PAGE_COMMAND_ESCAPE_TO_LIST,
  PAGE_COMMAND_FOCUS_COMPOSER,
  PAGE_COMMAND_NEXT_CONVERSATION,
  PAGE_COMMAND_NEXT_UNREAD,
  PAGE_COMMAND_OPEN_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_UNREAD,
  PAGE_COMMAND_RETURN_PREVIOUS
} from '../shared/page-commands.js';
import { SELECTORS } from './google-messages-dom.js';
import { focusComposer } from './focus-composer-action.js';
import { LIST_CURSOR_ROW_SELECTOR } from './list-cursor-highlight.js';
import {
  enumerateLoadedConversationRows,
  findNativeListRowIndex,
  findRowConversationLink,
  focusConversationLink,
  focusCursorByIdentity,
  focusListContainer,
  getConversationLinkIdentity,
  moveToAdjacentRowIdentity,
  moveToAdjacentUnreadIdentity,
  openCursorByIdentity,
  requestNativeListRowFocus,
  resolveCursorIdentity
} from './list-navigation.js';
import {
  consumePreviousConversationIdentity,
  recordOpenedConversation
} from './navigation-history.js';
import { showNavigationFeedback } from './navigation-feedback.js';

let currentCursorIdentity = null;

export function isInboxListView(locationRef = globalThis.location) {
  return /^\/web\/conversations\/?$/.test(locationRef.pathname);
}

export function getCurrentCursorIdentity() {
  return currentCursorIdentity;
}

export function setCurrentCursorIdentity(identity) {
  currentCursorIdentity = identity;
}

export function resetPageNavigationStateForTests() {
  currentCursorIdentity = null;
}

export function mapReturnNavigationFailure(result) {
  if (result.ok) {
    return result;
  }

  switch (result.reason) {
    case 'cursor-ambiguous':
      return { ok: false, reason: 'return-ambiguous' };
    case 'cursor-not-found':
      return { ok: false, reason: 'return-not-found' };
    default:
      return result;
  }
}

function applyCursorResult(result) {
  if (result.ok && result.identity) {
    currentCursorIdentity = result.identity;
  }

  return result;
}

export async function executePageNavigationCommand(
  command,
  documentRoot = document,
  chromeApi = chrome,
  selectors = SELECTORS
) {
  if (await isPaused(chromeApi)) {
    const result = { ok: false, reason: 'extension-paused' };
    showNavigationFeedback(result, command, documentRoot);

    return result;
  }

  let result;

  switch (command) {
    case PAGE_COMMAND_NEXT_CONVERSATION:
      result = applyCursorResult(
        moveToAdjacentRowIdentity(documentRoot, currentCursorIdentity, 'next', selectors)
      );
      break;
    case PAGE_COMMAND_PREVIOUS_CONVERSATION:
      result = applyCursorResult(
        moveToAdjacentRowIdentity(documentRoot, currentCursorIdentity, 'previous', selectors)
      );
      break;
    case PAGE_COMMAND_OPEN_CONVERSATION: {
      const identity = resolveCursorIdentity(documentRoot, currentCursorIdentity, selectors);

      if (!identity) {
        result = { ok: false, reason: 'cursor-not-found' };
        break;
      }

      result = openCursorByIdentity(documentRoot, identity, selectors);

      if (result.ok) {
        recordOpenedConversation(identity);
        currentCursorIdentity = identity;
      }

      break;
    }
    case PAGE_COMMAND_RETURN_PREVIOUS: {
      const previousIdentity = consumePreviousConversationIdentity();

      if (!previousIdentity) {
        result = { ok: false, reason: 'no-return-history' };
        break;
      }

      result = mapReturnNavigationFailure(
        openCursorByIdentity(documentRoot, previousIdentity, selectors)
      );

      if (!result.ok) {
        break;
      }

      recordOpenedConversation(previousIdentity);
      currentCursorIdentity = previousIdentity;
      break;
    }
    case PAGE_COMMAND_NEXT_UNREAD:
      result = applyCursorResult(
        moveToAdjacentUnreadIdentity(documentRoot, currentCursorIdentity, 'next', selectors)
      );
      break;
    case PAGE_COMMAND_PREVIOUS_UNREAD:
      result = applyCursorResult(
        moveToAdjacentUnreadIdentity(documentRoot, currentCursorIdentity, 'previous', selectors)
      );
      break;
    case PAGE_COMMAND_ESCAPE_TO_LIST:
      result = applyCursorResult(focusListContainer(documentRoot, selectors));
      break;
    case PAGE_COMMAND_FOCUS_COMPOSER:
      result = focusComposer(documentRoot);
      break;
    default:
      result = { ok: false, reason: 'unknown-command' };
  }

  showNavigationFeedback(result, command, documentRoot);

  return result;
}

export function syncCursorFromDocument(documentRoot = document, selectors = SELECTORS) {
  currentCursorIdentity = resolveCursorIdentity(documentRoot, currentCursorIdentity, selectors);

  return currentCursorIdentity;
}

export function focusCurrentCursor(documentRoot = document, selectors = SELECTORS) {
  const identity = resolveCursorIdentity(documentRoot, currentCursorIdentity, selectors);

  if (!identity) {
    return { ok: false, reason: 'cursor-not-found' };
  }

  return focusCursorByIdentity(documentRoot, identity, selectors);
}

export async function establishInitialListCursor(
  documentRoot = document,
  selectors = SELECTORS,
  chromeApi = globalThis.chrome,
  locationRef = globalThis.location
) {
  if (!isInboxListView(locationRef)) {
    return null;
  }

  if (await isPaused(chromeApi)) {
    return null;
  }

  const rows = enumerateLoadedConversationRows(documentRoot, selectors);

  if (rows.length === 0) {
    return null;
  }

  if (findNativeListRowIndex(documentRoot, rows, selectors) >= 0) {
    return syncCursorFromDocument(documentRoot, selectors);
  }

  if (documentRoot.querySelector(LIST_CURSOR_ROW_SELECTOR)) {
    return getCurrentCursorIdentity();
  }

  if (currentCursorIdentity) {
    return currentCursorIdentity;
  }

  requestNativeListRowFocus(documentRoot);

  const rowsAfterNativeFocus = enumerateLoadedConversationRows(documentRoot, selectors);
  const nativeIndex = findNativeListRowIndex(documentRoot, rowsAfterNativeFocus, selectors);

  if (nativeIndex >= 0) {
    const nativeRow = rowsAfterNativeFocus[nativeIndex];
    const nativeLink = findRowConversationLink(nativeRow, selectors);
    const nativeIdentity = getConversationLinkIdentity(nativeLink);

    if (nativeIdentity && focusConversationLink(nativeLink, selectors)) {
      currentCursorIdentity = nativeIdentity;

      return nativeIdentity;
    }
  }

  const firstLink = findRowConversationLink(rows[0], selectors);
  const firstIdentity = getConversationLinkIdentity(firstLink);

  if (!firstIdentity || !focusConversationLink(firstLink, selectors)) {
    return null;
  }

  currentCursorIdentity = firstIdentity;

  return firstIdentity;
}
