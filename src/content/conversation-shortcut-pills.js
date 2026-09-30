import { runConversationAction } from './conversation-action.js';
import { isConversationRead } from './conversation-read-state.js';
import { SELECTORS } from './google-messages-dom.js';
import { COMMAND_ARCHIVE, COMMAND_MARK_UNREAD, COMMAND_TRASH } from '../shared/commands.js';
import { getCommandIcon } from '../shared/command-icons.js';
import { isConversationOpeningEnabled } from '../shared/conversation-open-preference.js';
import {
  MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS,
  UNASSIGNED_SHORTCUT_LABEL
} from '../shared/shortcut-labels.js';

const PILL_GROUP_SELECTOR = '[data-messages-shortcuts-pill-group]';
const STYLE_SELECTOR = 'style[data-messages-shortcuts-pill-styles]';
const PILL_HOST_ATTRIBUTE = 'data-messages-shortcuts-pill-host';

const BASE_PILL_DEFINITIONS = [
  { command: COMMAND_ARCHIVE, label: 'Archive', shortcutKey: 'archive' },
  { command: COMMAND_TRASH, label: 'Trash', shortcutKey: 'trash' }
];

const MARK_UNREAD_PILL_DEFINITION = {
  command: COMMAND_MARK_UNREAD,
  label: 'Mark as unread',
  shortcutKey: 'markUnread'
};

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
  const definitions = [...BASE_PILL_DEFINITIONS];

  if (isConversationRead(conversationRow)) {
    definitions.push(MARK_UNREAD_PILL_DEFINITION);
  }

  return definitions;
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

function shouldShowPills(conversationRow, focusedRows, hoveredRows) {
  return isFocusedConversationRow(conversationRow)
    || focusedRows.has(conversationRow)
    || hoveredRows.has(conversationRow);
}

function getConversationRowFromNode(node) {
  if (!(node instanceof Element)) {
    return null;
  }

  return node.closest(SELECTORS.conversationRow);
}

function isUnreadMarkerElement(node) {
  return node?.nodeType === 1 && node.matches(SELECTORS.unreadConversationMarker);
}

function getConversationRowForUnreadMutation(record) {
  if (record.type === 'attributes' && record.attributeName === 'data-e2e-is-unread') {
    return getConversationRowFromNode(record.target);
  }

  if (record.type === 'childList') {
    for (const node of [...record.addedNodes, ...record.removedNodes]) {
      if (isUnreadMarkerElement(node)) {
        return getConversationRowFromNode(record.target);
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
  const hasShortcut = shortcut !== UNASSIGNED_SHORTCUT_LABEL;
  const ariaLabel = `${definition.label} conversation${hasShortcut ? `, ${shortcut}` : ''}`;

  pill.type = 'button';
  pill.setAttribute('data-messages-shortcuts-pill', '');
  pill.setAttribute('data-command', definition.command);
  pill.setAttribute('aria-label', ariaLabel);
  pill.title = ariaLabel;
  pill.append(createPillIcon(documentRoot, definition.command));

  if (hasShortcut) {
    const shortcutLabel = documentRoot.createElement('span');

    shortcutLabel.setAttribute('data-messages-shortcuts-pill-shortcut', '');
    shortcutLabel.textContent = shortcut;
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

function createPillGroup(documentRoot, shortcutLabels, runAction, conversationRow) {
  const group = documentRoot.createElement('div');
  group.setAttribute('data-messages-shortcuts-pill-group', '');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Conversation shortcuts');

  for (const definition of getPillDefinitions(conversationRow)) {
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

export function installConversationShortcutPills({
  documentRoot = document,
  getShortcutLabels = () => chrome.runtime.sendMessage({
    type: MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS
  }),
  runAction = (command, conversationRow) => runConversationAction(
    documentRoot,
    command,
    SELECTORS,
    conversationRow
  ),
  isAutoOpenEnabled = isConversationOpeningEnabled
} = {}) {
  const style = addStyles(documentRoot);
  const focusedRows = new WeakSet();
  const hoveredRows = new WeakSet();
  const removingPillsFromRows = new WeakSet();
  let shortcutLabelsPromise;

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
    if (!conversationRow || conversationRow.querySelector(PILL_GROUP_SELECTOR)) {
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
      !conversationRow.isConnected
      || conversationRow.querySelector(PILL_GROUP_SELECTOR)
      || !shouldShowPills(conversationRow, focusedRows, hoveredRows)
    ) {
      return;
    }

    safeDomMutation(() => {
      conversationRow.setAttribute(PILL_HOST_ATTRIBUTE, '');
      conversationRow.append(createPillGroup(
        documentRoot,
        shortcutLabels,
        runActionWithRefresh,
        conversationRow
      ));
    });
  }

  async function refreshPills(conversationRow) {
    if (!conversationRow || !shouldShowPills(conversationRow, focusedRows, hoveredRows)) {
      return;
    }

    removePills(conversationRow);
    await showPills(conversationRow);
  }

  async function runActionWithRefresh(command, conversationRow) {
    const result = await runAction(command, conversationRow);

    if (command === COMMAND_MARK_UNREAD && result?.ok) {
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

      if (!isFocusedConversationRow(conversationRow) && !focusedRows.has(conversationRow)) {
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

      if (!isFocusedConversationRow(conversationRow) && !hoveredRows.has(conversationRow)) {
        removePills(conversationRow);
      }
    }
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.target instanceof Element) {
        if (isFocusedConversationRow(record.target)) {
          if (!focusedRows.has(record.target) && !hoveredRows.has(record.target)) {
            void openConversation(record.target);
          }

          void showPills(record.target);
        } else if (!focusedRows.has(record.target) && !hoveredRows.has(record.target)) {
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
  documentRoot.addEventListener('pointerover', handlePointerOver);
  documentRoot.addEventListener('pointerout', handlePointerOut);
  documentRoot.addEventListener('focusin', handleFocusIn);
  documentRoot.addEventListener('focusout', handleFocusOut);

  for (const conversationRow of documentRoot.querySelectorAll(
    `${SELECTORS.conversationRow}[is-focused="true"]`
  )) {
    void showPills(conversationRow);
  }

  return () => {
    observer.disconnect();
    readStateObserver.disconnect();
    documentRoot.removeEventListener('pointerover', handlePointerOver);
    documentRoot.removeEventListener('pointerout', handlePointerOut);
    documentRoot.removeEventListener('focusin', handleFocusIn);
    documentRoot.removeEventListener('focusout', handleFocusOut);
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
