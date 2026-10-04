import {
  PAGE_WORLD_BRIDGE_METHOD,
  PAGE_WORLD_BRIDGE_REQUEST_EVENT,
  PAGE_WORLD_BRIDGE_RESPONSE_EVENT
} from './page-world-bridge-constants.js';

export const ALLOWED_PAGE_WORLD_BRIDGE_METHODS = new Set([
  PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest
]);

function dispatchBridgeResponse(documentRoot, requestId, payload) {
  documentRoot.dispatchEvent(new CustomEvent(PAGE_WORLD_BRIDGE_RESPONSE_EVENT, {
    detail: {
      requestId,
      payload
    }
  }));
}

export function createDefaultPageWorldBridgeHandlers({ runCapabilitySelfTest }) {
  return {
    [PAGE_WORLD_BRIDGE_METHOD.runCapabilitySelfTest]: () => runCapabilitySelfTest(document)
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
      if (!ALLOWED_PAGE_WORLD_BRIDGE_METHODS.has(method)) {
        dispatchBridgeResponse(documentRoot, requestId, {
          ok: false,
          error: `unknown-method:${method}`
        });

        return;
      }

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
