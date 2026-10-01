export const COMMAND_ARCHIVE = 'archive-conversation';
export const COMMAND_TRASH = 'trash-conversation';
export const COMMAND_MARK_UNREAD = 'mark-unread-conversation';
export const COMMAND_MARK_READ = 'mark-read-conversation';
export const COMMAND_MUTE = 'mute-conversation';
export const COMMAND_UNMUTE = 'unmute-conversation';

export const MANIFEST_COMMANDS = [
  COMMAND_ARCHIVE,
  COMMAND_TRASH,
  COMMAND_MARK_UNREAD,
  COMMAND_MARK_READ
];

export const MAX_MANIFEST_COMMANDS = 4;

export const VALID_COMMANDS = new Set([
  ...MANIFEST_COMMANDS,
  COMMAND_MUTE,
  COMMAND_UNMUTE
]);

export function isValidCommand(command) {
  return VALID_COMMANDS.has(command);
}

export function isManifestCommand(command) {
  return MANIFEST_COMMANDS.includes(command);
}
