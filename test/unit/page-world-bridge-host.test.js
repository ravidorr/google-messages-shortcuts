import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PAGE_WORLD_BRIDGE_REQUEST_EVENT,
  PAGE_WORLD_BRIDGE_RESPONSE_EVENT
} from '../../src/content/page-world-bridge-constants.js';
import {
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
      runCapabilitySelfTest: vi.fn(() => ({ ok: true, summary: { unsafe: 0 } }))
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
        method: 'runCapabilitySelfTest'
      }
    }));

    await expect(responsePromise).resolves.toEqual({
      requestId: 'request-1',
      payload: {
        ok: true,
        result: { ok: true, summary: { unsafe: 0 } }
      }
    });
    expect(localThis.runCapabilitySelfTest).toHaveBeenCalledTimes(1);

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
        method: 'unsupportedMethod'
      }
    }));

    await expect(responsePromise).resolves.toEqual({
      requestId: 'request-2',
      payload: {
        ok: false,
        error: 'unknown-method:unsupportedMethod'
      }
    });

    disconnect();
  });

  it('ignores malformed bridge requests', async () => {
    const localThis = {
      runCapabilitySelfTest: vi.fn()
    };
    const disconnect = installPageWorldBridgeHost(document, localThis);
    const responseListener = vi.fn();

    document.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, responseListener);

    document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
      detail: {
        method: 'runCapabilitySelfTest'
      }
    }));

    await Promise.resolve();

    expect(responseListener).not.toHaveBeenCalled();
    expect(localThis.runCapabilitySelfTest).not.toHaveBeenCalled();

    disconnect();
  });

  it('stringifies non-error handler failures for the page bridge', async () => {
    const disconnect = installPageWorldBridgeHost(document, {
      runCapabilitySelfTest: () => {
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
        method: 'runCapabilitySelfTest'
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
      runCapabilitySelfTest: () => {
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
        method: 'runCapabilitySelfTest'
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

  it('creates default handlers that delegate to the content script APIs', async () => {
    document.body.innerHTML = fullListActionSurface;

    const localThis = createDefaultPageWorldBridgeHandlers({
      runCapabilitySelfTest: () => runCapabilitySelfTest(document),
      handleCommand: async (command) => ({ ok: true, command }),
      runConversationAction: async () => ({ ok: true })
    });

    expect(localThis.runCapabilitySelfTest()).toMatchObject({ ok: true });
    await expect(localThis.handleCommand('archive-conversation')).resolves.toEqual({
      ok: true,
      command: 'archive-conversation'
    });
    await expect(localThis.runConversationAction('archive-conversation')).resolves.toEqual({ ok: true });
  });
});
