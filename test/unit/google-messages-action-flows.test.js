import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runConversationAction } from '../../src/content/conversation-action.js';
import { MENU_TEXT, SELECTORS } from '../../src/content/google-messages-dom.js';
import { POLL_INTERVAL_MS } from '../../src/content/wait-for-element.js';
import { COMMAND_ARCHIVE, COMMAND_MARK_UNREAD, COMMAND_TRASH } from '../../src/shared/commands.js';

function createGoogleMessagesFixture() {
  document.body.innerHTML = `
    <mws-conversation-list-item id="selected-row">
      <a aria-selected="true"></a>
      <button aria-haspopup="menu" id="selected-menu"></button>
    </mws-conversation-list-item>
    <mws-conversation-list-item id="target-row">
      <a></a>
      <button aria-haspopup="menu" id="target-menu"></button>
    </mws-conversation-list-item>
  `;

  return {
    selectedMenu: document.getElementById('selected-menu'),
    targetMenu: document.getElementById('target-menu'),
    targetRow: document.getElementById('target-row')
  };
}

async function advanceUntilActionCompletes(actionPromise) {
  await vi.runAllTimersAsync();

  return actionPromise;
}

describe('google messages action flows', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('archives only the supplied conversation row when menu items render later', async () => {
    const localThis = createGoogleMessagesFixture();
    const clickedButtons = {
      archive: null
    };

    vi.spyOn(localThis.selectedMenu, 'click');
    vi.spyOn(localThis.targetMenu, 'click');

    const actionPromise = runConversationAction(
      document,
      COMMAND_ARCHIVE,
      SELECTORS,
      localThis.targetRow
    );

    setTimeout(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<button data-e2e-conversation-menu-archive class="mat-mdc-menu-item">${MENU_TEXT.archive}</button>`
      );
      clickedButtons.archive = document.querySelector('[data-e2e-conversation-menu-archive]');
      vi.spyOn(clickedButtons.archive, 'click');
    }, POLL_INTERVAL_MS);

    const result = await advanceUntilActionCompletes(actionPromise);

    expect(result).toEqual({ ok: true });
    expect(localThis.targetMenu.click).toHaveBeenCalledTimes(1);
    expect(localThis.selectedMenu.click).not.toHaveBeenCalled();
    expect(clickedButtons.archive.click).toHaveBeenCalledTimes(1);
  });

  it('falls back to English archive menu text when selectors render later', async () => {
    createGoogleMessagesFixture();
    const clickedButtons = {
      archive: null
    };

    const actionPromise = runConversationAction(document, COMMAND_ARCHIVE);

    setTimeout(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<button class="mat-mdc-menu-item">${MENU_TEXT.archive}</button>`
      );
      clickedButtons.archive = document.querySelector('.mat-mdc-menu-item');
      vi.spyOn(clickedButtons.archive, 'click');
    }, POLL_INTERVAL_MS);

    const result = await advanceUntilActionCompletes(actionPromise);

    expect(result).toEqual({ ok: true });
    expect(clickedButtons.archive.click).toHaveBeenCalledTimes(1);
  });

  it('trashes the selected row and confirms when the dialog renders later', async () => {
    createGoogleMessagesFixture();
    const clickedButtons = {
      trash: null,
      confirm: null
    };
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ autoConfirmTrash: true }))
        }
      }
    };

    const actionPromise = runConversationAction(
      document,
      COMMAND_TRASH,
      SELECTORS,
      undefined,
      chromeApi
    );

    setTimeout(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<button data-e2e-conversation-delete class="mat-mdc-menu-item">${MENU_TEXT.trash}</button>`
      );
      clickedButtons.trash = document.querySelector('[data-e2e-conversation-delete]');
      vi.spyOn(clickedButtons.trash, 'click');
    }, POLL_INTERVAL_MS);
    setTimeout(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<mat-dialog-container><button data-e2e-action-button-confirm>Move to trash</button></mat-dialog-container>'
      );
      clickedButtons.confirm = document.querySelector('[data-e2e-action-button-confirm]');
      vi.spyOn(clickedButtons.confirm, 'click');
    }, POLL_INTERVAL_MS * 2);

    const result = await advanceUntilActionCompletes(actionPromise);

    expect(result).toEqual({ ok: true });
    expect(clickedButtons.trash.click).toHaveBeenCalledTimes(1);
    expect(clickedButtons.confirm.click).toHaveBeenCalledTimes(1);
  });

  it('falls back to English trash confirmation text when the dialog renders later', async () => {
    createGoogleMessagesFixture();
    const clickedButtons = {
      trash: null,
      confirm: null
    };

    const actionPromise = runConversationAction(document, COMMAND_TRASH);

    setTimeout(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<button class="mat-mdc-menu-item">${MENU_TEXT.trash}</button>`
      );
      clickedButtons.trash = document.querySelector('.mat-mdc-menu-item');
      vi.spyOn(clickedButtons.trash, 'click');
    }, POLL_INTERVAL_MS);
    setTimeout(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<mat-dialog-container><button class="mat-focus-indicator">${MENU_TEXT.trash}</button></mat-dialog-container>`
      );
      clickedButtons.confirm = document.querySelector('mat-dialog-container .mat-focus-indicator');
      vi.spyOn(clickedButtons.confirm, 'click');
    }, POLL_INTERVAL_MS * 2);

    const result = await advanceUntilActionCompletes(actionPromise);

    expect(result).toEqual({ ok: true });
    expect(clickedButtons.trash.click).toHaveBeenCalledTimes(1);
    expect(clickedButtons.confirm.click).toHaveBeenCalledTimes(1);
  });

  it('marks only the supplied row as unread when menu items render later', async () => {
    const localThis = createGoogleMessagesFixture();
    const clickedButtons = {
      markUnread: null
    };

    vi.spyOn(localThis.selectedMenu, 'click');
    vi.spyOn(localThis.targetMenu, 'click');

    const actionPromise = runConversationAction(
      document,
      COMMAND_MARK_UNREAD,
      SELECTORS,
      localThis.targetRow
    );

    setTimeout(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<button data-e2e-conversation-menu-mark-unread class="mat-mdc-menu-item">${MENU_TEXT.markUnread}</button>`
      );
      clickedButtons.markUnread = document.querySelector('[data-e2e-conversation-menu-mark-unread]');
      vi.spyOn(clickedButtons.markUnread, 'click');
    }, POLL_INTERVAL_MS);

    const result = await advanceUntilActionCompletes(actionPromise);

    expect(result).toEqual({ ok: true });
    expect(localThis.targetMenu.click).toHaveBeenCalledTimes(1);
    expect(localThis.selectedMenu.click).not.toHaveBeenCalled();
    expect(clickedButtons.markUnread.click).toHaveBeenCalledTimes(1);
  });
});
