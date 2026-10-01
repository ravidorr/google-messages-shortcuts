export const COMMAND_ARCHIVE = 'archive-conversation';
export const COMMAND_TRASH = 'trash-conversation';
export const COMMAND_MARK_UNREAD = 'mark-unread-conversation';
export const COMMAND_MARK_READ = 'mark-read-conversation';

export const VALID_COMMANDS = new Set([
  COMMAND_ARCHIVE,
  COMMAND_TRASH,
  COMMAND_MARK_UNREAD,
  COMMAND_MARK_READ
]);

export function isValidCommand(command) {
  return VALID_COMMANDS.has(command);
}
