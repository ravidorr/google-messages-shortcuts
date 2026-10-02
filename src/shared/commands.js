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
export const COMMAND_OPEN_SPAM_BLOCKED = 'open-spam-blocked';

export const DEFAULT_MANIFEST_COMMANDS = [
  COMMAND_ARCHIVE,
  COMMAND_TRASH,
  COMMAND_MARK_UNREAD,
  COMMAND_MARK_READ
];

export const OPTIONAL_MANIFEST_COMMANDS = [
  COMMAND_OPEN_ARCHIVED,
  COMMAND_START_CHAT,
  COMMAND_OPEN_SPAM_BLOCKED
];

export const MANIFEST_COMMANDS = [
  ...DEFAULT_MANIFEST_COMMANDS,
  ...OPTIONAL_MANIFEST_COMMANDS
];

export const MAX_SUGGESTED_COMMANDS = 4;
export const MAX_MANIFEST_COMMANDS = MAX_SUGGESTED_COMMANDS;

export const NAVIGATION_COMMANDS = [
  COMMAND_OPEN_ARCHIVED,
  COMMAND_START_CHAT,
  COMMAND_OPEN_SPAM_BLOCKED
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
