import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIST_HEADER_INPUT_TYPE, LIST_HEADER_TAG } from '../../src/content/adapters/list-header-dom.js';
import {
  assessArchivedCapabilities,
  ARCHIVED_CAPABILITY_IDS,
  ARCHIVED_SELECTORS,
  findArchivedConversationRow,
  findArchivedEntryControl,
  findArchivedMenuItem,
  findArchivedModalEntryControl,
  findArchivedListHeaderOverflowTrigger,
  findArchivedAccountMenuTrigger,
  findArchivedAppOverflowTrigger,
  isAppOverflowMenuTrigger,
  findArchivedNavigationEntry,
  findArchivedRouteButton,
  getArchivedDialogShell,
  matchesArchivedLabel,
  findArchivedSettingsButton,
  findArchivedSettingsEntry,
  findUnarchiveButtonForRow,
  isSettingsViewActive,
  isArchivedDialogShellVisible,
  isExcludedArchivedEntryCandidate,
  isArchivedModalOpen,
  isArchivedRouteNavigationControl,
  isArchivedSidebarViewActive,
  isRowInArchivedModal,
  isTrashConfirmDialogOpen,
  finalizeArchivedOpenModalResult,
  openArchivedModal,
  resetOpenArchivedModalInFlightForTests,
  resolveArchivedEntryCapabilityReason,
  resolveArchivedOpenResult,
  waitForArchivedModal
} from '../../src/content/adapters/archived-adapter.js';
import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE
} from '../../src/content/adapters/capability-states.js';
import {
  archivedEntryControl,
  archivedModalSurface,
  archivedRouteControl,
  archivedSidebarView,
  startChatFabSurface,
  trashConfirmDialog
} from '../fixtures/dom/list-states.js';
import { ARCHIVED_FAB_ATTRIBUTE } from '../../src/content/navigation-fab.js';

