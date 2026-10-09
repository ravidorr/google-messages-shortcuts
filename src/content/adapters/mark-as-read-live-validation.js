import { COMMAND_MARK_READ } from '../../shared/commands.js';
import { isMarkAsReadDebugValidationEnabled } from '../../shared/mark-as-read-debug-preference.js';
import { isConversationRead } from '../conversation-read-state.js';
import { runCapabilitySelfTest } from './capability-self-test.js';
import { runConversationAction } from '../conversation-action.js';
import { SELECTORS } from '../google-messages-dom.js';

export const MARK_READ_PILL_SELECTOR = `[data-messages-shortcuts-pill][data-command="${COMMAND_MARK_READ}"]`;
export const ROW_HOVER_CHECK_SLEEP_MS = 600;

const DEBUG_DISABLED_MESSAGE = 'Enable chrome.storage.local enableMarkAsReadLiveValidation from the extension service worker console before running destructive mark-as-read validation.';
const MANUAL_FOLLOW_UP = 'Synthetic hover may not match real pointer hover. Confirm pill clicks and keyboard shortcuts manually when needed.';

function defaultSleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getUnreadConversationRows(documentRoot, selectors = SELECTORS) {
  return [...documentRoot.querySelectorAll(selectors.conversationRow)]
    .filter((row) => row.querySelector(selectors.unreadConversationMarker));
}

export function narrowSelfTestForValidation(selfTest) {
  const listConversationLink = selfTest.capabilities?.find(
    (entry) => entry.capabilityId === 'list.conversationLink'
  );

  return {
    ok: selfTest.ok,
    mutated: selfTest.mutated,
    summary: selfTest.summary,
    listConversationLink
  };
}

export function dispatchRowPointerOver(row) {
  row.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
}

export function findConflictingHoveredConversationRow(
  documentRoot,
  targetRow,
  selectors = SELECTORS
) {
  const hoveredRow = documentRoot.querySelector(selectors.hoveredConversationItem);

  if (!hoveredRow || hoveredRow === targetRow) {
    return null;
  }

  return hoveredRow;
}

export async function inspectRowHoverState(
  row,
  documentRoot,
  {
    unreadSelector = SELECTORS.unreadConversationMarker,
    markReadPillSelector = MARK_READ_PILL_SELECTOR,
    sleep = defaultSleep,
    dispatchPointerOver = dispatchRowPointerOver,
    hoverSleepMs = ROW_HOVER_CHECK_SLEEP_MS
  } = {}
) {
  const urlBeforeHover = documentRoot.defaultView?.location?.href ?? '';

  dispatchPointerOver(row);
  await sleep(hoverSleepMs);

  return {
    unreadMarkerPersists: Boolean(row.querySelector(unreadSelector)),
    pillGroupPresent: Boolean(row.querySelector('[data-messages-shortcuts-pill-group]')),
    markReadPillPresent: Boolean(row.querySelector(markReadPillSelector)),
    urlUnchanged: (documentRoot.defaultView?.location?.href ?? '') === urlBeforeHover
  };
}

function hoverChecksPassed(hoverCheck) {
  return hoverCheck.unreadMarkerPersists
    && hoverCheck.markReadPillPresent
    && hoverCheck.urlUnchanged;
}

function markReadValidationSucceeded(result, targetRow, selectors = SELECTORS) {
  if (!result?.ok || result.readStatePending) {
    return false;
  }

  return isConversationRead(targetRow, selectors);
}

export async function runMarkAsReadLiveValidation(
  documentRoot = document,
  {
    chromeApi = globalThis.chrome,
    selectors = SELECTORS,
    runSelfTest = runCapabilitySelfTest,
    runRowAction = runConversationAction,
    isDebugEnabled = () => isMarkAsReadDebugValidationEnabled(chromeApi),
    sleep = defaultSleep,
    dispatchPointerOver = dispatchRowPointerOver,
    hoverSleepMs = ROW_HOVER_CHECK_SLEEP_MS
  } = {}
) {
  if (!(await isDebugEnabled())) {
    return {
      ok: false,
      error: 'debug-validation-disabled',
      message: DEBUG_DISABLED_MESSAGE
    };
  }

  const selfTest = runSelfTest(documentRoot, undefined, chromeApi);
  const narrowedSelfTest = narrowSelfTestForValidation(selfTest);
  const unreadRowsBefore = getUnreadConversationRows(documentRoot, selectors);

  if (unreadRowsBefore.length === 0) {
    return {
      ok: false,
      error: 'no-unread-rows',
      selfTest: narrowedSelfTest
    };
  }

  if (unreadRowsBefore.length < 2) {
    return {
      ok: false,
      error: 'insufficient-unread-rows',
      message: 'Need at least two unread conversations for hover checks and destructive mark-as-read validation.',
      unreadRowsAvailableInitially: unreadRowsBefore.length,
      selfTest: narrowedSelfTest
    };
  }

  const hoverInspectOptions = {
    sleep,
    dispatchPointerOver,
    hoverSleepMs,
    unreadSelector: selectors.unreadConversationMarker
  };
  const hoverCheck = await inspectRowHoverState(
    unreadRowsBefore[0],
    documentRoot,
    hoverInspectOptions
  );
  const secondRowHoverCheck = await inspectRowHoverState(
    unreadRowsBefore[1],
    documentRoot,
    hoverInspectOptions
  );

  const pillTargetRow = unreadRowsBefore[0];
  const pillResult = await runRowAction(
    documentRoot,
    COMMAND_MARK_READ,
    selectors,
    pillTargetRow
  );

  const shortcutTargetRow = unreadRowsBefore[1];

  if (!shortcutTargetRow.querySelector(selectors.unreadConversationMarker)) {
    return {
      ok: false,
      error: 'shortcut-target-not-unread',
      environment: selfTest.environment,
      selfTest: narrowedSelfTest,
      hoverCheck,
      secondRowHoverCheck,
      unreadRowsAvailableInitially: unreadRowsBefore.length,
      pillResult,
      shortcutResult: {
        ok: false,
        reason: 'shortcut-target-not-unread'
      },
      manualFollowUp: MANUAL_FOLLOW_UP
    };
  }

  const conflictingHoverRow = findConflictingHoveredConversationRow(
    documentRoot,
    shortcutTargetRow,
    selectors
  );

  if (conflictingHoverRow) {
    return {
      ok: false,
      error: 'conflicting-hover-target',
      environment: selfTest.environment,
      selfTest: narrowedSelfTest,
      hoverCheck,
      secondRowHoverCheck,
      unreadRowsAvailableInitially: unreadRowsBefore.length,
      pillResult,
      shortcutResult: {
        ok: false,
        reason: 'conflicting-hover-target'
      },
      manualFollowUp: MANUAL_FOLLOW_UP
    };
  }

  const shortcutResult = await runRowAction(
    documentRoot,
    COMMAND_MARK_READ,
    selectors,
    shortcutTargetRow
  );

  const allPassed = selfTest.ok
    && hoverChecksPassed(hoverCheck)
    && hoverChecksPassed(secondRowHoverCheck)
    && markReadValidationSucceeded(pillResult, pillTargetRow, selectors)
    && markReadValidationSucceeded(shortcutResult, shortcutTargetRow, selectors);

  return {
    ok: allPassed,
    environment: selfTest.environment,
    selfTest: narrowedSelfTest,
    hoverCheck,
    secondRowHoverCheck,
    unreadRowsAvailableInitially: unreadRowsBefore.length,
    pillResult,
    shortcutResult,
    manualFollowUp: MANUAL_FOLLOW_UP
  };
}
