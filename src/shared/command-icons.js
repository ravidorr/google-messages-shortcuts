import {
  COMMAND_ARCHIVE,
  COMMAND_BLOCK_REPORT_SPAM,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_MUTE,
  COMMAND_OPEN_ARCHIVED,
  COMMAND_OPEN_SPAM_BLOCKED,
  COMMAND_START_CHAT,
  COMMAND_TRASH,
  COMMAND_UNARCHIVE,
  COMMAND_UNMUTE
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
  [COMMAND_BLOCK_REPORT_SPAM]: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
      'M9 9h6',
      'M12 6v6'
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
      'M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z',
      'm22 10-8.97 6.76a2 2 0 0 1-2.06 0L2 10'
    ]
  },
  [COMMAND_MUTE]: {
    viewBox: '0 0 24 24',
    paths: [
      'M11 5 6 9H2v6h4l5 4V5Z',
      'M16 9l6 6',
      'M22 9l-6 6'
    ]
  },
  [COMMAND_UNMUTE]: {
    viewBox: '0 0 24 24',
    paths: [
      'M11 5 6 9H2v6h4l5 4V5Z',
      'M15.54 8.46a5 5 0 0 1 0 7.07'
    ]
  },
  [COMMAND_UNARCHIVE]: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 3h18a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
      'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8',
      'M12 12v4',
      'M9 14h6'
    ]
  },
  [COMMAND_OPEN_ARCHIVED]: {
    viewBox: '0 0 24 24',
    paths: [
      'M3 3h18a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
      'M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8',
      'M10 12h4'
    ]
  },
  [COMMAND_OPEN_SPAM_BLOCKED]: {
    viewBox: '0 0 24 24',
    paths: [
      'M5 5l14 14',
      'M19 5 5 19',
      'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z'
    ]
  },
  [COMMAND_START_CHAT]: {
    viewBox: '0 0 24 24',
    paths: [
      'M12 5v14',
      'M5 12h14',
      'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'
    ]
  }
};

export function getCommandIcon(commandName) {
  return COMMAND_ICONS[commandName];
}
