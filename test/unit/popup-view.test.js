import { beforeEach, describe, expect, it } from 'vitest';
import {
  getExtensionVersion,
  getShortcutStatus,
  populateShortcutList,
  renderExtensionVersion,
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
    document.body.innerHTML = `
      <p id="extension-version" class="popup__version" hidden></p>
      <ul id="shortcut-list"></ul>
    `;
  });

  it('renders the extension version from the manifest', () => {
    renderExtensionVersion(document, {
      runtime: {
        getManifest: () => ({ version: '1.8.0' })
      }
    });

    const versionElement = document.getElementById('extension-version');

    expect(getExtensionVersion({
      runtime: {
        getManifest: () => ({ version: '1.8.0' })
      }
    })).toBe('1.8.0');
    expect(versionElement.hidden).toBe(false);
    expect(versionElement.textContent).toBe('Version 1.8.0');
  });

  it('leaves the version hidden when manifest metadata is unavailable', () => {
    renderExtensionVersion(document, {});

    expect(document.getElementById('extension-version').hidden).toBe(true);
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

  it('marks pill-only actions without keyboard shortcuts', () => {
    expect(getShortcutStatus('', { pillOnly: true })).toEqual({
      label: 'Row pill only',
      className: 'shortcut-status shortcut-status--pill-only'
    });
  });

  it('renders approved row action shortcut rows', () => {
    const rows = renderShortcutRows([
      { name: COMMAND_ARCHIVE, shortcut: 'Ctrl+Shift+Y' },
      { name: COMMAND_TRASH, shortcut: '' },
      { name: COMMAND_MARK_READ, shortcut: 'Ctrl+Shift+K' },
      { name: COMMAND_MARK_UNREAD, shortcut: 'Ctrl+Shift+U' }
    ]);

    expect(rows).toHaveLength(7);
    expect(rows[0].shortcut).toBe('Ctrl+Shift+Y');
    expect(rows[1].shortcut).toBe('Not assigned');
    expect(rows[2].shortcut).toBe('Ctrl+Shift+K');
    expect(rows[3].shortcut).toBe('Ctrl+Shift+U');
    expect(rows[4].shortcut).toBe('Row pill only');
    expect(rows[5].shortcut).toBe('Row pill only');
    expect(rows[6].shortcut).toBe('Row pill only');
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

    expect(items).toHaveLength(7);
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
    expect(items[4].querySelector('.shortcut-item__label').textContent)
      .toBe('Mute conversation');
    expect(items[4].querySelector('.shortcut-status').textContent)
      .toBe('Row pill only');
    expect(items[5].querySelector('.shortcut-item__label').textContent)
      .toBe('Unmute conversation');
    expect(items[5].querySelector('.shortcut-status').textContent)
      .toBe('Row pill only');
    expect(items[6].querySelector('.shortcut-item__label').textContent)
      .toBe('Unarchive conversation');
    expect(items[6].querySelector('.shortcut-status').textContent)
      .toBe('Row pill only');
  });
});
