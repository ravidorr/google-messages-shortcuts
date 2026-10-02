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

  it('ignores page commands in editable, IME, repeated, selection, and dialog contexts', () => {
    const editableContext = {
      isEditable: true,
      isImeComposing: false,
      isRepeated: false,
      hasTextSelection: false,
      nativeDialogOpen: false
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
      nativeDialogOpen: false
    })).toBe(false);
  });
});
