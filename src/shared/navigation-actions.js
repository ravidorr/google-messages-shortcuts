import { COMMAND_OPEN_ARCHIVED } from './commands.js';
import { getOpenArchivedShortcutLabel } from './navigation-shortcut-bindings.js';

export const NAVIGATION_ACTIONS = [
  {
    command: COMMAND_OPEN_ARCHIVED,
    popupLabel: 'Open archived conversations',
    shortcutKey: 'openArchived'
  }
];

export function getNavigationShortcutLabel(action, platform = navigator.platform) {
  if (action.command === COMMAND_OPEN_ARCHIVED) {
    return getOpenArchivedShortcutLabel(platform);
  }

  return '';
}

export function getNavigationPopupLabelsByCommand() {
  return Object.fromEntries(
    NAVIGATION_ACTIONS.map((action) => [action.command, action.popupLabel])
  );
}
