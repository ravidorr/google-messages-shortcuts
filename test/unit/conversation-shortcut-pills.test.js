import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_BLOCK_REPORT_SPAM,
  COMMAND_MARK_UNREAD,
  COMMAND_TRASH
} from '../../src/shared/commands.js';
import { getCommandIcon } from '../../src/shared/command-icons.js';
import { resetActionFeedbackForTests } from '../../src/content/action-feedback.js';
import {
  PILL_VISIBILITY_HIDDEN,
  PILL_VISIBILITY_HOVER_OR_FOCUS,
  PILL_VISIBILITY_SELECTED_ROW_ONLY
} from '../../src/shared/pill-visibility-preference.js';
import {
  getConversationRowForUnreadMutation,
  installConversationShortcutPills,
  resetConversationShortcutPillInstallationsForTests,
  safeDomMutation
} from '../../src/content/conversation-shortcut-pills.js';
import { archivedModalSurface } from '../fixtures/dom/list-states.js';

function createConversationRow({ focused = false, unread = true } = {}) {
  const row = document.createElement('mws-conversation-list-item');
  const link = document.createElement('a');
  const menuButton = document.createElement('button');

  link.setAttribute('aria-selected', 'false');
  menuButton.setAttribute('aria-haspopup', 'menu');
  row.append(link, menuButton);

  if (unread) {
    const unreadMarker = document.createElement('span');
    unreadMarker.setAttribute('data-e2e-is-unread', 'true');
    row.append(unreadMarker);
  }

  if (focused) {
    row.setAttribute('is-focused', 'true');
  }

  return row;
}

function trustedPillInstallOptions(overrides = {}) {
  return {
    isTrustedActivation: () => true,
    ...overrides
  };
}

function expectLucidePillIcon(pill, commandName) {
  const icon = getCommandIcon(commandName);
  const svg = pill.querySelector(`[data-messages-shortcuts-pill-icon="${commandName}"]`);

  expect(svg).not.toBeNull();
  expect(svg.getAttribute('aria-hidden')).toBe('true');
  expect(svg.getAttribute('fill')).toBe('none');
  expect(svg.getAttribute('focusable')).toBe('false');
  expect(svg.getAttribute('stroke')).toBe('currentColor');
  expect(svg.getAttribute('stroke-linecap')).toBe('round');
  expect(svg.getAttribute('stroke-linejoin')).toBe('round');
  expect(svg.getAttribute('stroke-width')).toBe('2');
  expect(svg.getAttribute('viewBox')).toBe(icon.viewBox);
  expect([...svg.querySelectorAll('path')].map((path) => path.getAttribute('d')))
    .toEqual(icon.paths);
}

