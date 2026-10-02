export const LIST_CURSOR_ROW_SELECTOR = '[data-messages-shortcuts-list-cursor="true"]';
export const LIST_CURSOR_STYLE_SELECTOR = 'style[data-messages-shortcuts-list-cursor-styles]';

export function ensureListCursorStyles(documentRoot) {
  if (documentRoot.querySelector(LIST_CURSOR_STYLE_SELECTOR)) {
    return;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-list-cursor-styles', '');
  style.textContent = `
    [data-messages-shortcuts-list-cursor="true"] {
      background-color: rgba(26, 115, 232, 0.08) !important;
      box-shadow: inset 0 0 0 2px #1a73e8 !important;
      outline: 2px solid #1a73e8;
      outline-offset: -2px;
    }
  `;
  documentRoot.head.append(style);
}

export function clearListCursorHighlight(documentRoot = document) {
  for (const row of documentRoot.querySelectorAll(LIST_CURSOR_ROW_SELECTOR)) {
    row.removeAttribute('data-messages-shortcuts-list-cursor');
  }
}

export function applyListCursorHighlight(conversationRow, documentRoot = document) {
  if (!conversationRow) {
    return false;
  }

  ensureListCursorStyles(documentRoot);
  clearListCursorHighlight(documentRoot);
  conversationRow.setAttribute('data-messages-shortcuts-list-cursor', 'true');

  return true;
}

export function resetListCursorHighlightForTests(documentRoot = document) {
  clearListCursorHighlight(documentRoot);
  documentRoot.querySelector(LIST_CURSOR_STYLE_SELECTOR)?.remove();
}
