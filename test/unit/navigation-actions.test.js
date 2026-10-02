import { describe, expect, it } from 'vitest';
import {
  getNavigationPopupLabelsByCommand,
  getNavigationShortcutLabel,
  NAVIGATION_ACTIONS
} from '../../src/shared/navigation-actions.js';
import { COMMAND_OPEN_ARCHIVED, COMMAND_START_CHAT } from '../../src/shared/commands.js';

describe('navigation-actions', () => {
  it('registers page-level navigation actions', () => {
    expect(NAVIGATION_ACTIONS).toEqual([
      {
        command: COMMAND_OPEN_ARCHIVED,
        popupLabel: 'Open archived conversations',
        shortcutKey: 'openArchived'
      },
      {
        command: COMMAND_START_CHAT,
        popupLabel: 'Start chat',
        shortcutKey: 'startChat'
      }
    ]);
    expect(getNavigationPopupLabelsByCommand()[COMMAND_OPEN_ARCHIVED])
      .toBe('Open archived conversations');
    expect(getNavigationPopupLabelsByCommand()[COMMAND_START_CHAT])
      .toBe('Start chat');
    expect(getNavigationShortcutLabel(NAVIGATION_ACTIONS[0], 'Win32'))
      .toBe('Ctrl+Shift+A');
    expect(getNavigationShortcutLabel(NAVIGATION_ACTIONS[1], 'MacIntel'))
      .toBe('⌥⌘N');
    expect(getNavigationShortcutLabel({ command: 'unknown' }, 'Win32')).toBe('');
  });
});
