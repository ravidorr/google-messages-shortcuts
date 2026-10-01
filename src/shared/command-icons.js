import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH
} from './commands.js';

const COMMAND_ICONS = {
  [COMMAND_ARCHIVE]: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 3h18a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
      'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8',
      'M10 12h4'
    ]
  },
  [COMMAND_TRASH]: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 6h18',
      'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
      'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
      'M10 11v6',
      'M14 11v6'
    ]
  },
  [COMMAND_MARK_UNREAD]: {
    viewBox: '0 0 24 24',
    paths: [
      'm22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7',
      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'
    ]
  },
  [COMMAND_MARK_READ]: {
    viewBox: '0 0 24 24',
    paths: [
      'M22 12v-7l-8.991 5.727a2 2 0 0 1-2.009 0L2 5v7',
      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
      'm9 12 2 2 4-4'
    ]
  }
};

export function getCommandIcon(commandName) {
  return COMMAND_ICONS[commandName];
}
