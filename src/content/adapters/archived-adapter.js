import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE,
  createCapabilityResult
} from './capability-states.js';
import { START_CHAT_SELECTORS } from './start-chat-adapter.js';

export const ARCHIVED_SELECTORS = {
  ...START_CHAT_SELECTORS,
  archivedModalEntryControl:
    'button[data-e2e-archived-list-button], a[data-e2e-archived-list-button]',
  archivedRouteControl: 'button[data-e2e-archived-button], a[data-e2e-archived-button]',
  archivedEntryControl:
    'button[data-e2e-archived-button], a[data-e2e-archived-button], button[data-e2e-archived-list-button]',
  archivedDialog: 'mat-dialog-container',
  unarchiveButton: 'button[data-e2e-unarchive-button]',
  archivedRow: 'mws-conversation-list-item',
  bottomNavigation:
    'mws-bottom-navigation, mws-bottom-nav, [data-e2e-bottom-navigation]',
  searchInput:
    'input[type="search"], input[type="text"], [data-e2e-search-input], mws-search input, input[aria-label*="Search" i], input[placeholder*="Search" i]',
  searchRegion:
    'mws-search, mws-conversations-list-header, mws-conversation-list-header, [class*="search"]',
  searchOverflowTrigger:
    'button[aria-haspopup="menu"], button.menu-button, button[aria-label*="More" i], button[aria-label*="more" i], button[mattooltip*="More" i], button[data-e2e-search-overflow-button]',
  appShellRegion:
    'header, [role="banner"], mws-app-bar, mws-top-app-bar, mws-conversations-list-header, mws-conversation-list-header',
  appOverflowTrigger:
    'button[data-e2e-app-menu-button], button[data-e2e-overflow-button], button[data-e2e-header-overflow-button], button[data-e2e-navigation-button], button[data-e2e-drawer-button], button[aria-label*="Menu" i], button[aria-label*="Navigation" i], button[aria-label*="Main menu" i], button[aria-label*="drawer" i], button[aria-haspopup="menu"], button.menu-button',
  accountMenuTrigger:
    'button[data-e2e-account-button], button[data-e2e-user-menu-button], button[data-e2e-profile-button], button[aria-label*="Account" i], button[aria-label*="Google Account" i], button[aria-label*="Profile" i]',
  archivedNavigationPanel:
    '.cdk-overlay-container, [role="menu"], mat-nav-list, mws-account-menu, mws-navigation-drawer, mws-drawer, aside, nav',
  archivedNavigationEntry:
    'button, a, [role="button"], [role="menuitem"], [role="link"], .mat-mdc-list-item, mat-list-item, .mat-mdc-list-item',
  archivedMenuItem: '.mat-mdc-menu-item, [role="menuitem"]',
  settingsButton: 'button[data-e2e-settings-button], a[data-e2e-settings-button]',
  settingsPanel:
    'mws-settings, [data-e2e-settings-panel], mws-settings-home, mat-nav-list, [class*="settings"]'
};

export const ARCHIVED_TEXT = {
  archived: 'Archived',
  unarchive: 'Unarchive',
  archivedLabels: [
    'Archived',
    'ארכיון',
    'Archivados',
    'Archivées',
    'Archiviert',
    'Arquivadas',
    'Archiviate'
  ]
};

const ARCHIVED_OVERFLOW_EXCLUDED_SCOPES = [
  'mws-conversation-list-item',
  'mat-dialog-container',
  '.conversation-actions-menu',
  '[data-messages-shortcuts-archived-fab]',
  '[data-messages-shortcuts-archived-fab-wrap]',
  '[data-messages-shortcuts-fab-row]'
];

const EXTENSION_OWNED_ARCHIVED_FAB_SELECTOR = [
  '[data-messages-shortcuts-archived-fab]',
  '[data-messages-shortcuts-archived-fab-wrap]',
  '[data-messages-shortcuts-fab-row]'
].join(', ');

export const ARCHIVED_CAPABILITY_IDS = {
  entry: 'archived.entry',
  modalOpen: 'archived.modalOpen',
  unarchive: 'archived.unarchive'
};

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isArchiveActionLabel(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return false;
  }

  if (/^archived\b/i.test(normalized)) {
    return false;
  }

  return /^archive\b/i.test(normalized);
}

