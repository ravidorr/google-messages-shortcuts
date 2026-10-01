import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runConversationAction } from '../../src/content/conversation-action.js';
import { MENU_ACTION_ATTRIBUTE } from '../../src/content/menu-action-overlay.js';
import { COMMAND_ARCHIVE, COMMAND_MARK_UNREAD, COMMAND_TRASH } from '../../src/shared/commands.js';
import * as waitForElement from '../../src/content/wait-for-element.js';

function createConversationFixture() {
  document.body.innerHTML = `
    <mws-conversation-list-item>
      <a aria-selected="true"></a>
      <button aria-haspopup="menu"></button>
    </mws-conversation-list-item>
    <button data-e2e-conversation-menu-archive class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Archive</span>
    </button>
    <button data-e2e-conversation-delete class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Move to trash</span>
    </button>
    <button data-e2e-conversation-menu-mark-unread class="mat-mdc-menu-item">
      <span class="mat-mdc-menu-item-text">Mark as unread</span>
    </button>
    <mat-dialog-container>
      <button data-e2e-action-button-confirm>Move to trash</button>
    </mat-dialog-container>
  `;

  const row = document.querySelector('mws-conversation-list-item');
  const menuButton = row.querySelector('button[aria-haspopup="menu"]');
  const archiveButton = document.querySelector('[data-e2e-conversation-menu-archive]');
  const trashButton = document.querySelector('[data-e2e-conversation-delete]');
  const confirmButton = document.querySelector('[data-e2e-action-button-confirm]');

  vi.spyOn(menuButton, 'click');
  vi.spyOn(archiveButton, 'click');
  vi.spyOn(trashButton, 'click');
  vi.spyOn(confirmButton, 'click');

  return { menuButton, archiveButton, trashButton, confirmButton };
}

