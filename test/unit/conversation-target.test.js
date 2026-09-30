import { beforeEach, describe, expect, it } from 'vitest';
import {
  findConversationRow,
  findRowMenuButton
} from '../../src/content/conversation-target.js';

function createConversationRow(options = {}) {
  const row = document.createElement('mws-conversation-list-item');
  const link = document.createElement('a');

  if (options.selected) {
    link.setAttribute('aria-selected', 'true');
  }

  const menuButton = document.createElement('button');
  menuButton.setAttribute('aria-haspopup', 'menu');

  row.append(link, menuButton);

  return { row, link, menuButton };
}

describe('conversation-target', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('prefers the selected conversation row', () => {
    const selected = createConversationRow({ selected: true });
    const hovered = createConversationRow();
    hovered.row.classList.add('hover');

    document.body.append(selected.row, hovered.row);

    expect(findConversationRow(document)).toBe(selected.row);
  });

  it('uses the focused conversation row when none is selected', () => {
    const focused = createConversationRow();
    focused.row.setAttribute('is-focused', 'true');
    document.body.append(focused.row);

    expect(findConversationRow(document)).toBe(focused.row);
  });

  it('prefers the selected conversation row over a focused row', () => {
    const selected = createConversationRow({ selected: true });
    const focused = createConversationRow();
    focused.row.setAttribute('is-focused', 'true');
    document.body.append(selected.row, focused.row);

    expect(findConversationRow(document)).toBe(selected.row);
  });

  it('falls back when the selected link is not in a conversation row', () => {
    const selectedLink = document.createElement('a');
    selectedLink.setAttribute('aria-selected', 'true');
    const focused = createConversationRow();
    focused.row.setAttribute('is-focused', 'true');
    document.body.append(selectedLink, focused.row);

    const selectors = {
      selectedConversationLink: 'a[aria-selected="true"]',
      focusedConversationItem: 'mws-conversation-list-item[is-focused="true"]',
      hoveredConversationItem: 'mws-conversation-list-item:hover',
      conversationRow: 'mws-conversation-list-item',
      rowMenuButton: 'button[aria-haspopup="menu"]'
    };

    expect(findConversationRow(document, selectors)).toBe(focused.row);
  });

  it('falls back to the hovered conversation row', () => {
    document.body.innerHTML = `
      <mws-conversation-list-item class="hovered-row">
        <a></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    const hoveredSelectors = {
      selectedConversationLink: 'mws-conversation-list-item a[aria-selected="true"]',
      focusedConversationItem: 'mws-conversation-list-item[is-focused="true"]',
      hoveredConversationItem: 'mws-conversation-list-item.hovered-row',
      conversationRow: 'mws-conversation-list-item',
      rowMenuButton: 'button[aria-haspopup="menu"], mws-menu-button button'
    };

    expect(findConversationRow(document, hoveredSelectors)).not.toBeNull();
  });

  it('returns null when no row is available', () => {
    expect(findConversationRow(document)).toBeNull();
  });

  it('finds the menu button within the row', () => {
    const { row, menuButton } = createConversationRow({ selected: true });
    document.body.append(row);

    expect(findRowMenuButton(row)).toBe(menuButton);
  });

  it('returns null when the conversation row is missing', () => {
    expect(findRowMenuButton(null)).toBeNull();
  });
});
