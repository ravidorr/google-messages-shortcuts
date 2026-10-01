import {
  PAGE_WORLD_BRIDGE_REQUEST_EVENT,
  PAGE_WORLD_BRIDGE_RESPONSE_EVENT
} from './page-world-bridge-constants.js';

function dispatchBridgeResponse(documentRoot, requestId, payload) {
  documentRoot.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, {
    detail: {
      requestId,
      payload
    }
  }));
}

export function createDefaultPageWorldBridgeHandlers({
  runCapabilitySelfTest,
  handleCommand,
  runConversationAction
}) {
  return {
    runCapabilitySelfTest: () => runCapabilitySelfTest(document),
    handleCommand: (command) => handleCommand(command, document),
    runConversationAction: (command, selectors, targetConversationRow) => runConversationAction(
      document,
      command,
      selectors,
      targetConversationRow
    )
  };
}

export function installPageWorldBridgeHost(documentRoot, handlers) {
  const listener = (event) => {
    const requestId = event.detail?.requestId;
    const method = event.detail?.method;

    if (!requestId || !method) {
      return;
    }

    Promise.resolve().then(async () => {
      const handler = handlers[method];

      if (!handler) {
        dispatchBridgeResponse(documentRoot, requestId, {
          ok: false,
          error: `unknown-method:${method}`
        });

        return;
      }

      try {
        const result = await handler(...(event.detail.args || []));

        dispatchBridgeResponse(documentRoot, requestId, {
          ok: true,
          result
        });
      } catch (error) {
        dispatchBridgeResponse(documentRoot, requestId, {
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  };

  documentRoot.addEventListener(PAGE_WORLD_BRIDGE_REQUEST_EVENT, listener);

  return () => {
    documentRoot.removeEventListener(PAGE_WORLD_BRIDGE_REQUEST_EVENT, listener);
  };
}
