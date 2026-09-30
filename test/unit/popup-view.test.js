import { beforeEach, describe, expect, it } from 'vitest';
import {
  getShortcutStatus,
  populateShortcutList,
  renderShortcutRows
} from '../../src/popup/popup-view.js';
import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../../src/shared/commands.js';

describe('popup-view', () => {
  beforeEach(() => {
    document.body.innerHTML = '<ul id="shortcut-list"></ul>';
  });

  it('marks missing shortcuts', () => {
    expect(getShortcutStatus('')).toEqual({
      label: 'Not assigned',
      className: 'shortcut-status shortcut-status--missing'
    });
  });

  it('marks assigned shortcuts', () => {
    expect(getShortcutStatus('Ctrl+Shift+Y')).toEqual({
      label: 'Ctrl+Shift+Y',
      className: 'shortcut-status shortcut-status--assigned'
    });
  });

  it('renders archive and trash rows', () => {
    const rows = renderShortcutRows([
      { name: COMMAND_ARCHIVE, shortcut: 'Ctrl+Shift+Y' },
      { name: COMMAND_TRASH, shortcut: '' }
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0].shortcut).toBe('Ctrl+Shift+Y');
    expect(rows[1].shortcut).toBe('Not assigned');
  });

  it('populates the shortcut list in the popup', () => {
    const container = document.getElementById('shortcut-list');

    populateShortcutList(container, [
      { name: COMMAND_ARCHIVE, shortcut: 'Ctrl+Shift+Y' },
      { name: COMMAND_TRASH, shortcut: 'Ctrl+Shift+D' }
    ]);

    expect(container.querySelectorAll('.shortcut-item')).toHaveLength(2);
  });
});
