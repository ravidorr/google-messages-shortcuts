const DEFAULT_TIMEOUT_MS = 2500;
const DEFAULT_POLL_INTERVAL_MS = 100;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForTargetRowPostcondition({
  conversationRow,
  isSatisfied,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS
}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (!conversationRow?.isConnected) {
      return {
        ok: false,
        reason: 'target-row-disconnected'
      };
    }

    if (isSatisfied(conversationRow)) {
      return { ok: true };
    }

    await sleep(pollIntervalMs);
  }

  return {
    ok: false,
    reason: 'postcondition-timeout'
  };
}
