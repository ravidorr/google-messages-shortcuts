import { beforeEach, describe, expect, it } from 'vitest';
import { runCapabilitySelfTest } from '../../src/content/adapters/capability-self-test.js';
import { runMarkAsReadLiveValidation } from '../../src/content/adapters/mark-as-read-live-validation.js';
import { installPageWorldBridgeMain } from '../../page-world-bridge-main.js';
import {
  createDefaultPageWorldBridgeHandlers,
  installPageWorldBridgeHost
} from '../../src/content/page-world-bridge-host.js';
import { fullListActionSurface } from '../fixtures/dom/list-states.js';

describe('page-world-bridge integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    globalThis.MessagesShortcuts = undefined;
  });

  it('runs capability self-test from the page console bridge', async () => {
    document.body.innerHTML = fullListActionSurface;

    const disconnectHost = installPageWorldBridgeHost(
      document,
      createDefaultPageWorldBridgeHandlers({
        runCapabilitySelfTest: () => runCapabilitySelfTest(document),
        runMarkAsReadLiveValidation: () => runMarkAsReadLiveValidation(document, {
          isDebugEnabled: async () => false
        })
      })
    );
    installPageWorldBridgeMain(document, globalThis);

    await expect(globalThis.MessagesShortcuts.runCapabilitySelfTest()).resolves.toMatchObject({
      ok: true,
      mutated: false
    });

    disconnectHost();
  });

  it('runs mark-as-read live validation from the page console bridge', async () => {
    document.body.innerHTML = fullListActionSurface;

    const disconnectHost = installPageWorldBridgeHost(
      document,
      createDefaultPageWorldBridgeHandlers({
        runCapabilitySelfTest: () => runCapabilitySelfTest(document),
        runMarkAsReadLiveValidation: () => runMarkAsReadLiveValidation(document, {
          isDebugEnabled: async () => true,
          runSelfTest: () => ({
            ok: true,
            mutated: false,
            summary: { unsafe: 0 },
            environment: { locale: 'en-US' },
            capabilities: []
          }),
          runRowAction: async () => ({ ok: true }),
          runShortcutCommand: async () => ({ ok: true }),
          sleep: async () => {},
          dispatchPointerOver: () => {}
        })
      })
    );
    installPageWorldBridgeMain(document, globalThis);

    await expect(globalThis.MessagesShortcuts.runMarkAsReadLiveValidation()).resolves.toMatchObject({
      ok: false,
      error: 'insufficient-unread-rows'
    });

    disconnectHost();
  });
});
