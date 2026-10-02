import { describe, expect, it } from 'vitest';
import {
  getNavigationPopupLabelsByCommand,
  NAVIGATION_ACTIONS
} from '../../src/shared/navigation-actions.js';
import {
  COMMAND_OPEN_ARCHIVED,
  COMMAND_OPEN_SPAM_BLOCKED,
  COMMAND_START_CHAT
} from '../../src/shared/commands.js';

describe('navigation-actions', () => {
  it('registers optional navigation actions', () => {
    expect(NAVIGATION_ACTIONS).toEqual([
      {
        command: COMMAND_OPEN_ARCHIVED,
        popupLabel: 'Open archived conversations'
      },
      {
        command: COMMAND_START_CHAT,
        popupLabel: 'Start chat'
      },
      {
        command: COMMAND_OPEN_SPAM_BLOCKED,
        popupLabel: 'Open Spam & blocked'
      }
    ]);
    expect(getNavigationPopupLabelsByCommand()[COMMAND_OPEN_ARCHIVED])
      .toBe('Open archived conversations');
    expect(getNavigationPopupLabelsByCommand()[COMMAND_START_CHAT])
      .toBe('Start chat');
    expect(getNavigationPopupLabelsByCommand()[COMMAND_OPEN_SPAM_BLOCKED])
      .toBe('Open Spam & blocked');
  });
});
