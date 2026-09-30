import { runConversationAction } from './conversation-action.js';
import { SELECTORS } from './google-messages-dom.js';
import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../shared/commands.js';
import { MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS } from '../shared/shortcut-labels.js';

const PILL_GROUP_SELECTOR = '[data-messages-shortcuts-pill-group]';
const STYLE_SELECTOR = 'style[data-messages-shortcuts-pill-styles]';
const PILL_HOST_ATTRIBUTE = 'data-messages-shortcuts-pill-host';

const PILL_DEFINITIONS = [
  { command: COMMAND_ARCHIVE, label: 'Archive', shortcutKey: 'archive' },
  { command: COMMAND_TRASH, label: 'Trash', shortcutKey: 'trash' }
];

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
      background: #ffffff;
      border: 1px solid #dadce0;
      border-radius: 999px;
      color: #174ea6;
      cursor: pointer;
      font: 600 11px/16px system-ui, sans-serif;
      padding: 3px 7px;
    }
  `;
  documentRoot.head.append(style);

  return style;
}

function isFocusedConversationRow(conversationRow) {
  return conversationRow.getAttribute('is-focused') === 'true';
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

function createPill(documentRoot, definition, shortcut, runAction, conversationRow) {
  const pill = documentRoot.createElement('button');
  pill.type = 'button';
  pill.setAttribute('data-messages-shortcuts-pill', '');
  pill.setAttribute('data-command', definition.command);
  pill.setAttribute('aria-label', `${definition.label} conversation, ${shortcut}`);
  pill.textContent = `${definition.label} ${shortcut}`;
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

  for (const definition of PILL_DEFINITIONS) {
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
  )
} = {}) {
  const style = addStyles(documentRoot);
  const hoveredRows = new WeakSet();
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

    if (!conversationRow.isConnected || conversationRow.querySelector(PILL_GROUP_SELECTOR)) {
      return;
    }

    conversationRow.setAttribute(PILL_HOST_ATTRIBUTE, '');
    conversationRow.append(createPillGroup(
      documentRoot,
      shortcutLabels,
      runAction,
      conversationRow
    ));
  }

  function removePills(conversationRow) {
    conversationRow?.querySelector(PILL_GROUP_SELECTOR)?.remove();
    conversationRow?.removeAttribute(PILL_HOST_ATTRIBUTE);
  }

  function handlePointerOver(event) {
    const conversationRow = getConversationRow(event);

    if (conversationRow && !isWithinConversationRow(event, conversationRow)) {
      hoveredRows.add(conversationRow);
      void showPills(conversationRow);
    }
  }

  function handlePointerOut(event) {
    const conversationRow = getConversationRow(event, { allowPillGroup: true });

    if (conversationRow && !isWithinConversationRow(event, conversationRow)) {
      hoveredRows.delete(conversationRow);

      if (!isFocusedConversationRow(conversationRow)) {
        removePills(conversationRow);
      }
    }
  }

  function handleFocusIn(event) {
    void showPills(getConversationRow(event));
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.target instanceof Element) {
        if (isFocusedConversationRow(record.target)) {
          void showPills(record.target);
        } else if (!hoveredRows.has(record.target)) {
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
  documentRoot.addEventListener('pointerover', handlePointerOver);
  documentRoot.addEventListener('pointerout', handlePointerOut);
  documentRoot.addEventListener('focusin', handleFocusIn);

  for (const conversationRow of documentRoot.querySelectorAll(
    `${SELECTORS.conversationRow}[is-focused="true"]`
  )) {
    void showPills(conversationRow);
  }

  return () => {
    observer.disconnect();
    documentRoot.removeEventListener('pointerover', handlePointerOver);
    documentRoot.removeEventListener('pointerout', handlePointerOut);
    documentRoot.removeEventListener('focusin', handleFocusIn);
    documentRoot.querySelectorAll(PILL_GROUP_SELECTOR).forEach((group) => {
      group.parentElement?.removeAttribute(PILL_HOST_ATTRIBUTE);
      group.remove();
    });
    style.remove();
  };
}
