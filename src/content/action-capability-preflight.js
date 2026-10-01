import {
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE
} from './adapters/capability-states.js';
import { assessPageCapabilities } from './adapters/page-adapter.js';
import { MENU_CAPABILITY_IDS, MENU_TEXT } from './adapters/menu-adapter.js';

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

export function assessRowActionCapability(documentRoot, action, selectors) {
  const capabilities = assessPageCapabilities(documentRoot, selectors);
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

  if (trashConfirm.state === CAPABILITY_UNAVAILABLE && isTrashConfirmDialogOpen(documentRoot)) {
    const primaryMatches = documentRoot.querySelectorAll(selectors.trashConfirmButton);
    const hasFallback = Boolean(findTrashConfirmFallbackControl(documentRoot));

    if (primaryMatches.length === 0 && !hasFallback) {
      return createBlockedResult(
        MENU_CAPABILITY_IDS.trashConfirm,
        trashConfirm.state,
        trashConfirm.reason
      );
    }
  }

  return { allowed: true };
}
