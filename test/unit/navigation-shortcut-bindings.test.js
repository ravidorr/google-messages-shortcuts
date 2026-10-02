import { describe, expect, it } from 'vitest';
import {
  getOpenArchivedShortcutLabel,
  isEditableTarget,
  matchesOpenArchivedShortcut,
  OPEN_ARCHIVED_SHORTCUT_LABEL,
  OPEN_ARCHIVED_SHORTCUT_LABEL_MAC
} from '../../src/shared/navigation-shortcut-bindings.js';

describe('navigation-shortcut-bindings', () => {
  it('returns platform-specific shortcut labels', () => {
    expect(getOpenArchivedShortcutLabel('MacIntel')).toBe(OPEN_ARCHIVED_SHORTCUT_LABEL_MAC);
    expect(getOpenArchivedShortcutLabel('Win32')).toBe(OPEN_ARCHIVED_SHORTCUT_LABEL);
  });

  it('matches the open archived shortcut on Windows and macOS', () => {
    expect(matchesOpenArchivedShortcut({
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      metaKey: false,
      altKey: false,
      repeat: false
    }, 'Win32')).toBe(true);

    expect(matchesOpenArchivedShortcut({
      key: 'a',
      ctrlKey: false,
      shiftKey: true,
      metaKey: true,
      altKey: false,
      repeat: false
    }, 'MacIntel')).toBe(true);
  });

  it('detects editable targets', () => {
    document.body.innerHTML = `
      <input id="input">
      <textarea id="textarea"></textarea>
      <div id="editable" contenteditable="true"></div>
      <button id="button">Send</button>
    `;

    expect(isEditableTarget(document.getElementById('input'))).toBe(true);
    expect(isEditableTarget(document.getElementById('textarea'))).toBe(true);
    expect(isEditableTarget(document.getElementById('editable'))).toBe(true);
    expect(isEditableTarget(document.getElementById('button'))).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
  });

  it('ignores repeated or modified shortcut chords', () => {
    expect(matchesOpenArchivedShortcut({
      key: 'a',
      ctrlKey: true,
      shiftKey: true,
      metaKey: false,
      altKey: true,
      repeat: false
    })).toBe(false);
    expect(matchesOpenArchivedShortcut({
      key: 'b',
      ctrlKey: true,
      shiftKey: true,
      metaKey: false,
      altKey: false,
      repeat: false
    })).toBe(false);
  });
});
