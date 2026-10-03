import { showActionFeedback } from './action-feedback.js';
import { runConversationAction } from './conversation-action.js';
import { SELECTORS } from './google-messages-dom.js';
import { getCommandIcon } from '../shared/command-icons.js';
import { isPaused, PAUSE_STORAGE_KEY } from '../shared/pause-preference.js';
import {
  getPillDefinitionsForRow,
  getRowAction
} from './row-action-registry.js';
import { isConversationOpeningEnabled } from '../shared/conversation-open-preference.js';
import {
  DEFAULT_PILL_VISIBILITY,
  getPillVisibility,
  normalizePillVisibility,
  PILL_VISIBILITY_HIDDEN,
  PILL_VISIBILITY_SELECTED_ROW_ONLY,
  PILL_VISIBILITY_STORAGE_KEY
} from '../shared/pill-visibility-preference.js';
import {
  MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS,
  UNASSIGNED_SHORTCUT_LABEL
} from '../shared/shortcut-labels.js';
import {
  MESSAGE_THEME_ATTRIBUTE,
  MESSAGE_THEME_DARK,
  syncMessageTheme
} from './message-theme.js';

const PILL_GROUP_SELECTOR = '[data-messages-shortcuts-pill-group]';
const STYLE_SELECTOR = 'style[data-messages-shortcuts-pill-styles]';
const PILL_HOST_ATTRIBUTE = 'data-messages-shortcuts-pill-host';
const installationRegistry = new WeakMap();

function isDomRaceNotFoundError(error) {
  return error instanceof DOMException && error.name === 'NotFoundError';
}

export function safeDomMutation(operation) {
  try {
    return operation();
  } catch (error) {
    if (isDomRaceNotFoundError(error)) {
      return undefined;
    }

    throw error;
  }
}

function getPillDefinitions(conversationRow) {
  return getPillDefinitionsForRow(conversationRow, SELECTORS);
}

function addStyles(documentRoot) {
  const existingStyle = documentRoot.querySelector(STYLE_SELECTOR);

  if (existingStyle) {
    return existingStyle;
  }

  const style = documentRoot.createElement('style');
  style.setAttribute('data-messages-shortcuts-pill-styles', '');
  style.textContent = `
    [data-messages-shortcuts-pill-group] {
      display: flex;
      gap: 4px;
      position: absolute;
      right: 8px;
      top: 8px;
      z-index: 1;
    }

    [data-messages-shortcuts-pill-host] {
      position: relative;
    }

    [data-messages-shortcuts-pill] {
      align-items: center;
      background: #ffffff;
      border: 1px solid #dadce0;
      border-radius: 999px;
      color: #174ea6;
      cursor: pointer;
      display: inline-flex;
      font: 600 10px/14px system-ui, sans-serif;
      gap: 3px;
      min-height: 24px;
      padding: 2px 5px;
    }

    [data-messages-shortcuts-pill] svg {
      height: 14px;
      width: 14px;
    }

    [data-messages-shortcuts-pill]:focus-visible {
      outline: 2px solid #0b57d0;
      outline-offset: 2px;
    }

    [${PILL_HOST_ATTRIBUTE}][${MESSAGE_THEME_ATTRIBUTE}="${MESSAGE_THEME_DARK}"]
      [data-messages-shortcuts-pill] {
      background: #303134;
      border-color: #5f6368;
      color: #e8eaed;
    }

    [${PILL_HOST_ATTRIBUTE}][${MESSAGE_THEME_ATTRIBUTE}="${MESSAGE_THEME_DARK}"]
      [data-messages-shortcuts-pill]:hover,
    [${PILL_HOST_ATTRIBUTE}][${MESSAGE_THEME_ATTRIBUTE}="${MESSAGE_THEME_DARK}"]
      [data-messages-shortcuts-pill]:focus-visible {
      color: #8ab4f8;
      outline-color: #8ab4f8;
    }

    [data-messages-shortcuts-pill-shortcut] {
      white-space: nowrap;
    }
  `;
  documentRoot.head.append(style);

  return style;
}

