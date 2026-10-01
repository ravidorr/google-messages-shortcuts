/**
 * Sanitized conversation-list DOM fragments for unit tests.
 * See docs/dom-discovery/fixture-sanitization.md before editing.
 */

export const selectedReadRow = `
  <mws-conversation-list-item id="fixture-selected-read">
    <a aria-selected="true"></a>
    <button aria-haspopup="menu"></button>
    <span>Contact A</span>
  </mws-conversation-list-item>
`;

export const unreadRow = `
  <mws-conversation-list-item id="fixture-unread">
    <a data-e2e-conversation data-e2e-is-unread="true"></a>
    <button aria-haspopup="menu"></button>
    <span>Contact B</span>
  </mws-conversation-list-item>
`;

export const selectedUnreadRow = `
  <mws-conversation-list-item id="fixture-selected-unread">
    <a aria-selected="true" data-e2e-conversation data-e2e-is-unread="true"></a>
    <button aria-haspopup="menu"></button>
    <span>Contact E</span>
  </mws-conversation-list-item>
`;

export const focusedRow = `
  <mws-conversation-list-item id="fixture-focused" is-focused="true">
    <a></a>
    <button aria-haspopup="menu"></button>
    <span>Contact C</span>
  </mws-conversation-list-item>
`;

export const rowMissingMenuButton = `
  <mws-conversation-list-item id="fixture-missing-menu">
    <a aria-selected="true"></a>
    <span>Contact D</span>
  </mws-conversation-list-item>
`;

export const emptyConversationList = '';

export const menuItemsPresent = `
  <button data-e2e-conversation-menu-archive class="mat-mdc-menu-item">
    <span class="mat-mdc-menu-item-text">Archive</span>
  </button>
  <button data-e2e-conversation-delete class="mat-mdc-menu-item">
    <span class="mat-mdc-menu-item-text">Move to trash</span>
  </button>
  <button data-e2e-conversation-menu-mark-unread class="mat-mdc-menu-item">
    <span class="mat-mdc-menu-item-text">Mark as unread</span>
  </button>
`;

export const trashConfirmDialog = `
  <mat-dialog-container>
    <button data-e2e-action-button-confirm>Move to trash</button>
  </mat-dialog-container>
`;

export const duplicateTrashConfirmDialog = `
  <mat-dialog-container>
    <button data-e2e-action-button-confirm>Move to trash A</button>
    <button data-e2e-action-button-confirm>Move to trash B</button>
  </mat-dialog-container>
`;

export const duplicateArchiveMenuItems = `
  <button data-e2e-conversation-menu-archive>Archive A</button>
  <button data-e2e-conversation-menu-archive>Archive B</button>
`;

export const fullListActionSurface = `
  ${selectedReadRow}
  ${unreadRow}
  ${menuItemsPresent}
  ${trashConfirmDialog}
`;

export const openRowMenuMarkUnreadFallbackOnly = `
  ${selectedReadRow}
  <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel">
    <button class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Mark as unread</span>
    </button>
  </div>
`;

export const openRowMenuMissingArchiveControl = `
  ${selectedReadRow}
  <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel">
    <button class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Move to trash</span>
    </button>
  </div>
`;

export const openTrashDialogMissingConfirmControl = `
  ${selectedReadRow}
  <mat-dialog-container>
    <button>Cancel</button>
  </mat-dialog-container>
`;

export const FIXTURE_EXPORT_NAMES = [
  'selectedReadRow',
  'unreadRow',
  'selectedUnreadRow',
  'focusedRow',
  'rowMissingMenuButton',
  'emptyConversationList',
  'menuItemsPresent',
  'trashConfirmDialog',
  'duplicateArchiveMenuItems',
  'duplicateTrashConfirmDialog',
  'fullListActionSurface',
  'openRowMenuMarkUnreadFallbackOnly',
  'openRowMenuMissingArchiveControl',
  'openTrashDialogMissingConfirmControl'
];
