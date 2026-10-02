import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getNavigationFeedbackMessage,
  resetNavigationFeedbackForTests,
  showNavigationFeedback
} from '../../src/content/navigation-feedback.js';
import {
  PAGE_COMMAND_NEXT_UNREAD,
  PAGE_COMMAND_RETURN_PREVIOUS
} from '../../src/shared/page-commands.js';

describe('navigation-feedback', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    resetNavigationFeedbackForTests();
    vi.useFakeTimers();
  });

  it('maps navigation results to user-visible messages', () => {
    const localThis = getNavigationFeedbackMessage({ ok: true, loadedUnreadCount: 2 }, PAGE_COMMAND_NEXT_UNREAD);

    expect(localThis.message).toContain('unread conversation');
    expect(getNavigationFeedbackMessage({ ok: false, reason: 'return-ambiguous' }, PAGE_COMMAND_RETURN_PREVIOUS).kind)
      .toBe('error');
  });

  it('renders and hides feedback in the page', () => {
    showNavigationFeedback({ ok: false, reason: 'no-rows' }, PAGE_COMMAND_NEXT_UNREAD, document);

    const message = document.querySelector('[data-messages-shortcuts-navigation-feedback-message]');

    expect(message.hidden).toBe(false);
    expect(message.textContent).toContain('No loaded conversations');

    vi.runAllTimers();

    expect(message.hidden).toBe(true);
  });
});
