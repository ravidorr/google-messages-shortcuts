import { beforeEach, describe, expect, it } from 'vitest';
import { assessListCapabilities } from '../../src/content/adapters/list-adapter.js';
import {
  assessMenuCapabilities,
  MENU_CAPABILITY_IDS
} from '../../src/content/adapters/menu-adapter.js';
import { CAPABILITY_SUPPORTED, CAPABILITY_UNAVAILABLE, CAPABILITY_UNSAFE } from '../../src/content/adapters/capability-states.js';
import {
  duplicateArchiveMenuItems,
  duplicateTrashConfirmDialog,
  fullListActionSurface,
  menuItemsPresent,
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
});
