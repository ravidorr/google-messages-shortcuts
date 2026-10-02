import { describe, expect, it } from 'vitest';
import {
  getNavigationPopupLabelsByCommand,
  getNavigationShortcutLabel,
  NAVIGATION_ACTIONS
} from '../../src/shared/navigation-actions.js';
import { COMMAND_OPEN_ARCHIVED } from '../../src/shared/commands.js';

describe('navigation-actions', () => {
  it('registers the open archived navigation action', () => {
    expect(NAVIGATION_ACTIONS).toEqual([
      {
        command: COMMAND_OPEN_ARCHIVED,
        popupLabel: 'Open archived conversations',
        shortcutKey: 'openArchived'
      }
    ]);
    expect(getNavigationPopupLabelsByCommand()[COMMAND_OPEN_ARCHIVED])
      .toBe('Open archived conversations');
    expect(getNavigationShortcutLabel(NAVIGATION_ACTIONS[0], 'Win32'))
      .toBe('Ctrl+Shift+A');
    expect(getNavigationShortcutLabel({ command: 'unknown' }, 'Win32')).toBe('');
  });
});
