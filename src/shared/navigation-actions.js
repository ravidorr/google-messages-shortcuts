import {
  COMMAND_OPEN_ARCHIVED,
  COMMAND_OPEN_SPAM_BLOCKED,
  COMMAND_START_CHAT
} from './commands.js';

export const NAVIGATION_ACTIONS = [
  {
    command: COMMAND_OPEN_ARCHIVED,
    popupLabel: 'Open archived conversations'
  },
  {
    command: COMMAND_START_CHAT,
    popupLabel: 'Start chat'
  },
  {
    command: COMMAND_OPEN_SPAM_BLOCKED,
    popupLabel: 'Open Spam & blocked'
  }
];

export function getNavigationPopupLabelsByCommand() {
  return Object.fromEntries(
    NAVIGATION_ACTIONS.map((action) => [action.command, action.popupLabel])
  );
}
