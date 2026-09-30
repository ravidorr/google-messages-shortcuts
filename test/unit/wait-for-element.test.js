import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  POLL_INTERVAL_MS,
  waitForElement,
  waitForSelector
} from '../../src/content/wait-for-element.js';

describe('waitForElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('resolves when selector and exact text match', async () => {
    const button = document.createElement('button');
    button.className = 'mat-menu-item';
    button.textContent = 'Archive';
    document.body.append(button);

    const promise = waitForElement(document, '.mat-menu-item', 'Archive', 1000);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    await expect(promise).resolves.toBe(button);
  });

  it('rejects when the timeout is reached', async () => {
    const promise = waitForElement(document, '.missing', 'Archive', 1000);
    const assertion = expect(promise).rejects.toThrow(/Timed out waiting for selector/);

    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it('treats a missing element text value as empty text', async () => {
    const documentRoot = {
      querySelectorAll: () => [{ textContent: undefined }]
    };

    await expect(waitForElement(documentRoot, '.mat-menu-item', 'Archive', 0))
      .rejects.toThrow('Timed out waiting for selector ".mat-menu-item" with text "Archive"');
  });

  it('formats a timeout without a requested text value', async () => {
    await expect(waitForElement(document, '.missing', '', 0))
      .rejects.toThrow('Timed out waiting for selector ".missing" with text ""');
  });

  it('resolves when a matching element is appended after polling begins', async () => {
    const promise = waitForElement(document, '.mat-menu-item', 'Archive', 1000);

    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS - 1);

    const button = document.createElement('button');
    button.className = 'mat-menu-item';
    button.textContent = 'Archive';
    document.body.append(button);

    await vi.advanceTimersByTimeAsync(1);

    await expect(promise).resolves.toBe(button);
  });

  it('matches text after normalizing whitespace', async () => {
    const button = document.createElement('button');
    button.className = 'mat-menu-item';
    button.textContent = '  Archive  ';
    document.body.append(button);

    const promise = waitForElement(document, '.mat-menu-item', 'Archive', 1000);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    await expect(promise).resolves.toMatchObject({ textContent: expect.stringContaining('Archive') });
  });

  it('waits for selector-only matches', async () => {
    const button = document.createElement('button');
    button.dataset.e2eConversationMenuArchive = '';
    document.body.append(button);

    const promise = waitForSelector(document, 'button[data-e2e-conversation-menu-archive]', 1000);
    await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

    await expect(promise).resolves.toBe(button);
  });
});
