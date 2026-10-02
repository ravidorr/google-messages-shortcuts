import { beforeEach, describe, expect, it, vi } from 'vitest';
import { archivedModalSurface } from '../fixtures/dom/list-states.js';

vi.mock('../../src/content/adapters/archived-adapter.js', async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    isRowInArchivedModal: () => true,
    findUnarchiveButtonForRow: () => null
  };
});

describe('archived modal action edge cases', () => {
  beforeEach(() => {
    document.body.innerHTML = archivedModalSurface;
  });

  it('fails closed when the row-scoped unarchive button is missing at execution time', async () => {
    const { runConversationAction } = await import('../../src/content/conversation-action.js');
    const { COMMAND_UNARCHIVE } = await import('../../src/shared/commands.js');
    const archivedRow = document.getElementById('fixture-archived-row');

    const localThis = await runConversationAction(
      document,
      COMMAND_UNARCHIVE,
      undefined,
      archivedRow
    );

    expect(localThis).toEqual({ ok: false, reason: 'unarchive-button-not-found' });
  });
});