describe('archived-adapter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetOpenArchivedModalInFlightForTests();
  });

  it('ignores the extension injected archived fab when finding modal entry controls', () => {
    document.body.innerHTML = `
      ${startChatFabSurface}
      <mw-fab-link class="archived-chat" data-messages-shortcuts-archived-fab-wrap="">
        <a class="fab link" data-messages-shortcuts-archived-fab="">
          <div class="fab-label">Archived</div>
        </a>
      </mw-fab-link>
    `;

    expect(findArchivedModalEntryControl(document)).toBeNull();
    expect(document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`)).not.toBeNull();
  });

  it('ignores extension owned archived entry selectors when scanning primary controls', () => {
    document.body.innerHTML = `
      <a data-e2e-archived-button data-messages-shortcuts-archived-fab="">Archived</a>
      <button data-e2e-archived-button>Native archived</button>
    `;

    expect(findArchivedModalEntryControl(document)).toBeNull();
    expect(findArchivedRouteButton(document)?.textContent).toBe('Native archived');
  });

  it('ignores the extension injected archived fab when finding settings entries', () => {
    document.body.innerHTML = `
      <mws-settings>
        <a data-messages-shortcuts-archived-fab="">Archived</a>
        <button>Archived</button>
      </mws-settings>
    `;

    expect(findArchivedSettingsEntry(document)?.matches('a[data-messages-shortcuts-archived-fab]')).toBe(false);
  });

  it('finds the archived modal entry control by primary selector or fallback label', () => {
    document.body.innerHTML = archivedEntryControl;

    expect(findArchivedModalEntryControl(document)?.getAttribute('data-e2e-archived-list-button'))
      .toBe('');

    document.body.innerHTML = `
      <nav>
        <button>Archived</button>
      </nav>
    `;

    expect(findArchivedEntryControl(document)?.textContent).toBe('Archived');
  });

  it('returns false for null or dialog-scoped route checks', () => {
    expect(isArchivedRouteNavigationControl(null)).toBe(false);

    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-archived-button>Archived</button>
      </mat-dialog-container>
    `;

    expect(isArchivedRouteNavigationControl(
      document.querySelector('[data-e2e-archived-button]'),
      document
    )).toBe(false);
  });

  it('treats archived labels inside bottom navigation as route controls', () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <a>Archived</a>
      </mws-bottom-navigation>
    `;

    expect(isArchivedRouteNavigationControl(document.querySelector('a'), document)).toBe(true);
  });

  it('ignores bottom navigation archived route controls when finding modal entry', () => {
    document.body.innerHTML = `
      ${archivedRouteControl}
      <button data-e2e-archived-list-button>Archived</button>
    `;

    expect(findArchivedModalEntryControl(document)?.getAttribute('data-e2e-archived-list-button'))
      .toBe('');
    expect(isArchivedRouteNavigationControl(
      document.querySelector('[data-e2e-archived-button]'),
      document
    )).toBe(true);
  });

  it('treats selected archived route tabs outside bottom navigation as route controls', () => {
    document.body.innerHTML = `
      <nav>
        <button data-e2e-archived-button aria-current="page">Archived</button>
      </nav>
    `;

    expect(isArchivedRouteNavigationControl(
      document.querySelector('[data-e2e-archived-button]'),
      document
    )).toBe(true);
  });

  it('treats data-e2e-archived-button as a route control outside navigation', () => {
    document.body.innerHTML = `
      <button data-e2e-archived-button aria-selected="true">Archived</button>
    `;

    expect(isArchivedRouteNavigationControl(
      document.querySelector('[data-e2e-archived-button]'),
      document
    )).toBe(true);
  });

  it('finds archived menu items after skipping unrelated entries', () => {
    document.body.innerHTML = `
      <button role="menuitem"></button>
      <button role="menuitem">Archive</button>
      <button role="menuitem">Archived</button>
    `;

    expect(findArchivedMenuItem(document)?.textContent).toBe('Archived');
  });

  it('matches localized archived labels without treating archive actions as archived entries', () => {
    expect(matchesArchivedLabel(null)).toBe(false);
    expect(matchesArchivedLabel({ textContent: 'Archived' })).toBe(true);
    expect(matchesArchivedLabel({ textContent: 'ארכיון' })).toBe(true);
    expect(matchesArchivedLabel({ textContent: 'Archive' })).toBe(false);
    expect(matchesArchivedLabel({ textContent: 'Archive conversation' })).toBe(false);
    expect(matchesArchivedLabel({ textContent: 'Archivar' })).toBe(false);
    expect(matchesArchivedLabel({ textContent: 'View archived messages' })).toBe(false);
    expect(matchesArchivedLabel({ getAttribute: () => 'Archived', textContent: '' })).toBe(true);
  });

  it('ignores toolbar archive actions when finding modal entry labels', () => {
    document.body.innerHTML = `
      <header>
        <button aria-label="Archive conversation">Archive</button>
        <button class="mat-mdc-icon-button" aria-label="Filter conversations">Filter</button>
      </header>
      <main>
        <button>Archived</button>
      </main>
    `;

    expect(findArchivedModalEntryControl(document)).toBeNull();
  });

  it('accepts only menu-like app overflow triggers', () => {
    document.body.innerHTML = `
      <header>
        <button class="mat-mdc-icon-button" aria-label="Back">Back</button>
        <button aria-label="Open menu" aria-haspopup="menu">Menu</button>
      </header>
    `;

    expect(isAppOverflowMenuTrigger(null)).toBe(false);
    expect(isAppOverflowMenuTrigger({})).toBe(false);
    expect(isAppOverflowMenuTrigger(document.querySelector('.mat-mdc-icon-button'))).toBe(false);

    const e2eTrigger = document.createElement('button');
    e2eTrigger.setAttribute('data-e2e-app-menu-button', '');
    expect(isAppOverflowMenuTrigger(e2eTrigger)).toBe(true);

    const drawerTrigger = document.createElement('button');
    drawerTrigger.setAttribute('aria-label', 'Open drawer');
    expect(isAppOverflowMenuTrigger(drawerTrigger)).toBe(true);

    const menuButton = document.createElement('button');
    menuButton.className = 'menu-button';
    expect(isAppOverflowMenuTrigger(menuButton)).toBe(true);

    expect(isAppOverflowMenuTrigger(document.createElement('button'))).toBe(false);

    expect(findArchivedAppOverflowTrigger(document)?.getAttribute('aria-label')).toBe('Open menu');
  });

  it('skips extension-owned and dialog-scoped labels in navigation fallback scopes', () => {
    document.body.innerHTML = `
      <nav>
        <button data-messages-shortcuts-archived-fab="">Injected</button>
        <button>Archived</button>
      </nav>
    `;

    expect(findArchivedModalEntryControl(document)?.textContent).toBe('Archived');

    document.body.innerHTML = `
      <mat-dialog-container>
        <nav>
          <button>Archived</button>
        </nav>
      </mat-dialog-container>
    `;

    expect(findArchivedModalEntryControl(document)).toBeNull();
  });

  it('finds the account menu trigger from account buttons and profile images', () => {
    document.body.innerHTML = `
      <header>
        <button data-e2e-account-button>Account</button>
      </header>
    `;

    expect(findArchivedAccountMenuTrigger(document)?.getAttribute('data-e2e-account-button')).toBe('');

    document.body.innerHTML = `
      <header>
        <button><img alt="Messages"></button>
        <button><img alt="Google Account: Test User"></button>
      </header>
    `;

    expect(findArchivedAccountMenuTrigger(document)?.querySelector('img')?.getAttribute('alt'))
      .toBe('Google Account: Test User');

    document.body.innerHTML = `
      <header>
        <img alt="Google Account">
        <button><img></button>
      </header>
    `;

    expect(findArchivedAccountMenuTrigger(document)).toBeNull();
  });

  it('ignores extension-owned app shell overflow triggers', () => {
    document.body.innerHTML = `
      <header>
        <button aria-haspopup="menu" data-messages-shortcuts-archived-fab="">Injected</button>
        <button aria-label="Native menu" aria-haspopup="menu">Native</button>
      </header>
    `;

    expect(findArchivedAppOverflowTrigger(document)?.getAttribute('aria-label')).toBe('Native menu');
  });

  it('returns null when dialog containers are unrelated to archived', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-action-button-confirm>Move to trash</button>
      </mat-dialog-container>
    `;

    expect(getArchivedDialogShell(document)).toBeNull();
    expect(isArchivedDialogShellVisible(document)).toBe(false);
  });

  it('excludes archived entry candidates from dialogs, row menus, and conversation lists', () => {
    expect(isExcludedArchivedEntryCandidate(null)).toBe(true);

    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-unarchive-button>Unarchive</button>
        <button>Archived</button>
      </mat-dialog-container>
      <div role="menu" class="conversation-actions-menu">
        <button>Archived</button>
      </div>
      <mws-conversations-list>
        <mws-conversation-list-item>
          <button>Archived</button>
        </mws-conversation-list-item>
      </mws-conversations-list>
      <h2>Archived</h2>
    `;

    expect(isExcludedArchivedEntryCandidate(
      document.querySelector('mat-dialog-container button')
    )).toBe(true);
    expect(isExcludedArchivedEntryCandidate(
      document.querySelector('.conversation-actions-menu button')
    )).toBe(true);
    expect(isExcludedArchivedEntryCandidate(
      document.querySelector('mws-conversation-list-item button')
    )).toBe(true);
    expect(isExcludedArchivedEntryCandidate(document.querySelector('h2'))).toBe(true);

    document.body.innerHTML = `
      <mws-conversations-list>
        <button>Archived</button>
      </mws-conversations-list>
    `;

    expect(isExcludedArchivedEntryCandidate(
      document.querySelector('mws-conversations-list button')
    )).toBe(true);
  });

  it('skips excluded menu entries before matching archived navigation panel items', () => {
    document.body.innerHTML = `
      <div role="menu" class="conversation-actions-menu">
        <button>Archived</button>
      </div>
      <aside>
        <span class="mat-mdc-list-item">Archived</span>
      </aside>
    `;

    expect(findArchivedNavigationEntry(document)?.textContent).toBe('Archived');
  });

  it('finds archived entries from navigation panel list items', () => {
    document.body.innerHTML = `
      <aside>
        <h2>Archived</h2>
        <span class="mat-mdc-list-item">Archived</span>
      </aside>
    `;

    expect(findArchivedNavigationEntry(document)?.matches('.mat-mdc-list-item')).toBe(true);
  });

  it('falls back to the list header overflow reason when no specific entry path is selected', () => {
    expect(resolveArchivedEntryCapabilityReason({
      entryControl: null,
      accountMenuTrigger: null,
      overflowTrigger: null,
      appOverflowTrigger: null,
      settingsButton: null
    })).toBe('Archived modal entry is available through the list header overflow menu.');
  });

  it('reports account menu capability when that is the only entry path', () => {
    document.body.innerHTML = `
      <header>
        <button data-e2e-account-button>Account</button>
      </header>
    `;

    const entryCapability = assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry];

    expect(entryCapability.state).toBe(CAPABILITY_SUPPORTED);
    expect(entryCapability.reason)
      .toBe('Archived modal entry is available through the account menu.');
  });

  it('finds archived navigation entries inside nav panels', () => {
    document.body.innerHTML = `
      <mat-nav-list>
        <a role="link">ארכיון</a>
      </mat-nav-list>
    `;

    expect(findArchivedNavigationEntry(document)?.textContent).toBe('ארכיון');
    expect(getArchivedDialogShell(document)).toBeNull();
  });

  it('prefers archived route controls when resolving navigation entries', () => {
    document.body.innerHTML = `
      <button data-e2e-archived-button>Archived route</button>
      <button role="menuitem">Archived menu</button>
    `;

    expect(findArchivedNavigationEntry(document)?.textContent).toBe('Archived route');
  });

  it('ignores archived labels inside conversation rows when scanning navigation panels', () => {
    document.body.innerHTML = `
      <mws-conversations-list>
        <mws-conversation-list-item>
          <button>Archive</button>
        </mws-conversation-list-item>
      </mws-conversations-list>
      <nav>
        <h2>Archived</h2>
        <button>Archived</button>
      </nav>
    `;

    expect(findArchivedNavigationEntry(document)?.closest('nav')).not.toBeNull();
    expect(findArchivedNavigationEntry(document)?.matches('button')).toBe(true);
  });

  it('ignores archived settings entries rendered inside the archived dialog', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-unarchive-button>Unarchive</button>
        <button>Archived</button>
      </mat-dialog-container>
      <mws-settings>
        <button>Archived</button>
      </mws-settings>
    `;

    expect(findArchivedSettingsEntry(document)?.closest('mws-settings')).not.toBeNull();
  });

  it('opens archived through the account menu', async () => {
    document.body.innerHTML = `
      <header>
        <button data-e2e-account-button>Account</button>
      </header>
    `;

    const accountButton = findArchivedAccountMenuTrigger(document);
    accountButton.addEventListener('click', () => {
      const menu = document.createElement('div');
      menu.setAttribute('role', 'menu');
      menu.innerHTML = '<button role="menuitem">Archived</button>';
      menu.querySelector('button').addEventListener('click', () => {
        document.body.insertAdjacentHTML(
          'beforeend',
          '<mat-dialog-container><h2>Archived</h2></mat-dialog-container>'
        );
      });
      document.body.append(menu);
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(result).toEqual({ ok: true });
  });

  it('returns already open when the archived dialog shell is visible', async () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <h2>Archived</h2>
      </mat-dialog-container>
    `;

    await expect(openArchivedModal(document)).resolves.toEqual({ ok: true, alreadyOpen: true });
  });

  it('resolves settings navigation through the archived dialog shell', async () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-settings-button>Settings</button>
      </mws-bottom-navigation>
    `;

    const settingsButton = document.querySelector('[data-e2e-settings-button]');
    settingsButton.addEventListener('click', () => {
      const panel = document.createElement('mws-settings');
      const settingsEntry = document.createElement('button');
      settingsEntry.textContent = 'Archived';
      settingsEntry.addEventListener('click', () => {
        document.body.insertAdjacentHTML(
          'beforeend',
          '<mat-dialog-container><h2>Archived</h2></mat-dialog-container>'
        );
      });
      panel.append(settingsEntry);
      document.body.append(panel);
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(result).toEqual({ ok: true });
  });

  it('resolves a direct archived entry through the dialog shell fallback', async () => {
    document.body.innerHTML = archivedEntryControl;

    const entryControl = findArchivedModalEntryControl(document);
    vi.spyOn(entryControl, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `
          <mat-dialog-container>
            <h2>Archived</h2>
          </mat-dialog-container>
        `
      );
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(entryControl.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it('does not fall back to the sidebar route after a slow direct modal click', async () => {
    document.body.innerHTML = `
      ${archivedEntryControl}
      <mws-bottom-navigation>
        <button data-e2e-home-button aria-selected="true">Home</button>
        <button data-e2e-archived-button>Archived</button>
      </mws-bottom-navigation>
      <main><h2>Inbox</h2></main>
    `;

    const entryControl = findArchivedModalEntryControl(document);
    const routeButton = document.querySelector('[data-e2e-archived-button]');

    vi.spyOn(entryControl, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<mat-dialog-container><h2>Archived</h2></mat-dialog-container>'
      );
    });
    vi.spyOn(routeButton, 'click');

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(entryControl.click).toHaveBeenCalledTimes(1);
    expect(routeButton.click).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it('resolves archived open results from the dialog shell or sidebar route', () => {
    document.body.innerHTML = archivedModalSurface;

    expect(resolveArchivedOpenResult(document)).toEqual({ ok: true });

    document.body.innerHTML = archivedSidebarView;

    expect(resolveArchivedOpenResult(document)).toEqual({
      ok: true,
      reason: 'archived-sidebar-only',
      openedRoute: true
    });

    document.body.innerHTML = archivedModalSurface;

    expect(finalizeArchivedOpenModalResult(document)).toEqual({ ok: true });

    document.body.innerHTML = startChatFabSurface;

    expect(finalizeArchivedOpenModalResult(document)).toEqual({
      ok: false,
      reason: 'archived-modal-timeout'
    });
  });

  it('blocks concurrent openArchivedModal calls while one is in progress', async () => {
    document.body.innerHTML = archivedEntryControl;

    let resolveWait;
    const waitPromise = new Promise((resolve) => {
      resolveWait = resolve;
    });

    const firstPromise = openArchivedModal(
      document,
      undefined,
      () => waitPromise
    );
    await Promise.resolve();

    const secondResult = await openArchivedModal(document);

    expect(secondResult).toEqual({ ok: false, reason: 'action-in-progress' });

    resolveWait(document.querySelector('mat-dialog-container'));
    await expect(firstPromise).resolves.toEqual({ ok: true });
  });

  it('reports app header menu capability when list header overflow is unavailable', () => {
    document.body.innerHTML = `
      <header>
        <button aria-label="Open menu" aria-haspopup="menu">Menu</button>
      </header>
    `;

    const entryCapability = assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry];

    expect(entryCapability.state).toBe(CAPABILITY_SUPPORTED);
    expect(entryCapability.reason)
      .toBe('Archived modal entry is available through the app header menu.');
  });

  it('finds app overflow triggers outside named app shell regions', () => {
    document.body.innerHTML = `
      <button aria-label="Top menu" aria-haspopup="menu">Menu</button>
    `;

    expect(findArchivedAppOverflowTrigger(document)?.getAttribute('aria-label')).toBe('Top menu');
  });

  it('finds custom archived entry controls that are not route navigation buttons', () => {
    const selectors = {
      ...ARCHIVED_SELECTORS,
      archivedModalEntryControl: 'button[data-e2e-archived-list-button]',
      archivedRouteControl: 'button[data-e2e-archived-route-button]',
      archivedEntryControl: 'button[data-e2e-archived-entry-button]'
    };

    document.body.innerHTML = '<button data-e2e-archived-entry-button>Archived</button>';

    expect(findArchivedModalEntryControl(document, selectors)?.textContent).toBe('Archived');
    expect(assessArchivedCapabilities(document, selectors)[ARCHIVED_CAPABILITY_IDS.entry].state)
      .toBe(CAPABILITY_SUPPORTED);
  });

  it('finds the app header overflow trigger outside the list header region', () => {
    document.body.innerHTML = `
      <header>
        <button aria-label="Open menu" aria-haspopup="menu">Menu</button>
      </header>
      <mws-conversation-list-item>
        <button class="menu-button">Row menu</button>
      </mws-conversation-list-item>
    `;

    expect(findArchivedAppOverflowTrigger(document)?.getAttribute('aria-label')).toBe('Open menu');
    expect(findArchivedListHeaderOverflowTrigger(document)).toBeNull();
  });

  it('opens archived sidebar when overflow menu navigation does not open the modal', async () => {
    document.body.innerHTML = `
      <header>
        <button aria-label="Open menu" aria-haspopup="menu">Menu</button>
      </header>
      <div role="menu">
        <button role="menuitem">Archived</button>
      </div>
      ${startChatFabSurface}
    `;

    const menuItem = findArchivedMenuItem(document);

    vi.spyOn(menuItem, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<main><h2>Archived</h2><mws-conversations-list></mws-conversations-list>${startChatFabSurface}</main>`
      );
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(result).toEqual({
      ok: true,
      reason: 'archived-sidebar-only',
      openedRoute: true
    });
  });

  it('opens archived through overflow menu route controls when the modal does not appear', async () => {
    document.body.innerHTML = `
      <header>
        <button aria-label="Open menu" aria-haspopup="menu">Menu</button>
      </header>
      <div role="menu">
        <button role="menuitem">Archived</button>
      </div>
      ${startChatFabSurface}
      <main><h2>Inbox</h2></main>
    `;

    const menuItem = findArchivedMenuItem(document);
    const routeButton = document.createElement('button');
    routeButton.setAttribute('data-e2e-archived-button', '');
    routeButton.textContent = 'Archived';

    vi.spyOn(menuItem, 'click').mockImplementation(() => {
      document.body.append(routeButton);
    });
    vi.spyOn(routeButton, 'click').mockImplementation(() => {
      routeButton.setAttribute('aria-selected', 'true');
      document.querySelector('main h2').textContent = 'Archived';
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(routeButton.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      reason: 'archived-sidebar-only',
      openedRoute: true
    });
  });

  it('opens archived through the app header overflow menu', async () => {
    document.body.innerHTML = `
      <header>
        <button aria-label="Open menu" aria-haspopup="menu">Menu</button>
      </header>
      <div role="menu">
        <button role="menuitem">ארכיון</button>
      </div>
    `;

    const overflowTrigger = findArchivedAppOverflowTrigger(document);
    const menuItem = findArchivedMenuItem(document);

    vi.spyOn(overflowTrigger, 'click');
    vi.spyOn(menuItem, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML('beforeend', archivedModalSurface);
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => waitForArchivedModal(document, undefined, 200, 50),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(overflowTrigger.click).toHaveBeenCalledTimes(1);
    expect(menuItem.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it('ignores archived list buttons that only exist inside the modal when assessing entry', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-archived-list-button>Inside</button>
        <button data-e2e-unarchive-button>Unarchive</button>
      </mat-dialog-container>
      <button data-e2e-archived-list-button>Outside</button>
    `;

    expect(assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry].evidenceSource)
      .toBe('dom-query');
  });

  it('skips standalone archived route buttons when finding modal entry controls', () => {
    document.body.innerHTML = `
      ${archivedRouteControl}
      <button data-e2e-archived-button>Archived</button>
    `;

    expect(findArchivedModalEntryControl(document)).toBeNull();
    expect(findArchivedRouteButton(document)?.textContent).toBe('Archived');
  });

  it('treats the archived dialog shell as open before unarchive controls render', async () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <h2>Archived</h2>
      </mat-dialog-container>
    `;

    expect(isArchivedDialogShellVisible(document)).toBe(true);
    expect(isArchivedModalOpen(document)).toBe(false);

    const resultPromise = waitForArchivedModal(document, undefined, 200, 50);
    await vi.advanceTimersByTimeAsync(50);

    await expect(resultPromise).resolves.toBeTruthy();
  });

  it('detects the archived sidebar route separately from the unarchive modal', () => {
    document.body.innerHTML = archivedSidebarView;

    expect(isArchivedSidebarViewActive(document)).toBe(true);
    expect(isArchivedModalOpen(document)).toBe(false);
    expect(findArchivedModalEntryControl(document)).toBeNull();
  });

  it('does not treat an open archived modal as the archived sidebar route', () => {
    document.body.innerHTML = `${archivedSidebarView}${archivedModalSurface}`;

    expect(isArchivedSidebarViewActive(document)).toBe(false);
  });

  it('detects the archived sidebar route from the main panel heading', () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-home-button>Home</button>
        <button data-e2e-archived-button>Archived</button>
      </mws-bottom-navigation>
      <main>
        ${startChatFabSurface}
        <h2>Inbox</h2>
        <h2>  Archived  </h2>
        <mws-conversations-list></mws-conversations-list>
      </main>
    `;

    expect(isArchivedSidebarViewActive(document)).toBe(true);
  });

  it('skips route-only archived buttons when collecting modal entry matches', () => {
    document.body.innerHTML = `
      ${archivedRouteControl}
      <button data-e2e-archived-list-button>Archived</button>
    `;

    expect(assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry].state)
      .toBe(CAPABILITY_SUPPORTED);
  });

  it('finds the list header overflow trigger from the list header input parent container', () => {
    document.body.innerHTML = `
      <div>
        <input type="text">
        <button aria-haspopup="menu">More</button>
      </div>
    `;

    expect(findArchivedListHeaderOverflowTrigger(document)?.textContent).toBe('More');
  });

  it('skips excluded list header overflow triggers inside conversation rows', () => {
    document.body.innerHTML = `
      <div>
        <input type="text">
        <mws-conversation-list-item>
          <button aria-haspopup="menu">Row menu</button>
        </mws-conversation-list-item>
        <button aria-haspopup="menu">Header menu</button>
      </div>
    `;

    expect(findArchivedListHeaderOverflowTrigger(document)?.textContent).toBe('Header menu');
  });

  it('skips extension-owned account menu triggers in the app shell', () => {
    document.body.innerHTML = `
      <header>
        <button data-e2e-account-button data-messages-shortcuts-archived-fab-wrap="">
          <a data-messages-shortcuts-archived-fab="">Injected</a>
        </button>
        <button data-e2e-account-button>Native account</button>
      </header>
    `;

    expect(findArchivedAccountMenuTrigger(document)?.textContent).toBe('Native account');
  });

  it('ignores archived route buttons when counting modal entry matches', () => {
    document.body.innerHTML = `
      <button data-e2e-archived-list-button>Archived list</button>
      <button data-e2e-archived-button>Archived legacy</button>
    `;

    expect(assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry].state)
      .toBe(CAPABILITY_SUPPORTED);
  });

  it('reports supported entry capability when only the settings path exists', () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-settings-button>Settings</button>
      </mws-bottom-navigation>
    `;

    const entryCapability = assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry];

    expect(entryCapability.state).toBe(CAPABILITY_SUPPORTED);
    expect(entryCapability.reason)
      .toBe('Archived modal entry is available through Settings.');
  });

  it('reports supported entry capability when only the list header overflow path exists', () => {
    document.body.innerHTML = `
      <header>
        <${LIST_HEADER_TAG}>
          <input type="text">
          <button aria-haspopup="menu">More</button>
        </${LIST_HEADER_TAG}>
      </header>
    `;

    const entryCapability = assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry];

    expect(entryCapability.state).toBe(CAPABILITY_SUPPORTED);
    expect(entryCapability.reason)
      .toBe('Archived modal entry is available through the list header overflow menu.');
    expect(entryCapability.evidenceSource).toBe('dom-query-fallback');
  });

  it('finds the list header overflow trigger from text list header inputs and list headers', () => {
    document.body.innerHTML = `
      <mws-conversations-list-header>
        <input type="text" aria-label="Filter conversations">
        <button class="menu-button">More</button>
      </mws-conversations-list-header>
    `;

    expect(findArchivedListHeaderOverflowTrigger(document)?.className).toBe('menu-button');
  });

  it('opens the archived modal through settings', async () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-settings-button>Settings</button>
      </mws-bottom-navigation>
    `;

    const settingsButton = findArchivedSettingsButton(document);
    vi.spyOn(settingsButton, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<mws-settings><button>Archived</button></mws-settings>'
      );
    });

    const result = await openArchivedModal(
      document,
      undefined,
      async (documentRoot) => {
        documentRoot.body.insertAdjacentHTML('beforeend', archivedModalSurface);

        return documentRoot.querySelector('mat-dialog-container');
      },
      { delayFn: async () => {} }
    );

    expect(settingsButton.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
    expect(isSettingsViewActive(document)).toBe(true);
    expect(findArchivedSettingsEntry(document)?.textContent).toBe('Archived');
  });

  it('opens the archived modal through the list header overflow menu', async () => {
    document.body.innerHTML = `
      <header>
        <${LIST_HEADER_TAG}>
          <input type="text">
          <button aria-haspopup="menu">More</button>
        </${LIST_HEADER_TAG}>
      </header>
      <div role="menu">
        <button role="menuitem" class="mat-mdc-menu-item">Archived</button>
      </div>
    `;

    const overflowTrigger = findArchivedListHeaderOverflowTrigger(document);
    const menuItem = findArchivedMenuItem(document);

    vi.spyOn(overflowTrigger, 'click');
    vi.spyOn(menuItem, 'click');

    const result = await openArchivedModal(
      document,
      undefined,
      async (documentRoot) => {
        documentRoot.body.insertAdjacentHTML('beforeend', archivedModalSurface);

        return documentRoot.querySelector('mat-dialog-container');
      },
      { delayFn: async () => {} }
    );

    expect(overflowTrigger.click).toHaveBeenCalledTimes(1);
    expect(menuItem.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it('fails when the list header overflow trigger is present but the archived menu item is missing', async () => {
    document.body.innerHTML = `
      <header>
        <${LIST_HEADER_TAG}>
          <input type="text">
          <button aria-haspopup="menu">More</button>
        </${LIST_HEADER_TAG}>
      </header>
    `;

    const result = await openArchivedModal(
      document,
      undefined,
      () => waitForArchivedModal(document, undefined, 200, 50),
      { delayFn: async () => {} }
    );

    expect(result).toEqual({ ok: false, reason: 'archived-entry-not-found' });
  });

  it('times out when the list header overflow archived menu item does not open the modal', async () => {
    document.body.innerHTML = `
      <header>
        <${LIST_HEADER_TAG}>
          <input type="text">
          <button aria-haspopup="menu">More</button>
        </${LIST_HEADER_TAG}>
      </header>
      <div role="menu">
        <button role="menuitem" class="mat-mdc-menu-item">Archived</button>
      </div>
    `;

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(result).toEqual({
      ok: false,
      reason: 'archived-modal-timeout'
    });
  });

  it('uses the default delay when opening archived through list header overflow', async () => {
    document.body.innerHTML = `
      <header>
        <${LIST_HEADER_TAG}>
          <input type="text">
          <button aria-haspopup="menu">More</button>
        </${LIST_HEADER_TAG}>
      </header>
      <div role="menu">
        <button role="menuitem" class="mat-mdc-menu-item">Archived</button>
      </div>
    `;

    const resultPromise = openArchivedModal(
      document,
      undefined,
      async (documentRoot) => {
        documentRoot.body.insertAdjacentHTML('beforeend', archivedModalSurface);

        return documentRoot.querySelector('mat-dialog-container');
      }
    );

    await vi.advanceTimersByTimeAsync(150);

    await expect(resultPromise).resolves.toEqual({ ok: true });
  });

  it('returns alreadyOpen when the archived sidebar route is active', async () => {
    document.body.innerHTML = archivedSidebarView;

    const result = await openArchivedModal(
      document,
      undefined,
      () => waitForArchivedModal(document, undefined, 200, 50),
      { delayFn: async () => {} }
    );

    await vi.advanceTimersByTimeAsync(250);

    expect(result).toEqual({ ok: true, alreadyOpen: true });
  });

  it('opens the archived modal when the bottom navigation route opens it directly', async () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-archived-button>Archived</button>
      </mws-bottom-navigation>
    `;

    const routeButton = document.querySelector('[data-e2e-archived-button]');
    vi.spyOn(routeButton, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML('beforeend', archivedModalSurface);
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => waitForArchivedModal(document, undefined, 200, 50),
      { delayFn: async () => {} }
    );

    expect(routeButton.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it('returns archived-modal-timeout when the route control does not open archived', async () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-archived-button>Archived</button>
      </mws-bottom-navigation>
    `;

    const routeButton = document.querySelector('[data-e2e-archived-button]');
    vi.spyOn(routeButton, 'click');

    const result = await openArchivedModal(
      document,
      undefined,
      () => waitForArchivedModal(document, undefined, 200, 50),
      { delayFn: async () => {} }
    );

    expect(routeButton.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: false, reason: 'archived-modal-timeout' });
  });

  it('ignores settings buttons rendered inside the archived modal', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-unarchive-button></button>
        <button data-e2e-settings-button>Settings</button>
      </mat-dialog-container>
    `;

    expect(findArchivedSettingsButton(document)).toBeNull();
  });

  it('treats orphaned menu items as settings archived entries', () => {
    document.body.innerHTML = `
      <mws-settings>
        <button role="menuitem">Archived</button>
      </mws-settings>
    `;

    expect(findArchivedSettingsEntry(document)?.getAttribute('role')).toBe('menuitem');
  });

  it('finds settings archived entries outside the settings panel container', () => {
    document.body.innerHTML = `
      <mws-settings><button>Settings</button></mws-settings>
      <button>Archived</button>
    `;

    expect(findArchivedSettingsEntry(document)?.textContent).toBe('Archived');
  });

  it('ignores archived labels that do not exactly match the settings entry text', () => {
    document.body.innerHTML = `
      <mws-settings>
        <button>Archive</button>
      </mws-settings>
    `;

    expect(findArchivedSettingsEntry(document)).toBeNull();
  });

  it('ignores settings entry candidates with empty labels', () => {
    const settingsPanel = document.createElement('mws-settings');
    const emptyLabelButton = document.createElement('button');
    Object.defineProperty(emptyLabelButton, 'textContent', { get: () => null });
    settingsPanel.append(emptyLabelButton);
    document.body.append(settingsPanel);

    expect(findArchivedSettingsEntry(document)).toBeNull();
  });

  it('treats a selected settings tab as the active settings view', () => {
    document.body.innerHTML = `
      <button data-e2e-settings-button aria-selected="true">Settings</button>
    `;

    expect(isSettingsViewActive(document)).toBe(true);
  });

  it('returns null when the only archived label lives inside the archived modal', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-unarchive-button></button>
        <button>Archived</button>
      </mat-dialog-container>
    `;

    expect(findArchivedSettingsEntry(document)).toBeNull();
  });

  it('ignores archived labels rendered inside the archived modal when finding settings entries', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-unarchive-button></button>
        <button>Archived</button>
      </mat-dialog-container>
      <mws-settings>
        <button>Archived</button>
      </mws-settings>
    `;

    expect(findArchivedSettingsEntry(document)?.closest('mws-settings')).not.toBeNull();
  });

  it('skips route and menu archived entries when finding the settings archived entry', () => {
    document.body.innerHTML = `
      <mws-settings>
        <mws-bottom-navigation>
          <button data-e2e-archived-button>Archived</button>
        </mws-bottom-navigation>
        <div role="menu">
          <button role="menuitem">Archived</button>
        </div>
        <button>Archived</button>
      </mws-settings>
    `;

    const settingsEntry = findArchivedSettingsEntry(document);

    expect(settingsEntry?.textContent).toBe('Archived');
    expect(settingsEntry?.closest('mws-bottom-navigation')).toBeNull();
    expect(settingsEntry?.closest('[role="menu"]')).toBeNull();
  });

  it('returns archived-entry-not-found when settings never exposes an archived entry', async () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-settings-button>Settings</button>
      </mws-bottom-navigation>
    `;

    const settingsButton = document.querySelector('[data-e2e-settings-button]');
    vi.spyOn(settingsButton, 'click');

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(settingsButton.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: false, reason: 'archived-entry-not-found' });
  });

  it('uses the default delay helper when opening archived via the route', async () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-archived-button>Archived</button>
      </mws-bottom-navigation>
      <main><h2>Inbox</h2></main>
    `;

    const routeButton = document.querySelector('[data-e2e-archived-button]');
    routeButton.addEventListener('click', () => {
      routeButton.setAttribute('aria-selected', 'true');
      document.querySelector('main h2').textContent = 'Archived';
    });

    const resultPromise = openArchivedModal(document);

    await vi.advanceTimersByTimeAsync(500);

    await expect(resultPromise).resolves.toEqual({
      ok: true,
      reason: 'archived-sidebar-only',
      openedRoute: true
    });
  });

  it('does not re-click settings when the settings tab is already selected', async () => {
    document.body.innerHTML = `
      <button data-e2e-settings-button aria-selected="true">Settings</button>
    `;

    const settingsButton = document.querySelector('[data-e2e-settings-button]');
    vi.spyOn(settingsButton, 'click');

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(settingsButton.click).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: false, reason: 'archived-entry-not-found' });
  });

  it('returns the settings timeout when overflow and route paths are unavailable', async () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button data-e2e-settings-button>Settings</button>
      </mws-bottom-navigation>
    `;

    const settingsButton = document.querySelector('[data-e2e-settings-button]');
    vi.spyOn(settingsButton, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<mws-settings><button>Archived</button></mws-settings>'
      );
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => Promise.reject(new Error('archived-modal-timeout')),
      { delayFn: async () => {}, timeoutMs: 200 }
    );

    expect(result).toEqual({ ok: false, reason: 'archived-modal-timeout' });
  });

  it('opens archived via the bottom navigation route when the injected fab is present', async () => {
    document.body.innerHTML = `
      ${startChatFabSurface}
      <mw-fab-link class="archived-chat" data-messages-shortcuts-archived-fab-wrap="">
        <a class="fab link" data-messages-shortcuts-archived-fab="">
          <div class="fab-label">Archived</div>
        </a>
      </mw-fab-link>
      <mws-bottom-navigation>
        <button data-e2e-home-button aria-selected="true">Home</button>
        <button data-e2e-archived-button>Archived</button>
      </mws-bottom-navigation>
      <main><h2>Inbox</h2></main>
    `;

    const routeButton = document.querySelector('[data-e2e-archived-button]');
    const injectedFab = document.querySelector(`[${ARCHIVED_FAB_ATTRIBUTE}]`);
    vi.spyOn(routeButton, 'click').mockImplementation(() => {
      routeButton.setAttribute('aria-selected', 'true');
      document.querySelector('[data-e2e-home-button]')?.removeAttribute('aria-selected');
      document.querySelector('main h2').textContent = 'Archived';
    });
    vi.spyOn(injectedFab, 'click');

    const result = await openArchivedModal(
      document,
      undefined,
      () => waitForArchivedModal(document, undefined, 200, 50),
      { delayFn: async () => {} }
    );

    expect(injectedFab.click).not.toHaveBeenCalled();
    expect(routeButton.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      reason: 'archived-sidebar-only',
      openedRoute: true
    });
  });

  it('opens the archived sidebar route when modal entry controls are unavailable', async () => {
    document.body.innerHTML = `
      ${startChatFabSurface}
      <mws-bottom-navigation>
        <button data-e2e-home-button aria-selected="true">Home</button>
        <button data-e2e-archived-button>Archived</button>
      </mws-bottom-navigation>
      <main><h2>Inbox</h2></main>
    `;

    const routeButton = document.querySelector('[data-e2e-archived-button]');
    vi.spyOn(routeButton, 'click').mockImplementation(() => {
      routeButton.setAttribute('aria-selected', 'true');
      document.querySelector('[data-e2e-home-button]')?.removeAttribute('aria-selected');
      document.querySelector('main h2').textContent = 'Archived';
    });

    const result = await openArchivedModal(
      document,
      undefined,
      () => waitForArchivedModal(document, undefined, 200, 50),
      { delayFn: async () => {} }
    );

    expect(routeButton.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      reason: 'archived-sidebar-only',
      openedRoute: true
    });
  });

  it('skips archived entry controls that only exist inside the modal', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-archived-button>Archived</button>
        <button data-e2e-unarchive-button>Unarchive</button>
      </mat-dialog-container>
      <nav>
        <button>Archived</button>
      </nav>
    `;

    expect(findArchivedEntryControl(document)?.textContent).toBe('Archived');
    expect(assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry].evidenceSource)
      .toBe('dom-query-fallback');
  });

  it('returns the first primary archived entry control outside the modal', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-archived-button>Inside</button>
        <button data-e2e-unarchive-button>Unarchive</button>
      </mat-dialog-container>
      <button data-e2e-archived-button>Outside</button>
    `;

    expect(findArchivedEntryControl(document)).toBeNull();
    expect(findArchivedRouteButton(document)?.textContent).toBe('Outside');
  });

  it('detects archived modal versus trash confirm dialog', () => {
    document.body.innerHTML = archivedModalSurface;

    expect(isArchivedModalOpen(document)).toBe(true);
    expect(isTrashConfirmDialogOpen(document)).toBe(false);

    document.body.innerHTML = trashConfirmDialog;

    expect(isArchivedModalOpen(document)).toBe(false);
    expect(isTrashConfirmDialogOpen(document)).toBe(true);
  });

  it('finds row-scoped unarchive buttons and archived row context', () => {
    document.body.innerHTML = archivedModalSurface;
    const row = document.getElementById('fixture-archived-row');

    expect(findUnarchiveButtonForRow(row)?.textContent).toBe('Unarchive');
    expect(isRowInArchivedModal(row)).toBe(true);
  });

  it('assesses archived capabilities for entry and modal states', () => {
    document.body.innerHTML = `${archivedEntryControl}${startChatFabSurface}`;
    const entryCapabilities = assessArchivedCapabilities(document);

    expect(entryCapabilities[ARCHIVED_CAPABILITY_IDS.entry].state).toBe(CAPABILITY_SUPPORTED);
    expect(entryCapabilities[ARCHIVED_CAPABILITY_IDS.modalOpen].state).toBe(CAPABILITY_UNAVAILABLE);

    document.body.innerHTML = archivedModalSurface;
    const modalCapabilities = assessArchivedCapabilities(document);

    expect(modalCapabilities[ARCHIVED_CAPABILITY_IDS.modalOpen].state).toBe(CAPABILITY_SUPPORTED);
    expect(modalCapabilities[ARCHIVED_CAPABILITY_IDS.unarchive].state).toBe(CAPABILITY_SUPPORTED);
  });

  it('opens the archived modal through the native entry control', async () => {
    document.body.innerHTML = archivedEntryControl;
    const entryControl = findArchivedEntryControl(document);
    vi.spyOn(entryControl, 'click');

    const result = await openArchivedModal(
      document,
      undefined,
      async (documentRoot) => {
        documentRoot.body.insertAdjacentHTML('beforeend', archivedModalSurface);

        return documentRoot.querySelector('mat-dialog-container');
      }
    );

    expect(entryControl.click).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ ok: true });
  });

  it('opens the archived modal using the default modal waiter', async () => {
    document.body.innerHTML = archivedEntryControl;

    const resultPromise = openArchivedModal(document);

    await vi.advanceTimersByTimeAsync(100);
    document.body.insertAdjacentHTML('beforeend', archivedModalSurface);
    await vi.advanceTimersByTimeAsync(100);

    await expect(resultPromise).resolves.toEqual({ ok: true });
  });

  it('returns false when the main panel lacks an archived heading', () => {
    document.body.innerHTML = `
      <main>
        ${startChatFabSurface}
        <h2>Inbox</h2>
        <mws-conversations-list></mws-conversations-list>
      </main>
    `;

    expect(isArchivedSidebarViewActive(document)).toBe(false);
  });

  it('returns false when the archived heading is missing its conversation list or start chat fab', () => {
    document.body.innerHTML = `
      <main>
        ${startChatFabSurface}
        <h2>Archived</h2>
      </main>
    `;

    expect(isArchivedSidebarViewActive(document)).toBe(false);

    document.body.innerHTML = `
      <main>
        <h2>Archived</h2>
        <mws-conversations-list></mws-conversations-list>
      </main>
    `;

    expect(isArchivedSidebarViewActive(document)).toBe(false);
  });

  it('returns null when the list header container does not expose an overflow trigger', () => {
    document.body.innerHTML = '<input type="text">';

    expect(findArchivedListHeaderOverflowTrigger(document)).toBeNull();
  });

  it('finds the list header overflow trigger from a nested list header region', () => {
    document.body.innerHTML = `
      <${LIST_HEADER_TAG}>
        <input type="text">
        <button aria-haspopup="menu">More</button>
      </${LIST_HEADER_TAG}>
    `;

    expect(findArchivedListHeaderOverflowTrigger(document)?.textContent).toBe('More');
  });

  it('finds the list header overflow trigger from a parent container fallback', () => {
    document.body.innerHTML = `
      <div id="list-header-shell">
        <div><input type="text"></div>
        <button aria-haspopup="menu">More</button>
      </div>
    `;

    expect(findArchivedListHeaderOverflowTrigger(document)?.textContent).toBe('More');
  });

  it('falls back to the list header input parent when no list header region matches', () => {
    document.body.innerHTML = `
      <div id="list-header-parent"><input type="text"></div>
    `;

    expect(findArchivedListHeaderOverflowTrigger(document)).toBeNull();
  });

  it('walks up to the list header input grandparent when no list header region matches', () => {
    document.body.innerHTML = `
      <div id="list-header-grandparent">
        <div id="list-header-parent"><input type="text"></div>
      </div>
    `;

    expect(findArchivedListHeaderOverflowTrigger(document)).toBeNull();
  });

  it('uses the list header input parent when the grandparent is unavailable', () => {
    const input = document.createElement('input');
    input.type = LIST_HEADER_INPUT_TYPE;
    document.documentElement.appendChild(input);

    expect(findArchivedListHeaderOverflowTrigger(document)).toBeNull();

    input.remove();
  });

  it('finds archived route controls by data-e2e selector outside bottom navigation', () => {
    document.body.innerHTML = '<button data-e2e-archived-button>Archived</button>';

    expect(findArchivedRouteButton(document)?.textContent).toBe('Archived');
  });

  it('does not treat unrelated bottom navigation labels as archived route controls', () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <a>Home</a>
      </mws-bottom-navigation>
    `;

    expect(isArchivedRouteNavigationControl(document.querySelector('a'), document)).toBe(false);
  });

  it('ignores bottom navigation controls without archived labels', () => {
    document.body.innerHTML = `
      <mws-bottom-navigation>
        <button></button>
      </mws-bottom-navigation>
    `;

    expect(isArchivedRouteNavigationControl(document.querySelector('button'), document)).toBe(false);
  });

  it('ignores main panel headings without archived labels', () => {
    const main = document.createElement('main');
    const emptyHeading = document.createElement('h2');
    Object.defineProperty(emptyHeading, 'textContent', { get: () => null });
    main.append(
      emptyHeading,
      document.createElement('mws-conversations-list')
    );
    main.insertAdjacentHTML('beforeend', startChatFabSurface);
    document.body.append(main);

    expect(isArchivedSidebarViewActive(document)).toBe(false);
  });

  it('returns already open when the archived modal is visible', async () => {
    document.body.innerHTML = archivedModalSurface;

    await expect(waitForArchivedModal(document, undefined, 50)).resolves.toBeTruthy();
    await expect(openArchivedModal(document)).resolves.toEqual({ ok: true, alreadyOpen: true });
  });

  it('fails closed when the archived entry control is missing', async () => {
    await expect(openArchivedModal(document)).resolves.toEqual({
      ok: false,
      reason: 'archived-entry-not-found'
    });
  });

  it('marks duplicate archived modal entry controls as unsafe', () => {
    document.body.innerHTML = `
      <button data-e2e-archived-list-button>Archived A</button>
      <button data-e2e-archived-list-button>Archived B</button>
    `;

    expect(assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.entry].state)
      .toBe(CAPABILITY_UNSAFE);
  });

  it('reports unavailable unarchive capability when the modal has no controls', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <h2>Archived</h2>
      </mat-dialog-container>
    `;

    expect(assessArchivedCapabilities(document)[ARCHIVED_CAPABILITY_IDS.unarchive].state)
      .toBe(CAPABILITY_UNAVAILABLE);
  });

  it('times out when the archived modal never opens', async () => {
    document.body.innerHTML = archivedEntryControl;

    const resultPromise = openArchivedModal(
      document,
      undefined,
      () => waitForArchivedModal(document, undefined, 200, 50)
    );

    await vi.advanceTimersByTimeAsync(250);

    await expect(resultPromise).resolves.toEqual({
      ok: false,
      reason: 'archived-modal-timeout'
    });
  });

  it('resolves archived conversation rows from focus and selection', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <mws-conversation-list-item id="focused-row" is-focused="true">
          <button data-e2e-unarchive-button>Unarchive</button>
        </mws-conversation-list-item>
        <mws-conversation-list-item id="selected-row">
          <a aria-selected="true"></a>
          <button data-e2e-unarchive-button>Unarchive</button>
        </mws-conversation-list-item>
      </mat-dialog-container>
    `;

    expect(findArchivedConversationRow(document)?.id).toBe('focused-row');
    document.getElementById('focused-row').removeAttribute('is-focused');

    expect(findArchivedConversationRow(document)?.id).toBe('selected-row');
  });

  it('returns null for missing archived row inputs', () => {
    expect(findUnarchiveButtonForRow(null)).toBeNull();
    expect(isRowInArchivedModal(null)).toBe(false);
    expect(findArchivedConversationRow(document)).toBeNull();
  });

  it('returns null when the archived modal has no target row', () => {
    document.body.innerHTML = `
      <mat-dialog-container>
        <button data-e2e-unarchive-button>Unarchive</button>
      </mat-dialog-container>
    `;

    expect(findArchivedConversationRow(document)).toBeNull();
  });

  it('prefers hovered archived rows when the dialog reports hover state', () => {
    document.body.innerHTML = archivedModalSurface;
    const dialog = document.querySelector('mat-dialog-container');
    const hoveredRow = document.createElement('mws-conversation-list-item');
    hoveredRow.id = 'hovered-archived-row';
    hoveredRow.innerHTML = '<button data-e2e-unarchive-button>Unarchive</button>';

    vi.spyOn(dialog, 'querySelector').mockImplementation((selector) => {
      const normalizedSelector = String(selector);

      if (normalizedSelector.includes(':hover')) {
        return hoveredRow;
      }

      if (normalizedSelector.includes('unarchive')) {
        return hoveredRow.querySelector('button[data-e2e-unarchive-button]');
      }

      return null;
    });

    expect(findArchivedConversationRow(document)?.id).toBe('hovered-archived-row');
  });

  it('ignores archived entry controls rendered inside the modal', () => {
    document.body.innerHTML = `
      <button data-e2e-archived-button>Archived</button>
      <mat-dialog-container>
        <button data-e2e-archived-button>Archived</button>
        <button data-e2e-unarchive-button>Unarchive</button>
      </mat-dialog-container>
    `;

    expect(findArchivedEntryControl(document)).toBeNull();
    expect(findArchivedRouteButton(document)?.textContent).toBe('Archived');
    expect(isRowInArchivedModal(null)).toBe(false);
  });
});
