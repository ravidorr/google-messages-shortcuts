import { describe, expect, it } from 'vitest';
import {
  COMMAND_ARCHIVE,
  COMMAND_TRASH,
  isValidCommand
} from '../../src/shared/commands.js';

describe('commands', () => {
  it('accepts archive and trash commands', () => {
    expect(isValidCommand(COMMAND_ARCHIVE)).toBe(true);
    expect(isValidCommand(COMMAND_TRASH)).toBe(true);
  });

  it('rejects unknown commands', () => {
    expect(isValidCommand('unknown-command')).toBe(false);
  });
});
