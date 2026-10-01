import { describe, expect, it } from 'vitest';
import { getCommandIcon } from '../../src/shared/command-icons.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH
} from '../../src/shared/commands.js';

describe('command-icons', () => {
  it('provides Lucide definitions for every shortcut command', () => {
    for (const command of [
      COMMAND_ARCHIVE,
      COMMAND_TRASH,
      COMMAND_MARK_READ,
      COMMAND_MARK_UNREAD
    ]) {
      expect(getCommandIcon(command)).toMatchObject({
        paths: expect.any(Array),
        viewBox: '0 0 24 24'
      });
      expect(getCommandIcon(command).paths.length).toBeGreaterThan(0);
    }
  });

  it('returns undefined for unsupported commands', () => {
    expect(getCommandIcon('unknown-command')).toBeUndefined();
  });
});
