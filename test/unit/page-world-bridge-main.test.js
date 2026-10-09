import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  PAGE_WORLD_BRIDGE_REQUEST_EVENT,
  PAGE_WORLD_BRIDGE_RESPONSE_EVENT,
  PAGE_WORLD_BRIDGE_TIMEOUT_MS
} from '../../src/content/page-world-bridge-constants.js';
import { installPageWorldBridgeMain } from '../../page-world-bridge-main.js';

describe('page-world-bridge-main', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    globalThis.MessagesShortcuts = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('installs the page bridge only once', () => {
    const localThis = installPageWorldBridgeMain(document, globalThis);
    const secondInstall = installPageWorldBridgeMain(document, globalThis);

    expect(localThis).toBe(secondInstall);
    expect(globalThis.MessagesShortcuts.__pageBridgeInstalled).toBe(true);
  });

  it('rejects bridge calls that time out', async () => {
    installPageWorldBridgeMain(document, globalThis);
    const invokePromise = globalThis.MessagesShortcuts.runCapabilitySelfTest();

    vi.advanceTimersByTime(PAGE_WORLD_BRIDGE_TIMEOUT_MS);

    await expect(invokePromise).rejects.toThrow(
      'Bridge request timed out for runCapabilitySelfTest'
    );
  });

  it('rejects bridge responses that report failure', async () => {
    installPageWorldBridgeMain(document, globalThis);

    document.addEventListener(PAGE_WORLD_BRIDGE_REQUEST_EVENT, (event) => {
      document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, {
        detail: {
          requestId: event.detail.requestId,
          payload: {
            ok: false,
            error: 'host-unavailable'
          }
        }
      }));
    }, { once: true });

    await expect(globalThis.MessagesShortcuts.runCapabilitySelfTest()).rejects.toThrow(
      'host-unavailable'
    );
  });

  it('resolves successful bridge responses from the host', async () => {
    installPageWorldBridgeMain(document, globalThis);

    document.addEventListener(PAGE_WORLD_BRIDGE_REQUEST_EVENT, (event) => {
      document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, {
        detail: {
          requestId: event.detail.requestId,
          payload: {
            ok: true,
            result: { ok: true, mutated: false }
          }
        }
      }));
    }, { once: true });

    await expect(globalThis.MessagesShortcuts.runCapabilitySelfTest()).resolves.toEqual({
      ok: true,
      mutated: false
    });
  });

  it('rejects bridge responses without an error message', async () => {
    installPageWorldBridgeMain(document, globalThis);

    document.addEventListener(PAGE_WORLD_BRIDGE_REQUEST_EVENT, (event) => {
      document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, {
        detail: {
          requestId: event.detail.requestId,
          payload: {
            ok: false
          }
        }
      }));
    }, { once: true });

    await expect(globalThis.MessagesShortcuts.runCapabilitySelfTest()).rejects.toThrow(
      'bridge-request-failed'
    );
  });

  it('does not expose destructive page bridge methods', () => {
    installPageWorldBridgeMain(document, globalThis);

    expect(globalThis.MessagesShortcuts.handleCommand).toBeUndefined();
    expect(globalThis.MessagesShortcuts.runConversationAction).toBeUndefined();
  });

  it('exposes runMarkAsReadLiveValidation through the page bridge', async () => {
    installPageWorldBridgeMain(document, globalThis);

    document.addEventListener(PAGE_WORLD_BRIDGE_REQUEST_EVENT, (event) => {
      document.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, {
        detail: {
          requestId: event.detail.requestId,
          payload: {
            ok: true,
            result: { ok: true, pillResult: { ok: true }, shortcutResult: { ok: true } }
          }
        }
      }));
    }, { once: true });

    await expect(globalThis.MessagesShortcuts.runMarkAsReadLiveValidation()).resolves.toEqual({
      ok: true,
      pillResult: { ok: true },
      shortcutResult: { ok: true }
    });
  });
});
