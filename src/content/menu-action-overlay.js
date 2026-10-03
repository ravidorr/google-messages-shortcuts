const MENU_ACTION_ATTRIBUTE = 'data-messages-shortcuts-menu-action';
const STYLE_SELECTOR = 'style[data-messages-shortcuts-menu-action-styles]';
const ROW_MENU_PANEL_SELECTOR = [
  '.conversation-actions-menu[role="menu"]',
  '[role="menu"].conversation-actions-menu',
  '.cdk-overlay-container .mat-mdc-menu-panel',
  '.cdk-overlay-container .mat-menu-panel'
].join(', ');

const MENU_OVERLAY_HIDE_CSS = `
  html[${MENU_ACTION_ATTRIBUTE}="true"] .conversation-actions-menu,
  html[${MENU_ACTION_ATTRIBUTE}="true"] [role="menu"].conversation-actions-menu,
  html[${MENU_ACTION_ATTRIBUTE}="true"] .mat-mdc-menu-panel.conversation-actions-menu,
  html[${MENU_ACTION_ATTRIBUTE}="true"] .cdk-overlay-container .mat-mdc-menu-panel,
  html[${MENU_ACTION_ATTRIBUTE}="true"] .cdk-overlay-container .mat-menu-panel {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  html[${MENU_ACTION_ATTRIBUTE}="true"] .cdk-overlay-container .cdk-overlay-backdrop {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }
`;

function ensureStyles(documentRoot) {
  if (documentRoot.querySelector(STYLE_SELECTOR)) {
    return;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-menu-action-styles', '');
  style.textContent = MENU_OVERLAY_HIDE_CSS;
  documentRoot.head.append(style);
}

function createEscapeKeyEvent() {
  return new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true,
    cancelable: true
  });
}

function dispatchEscapeKey(documentRoot) {
  const escapeTargets = [
    documentRoot.querySelector(ROW_MENU_PANEL_SELECTOR),
    documentRoot.activeElement,
    documentRoot
  ].filter(Boolean);

  for (const target of escapeTargets) {
    target.dispatchEvent(createEscapeKeyEvent());

    if (!isRowMenuOpen(documentRoot)) {
      return true;
    }
  }

  return false;
}

export function isRowMenuOpen(documentRoot = document) {
  return Boolean(documentRoot.querySelector(ROW_MENU_PANEL_SELECTOR));
}

export function dismissOpenRowMenu(documentRoot = document) {
  if (!isRowMenuOpen(documentRoot)) {
    return false;
  }

  if (dispatchEscapeKey(documentRoot)) {
    return true;
  }

  const backdrop = documentRoot.querySelector('.cdk-overlay-container .cdk-overlay-backdrop');
  backdrop?.click();

  return !isRowMenuOpen(documentRoot);
}

export function beginMenuAction(documentRoot = document) {
  ensureStyles(documentRoot);
  documentRoot.documentElement.setAttribute(MENU_ACTION_ATTRIBUTE, 'true');
}

export function endMenuAction(documentRoot = document) {
  dismissOpenRowMenu(documentRoot);
  documentRoot.documentElement.removeAttribute(MENU_ACTION_ATTRIBUTE);
  dismissOpenRowMenu(documentRoot);
}

export {
  MENU_ACTION_ATTRIBUTE,
  ROW_MENU_PANEL_SELECTOR,
  STYLE_SELECTOR
};
