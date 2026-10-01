import {
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE
} from './adapters/capability-states.js';
import { assessPageCapabilities } from './adapters/page-adapter.js';
import { MENU_CAPABILITY_IDS, MENU_TEXT } from './adapters/menu-adapter.js';
import { EXECUTION_KIND_OPEN_ROW } from './row-action-registry.js';
import { waitForElement, waitForSelector } from './wait-for-element.js';

function isBlockingCapabilityState(state) {
  return state === CAPABILITY_UNAVAILABLE || state === CAPABILITY_UNSAFE;
}

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function createBlockedResult(capabilityId, capabilityState, capabilityReason) {
  return {
    allowed: false,
    reason: 'capability-blocked',
    capabilityId,
    capabilityState,
    capabilityReason
  };
}

function isTrashConfirmDialogOpen(documentRoot) {
  return Boolean(documentRoot.querySelector('mat-dialog-container'));
}

export function findTrashConfirmFallbackControl(documentRoot) {
  const dialog = documentRoot.querySelector('mat-dialog-container');

  if (!dialog) {
    return null;
  }

  const candidates = dialog.querySelectorAll('button, .mat-focus-indicator');
  const expectedText = normalizeText(MENU_TEXT.trash);

  for (const candidate of candidates) {
    if (normalizeText(candidate.textContent || '') === expectedText) {
      return candidate;
    }
  }

  return null;
}

function hasTrashConfirmControl(documentRoot, selectors) {
  if (documentRoot.querySelector(selectors.trashConfirmButton)) {
    return true;
  }

  return Boolean(findTrashConfirmFallbackControl(documentRoot));
}

export function assessRowActionCapability(documentRoot, action, selectors) {
  const capabilities = assessPageCapabilities(documentRoot, selectors);

  if (action.executionKind === EXECUTION_KIND_OPEN_ROW) {
    const listCapability = capabilities.list[action.capabilityId];

    if (isBlockingCapabilityState(listCapability.state)) {
      return createBlockedResult(
        action.capabilityId,
        listCapability.state,
        listCapability.reason
      );
    }

    return { allowed: true };
  }

  const listTargeting = capabilities.list['list.targeting'];

  if (isBlockingCapabilityState(listTargeting.state)) {
    return createBlockedResult(
      'list.targeting',
      listTargeting.state,
      listTargeting.reason
    );
  }

  const menuCapability = capabilities.menu[action.capabilityId];

  if (isBlockingCapabilityState(menuCapability.state)) {
    return createBlockedResult(
      action.capabilityId,
      menuCapability.state,
      menuCapability.reason
    );
  }

  return { allowed: true };
}

export function assessTrashConfirmCapability(documentRoot, selectors) {
  const capabilities = assessPageCapabilities(documentRoot, selectors);
  const trashConfirm = capabilities.menu[MENU_CAPABILITY_IDS.trashConfirm];

  if (trashConfirm.state === CAPABILITY_UNSAFE) {
    return createBlockedResult(
      MENU_CAPABILITY_IDS.trashConfirm,
      trashConfirm.state,
      trashConfirm.reason
    );
  }

  return { allowed: true };
}

export async function assessTrashConfirmCapabilityAfterRender(
  documentRoot,
  selectors,
  timeout = 1000
) {
  const syncResult = assessTrashConfirmCapability(documentRoot, selectors);

  if (!syncResult.allowed) {
    return syncResult;
  }

  if (!isTrashConfirmDialogOpen(documentRoot)) {
    return { allowed: true };
  }

  if (hasTrashConfirmControl(documentRoot, selectors)) {
    return { allowed: true };
  }

  try {
    await waitForSelector(documentRoot, selectors.trashConfirmButton, timeout);

    return { allowed: true };
  } catch (_primaryError) {
    try {
      await waitForElement(
        documentRoot,
        'mat-dialog-container button, mat-dialog-container .mat-focus-indicator',
        MENU_TEXT.trash,
        timeout
      );

      return { allowed: true };
    } catch (_fallbackError) {
      if (isTrashConfirmDialogOpen(documentRoot) && !hasTrashConfirmControl(documentRoot, selectors)) {
        return createBlockedResult(
          MENU_CAPABILITY_IDS.trashConfirm,
          CAPABILITY_UNAVAILABLE,
          'Trash confirmation dialog is open but the confirm control was not found.'
        );
      }

      return { allowed: true };
    }
  }
}
