import {
  PAGE_WORLD_BRIDGE_METHOD,
  PAGE_WORLD_BRIDGE_REQUEST_EVENT,
  PAGE_WORLD_BRIDGE_RESPONSE_EVENT,
  PAGE_WORLD_BRIDGE_TIMEOUT_MS
} from './src/content/page-world-bridge-constants.js';

export function installPageWorldBridgeMain(
  documentRoot = document,
  globalObject = globalThis
) {
  if (globalObject.MessagesShortcuts?.__pageBridgeInstalled) {
    return globalObject.MessagesShortcuts;
  }

  const pendingRequests = new Map();

  documentRoot.addEventListener(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, (event) => {
    const requestId = event.detail?.requestId;
    const entry = pendingRequests.get(requestId);

    if (!entry) {
      return;
    }

    clearTimeout(entry.timeoutId);
    pendingRequests.delete(requestId);

    const payload = event.detail?.payload;

    if (payload?.ok) {
      entry.resolve(payload.result);

      return;
    }

    entry.reject(new Error(payload?.error || 'bridge-request-failed'));
  });

  function invokeBridgeMethod(method, args = []) {
    return new Promise((resolve, reject) => {
      const requestId = globalObject.crypto.randomUUID();
      const timeoutId = globalObject.setTimeout(() => {
        pendingRequests.delete(requestId);
        reject(new Error(`Bridge request timed out for ${method}`));
      }, PAGE_WORLD_BRIDGE_TIMEOUT_MS);

      pendingRequests.set(requestId, {
        resolve,
        reject,
        timeoutId
      });

      documentRoot.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_REQUEST_EVENT, {
        detail: {
          requestId,
          method,
          args
        }
      }));
    });
  }

  globalObject.MessagesShortcuts = {
    ...(globalObject.MessagesShortcuts || {}),
    __pageBridgeInstalled: true,
    runCapabilitySelfTest() {
      return invokeBridgeMethod(PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest);
    },
    handleCommand(command) {
      return invokeBridgeMethod('handleCommand', [command]);
    },
    runConversationAction(command, selectors, targetConversationRow) {
      return invokeBridgeMethod('runConversationAction', [
        command,
        selectors,
        targetConversationRow
      ]);
    }
  };

  return globalObject.MessagesShortcuts;
}

installPageWorldBridgeMain();