describe('runConversationAction', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute(MENU_ACTION_ATTRIBUTE);
    vi.restoreAllMocks();
  });

  it('archives the selected conversation', async () => {
    const fixture = createConversationFixture();

    const result = await runConversationAction(document, COMMAND_ARCHIVE);

    expect(result.ok).toBe(true);
    expect(fixture.menuButton.click).toHaveBeenCalled();
    expect(fixture.archiveButton.click).toHaveBeenCalled();
    expect(document.documentElement.hasAttribute(MENU_ACTION_ATTRIBUTE)).toBe(false);
  });

  it('archives the conversation row supplied by a shortcut pill', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item id="selected-row">
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <mws-conversation-list-item id="pill-row">
        <a></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <button data-e2e-conversation-menu-archive>Archive</button>
    `;
    const selectedMenuButton = document.querySelector('#selected-row button');
    const pillRow = document.getElementById('pill-row');
    const pillRowMenuButton = pillRow.querySelector('button');
    const archiveButton = document.querySelector('[data-e2e-conversation-menu-archive]');
    vi.spyOn(selectedMenuButton, 'click');
    vi.spyOn(pillRowMenuButton, 'click');
    vi.spyOn(archiveButton, 'click');

    const result = await runConversationAction(document, COMMAND_ARCHIVE, undefined, pillRow);

    expect(result.ok).toBe(true);
    expect(selectedMenuButton.click).not.toHaveBeenCalled();
    expect(pillRowMenuButton.click).toHaveBeenCalledTimes(1);
    expect(archiveButton.click).toHaveBeenCalledTimes(1);
  });

  it('rejects an action while another action is waiting for its menu item', async () => {
    const fixture = createConversationFixture();
    let resolveMenuItem;
    vi.spyOn(waitForElement, 'waitForSelector').mockImplementationOnce(() => new Promise((resolve) => {
      resolveMenuItem = resolve;
    }));

    const firstAction = runConversationAction(document, COMMAND_ARCHIVE);
    const secondResult = await runConversationAction(document, COMMAND_ARCHIVE);

    expect(secondResult).toEqual({ ok: false, reason: 'action-in-progress' });
    expect(fixture.menuButton.click).toHaveBeenCalledTimes(1);

    resolveMenuItem(fixture.archiveButton);

    await expect(firstAction).resolves.toEqual({ ok: true });
  });

  it('moves the selected conversation to trash and confirms when enabled', async () => {
    const fixture = createConversationFixture();
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ autoConfirmTrash: true }))
        }
      }
    };

    const result = await runConversationAction(
      document,
      COMMAND_TRASH,
      undefined,
      undefined,
      chromeApi
    );

    expect(result.ok).toBe(true);
    expect(fixture.menuButton.click).toHaveBeenCalled();
    expect(fixture.trashButton.click).toHaveBeenCalled();
    expect(fixture.confirmButton.click).toHaveBeenCalled();
  });

  it('leaves the native trash dialog visible when confirmation is disabled', async () => {
    const fixture = createConversationFixture();
    vi.spyOn(fixture.confirmButton, 'focus');
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => ({ autoConfirmTrash: false }))
        }
      }
    };

    const result = await runConversationAction(
      document,
      COMMAND_TRASH,
      undefined,
      undefined,
      chromeApi
    );

    expect(result).toEqual({ ok: true });
    expect(fixture.trashButton.click).toHaveBeenCalledTimes(1);
    expect(fixture.confirmButton.click).not.toHaveBeenCalled();
    expect(fixture.confirmButton.focus).toHaveBeenCalledTimes(1);
  });

  it('confirms trash when storage cannot be read', async () => {
    const fixture = createConversationFixture();
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(async () => {
            throw new Error('storage unavailable');
          })
        }
      }
    };

    const result = await runConversationAction(
      document,
      COMMAND_TRASH,
      undefined,
      undefined,
      chromeApi
    );

    expect(result.ok).toBe(true);
    expect(fixture.confirmButton.click).toHaveBeenCalledTimes(1);
  });

  it('returns no-target when no conversation row exists', async () => {
    const result = await runConversationAction(document, COMMAND_ARCHIVE);

    expect(result).toEqual({ ok: false, reason: 'no-target' });
  });

  it('returns menu-button-not-found when the row has no menu control', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
      </mws-conversation-list-item>
    `;

    const result = await runConversationAction(document, COMMAND_ARCHIVE);

    expect(result).toEqual({ ok: false, reason: 'menu-button-not-found' });
  });

  it('falls back to English menu text when data-e2e selectors are absent', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <button class="mat-mdc-menu-item">Archive</button>
    `;
    vi.spyOn(waitForElement, 'waitForSelector')
      .mockRejectedValueOnce(new Error('archive selector unavailable'));

    const result = await runConversationAction(document, COMMAND_ARCHIVE);

    expect(result.ok).toBe(true);
  });

  it('falls back to English trash confirmation text', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <button class="mat-mdc-menu-item">Move to trash</button>
      <mat-dialog-container>
        <button class="mat-focus-indicator">Move to trash</button>
      </mat-dialog-container>
    `;
    const trashMenuItem = document.querySelector('.mat-mdc-menu-item');
    const confirmButton = document.querySelector('mat-dialog-container .mat-focus-indicator');
    vi.spyOn(trashMenuItem, 'click');
    vi.spyOn(confirmButton, 'click');
    vi.spyOn(waitForElement, 'waitForSelector')
      .mockRejectedValueOnce(new Error('trash selector unavailable'))
      .mockRejectedValueOnce(new Error('confirmation selector unavailable'));
    vi.spyOn(waitForElement, 'waitForElement')
      .mockResolvedValueOnce(trashMenuItem);

    const result = await runConversationAction(document, COMMAND_TRASH);

    expect(result.ok).toBe(true);
    expect(trashMenuItem.click).toHaveBeenCalledTimes(1);
    expect(confirmButton.click).toHaveBeenCalledTimes(1);
  });

  it('returns a menu-action failure when trash menu items are unavailable', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;
    vi.spyOn(waitForElement, 'waitForSelector')
      .mockRejectedValueOnce(new Error('trash menu unavailable'));
    vi.spyOn(waitForElement, 'waitForElement')
      .mockRejectedValueOnce(new Error('trash fallback unavailable'));

    const result = await runConversationAction(document, COMMAND_TRASH);

    expect(result).toEqual({
      ok: false,
      reason: 'trash fallback unavailable'
    });
  });

  it('returns a confirmation failure when no trash confirmation control appears', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <div data-e2e-conversation-delete>Move to trash</div>
    `;
    const trashMenuItem = document.querySelector('[data-e2e-conversation-delete]');
    vi.spyOn(waitForElement, 'waitForSelector')
      .mockResolvedValueOnce(trashMenuItem)
      .mockRejectedValueOnce(new Error('confirmation unavailable'));
    vi.spyOn(waitForElement, 'waitForElement')
      .mockRejectedValueOnce(new Error('confirmation fallback unavailable'));

    const result = await runConversationAction(document, COMMAND_TRASH);

    expect(result).toEqual({
      ok: false,
      reason: 'confirmation fallback unavailable'
    });
  });

  it('returns a confirmation fallback failure', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <div data-e2e-conversation-delete>Move to trash</div>
    `;
    const trashMenuItem = document.querySelector('[data-e2e-conversation-delete]');
    vi.spyOn(waitForElement, 'waitForSelector')
      .mockResolvedValueOnce(trashMenuItem)
      .mockRejectedValueOnce(new Error('confirmation unavailable'));
    vi.spyOn(waitForElement, 'waitForElement')
      .mockRejectedValueOnce(new Error('confirmation fallback unavailable'));

    const result = await runConversationAction(document, COMMAND_TRASH);

    expect(result).toEqual({
      ok: false,
      reason: 'confirmation fallback unavailable'
    });
  });

  it('marks a read conversation as unread', async () => {
    const fixture = createConversationFixture();
    const markUnreadButton = document.querySelector('[data-e2e-conversation-menu-mark-unread]');
    vi.spyOn(markUnreadButton, 'click');

    const result = await runConversationAction(document, COMMAND_MARK_UNREAD);

    expect(result.ok).toBe(true);
    expect(fixture.menuButton.click).toHaveBeenCalled();
    expect(markUnreadButton.click).toHaveBeenCalled();
  });

  it('returns already-unread when the target conversation is unread', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <span data-e2e-is-unread="true"></span>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;
    const menuButton = document.querySelector('button[aria-haspopup="menu"]');
    vi.spyOn(menuButton, 'click');

    const result = await runConversationAction(document, COMMAND_MARK_UNREAD);

    expect(result).toEqual({ ok: false, reason: 'already-unread' });
    expect(menuButton.click).not.toHaveBeenCalled();
    expect(document.documentElement.hasAttribute(MENU_ACTION_ATTRIBUTE)).toBe(false);
  });

  it('falls back to English mark-unread menu text when data-e2e selectors are absent', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <button class="mat-mdc-menu-item">Mark as unread</button>
    `;
    vi.spyOn(waitForElement, 'waitForSelector')
      .mockRejectedValueOnce(new Error('mark-unread selector unavailable'));

    const result = await runConversationAction(document, COMMAND_MARK_UNREAD);

    expect(result.ok).toBe(true);
  });

  it('returns unknown-command for unsupported actions', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    const result = await runConversationAction(document, 'unsupported');

    expect(result).toEqual({ ok: false, reason: 'unknown-command' });
  });
});
