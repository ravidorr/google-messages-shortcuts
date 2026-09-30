const MENU_ACTION_ATTRIBUTE = 'data-messages-shortcuts-menu-action';
const STYLE_SELECTOR = 'style[data-messages-shortcuts-menu-action-styles]';

const MENU_OVERLAY_HIDE_CSS = `
  html[${MENU_ACTION_ATTRIBUTE}="true"] .cdk-overlay-container .mat-mdc-menu-panel,
  html[${MENU_ACTION_ATTRIBUTE}="true"] .cdk-overlay-container .mat-menu-panel {
    opacity: 0 !important;
    pointer-events: none !important;
  }

  html[${MENU_ACTION_ATTRIBUTE}="true"] .cdk-overlay-container .cdk-overlay-backdrop {
    opacity: 0 !important;
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

export function beginMenuAction(documentRoot = document) {
  ensureStyles(documentRoot);
  documentRoot.documentElement.setAttribute(MENU_ACTION_ATTRIBUTE, 'true');
}

export function endMenuAction(documentRoot = document) {
  documentRoot.documentElement.removeAttribute(MENU_ACTION_ATTRIBUTE);
}

export { MENU_ACTION_ATTRIBUTE, STYLE_SELECTOR };
