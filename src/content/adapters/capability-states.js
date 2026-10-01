export const CAPABILITY_SUPPORTED = 'supported';
export const CAPABILITY_UNAVAILABLE = 'unavailable';
export const CAPABILITY_UNSAFE = 'unsafe';

export function createCapabilityResult(state, reason, evidenceSource = null) {
  return {
    state,
    reason,
    evidenceSource
  };
}

export function isCapabilitySupported(result) {
  return result?.state === CAPABILITY_SUPPORTED;
}

export function isCapabilityUnsafe(result) {
  return result?.state === CAPABILITY_UNSAFE;
}
