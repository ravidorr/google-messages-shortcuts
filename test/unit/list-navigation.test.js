import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enumerateLoadedConversationRows,
  findConversationLinksByIdentity,
  findNativeListRowIndex,
  findUniqueConversationRowByIdentity,
  focusConversationLink,
  focusListContainer,
  getConversationLinkIdentity,
  moveToAdjacentRowIdentity,
  moveToAdjacentUnreadIdentity,
  openConversationLink,
  requestNativeListRowFocus,
  resolveCursorIdentity,
  resolveNavigationRowIndex
} from '../../src/content/list-navigation.js';
import {
  duplicateConversationLinkList,
  multiRowNavigationList,
  unfocusedMultiRowNavigationList
} from '../fixtures/dom/list-states.js';

describe('list-navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('derives conversation link identity from href', () => {
    const link = document.createElement('a');
    link.setAttribute('href', '/web/conversations/a');

    expect(getConversationLinkIdentity(link)).toBe('href:/web/conversations/a');
  });

  it('moves across loaded rows and focuses the conversation link', () => {
    document.body.innerHTML = multiRowNavigationList;

    const localThis = moveToAdjacentRowIdentity(document, 'href:/web/conversations/a', 'next');

    expect(localThis.ok).toBe(true);
    expect(localThis.identity).toBe('href:/web/conversations/b');
    expect(document.activeElement.getAttribute('href')).toBe('/web/conversations/b');
    expect(document.querySelector('[data-messages-shortcuts-list-cursor="true"]')).not.toBeNull();
  });

  it('reports list boundaries and unread coverage limits', () => {
    document.body.innerHTML = multiRowNavigationList;

    const first = moveToAdjacentRowIdentity(document, 'href:/web/conversations/a', 'previous');
    const last = moveToAdjacentRowIdentity(document, 'href:/web/conversations/c', 'next');
    const unreadMove = moveToAdjacentUnreadIdentity(document, 'href:/web/conversations/c', 'next');

    expect(first.reason).toBe('at-first-row');
    expect(last.reason).toBe('at-last-row');
    expect(unreadMove.reason).toBe('unread-boundary');
    expect(unreadMove.loadedUnreadCount).toBe(2);
  });

  it('resolves cursor identity from focused and selected rows', () => {
    document.body.innerHTML = multiRowNavigationList;

    expect(resolveCursorIdentity(document, null)).toBe('href:/web/conversations/b');
    expect(enumerateLoadedConversationRows(document)).toHaveLength(3);
  });

  it('starts navigation from the first row when no cursor or native focus exists', () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;

    expect(resolveNavigationRowIndex(document, null)).toBe(-1);
    expect(findNativeListRowIndex(document, enumerateLoadedConversationRows(document))).toBe(-1);

    const localThis = moveToAdjacentRowIdentity(document, null, 'next');

    expect(localThis.ok).toBe(true);
    expect(localThis.identity).toBe('href:/web/conversations/a');
    expect(document.activeElement.getAttribute('href')).toBe('/web/conversations/a');
  });

  it('ignores aria-selected rows that are outside the provided loaded row set', () => {
    document.body.innerHTML = `
      <mws-conversation-list-item id="fixture-row-a">
        <a href="/web/conversations/a" data-e2e-conversation></a>
      </mws-conversation-list-item>
      <mws-conversation-list-item id="fixture-row-b">
        <a href="/web/conversations/b" data-e2e-conversation aria-selected="true"></a>
      </mws-conversation-list-item>
    `;

    const localThis = findNativeListRowIndex(
      document,
      [document.getElementById('fixture-row-a')]
    );

    expect(localThis).toBe(-1);
  });

  it('resolves native list row index from aria-selected conversation links', () => {
    document.body.innerHTML = `
      <mws-conversation-list-item id="fixture-row-a">
        <a href="/web/conversations/a" data-e2e-conversation></a>
      </mws-conversation-list-item>
      <mws-conversation-list-item id="fixture-row-b">
        <a href="/web/conversations/b" data-e2e-conversation aria-selected="true"></a>
      </mws-conversation-list-item>
    `;

    const localThis = findNativeListRowIndex(document, enumerateLoadedConversationRows(document));

    expect(localThis).toBe(1);
    expect(resolveNavigationRowIndex(document, null)).toBe(1);
  });

  it('requests native list focus through keyboard events on the conversation list', () => {
    document.body.innerHTML = `
      <mws-conversation-list tabindex="-1"></mws-conversation-list>
      ${unfocusedMultiRowNavigationList}
    `;
    const listRoot = document.querySelector('mws-conversation-list');
    const keydownSpy = vi.spyOn(listRoot, 'dispatchEvent');
    const focusSpy = vi.spyOn(listRoot, 'focus');

    expect(requestNativeListRowFocus(document, 'previous')).toBe(true);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: false });
    expect(keydownSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'keydown',
      key: 'ArrowUp'
    }));

    const setAttributeSpy = vi.spyOn(listRoot, 'setAttribute');
    expect(requestNativeListRowFocus(document)).toBe(true);
    expect(setAttributeSpy).not.toHaveBeenCalled();

    keydownSpy.mockRestore();
    focusSpy.mockRestore();
    setAttributeSpy.mockRestore();
  });

  it('returns false when the conversation list root is missing or cannot be focused', () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    expect(requestNativeListRowFocus(document)).toBe(false);

    const listRoot = document.createElement('mws-conversation-list');
    listRoot.focus = null;
    document.body.prepend(listRoot);
    expect(requestNativeListRowFocus(document)).toBe(true);
  });

  it('adds tabindex to the conversation list before requesting native focus', () => {
    document.body.innerHTML = '<mws-conversation-list></mws-conversation-list>';
    const listRoot = document.querySelector('mws-conversation-list');
    const setAttributeSpy = vi.spyOn(listRoot, 'setAttribute');

    expect(requestNativeListRowFocus(document)).toBe(true);
    expect(setAttributeSpy).toHaveBeenCalledWith('tabindex', '-1');
    setAttributeSpy.mockRestore();
  });

  it('falls back to native focus when the stored cursor identity is stale', () => {
    document.body.innerHTML = multiRowNavigationList;

    expect(resolveNavigationRowIndex(document, 'href:/web/conversations/missing')).toBe(1);
  });

  it('ignores stale unread cursor identities and jumps to the first unread row', () => {
    document.body.innerHTML = multiRowNavigationList;

    const localThis = moveToAdjacentUnreadIdentity(
      document,
      'href:/web/conversations/missing',
      'next'
    );

    expect(localThis.ok).toBe(true);
    expect(localThis.identity).toBe('href:/web/conversations/b');
  });

  it('jumps to the last unread row when the cursor identity is missing and direction is previous', () => {
    document.body.innerHTML = multiRowNavigationList;

    const localThis = moveToAdjacentUnreadIdentity(
      document,
      'href:/web/conversations/missing',
      'previous'
    );

    expect(localThis.ok).toBe(true);
    expect(localThis.identity).toBe('href:/web/conversations/c');
  });

  it('reports an unread boundary when no unread rows exist after a read cursor', () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a href="/web/conversations/u1" data-e2e-conversation data-e2e-is-unread="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <mws-conversation-list-item>
        <a href="/web/conversations/r1" data-e2e-conversation></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    const localThis = moveToAdjacentUnreadIdentity(
      document,
      'href:/web/conversations/r1',
      'next'
    );

    expect(localThis.ok).toBe(false);
    expect(localThis.reason).toBe('unread-boundary');
  });

  it('fails closed for ambiguous conversation link identities', () => {
    document.body.innerHTML = duplicateConversationLinkList;
    const identity = 'href:/web/conversations/shared';

    expect(findConversationLinksByIdentity(document, identity)).toHaveLength(2);
    expect(findUniqueConversationRowByIdentity(document, identity)).toBeNull();
  });

  it('does not overwrite tabindex when the conversation link already has one', () => {
    document.body.innerHTML = multiRowNavigationList;
    const link = document.querySelector('a[href="/web/conversations/a"]');
    link.setAttribute('tabindex', '0');
    const setAttributeSpy = vi.spyOn(link, 'setAttribute');

    expect(focusConversationLink(link)).toBe(true);
    expect(setAttributeSpy).not.toHaveBeenCalledWith('tabindex', '-1');
    setAttributeSpy.mockRestore();
  });

  it('opens conversation links and focuses the list container', () => {
    document.body.innerHTML = multiRowNavigationList;
    const link = document.querySelector('a[href="/web/conversations/a"]');
    const row = link.closest('mws-conversation-list-item');
    const clickSpy = vi.spyOn(link, 'click').mockImplementation(() => {});
    const scrollIntoView = vi.fn();
    row.scrollIntoView = scrollIntoView;

    expect(openConversationLink(link)).toBe(true);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(focusConversationLink(link)).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    clickSpy.mockRestore();
  });

  it('focuses the native list container when no rows are loaded', () => {
    document.body.innerHTML = '<mws-conversation-list tabindex="-1"></mws-conversation-list>';
    const localThis = focusListContainer(document);

    expect(localThis.ok).toBe(true);
  });

  it('fails closed when no list rows or list container exist', () => {
    document.body.innerHTML = '';
    expect(focusListContainer(document).reason).toBe('list-not-found');
  });

  it('moves to the next unread row from a known unread cursor', () => {
    document.body.innerHTML = multiRowNavigationList;

    const localThis = moveToAdjacentUnreadIdentity(
      document,
      'href:/web/conversations/b',
      'next'
    );

    expect(localThis.ok).toBe(true);
    expect(localThis.identity).toBe('href:/web/conversations/c');
  });

  it('reports an unread boundary when no unread rows exist before a read cursor', () => {
    document.body.innerHTML = multiRowNavigationList;

    const localThis = moveToAdjacentUnreadIdentity(
      document,
      'href:/web/conversations/a',
      'previous'
    );

    expect(localThis.ok).toBe(false);
    expect(localThis.reason).toBe('unread-boundary');
  });

  it('moves to the nearest unread row relative to a read cursor', () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a href="/web/conversations/u1" data-e2e-conversation data-e2e-is-unread="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <mws-conversation-list-item>
        <a href="/web/conversations/r1" data-e2e-conversation></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <mws-conversation-list-item>
        <a href="/web/conversations/u2" data-e2e-conversation data-e2e-is-unread="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    expect(moveToAdjacentUnreadIdentity(document, 'href:/web/conversations/r1', 'next').identity)
      .toBe('href:/web/conversations/u2');
    expect(moveToAdjacentUnreadIdentity(document, 'href:/web/conversations/r1', 'previous').identity)
      .toBe('href:/web/conversations/u1');
  });
});