export function matchesArchivedLabel(element) {
  if (!element) {
    return false;
  }

  const text = normalizeText(element.textContent || '');
  const ariaLabel = normalizeText(element.getAttribute?.('aria-label') || '');

  if (isArchiveActionLabel(text) || isArchiveActionLabel(ariaLabel)) {
    return false;
  }

  return ARCHIVED_TEXT.archivedLabels.some(
    (label) => text === label || ariaLabel === label
  );
}

function getArchivedLabelFallbackScopes(documentRoot, selectors = ARCHIVED_SELECTORS) {
  const scopes = new Set();

  for (const selector of [
    selectors.archivedNavigationPanel,
    selectors.bottomNavigation,
    selectors.settingsPanel
  ]) {
    for (const element of documentRoot.querySelectorAll(selector)) {
      scopes.add(element);
    }
  }

  return [...scopes];
}

export function isAppOverflowMenuTrigger(trigger) {
  if (!trigger?.matches) {
    return false;
  }

  if (trigger.matches(
    'button[data-e2e-app-menu-button], button[data-e2e-overflow-button], button[data-e2e-header-overflow-button], button[data-e2e-navigation-button], button[data-e2e-drawer-button]'
  )) {
    return true;
  }

  if (trigger.matches('button[aria-haspopup="menu"], button.menu-button')) {
    return true;
  }

  const ariaLabel = normalizeText(trigger.getAttribute('aria-label') || '');

  return /menu|navigation|main menu|drawer/i.test(ariaLabel);
}

function isExcludedArchivedOverflowScope(element) {
  return ARCHIVED_OVERFLOW_EXCLUDED_SCOPES.some((selector) => element.closest(selector));
}

export function isExcludedArchivedEntryCandidate(element, selectors = ARCHIVED_SELECTORS) {
  if (!element || isExtensionOwnedArchivedControl(element)) {
    return true;
  }

  if (isInsideArchivedDialog(element, selectors)) {
    return true;
  }

  if (element.closest('mws-conversation-list-item, .conversation-actions-menu')) {
    return true;
  }

  if (
    element.closest('mws-conversations-list, mws-conversation-list')
    && !element.closest(
      '.cdk-overlay-container, mws-account-menu, mws-navigation-drawer, mws-drawer, mat-nav-list'
    )
  ) {
    return true;
  }

  return element.matches('h1, h2, h3, h4, [role="heading"]');
}

function isExtensionOwnedArchivedControl(element) {
  return Boolean(
    element?.matches?.(EXTENSION_OWNED_ARCHIVED_FAB_SELECTOR)
    || element?.closest?.(EXTENSION_OWNED_ARCHIVED_FAB_SELECTOR)
  );
}

function querySelectedControl(documentRoot, selectorList) {
  for (const selector of selectorList.split(',')) {
    const trimmed = selector.trim();
    const match = documentRoot.querySelector(
      `${trimmed}[aria-selected="true"], ${trimmed}[aria-current="page"]`
    );

    if (match) {
      return match;
    }
  }

  return null;
}

function isInsideArchivedDialog(element, selectors = ARCHIVED_SELECTORS) {
  return Boolean(element?.closest(selectors.archivedDialog));
}

export function isArchivedRouteNavigationControl(
  element,
  _documentRoot = document,
  selectors = ARCHIVED_SELECTORS
) {
  if (!element || isInsideArchivedDialog(element, selectors)) {
    return false;
  }

  if (element.matches(selectors.archivedModalEntryControl)) {
    return false;
  }

  if (element.matches(selectors.archivedRouteControl)) {
    return true;
  }

  const bottomNavigation = element.closest(selectors.bottomNavigation);

  if (
    bottomNavigation
    && matchesArchivedLabel(element)
  ) {
    return true;
  }

  return false;
}

