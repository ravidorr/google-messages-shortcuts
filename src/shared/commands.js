export const COMMAND_ARCHIVE = 'archive-conversation';
export const COMMAND_TRASH = 'trash-conversation';

export const VALID_COMMANDS = new Set([
  COMMAND_ARCHIVE,
  COMMAND_TRASH
]);

export function isValidCommand(command) {
  return VALID_COMMANDS.has(command);
}
