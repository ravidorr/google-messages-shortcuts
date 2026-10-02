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

export const rowMissingConversationLink = `
  <mws-conversation-list-item id="fixture-missing-link">
    <button aria-haspopup="menu"></button>
    <span>Contact F</span>
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
  <button data-e2e-conversation-menu-mute class="mat-mdc-menu-item">
    <span class="mat-mdc-menu-item-text">Mute</span>
  </button>
  <button data-e2e-conversation-menu-block class="mat-mdc-menu-item">
    <span class="mat-mdc-menu-item-text">Block &amp; report spam</span>
  </button>
`;

export const openRowMenuMuteFallbackOnly = `
  ${selectedReadRow}
  <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel">
    <button class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Mute</span>
    </button>
  </div>
`;

export const openRowMenuMuteLabelMismatchWithFallback = `
  ${selectedReadRow}
  <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel">
    <button data-e2e-conversation-menu-mute class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Unmute</span>
    </button>
    <button class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Mute</span>
    </button>
  </div>
`;

export const openRowMenuMutedOnly = `
  ${selectedReadRow}
  <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel">
    <button data-e2e-conversation-menu-mute class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Unmute</span>
    </button>
  </div>
`;

export const trashConfirmDialog = `
  <mat-dialog-container>
    <button data-e2e-action-button-confirm>Move to trash</button>
  </mat-dialog-container>
`;

export const blockReportSpamConfirmDialog = `
  <mat-dialog-container>
    <button data-e2e-action-button-confirm>Block</button>
  </mat-dialog-container>
`;

export const groupThreadBlockReportSpamMenuOpen = `
  ${selectedReadRow}
  <div class="conversation-actions-menu" role="menu">
    <button data-e2e-conversation-menu-block class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Report spam</span>
    </button>
  </div>
`;

export const blockReportSpamConfirmOkDialog = `
  <mat-dialog-container>
    <button>Cancel</button>
    <input type="checkbox" aria-label="Report spam" checked>
    <button data-e2e-action-button-confirm>OK</button>
  </mat-dialog-container>
`;

export const duplicateBlockReportSpamConfirmDialog = `
  <mat-dialog-container>
    <button data-e2e-action-button-confirm>Block</button>
    <button data-e2e-action-button-confirm>Block</button>
  </mat-dialog-container>
`;

export const openBlockDialogMissingConfirmControl = `
  ${selectedReadRow}
  <mat-dialog-container>
    <button>Cancel</button>
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

export const startChatNewConversationSurface = `
  <mws-new-conversation data-e2e-new-conversation-view></mws-new-conversation>
`;

export const duplicateStartChatButtons = `
  <a data-e2e-start-button href="/web/conversations/new">Start chat A</a>
  <a data-e2e-start-button href="/web/conversations/new">Start chat B</a>
`;

export const startChatFabSurface = `
  <mw-fab-link label="Start chat" class="start-chat">
    <a data-e2e-start-button class="mdc-button mat-mdc-button-base fab link mat-mdc-button mat-unthemed" href="/web/conversations/new">
      <span class="mdc-button__label">
        <div class="fab-icon-label-container">
          <mws-icon class="fab-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"></path>
            </svg>
          </mws-icon>
          <div class="fab-label">Start chat</div>
        </div>
      </span>
    </a>
  </mw-fab-link>
`;

export const archivedModalEntryControl = `
  <button data-e2e-archived-list-button>Archived</button>
`;

export const archivedRouteControl = `
  <mws-bottom-navigation>
    <button data-e2e-home-button>Home</button>
    <button data-e2e-archived-button aria-selected="true">Archived</button>
    <button data-e2e-settings-button>Settings</button>
  </mws-bottom-navigation>
`;

export const archivedSidebarView = `
  ${archivedRouteControl}
  ${startChatFabSurface}
  <main>
    <h2>Archived</h2>
    <mws-conversation-list-item><span>cal</span></mws-conversation-list-item>
  </main>
`;

export const archivedEntryControl = archivedModalEntryControl;

export const archivedModalSurface = `
  <mat-dialog-container>
    <h2>Archived</h2>
    <mws-conversation-list-item id="fixture-archived-row">
      <a aria-selected="true"></a>
      <span>Archived contact</span>
      <button data-e2e-unarchive-button>Unarchive</button>
    </mws-conversation-list-item>
  </mat-dialog-container>
`;

export const fullListActionSurface = `
  ${selectedReadRow}
  ${unreadRow}
  ${menuItemsPresent}
  ${trashConfirmDialog}
  ${archivedEntryControl}
  ${startChatFabSurface}
`;

export const unfocusedMultiRowNavigationList = `
  <mws-conversation-list-item id="fixture-row-a">
    <a href="/web/conversations/a" data-e2e-conversation></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
  <mws-conversation-list-item id="fixture-row-b">
    <a href="/web/conversations/b" data-e2e-conversation data-e2e-is-unread="true"></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
  <mws-conversation-list-item id="fixture-row-c">
    <a href="/web/conversations/c" data-e2e-conversation data-e2e-is-unread="true"></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
`;

export const multiRowNavigationList = `
  <mws-conversation-list-item id="fixture-row-a">
    <a href="/web/conversations/a" data-e2e-conversation></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
  <mws-conversation-list-item id="fixture-row-b" is-focused="true">
    <a href="/web/conversations/b" data-e2e-conversation data-e2e-is-unread="true"></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
  <mws-conversation-list-item id="fixture-row-c">
    <a href="/web/conversations/c" data-e2e-conversation data-e2e-is-unread="true"></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
`;

export const duplicateConversationLinkList = `
  <mws-conversation-list-item>
    <a href="/web/conversations/shared" data-e2e-conversation></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
  <mws-conversation-list-item>
    <a href="/web/conversations/shared" data-e2e-conversation></a>
    <button aria-haspopup="menu"></button>
  </mws-conversation-list-item>
`;

export const composerEditorSurface = `
  <mws-message-input>
    <textarea aria-label="Message"></textarea>
    <button aria-label="Send"></button>
  </mws-message-input>
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
  'rowMissingConversationLink',
  'emptyConversationList',
  'menuItemsPresent',
  'trashConfirmDialog',
  'blockReportSpamConfirmDialog',
  'groupThreadBlockReportSpamMenuOpen',
  'blockReportSpamConfirmOkDialog',
  'duplicateBlockReportSpamConfirmDialog',
  'openBlockDialogMissingConfirmControl',
  'duplicateArchiveMenuItems',
  'duplicateTrashConfirmDialog',
  'fullListActionSurface',
  'openRowMenuMarkUnreadFallbackOnly',
  'openRowMenuMissingArchiveControl',
  'openTrashDialogMissingConfirmControl',
  'openRowMenuMutedOnly',
  'openRowMenuMuteFallbackOnly',
  'openRowMenuMuteLabelMismatchWithFallback',
  'archivedEntryControl',
  'startChatFabSurface',
  'startChatNewConversationSurface',
  'duplicateStartChatButtons',
  'archivedModalSurface',
  'multiRowNavigationList',
  'duplicateConversationLinkList',
  'composerEditorSurface'
];
