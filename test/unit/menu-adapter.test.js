import { beforeEach, describe, expect, it } from 'vitest';
import { assessListCapabilities } from '../../src/content/adapters/list-adapter.js';
import {
  assessMenuCapabilities,
  findFallbackMenuItemInOpenRowMenu,
  findLabelMatchedMenuItem,
  isConversationRowMenuOpen,
  MENU_CAPABILITY_IDS,
  MENU_SELECTORS,
  MENU_TEXT
} from '../../src/content/adapters/menu-adapter.js';
import { CAPABILITY_SUPPORTED, CAPABILITY_UNAVAILABLE, CAPABILITY_UNSAFE } from '../../src/content/adapters/capability-states.js';
import {
  duplicateArchiveMenuItems,
  duplicateTrashConfirmDialog,
  fullListActionSurface,
  menuItemsPresent,
  openRowMenuMarkUnreadFallbackOnly,
  openRowMenuMutedOnly,
  openRowMenuMuteLabelMismatchWithFallback,
  openRowMenuMissingArchiveControl,
  openTrashDialogMissingConfirmControl,
  selectedReadRow
} from '../fixtures/dom/list-states.js';

describe('menu-adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
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
