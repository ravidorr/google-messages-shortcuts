import { beforeEach, describe, expect, it } from 'vitest';
import {
  getShortcutStatus,
  populateShortcutList,
  renderShortcutRows
} from '../../src/popup/popup-view.js';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH
} from '../../src/shared/commands.js';
import { getCommandIcon } from '../../src/shared/command-icons.js';

function expectLucideShortcutIcon(item, commandName) {
  const icon = getCommandIcon(commandName);
  const svg = item.querySelector('.shortcut-item__icon');

  expect(svg).not.toBeNull();
  expect(svg.getAttribute('aria-hidden')).toBe('true');
  expect(svg.getAttribute('fill')).toBe('none');
  expect(svg.getAttribute('focusable')).toBe('false');
  expect(svg.getAttribute('stroke')).toBe('currentColor');
  expect(svg.getAttribute('stroke-linecap')).toBe('round');
  expect(svg.getAttribute('stroke-linejoin')).toBe('round');
  expect(svg.getAttribute('stroke-width')).toBe('2');
  expect(svg.getAttribute('viewBox')).toBe(icon.viewBox);
  expect([...svg.querySelectorAll('path')].map((path) => path.getAttribute('d')))
    .toEqual(icon.paths);
}

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

  it('renders archive, trash, mark-read, and mark-unread rows', () => {
    const rows = renderShortcutRows([
      { name: COMMAND_ARCHIVE, shortcut: 'Ctrl+Shift+Y' },
      { name: COMMAND_TRASH, shortcut: '' },
      { name: COMMAND_MARK_READ, shortcut: 'Ctrl+Shift+K' },
      { name: COMMAND_MARK_UNREAD, shortcut: 'Ctrl+Shift+U' }
    ]);

    expect(rows).toHaveLength(4);
    expect(rows[0].shortcut).toBe('Ctrl+Shift+Y');
    expect(rows[1].shortcut).toBe('Not assigned');
    expect(rows[2].shortcut).toBe('Ctrl+Shift+K');
    expect(rows[3].shortcut).toBe('Ctrl+Shift+U');
  });

  it('populates the shortcut list in the popup', () => {
    const container = document.getElementById('shortcut-list');

    populateShortcutList(container, [
      { name: COMMAND_ARCHIVE, shortcut: 'Ctrl+Shift+Y' },
      { name: COMMAND_TRASH, shortcut: 'Ctrl+Shift+D' },
      { name: COMMAND_MARK_READ, shortcut: 'Ctrl+Shift+K' },
      { name: COMMAND_MARK_UNREAD, shortcut: 'Ctrl+Shift+U' }
    ]);

    const items = container.querySelectorAll('.shortcut-item');

    expect(items).toHaveLength(4);
    expect(items[0].querySelector('.shortcut-item__label').textContent)
      .toBe('Archive conversation');
    expect(items[1].querySelector('.shortcut-item__label').textContent)
      .toBe('Trash conversation');
    expect(items[2].querySelector('.shortcut-item__label').textContent)
      .toBe('Mark conversation as read');
    expect(items[3].querySelector('.shortcut-item__label').textContent)
      .toBe('Mark conversation as unread');
    expectLucideShortcutIcon(items[0], COMMAND_ARCHIVE);
    expectLucideShortcutIcon(items[1], COMMAND_TRASH);
    expectLucideShortcutIcon(items[2], COMMAND_MARK_READ);
    expectLucideShortcutIcon(items[3], COMMAND_MARK_UNREAD);
  });
});
