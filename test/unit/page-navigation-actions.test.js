import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as listNavigation from '../../src/content/list-navigation.js';
import { applyListCursorHighlight } from '../../src/content/list-cursor-highlight.js';
import {
  establishInitialListCursor,
  executePageNavigationCommand,
  getCurrentCursorIdentity,
  isInboxListView,
  mapReturnNavigationFailure,
  resetPageNavigationStateForTests,
  setCurrentCursorIdentity
} from '../../src/content/page-navigation-actions.js';
import {
  recordOpenedConversation,
  resetNavigationHistoryForTests
} from '../../src/content/navigation-history.js';
import {
  PAGE_COMMAND_NEXT_CONVERSATION,
  PAGE_COMMAND_OPEN_CONVERSATION,
  PAGE_COMMAND_PREVIOUS_CONVERSATION,
  PAGE_COMMAND_RETURN_PREVIOUS
} from '../../src/shared/page-commands.js';
import {
  multiRowNavigationList,
  unfocusedMultiRowNavigationList
} from '../fixtures/dom/list-states.js';

function createChromeApi({ paused = false } = {}) {
  return {
    storage: {
      local: {
        get: vi.fn(async () => ({ extensionPaused: paused }))
      }
    }
  };
}

describe('page-navigation-actions', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    resetPageNavigationStateForTests();
    resetNavigationHistoryForTests();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('executes list navigation commands and tracks the cursor', async () => {
    document.body.innerHTML = multiRowNavigationList;

    await executePageNavigationCommand(
      PAGE_COMMAND_PREVIOUS_CONVERSATION,
      document,
      createChromeApi()
    );

    const localThis = await executePageNavigationCommand(
      PAGE_COMMAND_NEXT_CONVERSATION,
      document,
      createChromeApi()
    );

    expect(localThis.ok).toBe(true);
    expect(getCurrentCursorIdentity()).toBe('href:/web/conversations/b');
  });

  it('records opened conversations for return navigation', async () => {
    document.body.innerHTML = multiRowNavigationList;

    await executePageNavigationCommand(
      PAGE_COMMAND_OPEN_CONVERSATION,
      document,
      createChromeApi()
    );
    await executePageNavigationCommand(
      PAGE_COMMAND_NEXT_CONVERSATION,
      document,
      createChromeApi()
    );
    await executePageNavigationCommand(
      PAGE_COMMAND_OPEN_CONVERSATION,
      document,
      createChromeApi()
    );

    const localThis = await executePageNavigationCommand(
      PAGE_COMMAND_RETURN_PREVIOUS,
      document,
      createChromeApi()
    );

    expect(localThis.ok).toBe(true);
    expect(getCurrentCursorIdentity()).toBe('href:/web/conversations/b');
  });

  it('maps return navigation failures to user-facing reasons', () => {
    expect(mapReturnNavigationFailure({ ok: true, identity: 'href:/web/conversations/a' }))
      .toEqual({ ok: true, identity: 'href:/web/conversations/a' });
    expect(mapReturnNavigationFailure({ ok: false, reason: 'cursor-ambiguous' }))
      .toEqual({ ok: false, reason: 'return-ambiguous' });
    expect(mapReturnNavigationFailure({ ok: false, reason: 'cursor-not-found' }))
      .toEqual({ ok: false, reason: 'return-not-found' });
    expect(mapReturnNavigationFailure({ ok: false, reason: 'unexpected' }))
      .toEqual({ ok: false, reason: 'unexpected' });
  });

  it('maps cursor-not-found to return-not-found when history exists but the row is unloaded', async () => {
    recordOpenedConversation('href:/web/conversations/a');
    recordOpenedConversation('href:/web/conversations/b');

    const localThis = await executePageNavigationCommand(
      PAGE_COMMAND_RETURN_PREVIOUS,
      document,
      createChromeApi()
    );

    expect(localThis.ok).toBe(false);
    expect(localThis.reason).toBe('return-not-found');
  });

  it('reports return-not-found when the previous conversation is no longer loaded', async () => {
    document.body.innerHTML = multiRowNavigationList;

    await executePageNavigationCommand(
      PAGE_COMMAND_OPEN_CONVERSATION,
      document,
      createChromeApi()
    );
    setCurrentCursorIdentity('href:/web/conversations/c');
    await executePageNavigationCommand(
      PAGE_COMMAND_OPEN_CONVERSATION,
      document,
      createChromeApi()
    );

    document.body.innerHTML = `
      <mws-conversation-list-item>
        <a href="/web/conversations/z" data-e2e-conversation></a>
        <button aria-haspopup="menu"></button>
      </mws-conversation-list-item>
    `;

    const localThis = await executePageNavigationCommand(
      PAGE_COMMAND_RETURN_PREVIOUS,
      document,
      createChromeApi()
    );

    expect(localThis.reason).toBe('return-not-found');
  });

  it('covers establishInitialListCursor guard and sync branches', async () => {
    expect(await establishInitialListCursor(
      document,
      undefined,
      createChromeApi({ paused: true }),
      { pathname: '/web/conversations' }
    )).toBeNull();

    document.body.innerHTML = '';
    expect(await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations' }
    )).toBeNull();

    document.body.innerHTML = multiRowNavigationList;
    expect(await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations' }
    )).toBe('href:/web/conversations/b');

    resetPageNavigationStateForTests();
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    applyListCursorHighlight(document.getElementById('fixture-row-a'), document);
    setCurrentCursorIdentity('href:/web/conversations/a');
    expect(await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations' }
    )).toBe('href:/web/conversations/a');

    resetPageNavigationStateForTests();
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    setCurrentCursorIdentity('href:/web/conversations/c');
    expect(await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations' }
    )).toBe('href:/web/conversations/c');

    resetPageNavigationStateForTests();
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    vi.spyOn(listNavigation, 'requestNativeListRowFocus').mockImplementation((documentRoot) => {
      const nativeRow = documentRoot.querySelector('#fixture-row-b');
      nativeRow.setAttribute('is-focused', 'true');
      nativeRow.innerHTML = '<button></button>';

      return true;
    });
    expect(await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations' }
    )).toBe('href:/web/conversations/a');
    vi.restoreAllMocks();

    resetPageNavigationStateForTests();
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    vi.spyOn(listNavigation, 'requestNativeListRowFocus').mockImplementation((documentRoot) => {
      documentRoot.querySelector('#fixture-row-b').setAttribute('is-focused', 'true');

      return true;
    });
    expect(await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations' }
    )).toBe('href:/web/conversations/b');
    vi.restoreAllMocks();

    resetPageNavigationStateForTests();
    document.body.innerHTML = `
      <mws-conversation-list-item>
        <button></button>
      </mws-conversation-list-item>
    `;
    expect(await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations' }
    )).toBeNull();
  });

  it('establishes the initial list cursor on the inbox list view', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;

    const localThis = await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations' }
    );

    expect(localThis).toBe('href:/web/conversations/a');
    expect(getCurrentCursorIdentity()).toBe('href:/web/conversations/a');
    expect(document.querySelector('[data-messages-shortcuts-list-cursor="true"]')).not.toBeNull();
  });

  it('skips initial cursor setup outside the inbox list view', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;

    expect(isInboxListView({ pathname: '/web/conversations/Cggabc123' })).toBe(false);
    expect(isInboxListView({ pathname: '/web/conversations' })).toBe(true);

    const localThis = await establishInitialListCursor(
      document,
      undefined,
      createChromeApi(),
      { pathname: '/web/conversations/Cggabc123' }
    );

    expect(localThis).toBeNull();
    expect(getCurrentCursorIdentity()).toBeNull();
  });

  it('respects pause preference', async () => {
    document.body.innerHTML = multiRowNavigationList;

    const localThis = await executePageNavigationCommand(
      PAGE_COMMAND_NEXT_CONVERSATION,
      document,
      createChromeApi({ paused: true })
    );

    expect(localThis.reason).toBe('extension-paused');
  });
});
