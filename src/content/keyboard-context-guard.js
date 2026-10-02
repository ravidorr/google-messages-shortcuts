const EDITABLE_SELECTOR = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"])',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[contenteditable=""]'
].join(', ');

export function isEditableTarget(element) {
  if (!element?.closest) {
    return false;
  }

  return Boolean(element.closest(EDITABLE_SELECTOR));
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
  return Boolean(documentRoot.querySelector('mat-dialog-container'));
}

export function createKeyboardContext(event, documentRoot = document) {
  return {
    event,
    documentRoot,
    target: event.target,
    isEditable: isEditableTarget(event.target),
    isImeComposing: isImeComposing(event),
    hasTextSelection: hasNonCollapsibleTextSelection(documentRoot.defaultView),
    isRepeated: isRepeatedKeyEvent(event),
    nativeDialogOpen: isNativeDialogOpen(documentRoot)
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

  return false;
}
