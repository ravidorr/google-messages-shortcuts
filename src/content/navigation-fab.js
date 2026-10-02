import {
  isArchivedDialogShellVisible,
  isArchivedSidebarViewActive,
  openArchivedModal
} from './adapters/archived-adapter.js';
import { showActionFeedback } from './action-feedback.js';
import { SELECTORS } from './google-messages-dom.js';
import { isPaused, PAUSE_STORAGE_KEY } from '../shared/pause-preference.js';
import { COMMAND_OPEN_ARCHIVED } from '../shared/commands.js';

export const ARCHIVED_FAB_ATTRIBUTE = 'data-messages-shortcuts-archived-fab';
export const ARCHIVED_FAB_WRAP_ATTRIBUTE = 'data-messages-shortcuts-archived-fab-wrap';
export const ARCHIVED_FAB_ROW_ATTRIBUTE = 'data-messages-shortcuts-fab-row';
export const ARCHIVED_FAB_STYLE_SELECTOR = 'style[data-messages-shortcuts-archived-fab-styles]';

const ARCHIVED_FAB_ICON_PATH = 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z';

const FAB_LINK_STYLE_PROPERTIES = [
  'backgroundColor',
  'border',
  'borderRadius',
  'boxShadow',
  'color',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'height',
  'letterSpacing',
  'lineHeight',
  'minHeight',
  'padding',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'textTransform'
];

const installationRegistry = new WeakMap();

function findRenderedFabIconSvg(iconElement) {
  return iconElement?.shadowRoot?.querySelector('svg') ?? iconElement?.querySelector('svg') ?? null;
}

function replaceFabIcon(iconElement, pathData) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  path.setAttribute('fill', 'currentColor');
  svg.append(path);

  iconElement.replaceChildren(svg);
}

export function syncArchivedFabAppearance(startChatContainer, archivedWrap) {
  const sourceLink = startChatContainer.querySelector('a.fab');
  const targetLink = archivedWrap.querySelector('a.fab');

  if (!sourceLink || !targetLink) {
    return;
  }

  const sourceStyles = getComputedStyle(sourceLink);

  for (const property of FAB_LINK_STYLE_PROPERTIES) {
    targetLink.style[property] = sourceStyles[property];
  }

  targetLink.style.display = 'inline-flex';
  targetLink.style.alignItems = 'center';
  targetLink.style.textDecoration = 'none';
}

export function copyArchivedFabIcon(startChatContainer, archivedWrap) {
  const sourceIcon = startChatContainer.querySelector('mws-icon.fab-icon');
  const targetIcon = archivedWrap.querySelector('mws-icon.fab-icon');

  if (!targetIcon) {
    return;
  }

  const sourceSvg = findRenderedFabIconSvg(sourceIcon);

  if (sourceSvg) {
    const svgClone = sourceSvg.cloneNode(true);
    const path = svgClone.querySelector('path');

    if (path) {
      path.setAttribute('d', ARCHIVED_FAB_ICON_PATH);
      path.setAttribute('fill', 'currentColor');
      path.removeAttribute('stroke');
      path.removeAttribute('stroke-width');
    }

    targetIcon.replaceChildren(svgClone);
    return;
  }

  replaceFabIcon(targetIcon, ARCHIVED_FAB_ICON_PATH);
}

function addStyles(documentRoot) {
  if (documentRoot.querySelector(ARCHIVED_FAB_STYLE_SELECTOR)) {
    return;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-archived-fab-styles', '');
  style.textContent = `
    [${ARCHIVED_FAB_ROW_ATTRIBUTE}] {
      align-items: center;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 8px;
      width: 100%;
    }

    [${ARCHIVED_FAB_ROW_ATTRIBUTE}] > mw-fab-link {
      display: inline-flex;
      flex: 0 0 auto;
      max-width: none;
      width: auto;
    }
  `;
  documentRoot.head.append(style);
}

export function createArchivedFab(_documentRoot, startChatContainer, onClick) {
  const wrap = startChatContainer.cloneNode(true);
  wrap.classList.remove('start-chat');
  wrap.classList.add('archived-chat');
  wrap.setAttribute('label', 'Archived');
  wrap.setAttribute(ARCHIVED_FAB_WRAP_ATTRIBUTE, '');

  const link = wrap.querySelector('a');

  if (!link) {
    throw new Error('Start chat FAB is missing its anchor element.');
  }

  link.removeAttribute('data-e2e-start-button');
  link.setAttribute('href', '#');
  link.setAttribute('role', 'button');
  link.setAttribute('tabindex', '0');
  link.setAttribute(ARCHIVED_FAB_ATTRIBUTE, '');
  link.setAttribute('aria-label', 'Open archived conversations');

  const fabLabel = wrap.querySelector('.fab-label');

  if (fabLabel) {
    fabLabel.textContent = 'Archived';
  }

  copyArchivedFabIcon(startChatContainer, wrap);

  link.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    void onClick();
  }, true);

  syncArchivedFabAppearance(startChatContainer, wrap);

  return wrap;
}

function findStartChatFabContainer(documentRoot, selectors = SELECTORS) {
  const startChatFab = documentRoot.querySelector(selectors.startChatFab);

  return startChatFab?.closest(selectors.startChatFabContainer) ?? null;
}

function ensureFabRow(documentRoot, startChatContainer) {
  const existingRow = startChatContainer.closest(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);

  if (existingRow) {
    return existingRow;
  }

  const row = documentRoot.createElement('div');
  row.setAttribute(ARCHIVED_FAB_ROW_ATTRIBUTE, '');
  startChatContainer.parentElement.insertBefore(row, startChatContainer);
  row.append(startChatContainer);

  return row;
}

