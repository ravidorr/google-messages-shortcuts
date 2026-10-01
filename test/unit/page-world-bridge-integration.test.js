import { beforeEach, describe, expect, it } from 'vitest';
import { runCapabilitySelfTest } from '../../src/content/adapters/capability-self-test.js';
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

    installPageWorldBridgeHost(
      document,
      createDefaultPageWorldBridgeHandlers({
        runCapabilitySelfTest: () => runCapabilitySelfTest(document),
        handleCommand: async () => ({ ok: true }),
        runConversationAction: async () => ({ ok: true })
      })
    );
    installPageWorldBridgeMain(document, globalThis);

    await expect(globalThis.MessagesShortcuts.runCapabilitySelfTest()).resolves.toMatchObject({
      ok: true,
      mutated: false
    });
  });
});
