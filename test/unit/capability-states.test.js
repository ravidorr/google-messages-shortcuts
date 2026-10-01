import { describe, expect, it } from 'vitest';
import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE,
  createCapabilityResult,
  isCapabilitySupported,
  isCapabilityUnsafe
} from '../../src/content/adapters/capability-states.js';

describe('capability-states', () => {
  it('creates capability results with optional evidence', () => {
    const localThis = createCapabilityResult(
      CAPABILITY_SUPPORTED,
      'Ready',
      'dom-query'
    );

    expect(localThis).toEqual({
      state: CAPABILITY_SUPPORTED,
      reason: 'Ready',
      evidenceSource: 'dom-query'
    });
  });

  it('defaults evidenceSource to null', () => {
    const localThis = createCapabilityResult(CAPABILITY_UNAVAILABLE, 'Missing');

    expect(localThis.evidenceSource).toBeNull();
  });

  it('detects supported and unsafe capability results', () => {
    expect(isCapabilitySupported({ state: CAPABILITY_SUPPORTED })).toBe(true);
    expect(isCapabilitySupported({ state: CAPABILITY_UNAVAILABLE })).toBe(false);
    expect(isCapabilityUnsafe({ state: CAPABILITY_UNSAFE })).toBe(true);
    expect(isCapabilityUnsafe(undefined)).toBe(false);
  });
});
