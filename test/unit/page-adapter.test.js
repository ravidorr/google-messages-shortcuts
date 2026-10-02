import { beforeEach, describe, expect, it } from 'vitest';
import {
  assessPageCapabilities,
  createPageAdapter,
  getPageSelectors,
  PAGE_ADAPTER_AREAS
} from '../../src/content/adapters/page-adapter.js';
import { CAPABILITY_UNAVAILABLE, CAPABILITY_SUPPORTED } from '../../src/content/adapters/capability-states.js';
import { COMPOSER_CAPABILITY_IDS } from '../../src/content/adapters/composer-adapter.js';
import { fullListActionSurface } from '../fixtures/dom/list-states.js';

describe('page-adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('merges list and menu selectors for the page contract', () => {
    const localThis = getPageSelectors();

    expect(localThis.conversationRow).toBe('mws-conversation-list-item');
    expect(localThis.archiveMenuItem).toContain('data-e2e-conversation-menu-archive');
  });

  it('assesses every adapter area', () => {
    document.body.innerHTML = fullListActionSurface;
    const localThis = assessPageCapabilities(document);

    expect(Object.keys(localThis).sort()).toEqual(PAGE_ADAPTER_AREAS.sort());
    expect(localThis.list['list.targeting'].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis.menu['menu.archive'].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis.startChat['startChat.entry'].state).toBe(CAPABILITY_SUPPORTED);
    expect(localThis.composer[COMPOSER_CAPABILITY_IDS.focus].state).toBe(CAPABILITY_UNAVAILABLE);
  });

  it('exposes assessCapabilities on the page adapter instance', () => {
    document.body.innerHTML = fullListActionSurface;
    const localThis = createPageAdapter(document);
    const capabilities = localThis.assessCapabilities();

    expect(capabilities.menu['menu.trash'].state).toBe(CAPABILITY_SUPPORTED);
  });
});
