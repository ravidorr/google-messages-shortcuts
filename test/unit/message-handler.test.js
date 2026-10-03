import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as conversationAction from '../../src/content/conversation-action.js';
import {
  FEEDBACK_MESSAGE_SELECTOR,
  resetActionFeedbackForTests
} from '../../src/content/action-feedback.js';
import {
  handleCommand,
  installMessageListener,
  warnActionFailure
} from '../../src/content/message-handler.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_OPEN_ARCHIVED,
  COMMAND_OPEN_SPAM_BLOCKED,
  COMMAND_START_CHAT,
  COMMAND_TRASH
} from '../../src/shared/commands.js';
import * as commands from '../../src/shared/commands.js';
import * as openArchivedAction from '../../src/content/open-archived-action.js';
import * as openSpamBlockedAction from '../../src/content/open-spam-blocked-action.js';
import * as openStartChatAction from '../../src/content/open-start-chat-action.js';
import { selectedUnreadRow } from '../fixtures/dom/list-states.js';

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
}

function createChromeApi({ paused = false } = {}) {
  return {
    storage: {
      local: {
        get: vi.fn(async () => (paused ? { extensionPaused: true } : {}))
      }
    }
  };
}

describe('message-handler', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetActionFeedbackForTests();
  });

  it('warns with a readable step label', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warnActionFailure('no-target', 'no-target');

    expect(warnSpy).toHaveBeenCalled();
  });

  it('warns with an unknown failure step', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    warnActionFailure('custom-step', 'custom failure');

    expect(warnSpy).toHaveBeenCalledWith(
      '[Messages Shortcut Actions] Failed to custom-step.',
      'custom failure'
    );
  });

  it('handles archive commands', async () => {
    createConversationFixture();

    const result = await handleCommand(COMMAND_ARCHIVE, document, createChromeApi());

    expect(result.ok).toBe(true);
    expect(document.querySelector(FEEDBACK_MESSAGE_SELECTOR)?.textContent)
      .toBe('Conversation archived.');
  });

  it('blocks commands while the extension is paused', async () => {
    createConversationFixture();

    const result = await handleCommand(
      COMMAND_ARCHIVE,
      document,
      createChromeApi({ paused: true })
    );

    expect(result).toEqual({ ok: false, reason: 'extension-paused' });
    expect(document.querySelector(FEEDBACK_MESSAGE_SELECTOR)?.textContent)
      .toContain('paused');
  });

  it('handles trash commands', async () => {
    createConversationFixture();

    const result = await handleCommand(COMMAND_TRASH, document, createChromeApi());

    expect(result.ok).toBe(true);
  });

  it('handles mark-unread commands', async () => {
    createConversationFixture();

    const result = await handleCommand(COMMAND_MARK_UNREAD, document, createChromeApi());

    expect(result.ok).toBe(true);
  });

  it('handles open-archived navigation commands', async () => {
    vi.spyOn(openArchivedAction, 'handleOpenArchived')
      .mockResolvedValueOnce({ ok: true });

    const result = await handleCommand(COMMAND_OPEN_ARCHIVED, document, createChromeApi());

    expect(result).toEqual({ ok: true });
    expect(document.querySelector(FEEDBACK_MESSAGE_SELECTOR)?.textContent)
      .toBe('Archived opened.');
  });

  it('fails closed for navigation commands while a native dialog is open', async () => {
    document.body.innerHTML = '<mat-dialog-container></mat-dialog-container>';
    const openArchived = vi.spyOn(openArchivedAction, 'handleOpenArchived');
    const openStartChat = vi.spyOn(openStartChatAction, 'handleOpenStartChat');
    const openSpamBlocked = vi.spyOn(openSpamBlockedAction, 'handleOpenSpamBlocked');

    const archivedResult = await handleCommand(COMMAND_OPEN_ARCHIVED, document, createChromeApi());
    const startChatResult = await handleCommand(COMMAND_START_CHAT, document, createChromeApi());
    const spamBlockedResult = await handleCommand(
      COMMAND_OPEN_SPAM_BLOCKED,
      document,
      createChromeApi()
    );

    expect(archivedResult).toEqual({ ok: false, reason: 'native-dialog-open' });
    expect(startChatResult).toEqual({ ok: false, reason: 'native-dialog-open' });
    expect(spamBlockedResult).toEqual({ ok: false, reason: 'native-dialog-open' });
    expect(openArchived).not.toHaveBeenCalled();
    expect(openStartChat).not.toHaveBeenCalled();
    expect(openSpamBlocked).not.toHaveBeenCalled();
  });

  it('handles start-chat navigation commands', async () => {
    vi.spyOn(openStartChatAction, 'handleOpenStartChat')
      .mockResolvedValueOnce({ ok: true });

    const result = await handleCommand(COMMAND_START_CHAT, document, createChromeApi());

    expect(result).toEqual({ ok: true });
    expect(document.querySelector(FEEDBACK_MESSAGE_SELECTOR)?.textContent)
      .toBe('Start chat opened.');
  });

  it('handles Spam and blocked navigation commands', async () => {
    vi.spyOn(openSpamBlockedAction, 'handleOpenSpamBlocked')
      .mockResolvedValueOnce({ ok: true });

    const localThis = await handleCommand(COMMAND_OPEN_SPAM_BLOCKED, document, createChromeApi());

    expect(localThis).toEqual({ ok: true });
    expect(document.querySelector(FEEDBACK_MESSAGE_SELECTOR)?.textContent)
      .toBe('Spam & blocked opened.');
  });

  it('rejects unknown navigation commands without running row actions', async () => {
    vi.spyOn(commands, 'isNavigationCommand').mockReturnValue(true);
    vi.spyOn(conversationAction, 'runConversationAction');

    const result = await handleCommand(COMMAND_ARCHIVE, document, createChromeApi());

    expect(result).toEqual({ ok: false, reason: 'unknown-command' });
    expect(conversationAction.runConversationAction).not.toHaveBeenCalled();
  });

  it('returns execute-action-failed for navigation command errors', async () => {
    vi.spyOn(openArchivedAction, 'handleOpenArchived')
      .mockRejectedValueOnce(new Error('navigation failed'));

    const result = await handleCommand(COMMAND_OPEN_ARCHIVED, document, createChromeApi());

    expect(result).toEqual({
      ok: false,
      reason: 'execute-action-failed',
      error: 'navigation failed'
    });
  });

  it('stringifies non-Error navigation failures', async () => {
    vi.spyOn(openArchivedAction, 'handleOpenArchived')
      .mockRejectedValueOnce('navigation failed');

    const result = await handleCommand(COMMAND_OPEN_ARCHIVED, document, createChromeApi());

    expect(result).toEqual({
      ok: false,
      reason: 'execute-action-failed',
      error: 'navigation failed'
    });
  });

  it('handles mark-read commands', async () => {
    document.body.innerHTML = selectedUnreadRow;
    const conversationLink = document.querySelector('a[data-e2e-conversation]');
    vi.spyOn(conversationLink, 'click').mockImplementation(() => {
      conversationLink.removeAttribute('data-e2e-is-unread');
    });

    const result = await handleCommand(COMMAND_MARK_READ, document, createChromeApi());

    expect(result.ok).toBe(true);
  });

  it('silently ignores mark-read when the conversation is already read', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createConversationFixture();

    const result = await handleCommand(COMMAND_MARK_READ, document, createChromeApi());

    expect(result).toEqual({ ok: false, reason: 'already-read' });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('silently ignores mark-unread when the conversation is already unread', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <span data-e2e-is-unread="true"></span>
        <a aria-selected="true"></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    const result = await handleCommand(COMMAND_MARK_UNREAD, document, createChromeApi());

    expect(result).toEqual({ ok: false, reason: 'already-unread' });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('silently ignores a valid command when no conversation is available', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await handleCommand(COMMAND_ARCHIVE, document, createChromeApi());

    expect(result).toEqual({ ok: false, reason: 'no-target' });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns when a valid command cannot find its menu button', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(conversationAction, 'runConversationAction')
      .mockResolvedValueOnce({ ok: false, reason: 'menu-button-not-found' });

    const result = await handleCommand(COMMAND_ARCHIVE, document, createChromeApi());

    expect(result).toEqual({ ok: false, reason: 'menu-button-not-found' });
    expect(warnSpy).toHaveBeenCalledWith(
      '[Messages Shortcut Actions] Failed to find the conversation menu button.',
      'menu-button-not-found'
    );
  });

  it('returns unknown-command for invalid commands', async () => {
    const result = await handleCommand('invalid', document, createChromeApi());

    expect(result).toEqual({ ok: false, reason: 'unknown-command' });
  });

  it('installs a message listener that responds asynchronously', async () => {
    createConversationFixture();

    const sendResponse = vi.fn();
    const addListener = vi.fn();
    const removeListener = vi.fn();
    const chromeApi = {
      ...createChromeApi(),
      runtime: {
        onMessage: {
          addListener,
          removeListener
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

    const result = await handleCommand(COMMAND_ARCHIVE, document, createChromeApi());

    expect(result).toEqual({
      ok: false,
      reason: 'execute-action-failed',
      error: 'unexpected failure'
    });
  });

  it('returns execute-action-failed when the action rejects without an Error', async () => {
    vi.spyOn(conversationAction, 'runConversationAction')
      .mockRejectedValueOnce('unexpected failure');

    const result = await handleCommand(COMMAND_ARCHIVE, document, createChromeApi());

    expect(result).toEqual({
      ok: false,
      reason: 'execute-action-failed',
      error: 'unexpected failure'
    });
  });

  it('returns missing-command when no command is provided', () => {
    const sendResponse = vi.fn();
    const addListener = vi.fn();
    const removeListener = vi.fn();
    const chromeApi = {
      runtime: {
        onMessage: {
          addListener,
          removeListener
        }
      }
    };

    installMessageListener(chromeApi);

    const listener = addListener.mock.calls[0][0];
    const keepChannelOpen = listener({}, {}, sendResponse);

    expect(keepChannelOpen).toBe(false);
    expect(sendResponse).toHaveBeenCalledWith({ ok: false, reason: 'missing-command' });
  });

  it('removes the installed message listener when disconnected', () => {
    const addListener = vi.fn();
    const removeListener = vi.fn();
    const chromeApi = {
      runtime: {
        onMessage: {
          addListener,
          removeListener
        }
      }
    };

    const disconnect = installMessageListener(chromeApi);
    const listener = addListener.mock.calls[0][0];

    disconnect();

    expect(removeListener).toHaveBeenCalledWith(listener);
  });
});
