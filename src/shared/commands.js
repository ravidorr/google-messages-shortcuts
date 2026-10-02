export const COMMAND_ARCHIVE = 'archive-conversation';
export const COMMAND_TRASH = 'trash-conversation';
export const COMMAND_MARK_UNREAD = 'mark-unread-conversation';
export const COMMAND_MARK_READ = 'mark-read-conversation';
export const COMMAND_MUTE = 'mute-conversation';
export const COMMAND_UNMUTE = 'unmute-conversation';
export const COMMAND_UNARCHIVE = 'unarchive-conversation';
export const COMMAND_BLOCK_REPORT_SPAM = 'block-report-spam-conversation';
export const COMMAND_OPEN_ARCHIVED = 'open-archived';
export const COMMAND_START_CHAT = 'start-chat';

export const MANIFEST_COMMANDS = [
  COMMAND_ARCHIVE,
  COMMAND_TRASH,
  COMMAND_MARK_UNREAD,
  COMMAND_MARK_READ
];

export const MAX_MANIFEST_COMMANDS = 4;

export const NAVIGATION_COMMANDS = [
  COMMAND_OPEN_ARCHIVED,
  COMMAND_START_CHAT
];

export const VALID_COMMANDS = new Set([
  ...MANIFEST_COMMANDS,
  ...NAVIGATION_COMMANDS,
  COMMAND_MUTE,
  COMMAND_UNMUTE,
  COMMAND_UNARCHIVE,
  COMMAND_BLOCK_REPORT_SPAM
]);

export function isValidCommand(command) {
  return VALID_COMMANDS.has(command);
}

export function isManifestCommand(command) {
  return MANIFEST_COMMANDS.includes(command);
}

export function isNavigationCommand(command) {
  return NAVIGATION_COMMANDS.includes(command);
}
