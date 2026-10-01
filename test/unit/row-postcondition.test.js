import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForTargetRowPostcondition } from '../../src/content/row-postcondition.js';

describe('row-postcondition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when the postcondition becomes satisfied', async () => {
    const conversationRow = document.createElement('mws-conversation-list-item');
    document.body.append(conversationRow);
    let satisfied = false;

    setTimeout(() => {
      satisfied = true;
    }, 200);

    const resultPromise = waitForTargetRowPostcondition({
      conversationRow,
      isSatisfied: () => satisfied,
      timeoutMs: 1000,
      pollIntervalMs: 100
    });

    await vi.advanceTimersByTimeAsync(300);
    const localThis = await resultPromise;

    expect(localThis).toEqual({ ok: true });
  });

  it('fails when the target row disconnects before the postcondition is met', async () => {
    const conversationRow = document.createElement('mws-conversation-list-item');
    document.body.append(conversationRow);

    const resultPromise = waitForTargetRowPostcondition({
      conversationRow,
      isSatisfied: () => false,
      timeoutMs: 1000,
      pollIntervalMs: 100
    });

    conversationRow.remove();
    await vi.advanceTimersByTimeAsync(100);
    const localThis = await resultPromise;

    expect(localThis).toEqual({
      ok: false,
      reason: 'target-row-disconnected'
    });
  });

  it('times out when the postcondition never becomes satisfied', async () => {
    const conversationRow = document.createElement('mws-conversation-list-item');
    document.body.append(conversationRow);

    const resultPromise = waitForTargetRowPostcondition({
      conversationRow,
      isSatisfied: () => false,
      timeoutMs: 300,
      pollIntervalMs: 100
    });

    await vi.advanceTimersByTimeAsync(400);
    const localThis = await resultPromise;

    expect(localThis).toEqual({
      ok: false,
      reason: 'postcondition-timeout'
    });
  });
});
