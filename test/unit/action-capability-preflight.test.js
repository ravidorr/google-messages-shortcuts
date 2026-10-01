import { describe, expect, it } from 'vitest';
import {
  assessRowActionCapability,
  assessTrashConfirmCapability,
  findTrashConfirmFallbackControl
} from '../../src/content/action-capability-preflight.js';
import { getRowAction } from '../../src/content/row-action-registry.js';
import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../../src/shared/commands.js';
import { SELECTORS } from '../../src/content/google-messages-dom.js';
import {
  duplicateArchiveMenuItems,
  duplicateTrashConfirmDialog,
  openRowMenuMissingArchiveControl,
  openTrashDialogMissingConfirmControl,
  selectedReadRow,
  trashConfirmDialog
} from '../fixtures/dom/list-states.js';

describe('action-capability-preflight', () => {
  it('allows contract and dom-query capability states', () => {
    document.body.innerHTML = selectedReadRow;

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_ARCHIVE),
      SELECTORS
    );

    expect(localThis).toEqual({ allowed: true });
  });

  it('blocks archive when multiple primary menu selectors match', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      ${duplicateArchiveMenuItems}
    `;

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_ARCHIVE),
      SELECTORS
    );

    expect(localThis).toEqual({
      allowed: false,
      reason: 'capability-blocked',
      capabilityId: 'menu.archive',
      capabilityState: 'unsafe',
      capabilityReason: expect.stringContaining('Multiple elements match')
    });
  });

  it('blocks archive when the row menu is open but the control is missing', () => {
    document.body.innerHTML = openRowMenuMissingArchiveControl;

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_ARCHIVE),
      SELECTORS
    );

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityId).toBe('menu.archive');
    expect(localThis.capabilityState).toBe('unavailable');
  });

  it('blocks trash confirm when the dialog is open without a confirm control', () => {
    document.body.innerHTML = openTrashDialogMissingConfirmControl;

    const localThis = assessTrashConfirmCapability(document, SELECTORS);

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityId).toBe('menu.trashConfirm');
    expect(localThis.capabilityState).toBe('unavailable');
  });

  it('allows trash confirm when the primary control is present', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      ${trashConfirmDialog}
    `;

    const localThis = assessTrashConfirmCapability(document, SELECTORS);

    expect(localThis).toEqual({ allowed: true });
  });

  it('allows trash confirm when only the English fallback control is present in the dialog', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button class="mat-focus-indicator">Move to trash</button>
      </mat-dialog-container>
    `;

    const localThis = assessTrashConfirmCapability(document, SELECTORS);

    expect(localThis).toEqual({ allowed: true });
  });

  it('blocks trash confirm when multiple confirm controls match', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      ${duplicateTrashConfirmDialog}
    `;

    const localThis = assessTrashConfirmCapability(document, SELECTORS);

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityId).toBe('menu.trashConfirm');
    expect(localThis.capabilityState).toBe('unsafe');
  });

  it('returns null when no trash confirmation dialog is open', () => {
    document.body.innerHTML = selectedReadRow;

    expect(findTrashConfirmFallbackControl(document)).toBeNull();
  });

  it('ignores dialog controls that do not match the English trash label', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button>Cancel</button>
        <button></button>
      </mat-dialog-container>
    `;

    expect(findTrashConfirmFallbackControl(document)).toBeNull();
  });

  it('blocks trash menu action when list targeting is unavailable', () => {
    document.body.innerHTML = '';

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_TRASH),
      SELECTORS
    );

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityId).toBe('list.targeting');
    expect(localThis.capabilityState).toBe('unavailable');
  });
});
