import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE,
  createCapabilityResult
} from './capability-states.js';

export const SPAM_BLOCKED_SELECTORS = {
  drawerTrigger: 'button[aria-label="Main menu"]',
  drawer: 'mws-navigation-drawer, mws-drawer, nav, aside',
  drawerEntry: 'button',
  dialog: 'mat-dialog-container',
  heading: 'h1, h2, h3, [role="heading"]'
};

export const SPAM_BLOCKED_TEXT = 'Spam & blocked';

export const SPAM_BLOCKED_CAPABILITY_IDS = {
  entry: 'spamBlocked.entry'
};

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function matchesSpamBlockedText(element) {
  return normalizeText(element?.textContent) === SPAM_BLOCKED_TEXT
    || normalizeText(element?.getAttribute?.('aria-label')) === SPAM_BLOCKED_TEXT;
}

function isVisibleAndEnabled(element) {
  if (!element || element.closest('[hidden]') || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  if (element.hasAttribute('disabled') || element.getAttribute('aria-disabled') === 'true') {
    return false;
  }

  const style = element.ownerDocument?.defaultView?.getComputedStyle?.(element);

  return style?.display !== 'none' && style?.visibility !== 'hidden';
}

export function findSpamBlockedDrawerEntries(
  documentRoot,
  selectors = SPAM_BLOCKED_SELECTORS
) {
  return [...documentRoot.querySelectorAll(selectors.drawer)]
    .flatMap((drawer) => [...drawer.querySelectorAll(selectors.drawerEntry)])
    .filter((element) => !element.closest(selectors.dialog))
    .filter(isVisibleAndEnabled)
    .filter(matchesSpamBlockedText);
}

export function getSpamBlockedDialog(documentRoot, selectors = SPAM_BLOCKED_SELECTORS) {
  const dialogs = [...documentRoot.querySelectorAll(selectors.dialog)].filter((dialog) => (
    [...dialog.querySelectorAll(selectors.heading)].filter(matchesSpamBlockedText).length === 1
  ));

  return dialogs.length === 1 ? dialogs[0] : null;
}

export function isSpamBlockedDialogOpen(documentRoot, selectors = SPAM_BLOCKED_SELECTORS) {
  return Boolean(getSpamBlockedDialog(documentRoot, selectors));
}

export function assessSpamBlockedCapabilities(
  documentRoot,
  selectors = SPAM_BLOCKED_SELECTORS
) {
  const entries = findSpamBlockedDrawerEntries(documentRoot, selectors);

  if (entries.length === 0) {
    return {
      [SPAM_BLOCKED_CAPABILITY_IDS.entry]: createCapabilityResult(
        CAPABILITY_UNAVAILABLE,
        'Spam & blocked entry is not visible in the navigation drawer.',
        'dom-query'
      )
    };
  }

  if (entries.length > 1) {
    return {
      [SPAM_BLOCKED_CAPABILITY_IDS.entry]: createCapabilityResult(
        CAPABILITY_UNSAFE,
        'Multiple Spam & blocked drawer entries match the English fallback.',
        'dom-query'
      )
    };
  }

  return {
    [SPAM_BLOCKED_CAPABILITY_IDS.entry]: createCapabilityResult(
      CAPABILITY_SUPPORTED,
      'One visible Spam & blocked drawer entry is present.',
      'dom-query-fallback'
    )
  };
}

function delay(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function openSpamBlocked(
  documentRoot,
  selectors = SPAM_BLOCKED_SELECTORS,
  options = {}
) {
  const timeoutMs = options.timeoutMs ?? 2000;
  const delayFn = options.delayFn ?? delay;

  if (isSpamBlockedDialogOpen(documentRoot, selectors)) {
    return { ok: true, alreadyOpen: true };
  }

  const drawerTriggers = [...documentRoot.querySelectorAll(selectors.drawerTrigger)]
    .filter(isVisibleAndEnabled);

  if (drawerTriggers.length === 0) {
    return { ok: false, reason: 'spam-blocked-drawer-trigger-not-found' };
  }

  if (drawerTriggers.length > 1) {
    return { ok: false, reason: 'spam-blocked-drawer-trigger-ambiguous' };
  }

  drawerTriggers[0].click();

  const attempts = Math.max(1, Math.ceil(timeoutMs / 100));
  let entries = [];

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    entries = findSpamBlockedDrawerEntries(documentRoot, selectors);

    if (entries.length > 0) {
      break;
    }

    await delayFn(100);
  }

  if (entries.length === 0) {
    return { ok: false, reason: 'spam-blocked-entry-not-found' };
  }

  if (entries.length > 1) {
    return { ok: false, reason: 'spam-blocked-entry-ambiguous' };
  }

  entries[0].click();

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (isSpamBlockedDialogOpen(documentRoot, selectors)) {
      return { ok: true };
    }

    await delayFn(100);
  }

  return { ok: false, reason: 'spam-blocked-dialog-timeout' };
}
