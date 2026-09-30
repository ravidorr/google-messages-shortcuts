import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COMMAND_ARCHIVE, COMMAND_TRASH } from '../../src/shared/commands.js';
import { installConversationShortcutPills } from '../../src/content/conversation-shortcut-pills.js';

function createConversationRow({ focused = false } = {}) {
  const row = document.createElement('mws-conversation-list-item');
  const link = document.createElement('a');
  const menuButton = document.createElement('button');

  link.setAttribute('aria-selected', 'false');
  menuButton.setAttribute('aria-haspopup', 'menu');
  row.append(link, menuButton);

  if (focused) {
    row.setAttribute('is-focused', 'true');
  }

  return row;
}

describe('conversation shortcut pills', () => {
  let disconnect;

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    disconnect?.();
    disconnect = undefined;
  });

  it('renders effective shortcut labels for the focused row', async () => {
    const row = createConversationRow({ focused: true });
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Not assigned'
      }))
    });

    await vi.waitFor(() => {
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    });

    expect(row.hasAttribute('data-messages-shortcuts-pill-host')).toBe(true);
    expect(row.textContent).toContain('Ctrl+Shift+Y');
    expect(row.textContent).toContain('Not assigned');
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

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      runAction
    });
    pillRow.dispatchEvent(new Event('pointerover', { bubbles: true }));

    await vi.waitFor(() => {
      expect(pillRow.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    });

    pillRow.querySelector(`[data-command="${COMMAND_ARCHIVE}"]`).click();

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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    row.setAttribute('is-focused', 'false');

    await Promise.resolve();

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      runAction
    });

    await vi.waitFor(() => {
      expect(row.querySelector(`[data-command="${COMMAND_TRASH}"]`)).not.toBeNull();
    });

    row.querySelector(`[data-command="${COMMAND_TRASH}"]`).click();

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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    });
    row.dispatchEvent(new Event('pointerover', { bubbles: true }));
    row.dispatchEvent(new Event('pointerout', { bubbles: true }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    });
    link.dispatchEvent(new FocusEvent('focusout', {
      bubbles: true,
      relatedTarget: menuButton
    }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    });
    link.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
  });

  it('ignores mutation records whose target is not an element', () => {
    const NativeMutationObserver = globalThis.MutationObserver;
    let observerCallback;

    globalThis.MutationObserver = class {
      constructor(callback) {
        observerCallback = callback;
      }

      disconnect() {}

      observe() {}
    };

    try {
      disconnect = installConversationShortcutPills({
        documentRoot: document,
        getShortcutLabels: vi.fn()
      });

      observerCallback([{ target: document }]);
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

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      }))
    });

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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    });

    expect(getShortcutLabels).toHaveBeenCalledTimes(2);
    warning.mockRestore();
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
      expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    });
    row.dispatchEvent(new MouseEvent('pointerout', {
      bubbles: true,
      relatedTarget: link
    }));

    expect(row.querySelectorAll('[data-messages-shortcuts-pill]')).toHaveLength(2);
    firstDisconnect();
    disconnect();

    expect(document.querySelector('[data-messages-shortcuts-pill-styles]')).toBeNull();
    expect(row.hasAttribute('data-messages-shortcuts-pill-host')).toBe(false);
    disconnect = undefined;
  });

  it('logs an action failure without propagating the click event', async () => {
    const row = createConversationRow({ focused: true });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    document.body.append(row);

    disconnect = installConversationShortcutPills({
      documentRoot: document,
      getShortcutLabels: vi.fn(async () => ({
        archive: 'Ctrl+Shift+Y',
        trash: 'Ctrl+Shift+D'
      })),
      runAction: vi.fn(async () => {
        throw new Error('Action failed');
      })
    });

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