export function isArchivedSidebarViewActive(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  if (isArchivedDialogShellVisible(documentRoot, selectors)) {
    return false;
  }

  const selectedRoute = querySelectedControl(documentRoot, selectors.archivedRouteControl);

  if (selectedRoute && isArchivedRouteNavigationControl(selectedRoute, documentRoot, selectors)) {
    return true;
  }

  const mainPanel = documentRoot.querySelector('main') || documentRoot.body;
  const hasArchivedHeading = [...mainPanel.querySelectorAll('h1, h2, h3, [role="heading"]')]
    .some((heading) => matchesArchivedLabel(heading));
  const hasConversationList = Boolean(
    mainPanel.querySelector(`${selectors.archivedRow}, mws-conversations-list`)
  );
  const hasStartChatFab = Boolean(mainPanel.querySelector(selectors.startChatFab));

  return hasArchivedHeading && hasConversationList && hasStartChatFab;
}

function dialogHasArchivedHeading(dialog) {
  return [...dialog.querySelectorAll('h1, h2, h3, [role="heading"]')]
    .some((heading) => matchesArchivedLabel(heading));
}

export function getArchivedDialogShell(documentRoot, selectors = ARCHIVED_SELECTORS) {
  for (const dialog of documentRoot.querySelectorAll(selectors.archivedDialog)) {
    if (dialog.querySelector(selectors.unarchiveButton) || dialogHasArchivedHeading(dialog)) {
      return dialog;
    }
  }

  return null;
}

export function isArchivedDialogShellVisible(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  return Boolean(getArchivedDialogShell(documentRoot, selectors));
}

export function getArchivedDialog(documentRoot, selectors = ARCHIVED_SELECTORS) {
  for (const dialog of documentRoot.querySelectorAll(selectors.archivedDialog)) {
    if (dialog.querySelector(selectors.unarchiveButton)) {
      return dialog;
    }
  }

  return null;
}

export function isArchivedModalOpen(documentRoot, selectors = ARCHIVED_SELECTORS) {
  return Boolean(getArchivedDialog(documentRoot, selectors));
}

export function resolveArchivedOpenResult(documentRoot, selectors = ARCHIVED_SELECTORS) {
  if (isArchivedDialogShellVisible(documentRoot, selectors)) {
    return { ok: true };
  }

  if (isArchivedSidebarViewActive(documentRoot, selectors)) {
    return {
      ok: true,
      reason: 'archived-sidebar-only',
      openedRoute: true
    };
  }

  return null;
}

export function finalizeArchivedOpenModalResult(documentRoot, selectors = ARCHIVED_SELECTORS) {
  const resolvedResult = resolveArchivedOpenResult(documentRoot, selectors);

  if (resolvedResult) {
    return resolvedResult;
  }

  return { ok: false, reason: 'archived-modal-timeout' };
}

let openArchivedModalInFlight = false;

export function resetOpenArchivedModalInFlightForTests() {
  openArchivedModalInFlight = false;
}

export function isTrashConfirmDialogOpen(documentRoot, selectors = ARCHIVED_SELECTORS) {
  for (const dialog of documentRoot.querySelectorAll(selectors.archivedDialog)) {
    if (dialog.querySelector('button[data-e2e-action-button-confirm]')) {
      return true;
    }
  }

  return false;
}

