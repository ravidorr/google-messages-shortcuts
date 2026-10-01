import { describe, expect, it } from 'vitest';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH,
  isValidCommand
} from '../../src/shared/commands.js';

describe('commands', () => {
  it('accepts archive, trash, mark-read, and mark-unread commands', () => {
    expect(isValidCommand(COMMAND_ARCHIVE)).toBe(true);
    expect(isValidCommand(COMMAND_TRASH)).toBe(true);
    expect(isValidCommand(COMMAND_MARK_UNREAD)).toBe(true);
    expect(isValidCommand(COMMAND_MARK_READ)).toBe(true);
  });

  it('rejects unknown commands', () => {
    expect(isValidCommand('unknown-command')).toBe(false);
  });
});
