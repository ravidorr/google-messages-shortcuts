import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runConversationAction } from '../../src/content/conversation-action.js';
import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../../src/shared/commands.js';
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
    vi.restoreAllMocks();
  });

  it('archives the selected conversation', async () => {
    const fixture = createConversationFixture();

    const result = await runConversationAction(document, COMMAND_ARCHIVE);

    expect(result.ok).toBe(true);
    expect(fixture.menuButton.click).toHaveBeenCalled();
    expect(fixture.archiveButton.click).toHaveBeenCalled();
  });

  it('moves the selected conversation to trash and confirms', async () => {
    const fixture = createConversationFixture();

    const result = await runConversationAction(document, COMMAND_TRASH);

    expect(result.ok).toBe(true);
    expect(fixture.menuButton.click).toHaveBeenCalled();
    expect(fixture.trashButton.click).toHaveBeenCalled();
    expect(fixture.confirmButton.click).toHaveBeenCalled();
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
      <button class="mat-focus-indicator">Move to trash</button>
    `;

    const result = await runConversationAction(document, COMMAND_TRASH);

    expect(result.ok).toBe(true);
  });

  it('returns a menu-action failure when trash menu items are unavailable', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    const result = await runConversationAction(document, COMMAND_TRASH);

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Timed out waiting for selector');
  });

  it('returns a confirmation failure when no trash confirmation control appears', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
      <div data-e2e-conversation-delete>Move to trash</div>
    `;

    const result = await runConversationAction(document, COMMAND_TRASH);

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('Timed out waiting for selector');
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
