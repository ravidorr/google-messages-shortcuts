import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasUnsafeCapabilities,
  runCapabilitySelfTest
} from '../../src/content/adapters/capability-self-test.js';
import { CAPABILITY_UNSAFE } from '../../src/content/adapters/capability-states.js';
import {
  fullListActionSurface,
  rowMissingMenuButton
} from '../fixtures/dom/list-states.js';

describe('capability-self-test', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns ok when capabilities are safe and the DOM is unchanged', () => {
    document.body.innerHTML = fullListActionSurface;
    const localThis = runCapabilitySelfTest(document);

    expect(localThis.ok).toBe(true);
    expect(localThis.mutated).toBe(false);
    expect(localThis.summary.unsafe).toBe(0);
    expect(localThis.capabilities.length).toBeGreaterThan(0);
  });

  it('returns not ok when any capability is unsafe', () => {
    document.body.innerHTML = rowMissingMenuButton;
    const localThis = runCapabilitySelfTest(document);

    expect(localThis.ok).toBe(false);
    expect(localThis.summary.unsafe).toBeGreaterThan(0);
    expect(hasUnsafeCapabilities(localThis)).toBe(true);
  });

  it('detects focus mutations during the self-test', () => {
    document.body.innerHTML = fullListActionSurface;
    const input = document.createElement('input');
    document.body.append(input);

    const assessCapabilities = vi.fn(() => {
      input.focus();

      return {
        list: {
          'list.targeting': {
            state: 'supported',
            reason: 'test',
            evidenceSource: 'test'
          },
          'list.unreadDetection': {
            state: 'supported',
            reason: 'test',
            evidenceSource: 'test'
          }
        },
        menu: {},
        composer: {},
        messagePane: {},
        connection: {}
      };
    });

    const localThis = runCapabilitySelfTest(document, assessCapabilities);

    expect(localThis.mutated).toBe(true);
    expect(localThis.ok).toBe(false);
    expect(localThis.mutation.focusChanged).toBe(true);
  });

  it('flags body mutations from injected assessors', () => {
    document.body.innerHTML = fullListActionSurface;

    const assessCapabilities = vi.fn(() => {
      document.body.insertAdjacentHTML('beforeend', '<div id="mutation"></div>');

      return {
        list: {
          'list.targeting': {
            state: 'supported',
            reason: 'test',
            evidenceSource: 'test'
          },
          'list.unreadDetection': {
            state: 'supported',
            reason: 'test',
            evidenceSource: 'test'
          }
        },
        menu: {},
        composer: {},
        messagePane: {},
        connection: {}
      };
    });

    const localThis = runCapabilitySelfTest(document, assessCapabilities);

    expect(localThis.mutation.bodyChanged).toBe(true);
    expect(localThis.ok).toBe(false);
  });

  it('handles document roots without body or activeElement metadata', () => {
    const documentRoot = {
      body: undefined,
      activeElement: undefined,
      querySelectorAll: () => []
    };
    const assessCapabilities = vi.fn(() => ({
      list: {
        'list.targeting': {
          state: 'supported',
          reason: 'test',
          evidenceSource: 'test'
        }
      },
      menu: {},
      composer: {},
      messagePane: {},
      connection: {}
    }));

    const localThis = runCapabilitySelfTest(documentRoot, assessCapabilities);

    expect(localThis.ok).toBe(true);
    expect(localThis.mutated).toBe(false);
  });

  it('summarizes capability counts including unsafe entries', () => {
    const assessCapabilities = vi.fn(() => ({
      list: {
        'list.targeting': {
          state: CAPABILITY_UNSAFE,
          reason: 'unsafe',
          evidenceSource: 'test'
        }
      },
      menu: {},
      composer: {},
      messagePane: {},
      connection: {}
    }));

    const localThis = runCapabilitySelfTest(document, assessCapabilities);

    expect(localThis.summary.unsafeCapabilityIds).toContain('list.targeting');
  });
});
