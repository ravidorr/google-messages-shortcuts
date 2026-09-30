export const COMMAND_ARCHIVE = 'archive-conversation';
export const COMMAND_TRASH = 'trash-conversation';
export const COMMAND_MARK_UNREAD = 'mark-unread-conversation';

export const VALID_COMMANDS = new Set([
  COMMAND_ARCHIVE,
  COMMAND_TRASH,
  COMMAND_MARK_UNREAD
]);

export function isValidCommand(command) {
  return VALID_COMMANDS.has(command);
}
