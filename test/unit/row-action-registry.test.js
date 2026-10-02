// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  APPROVED_ROW_ACTIONS,
  ACTION_DECISION_APPROVE,
  EXECUTION_KIND_OPEN_ROW,
  getApprovedCommands,
  getManifestEligibleActions,
  getPopupLabelsByCommand,
  getRowAction,
  isApprovedRowAction
} from '../../src/content/row-action-registry.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_BLOCK_REPORT_SPAM,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_MUTE,
  COMMAND_TRASH,
  COMMAND_UNARCHIVE,
  COMMAND_UNMUTE,
  DEFAULT_MANIFEST_COMMANDS,
  NAVIGATION_COMMANDS,
  VALID_COMMANDS
} from '../../src/shared/commands.js';

const decisionsPath = fileURLToPath(
  new URL('../../docs/dom-discovery/phase1-action-decisions.md', import.meta.url)
);

describe('row-action-registry', () => {
  it('registers the matrix-approved row actions', () => {
    expect(getApprovedCommands()).toEqual([
      COMMAND_ARCHIVE,
      COMMAND_TRASH,
      COMMAND_MARK_READ,
      COMMAND_MARK_UNREAD,
      COMMAND_MUTE,
      COMMAND_UNMUTE,
      COMMAND_BLOCK_REPORT_SPAM,
      COMMAND_UNARCHIVE
    ]);
    expect(APPROVED_ROW_ACTIONS.every((action) => action.decision === ACTION_DECISION_APPROVE)).toBe(
      true
    );
  });

  it('includes approved row and navigation commands in VALID_COMMANDS', () => {
    for (const command of [...getApprovedCommands(), ...NAVIGATION_COMMANDS]) {
      expect(VALID_COMMANDS.has(command)).toBe(true);
    }
  });

  it('limits manifest-eligible actions to the Chrome command cap', () => {
    expect(new Set(getManifestEligibleActions().map((action) => action.command)))
      .toEqual(new Set(DEFAULT_MANIFEST_COMMANDS));
    expect(getRowAction(COMMAND_MUTE)?.pillOnly).toBe(true);
    expect(getRowAction(COMMAND_UNMUTE)?.pillOnly).toBe(true);
    expect(getRowAction(COMMAND_BLOCK_REPORT_SPAM)?.pillOnly).toBe(true);
  });

  it('resolves row actions by command id', () => {
    expect(getRowAction(COMMAND_ARCHIVE)?.capabilityId).toBe('menu.archive');
    expect(getRowAction(COMMAND_TRASH)?.executionKind).toBe('trash-with-confirm');
    expect(getRowAction(COMMAND_BLOCK_REPORT_SPAM)?.executionKind)
      .toBe('block-report-spam-with-native-confirm');
    expect(getRowAction(COMMAND_MARK_UNREAD)?.selectorStrategy).toBe('fallback-first');
    expect(getRowAction(COMMAND_MUTE)?.selectorStrategy).toBe('label-matched');
    expect(getRowAction(COMMAND_UNMUTE)?.menuItemSelectorKey).toBe('muteMenuItem');
    expect(getRowAction(COMMAND_UNARCHIVE)?.executionKind).toBe('archived-modal-click');
    expect(getRowAction(COMMAND_UNARCHIVE)?.supportsPill).toBe(false);
    expect(getRowAction(COMMAND_MARK_READ)?.executionKind).toBe(EXECUTION_KIND_OPEN_ROW);
    expect(isApprovedRowAction('unsupported')).toBe(false);
    expect(getRowAction('unsupported')).toBeNull();
  });

  it('exposes popup labels for every approved action', () => {
    expect(getPopupLabelsByCommand()[COMMAND_ARCHIVE]).toBe('Archive conversation');
    expect(getPopupLabelsByCommand()[COMMAND_MARK_READ]).toBe('Mark conversation as read');
    expect(getPopupLabelsByCommand()[COMMAND_MARK_UNREAD]).toBe('Mark conversation as unread');
  });

  it('matches phase1 approve rows in the decision doc', async () => {
    const localThis = await readFile(decisionsPath, 'utf8');
    const approveRows = [
      'Archive',
      'Move to trash',
      'Mark as unread',
      'Mark as read (open row)',
      'Mute conversation',
      'Unmute conversation',
      'Block / report spam',
      'Unarchive'
    ];

    for (const rowLabel of approveRows) {
      expect(localThis).toContain(`| ${rowLabel} | **Approve** |`);
    }

    expect(APPROVED_ROW_ACTIONS).toHaveLength(approveRows.length);
  });
});
