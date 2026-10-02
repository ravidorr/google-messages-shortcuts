import { describe, expect, it } from 'vitest';
import { findArchivedConversationRow } from '../../src/content/conversation-target.js';
import { archivedModalSurface } from '../fixtures/dom/list-states.js';

describe('conversation-target archived rows', () => {
  it('delegates archived row targeting to the archived adapter', () => {
    document.body.innerHTML = archivedModalSurface;

    expect(findArchivedConversationRow(document)?.id).toBe('fixture-archived-row');
  });
});
