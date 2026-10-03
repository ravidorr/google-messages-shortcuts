import { isRowMenuOpen } from './menu-action-overlay.js';

const EDITABLE_SELECTOR = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"])',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[contenteditable=""]',
  '[contenteditable="plaintext-only"]',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]'
].join(', ');

const NATIVE_DIALOG_SELECTORS = [
  'mat-dialog-container',
  '[role="dialog"]',
  '[aria-modal="true"]'
];

export const COMPOSER_CONTAINER_SELECTOR = 'mws-message-input';

function isEditableElement(element) {
  if (!element?.closest) {
    return false;
  }

  if (element.closest(EDITABLE_SELECTOR)) {
    return true;
  }

  return element.matches?.(COMPOSER_CONTAINER_SELECTOR)
    || element.closest(COMPOSER_CONTAINER_SELECTOR) !== null;
}

export function isElementVisible(element) {
  if (!element || element.closest('[hidden]')) {
    return false;
  }

  const view = element.ownerDocument?.defaultView;

  if (view && typeof view.getComputedStyle === 'function') {
    let current = element;

    while (current && current.nodeType === 1) {
      const style = view.getComputedStyle(current);

      if (style.visibility === 'hidden' || style.display === 'none') {
        return false;
      }

      current = current.parentElement;
    }
  }

  return true;
}

export function isEditableTarget(element, documentRoot = document) {
  const candidates = [element, documentRoot.activeElement].filter(Boolean);

  return candidates.some((candidate) => isEditableElement(candidate));
}

export function isImeComposing(event) {
  return event.isComposing === true || event.keyCode === 229;
}

export function hasNonCollapsibleTextSelection(windowObj = window) {
  const selection = windowObj.getSelection?.();

  if (!selection || selection.isCollapsed) {
    return false;
  }

  return selection.toString().length > 0;
}

export function isRepeatedKeyEvent(event) {
  return event.repeat === true;
}

export function isNativeDialogOpen(documentRoot = document) {
  return NATIVE_DIALOG_SELECTORS.some((selector) =>
    [...documentRoot.querySelectorAll(selector)].some(isElementVisible)
  );
}

export function createKeyboardContext(event, documentRoot = document) {
  return {
    event,
    documentRoot,
    target: event.target,
    isEditable: isEditableTarget(event.target, documentRoot),
    isImeComposing: isImeComposing(event),
    hasTextSelection: hasNonCollapsibleTextSelection(documentRoot.defaultView),
    isRepeated: isRepeatedKeyEvent(event),
    nativeDialogOpen: isNativeDialogOpen(documentRoot),
    rowMenuOpen: isRowMenuOpen(documentRoot)
  };
}

export function shouldIgnorePageCommand(context, { allowWithTextSelection = false } = {}) {
  if (context.isEditable) {
    return true;
  }

  if (context.isImeComposing) {
    return true;
  }

  if (context.isRepeated) {
    return true;
  }

  if (context.hasTextSelection && !allowWithTextSelection) {
    return true;
  }

  if (context.nativeDialogOpen) {
    return true;
  }

  if (context.rowMenuOpen) {
    return true;
  }

  return false;
}
