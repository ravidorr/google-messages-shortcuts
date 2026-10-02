export const OPEN_ARCHIVED_SHORTCUT_LABEL = 'Ctrl+Shift+A';
export const OPEN_ARCHIVED_SHORTCUT_LABEL_MAC = '⇧⌘A';
export const START_CHAT_SHORTCUT_LABEL = 'Ctrl+Shift+G';
export const START_CHAT_SHORTCUT_LABEL_MAC = '⇧⌘G';

export function getOpenArchivedShortcutLabel(platform = navigator.platform) {
  return /Mac|iPhone|iPad/.test(platform)
    ? OPEN_ARCHIVED_SHORTCUT_LABEL_MAC
    : OPEN_ARCHIVED_SHORTCUT_LABEL;
}

export function getStartChatShortcutLabel(platform = navigator.platform) {
  return /Mac|iPhone|iPad/.test(platform)
    ? START_CHAT_SHORTCUT_LABEL_MAC
    : START_CHAT_SHORTCUT_LABEL;
}

export function isEditableTarget(element) {
  if (!element || element.nodeType !== 1) {
    return false;
  }

  if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  const tagName = element.tagName;

  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT';
}

export function matchesOpenArchivedShortcut(event, platform = navigator.platform) {
  if (event.altKey || event.repeat) {
    return false;
  }

  const key = event.key.toLowerCase();

  if (key !== 'a') {
    return false;
  }

  if (/Mac|iPhone|iPad/.test(platform)) {
    return event.metaKey && event.shiftKey && !event.ctrlKey;
  }

  return event.ctrlKey && event.shiftKey && !event.metaKey;
}

export function matchesStartChatShortcut(event, platform = navigator.platform) {
  if (event.altKey || event.repeat) {
    return false;
  }

  const key = event.key.toLowerCase();

  if (key !== 'g') {
    return false;
  }

  if (/Mac|iPhone|iPad/.test(platform)) {
    return event.metaKey && event.shiftKey && !event.ctrlKey;
  }

  return event.ctrlKey && event.shiftKey && !event.metaKey;
}
