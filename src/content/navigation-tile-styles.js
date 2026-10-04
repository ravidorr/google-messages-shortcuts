import {
  classifyMessageTheme,
  MESSAGE_THEME_ATTRIBUTE,
  MESSAGE_THEME_DARK,
  MESSAGE_THEME_LIGHT,
  syncMessageTheme
} from './message-theme.js';

export const NAV_TILE_ROW_CLASS = 'gm-nav-row';
export const NAV_TILE_ROW_ATTRIBUTE = 'data-messages-shortcuts-fab-row';
export const NAV_TILE_ARCHIVED_ATTRIBUTE = 'data-messages-shortcuts-archived-fab';
export const NAV_TILE_SPAM_ATTRIBUTE = 'data-messages-shortcuts-spam-blocked-fab';
export const NAV_TILE_STYLE_SELECTOR = 'style[data-messages-shortcuts-navigation-tile-styles]';
export const NAV_TILE_DISABLED_ATTRIBUTE = 'data-messages-shortcuts-tile-disabled';
export const NAV_TILE_BADGE_ATTRIBUTE = 'data-messages-shortcuts-navigation-shortcut';
export const NAV_TILE_BADGE_HOST_CLASS = 'gm-nav-tile-badge-host';
export const NAV_TILE_THEME_ATTRIBUTE = MESSAGE_THEME_ATTRIBUTE;
export const NAV_TILE_THEME_LIGHT = MESSAGE_THEME_LIGHT;
export const NAV_TILE_THEME_DARK = MESSAGE_THEME_DARK;
export const classifyNavigationTileTheme = classifyMessageTheme;
export const syncNavigationTileTheme = syncMessageTheme;

const LEGACY_RESET = `
  backdrop-filter: none !important;
  bottom: auto !important;
  box-shadow: none !important;
  filter: none !important;
  left: auto !important;
  margin: 0 !important;
  opacity: 1 !important;
  position: relative !important;
  right: auto !important;
  text-shadow: none !important;
  top: auto !important;
  transform: none !important;
`;

