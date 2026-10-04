import { beforeEach, describe, expect, it } from 'vitest';
import { assessListCapabilities } from '../../src/content/adapters/list-adapter.js';
import {
  assessMenuCapabilities,
  findBlockReportSpamConfirmControl,
  findBlockReportSpamConfirmFallbackControl,
  findTrashConfirmControl,
  hasBlockReportSpamConfirmControl,
  findFallbackMenuItemInOpenRowMenu,
  findLabelMatchedMenuItem,
  isBlockReportSpamConfirmLabel,
  isBlockReportSpamMenuLabel,
  isConversationRowMenuOpen,
  MENU_CAPABILITY_IDS,
  MENU_SELECTORS,
  MENU_TEXT
} from '../../src/content/adapters/menu-adapter.js';
import { CAPABILITY_SUPPORTED, CAPABILITY_UNAVAILABLE, CAPABILITY_UNSAFE } from '../../src/content/adapters/capability-states.js';
import {
  blockReportSpamConfirmDialog,
  blockReportSpamConfirmOkDialog,
  groupThreadBlockReportSpamMenuOpen,
  duplicateArchiveMenuItems,
  duplicateBlockReportSpamConfirmDialog,
  duplicateTrashConfirmDialog,
  fullListActionSurface,
  menuItemsPresent,
  openRowMenuMarkUnreadFallbackOnly,
  openBlockDialogMissingConfirmControl,
  openRowMenuMutedOnly,
  openRowMenuMuteLabelMismatchWithFallback,
  openRowMenuMissingArchiveControl,
  openTrashDialogMissingConfirmControl,
  selectedReadRow,
  trashConfirmDialog
} from '../fixtures/dom/list-states.js';

