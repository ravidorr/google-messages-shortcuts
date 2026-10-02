import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyListCursorHighlight } from '../../src/content/list-cursor-highlight.js';
import { startInitialListCursorWatcher } from '../../src/content/initial-list-cursor.js';
import {
  resetPageNavigationStateForTests,
  setCurrentCursorIdentity
} from '../../src/content/page-navigation-actions.js';
import { unfocusedMultiRowNavigationList } from '../fixtures/dom/list-states.js';

function createChromeApi({ paused = false } = {}) {
  return {
    storage: {
      local: {
        get: vi.fn(async () => ({ extensionPaused: paused }))
      },
      onChanged: {
        addListener: vi.fn(),
        removeListener: vi.fn()
      }
    }
  };
}

describe('initial-list-cursor', () => {
  let disconnect;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    resetPageNavigationStateForTests();
  });

  afterEach(() => {
    disconnect?.();
    vi.useRealTimers();
  });

  it('establishes the initial cursor when rows render after install', async () => {
    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/a');

    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(100);
    const callsBeforeRows = establishInitialCursor.mock.calls.length;

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    document.body.append(document.createElement('div'));

    await vi.advanceTimersByTimeAsync(50);
    expect(establishInitialCursor.mock.calls.length).toBeGreaterThan(callsBeforeRows);
  });

  it('retries on delayed timers until the cursor is established', async () => {
    const establishInitialCursor = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('href:/web/conversations/a');

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(100);

    expect(establishInitialCursor.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('skips setup while paused or outside the inbox list view', async () => {
    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/a');

    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi({ paused: true }),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    await vi.advanceTimersByTimeAsync(4000);
    expect(establishInitialCursor).not.toHaveBeenCalled();

    disconnect();
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations/Cggabc123' },
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(4000);
    expect(establishInitialCursor).not.toHaveBeenCalled();
  });

  it('restores the cursor when identity exists but the highlight was cleared', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    setCurrentCursorIdentity('href:/web/conversations/a');

    const establishInitialCursor = vi.fn(async () => null);
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(0);

    expect(establishInitialCursor).not.toHaveBeenCalled();
    expect(document.querySelector('[data-messages-shortcuts-list-cursor="true"]')).not.toBeNull();
  });

  it('does not re-establish when the cursor and highlight are already present', async () => {
    document.body.innerHTML = unfocusedMultiRowNavigationList;
    setCurrentCursorIdentity('href:/web/conversations/a');
    applyListCursorHighlight(document.getElementById('fixture-row-a'), document);

    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/b');
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(establishInitialCursor).not.toHaveBeenCalled();
  });

  it('ignores history updates when the pathname does not change', async () => {
    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/a');
    const locationRef = { pathname: '/web/conversations' };
    const pushStateFn = function pushState() {};
    const replaceStateFn = function replaceState() {};
    const historyMock = { pushState: pushStateFn, replaceState: replaceStateFn };
    const windowRef = {
      history: historyMock,
      setTimeout: (...args) => globalThis.setTimeout(...args),
      clearTimeout: (...args) => globalThis.clearTimeout(...args),
      addEventListener: (...args) => globalThis.addEventListener(...args),
      removeEventListener: (...args) => globalThis.removeEventListener(...args)
    };

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef,
      windowRef
    });

    await vi.advanceTimersByTimeAsync(0);
    establishInitialCursor.mockClear();

    historyMock.pushState({}, '', '/web/conversations');
    historyMock.replaceState({}, '', '/web/conversations');
    await vi.advanceTimersByTimeAsync(0);

    expect(establishInitialCursor).not.toHaveBeenCalled();
  });

  it('reacts to replaceState navigation and unpause events', async () => {
    const locationRef = { pathname: '/web/conversations/Cggabc123' };
    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/a');
    const chromeApi = createChromeApi();
    const pushStateFn = function pushState() {};
    const replaceStateFn = function replaceState() {};
    const historyMock = { pushState: pushStateFn, replaceState: replaceStateFn };
    const windowRef = {
      history: historyMock,
      setTimeout: (...args) => globalThis.setTimeout(...args),
      clearTimeout: (...args) => globalThis.clearTimeout(...args),
      addEventListener: (...args) => globalThis.addEventListener(...args),
      removeEventListener: (...args) => globalThis.removeEventListener(...args)
    };

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi,
      establishInitialCursor,
      locationRef,
      windowRef
    });

    await vi.advanceTimersByTimeAsync(0);
    locationRef.pathname = '/web/conversations';
    historyMock.replaceState({}, '', '/web/conversations');
    await vi.advanceTimersByTimeAsync(0);
    expect(establishInitialCursor).toHaveBeenCalled();

    establishInitialCursor.mockClear();
    const pauseListener = chromeApi.storage.onChanged.addListener.mock.calls[0][0];
    pauseListener({ otherSetting: { newValue: true } }, 'local');
    pauseListener({ extensionPaused: { newValue: false } }, 'sync');
    expect(establishInitialCursor).not.toHaveBeenCalled();

    pauseListener({ extensionPaused: { newValue: false } }, 'local');
    await vi.advanceTimersByTimeAsync(0);
    expect(establishInitialCursor).toHaveBeenCalled();
  });

  it('reacts to SPA navigation and unpause events', async () => {
    const locationRef = { pathname: '/web/conversations/Cggabc123' };
    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/a');
    const chromeApi = createChromeApi();

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi,
      establishInitialCursor,
      locationRef,
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(establishInitialCursor).not.toHaveBeenCalled();

    locationRef.pathname = '/web/conversations';
    history.pushState({}, '', '/web/conversations');
    await vi.advanceTimersByTimeAsync(0);
    expect(establishInitialCursor).toHaveBeenCalled();

    establishInitialCursor.mockClear();
    const pauseListener = chromeApi.storage.onChanged.addListener.mock.calls[0][0];
    pauseListener({ extensionPaused: { newValue: false } }, 'local');
    await vi.advanceTimersByTimeAsync(0);
    expect(establishInitialCursor).toHaveBeenCalled();
  });

  it('debounces repeated DOM mutations before attempting setup', async () => {
    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/a');

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(0);
    establishInitialCursor.mockClear();

    document.body.append(document.createElement('div'));
    await vi.advanceTimersByTimeAsync(0);
    document.body.append(document.createElement('span'));
    await vi.advanceTimersByTimeAsync(50);

    expect(establishInitialCursor).toHaveBeenCalledTimes(1);
  });

  it('disconnect clears a pending mutation debounce timer', async () => {
    const establishInitialCursor = vi.fn(async () => null);
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    document.body.append(document.createElement('div'));
    await vi.advanceTimersByTimeAsync(0);
    disconnect();
    disconnect = undefined;

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();

    establishInitialCursor.mockClear();
    await vi.advanceTimersByTimeAsync(100);
    expect(establishInitialCursor).not.toHaveBeenCalled();
  });

  it('does not schedule delayed attempts after an immediate disconnect', async () => {
    const establishInitialCursor = vi.fn(async () => null);
    let resolvePaused;
    const chromeApi = {
      storage: {
        local: {
          get: vi.fn(() => new Promise((resolve) => {
            resolvePaused = resolve;
          }))
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn()
        }
      }
    };

    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi,
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    disconnect();
    disconnect = undefined;
    resolvePaused({ extensionPaused: false });

    await vi.advanceTimersByTimeAsync(4000);
    expect(establishInitialCursor).not.toHaveBeenCalled();
  });

  it('reacts to popstate and hashchange navigation events', async () => {
    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/a');

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(0);
    establishInitialCursor.mockClear();

    globalThis.dispatchEvent(new PopStateEvent('popstate'));
    globalThis.dispatchEvent(new HashChangeEvent('hashchange'));

    await vi.advanceTimersByTimeAsync(0);
    expect(establishInitialCursor.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('skips observer setup when the document body is missing', async () => {
    const establishInitialCursor = vi.fn(async () => null);
    const documentRoot = document.implementation.createHTMLDocument('missing-body');
    documentRoot.documentElement.removeChild(documentRoot.body);

    disconnect = startInitialListCursorWatcher({
      documentRoot,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef: globalThis
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(documentRoot.body).toBeNull();
  });

  it('works when the history API does not expose pushState or replaceState', async () => {
    const establishInitialCursor = vi.fn(async () => 'href:/web/conversations/a');
    const windowRef = {
      history: {},
      setTimeout: (...args) => globalThis.setTimeout(...args),
      clearTimeout: (...args) => globalThis.clearTimeout(...args),
      addEventListener: (...args) => globalThis.addEventListener(...args),
      removeEventListener: (...args) => globalThis.removeEventListener(...args)
    };

    document.body.innerHTML = unfocusedMultiRowNavigationList;
    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi: createChromeApi(),
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef
    });

    await vi.advanceTimersByTimeAsync(0);
    expect(establishInitialCursor).toHaveBeenCalled();
  });

  it('disconnect clears timers, listeners, and history hooks', async () => {
    const establishInitialCursor = vi.fn(async () => null);
    const chromeApi = createChromeApi();
    const originalPushState = function pushState() {};
    const originalReplaceState = function replaceState() {};
    const historyMock = {
      pushState: originalPushState,
      replaceState: originalReplaceState
    };
    const windowRef = {
      history: historyMock,
      setTimeout: (...args) => globalThis.setTimeout(...args),
      clearTimeout: (...args) => globalThis.clearTimeout(...args),
      addEventListener: (...args) => globalThis.addEventListener(...args),
      removeEventListener: (...args) => globalThis.removeEventListener(...args)
    };

    disconnect = startInitialListCursorWatcher({
      documentRoot: document,
      chromeApi,
      establishInitialCursor,
      locationRef: { pathname: '/web/conversations' },
      windowRef
    });

    const wrappedPushState = historyMock.pushState;
    expect(wrappedPushState).not.toBe(originalPushState);

    disconnect();
    disconnect = undefined;

    expect(historyMock.pushState).not.toBe(wrappedPushState);
    expect(chromeApi.storage.onChanged.removeListener).toHaveBeenCalled();

    establishInitialCursor.mockClear();
    await vi.advanceTimersByTimeAsync(4000);
    expect(establishInitialCursor).not.toHaveBeenCalled();
  });
});
