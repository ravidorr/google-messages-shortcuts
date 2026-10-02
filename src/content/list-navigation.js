import { LIST_SELECTORS } from './adapters/list-adapter.js';
import {
  applyListCursorHighlight,
  clearListCursorHighlight
} from './list-cursor-highlight.js';

export function findRowConversationLink(conversationRow, selectors) {
  return conversationRow.querySelector(selectors.conversationLink)
    || conversationRow.querySelector('a');
}

export function getConversationLinkIdentity(link) {
  if (!link) {
    return null;
  }

  const href = link.getAttribute('href');

  if (href) {
    return `href:${href}`;
  }

  return null;
}

export function enumerateLoadedConversationRows(documentRoot, selectors = LIST_SELECTORS) {
  return [...documentRoot.querySelectorAll(selectors.conversationRow)];
}

export function findConversationLinksByIdentity(documentRoot, identity, selectors = LIST_SELECTORS) {
  if (!identity) {
    return [];
  }

  return enumerateLoadedConversationRows(documentRoot, selectors)
    .map((row) => findRowConversationLink(row, selectors))
    .filter((link) => link && getConversationLinkIdentity(link) === identity);
}

export function findUniqueConversationRowByIdentity(documentRoot, identity, selectors = LIST_SELECTORS) {
  const links = findConversationLinksByIdentity(documentRoot, identity, selectors);

  if (links.length !== 1) {
    return null;
  }

  return links[0].closest(selectors.conversationRow);
}

export function isUnreadConversationRow(row, selectors = LIST_SELECTORS) {
  if (!row) {
    return false;
  }

  return Boolean(
    row.querySelector(selectors.unreadConversationMarker)
    || row.querySelector(`${selectors.conversationLink}${selectors.unreadConversationMarker}`)
  );
}

export function findConversationListRoot(documentRoot) {
  return documentRoot.querySelector('mws-conversation-list')
    || documentRoot.querySelector('mws-conversations-list');
}

export function findNativeListRowIndex(documentRoot, rows, selectors = LIST_SELECTORS) {
  for (let index = 0; index < rows.length; index += 1) {
    if (rows[index].matches(selectors.focusedConversationItem)) {
      return index;
    }
  }

  const selectedLink = documentRoot.querySelector(selectors.selectedConversationLink);

  if (selectedLink) {
    const selectedIndex = rows.findIndex((row) => row.contains(selectedLink));

    if (selectedIndex >= 0) {
      return selectedIndex;
    }
  }

  return -1;
}

export function resolveNavigationRowIndex(documentRoot, cursorIdentity, selectors = LIST_SELECTORS) {
  const rows = enumerateLoadedConversationRows(documentRoot, selectors);

  if (cursorIdentity) {
    const cursorIndex = rows.findIndex((row) => {
      const link = findRowConversationLink(row, selectors);

      return getConversationLinkIdentity(link) === cursorIdentity;
    });

    if (cursorIndex >= 0) {
      return cursorIndex;
    }
  }

  return findNativeListRowIndex(documentRoot, rows, selectors);
}

export function requestNativeListRowFocus(documentRoot, direction = 'next') {
  const listRoot = findConversationListRoot(documentRoot);

  if (!listRoot) {
    return false;
  }

  if (typeof listRoot.focus === 'function') {
    if (!listRoot.hasAttribute('tabindex')) {
      listRoot.setAttribute('tabindex', '-1');
    }

    listRoot.focus({ preventScroll: false });
  }

  const key = direction === 'previous' ? 'ArrowUp' : 'ArrowDown';
  const eventInit = {
    key,
    code: key,
    bubbles: true,
    cancelable: true
  };

  listRoot.dispatchEvent(new KeyboardEvent('keydown', eventInit));
  listRoot.dispatchEvent(new KeyboardEvent('keyup', eventInit));

  return true;
}

export function resolveCursorIdentity(documentRoot, cursorIdentity, selectors = LIST_SELECTORS) {
  if (cursorIdentity) {
    const row = findUniqueConversationRowByIdentity(documentRoot, cursorIdentity, selectors);

    if (row) {
      return cursorIdentity;
    }
  }

  const rows = enumerateLoadedConversationRows(documentRoot, selectors);

  for (const row of rows) {
    if (row.matches(selectors.focusedConversationItem)) {
      const link = findRowConversationLink(row, selectors);
      const identity = getConversationLinkIdentity(link);

      if (identity) {
        return identity;
      }
    }
  }

  const selectedLink = documentRoot.querySelector(selectors.selectedConversationLink);

  if (selectedLink) {
    const identity = getConversationLinkIdentity(selectedLink);

    if (identity) {
      return identity;
    }
  }

  if (rows.length > 0) {
    const link = findRowConversationLink(rows[0], selectors);

    return getConversationLinkIdentity(link);
  }

  return null;
}

export function focusConversationLink(link, selectors = LIST_SELECTORS) {
  if (!link) {
    return false;
  }

  const conversationRow = link.closest(selectors.conversationRow);
  const documentRoot = link.ownerDocument;

  if (!link.hasAttribute('tabindex')) {
    link.setAttribute('tabindex', '-1');
  }

  if (link.focus) {
    link.focus({ preventScroll: false });
  }

  if (documentRoot && link.isConnected) {
    link.dispatchEvent(new FocusEvent('focusin', {
      bubbles: true,
      cancelable: true
    }));
  }

  if (conversationRow) {
    applyListCursorHighlight(conversationRow, conversationRow.ownerDocument);

    if (typeof conversationRow.scrollIntoView === 'function') {
      conversationRow.scrollIntoView({ block: 'nearest' });
    }
  }

  return Boolean(conversationRow) || document.activeElement === link;
}