describe('menu-adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('defers block confirmation when list targeting is unavailable', () => {
    const localThis = assessMenuCapabilities(document, {
      'list.targeting': {
        state: CAPABILITY_UNAVAILABLE,
        reason: 'No rows',
        evidenceSource: 'dom-query'
      }
    });

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm].reason)
      .toContain('List targeting');
  });

  it('defers menu capabilities when list targeting is unavailable', () => {
    const localThis = assessMenuCapabilities(document, {
      'list.targeting': {
        state: CAPABILITY_UNAVAILABLE,
        reason: 'No rows',
        evidenceSource: 'dom-query'
      }
    });

    expect(localThis[MENU_CAPABILITY_IDS.archive].state).toBe(CAPABILITY_UNAVAILABLE);
    expect(localThis[MENU_CAPABILITY_IDS.trashConfirm].reason).toContain('List targeting');
  });

  it('supports menu actions when menu items are present in the document', () => {
    document.body.innerHTML = `${selectedReadRow}${menuItemsPresent}`;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.archive].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis[MENU_CAPABILITY_IDS.archive].evidenceSource).toBe('dom-query');
    expect(localThis[MENU_CAPABILITY_IDS.trash].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis[MENU_CAPABILITY_IDS.markUnread].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis[MENU_CAPABILITY_IDS.mute].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis[MENU_CAPABILITY_IDS.unmute].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpam].state).toBe(CAPABILITY_SUPPORTED);
  });

  it('supports contract-only menu actions when the row menu has not been opened', () => {
    document.body.innerHTML = selectedReadRow;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.archive]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'contract'
    });
  });

  it('marks duplicate menu selectors as unsafe', () => {
    document.body.innerHTML = `${selectedReadRow}${duplicateArchiveMenuItems}`;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.archive].state).toBe(CAPABILITY_UNSAFE);
  });

  it('detects trash confirmation controls in the document', () => {
    document.body.innerHTML = fullListActionSurface;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.trashConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query'
    });
  });

  it('marks duplicate trash confirmation selectors as unsafe', () => {
    document.body.innerHTML = `${selectedReadRow}${duplicateTrashConfirmDialog}`;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.trashConfirm].state).toBe(CAPABILITY_UNSAFE);
  });

  it('returns null when multiple labeled trash confirm controls match the primary selector', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-action-button-confirm>Move to trash</button>
        <button data-e2e-action-button-confirm>Move to trash</button>
      </mat-dialog-container>
    `;

    expect(findTrashConfirmControl(document, MENU_SELECTORS)).toBeNull();
  });

  it('supports fallback menu labels while the row menu is open', () => {
    document.body.innerHTML = openRowMenuMarkUnreadFallbackOnly;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.markUnread]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query-fallback'
    });
  });

  it('marks missing controls unavailable while the row menu is open', () => {
    document.body.innerHTML = openRowMenuMissingArchiveControl;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.archive]).toMatchObject({
      state: CAPABILITY_UNAVAILABLE,
      evidenceSource: 'dom-query'
    });
    expect(localThis[MENU_CAPABILITY_IDS.trash]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query-fallback'
    });
  });

  it('returns null when the row menu panel is absent during fallback lookup', () => {
    document.body.innerHTML = selectedReadRow;

    expect(findFallbackMenuItemInOpenRowMenu(document, 'Archive', MENU_SELECTORS)).toBeNull();
  });

  it('uses default row menu panel selectors when overrides omit the panel anchor', () => {
    document.body.innerHTML = openRowMenuMarkUnreadFallbackOnly;
    const selectorsWithoutPanel = {
      ...MENU_SELECTORS,
      rowMenuPanel: undefined
    };

    expect(isConversationRowMenuOpen(document, selectorsWithoutPanel)).toBe(true);
    expect(findFallbackMenuItemInOpenRowMenu(
      document,
      'Mark as unread',
      selectorsWithoutPanel
    )).not.toBeNull();
  });

  it('marks mute unavailable when the primary toggle control has no label text', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel">
        <button data-e2e-conversation-menu-mute class="mat-mdc-menu-item"></button>
      </div>
    `;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.mute]).toMatchObject({
      state: CAPABILITY_UNAVAILABLE,
      evidenceSource: 'dom-query'
    });
  });

  it('marks mute unavailable while the row menu shows Unmute', () => {
    document.body.innerHTML = openRowMenuMutedOnly;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.mute]).toMatchObject({
      state: CAPABILITY_UNAVAILABLE,
      evidenceSource: 'dom-query'
    });
    expect(localThis[MENU_CAPABILITY_IDS.unmute]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query'
    });
  });

  it('supports fallback mute labels when the primary toggle label does not match', () => {
    document.body.innerHTML = openRowMenuMuteLabelMismatchWithFallback;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.mute]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query-fallback'
    });
  });

  it('finds label-matched toggle menu items by expected text', () => {
    document.body.innerHTML = openRowMenuMutedOnly;

    expect(findLabelMatchedMenuItem(
      document,
      MENU_SELECTORS.muteMenuItem,
      MENU_TEXT.unmute,
      MENU_SELECTORS
    )?.textContent).toContain('Unmute');
    expect(findLabelMatchedMenuItem(
      document,
      MENU_SELECTORS.muteMenuItem,
      MENU_TEXT.mute,
      MENU_SELECTORS
    )).toBeNull();
  });

  it('finds label-matched items via the primary toggle selector', () => {
    document.body.innerHTML = '<button data-e2e-conversation-menu-mute>Mute</button>';

    const localThis = findLabelMatchedMenuItem(
      document,
      MENU_SELECTORS.muteMenuItem,
      MENU_TEXT.mute,
      MENU_SELECTORS
    );

    expect(localThis?.getAttribute('data-e2e-conversation-menu-mute')).toBe('');
  });

  it('falls back when the primary toggle label is empty', () => {
    document.body.innerHTML = `
      <button data-e2e-conversation-menu-mute></button>
      <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel">
        <button class="mat-mdc-menu-item">Mute</button>
      </div>
    `;

    expect(findLabelMatchedMenuItem(
      document,
      MENU_SELECTORS.muteMenuItem,
      MENU_TEXT.mute,
      MENU_SELECTORS
    )?.classList.contains('mat-mdc-menu-item')).toBe(true);
  });

  it('detects block confirmation controls in the document', () => {
    document.body.innerHTML = `${selectedReadRow}${blockReportSpamConfirmDialog}`;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query'
    });
  });

  it('detects live block confirmation controls labeled OK', () => {
    document.body.innerHTML = `${selectedReadRow}${blockReportSpamConfirmOkDialog}`;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(isBlockReportSpamConfirmLabel('OK')).toBe(true);
    expect(findBlockReportSpamConfirmControl(document)?.textContent).toBe('OK');
    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query'
    });
  });

  it('accepts group-thread Report spam menu labels while the row menu is open', () => {
    document.body.innerHTML = groupThreadBlockReportSpamMenuOpen;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(isBlockReportSpamMenuLabel('Report spam')).toBe(true);
    expect(isBlockReportSpamMenuLabel('Block & report spam')).toBe(true);
    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpam]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query'
    });
  });

  it('marks duplicate block confirmation selectors as unsafe', () => {
    document.body.innerHTML = `${selectedReadRow}${duplicateBlockReportSpamConfirmDialog}`;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm].state).toBe(CAPABILITY_UNSAFE);
  });

  it('finds block confirmation controls through the primary selector', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      ${blockReportSpamConfirmDialog}
    `;

    expect(findBlockReportSpamConfirmControl(document)).toBe(
      document.querySelector('[data-e2e-action-button-confirm]')
    );
    expect(hasBlockReportSpamConfirmControl(document)).toBe(true);
  });

  it('skips non-block primary labels before matching the block confirmation control', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button data-e2e-action-button-confirm>Continue</button>
        <button data-e2e-action-button-confirm>Cancel</button>
        <button data-e2e-action-button-confirm>Block</button>
      </mat-dialog-container>
    `;

    expect(findBlockReportSpamConfirmControl(document)?.textContent).toBe('Block');
  });

  it('skips empty dialog labels when matching block confirmation controls', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button data-e2e-action-button-confirm></button>
        <button class="mat-focus-indicator"></button>
        <button data-e2e-action-button-confirm>Block</button>
      </mat-dialog-container>
    `;

    expect(findBlockReportSpamConfirmControl(document)?.textContent).toBe('Block');
  });

  it('finds block confirmation controls through primary and fallback selectors', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button data-e2e-action-button-confirm>Move to trash</button>
        <button class="mat-focus-indicator">Block</button>
      </mat-dialog-container>
    `;

    expect(findBlockReportSpamConfirmControl(document)).toBe(
      document.querySelector('.mat-focus-indicator')
    );
    expect(hasBlockReportSpamConfirmControl(document)).toBe(true);
  });

  it('detects trash confirmation through the dialog loop when the primary label mismatches', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button data-e2e-action-button-confirm>Block</button>
        <button>Move to trash</button>
      </mat-dialog-container>
    `;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query'
    });
  });

  it('returns null for block fallback lookup when no dialog is open', () => {
    document.body.innerHTML = selectedReadRow;

    expect(findBlockReportSpamConfirmFallbackControl(document)).toBeNull();
    expect(isBlockReportSpamConfirmLabel('Block')).toBe(true);
    expect(isBlockReportSpamConfirmLabel('Block & report spam')).toBe(true);
    expect(isBlockReportSpamConfirmLabel('OK')).toBe(true);
    expect(isBlockReportSpamConfirmLabel('Move to trash')).toBe(false);
  });

  it('finds block fallback controls after scanning non-block dialog buttons', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button class="mat-focus-indicator">Cancel</button>
        <button class="mat-focus-indicator">Block</button>
      </mat-dialog-container>
    `;

    expect(findBlockReportSpamConfirmFallbackControl(document)?.textContent).toBe('Block');
  });

  it('detects trash confirmation through dialog fallback when the primary label mismatches', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button data-e2e-action-button-confirm>Block</button>
        <button class="mat-focus-indicator">Move to trash</button>
      </mat-dialog-container>
    `;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query'
    });
  });

  it('detects trash confirmation through the primary selector when present', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      ${trashConfirmDialog}
    `;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.trashConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query'
    });
  });

  it('detects trash confirmation text through fallback dialog controls', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button class="mat-focus-indicator">Move to trash</button>
      </mat-dialog-container>
    `;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'contract'
    });
  });

  it('skips empty dialog labels when detecting trash confirmation in an open dialog', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button data-e2e-action-button-confirm></button>
        <button class="mat-focus-indicator"></button>
        <button class="mat-focus-indicator">Move to trash</button>
      </mat-dialog-container>
    `;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'contract'
    });
  });

  it('supports block confirmation fallback labels while the dialog is open', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button class="mat-focus-indicator">Block &amp; report spam</button>
      </mat-dialog-container>
    `;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm]).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query-fallback'
    });
  });

  it('finds block confirmation fallback controls by English label', () => {
    document.body.innerHTML = `
      ${selectedReadRow}
      <mat-dialog-container>
        <button class="mat-focus-indicator">Block</button>
      </mat-dialog-container>
    `;

    expect(isBlockReportSpamConfirmLabel('Block')).toBe(true);
    expect(findBlockReportSpamConfirmFallbackControl(document)?.textContent).toBe('Block');
  });

  it('marks missing block confirm controls unavailable while the dialog is open', () => {
    document.body.innerHTML = openBlockDialogMissingConfirmControl;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.blockReportSpamConfirm]).toMatchObject({
      state: CAPABILITY_UNAVAILABLE,
      evidenceSource: 'dom-query'
    });
  });

  it('marks missing trash confirm controls unavailable while the dialog is open', () => {
    document.body.innerHTML = openTrashDialogMissingConfirmControl;
    const listCapabilities = assessListCapabilities(document);
    const localThis = assessMenuCapabilities(document, listCapabilities);

    expect(localThis[MENU_CAPABILITY_IDS.trashConfirm]).toMatchObject({
      state: CAPABILITY_UNAVAILABLE,
      evidenceSource: 'dom-query'
    });
  });
});
