import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyListCursorHighlight,
  clearListCursorHighlight,
  resetListCursorHighlightForTests
} from '../../src/content/list-cursor-highlight.js';

describe('list-cursor-highlight', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    resetListCursorHighlightForTests(document);
  });

  it('applies and clears a visible cursor on one conversation row', () => {
    document.body.innerHTML = `
      <mws-conversation-list-item id="row-a"><a href="/a"></a></mws-conversation-list-item>
      <mws-conversation-list-item id="row-b"><a href="/b"></a></mws-conversation-list-item>
    `;

    const rowA = document.getElementById('row-a');
    const rowB = document.getElementById('row-b');

    expect(applyListCursorHighlight(rowA, document)).toBe(true);
    expect(rowA.getAttribute('data-messages-shortcuts-list-cursor')).toBe('true');
    expect(rowB.hasAttribute('data-messages-shortcuts-list-cursor')).toBe(false);

    applyListCursorHighlight(rowB, document);
    expect(rowA.hasAttribute('data-messages-shortcuts-list-cursor')).toBe(false);
    expect(rowB.getAttribute('data-messages-shortcuts-list-cursor')).toBe('true');

    clearListCursorHighlight(document);
    expect(document.querySelector('[data-messages-shortcuts-list-cursor="true"]')).toBeNull();
  });

  it('returns false when no row is provided', () => {
    expect(applyListCursorHighlight(null, document)).toBe(false);
  });
});
