import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY } from '../../src/shared/mark-as-read-debug-preference.js';
import { COMMAND_MARK_READ } from '../../src/shared/commands.js';
import {
  dispatchRowPointerOver,
  getUnreadConversationRows,
  inspectRowHoverState,
  narrowSelfTestForValidation,
  prepareShortcutTargetRow,
  runMarkAsReadLiveValidation
} from '../../src/content/adapters/mark-as-read-live-validation.js';
import { SELECTORS } from '../../src/content/google-messages-dom.js';
import { unfocusedMultiRowNavigationList } from '../fixtures/dom/list-states.js';

function createSelfTest(overrides = {}) {
  return {
    ok: true,
    mutated: false,
    summary: { unsafe: 0 },
    environment: {
      browserVersion: 'test-browser',
      extensionVersion: '1.14.21',
      locale: 'en-US',
      direction: 'ltr'
    },
    capabilities: [
      {
        capabilityId: 'list.conversationLink',
        state: 'supported'
      }
    ],
    ...overrides
  };
}

function appendMarkReadPill(row) {
  const group = document.createElement('div');
  group.setAttribute('data-messages-shortcuts-pill-group', '');
  const pill = document.createElement('button');
  pill.setAttribute('data-messages-shortcuts-pill', '');
  pill.setAttribute('data-command', COMMAND_MARK_READ);
  group.append(pill);
  row.append(group);
}

