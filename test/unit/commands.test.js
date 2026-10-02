import { describe, expect, it } from 'vitest';
import {
  COMMAND_ARCHIVE,
  COMMAND_BLOCK_REPORT_SPAM,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_MUTE,
  COMMAND_OPEN_ARCHIVED,
  COMMAND_TRASH,
  COMMAND_UNARCHIVE,
  COMMAND_UNMUTE,
  MANIFEST_COMMANDS,
  MAX_MANIFEST_COMMANDS,
  isManifestCommand,
  isNavigationCommand,
  isValidCommand
} from '../../src/shared/commands.js';

describe('commands', () => {
  it('accepts approved row action commands', () => {
    expect(isValidCommand(COMMAND_ARCHIVE)).toBe(true);
    expect(isValidCommand(COMMAND_TRASH)).toBe(true);
    expect(isValidCommand(COMMAND_MARK_UNREAD)).toBe(true);
    expect(isValidCommand(COMMAND_MARK_READ)).toBe(true);
    expect(isValidCommand(COMMAND_MUTE)).toBe(true);
    expect(isValidCommand(COMMAND_UNMUTE)).toBe(true);
    expect(isValidCommand(COMMAND_UNARCHIVE)).toBe(true);
    expect(isValidCommand(COMMAND_BLOCK_REPORT_SPAM)).toBe(true);
    expect(isValidCommand(COMMAND_OPEN_ARCHIVED)).toBe(true);
  });

  it('rejects unknown commands', () => {
    expect(isValidCommand('unknown-command')).toBe(false);
  });

  it('keeps manifest commands within the Chrome limit', () => {
    expect(MANIFEST_COMMANDS).toHaveLength(MAX_MANIFEST_COMMANDS);
    expect(isManifestCommand(COMMAND_MUTE)).toBe(false);
    expect(isManifestCommand(COMMAND_UNMUTE)).toBe(false);
    expect(isManifestCommand(COMMAND_UNARCHIVE)).toBe(false);
    expect(isManifestCommand(COMMAND_BLOCK_REPORT_SPAM)).toBe(false);
    expect(isManifestCommand(COMMAND_OPEN_ARCHIVED)).toBe(false);
    expect(isManifestCommand(COMMAND_ARCHIVE)).toBe(true);
    expect(isNavigationCommand(COMMAND_OPEN_ARCHIVED)).toBe(true);
  });
});
