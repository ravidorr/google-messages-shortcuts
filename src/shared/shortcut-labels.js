import { COMMAND_ARCHIVE, COMMAND_TRASH } from './commands.js';

export const MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS = 'get-conversation-shortcut-labels';
export const UNASSIGNED_SHORTCUT_LABEL = 'Not assigned';

function getShortcutLabel(commands, commandName) {
  return commands.find((command) => command.name === commandName)?.shortcut
    || UNASSIGNED_SHORTCUT_LABEL;
}

export function getConversationShortcutLabels(commands) {
  return {
    archive: getShortcutLabel(commands, COMMAND_ARCHIVE),
    trash: getShortcutLabel(commands, COMMAND_TRASH)
  };
}
