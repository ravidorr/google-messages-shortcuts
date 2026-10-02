import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  COMMAND_ARCHIVE,
  COMMAND_MARK_READ,
  COMMAND_MUTE,
  COMMAND_OPEN_ARCHIVED,
  COMMAND_TRASH,
  COMMAND_UNARCHIVE,
  COMMAND_UNMUTE
} from '../../src/shared/commands.js';
import * as rowActionRegistry from '../../src/content/row-action-registry.js';
import {
  FEEDBACK_MESSAGE_SELECTOR,
  FEEDBACK_ROOT_SELECTOR,
  getActionFeedbackMessage,
  resetActionFeedbackForTests,
  showActionFeedback
} from '../../src/content/action-feedback.js';

describe('action-feedback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    resetActionFeedbackForTests();
    vi.useRealTimers();
  });

  it('maps success results to action-specific copy', () => {
    const localThis = getActionFeedbackMessage({ ok: true }, COMMAND_ARCHIVE);

    expect(localThis).toEqual({
      kind: 'success',
      message: 'Conversation archived.'
    });
    expect(getActionFeedbackMessage({ ok: true }, COMMAND_MUTE)).toEqual({
      kind: 'success',
      message: 'Conversation muted.'
    });
    expect(getActionFeedbackMessage({ ok: true }, COMMAND_UNMUTE)).toEqual({
      kind: 'success',
      message: 'Conversation unmuted.'
    });
    expect(getActionFeedbackMessage({ ok: true }, COMMAND_UNARCHIVE)).toEqual({
      kind: 'success',
      message: 'Conversation unarchived.'
    });
    expect(getActionFeedbackMessage({ ok: true, alreadyOpen: true }, COMMAND_OPEN_ARCHIVED)).toEqual({
      kind: 'info',
      message: 'Archived is already open.'
    });
    expect(getActionFeedbackMessage({ ok: true, openedRoute: true }, COMMAND_OPEN_ARCHIVED)).toEqual({
      kind: 'success',
      message: 'Archived opened.'
    });
  });

  it('reports pending trash confirmation instead of success', () => {
    const localThis = getActionFeedbackMessage(
      { ok: true, pendingTrashConfirmation: true },
      COMMAND_TRASH
    );

    expect(localThis).toEqual({
      kind: 'info',
      message: 'Confirm Move to trash in the Google Messages dialog to finish.'
    });
  });

  it('reports pending read state instead of success for mark-as-read', () => {
    const localThis = getActionFeedbackMessage(
      { ok: true, readStatePending: true },
      COMMAND_MARK_READ
    );

    expect(localThis).toEqual({
      kind: 'info',
      message: 'Conversation opened. Unread status may still be updating.'
    });
  });

  it('maps failure reasons to safe recovery copy', () => {
    const reasons = [
      ['extension-paused', 'info'],
      ['no-target', 'info'],
      ['already-read', 'info'],
      ['already-unread', 'info'],
      ['already-muted', 'info'],
      ['not-muted', 'info'],
      ['archived-modal-required', 'info'],
      ['archived-entry-not-found', 'error'],
      ['archived-sidebar-only', 'info'],
      ['archived-modal-timeout', 'error'],
      ['unarchive-button-not-found', 'error'],
      ['action-in-progress', 'info'],
      ['capability-blocked', 'error'],
      ['menu-button-not-found', 'error'],
      ['conversation-link-not-found', 'error'],
      ['unknown-command', 'error'],
      ['execute-action-failed', 'error'],
      ['custom-reason', 'error']
    ];

    for (const [reason, kind] of reasons) {
      const localThis = getActionFeedbackMessage({ ok: false, reason }, COMMAND_TRASH);
      expect(localThis?.kind).toBe(kind);
      expect(localThis?.message).not.toContain('<');
    }

    expect(getActionFeedbackMessage({ ok: false, reason: '' }, COMMAND_TRASH)).toBeNull();
    expect(getActionFeedbackMessage({ ok: true }, 'unknown-command')).toEqual({
      kind: 'success',
      message: 'Action completed.'
    });

    vi.spyOn(rowActionRegistry, 'getRowAction').mockReturnValue({
      pillLabel: 'Custom action'
    });

    expect(getActionFeedbackMessage({ ok: true }, 'custom-command')).toEqual({
      kind: 'success',
      message: 'Custom action completed.'
    });
  });

  it('renders a polite live region without interpolating page content', () => {
    showActionFeedback({ ok: true }, COMMAND_MARK_READ);
    showActionFeedback({ ok: true }, COMMAND_MARK_READ);

    const root = document.querySelector(FEEDBACK_ROOT_SELECTOR);
    const message = document.querySelector(FEEDBACK_MESSAGE_SELECTOR);

    expect(root?.getAttribute('aria-live')).toBe('polite');
    expect(root?.getAttribute('role')).toBe('status');
    expect(message?.textContent).toBe('Conversation marked as read.');
    expect(message?.textContent).not.toContain('<');
    expect(document.querySelectorAll(FEEDBACK_ROOT_SELECTOR)).toHaveLength(1);
  });

  it('returns early when feedback copy is unavailable', () => {
    showActionFeedback({ ok: false, reason: '' }, COMMAND_ARCHIVE);

    expect(document.querySelector(FEEDBACK_ROOT_SELECTOR)).toBeNull();
  });

  it('returns early when the feedback message node is missing', () => {
    const root = document.createElement('div');
    root.setAttribute('data-messages-shortcuts-feedback', '');
    document.body.append(root);

    showActionFeedback({ ok: true }, COMMAND_ARCHIVE);

    expect(root.querySelector(FEEDBACK_MESSAGE_SELECTOR)).toBeNull();
  });

  it('hides feedback after the visible timeout', () => {
    showActionFeedback({ ok: false, reason: 'no-target' }, COMMAND_ARCHIVE);

    const message = document.querySelector(FEEDBACK_MESSAGE_SELECTOR);

    expect(message.hidden).toBe(false);

    vi.advanceTimersByTime(5000);

    expect(message.hidden).toBe(true);
    expect(message.textContent).toBe('');
  });

  it('cleans up injected feedback nodes for tests', () => {
    showActionFeedback({ ok: true }, COMMAND_TRASH);

    expect(document.querySelector(FEEDBACK_ROOT_SELECTOR)).not.toBeNull();

    resetActionFeedbackForTests();

    expect(document.querySelector(FEEDBACK_ROOT_SELECTOR)).toBeNull();
  });
});