function isFocusedConversationRow(conversationRow) {
  return conversationRow.getAttribute('is-focused') === 'true';
}

function shouldShowPills(conversationRow, focusedRows, hoveredRows, pillVisibility) {
  if (pillVisibility === PILL_VISIBILITY_SELECTED_ROW_ONLY) {
    return isFocusedConversationRow(conversationRow);
  }

  return isFocusedConversationRow(conversationRow)
    || focusedRows.has(conversationRow)
    || hoveredRows.has(conversationRow);
}

function getConversationRowFromNode(node) {
  if (node?.nodeType !== 1) {
    return null;
  }

  return node.closest(SELECTORS.conversationRow);
}

function isUnreadMarkerElement(node) {
  return node?.nodeType === 1 && node.matches(SELECTORS.unreadConversationMarker);
}

export function getConversationRowForUnreadMutation(record) {
  const conversationRow = getConversationRowFromNode(record.target);

  if (!conversationRow) {
    return null;
  }

  if (record.type === 'attributes' && record.attributeName === 'data-e2e-is-unread') {
    return conversationRow;
  }

  if (record.type === 'childList') {
    for (const node of [...record.addedNodes, ...record.removedNodes]) {
      if (isUnreadMarkerElement(node)) {
        return conversationRow;
      }
    }
  }

  return null;
}

function getConversationRow(event, { allowPillGroup = false } = {}) {
  if (!(event.target instanceof Element)) {
    return null;
  }

  if (!allowPillGroup && event.target.closest(PILL_GROUP_SELECTOR)) {
    return null;
  }

  return event.target.closest(SELECTORS.conversationRow);
}

function isWithinConversationRow(event, conversationRow) {
  return event.relatedTarget instanceof Node && conversationRow.contains(event.relatedTarget);
}

function createPillIcon(documentRoot, commandName) {
  const icon = getCommandIcon(commandName);
  const svg = documentRoot.createElementNS('http://www.w3.org/2000/svg', 'svg');

  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('data-messages-shortcuts-pill-icon', commandName);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('viewBox', icon.viewBox);

  for (const pathDefinition of icon.paths) {
    const path = documentRoot.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathDefinition);
    svg.append(path);
  }

  return svg;
}

function createPill(documentRoot, definition, shortcut, runAction, conversationRow) {
  const pill = documentRoot.createElement('button');
  const resolvedShortcut = shortcut ?? UNASSIGNED_SHORTCUT_LABEL;
  const hasShortcut = resolvedShortcut !== UNASSIGNED_SHORTCUT_LABEL;
  const ariaLabel = `${definition.label} conversation${hasShortcut ? `, ${resolvedShortcut}` : ''}`;

  pill.type = 'button';
  pill.setAttribute('data-messages-shortcuts-pill', '');
  pill.setAttribute('data-command', definition.command);
  pill.setAttribute('aria-label', ariaLabel);
  pill.title = ariaLabel;
  pill.append(createPillIcon(documentRoot, definition.command));

  if (hasShortcut) {
    const shortcutLabel = documentRoot.createElement('span');

    shortcutLabel.setAttribute('data-messages-shortcuts-pill-shortcut', '');
    shortcutLabel.textContent = resolvedShortcut;
    pill.append(shortcutLabel);
  }
  pill.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    void runAction(definition.command, conversationRow).catch((error) => {
      console.warn('[Messages Shortcut Actions] Failed to run conversation shortcut pill.', error);
    });
  });

  return pill;
}

function createPillGroup(documentRoot, shortcutLabels, runAction, conversationRow, pillDefinitions) {
  const group = documentRoot.createElement('div');
  group.setAttribute('data-messages-shortcuts-pill-group', '');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Conversation shortcuts');

  for (const definition of pillDefinitions) {
    group.append(createPill(
      documentRoot,
      definition,
      shortcutLabels[definition.shortcutKey],
      runAction,
      conversationRow
    ));
  }

  return group;
}

