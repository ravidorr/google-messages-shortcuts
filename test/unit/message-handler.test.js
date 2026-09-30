import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as conversationAction from '../../src/content/conversation-action.js';
import {
  handleCommand,
  installMessageListener,
  warnActionFailure
} from '../../src/content/message-handler.js';
import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../../src/shared/commands.js';

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
}

describe('message-handler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('warns with a readable step label', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warnActionFailure('no-target', 'no-target');

    expect(warnSpy).toHaveBeenCalled();
  });

  it('handles archive commands', async () => {
    createConversationFixture();

    const result = await handleCommand(COMMAND_ARCHIVE);

    expect(result.ok).toBe(true);
  });

  it('handles trash commands', async () => {
    createConversationFixture();

    const result = await handleCommand(COMMAND_TRASH);

    expect(result.ok).toBe(true);
  });

  it('returns unknown-command for invalid commands', async () => {
    const result = await handleCommand('invalid');

    expect(result).toEqual({ ok: false, reason: 'unknown-command' });
  });

  it('installs a message listener that responds asynchronously', async () => {
    createConversationFixture();

    const sendResponse = vi.fn();
    const addListener = vi.fn();
    const chromeApi = {
      runtime: {
        onMessage: {
          addListener
        }
      }
    };

    installMessageListener(chromeApi);

    const listener = addListener.mock.calls[0][0];
    const keepChannelOpen = listener({ command: COMMAND_ARCHIVE }, {}, sendResponse);

    expect(keepChannelOpen).toBe(true);
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ ok: true });
    });
  });

  it('returns execute-action-failed when the action throws', async () => {
    vi.spyOn(conversationAction, 'runConversationAction')
      .mockRejectedValueOnce(new Error('unexpected failure'));

    const result = await handleCommand(COMMAND_ARCHIVE);

    expect(result).toEqual({
      ok: false,
      reason: 'execute-action-failed',
      error: 'unexpected failure'
    });
  });

  it('returns missing-command when no command is provided', () => {
    const sendResponse = vi.fn();
    const addListener = vi.fn();
    const chromeApi = {
      runtime: {
        onMessage: {
          addListener
        }
      }
    };

    installMessageListener(chromeApi);

    const listener = addListener.mock.calls[0][0];
    const keepChannelOpen = listener({}, {}, sendResponse);

    expect(keepChannelOpen).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({ ok: false, reason: 'missing-command' });
  });
});
