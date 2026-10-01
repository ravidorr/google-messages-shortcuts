// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  APPROVED_ROW_ACTIONS,
  ACTION_DECISION_APPROVE,
  getApprovedCommands,
  getBasePillDefinitions,
  getMarkUnreadPillDefinition,
  getPopupLabelsByCommand,
  getRowAction,
  isApprovedRowAction
} from '../../src/content/row-action-registry.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH,
  VALID_COMMANDS
} from '../../src/shared/commands.js';

const decisionsPath = fileURLToPath(
  new URL('../../docs/dom-discovery/phase1-action-decisions.md', import.meta.url)
);

describe('row-action-registry', () => {
  it('registers the three matrix-approved row actions', () => {
    expect(getApprovedCommands()).toEqual([
      COMMAND_ARCHIVE,
      COMMAND_TRASH,
      COMMAND_MARK_UNREAD
    ]);
    expect(APPROVED_ROW_ACTIONS.every((action) => action.decision === ACTION_DECISION_APPROVE)).toBe(
      true
    );
  });

  it('syncs approved commands with VALID_COMMANDS', () => {
    expect(new Set(getApprovedCommands())).toEqual(VALID_COMMANDS);
  });

  it('resolves row actions by command id', () => {
    expect(getRowAction(COMMAND_ARCHIVE)?.capabilityId).toBe('menu.archive');
    expect(getRowAction(COMMAND_TRASH)?.executionKind).toBe('trash-with-confirm');
    expect(getRowAction(COMMAND_MARK_UNREAD)?.selectorStrategy).toBe('fallback-first');
    expect(isApprovedRowAction('unsupported')).toBe(false);
    expect(getRowAction('unsupported')).toBeNull();
  });

  it('exposes pill and popup metadata', () => {
    expect(getBasePillDefinitions()).toEqual([
      { command: COMMAND_ARCHIVE, label: 'Archive', shortcutKey: 'archive' },
      { command: COMMAND_TRASH, label: 'Trash', shortcutKey: 'trash' }
    ]);
    expect(getMarkUnreadPillDefinition()).toEqual({
      command: COMMAND_MARK_UNREAD,
      label: 'Mark as unread',
      shortcutKey: 'markUnread'
    });
    expect(getPopupLabelsByCommand()[COMMAND_ARCHIVE]).toBe('Archive conversation');
  });

  it('matches phase1 approve rows in the decision doc', async () => {
    const localThis = await readFile(decisionsPath, 'utf8');
    const approveRows = [
      'Archive',
      'Move to trash',
      'Mark as unread'
    ];

    for (const rowLabel of approveRows) {
      expect(localThis).toContain(`| ${rowLabel} | **Approve** |`);
    }

    expect(APPROVED_ROW_ACTIONS).toHaveLength(approveRows.length);
  });
});