function createReleaseCallback(documentRoot, releaseToken) {
  let released = false;

  return () => {
    if (released) {
      return;
    }

    released = true;

    const installation = installationRegistry.get(documentRoot);

    if (!installation) {
      return;
    }

    if (!installation.tokens.delete(releaseToken)) {
      return;
    }

    if (installation.tokens.size === 0) {
      installation.disconnect();
      installationRegistry.delete(documentRoot);
    }
  };
}

function removeAllPills(documentRoot, removingPillsFromRows) {
  for (const conversationRow of documentRoot.querySelectorAll(SELECTORS.conversationRow)) {
    if (conversationRow.querySelector(PILL_GROUP_SELECTOR)) {
      removingPillsFromRows.add(conversationRow);

      try {
        safeDomMutation(() => {
          conversationRow.querySelector(PILL_GROUP_SELECTOR)?.remove();
          conversationRow.removeAttribute(PILL_HOST_ATTRIBUTE);
        });
      } finally {
        removingPillsFromRows.delete(conversationRow);
      }
    }
  }
}

function createInstallation({
  documentRoot = document,
  chromeApi = globalThis.chrome,
  getShortcutLabels = () => chromeApi.runtime.sendMessage({
    type: MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS
  }),
  runAction = (command, conversationRow) => runConversationAction(
    documentRoot,
    command,
    SELECTORS,
    conversationRow
  ),
  isAutoOpenEnabled = isConversationOpeningEnabled,
  getPausedState = async () => {
    if (typeof chromeApi?.storage?.local?.get !== 'function') {
      return false;
    }

    return isPaused(chromeApi);
  },
  getPillVisibilityState = async () => {
    if (typeof chromeApi?.storage?.local?.get !== 'function') {
      return DEFAULT_PILL_VISIBILITY;
    }

    return getPillVisibility(chromeApi);
  }
} = {}) {
  const style = addStyles(documentRoot);
  const focusedRows = new WeakSet();
  const hoveredRows = new WeakSet();
  const removingPillsFromRows = new WeakSet();
  let shortcutLabelsPromise;
  let paused = false;
  let pillVisibility = DEFAULT_PILL_VISIBILITY;
  let receivedPillVisibilityStorageChange = false;

  async function refreshPausedState() {
    paused = await getPausedState();

    if (paused) {
      removeAllPills(documentRoot, removingPillsFromRows);
    }
  }

  async function refreshPillVisibilityState() {
    const initialPillVisibility = await getPillVisibilityState();

    if (receivedPillVisibilityStorageChange) {
      return;
    }

    pillVisibility = initialPillVisibility;
    await applyPillVisibilityState();
  }

  async function applyPillVisibilityState() {
    if (pillVisibility === PILL_VISIBILITY_HIDDEN || paused) {
      removeAllPills(documentRoot, removingPillsFromRows);
      return;
    }

    for (const conversationRow of documentRoot.querySelectorAll(SELECTORS.conversationRow)) {
      if (shouldShowPills(conversationRow, focusedRows, hoveredRows, pillVisibility)) {
        await showPills(conversationRow);
      } else {
        removePills(conversationRow);
      }
    }
  }

  void refreshPausedState();
  void refreshPillVisibilityState();

  function getLabels() {
    if (!shortcutLabelsPromise) {
      shortcutLabelsPromise = Promise.resolve()
        .then(getShortcutLabels)
        .catch((error) => {
          shortcutLabelsPromise = undefined;
          throw error;
        });
    }

    return shortcutLabelsPromise;
  }

  async function showPills(conversationRow) {
    if (
      paused
      || pillVisibility === PILL_VISIBILITY_HIDDEN
      || !conversationRow
      || conversationRow.querySelector(PILL_GROUP_SELECTOR)
    ) {
      return;
    }

    let shortcutLabels;

    try {
      shortcutLabels = await getLabels();
    } catch (error) {
      console.warn('[Messages Shortcut Actions] Failed to load conversation shortcut labels.', error);
      return;
    }

    if (
      paused
      || pillVisibility === PILL_VISIBILITY_HIDDEN
      || !conversationRow.isConnected
      || conversationRow.querySelector(PILL_GROUP_SELECTOR)
      || !shouldShowPills(conversationRow, focusedRows, hoveredRows, pillVisibility)
    ) {
      return;
    }

    const pillDefinitions = getPillDefinitions(conversationRow);

    if (pillDefinitions.length === 0) {
      return;
    }

    safeDomMutation(() => {
      conversationRow.setAttribute(PILL_HOST_ATTRIBUTE, '');
      syncMessageTheme(conversationRow);
      conversationRow.append(createPillGroup(
        documentRoot,
        shortcutLabels,
        runActionWithRefresh,
        conversationRow,
        pillDefinitions
      ));
    });
  }

  async function refreshPills(conversationRow) {
    if (
      !conversationRow
      || !shouldShowPills(conversationRow, focusedRows, hoveredRows, pillVisibility)
    ) {
      return;
    }

    removePills(conversationRow);
    await showPills(conversationRow);
  }

  async function runActionWithRefresh(command, conversationRow) {
    const result = await runAction(command, conversationRow);
    const action = getRowAction(command);

    showActionFeedback(result, command, documentRoot);

    if (
      result?.ok
      && action
      && (action.showPillWhenReadOnly || action.showPillWhenUnreadOnly)
    ) {
      await refreshPills(conversationRow);
    }

    return result;
  }

  function removePills(conversationRow) {
    if (!conversationRow || removingPillsFromRows.has(conversationRow)) {
      return;
    }

    removingPillsFromRows.add(conversationRow);

    try {
      safeDomMutation(() => {
        conversationRow.querySelector(PILL_GROUP_SELECTOR)?.remove();
        conversationRow.removeAttribute(PILL_HOST_ATTRIBUTE);
      });
    } finally {
      removingPillsFromRows.delete(conversationRow);
    }
  }

  async function openConversation(conversationRow) {
    if (!await isAutoOpenEnabled()) {
      return;
    }

    if (
      !conversationRow?.isConnected
      || (
        !isFocusedConversationRow(conversationRow)
        && !focusedRows.has(conversationRow)
        && !hoveredRows.has(conversationRow)
      )
    ) {
      return;
    }

    const conversationLink = conversationRow?.querySelector('a[aria-selected]')
      || conversationRow?.querySelector('a');

    conversationLink?.click();
  }

  function handlePointerOver(event) {
    const conversationRow = getConversationRow(event);

    if (conversationRow && !isWithinConversationRow(event, conversationRow)) {
      hoveredRows.add(conversationRow);
      void openConversation(conversationRow);
      void showPills(conversationRow);
    }
  }

  function handlePointerOut(event) {
    const conversationRow = getConversationRow(event, { allowPillGroup: true });

    if (conversationRow && !isWithinConversationRow(event, conversationRow)) {
      hoveredRows.delete(conversationRow);

      if (!shouldShowPills(conversationRow, focusedRows, hoveredRows, pillVisibility)) {
        removePills(conversationRow);
      }
    }
  }

  function handleFocusIn(event) {
    const conversationRow = getConversationRow(event);

    if (conversationRow) {
      focusedRows.add(conversationRow);

      if (!isWithinConversationRow(event, conversationRow)) {
        void openConversation(conversationRow);
      }

      void showPills(conversationRow);
    }
  }

  function handleFocusOut(event) {
    const conversationRow = getConversationRow(event, { allowPillGroup: true });

    if (conversationRow && !isWithinConversationRow(event, conversationRow)) {
      focusedRows.delete(conversationRow);

      if (!shouldShowPills(conversationRow, focusedRows, hoveredRows, pillVisibility)) {
        removePills(conversationRow);
      }
    }
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.target?.nodeType === 1) {
        if (isFocusedConversationRow(record.target)) {
          if (!focusedRows.has(record.target) && !hoveredRows.has(record.target)) {
            void openConversation(record.target);
          }

          void showPills(record.target);
        } else if (!shouldShowPills(record.target, focusedRows, hoveredRows, pillVisibility)) {
          removePills(record.target);
        }
      }
    }
  });
  observer.observe(documentRoot.body, {
    attributes: true,
    attributeFilter: ['is-focused'],
    subtree: true
  });

  const readStateObserver = new MutationObserver((records) => {
    const rowsToRefresh = new Set();

    for (const record of records) {
      const conversationRow = getConversationRowForUnreadMutation(record);

      if (conversationRow?.querySelector(PILL_GROUP_SELECTOR)) {
        rowsToRefresh.add(conversationRow);
      }
    }

    for (const conversationRow of rowsToRefresh) {
      void refreshPills(conversationRow);
    }
  });
  readStateObserver.observe(documentRoot.body, {
    attributes: true,
    attributeFilter: ['data-e2e-is-unread'],
    childList: true,
    subtree: true
  });
  const themeObserver = new MutationObserver((records) => {
    if (!records.some((record) => record.target?.nodeType === 1)) {
      return;
    }

    documentRoot.querySelectorAll(`[${PILL_HOST_ATTRIBUTE}]`).forEach(syncMessageTheme);
  });
  themeObserver.observe(documentRoot.body, {
    attributes: true,
    attributeFilter: ['class', 'style'],
    subtree: true
  });
  documentRoot.addEventListener('pointerover', handlePointerOver);
  documentRoot.addEventListener('pointerout', handlePointerOut);
  documentRoot.addEventListener('focusin', handleFocusIn);
  documentRoot.addEventListener('focusout', handleFocusOut);

  const handleStoragePreferenceChange = (changes, areaName) => {
    if (areaName !== 'local') {
      return;
    }

    if (changes[PAUSE_STORAGE_KEY]) {
      paused = changes[PAUSE_STORAGE_KEY].newValue === true;

      if (paused) {
        removeAllPills(documentRoot, removingPillsFromRows);
        return;
      }

      void applyPillVisibilityState();
    }

    if (changes[PILL_VISIBILITY_STORAGE_KEY]) {
      receivedPillVisibilityStorageChange = true;
      pillVisibility = normalizePillVisibility(changes[PILL_VISIBILITY_STORAGE_KEY].newValue);
      void applyPillVisibilityState();
    }
  };

  chromeApi.storage?.onChanged?.addListener(handleStoragePreferenceChange);

  for (const conversationRow of documentRoot.querySelectorAll(
    `${SELECTORS.conversationRow}[is-focused="true"]`
  )) {
    void showPills(conversationRow);
  }

  return () => {
    observer.disconnect();
    readStateObserver.disconnect();
    themeObserver.disconnect();
    documentRoot.removeEventListener('pointerover', handlePointerOver);
    documentRoot.removeEventListener('pointerout', handlePointerOut);
    documentRoot.removeEventListener('focusin', handleFocusIn);
    documentRoot.removeEventListener('focusout', handleFocusOut);
    chromeApi.storage?.onChanged?.removeListener(handleStoragePreferenceChange);
    documentRoot.querySelectorAll(PILL_GROUP_SELECTOR).forEach((group) => {
      safeDomMutation(() => {
        group.parentElement?.removeAttribute(PILL_HOST_ATTRIBUTE);
        group.remove();
      });
    });
    safeDomMutation(() => {
      style.remove();
    });
  };
}

export function resetConversationShortcutPillInstallationsForTests(documentRoot = document) {
  const installation = installationRegistry.get(documentRoot);

  if (!installation) {
    return;
  }

  installation.disconnect();
  installationRegistry.delete(documentRoot);
}

export function installConversationShortcutPills(options = {}) {
  const documentRoot = options.documentRoot ?? document;
  const releaseToken = Symbol('conversation-shortcut-pill-installation');
  const existingInstallation = installationRegistry.get(documentRoot);

  if (existingInstallation) {
    existingInstallation.tokens.add(releaseToken);

    return createReleaseCallback(documentRoot, releaseToken);
  }

  const disconnect = createInstallation(options);

  installationRegistry.set(documentRoot, {
    disconnect,
    tokens: new Set([releaseToken])
  });

  return createReleaseCallback(documentRoot, releaseToken);
}
