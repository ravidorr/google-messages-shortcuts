import {
  CAPABILITY_UNSAFE,
  isCapabilityUnsafe
} from './capability-states.js';
import { assessPageCapabilities } from './page-adapter.js';

function captureDomSnapshot(documentRoot) {
  return {
    bodyHtml: documentRoot.body?.innerHTML ?? '',
    activeElementTag: documentRoot.activeElement?.tagName ?? null,
    activeElementId: documentRoot.activeElement?.id ?? null
  };
}

function detectDomMutation(documentRoot, beforeSnapshot) {
  const afterSnapshot = captureDomSnapshot(documentRoot);

  return {
    bodyChanged: afterSnapshot.bodyHtml !== beforeSnapshot.bodyHtml,
    focusChanged:
      afterSnapshot.activeElementTag !== beforeSnapshot.activeElementTag
      || afterSnapshot.activeElementId !== beforeSnapshot.activeElementId
  };
}

function flattenCapabilities(capabilitiesByArea) {
  return Object.entries(capabilitiesByArea).flatMap(([area, capabilities]) => Object.entries(capabilities).map(([capabilityId, result]) => ({
    area,
    capabilityId,
    ...result
  })));
}

function buildSummary(flatCapabilities) {
  const unsafeCapabilities = flatCapabilities.filter((entry) => entry.state === CAPABILITY_UNSAFE);

  return {
    total: flatCapabilities.length,
    supported: flatCapabilities.filter((entry) => entry.state === 'supported').length,
    unavailable: flatCapabilities.filter((entry) => entry.state === 'unavailable').length,
    unsafe: unsafeCapabilities.length,
    unsafeCapabilityIds: unsafeCapabilities.map((entry) => entry.capabilityId)
  };
}

export function runCapabilitySelfTest(documentRoot = document, assessCapabilities = assessPageCapabilities) {
  const beforeSnapshot = captureDomSnapshot(documentRoot);
  const capabilitiesByArea = assessCapabilities(documentRoot);
  const mutation = detectDomMutation(documentRoot, beforeSnapshot);
  const capabilities = flattenCapabilities(capabilitiesByArea);
  const summary = buildSummary(capabilities);
  const mutated = mutation.bodyChanged || mutation.focusChanged;

  return {
    ok: !mutated && summary.unsafe === 0,
    mutated,
    mutation,
    capabilitiesByArea,
    capabilities,
    summary
  };
}

export function hasUnsafeCapabilities(selfTestResult) {
  return selfTestResult.capabilities.some((entry) => isCapabilityUnsafe(entry));
}