export function findArchivedModalEntryControl(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  for (const match of documentRoot.querySelectorAll(selectors.archivedModalEntryControl)) {
    if (
      !isInsideArchivedDialog(match, selectors)
      && !isExtensionOwnedArchivedControl(match)
    ) {
      return match;
    }
  }

  for (const match of documentRoot.querySelectorAll(selectors.archivedEntryControl)) {
    if (isInsideArchivedDialog(match, selectors)) {
      continue;
    }

    if (isExtensionOwnedArchivedControl(match)) {
      continue;
    }

    if (isArchivedRouteNavigationControl(match, documentRoot, selectors)) {
      continue;
    }

    return match;
  }

  for (const scope of getArchivedLabelFallbackScopes(documentRoot, selectors)) {
    for (const candidate of scope.querySelectorAll(
      'button, a, [role="button"], [role="menuitem"], [role="link"]'
    )) {
      if (isInsideArchivedDialog(candidate, selectors)) {
        continue;
      }

      if (isExtensionOwnedArchivedControl(candidate)) {
        continue;
      }

      if (isArchivedRouteNavigationControl(candidate, documentRoot, selectors)) {
        continue;
      }

      if (
        candidate.matches('[role="menuitem"], .mat-mdc-menu-item')
        || candidate.closest('[role="menu"]')
      ) {
        continue;
      }

      if (matchesArchivedLabel(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

export function findArchivedEntryControl(documentRoot, selectors = ARCHIVED_SELECTORS) {
  return findArchivedModalEntryControl(documentRoot, selectors);
}

function findSearchRegion(documentRoot, selectors = ARCHIVED_SELECTORS) {
  const searchInput = documentRoot.querySelector(selectors.searchInput);

  if (searchInput) {
    const matchedRegion = searchInput.closest(selectors.searchRegion);

    if (matchedRegion) {
      return matchedRegion;
    }

    return searchInput.parentElement?.parentElement ?? searchInput.parentElement;
  }

  return documentRoot.querySelector(selectors.searchRegion);
}

function findOverflowTriggerInScope(scope, selectors) {
  if (!scope) {
    return null;
  }

  for (const trigger of scope.querySelectorAll(selectors.searchOverflowTrigger)) {
    if (
      !isExcludedArchivedOverflowScope(trigger)
      && !isExtensionOwnedArchivedControl(trigger)
    ) {
      return trigger;
    }
  }

  return null;
}

export function findArchivedSearchOverflowTrigger(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  const searchRegion = findSearchRegion(documentRoot, selectors);

  if (!searchRegion) {
    return null;
  }

  return findOverflowTriggerInScope(searchRegion, selectors)
    ?? findOverflowTriggerInScope(searchRegion.parentElement, selectors)
    ?? null;
}

export function findArchivedAccountMenuTrigger(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  const regions = documentRoot.querySelectorAll(
    `${selectors.appShellRegion}, mw-app, mw-bootstrap, [role="banner"]`
  );

  for (const region of regions) {
    for (const trigger of region.querySelectorAll(selectors.accountMenuTrigger)) {
      if (
        !isExcludedArchivedOverflowScope(trigger)
        && !isExtensionOwnedArchivedControl(trigger)
      ) {
        return trigger;
      }
    }
  }

  for (const image of documentRoot.querySelectorAll(
    'header img, [role="banner"] img, mws-top-app-bar img'
  )) {
    const alt = normalizeText(image.getAttribute('alt') || '');

    if (!/account|profile|google/i.test(alt)) {
      continue;
    }

    const trigger = image.closest('button, a, [role="button"]');

    if (
      trigger
      && !isExcludedArchivedOverflowScope(trigger)
      && !isExtensionOwnedArchivedControl(trigger)
    ) {
      return trigger;
    }
  }

  return null;
}

export function findArchivedAppOverflowTrigger(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  for (const region of documentRoot.querySelectorAll(selectors.appShellRegion)) {
    for (const trigger of region.querySelectorAll(selectors.appOverflowTrigger)) {
      if (
        isAppOverflowMenuTrigger(trigger)
        && !isExcludedArchivedOverflowScope(trigger)
        && !isExtensionOwnedArchivedControl(trigger)
      ) {
        return trigger;
      }
    }
  }

  for (const trigger of documentRoot.querySelectorAll(selectors.appOverflowTrigger)) {
    if (
      !isAppOverflowMenuTrigger(trigger)
      || isExcludedArchivedOverflowScope(trigger)
      || isExtensionOwnedArchivedControl(trigger)
      || trigger.closest('mws-conversations-list, mws-conversation-list')
    ) {
      continue;
    }

    return trigger;
  }

  return null;
}

export function findArchivedRouteButton(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  for (const match of documentRoot.querySelectorAll(selectors.archivedRouteControl)) {
    if (isExtensionOwnedArchivedControl(match)) {
      continue;
    }

    if (isArchivedRouteNavigationControl(match, documentRoot, selectors)) {
      return match;
    }
  }

  return null;
}

export function findArchivedSettingsButton(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  for (const match of documentRoot.querySelectorAll(selectors.settingsButton)) {
    if (!isInsideArchivedDialog(match, selectors)) {
      return match;
    }
  }

  return null;
}

export function isSettingsViewActive(documentRoot, selectors = ARCHIVED_SELECTORS) {
  const selectedSettings = querySelectedControl(documentRoot, selectors.settingsButton);

  if (selectedSettings) {
    return true;
  }

  return Boolean(documentRoot.querySelector(selectors.settingsPanel));
}

export function findArchivedSettingsEntry(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  const settingsPanel = documentRoot.querySelector(selectors.settingsPanel);
  const scopes = settingsPanel ? [settingsPanel, documentRoot] : [documentRoot];

  for (const scope of scopes) {
    for (const candidate of scope.querySelectorAll(
      'button, a, [role="button"], [role="menuitem"], .mat-mdc-list-item, .mat-mdc-menu-item'
    )) {
      if (isInsideArchivedDialog(candidate, selectors)) {
        continue;
      }

      if (isExtensionOwnedArchivedControl(candidate)) {
        continue;
      }

      if (isArchivedRouteNavigationControl(candidate, documentRoot, selectors)) {
        continue;
      }

      if (
        candidate.matches('[role="menuitem"], .mat-mdc-menu-item')
        && candidate.closest('[role="menu"]')
      ) {
        continue;
      }

      if (matchesArchivedLabel(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

export function findArchivedNavigationEntry(
  documentRoot,
  selectors = ARCHIVED_SELECTORS
) {
  const modalEntry = findArchivedModalEntryControl(documentRoot, selectors);

  if (modalEntry) {
    return modalEntry;
  }

  const routeEntry = findArchivedRouteButton(documentRoot, selectors);

  if (routeEntry) {
    return routeEntry;
  }

  for (const menuItem of documentRoot.querySelectorAll(selectors.archivedMenuItem)) {
    if (
      !isExcludedArchivedEntryCandidate(menuItem, selectors)
      && matchesArchivedLabel(menuItem)
    ) {
      return menuItem;
    }
  }

  const scopes = [
    ...documentRoot.querySelectorAll(selectors.archivedNavigationPanel),
    documentRoot
  ];

  for (const scope of scopes) {
    for (const candidate of scope.querySelectorAll(selectors.archivedNavigationEntry)) {
      if (isExcludedArchivedEntryCandidate(candidate, selectors)) {
        continue;
      }

      if (matchesArchivedLabel(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

export function findArchivedMenuItem(documentRoot, selectors = ARCHIVED_SELECTORS) {
  return findArchivedNavigationEntry(documentRoot, selectors);
}

export function findUnarchiveButtonForRow(conversationRow, selectors = ARCHIVED_SELECTORS) {
  if (!conversationRow) {
    return null;
  }

  return conversationRow.querySelector(selectors.unarchiveButton);
}

export function isRowInArchivedModal(conversationRow, selectors = ARCHIVED_SELECTORS) {
  if (!conversationRow) {
    return false;
  }

  const dialog = conversationRow.closest(selectors.archivedDialog);

  if (!dialog || !dialog.querySelector(selectors.unarchiveButton)) {
    return false;
  }

  return Boolean(findUnarchiveButtonForRow(conversationRow, selectors));
}

export function findArchivedConversationRow(documentRoot, selectors = ARCHIVED_SELECTORS) {
  const dialog = getArchivedDialog(documentRoot, selectors);

  if (!dialog) {
    return null;
  }

  const hoveredRow = dialog.querySelector(`${selectors.archivedRow}:hover`);

  if (hoveredRow) {
    return hoveredRow;
  }

  const focusedRow = dialog.querySelector(`${selectors.archivedRow}[is-focused="true"]`);

  if (focusedRow) {
    return focusedRow;
  }

  const selectedLink = dialog.querySelector(`${selectors.archivedRow} a[aria-selected="true"]`);

  if (selectedLink) {
    return selectedLink.closest(selectors.archivedRow);
  }

  return null;
}

function getModalEntryMatches(documentRoot, selectors) {
  const matches = [];

  for (const match of documentRoot.querySelectorAll(selectors.archivedModalEntryControl)) {
    if (!isInsideArchivedDialog(match, selectors)) {
      matches.push(match);
    }
  }

  for (const match of documentRoot.querySelectorAll(selectors.archivedEntryControl)) {
    if (isInsideArchivedDialog(match, selectors)) {
      continue;
    }

    if (isArchivedRouteNavigationControl(match, documentRoot, selectors)) {
      continue;
    }

    if (!matches.includes(match)) {
      matches.push(match);
    }
  }

  return matches;
}

export function resolveArchivedEntryCapabilityReason({
  entryControl,
  accountMenuTrigger,
  overflowTrigger,
  appOverflowTrigger,
  settingsButton
}) {
  if (entryControl) {
    return 'Archived modal entry control is present in the document.';
  }

  if (accountMenuTrigger) {
    return 'Archived modal entry is available through the account menu.';
  }

  if (overflowTrigger) {
    return 'Archived modal entry is available through the search overflow menu.';
  }

  if (appOverflowTrigger) {
    return 'Archived modal entry is available through the app header menu.';
  }

  if (settingsButton) {
    return 'Archived modal entry is available through Settings.';
  }

  return 'Archived modal entry is available through the search overflow menu.';
}

function assessArchivedEntryCapability(documentRoot, selectors) {
  const entryControl = findArchivedModalEntryControl(documentRoot, selectors);
  const overflowTrigger = findArchivedSearchOverflowTrigger(documentRoot, selectors);
  const appOverflowTrigger = findArchivedAppOverflowTrigger(documentRoot, selectors);
  const accountMenuTrigger = findArchivedAccountMenuTrigger(documentRoot, selectors);
  const settingsButton = findArchivedSettingsButton(documentRoot, selectors);

  if (!entryControl && !overflowTrigger && !appOverflowTrigger && !accountMenuTrigger && !settingsButton) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'Archived modal entry control is not present in the document.',
      'contract'
    );
  }

  const matches = getModalEntryMatches(documentRoot, selectors);

  if (matches.length > 1) {
    return createCapabilityResult(
      CAPABILITY_UNSAFE,
      'Multiple archived modal entry controls match the primary selector.',
      'dom-query'
    );
  }

  const reason = resolveArchivedEntryCapabilityReason({
    entryControl,
    accountMenuTrigger,
    overflowTrigger,
    appOverflowTrigger,
    settingsButton
  });

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    reason,
    matches.length === 1 ? 'dom-query' : 'dom-query-fallback'
  );
}

function assessArchivedModalCapability(documentRoot, selectors) {
  if (!isArchivedModalOpen(documentRoot, selectors)) {
    return createCapabilityResult(
      CAPABILITY_UNAVAILABLE,
      'Archived modal is not open.',
      'dom-query'
    );
  }

  return createCapabilityResult(
    CAPABILITY_SUPPORTED,
    'Archived modal is open with unarchive controls.',
    'dom-query'
  );
}

function assessUnarchiveCapability(documentRoot, selectors) {
  return assessArchivedModalCapability(documentRoot, selectors);
}

export function assessArchivedCapabilities(documentRoot, selectors = ARCHIVED_SELECTORS) {
  return {
    [ARCHIVED_CAPABILITY_IDS.entry]: assessArchivedEntryCapability(documentRoot, selectors),
    [ARCHIVED_CAPABILITY_IDS.modalOpen]: assessArchivedModalCapability(documentRoot, selectors),
    [ARCHIVED_CAPABILITY_IDS.unarchive]: assessUnarchiveCapability(documentRoot, selectors)
  };
}

async function clickAndWaitForArchivedModal(
  entryControl,
  documentRoot,
  selectors,
  waitForSelectorFn,
  timeoutMs
) {
  entryControl.click();

  try {
    await waitForSelectorFn(documentRoot, selectors, timeoutMs);

    return true;
  } catch (_error) {
    return false;
  }
}

async function waitForArchivedNavigationEntry(
  documentRoot,
  selectors,
  delayFn,
  timeoutMs,
  pollIntervalMs = 100
) {
  const maxAttempts = Math.max(1, Math.ceil(timeoutMs / pollIntervalMs));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const navigationEntry = findArchivedNavigationEntry(documentRoot, selectors);

    if (navigationEntry) {
      return navigationEntry;
    }

    await delayFn(pollIntervalMs);
  }

  return null;
}

async function waitForArchivedSettingsEntry(
  documentRoot,
  selectors,
  delayFn,
  timeoutMs,
  pollIntervalMs = 100
) {
  const maxAttempts = Math.max(1, Math.ceil(timeoutMs / pollIntervalMs));

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const settingsEntry = findArchivedSettingsEntry(documentRoot, selectors);

    if (settingsEntry) {
      return settingsEntry;
    }

    await delayFn(pollIntervalMs);
  }

  return null;
}

async function openArchivedViaOverflowMenu(
  overflowTrigger,
  documentRoot,
  selectors,
  waitForSelectorFn,
  delayFn,
  timeoutMs
) {
  if (!overflowTrigger) {
    return { ok: false, reason: 'archived-entry-not-found' };
  }

  overflowTrigger.click();

  const navigationEntry = await waitForArchivedNavigationEntry(
    documentRoot,
    selectors,
    delayFn,
    Math.min(timeoutMs, 1000)
  );

  if (!navigationEntry) {
    return { ok: false, reason: 'archived-entry-not-found' };
  }

  const opened = await clickAndWaitForArchivedModal(
    navigationEntry,
    documentRoot,
    selectors,
    waitForSelectorFn,
    timeoutMs
  );

  if (opened) {
    return { ok: true };
  }

  const routeResult = await openArchivedViaRoute(documentRoot, selectors, delayFn);

  if (routeResult.ok) {
    return routeResult;
  }

  const resolvedResult = resolveArchivedOpenResult(documentRoot, selectors);

  if (resolvedResult) {
    return resolvedResult;
  }

  return { ok: false, reason: 'archived-modal-timeout' };
}

async function openArchivedViaSearchOverflow(
  documentRoot,
  selectors,
  waitForSelectorFn,
  delayFn,
  timeoutMs
) {
  return openArchivedViaOverflowMenu(
    findArchivedSearchOverflowTrigger(documentRoot, selectors),
    documentRoot,
    selectors,
    waitForSelectorFn,
    delayFn,
    timeoutMs
  );
}

async function openArchivedViaSettings(
  documentRoot,
  selectors,
  waitForSelectorFn,
  delayFn,
  timeoutMs
) {
  const settingsButton = findArchivedSettingsButton(documentRoot, selectors);

  if (!settingsButton) {
    return { ok: false, reason: 'archived-entry-not-found' };
  }

  if (!isSettingsViewActive(documentRoot, selectors)) {
    settingsButton.click();
  }

  const settingsEntry = await waitForArchivedSettingsEntry(
    documentRoot,
    selectors,
    delayFn,
    Math.min(timeoutMs, 500)
  );

  if (!settingsEntry) {
    return { ok: false, reason: 'archived-entry-not-found' };
  }

  const opened = await clickAndWaitForArchivedModal(
    settingsEntry,
    documentRoot,
    selectors,
    waitForSelectorFn,
    timeoutMs
  );

  if (opened) {
    return { ok: true };
  }

  const resolvedResult = resolveArchivedOpenResult(documentRoot, selectors);

  if (resolvedResult) {
    return resolvedResult;
  }

  return { ok: false, reason: 'archived-modal-timeout' };
}

async function openArchivedViaRoute(
  documentRoot,
  selectors,
  delayFn
) {
  const routeButton = findArchivedRouteButton(documentRoot, selectors);

  if (!routeButton) {
    return { ok: false, reason: 'archived-entry-not-found' };
  }

  routeButton.click();
  await delayFn(400);

  const resolvedResult = resolveArchivedOpenResult(documentRoot, selectors);

  if (resolvedResult) {
    return resolvedResult;
  }

  return { ok: false, reason: 'archived-modal-timeout' };
}

export async function openArchivedModal(
  documentRoot,
  selectors = ARCHIVED_SELECTORS,
  waitForSelectorFn = waitForArchivedModal,
  options = {}
) {
  if (openArchivedModalInFlight) {
    return { ok: false, reason: 'action-in-progress' };
  }

  openArchivedModalInFlight = true;

  try {
    return await openArchivedModalInternal(
      documentRoot,
      selectors,
      waitForSelectorFn,
      options
    );
  } finally {
    openArchivedModalInFlight = false;
  }
}

async function openArchivedModalInternal(
  documentRoot,
  selectors = ARCHIVED_SELECTORS,
  waitForSelectorFn = waitForArchivedModal,
  options = {}
) {
  const delayFn = options.delayFn ?? ((delayMs) => new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  }));
  const timeoutMs = options.timeoutMs ?? 5000;
  const modalWaitFn = (root, selectorConfig, waitTimeoutMs = timeoutMs) => (
    waitForSelectorFn(root, selectorConfig, waitTimeoutMs)
  );

  if (isArchivedDialogShellVisible(documentRoot, selectors)) {
    return { ok: true, alreadyOpen: true };
  }

  if (isArchivedSidebarViewActive(documentRoot, selectors)) {
    return { ok: true, alreadyOpen: true };
  }

  const directEntry = findArchivedModalEntryControl(documentRoot, selectors);

  if (
    directEntry
    && await clickAndWaitForArchivedModal(
      directEntry,
      documentRoot,
      selectors,
      modalWaitFn,
      timeoutMs
    )
  ) {
    return { ok: true };
  }

  if (directEntry) {
    const resolvedAfterDirectClick = resolveArchivedOpenResult(documentRoot, selectors);

    if (resolvedAfterDirectClick) {
      return resolvedAfterDirectClick;
    }
  }

  const routeResult = await openArchivedViaRoute(documentRoot, selectors, delayFn);

  if (routeResult.ok) {
    return routeResult;
  }

  const accountMenuResult = await openArchivedViaOverflowMenu(
    findArchivedAccountMenuTrigger(documentRoot, selectors),
    documentRoot,
    selectors,
    modalWaitFn,
    delayFn,
    timeoutMs
  );

  if (accountMenuResult.ok) {
    return accountMenuResult;
  }

  const searchOverflowResult = await openArchivedViaSearchOverflow(
    documentRoot,
    selectors,
    modalWaitFn,
    delayFn,
    timeoutMs
  );

  if (searchOverflowResult.ok) {
    return searchOverflowResult;
  }

  const searchOverflowTrigger = findArchivedSearchOverflowTrigger(documentRoot, selectors);
  const appOverflowTrigger = findArchivedAppOverflowTrigger(documentRoot, selectors);
  const appOverflowResult = appOverflowTrigger && appOverflowTrigger !== searchOverflowTrigger
    ? await openArchivedViaOverflowMenu(
      appOverflowTrigger,
      documentRoot,
      selectors,
      modalWaitFn,
      delayFn,
      timeoutMs
    )
    : { ok: false, reason: 'archived-entry-not-found' };

  if (appOverflowResult.ok) {
    return appOverflowResult;
  }

  const overflowResult = [
    accountMenuResult,
    searchOverflowResult,
    appOverflowResult
  ].find((result) => result.reason !== 'archived-entry-not-found')
    ?? accountMenuResult;

  const settingsResult = await openArchivedViaSettings(
    documentRoot,
    selectors,
    modalWaitFn,
    delayFn,
    timeoutMs
  );

  if (settingsResult.ok) {
    return settingsResult;
  }

  if (!directEntry) {
    if (settingsResult.reason === 'archived-entry-not-found') {
      return overflowResult.reason === 'archived-entry-not-found'
        ? routeResult
        : overflowResult;
    }

    return settingsResult;
  }

  return finalizeArchivedOpenModalResult(documentRoot, selectors);
}

export function waitForArchivedModal(
  documentRoot,
  selectors = ARCHIVED_SELECTORS,
  timeoutMs = 2000,
  pollIntervalMs = 100
) {
  const maxAttempts = Math.max(1, Math.ceil(timeoutMs / pollIntervalMs));
  let attempt = 0;

  return new Promise((resolve, reject) => {
    const poll = () => {
      const dialogShell = getArchivedDialogShell(documentRoot, selectors);

      if (dialogShell) {
        resolve(dialogShell);
        return;
      }

      attempt += 1;

      if (attempt >= maxAttempts) {
        reject(new Error('archived-modal-timeout'));
        return;
      }

      setTimeout(poll, pollIntervalMs);
    };

    poll();
  });
}
