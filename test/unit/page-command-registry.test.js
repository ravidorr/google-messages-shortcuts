import { beforeEach, describe, expect, it } from 'vitest';
import {
  filterCommandRegistryEntries,
  getCommandRegistryEntries,
  getCommandRegistryEntry
} from '../../src/content/page-command-registry.js';
import { PAGE_COMMAND_FOCUS_COMPOSER } from '../../src/shared/page-commands.js';
import { composerEditorSurface } from '../fixtures/dom/list-states.js';

describe('page-command-registry', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns filterable command metadata with availability', () => {
    const localThis = getCommandRegistryEntries(document);
    const composerEntry = getCommandRegistryEntry(PAGE_COMMAND_FOCUS_COMPOSER, document);

    expect(localThis.length).toBeGreaterThan(10);
    expect(composerEntry.availability.status).toBe('unavailable');
    expect(filterCommandRegistryEntries(localThis, 'next unread')).toHaveLength(1);
  });

  it('marks composer focus available when the editor surface is present', () => {
    document.body.innerHTML = composerEditorSurface;

    const composerEntry = getCommandRegistryEntry(PAGE_COMMAND_FOCUS_COMPOSER, document);

    expect(composerEntry.availability.status).toBe('available');
  });
});

