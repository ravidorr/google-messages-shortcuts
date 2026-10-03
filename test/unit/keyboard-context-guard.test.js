import { beforeEach, describe, expect, it } from 'vitest';
import {
  createKeyboardContext,
  hasNonCollapsibleTextSelection,
  isEditableTarget,
  isImeComposing,
  isNativeDialogOpen,
  isRepeatedKeyEvent,
  shouldIgnorePageCommand
} from '../../src/content/keyboard-context-guard.js';

describe('keyboard-context-guard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('detects editable targets', () => {
    const input = document.createElement('input');
    document.body.append(input);

    expect(isEditableTarget(input)).toBe(true);
    expect(isEditableTarget(document.body)).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
    expect(isEditableTarget({})).toBe(false);
  });

  it('detects plaintext-only editors, textbox roles, and composer containers', () => {
    const plaintextEditor = document.createElement('div');
    plaintextEditor.setAttribute('contenteditable', 'plaintext-only');
    document.body.append(plaintextEditor);

    expect(isEditableTarget(plaintextEditor)).toBe(true);

    const textbox = document.createElement('div');
    textbox.setAttribute('role', 'textbox');
    document.body.append(textbox);

    expect(isEditableTarget(textbox)).toBe(true);

    const composerHost = document.createElement('mws-message-input');
    document.body.append(composerHost);

    expect(isEditableTarget(composerHost)).toBe(true);
  });

  it('uses the active element when the event target is retargeted', () => {
    document.body.innerHTML = `
      <div id="wrapper">
        <textarea aria-label="Message"></textarea>
      </div>
    `;
    const textarea = document.body.querySelector('textarea');
    textarea.focus();

    const event = {
      target: document.getElementById('wrapper'),
      isComposing: false,
      keyCode: 0,
      repeat: false
    };

    expect(createKeyboardContext(event, document).isEditable).toBe(true);
  });

  it('detects IME composition and repeated keys', () => {
    expect(isImeComposing({ isComposing: true, keyCode: 0 })).toBe(true);
    expect(isImeComposing({ isComposing: false, keyCode: 229 })).toBe(true);
    expect(isRepeatedKeyEvent({ repeat: true })).toBe(true);
  });

  it('detects non-collapsible text selection', () => {
    document.body.innerHTML = '<p>Selected text sample</p>';
    const paragraph = document.body.querySelector('p');
    const range = document.createRange();
    range.selectNodeContents(paragraph);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    expect(hasNonCollapsibleTextSelection(window)).toBe(true);
  });

  it('detects native dialogs and builds keyboard context', () => {
    document.body.innerHTML = '<mat-dialog-container></mat-dialog-container><input />';
    const input = document.body.querySelector('input');
    const event = { target: input, isComposing: false, keyCode: 0, repeat: false };
    const localThis = createKeyboardContext(event, document);

    expect(isNativeDialogOpen(document)).toBe(true);
    expect(localThis.isEditable).toBe(true);
    expect(localThis.nativeDialogOpen).toBe(true);
  });

  it('detects open row menus in keyboard context', () => {
    document.body.innerHTML = `
      <div role="menu" class="conversation-actions-menu mat-mdc-menu-panel"></div>
    `;
    const event = { target: document.body, isComposing: false, keyCode: 0, repeat: false };
    const localThis = createKeyboardContext(event, document);

    expect(localThis.rowMenuOpen).toBe(true);
    expect(shouldIgnorePageCommand(localThis)).toBe(true);
  });

  it('ignores page commands in editable, IME, repeated, selection, dialog, and row menu contexts', () => {
    const editableContext = {
      isEditable: true,
      isImeComposing: false,
      isRepeated: false,
      hasTextSelection: false,
      nativeDialogOpen: false,
      rowMenuOpen: false
    };

    expect(shouldIgnorePageCommand(editableContext)).toBe(true);
    expect(shouldIgnorePageCommand({
      ...editableContext,
      isEditable: false,
      isImeComposing: true
    })).toBe(true);
    expect(shouldIgnorePageCommand({
      ...editableContext,
      isEditable: false,
      isRepeated: true
    })).toBe(true);
    expect(shouldIgnorePageCommand({
      ...editableContext,
      isEditable: false,
      hasTextSelection: true
    })).toBe(true);
    expect(shouldIgnorePageCommand({
      ...editableContext,
      isEditable: false,
      nativeDialogOpen: true
    })).toBe(true);
    expect(shouldIgnorePageCommand({
      isEditable: false,
      isImeComposing: false,
      isRepeated: false,
      hasTextSelection: false,
      nativeDialogOpen: false,
      rowMenuOpen: true
    })).toBe(true);
    expect(shouldIgnorePageCommand({
      isEditable: false,
      isImeComposing: false,
      isRepeated: false,
      hasTextSelection: false,
      nativeDialogOpen: false,
      rowMenuOpen: false
    })).toBe(false);
  });
});
