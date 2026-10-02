import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_MUTE,
  COMMAND_TRASH,
  COMMAND_UNMUTE
} from './commands.js';

export const MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS = 'get-conversation-shortcut-labels';
export const UNASSIGNED_SHORTCUT_LABEL = 'Not assigned';

function getShortcutLabel(commands, commandName) {
  return commands.find((command) => command.name === commandName)?.shortcut
    || UNASSIGNED_SHORTCUT_LABEL;
}

export function getConversationShortcutLabels(commands) {
  return {
    archive: getShortcutLabel(commands, COMMAND_ARCHIVE),
    trash: getShortcutLabel(commands, COMMAND_TRASH),
    markUnread: getShortcutLabel(commands, COMMAND_MARK_UNREAD),
    markRead: getShortcutLabel(commands, COMMAND_MARK_READ),
    mute: getShortcutLabel(commands, COMMAND_MUTE),
    unmute: getShortcutLabel(commands, COMMAND_UNMUTE),
    blockReportSpam: UNASSIGNED_SHORTCUT_LABEL
  };
}