describe('conversation shortcut pills', () => {
  let disconnect;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    disconnect?.();
    disconnect = undefined;
    resetActionFeedbackForTests();
  });

  it('does not render extension pills inside the archived modal', async () => {
    document.body.innerHTML = archivedModalSurface;
    const row = document.getElementById('fixture-archived-row');
    const getShortcutLabels = vi.fn(async () => ({
      archive: 'Ctrl+Shift+Y',
      trash: 'Not assigned',
      markRead: 'Ctrl+Shift+K',
      markUnread: 'Ctrl+Shift+U'
    }));

    row.setAttribute('is-focused', 'true');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels
    });

    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(getShortcutLabels).toHaveBeenCalledTimes(1);
    });
    await new Promise((resolve) => setTimeout(resolve));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
    expect(row.querySelector('[data-messages-shortcuts-pill-group]')).toBeNull();
    expect(row.hasAttribute('data-messages-shortcuts-pill-host')).toBe(false);
  });

  it('renders pill-only actions without undefined shortcut labels in tooltips', async () => {
    const row = createConversationRow({ focused: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U',
        mute: 'Not assigned',
        unmute: 'Not assigned'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_BLOCK_REPORT_SPAM}"]`)).not.toBeNull();
    });

    const blockPill = row.querySelector(`[data-command="${COMMAND_BLOCK_REPORT_SPAM}"]`);

    expect(blockPill.getAttribute('aria-label')).toBe('Block / report spam conversation');
    expect(blockPill.getAttribute('title')).toBe('Block / report spam conversation');
    expect(blockPill.textContent).toBe('');
  });

  it('renders compact icon-and-shortcut pills for the focused row', async () => {
    const row = createConversationRow({ focused: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Not assigned',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    expect(row.hasAttribute('data-messages-shortcuts-pill-host')).toBe(true);
    const archivePill = row.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`);
    const trashPill = row.querySelector(`[data-command="${COMMAND_TRASH}"]`);

    expect(archivePill.getAttribute('aria-label')).toBe('Archive conversation, Ctrl+Shift+Y');
    expect(archivePill.getAttribute('title')).toBe('Archive conversation, Ctrl+Shift+Y');
    expect(archivePill.textContent).toBe('Ctrl+Shift+Y');
    expectLucidePillIcon(archivePill, COMMAND_ARCHIVE);
    expect(trashPill.getAttribute('aria-label')).toBe('Trash conversation');
    expect(trashPill.getAttribute('title')).toBe('Trash conversation');
    expect(trashPill.textContent).toBe('');
    expectLucidePillIcon(trashPill, COMMAND_TRASH);
  });

  it('adds dark pill tokens without changing light pill styles', () => {
    disconnect = installConversationShortcutPills({ documentRoot: document });
    const localThis = document.querySelector('[data-messages-shortcuts-pill-styles]').textContent;

    expect(localThis).toContain('background: #ffffff');
    expect(localThis).toContain('[data-messages-shortcuts-theme="dark"]');
    expect(localThis).toContain('background: #303134');
    expect(localThis).toContain('border-color: #5f6368');
    expect(localThis).toContain('color: #8ab4f8');
    expect(localThis).toContain('outline-color: #8ab4f8');
    expect(localThis).toContain(':focus-visible');
  });

  it('uses and updates the native theme for visible pill hosts without refetching labels', async () => {
    const wrapper = document.createElement('aside');
    wrapper.style.backgroundColor = 'rgb(32, 33, 36)';
    const row = createConversationRow({ focused: true });
    const localThis = vi.fn(async () => ({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D'
    }));
    wrapper.append(row);
    document.body.append(wrapper);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: localThis
    });

    await vi.waitFor(() => {
      expect(row.getAttribute('data-messages-shortcuts-theme')).toBe('dark');
    });
    const group = row.querySelector('[data-messages-shortcuts-pill-group]');
    wrapper.style.backgroundColor = 'rgb(240, 244, 249)';

    await vi.waitFor(() => {
      expect(row.getAttribute('data-messages-shortcuts-theme')).toBe('light');
    });

    expect(row.querySelector('[data-messages-shortcuts-pill-group]')).toBe(group);
    expect(localThis).toHaveBeenCalledTimes(1);
  });

  it('renders unassigned shortcut pills as icons only', async () => {
    const row = createConversationRow({ focused: true, unread: false });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Not assigned',
        markRead: 'Not assigned',
        markUnread: 'Not assigned'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    expect(row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`).textContent)
      .toBe('');
    expect(row.querySelector(`[data-command="${COMMAND_TRASH}"]`).textContent)
      .toBe('');
    expect(
      row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`)
        .querySelector(`[data-messages-shortcuts-pill-icon="${COMMAND_MARK_UNREAD}"]`)
    ).not.toBeNull();
  });

  it('renders a Mark as unread pill for read conversations', async () => {
    const row = createConversationRow({ focused: true, unread: false });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    const markUnreadPill = row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`);

    expect(markUnreadPill).not.toBeNull();
    expect(markUnreadPill.getAttribute('aria-label')).toBe(
      'Mark as unread conversation, Ctrl+Shift+U'
    );
    expect(markUnreadPill.getAttribute('title')).toBe(
      'Mark as unread conversation, Ctrl+Shift+U'
    );
    expect(markUnreadPill.textContent).toBe('Ctrl+Shift+U');
    expectLucidePillIcon(markUnreadPill, COMMAND_MARK_UNREAD);
  });

  it('omits the Mark as unread pill for unread conversations', async () => {
    const row = createConversationRow({ focused: true, unread: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    expect(row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`)).toBeNull();
    expect(row.querySelector(`[data-command="${COMMAND_MARK_READ}"]`)).not.toBeNull();
  });

  it('runs the mark-unread command from its pill', async () => {
    const row = createConversationRow({ focused: true, unread: false });
    const runAction = vi.fn(async () => ({ ok: true }));
    document.body.append(row);

    disconnect = installConversationShortcutPills(trustedPillInstallOptions({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      runAction
    }));

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`)).not.toBeNull();
    });

    row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`).click();
    await Promise.resolve();

    expect(runAction).toHaveBeenCalledWith(COMMAND_MARK_UNREAD, row);
  });

  it('does not propagate shortcut pill clicks to the conversation row', async () => {
    const row = createConversationRow({ focused: true, unread: false });
    const rowClick = vi.fn();
    const runAction = vi.fn(async () => ({ ok: true }));
    row.addEventListener('click', rowClick);
    document.body.append(row);

    disconnect = installConversationShortcutPills(trustedPillInstallOptions({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      runAction
    }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    row.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`).click();
    await Promise.resolve();

    expect(runAction).toHaveBeenCalledWith(COMMAND_ARCHIVE, row);
    expect(rowClick).not.toHaveBeenCalled();
  });

  it('ignores untrusted shortcut pill clicks from page scripts', async () => {
    const row = createConversationRow({ focused: true, unread: false });
    const runAction = vi.fn(async () => ({ ok: true }));
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      runAction
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    row.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`).click();
    await Promise.resolve();

    expect(runAction).not.toHaveBeenCalled();
  });

  it('removes the Mark as unread pill after a successful mark-unread action', async () => {
    const row = createConversationRow({ focused: true, unread: false });
    const runAction = vi.fn(async (command, conversationRow) => {
      if (command === COMMAND_MARK_UNREAD) {
        const unreadMarker = document.createElement('span');
        unreadMarker.setAttribute('data-e2e-is-unread', 'true');
        conversationRow.append(unreadMarker);
      }

      return { ok: true };
    });
    document.body.append(row);

    disconnect = installConversationShortcutPills(trustedPillInstallOptions({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      runAction
    }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`).click();

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`)).toBeNull();
      expect(row.querySelector(`[data-command="${COMMAND_MARK_READ}"]`)).not.toBeNull();
    });
    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
  });

  it('ignores unread mutation records outside conversation rows', () => {
    const unrelatedNode = document.createElement('div');
    const localThis = {
      attributeRecord: {
        type: 'attributes',
        attributeName: 'data-e2e-is-unread',
        target: unrelatedNode
      },
      childListRecord: {
        type: 'childList',
        target: unrelatedNode,
        addedNodes: [document.createElement('span')],
        removedNodes: []
      }
    };

    expect(getConversationRowForUnreadMutation(localThis.attributeRecord)).toBeNull();
    expect(getConversationRowForUnreadMutation(localThis.childListRecord)).toBeNull();
    expect(getConversationRowForUnreadMutation({
      type: 'attributes',
      attributeName: 'data-e2e-is-unread',
      target: document
    })).toBeNull();
  });

  it('matches unread mutation records inside conversation rows', () => {
    const row = createConversationRow({ unread: false });
    const unreadMarker = document.createElement('span');

    unreadMarker.setAttribute('data-e2e-is-unread', 'true');
    document.body.append(row);

    expect(getConversationRowForUnreadMutation({
      type: 'attributes',
      attributeName: 'data-e2e-is-unread',
      target: row
    })).toBe(row);
    expect(getConversationRowForUnreadMutation({
      type: 'childList',
      target: row,
      addedNodes: [unreadMarker],
      removedNodes: []
    })).toBe(row);
    expect(getConversationRowForUnreadMutation({
      type: 'childList',
      target: row,
      addedNodes: [document.createElement('span')],
      removedNodes: []
    })).toBeNull();
    expect(getConversationRowForUnreadMutation({
      type: 'other',
      target: row
    })).toBeNull();
  });

  it('ignores unrelated DOM mutations when watching unread state', async () => {
    const row = createConversationRow({ focused: true, unread: false });
    const getShortcutLabels = vi.fn(async () => ({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D',
      markUnread: 'Ctrl+Shift+U'
    }));

    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    getShortcutLabels.mockClear();

    const unrelated = document.createElement('div');
    document.body.append(unrelated);
    unrelated.append(document.createElement('span'));

    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(getShortcutLabels).not.toHaveBeenCalled();
    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
  });

  it('refreshes pills when the unread marker is added to a visible row', async () => {
    const row = createConversationRow({ focused: true, unread: false });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    const unreadMarker = document.createElement('span');
    unreadMarker.setAttribute('data-e2e-is-unread', 'true');
    row.append(unreadMarker);

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`)).toBeNull();
      expect(row.querySelector(`[data-command="${COMMAND_MARK_READ}"]`)).not.toBeNull();
    });
    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
  });

  it('refreshes pills when the unread marker is removed from a visible row', async () => {
    const row = createConversationRow({ focused: true, unread: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    row.querySelector('[data-e2e-is-unread="true"]').remove();

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_MARK_READ}"]`)).toBeNull();
      expect(row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`)).not.toBeNull();
    });
    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
  });

  it('refreshes pills when the unread marker attribute changes', async () => {
    const row = createConversationRow({ focused: true, unread: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    row.querySelector('[data-e2e-is-unread="true"]').setAttribute('data-e2e-is-unread', 'false');

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_MARK_READ}"]`)).toBeNull();
      expect(row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`)).not.toBeNull();
    });
    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
  });

  it('skips pill refresh after mark-unread when the row is no longer active', async () => {
    const row = createConversationRow({ unread: false });
    let finishAction;
    const getShortcutLabels = vi.fn(async () => ({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D',
      markUnread: 'Ctrl+Shift+U'
    }));
    const runAction = vi.fn(() => new Promise((resolve) => {
      finishAction = () => resolve({ ok: true });
    }));
    document.body.append(row);

    disconnect = installConversationShortcutPills(trustedPillInstallOptions({
      documentRoot: document,
      getShortcutLabels,
      runAction
    }));
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    row.querySelector(`[data-command="${COMMAND_MARK_UNREAD}"]`).click();
    await Promise.resolve();
    row.dispatchEvent(new Event('pointerout', { bubbles: true }));
    finishAction();
    await Promise.resolve();

    expect(getShortcutLabels).toHaveBeenCalledTimes(1);
    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('does not open conversations when a row is hovered by default', () => {
    const firstRow = createConversationRow();
    const secondRow = createConversationRow();
    const firstLink = firstRow.querySelector('a');
    const secondLink = secondRow.querySelector('a');
    document.body.append(firstRow, secondRow);
    vi.spyOn(firstLink, 'click');
    vi.spyOn(secondLink, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    firstLink.dispatchEvent(new Event('pointerover', { bubbles: true }));

    expect(firstLink.click).not.toHaveBeenCalled();
    expect(secondLink.click).not.toHaveBeenCalled();
  });

  it('opens a conversation when hovering is enabled', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      isAutoOpenEnabled: vi.fn(async () => true)
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(link.click).toHaveBeenCalledTimes(1);
    });
  });

  it('does not open a row after the pointer leaves before opening is enabled', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    let resolveAutoOpenEnabled;
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      isAutoOpenEnabled: () => new Promise((resolve) => {
        resolveAutoOpenEnabled = resolve;
      })
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    await Promise.resolve();
    row.dispatchEvent(new Event('pointerout', { bubbles: true }));
    resolveAutoOpenEnabled(true);

    await Promise.resolve();

    expect(link.click).not.toHaveBeenCalled();
  });

  it('does not open a row removed before opening is enabled', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    let resolveAutoOpenEnabled;
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      isAutoOpenEnabled: () => new Promise((resolve) => {
        resolveAutoOpenEnabled = resolve;
      })
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    await Promise.resolve();
    row.remove();
    resolveAutoOpenEnabled(true);

    await Promise.resolve();

    expect(link.click).not.toHaveBeenCalled();
  });

  it('does not open either row link when an incidental link is hovered', () => {
    const row = createConversationRow();
    const conversationLink = row.querySelector('a');
    const incidentalLink = document.createElement('a');
    row.prepend(incidentalLink);
    document.body.append(row);
    vi.spyOn(conversationLink, 'click');
    vi.spyOn(incidentalLink, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    incidentalLink.dispatchEvent(new Event('pointerover', { bubbles: true }));

    expect(conversationLink.click).not.toHaveBeenCalled();
    expect(incidentalLink.click).not.toHaveBeenCalled();
  });

  it('opens a hovered row without an aria-selected anchor when opening is enabled', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    link.removeAttribute('aria-selected');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      isAutoOpenEnabled: vi.fn(async () => true)
    });
    link.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(link.click).toHaveBeenCalledTimes(1);
    });
  });

  it('does not open the conversation when keyboard focus enters its row', () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(link.click).not.toHaveBeenCalled();
  });

  it('opens a conversation when focus enters its row and opening is enabled', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      isAutoOpenEnabled: vi.fn(async () => true)
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    await vi.waitFor(() => {
      expect(link.click).toHaveBeenCalledTimes(1);
    });
  });

  it('does not open a conversation when Google Messages marks its row as focused', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    row.setAttribute('is-focused', 'true');

    await Promise.resolve();

    expect(link.click).not.toHaveBeenCalled();
  });

  it('opens a conversation when Google Messages focuses its row and opening is enabled', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      isAutoOpenEnabled: vi.fn(async () => true)
    });
    row.setAttribute('is-focused', 'true');

    await vi.waitFor(() => {
      expect(link.click).toHaveBeenCalledTimes(1);
    });
  });

  it('does not open a hovered conversation when Google Messages marks it as focused', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    link.dispatchEvent(new Event('pointerover', { bubbles: true }));
    row.setAttribute('is-focused', 'true');

    await new Promise((resolve) => setTimeout(resolve));

    expect(link.click).not.toHaveBeenCalled();
  });

  it('does not open a conversation when focus moves within its row', () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    const menuButton = row.querySelector('button');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    menuButton.dispatchEvent(new FocusEvent('focusin', {
      bubbles: true,
      relatedTarget: link
    }));

    expect(link.click).not.toHaveBeenCalled();
  });

  it('does not open dynamically rendered rows or shortcut pill interactions', async () => {
    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    const row = createConversationRow({ focused: true });
    const link = row.querySelector('a');
    document.body.append(row);
    vi.spyOn(link, 'click');

    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelector('[data-messages-shortcuts-pill]')).not.toBeNull();
    });
    expect(link.click).not.toHaveBeenCalled();
    row.querySelector('[data-messages-shortcuts-pill]').dispatchEvent(
      new Event('pointerover', { bubbles: true })
    );
    row.querySelector('[data-messages-shortcuts-pill]').dispatchEvent(
      new FocusEvent('focusin', { bubbles: true })
    );

    expect(link.click).not.toHaveBeenCalled();
  });

  it('runs an action against the row that owns its pill', async () => {
    const selectedRow = createConversationRow({ focused: true });
    const pillRow = createConversationRow();
    const runAction = vi.fn(async () => ({ ok: true }));
    document.body.append(selectedRow, pillRow);

    disconnect = installConversationShortcutPills(trustedPillInstallOptions({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      runAction
    }));
    pillRow.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(pillRow.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    pillRow.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`).click();
    await Promise.resolve();

    expect(runAction).toHaveBeenCalledWith(COMMAND_ARCHIVE, pillRow);
    expect(runAction).not.toHaveBeenCalledWith(COMMAND_ARCHIVE, selectedRow);
  });

  it('removes pills after leaving an unfocused row', async () => {
    const row = createConversationRow();
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    row.dispatchEvent(new Event('pointerout', { bubbles: true }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
    expect(row.hasAttribute('data-messages-shortcuts-pill-host')).toBe(false);
  });

  it('removes pills once when a pointerout handler runs re-entrantly', async () => {
    const row = createConversationRow();
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelector('[data-messages-shortcuts-pill-group]')).not.toBeNull();
    });
    const pillGroup = row.querySelector('[data-messages-shortcuts-pill-group]');
    const nativeRemove = pillGroup.remove.bind(pillGroup);
    let removeCalls = 0;
    vi.spyOn(pillGroup, 'remove').mockImplementation(() => {
      removeCalls += 1;

      if (removeCalls === 1) {
        row.dispatchEvent(new Event('pointerout', { bubbles: true }));

        if (!pillGroup.parentElement) {
          throw new DOMException('The pill group was already removed.', 'NotFoundError');
        }
      }

      nativeRemove();
    });

    expect(() => {
      row.dispatchEvent(new Event('pointerout', { bubbles: true }));
    }).not.toThrow();
    expect(removeCalls).toBe(1);
    expect(row.querySelector('[data-messages-shortcuts-pill-group]')).toBeNull();
  });

  it('contains a NotFoundError raised while removing pills', async () => {
    const row = createConversationRow();
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelector('[data-messages-shortcuts-pill-group]')).not.toBeNull();
    });
    const pillGroup = row.querySelector('[data-messages-shortcuts-pill-group]');
    vi.spyOn(pillGroup, 'remove').mockImplementation(() => {
      throw new DOMException(
        "Failed to execute 'remove' on 'Element': The node to be removed is no longer a child of this node.",
        'NotFoundError'
      );
    });

    expect(() => {
      row.dispatchEvent(new Event('pointerout', { bubbles: true }));
    }).not.toThrow();
  });

  it('contains a NotFoundError raised while appending pills', async () => {
    const row = createConversationRow();
    const nativeAppend = row.append.bind(row);
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    vi.spyOn(row, 'append').mockImplementation((node) => {
      if (node instanceof Element && node.hasAttribute('data-messages-shortcuts-pill-group')) {
        throw new DOMException(
          "Failed to execute 'append' on 'Element': The node is no longer connected.",
          'NotFoundError'
        );
      }

      return nativeAppend(node);
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelector('[data-messages-shortcuts-pill-group]')).toBeNull();
    });
  });

  it('rethrows unexpected errors from safeDomMutation', () => {
    expect(() => {
      safeDomMutation(() => {
        throw new TypeError('Unexpected failure');
      });
    }).toThrow('Unexpected failure');
  });

  it('contains NotFoundError from safeDomMutation', () => {
    expect(() => {
      safeDomMutation(() => {
        throw new DOMException(
          "Failed to execute 'remove' on 'Element': The node to be removed is no longer a child of this node.",
          'NotFoundError'
        );
      });
    }).not.toThrow();
  });

  it('removes pills when the pointer leaves an unfocused row through a pill', async () => {
    const row = createConversationRow();
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    row.querySelector('[data-messages-shortcuts-pill]').dispatchEvent(
      new Event('pointerout', { bubbles: true })
    );

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('renders pills when Google Messages marks a row as focused', async () => {
    const row = createConversationRow();
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    row.setAttribute('is-focused', 'true');

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
  });

  it('removes pills when Google Messages removes focus from a row', async () => {
    const row = createConversationRow({ focused: true });
    const link = row.querySelector('a');
    document.body.append(row);
    vi.spyOn(link, 'click');

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    row.setAttribute('is-focused', 'false');

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
    });
    expect(link.click).not.toHaveBeenCalled();
  });

  it('keeps pills while a row remains hovered after focus leaves', async () => {
    const row = createConversationRow({ focused: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    row.setAttribute('is-focused', 'false');

    await Promise.resolve();

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    row.dispatchEvent(new Event('pointerout', { bubbles: true }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('does not treat an injected pill interaction as a row hover', async () => {
    const row = createConversationRow();
    const getShortcutLabels = vi.fn(async () => ({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D'
    }));
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    row.querySelector('[data-messages-shortcuts-pill]').dispatchEvent(
      new Event('pointerover', { bubbles: true })
    );

    expect(getShortcutLabels).toHaveBeenCalledTimes(1);
  });

  it('runs the trash command from its trash pill', async () => {
    const row = createConversationRow({ focused: true });
    const runAction = vi.fn(async () => ({ ok: true }));
    document.body.append(row);

    disconnect = installConversationShortcutPills(trustedPillInstallOptions({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      runAction
    }));

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_TRASH}"]`)).not.toBeNull();
    });

    row.querySelector(`[data-command="${COMMAND_TRASH}"]`).click();
    await Promise.resolve();

    expect(runAction).toHaveBeenCalledWith(COMMAND_TRASH, row);
  });

  it('renders pills when focus enters a conversation row', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
  });

  it('keeps pills when the pointer leaves a browser-focused row', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    row.dispatchEvent(new Event('pointerout', { bubbles: true }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
  });

  it('removes pills when focus leaves an unfocused conversation row', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    link.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('keeps pills when focus moves within a conversation row', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    const menuButton = row.querySelector('button');
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    link.dispatchEvent(new FocusEvent('focusout', {
      bubbles: true,
      relatedTarget: menuButton
    }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
  });

  it('keeps pills when browser focus leaves a Google Messages-focused row', async () => {
    const row = createConversationRow({ focused: true });
    const link = row.querySelector('a');
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    link.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
  });

  it('ignores mutation records whose target is not an element', () => {
    const NativeMutationObserver = globalThis.MutationObserver;
    const observerCallbacks = [];

    globalThis.MutationObserver = class {
      constructor(callback) {
        observerCallbacks.push(callback);
      }

      disconnect() {}

      observe() {}
    };

    try {
      disconnect = installConversationShortcutPills({
        documentRoot: document,
        getShortcutLabels: vi.fn()
      });

      observerCallbacks[0]([{ target: document }]);
      observerCallbacks[1]([{
        type: 'attributes',
        attributeName: 'data-e2e-is-unread',
        target: document
      }]);
      observerCallbacks[1]([{
        type: 'childList',
        target: document.body,
        addedNodes: [document.createElement('span')],
        removedNodes: []
      }]);
      observerCallbacks[1]([{
        type: 'other',
        target: document.body
      }]);
      observerCallbacks[2]([{ target: document }]);
    } finally {
      globalThis.MutationObserver = NativeMutationObserver;
    }
  });

  it('ignores focus events outside a conversation row', async () => {
    const getShortcutLabels = vi.fn(async () => ({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D'
    }));

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels
    });
    document.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    await Promise.resolve();

    expect(getShortcutLabels).not.toHaveBeenCalled();
  });

  it('ignores document, nested-row, and injected-pill pointer events', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    const getShortcutLabels = vi.fn(async () => ({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D'
    }));
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels
    });
    document.dispatchEvent(new Event('pointerover', { bubbles: true }));
    link.dispatchEvent(new MouseEvent('pointerover', {
      bubbles: true,
      relatedTarget: row
    }));

    expect(getShortcutLabels).not.toHaveBeenCalled();
  });

  it('uses the default action handler for an archive pill', async () => {
    const row = createConversationRow({ focused: true });
    const menuButton = row.querySelector('button[aria-haspopup="menu"]');
    const archiveMenuItem = document.createElement('button');
    archiveMenuItem.setAttribute('data-e2e-conversation-menu-archive', '');
    document.body.append(row, archiveMenuItem);
    vi.spyOn(menuButton, 'click');
    vi.spyOn(archiveMenuItem, 'click');

    disconnect = installConversationShortcutPills(trustedPillInstallOptions({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    }));

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`)).not.toBeNull();
    });
    row.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`).click();

    await vi.waitFor(() => {
      expect(menuButton.click).toHaveBeenCalledTimes(1);
      expect(archiveMenuItem.click).toHaveBeenCalledTimes(1);
    });
  });

  it('does not render pills when a row is removed before labels resolve', async () => {
    const row = createConversationRow();
    let resolveLabels;
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: () => new Promise((resolve) => {
        resolveLabels = resolve;
      })
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    await Promise.resolve();
    row.remove();
    resolveLabels({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D'
    });

    await new Promise((resolve) => setTimeout(resolve));

    expect(row.querySelector('[data-messages-shortcuts-pill-group]')).toBeNull();
  });

  it('does not render pills after leaving an unfocused row before labels resolve', async () => {
    const row = createConversationRow();
    let resolveLabels;
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: () => new Promise((resolve) => {
        resolveLabels = resolve;
      })
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    await Promise.resolve();
    row.dispatchEvent(new Event('pointerout', { bubbles: true }));
    resolveLabels({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D'
    });

    await new Promise((resolve) => setTimeout(resolve));

    expect(row.querySelector('[data-messages-shortcuts-pill-group]')).toBeNull();
  });

  it('retries shortcut label loading after a transient failure', async () => {
    const row = createConversationRow();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const getShortcutLabels = vi.fn()
      .mockRejectedValueOnce(new Error('Service worker unavailable'))
      .mockResolvedValueOnce({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(warning).toHaveBeenCalledWith(
        '[Messages Shortcut Actions] Failed to load conversation shortcut labels.',
        expect.any(Error)
      );
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    expect(getShortcutLabels).toHaveBeenCalledTimes(2);
    warning.mockRestore();
  });

  it('ignores stale disconnect callbacks from prior installations', () => {
    const staleCallback = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

    resetConversationShortcutPillInstallationsForTests(document);
    staleCallback();

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

    staleCallback();

    expect(document.querySelector('[data-messages-shortcuts-pill-styles]')).not.toBeNull();

    disconnect();
    disconnect = undefined;
  });

  it('ignores stale disconnect callbacks whose token is not in the active installation', () => {
    const staleCallback = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

    resetConversationShortcutPillInstallationsForTests(document);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

    staleCallback();

    disconnect();
    disconnect = undefined;
  });

  it('ignores reset requests when no installation is registered', () => {
    resetConversationShortcutPillInstallationsForTests(document);
  });

  it('ignores disconnect calls after the final installation is released', () => {
    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

    disconnect();
    disconnect();
    disconnect = undefined;

    expect(document.querySelector('[data-messages-shortcuts-pill-styles]')).toBeNull();
  });

  it('keeps pills while moving within a focused row and cleans up shared styles', async () => {
    const row = createConversationRow({ focused: true });
    const link = row.querySelector('a');
    document.body.append(row);

    const firstDisconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });
    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    row.dispatchEvent(new MouseEvent('pointerout', {
      bubbles: true,
      relatedTarget: link
    }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    firstDisconnect();

    expect(document.querySelector('[data-messages-shortcuts-pill-styles]')).not.toBeNull();
    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    expect(row.hasAttribute('data-messages-shortcuts-pill-host')).toBe(true);

    disconnect();

    expect(document.querySelector('[data-messages-shortcuts-pill-styles]')).toBeNull();
    expect(row.hasAttribute('data-messages-shortcuts-pill-host')).toBe(false);
    disconnect = undefined;
  });

  it('suppresses pills while the extension is paused', async () => {
    const row = createConversationRow({ focused: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPausedState: vi.fn(async () => true)
    });

    await Promise.resolve();

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('ignores unrelated storage changes for pause handling', async () => {
    const storageListeners = [];
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPausedState: vi.fn(async () => false)
    });

    storageListeners[0]({ autoConfirmTrash: { newValue: false } }, 'local');
    storageListeners[0]({ extensionPaused: { newValue: true } }, 'sync');
    storageListeners[0]({ extensionPaused: { newValue: false } }, 'local');

    expect(storageListeners).toHaveLength(1);
  });

  it('installs without storage when pause state cannot be read', async () => {
    const row = createConversationRow({ focused: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi: {},
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
  });

  it('does not show pills after labels load when pause state changed during fetch', async () => {
    const row = createConversationRow({ focused: true });
    const storageListeners = [];
    let resolveLabels;
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(() => new Promise((resolve) => {
        resolveLabels = resolve;
      })),
      getPausedState: vi.fn(async () => false)
    });

    await vi.waitFor(() => {
      expect(typeof resolveLabels).toBe('function');
    });

    storageListeners[0]({ extensionPaused: { newValue: true } }, 'local');
    resolveLabels({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D',
      markRead: 'Ctrl+Shift+K',
      markUnread: 'Ctrl+Shift+U'
    });
    await Promise.resolve();

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('removes pills when pause state changes in storage', async () => {
    const row = createConversationRow({ focused: true });
    const storageListeners = [];
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPausedState: vi.fn(async () => false)
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    storageListeners[0]({ extensionPaused: { newValue: true } }, 'local');

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('suppresses pills when visibility is hidden', async () => {
    const row = createConversationRow({ focused: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_HIDDEN)
    });

    await Promise.resolve();

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('keeps a live visibility change when the initial preference read resolves late', async () => {
    const row = createConversationRow({ focused: true });
    const storageListeners = [];
    let resolvePillVisibilityState;
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: () => new Promise((resolve) => {
        resolvePillVisibilityState = resolve;
      })
    });

    storageListeners[0]({ pillVisibility: { newValue: PILL_VISIBILITY_HIDDEN } }, 'local');
    resolvePillVisibilityState(PILL_VISIBILITY_HOVER_OR_FOCUS);

    await new Promise((resolve) => setTimeout(resolve));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('shows pills only on Google Messages focused rows in selected-row-only mode', async () => {
    const focusedRow = createConversationRow({ focused: true });
    const hoveredRow = createConversationRow();
    document.body.append(focusedRow, hoveredRow);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_SELECTED_ROW_ONLY)
    });

    hoveredRow.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(focusedRow.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    expect(hoveredRow.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('removes pills when Google Messages focus leaves in selected-row-only mode even while hovered', async () => {
    const row = createConversationRow({ focused: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_SELECTED_ROW_ONLY)
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    row.setAttribute('is-focused', 'false');

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
    });
  });

  it('ignores browser keyboard focus in selected-row-only mode', async () => {
    const row = createConversationRow();
    const link = row.querySelector('a');
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_SELECTED_ROW_ONLY)
    });
    link.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    await Promise.resolve();

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('removes hover pills when visibility changes to selected-row-only in storage', async () => {
    const row = createConversationRow();
    const storageListeners = [];
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_HOVER_OR_FOCUS)
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    storageListeners[0]({ pillVisibility: { newValue: PILL_VISIBILITY_SELECTED_ROW_ONLY } }, 'local');

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('removes all pills when visibility changes to hidden in storage', async () => {
    const row = createConversationRow({ focused: true });
    const storageListeners = [];
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_HOVER_OR_FOCUS)
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });

    storageListeners[0]({ pillVisibility: { newValue: PILL_VISIBILITY_HIDDEN } }, 'local');

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('shows hover pills after visibility changes from hidden to hover-or-focus', async () => {
    const row = createConversationRow();
    const storageListeners = [];
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_HIDDEN)
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await Promise.resolve();

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);

    storageListeners[0]({ pillVisibility: { newValue: PILL_VISIBILITY_HOVER_OR_FOCUS } }, 'local');
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(6);
    });
  });

  it('does not show pills after labels load when visibility changed to hidden during fetch', async () => {
    const row = createConversationRow();
    const storageListeners = [];
    let resolveLabels;
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(() => new Promise((resolve) => {
        resolveLabels = resolve;
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_HOVER_OR_FOCUS)
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(typeof resolveLabels).toBe('function');
    });

    storageListeners[0]({ pillVisibility: { newValue: PILL_VISIBILITY_HIDDEN } }, 'local');
    resolveLabels({
      archive: 'Ctrl+Shift+Y',
      trash: 'Ctrl+Shift+D',
      markRead: 'Ctrl+Shift+K',
      markUnread: 'Ctrl+Shift+U'
    });
    await Promise.resolve();

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(0);
  });

  it('ignores unrelated storage changes for visibility handling', async () => {
    const storageListeners = [];
    const chromeApi = {
      storage: {
        onChanged: {
          addListener: vi.fn((listener) => {
            storageListeners.push(listener);
          }),
          removeListener: vi.fn()
        }
      }
    };

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      chromeApi,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D',
        markRead: 'Ctrl+Shift+K',
        markUnread: 'Ctrl+Shift+U'
      })),
      getPillVisibilityState: vi.fn(async () => PILL_VISIBILITY_HOVER_OR_FOCUS)
    });

    storageListeners[0]({ autoConfirmTrash: { newValue: false } }, 'local');
    storageListeners[0]({ pillVisibility: { newValue: 'unsupported' } }, 'local');

    expect(storageListeners).toHaveLength(1);
  });

  it('logs an action failure without propagating the click event', async () => {
    const row = createConversationRow({ focused: true });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.append(row);

    disconnect = installConversationShortcutPills(trustedPillInstallOptions({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      runAction: vi.fn(async () => {
        throw new Error('Action failed');
      })
    }));

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`)).not.toBeNull();
    });
    row.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`).click();

    await vi.waitFor(() => {
      expect(warning).toHaveBeenCalledWith(
        '[Messages Shortcut Actions] Failed to run conversation shortcut pill.',
        expect.any(Error)
      );
    });
    warning.mockRestore();
  });
});
