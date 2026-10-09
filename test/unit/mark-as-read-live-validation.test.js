import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MARK_AS_READ_DEBUG_VALIDATION_STORAGE_KEY } from '../../src/shared/mark-as-read-debug-preference.js';
import { COMMAND_MARK_READ } from '../../src/shared/commands.js';
import {
  dispatchRowPointerOver,
  findConflictingHoveredConversationRow,
  getUnreadConversationRows,
  inspectRowHoverState,
  narrowSelfTestForValidation,
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

function markRowRead(row) {
  row.querySelector('[data-e2e-is-unread="true"]')?.removeAttribute('data-e2e-is-unread');
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
      markRowRead(row);

      return { ok: true };
    });

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest(),
      runRowAction,
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis.ok).toBe(true);
    expect(localThis.pillResult).toEqual({ ok: true });
    expect(localThis.shortcutResult).toEqual({ ok: true });
    expect(localThis.hoverCheck.markReadPillPresent).toBe(true);
    expect(localThis.secondRowHoverCheck.markReadPillPresent).toBe(true);
    expect(runRowAction).toHaveBeenNthCalledWith(
      1,
      document,
      COMMAND_MARK_READ,
      SELECTORS,
      unreadRows[0]
    );
    expect(runRowAction).toHaveBeenNthCalledWith(
      2,
      document,
      COMMAND_MARK_READ,
      SELECTORS,
      unreadRows[1]
    );
  });

  it('returns ok false when destructive actions fail or leave rows unread', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);
    appendMarkReadPill(unreadRows[0]);
    appendMarkReadPill(unreadRows[1]);

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest({ ok: false }),
      runRowAction: vi.fn(async () => ({ ok: false, reason: 'already-read' })),
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis.ok).toBe(false);
    expect(localThis.pillResult).toEqual({ ok: false, reason: 'already-read' });
    expect(localThis.shortcutResult).toEqual({ ok: false, reason: 'already-read' });
  });

  it('returns ok false when mark-as-read actions report readStatePending', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);
    appendMarkReadPill(unreadRows[0]);
    appendMarkReadPill(unreadRows[1]);

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest(),
      runRowAction: vi.fn(async () => ({ ok: true, readStatePending: true })),
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis.ok).toBe(false);
    expect(localThis.pillResult).toEqual({ ok: true, readStatePending: true });
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
        markRowRead(row);
        markRowRead(unreadRows[1]);

        return { ok: true };
      }),
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

  it('reports conflicting-hover-target when another row is hovered', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);
    appendMarkReadPill(unreadRows[0]);
    appendMarkReadPill(unreadRows[1]);
    unreadRows[0].classList.add('hovered-row');

    const localThis = await runMarkAsReadLiveValidation(document, {
      isDebugEnabled: async () => true,
      runSelfTest: () => createSelfTest(),
      runRowAction: vi.fn(async (_documentRoot, _command, _selectors, row) => {
        markRowRead(row);

        return { ok: true };
      }),
      selectors: {
        ...SELECTORS,
        hoveredConversationItem: 'mws-conversation-list-item.hovered-row'
      },
      sleep: async () => {},
      dispatchPointerOver: () => {}
    });

    expect(localThis).toMatchObject({
      ok: false,
      error: 'conflicting-hover-target',
      shortcutResult: { ok: false, reason: 'conflicting-hover-target' }
    });
    expect(findConflictingHoveredConversationRow(
      document,
      unreadRows[1],
      {
        ...SELECTORS,
        hoveredConversationItem: 'mws-conversation-list-item.hovered-row'
      }
    )).toBe(unreadRows[0]);
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
      runRowAction: vi.fn(async (_documentRoot, _command, _selectors, row) => {
        markRowRead(row);

        return { ok: true };
      }),
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

  it('returns null when the hovered row matches the shortcut target', () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    const unreadRows = getUnreadConversationRows(document);
    unreadRows[1].classList.add('hovered-row');

    expect(findConflictingHoveredConversationRow(
      document,
      unreadRows[1],
      {
        ...SELECTORS,
        hoveredConversationItem: 'mws-conversation-list-item.hovered-row'
      }
    )).toBeNull();
  });
});