function unwrapFabRow(documentRoot) {
  const row = documentRoot.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);

  if (!row || row.querySelector(`[${ARCHIVED_FAB_WRAP_ATTRIBUTE}]`)) {
    return;
  }

  const parent = row.parentElement;

  while (row.firstElementChild) {
    parent.insertBefore(row.firstElementChild, row);
  }

  row.remove();
}

function removeArchivedFab(documentRoot) {
  documentRoot.querySelector(`[${ARCHIVED_FAB_WRAP_ATTRIBUTE}]`)?.remove();
  unwrapFabRow(documentRoot);
}

function injectArchivedFab(documentRoot, selectors, onClick) {
  if (
    documentRoot.querySelector(`[${ARCHIVED_FAB_WRAP_ATTRIBUTE}]`)
    || isArchivedDialogShellVisible(documentRoot, selectors)
    || isArchivedSidebarViewActive(documentRoot, selectors)
  ) {
    return;
  }

  const startChatContainer = findStartChatFabContainer(documentRoot, selectors);

  if (!startChatContainer?.parentElement) {
    return;
  }

  const row = ensureFabRow(documentRoot, startChatContainer);
  const archivedWrap = createArchivedFab(documentRoot, startChatContainer, onClick);
  row.append(archivedWrap);
  syncArchivedFabAppearance(startChatContainer, archivedWrap);
}

function createInstallation({
  documentRoot = document,
  chromeApi = globalThis.chrome,
  selectors = SELECTORS,
  openArchived = openArchivedModal,
  getPausedState = async () => {
    if (typeof chromeApi?.storage?.local?.get !== 'function') {
      return false;
    }

    return isPaused(chromeApi);
  }
} = {}) {
  addStyles(documentRoot);
  let paused = false;
  let fabActionInProgress = false;
  let refreshScheduled = false;

  async function refreshPausedState() {
    paused = await getPausedState();

    if (paused) {
      removeArchivedFab(documentRoot);
    }
  }

  let initialized = false;

  async function refreshPausedStateAndFab() {
    await refreshPausedState();
    initialized = true;
    refreshFab();
  }

  void refreshPausedStateAndFab();

  async function handleFabClick() {
    if (fabActionInProgress) {
      return;
    }

    fabActionInProgress = true;

    try {
      const result = await openArchived(documentRoot, selectors);

      showActionFeedback(result, COMMAND_OPEN_ARCHIVED, documentRoot);

      if (
        result.ok
        && (
          isArchivedDialogShellVisible(documentRoot, selectors)
          || isArchivedSidebarViewActive(documentRoot, selectors)
        )
      ) {
        removeArchivedFab(documentRoot);
      }
    } finally {
      fabActionInProgress = false;
    }
  }

  function refreshFab() {
    if (paused) {
      removeArchivedFab(documentRoot);
    }

    if (!initialized || paused || fabActionInProgress) {
      return;
    }

    injectArchivedFab(documentRoot, selectors, handleFabClick);
  }

  function scheduleRefreshFab() {
    if (refreshScheduled || fabActionInProgress) {
      return;
    }

    refreshScheduled = true;

    requestAnimationFrame(() => {
      refreshScheduled = false;
      refreshFab();
    });
  }

  function isExtensionMutation(mutation) {
    const target = mutation.target;

    return target instanceof Element && Boolean(
      target.closest(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`)
      || target.matches(ARCHIVED_FAB_STYLE_SELECTOR)
      || target.closest(ARCHIVED_FAB_STYLE_SELECTOR)
    );
  }

  const observer = new MutationObserver((mutations) => {
    if (mutations.every(isExtensionMutation)) {
      return;
    }

    scheduleRefreshFab();
  });
  observer.observe(documentRoot.body, {
    childList: true,
    subtree: true
  });

  const handlePausePreferenceChange = (changes, areaName) => {
    if (areaName !== 'local' || !changes[PAUSE_STORAGE_KEY]) {
      return;
    }

    paused = changes[PAUSE_STORAGE_KEY].newValue === true;

    if (paused) {
      removeArchivedFab(documentRoot);
      return;
    }

    scheduleRefreshFab();
  };

  chromeApi.storage?.onChanged?.addListener(handlePausePreferenceChange);

  return () => {
    observer.disconnect();
    chromeApi.storage?.onChanged?.removeListener(handlePausePreferenceChange);
    removeArchivedFab(documentRoot);
    documentRoot.querySelector(ARCHIVED_FAB_STYLE_SELECTOR)?.remove();
  };
}

export function resetArchivedFabInstallationsForTests(documentRoot = document) {
  const installation = installationRegistry.get(documentRoot);

  if (!installation) {
    return;
  }

  installation.disconnect();
  installationRegistry.delete(documentRoot);
}

export function installArchivedFab(options = {}) {
  const documentRoot = options.documentRoot ?? document;
  const releaseToken = Symbol('archived-fab-installation');
  let installation = installationRegistry.get(documentRoot);

  if (!installation) {
    installation = {
      disconnect: createInstallation(options),
      tokens: new Set()
    };
    installationRegistry.set(documentRoot, installation);
  }

  installation.tokens.add(releaseToken);

  return () => {
    const activeInstallation = installationRegistry.get(documentRoot);

    if (!activeInstallation) {
      return;
    }

    activeInstallation.tokens.delete(releaseToken);

    if (activeInstallation.tokens.size === 0) {
      activeInstallation.disconnect();
      installationRegistry.delete(documentRoot);
    }
  };
}