function buildNavigationTileStylesheet() {
  return `
    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] {
      all: unset;
      box-sizing: border-box !important;
      display: grid !important;
      gap: 8px !important;
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      margin-top: 8px !important;
      min-width: 0 !important;
      overflow: visible !important;
      padding: 6px 8px 12px !important;
      position: static !important;
      width: 100% !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] > mw-fab-link {
      all: unset;
      box-sizing: border-box !important;
      display: block !important;
      height: 64px !important;
      ${LEGACY_RESET}
      min-width: 0 !important;
      width: 100% !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] > mw-fab-link > a.fab {
      all: unset;
      align-items: center !important;
      ${LEGACY_RESET}
      border: none !important;
      border-radius: 16px !important;
      box-sizing: border-box !important;
      cursor: pointer !important;
      display: inline-flex !important;
      flex-direction: column !important;
      font-family: system-ui, sans-serif !important;
      gap: 2px !important;
      height: 64px !important;
      justify-content: center !important;
      max-width: none !important;
      min-height: 64px !important;
      min-width: 0 !important;
      padding: 6px 2px !important;
      text-decoration: none !important;
      width: 100% !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] > mw-fab-link > a.fab.gm-nav-tile-start {
      background: #d3e3fd !important;
      background-image: none !important;
      color: #041e49 !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] > mw-fab-link > a.fab.gm-nav-tile-neutral {
      background: #f0f4f9 !important;
      background-image: none !important;
      color: #1f1f1f !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] > mw-fab-link > a.fab.gm-nav-tile-start {
      background: #303134 !important;
      color: #e8eaed !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] > mw-fab-link > a.fab.gm-nav-tile-neutral {
      background: #202124 !important;
      color: #e8eaed !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] > mw-fab-link > a.fab[${NAV_TILE_DISABLED_ATTRIBUTE}] {
      opacity: 0.38 !important;
      pointer-events: none !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] > mw-fab-link > a.fab:focus-visible {
      outline: 2px solid #0b57d0 !important;
      outline-offset: 2px !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] > mw-fab-link > a.fab:focus-visible {
      outline-color: #8ab4f8 !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] .mdc-button__label,
    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] .fab-icon-label-container {
      all: unset;
      align-items: center !important;
      ${LEGACY_RESET}
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      max-width: 100% !important;
      width: 100% !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] mws-icon.fab-icon,
    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] mws-icon.fab-icon svg {
      ${LEGACY_RESET}
      color: #0b57d0 !important;
      display: block !important;
      fill: #0b57d0 !important;
      height: 20px !important;
      width: 20px !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] mws-icon.fab-icon path {
      fill: #0b57d0 !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] mws-icon.fab-icon,
    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] mws-icon.fab-icon svg,
    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] mws-icon.fab-icon path {
      color: #8ab4f8 !important;
      fill: #8ab4f8 !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] .fab-label {
      ${LEGACY_RESET}
      color: inherit !important;
      display: block !important;
      font-size: 10px !important;
      font-weight: 500 !important;
      line-height: 12px !important;
      max-height: 24px !important;
      overflow: hidden !important;
      text-align: center !important;
      white-space: normal !important;
      word-break: break-word !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] > mw-fab-link > a.fab.gm-nav-tile-start .fab-label {
      color: #041e49 !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] > mw-fab-link > a.fab.gm-nav-tile-neutral .fab-label {
      color: #1f1f1f !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] .fab-label,
    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] > mw-fab-link > a.fab.gm-nav-tile-start .fab-label,
    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] > mw-fab-link > a.fab.gm-nav-tile-neutral .fab-label {
      color: #e8eaed !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] .${NAV_TILE_BADGE_HOST_CLASS} {
      position: relative !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}] [${NAV_TILE_BADGE_ATTRIBUTE}] {
      align-items: center !important;
      background: #ffffff !important;
      ${LEGACY_RESET}
      border: 1px solid #c4c7c5 !important;
      border-radius: 999px !important;
      box-sizing: border-box !important;
      color: #444746 !important;
      display: inline-flex !important;
      font: 600 10px/14px system-ui, sans-serif !important;
      height: 16px !important;
      max-width: calc(100% - 4px) !important;
      overflow: hidden !important;
      padding: 0 4px !important;
      position: absolute !important;
      right: -2px !important;
      text-overflow: ellipsis !important;
      top: -6px !important;
      white-space: nowrap !important;
      z-index: 1 !important;
    }

    .${NAV_TILE_ROW_CLASS}[${NAV_TILE_ROW_ATTRIBUTE}][${NAV_TILE_THEME_ATTRIBUTE}="${NAV_TILE_THEME_DARK}"] [${NAV_TILE_BADGE_ATTRIBUTE}] {
      background: #303134 !important;
      border-color: #5f6368 !important;
      color: #e8eaed !important;
    }
  `;
}

export function injectNavigationTileStyles(documentRoot = document) {
  if (documentRoot.querySelector(NAV_TILE_STYLE_SELECTOR)) {
    return;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-navigation-tile-styles', '');
  style.textContent = buildNavigationTileStylesheet();
  documentRoot.head.append(style);
}

export function removeNavigationTileStyles(documentRoot = document) {
  documentRoot.querySelector(NAV_TILE_STYLE_SELECTOR)?.remove();
}

export function normalizeNavigationTileLink(link, variant) {
  if (!link) {
    return;
  }

  link.removeAttribute('style');
  link.classList.add('gm-nav-tile');
  link.classList.remove('gm-nav-tile-start', 'gm-nav-tile-neutral');
  link.classList.add(variant === 'start' ? 'gm-nav-tile-start' : 'gm-nav-tile-neutral');
}

export function normalizeNavigationTileRow(row) {
  if (!row) {
    return;
  }

  row.classList.add(NAV_TILE_ROW_CLASS);
  row.querySelectorAll(':scope > mw-fab-link').forEach((host) => {
    host.removeAttribute('style');
  });

  normalizeNavigationTileLink(
    row.querySelector('mw-fab-link.start-chat > a.fab'),
    'start'
  );
  normalizeNavigationTileLink(
    row.querySelector(`[${NAV_TILE_ARCHIVED_ATTRIBUTE}]`),
    'neutral'
  );
  normalizeNavigationTileLink(
    row.querySelector(`[${NAV_TILE_SPAM_ATTRIBUTE}]`),
    'neutral'
  );
}
