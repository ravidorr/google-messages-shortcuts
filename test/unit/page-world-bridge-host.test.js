import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PAGE_WORLD_BRIDGE_METHOD,
  PAGE_WORLD_BRIDGE_REQUEST_EVENT,
  PAGE_WORLD_BRIDGE_RESPONSE_EVENT
} from '../../src/content/page-world-bridge-constants.js';
import {
  ALLOWED_PAGE_WORLD_BRIDGE_METHODS,
  createDefaultPageWorldBridgeHandlers,
  installPageWorldBridgeHost
} from '../../src/content/page-world-bridge-host.js';
import { runCapabilitySelfTest } from '../../src/content/adapters/capability-self-test.js';
import { fullListActionSurface } from '../fixtures/dom/list-states.js';

describe('page-world-bridge-host', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('responds to runCapabilitySelfTest bridge requests', async () => {
    const localThis = {
      [PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest]:
        vi.fn(() => ({ ok: true, summary: { unsafe: 0 } }))
    };
    const disconnect = installPageWorldBridgeHost(document, localThis);
    const responsePromise = new Promise((resolve) => {
      document.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, (event) => {
        resolve(event.detail);
      }, { once: true });
    });

    document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
      detail: {
        requestId: 'request-1',
        method: PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest
      }
    }));

    await expect(responsePromise).resolves.toEqual({
      requestId: 'request-1',
      payload: {
        ok: true,
        result: { ok: true, summary: { unsafe: 0 } }
      }
    });
    expect(localThis[PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest]).toHaveBeenCalledTimes(1);

    disconnect();
  });

  it('returns unknown-method when an allowed bridge method has no handler', async () => {
    const disconnect = installPageWorldBridgeHost(document, {});
    const responsePromise = new Promise((resolve) => {
      document.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, (event) => {
        resolve(event.detail);
      }, { once: true });
    });

    document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
      detail: {
        requestId: 'request-allowed-missing',
        method: PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest
      }
    }));

    await expect(responsePromise).resolves.toEqual({
      requestId: 'request-allowed-missing',
      payload: {
        ok: false,
        error: 'unknown-method:runCapabilitySelfTest'
      }
    });

    disconnect();
  });

  it('returns unknown-method for unsupported bridge calls', async () => {
    const disconnect = installPageWorldBridgeHost(document, {});
    const responsePromise = new Promise((resolve) => {
      document.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, (event) => {
        resolve(event.detail);
      }, { once: true });
    });

    document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
      detail: {
        requestId: 'request-2',
        method: 'handleCommand'
      }
    }));

    await expect(responsePromise).resolves.toEqual({
      requestId: 'request-2',
      payload: {
        ok: false,
        error: 'unknown-method:handleCommand'
      }
    });

    disconnect();
  });

  it('rejects destructive bridge methods even when handlers are registered', async () => {
    const disconnect = installPageWorldBridgeHost(document, {
      handleCommand: vi.fn(async () => ({ ok: true })),
      runConversationAction: vi.fn(async () => ({ ok: true }))
    });
    const responsePromise = new Promise((resolve) => {
      document.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, (event) => {
        resolve(event.detail);
      }, { once: true });
    });

    document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
      detail: {
        requestId: 'request-2b',
        method: 'runConversationAction',
        args: ['archive-conversation']
      }
    }));

    await expect(responsePromise).resolves.toEqual({
      requestId: 'request-2b',
      payload: {
        ok: false,
        error: 'unknown-method:runConversationAction'
      }
    });

    disconnect();
  });

  it('ignores malformed bridge requests', async () => {
    const localThis = {
      [PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest]: vi.fn()
    };
    const disconnect = installPageWorldBridgeHost(document, localThis);
    const responseListener = vi.fn();

    document.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, responseListener);

    document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
      detail: {
        method: PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest
      }
    }));

    await Promise.resolve();

    expect(responseListener).not.toHaveBeenCalled();
    expect(localThis[PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest]).not.toHaveBeenCalled();

    disconnect();
  });

  it('stringifies non-error handler failures for the page bridge', async () => {
    const disconnect = installPageWorldBridgeHost(document, {
      [PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest]: () => {
        throw 'plain-string-failure';
      }
    });
    const responsePromise = new Promise((resolve) => {
      document.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, (event) => {
        resolve(event.detail);
      }, { once: true });
    });

    document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
      detail: {
        requestId: 'request-4',
        method: PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest
      }
    }));

    await expect(responsePromise).resolves.toEqual({
      requestId: 'request-4',
      payload: {
        ok: false,
        error: 'plain-string-failure'
      }
    });

    disconnect();
  });

  it('returns handler failures to the page bridge', async () => {
    const disconnect = installPageWorldBridgeHost(document, {
      [PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest]: () => {
        throw new Error('self-test-failed');
      }
    });
    const responsePromise = new Promise((resolve) => {
      document.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, (event) => {
        resolve(event.detail);
      }, { once: true });
    });

    document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
      detail: {
        requestId: 'request-3',
        method: PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest
      }
    }));

    await expect(responsePromise).resolves.toEqual({
      requestId: 'request-3',
      payload: {
        ok: false,
        error: 'self-test-failed'
      }
    });

    disconnect();
  });

  it('creates default handlers that delegate only to the capability self-test', () => {
    document.body.innerHTML = fullListActionSurface;

    const localThis = createDefaultPageWorldBridgeHandlers({
      runCapabilitySelfTest: () => runCapabilitySelfTest(document)
    });

    expect(localThis).toEqual({
      [PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest]: expect.any(Function)
    });
    expect(localThis.runCapabilitySelfTest()).toMatchObject({ ok: true });
    expect(ALLOWED_PAGE_WORLD_BRIDGE_METHODS.has(PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest))
      .toBe(true);
  });
});
