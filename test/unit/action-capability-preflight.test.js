import { describe, expect, it, vi } from 'vitest';
import {
  assessRowActionCapability,
  assessTrashConfirmCapability,
  assessTrashConfirmCapabilityAfterRender,
  findTrashConfirmFallbackControl
} from '../../src/content/action-capability-preflight.js';
import { getRowAction } from '../../src/content/row-action-registry.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_TRASH,
  COMMAND_UNARCHIVE
} from '../../src/shared/commands.js';
import { SELECTORS } from '../../src/content/google-messages-dom.js';
import { POLL_INTERVAL_MS } from '../../src/content/wait-for-element.js';
import * as pageAdapter from '../../src/content/adapters/page-adapter.js';
import {
  duplicateArchiveMenuItems,
  duplicateTrashConfirmDialog,
  openRowMenuMissingArchiveControl,
  openTrashDialogMissingConfirmControl,
  rowMissingConversationLink,
  rowMissingMenuButton,
  archivedModalSurface,
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

  it('does not synchronously block trash confirm when the dialog shell is open without controls', () => {
    document.body.innerHTML = openTrashDialogMissingConfirmControl;

    const localThis = assessTrashConfirmCapability(document, SELECTORS);

    expect(localThis).toEqual({ allowed: true });
  });

  it('blocks trash confirm after waiting when the dialog stays without a confirm control', async () => {
    document.body.innerHTML = openTrashDialogMissingConfirmControl;

    const localThis = await assessTrashConfirmCapabilityAfterRender(document, SELECTORS, 50);

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityId).toBe('menu.trashConfirm');
    expect(localThis.capabilityState).toBe('unavailable');
  });

  it('returns unsafe trash confirm assessment immediately without waiting', async () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      ${duplicateTrashConfirmDialog}
    `;

    const localThis = await assessTrashConfirmCapabilityAfterRender(document, SELECTORS, 50);

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityState).toBe('unsafe');
  });

  it('allows trash confirm when no dialog is open yet', async () => {
    document.body.innerHTML = selectedReadRow;

    const localThis = await assessTrashConfirmCapabilityAfterRender(document, SELECTORS, 50);

    expect(localThis).toEqual({ allowed: true });
  });

  it('allows trash confirm after fallback wait when only the English control appears', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container></mat-dialog-container>
    `;

    const assessmentPromise = assessTrashConfirmCapabilityAfterRender(document, SELECTORS, 50);

    setTimeout(() => {
      document.querySelector('mat-dialog-container').innerHTML =
        '<button class="mat-focus-indicator">Move to trash</button>';
    }, POLL_INTERVAL_MS * 2);

    const localThisPromise = assessmentPromise.then((result) => result);
    await vi.runAllTimersAsync();

    expect(await localThisPromise).toEqual({ allowed: true });
    vi.useRealTimers();
  });

  it('allows trash confirm when the dialog closes before controls render', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container></mat-dialog-container>
    `;

    const assessmentPromise = assessTrashConfirmCapabilityAfterRender(document, SELECTORS, 50);

    setTimeout(() => {
      document.querySelector('mat-dialog-container').remove();
    }, POLL_INTERVAL_MS * 2);

    const localThisPromise = assessmentPromise.then((result) => result);
    await vi.runAllTimersAsync();

    expect(await localThisPromise).toEqual({ allowed: true });
    vi.useRealTimers();
  });

  it('allows trash confirm after waiting when the confirm control renders late', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container></mat-dialog-container>
    `;

    const assessmentPromise = assessTrashConfirmCapabilityAfterRender(document, SELECTORS);

    setTimeout(() => {
      document.querySelector('mat-dialog-container').innerHTML =
        '<button data-e2e-action-button-confirm>Move to trash</button>';
    }, POLL_INTERVAL_MS);

    const localThisPromise = assessmentPromise.then((result) => result);
    await vi.runAllTimersAsync();

    const localThis = await localThisPromise;

    expect(localThis).toEqual({ allowed: true });
    vi.useRealTimers();
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

  it('allows mark-read when conversation links are supported', () => {
    document.body.innerHTML = selectedReadRow;

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_MARK_READ),
      SELECTORS
    );

    expect(localThis).toEqual({ allowed: true });
  });

  it('allows mark-read when another row is missing a menu button but links remain available', () => {
    document.body.innerHTML = rowMissingMenuButton;

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_MARK_READ),
      SELECTORS
    );

    expect(localThis).toEqual({ allowed: true });
  });

  it('blocks mark-read when list conversation links are unsafe', () => {
    document.body.innerHTML = selectedReadRow;
    vi.spyOn(pageAdapter, 'assessPageCapabilities').mockReturnValue({
      list: {
        'list.conversationLink': { state: 'unsafe', reason: 'Conversation link missing.' }
      },
      menu: {}
    });

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_MARK_READ),
      SELECTORS
    );

    expect(localThis).toEqual({
      allowed: false,
      reason: 'capability-blocked',
      capabilityId: 'list.conversationLink',
      capabilityState: 'unsafe',
      capabilityReason: 'Conversation link missing.'
    });
    vi.restoreAllMocks();
  });

  it('blocks mark-read when list conversation links are unavailable', () => {
    document.body.innerHTML = '';

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_MARK_READ),
      SELECTORS
    );

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityId).toBe('list.conversationLink');
    expect(localThis.capabilityState).toBe('unavailable');
  });

  it('blocks mark-read when a row is missing its conversation link', () => {
    document.body.innerHTML = rowMissingConversationLink;

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_MARK_READ),
      SELECTORS
    );

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityId).toBe('list.conversationLink');
    expect(localThis.capabilityState).toBe('unsafe');
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

  it('blocks unarchive when the archived modal is closed', () => {
    document.body.innerHTML = selectedReadRow;

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_UNARCHIVE),
      SELECTORS
    );

    expect(localThis.allowed).toBe(false);
    expect(localThis.capabilityId).toBe('archived.unarchive');
    expect(localThis.capabilityState).toBe('unavailable');
  });

  it('allows unarchive when the archived modal is open', () => {
    document.body.innerHTML = archivedModalSurface;

    const localThis = assessRowActionCapability(
      document,
      getRowAction(COMMAND_UNARCHIVE),
      SELECTORS
    );

    expect(localThis).toEqual({ allowed: true });
  });
});