export function openConversationLink(link) {
  if (!link) {
    return false;
  }

  link.click();

  return true;
}

export function moveToAdjacentRowIdentity(documentRoot, cursorIdentity, direction, selectors = LIST_SELECTORS) {
  const rows = enumerateLoadedConversationRows(documentRoot, selectors);

  if (rows.length === 0) {
    return { ok: false, reason: 'no-rows' };
  }

  const currentIndex = resolveNavigationRowIndex(documentRoot, cursorIdentity, selectors);

  const nextIndex = direction === 'next'
    ? Math.min(currentIndex + 1, rows.length - 1)
    : Math.max(currentIndex - 1, 0);

  if (currentIndex === nextIndex && currentIndex >= 0) {
    return { ok: false, reason: direction === 'next' ? 'at-last-row' : 'at-first-row' };
  }

  const targetRow = rows[nextIndex];
  const targetLink = findRowConversationLink(targetRow, selectors);
  const targetIdentity = getConversationLinkIdentity(targetLink);

  if (!targetIdentity) {
    return { ok: false, reason: 'missing-link-identity' };
  }

  focusConversationLink(targetLink);

  return {
    ok: true,
    identity: targetIdentity,
    loadedRowCount: rows.length
  };
}

export function moveToAdjacentUnreadIdentity(
  documentRoot,
  cursorIdentity,
  direction,
  selectors = LIST_SELECTORS
) {
  const rows = enumerateLoadedConversationRows(documentRoot, selectors);
  const unreadRows = rows.filter((row) => isUnreadConversationRow(row, selectors));

  if (unreadRows.length === 0) {
    return { ok: false, reason: 'no-unread-loaded' };
  }

  let cursorRowIndex = -1;

  if (cursorIdentity) {
    const cursorRow = findUniqueConversationRowByIdentity(documentRoot, cursorIdentity, selectors);

    if (cursorRow) {
      cursorRowIndex = rows.indexOf(cursorRow);
    }
  } else {
    cursorRowIndex = findNativeListRowIndex(documentRoot, rows, selectors);
  }

  let nextUnreadIndex = -1;

  if (cursorRowIndex < 0) {
    nextUnreadIndex = direction === 'next' ? 0 : unreadRows.length - 1;
  } else {
    const cursorRow = rows[cursorRowIndex];
    const currentUnreadIndex = unreadRows.indexOf(cursorRow);

    if (currentUnreadIndex >= 0) {
      nextUnreadIndex = direction === 'next'
        ? currentUnreadIndex + 1
        : currentUnreadIndex - 1;
    } else if (direction === 'next') {
      const nextUnreadRow = rows
        .slice(cursorRowIndex + 1)
        .find((row) => isUnreadConversationRow(row, selectors));

      if (nextUnreadRow) {
        nextUnreadIndex = unreadRows.indexOf(nextUnreadRow);
      }
    } else {
      const previousUnreadRow = rows
        .slice(0, cursorRowIndex)
        .reverse()
        .find((row) => isUnreadConversationRow(row, selectors));

      if (previousUnreadRow) {
        nextUnreadIndex = unreadRows.indexOf(previousUnreadRow);
      }
    }
  }

  if (nextUnreadIndex < 0 || nextUnreadIndex >= unreadRows.length) {
    return {
      ok: false,
      reason: 'unread-boundary',
      loadedUnreadCount: unreadRows.length,
      loadedRowCount: rows.length
    };
  }

  const targetRow = unreadRows[nextUnreadIndex];
  const targetLink = findRowConversationLink(targetRow, selectors);
  const targetIdentity = getConversationLinkIdentity(targetLink);

  if (!targetIdentity) {
    return { ok: false, reason: 'missing-link-identity' };
  }

  focusConversationLink(targetLink);

  return {
    ok: true,
    identity: targetIdentity,
    loadedUnreadCount: unreadRows.length,
    loadedRowCount: rows.length
  };
}

export function focusCursorByIdentity(documentRoot, identity, selectors = LIST_SELECTORS) {
  const links = findConversationLinksByIdentity(documentRoot, identity, selectors);

  if (links.length !== 1) {
    return { ok: false, reason: links.length === 0 ? 'cursor-not-found' : 'cursor-ambiguous' };
  }

  focusConversationLink(links[0]);

  return { ok: true, identity };
}

export function openCursorByIdentity(documentRoot, identity, selectors = LIST_SELECTORS) {
  const links = findConversationLinksByIdentity(documentRoot, identity, selectors);

  if (links.length !== 1) {
    return { ok: false, reason: links.length === 0 ? 'cursor-not-found' : 'cursor-ambiguous' };
  }

  openConversationLink(links[0]);

  return { ok: true, identity };
}

export function focusListContainer(documentRoot, selectors = LIST_SELECTORS) {
  clearListCursorHighlight(documentRoot);
  const firstRow = enumerateLoadedConversationRows(documentRoot, selectors)[0];

  if (!firstRow) {
    const listRoot = documentRoot.querySelector('mws-conversation-list, mws-conversations-list');

    if (listRoot?.focus) {
      if (!listRoot.hasAttribute('tabindex')) {
        listRoot.setAttribute('tabindex', '-1');
      }

      listRoot.focus({ preventScroll: false });

      return { ok: true, identity: null };
    }

    return { ok: false, reason: 'list-not-found' };
  }

  const link = findRowConversationLink(firstRow, selectors);

  if (link) {
    focusConversationLink(link);

    return { ok: true, identity: getConversationLinkIdentity(link) };
  }

  return { ok: false, reason: 'list-not-found' };
}
