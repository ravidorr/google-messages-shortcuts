import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ARCHIVED_FAB_ROW_ATTRIBUTE,
  createArchivedFab
} from '../../src/content/navigation-fab.js';
import {
  installNavigationFabShortcutBadges,
  resetNavigationFabShortcutBadgeInstallationsForTests
} from '../../src/content/navigation-fab-shortcut-badges.js';
import { createSpamBlockedFab } from '../../src/content/spam-blocked-fab.js';
import { startChatFabSurface } from '../fixtures/dom/list-states.js';

const BADGE_SELECTOR = '[data-messages-shortcuts-navigation-shortcut]';

function addNavigationFabs() {
  document.body.innerHTML = `<div class="gm-nav-row" ${ARCHIVED_FAB_ROW_ATTRIBUTE}>${startChatFabSurface}</div>`;
  const row = document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
  const startChatContainer = row.querySelector('mw-fab-link.start-chat');

  row.append(
    createArchivedFab(document, startChatContainer, vi.fn()),
    createSpamBlockedFab(startChatContainer, vi.fn())
  );
}

describe('navigation FAB shortcut badges', () => {
  let disconnect;

  beforeEach(() => {
    resetNavigationFabShortcutBadgeInstallationsForTests(document);
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    disconnect?.();
    disconnect = undefined;
    resetNavigationFabShortcutBadgeInstallationsForTests(document);
  });

  it('adds a decorative badge to each navigation control with an assigned shortcut', async () => {
    addNavigationFabs();
    const localThis = vi.fn(async () => ({
      'start-chat': 'Ctrl+Shift+S',
      'open-archived': 'Ctrl+Shift+A',
      'open-spam-blocked': 'Ctrl+Shift+B'
    }));

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: localThis
    });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(3);
    });

    expect(localThis).toHaveBeenCalledTimes(1);
    expect([...document.querySelectorAll(BADGE_SELECTOR)].map((badge) => badge.textContent))
      .toEqual(['Ctrl+Shift+S', 'Ctrl+Shift+A', 'Ctrl+Shift+B']);
    expect(document.querySelector(BADGE_SELECTOR).getAttribute('aria-hidden')).toBe('true');
  });

  it('omits badges for unassigned commands', async () => {
    addNavigationFabs();

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: vi.fn(async () => ({
        'start-chat': 'Not assigned',
        'open-archived': 'Ctrl+Shift+A',
        'open-spam-blocked': 'Not assigned'
      }))
    });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(1);
    });

    expect(document.querySelector(BADGE_SELECTOR).textContent).toBe('Ctrl+Shift+A');
  });

  it('does not add badges when no navigation controls are present', async () => {
    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: vi.fn(async () => ({
        'start-chat': 'Ctrl+Shift+S',
        'open-archived': 'Ctrl+Shift+A',
        'open-spam-blocked': 'Ctrl+Shift+B'
      }))
    });

    await Promise.resolve();

    expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(0);
  });

  it('uses the runtime message request and existing styles by default', async () => {
    addNavigationFabs();
    const style = document.createElement('style');
    style.setAttribute('data-messages-shortcuts-navigation-shortcut-styles', '');
    document.head.append(style);
    const localThis = vi.fn(async () => ({
      'start-chat': 'Ctrl+Shift+S',
      'open-archived': 'Ctrl+Shift+A',
      'open-spam-blocked': 'Ctrl+Shift+B'
    }));

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      chromeApi: { runtime: { sendMessage: localThis } }
    });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(3);
    });

    expect(localThis).toHaveBeenCalledWith({ type: 'get-browser-command-labels' });
    expect(document.querySelectorAll('[data-messages-shortcuts-navigation-shortcut-styles]'))
      .toHaveLength(1);
  });

  it('adds a badge after Spam and blocked is injected after shortcut labels load', async () => {
    document.body.innerHTML = `<div ${ARCHIVED_FAB_ROW_ATTRIBUTE}>${startChatFabSurface}</div>`;
    const localThis = vi.fn(async () => ({
      'start-chat': 'Not assigned',
      'open-archived': 'Not assigned',
      'open-spam-blocked': 'Ctrl+Shift+B'
    }));

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: localThis
    });

    await Promise.resolve();
    const row = document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
    const startChatContainer = row.querySelector('mw-fab-link.start-chat');
    row.append(createSpamBlockedFab(startChatContainer, vi.fn()));

    await vi.waitFor(() => {
      expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(1);
    });
    expect(document.querySelector(BADGE_SELECTOR).textContent).toBe('Ctrl+Shift+B');
  });

  it('reuses the existing installation instead of requesting labels twice', async () => {
    addNavigationFabs();
    const localThis = vi.fn(async () => ({
      'start-chat': 'Ctrl+Shift+S',
      'open-archived': 'Ctrl+Shift+A',
      'open-spam-blocked': 'Ctrl+Shift+B'
    }));

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: localThis
    });
    const secondDisconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: localThis
    });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(3);
    });

    expect(localThis).toHaveBeenCalledTimes(1);
    expect(secondDisconnect).toBe(disconnect);
  });

  it('ignores a failed shortcut-label request after teardown', async () => {
    let rejectLabels;
    const localThis = () => new Promise((_resolve, reject) => {
      rejectLabels = reject;
    });

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: localThis
    });
    await vi.waitFor(() => {
      expect(typeof rejectLabels).toBe('function');
    });

    disconnect();
    disconnect = undefined;
    rejectLabels(new Error('commands unavailable'));
    await Promise.resolve();

    expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(0);
  });

  it('ignores a resolved shortcut-label request after teardown', async () => {
    let resolveLabels;
    const localThis = () => new Promise((resolve) => {
      resolveLabels = resolve;
    });

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: localThis
    });
    await vi.waitFor(() => {
      expect(typeof resolveLabels).toBe('function');
    });

    disconnect();
    disconnect = undefined;
    resolveLabels({
      'start-chat': 'Ctrl+Shift+S',
      'open-archived': 'Ctrl+Shift+A',
      'open-spam-blocked': 'Ctrl+Shift+B'
    });
    await Promise.resolve();

    expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(0);
  });

  it('marks the navigation tile row inert while a native dialog is visible', async () => {
    addNavigationFabs();

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: vi.fn(async () => ({
        'start-chat': 'Ctrl+Shift+S',
        'open-archived': 'Ctrl+Shift+A',
        'open-spam-blocked': 'Ctrl+Shift+B'
      }))
    });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(3);
    });

    const row = document.querySelector(`[${ARCHIVED_FAB_ROW_ATTRIBUTE}]`);
    expect(row.inert).toBe(false);
    expect(row.hasAttribute('data-messages-shortcuts-native-modal-open')).toBe(false);

    document.body.insertAdjacentHTML('beforeend', '<mat-dialog-container></mat-dialog-container>');

    await vi.waitFor(() => {
      expect(row.inert).toBe(true);
    });
    expect(row.hasAttribute('data-messages-shortcuts-native-modal-open')).toBe(true);
    expect(document.querySelector('a[data-e2e-start-button]').getAttribute('aria-disabled')).toBe('true');

    document.querySelector('mat-dialog-container').remove();

    await vi.waitFor(() => {
      expect(row.inert).toBe(false);
    });
    expect(row.hasAttribute('data-messages-shortcuts-native-modal-open')).toBe(false);
    expect(document.querySelector('a[data-e2e-start-button]').hasAttribute('aria-disabled')).toBe(false);
  });

  it('scopes badge styling under the navigation tile row', async () => {
    addNavigationFabs();

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: vi.fn(async () => ({
        'start-chat': 'Ctrl+Shift+S',
        'open-archived': 'Ctrl+Shift+A',
        'open-spam-blocked': 'Ctrl+Shift+B'
      }))
    });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(3);
    });

    const styles = document.querySelector('[data-messages-shortcuts-navigation-shortcut-styles]').textContent;

    expect(styles).toContain('.gm-nav-row');
    expect(styles).toContain('top: -6px');
    expect(styles).toContain('right: -2px');
    expect(styles).toContain('height: 16px');
    expect(styles).toContain('border: 1px solid #c4c7c5');
  });

  it('removes shortcut badges and styles during teardown', async () => {
    addNavigationFabs();

    disconnect = installNavigationFabShortcutBadges({
      documentRoot: document,
      getBrowserCommandLabels: vi.fn(async () => ({
        'start-chat': 'Ctrl+Shift+S',
        'open-archived': 'Ctrl+Shift+A',
        'open-spam-blocked': 'Ctrl+Shift+B'
      }))
    });

    await vi.waitFor(() => {
      expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(3);
    });

    disconnect();
    disconnect = undefined;

    expect(document.querySelectorAll(BADGE_SELECTOR)).toHaveLength(0);
    expect(document.querySelector('[data-messages-shortcuts-navigation-shortcut-styles]'))
      .toBeNull();
  });
});