describe('mark-as-read-live-validation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns debug-validation-disabled when the opt-in flag is off', async () => {
    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => false
    });

    expect(localThis).toEqual({
      ok: false,
      error: 'debug-validation-disabled',
      message: expect.stringContaining('enableMarkAsReadLiveValidation')
    });
  });

  it('returns no-unread-rows when the inbox has no unread conversations', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a data-e2e-conversation></a>
      </mws-conversation-list-item>
    `;

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest()
    });

    expect(localThis).toEqual({
      ok: false,
      error: 'no-unread-rows',
      selfTest: expect.objectContaining({ ok: true })
    });
  });

  it('returns insufficient-unread-rows when only one unread row is available', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a data-e2e-conversation data-e2e-is-unread="true"></a>
      </mws-conversation-list-item>
    `;

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest()
    });

    expect(localThis).toMatchObject({
      ok: false,
      error: 'insufficient-unread-rows',
      unreadRowsAvailableInitially: 1
    });
  });

  it('runs hover checks and destructive paths when validation is enabled', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);
    appendMarkReadPill(unreadRows[0]);
    appendMarkReadPill(unreadRows[1]);

    const runRowAction = vi.fn(async (_documentRoot, _command, _selectors, row) => {
      row.querySelector('[data-e2e-is-unread="true"]')?.removeAttribute('data-e2e-is-unread');

      return { ok: true };
    });
    const runShortcutCommand = vi.fn(async () => ({ ok: true }));

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest(),
      runRowAction,
      runShortcutCommand,
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis.ok).toBe(true);
    expect(localThis.pillResult).toEqual({ ok: true });
    expect(localThis.shortcutResult).toEqual({ ok: true });
    expect(localThis.hoverCheck.markReadPillPresent).toBe(true);
    expect(localThis.secondRowHoverCheck.markReadPillPresent).toBe(true);
    expect(runRowAction).toHaveBeenCalledWith(
      document,
      COMMAND_MARK_READ,
      SELECTORS,
      unreadRows[0]
    );
    expect(runShortcutCommand).toHaveBeenCalledWith(
      COMMAND_MARK_READ,
      document,
      expect.any(Object)
    );
  });

  it('returns ok false when destructive actions fail', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);
    appendMarkReadPill(unreadRows[0]);
    appendMarkReadPill(unreadRows[1]);

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest({ ok: false }),
      runRowAction: vi.fn(async () => ({ ok: false, reason: 'already-read' })),
      runShortcutCommand: vi.fn(async () => ({ ok: false, reason: 'no-target' })),
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis.ok).toBe(false);
    expect(localThis.pillResult).toEqual({ ok: false, reason: 'already-read' });
    expect(localThis.shortcutResult).toEqual({ ok: false, reason: 'no-target' });
  });

  it('reports shortcut-target-not-unread when the second row is no longer unread', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);
    appendMarkReadPill(unreadRows[0]);
    appendMarkReadPill(unreadRows[1]);

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest(),
      runRowAction: vi.fn(async (_documentRoot, _command, _selectors, row) => {
        row.querySelector('[data-e2e-is-unread="true"]')?.removeAttribute('data-e2e-is-unread');
        unreadRows[1].querySelector('[data-e2e-is-unread="true"]')?.removeAttribute('data-e2e-is-unread');

        return { ok: true };
      }),
      runShortcutCommand: vi.fn(async () => ({ ok: true })),
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis).toMatchObject({
      ok: false,
      error: 'shortcut-target-not-unread',
      shortcutResult: { ok: false, reason: 'shortcut-target-not-unread' }
    });
    expect(localThis.pillResult).toEqual({ ok: true });
  });

  it('handles hover inspection when document defaultView is unavailable', async () => {
    const row = document.createElement('mws-conversation-list-item');
    const localThis = await inspectRowHoverState(row, {
      defaultView: undefined,
      querySelector: () => null
    }, {
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis).toEqual({
      unreadMarkerPersists: false,
      pillGroupPresent: false,
      markReadPillPresent: false,
      urlUnchanged: true
    });
  });

  it('narrows self-test output and inspects hover state', async () => {
    document.body.innerHTML = `
      <mws-conversation-list-item id="fixture-hover-row">
        <a data-e2e-conversation data-e2e-is-unread="true"></a>
      </mws-conversation-list-item>
    `;
    const row = document.getElementById('fixture-hover-row');
    appendMarkReadPill(row);

    const narrowed = narrowSelfTestForValidation(createSelfTest());
    const hoverState = await inspectRowHoverState(row, document, {
      sleep: async () => {},
      dispatchPointerOver: dispatchRowPointerOver
    });

    expect(narrowed.listConversationLink).toMatchObject({
      capabilityId: 'list.conversationLink'
    });
    expect(narrowSelfTestForValidation(createSelfTest({ capabilities: undefined })).listConversationLink)
      .toBeUndefined();
    expect(hoverState).toEqual({
      unreadMarkerPersists: true,
      pillGroupPresent: true,
      markReadPillPresent: true,
      urlUnchanged: true
    });
  });

  it('uses chrome storage when debug enablement is not overridden', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);
    appendMarkReadPill(unreadRows[0]);
    appendMarkReadPill(unreadRows[1]);

    const localThis = await runMarkAsReadLiveValidation(document, {
      chromeApi: {
        storage: {
          local: {
            get: vi.fn(async () => ({
              [MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY]: true
            }))
          }
        }
      },
      runSelfTest: () => createSelfTest(),
      runRowAction: vi.fn(async () => ({ ok: true })),
      runShortcutCommand: vi.fn(async () => ({ ok: true })),
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis.ok).toBe(true);
  });

  it('waits before collecting hover state by default', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <mws-conversation-list-item id="fixture-hover-row">
        <a data-e2e-conversation data-e2e-is-unread="true"></a>
      </mws-conversation-list-item>
    `;
    const row = document.getElementById('fixture-hover-row');
    appendMarkReadPill(row);

    const hoverPromise = inspectRowHoverState(row, document);
    await vi.advanceTimersByTimeAsync(600);
    const localThis = await hoverPromise;

    expect(localThis.markReadPillPresent).toBe(true);
  });

  it('prepareShortcutTargetRow focuses only the supplied row', () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);

    prepareShortcutTargetRow(document, unreadRows[1]);

    expect(unreadRows[0].hasAttribute('is-focused')).toBe(false);
    expect(unreadRows[1].getAttribute('is-focused')).toBe('true');
  });
});
