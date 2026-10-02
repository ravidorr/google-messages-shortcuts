import { COMMAND_OPEN_ARCHIVED, COMMAND_START_CHAT } from './commands.js';
import {
  getOpenArchivedShortcutLabel,
  getStartChatShortcutLabel
} from './navigation-shortcut-bindings.js';

export const NAVIGATION_ACTIONS = [
  {
    command: COMMAND_OPEN_ARCHIVED,
    popupLabel: 'Open archived conversations',
    shortcutKey: 'openArchived'
  },
  {
    command: COMMAND_START_CHAT,
    popupLabel: 'Start chat',
    shortcutKey: 'startChat'
  }
];

export function getNavigationShortcutLabel(action, platform = navigator.platform) {
  if (action.command === COMMAND_OPEN_ARCHIVED) {
    return getOpenArchivedShortcutLabel(platform);
  }

  if (action.command === COMMAND_START_CHAT) {
    return getStartChatShortcutLabel(platform);
  }

  return '';
}

export function getNavigationPopupLabelsByCommand() {
  return Object.fromEntries(
    NAVIGATION_ACTIONS.map((action) => [action.command, action.popupLabel])
  );
}
