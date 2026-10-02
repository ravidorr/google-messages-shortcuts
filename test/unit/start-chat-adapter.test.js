import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assessStartChatCapabilities,
  findStartChatButton,
  findViableStartChatButtons,
  isNativeDialogOpen,
  isStartChatViewActive,
  isViableStartChatButton,
  openStartChat,
  resetOpenStartChatInFlightForTests,
  START_CHAT_CAPABILITY_IDS,
  START_CHAT_SELECTORS,
  waitForStartChatView
} from '../../src/content/adapters/start-chat-adapter.js';
import { CAPABILITY_SUPPORTED, CAPABILITY_UNAVAILABLE, CAPABILITY_UNSAFE } from '../../src/content/adapters/capability-states.js';
import {
  duplicateStartChatButtons,
  startChatFabSurface,
  startChatNewConversationSurface
} from '../fixtures/dom/list-states.js';

describe('start-chat-adapter', () => {
  beforeEach(() => {
    resetOpenStartChatInFlightForTests();
    document.body.innerHTML = '';
  });

  it('assesses supported capability when exactly one start chat control is present', () => {
    document.body.innerHTML = startChatFabSurface;
    const localThis = assessStartChatCapabilities(document);

    expect(localThis[START_CHAT_CAPABILITY_IDS.entry]).toEqual({
      state: CAPABILITY_SUPPORTED,
      reason: 'Start chat control is present in the document.',
      evidenceSource: 'dom-query'
    });
  });

  it('assesses unavailable capability when no start chat control is present', () => {
    const localThis = assessStartChatCapabilities(document);

    expect(localThis[START_CHAT_CAPABILITY_IDS.entry].state).toBe(CAPABILITY_UNAVAILABLE);
  });

  it('assesses unsafe capability when multiple start chat controls are present', () => {
    document.body.innerHTML = duplicateStartChatButtons;
    const localThis = assessStartChatCapabilities(document);

    expect(localThis[START_CHAT_CAPABILITY_IDS.entry].state).toBe(CAPABILITY_UNSAFE);
  });

  it('finds a single viable start chat button', () => {
    document.body.innerHTML = startChatFabSurface;
    const localThis = findStartChatButton(document);

    expect(localThis?.getAttribute('data-e2e-start-button')).not.toBeNull();
    expect(findViableStartChatButtons(document)).toHaveLength(1);
  });

  it('rejects hidden or disabled start chat controls', () => {
    document.body.innerHTML = `
      <a data-e2e-start-button hidden href="/web/conversations/new">Hidden</a>
      <a data-e2e-start-button aria-disabled="true" href="/web/conversations/new">Disabled</a>
      <a data-e2e-start-button style="display: none" href="/web/conversations/new">Display none</a>
      <a data-e2e-start-button style="visibility: hidden" href="/web/conversations/new">Visibility hidden</a>
    `;

    expect(findViableStartChatButtons(document)).toHaveLength(0);
    expect(isViableStartChatButton(null)).toBe(false);
    expect(isViableStartChatButton(document.createElement('button'))).toBe(false);
    expect(isViableStartChatButton(document.querySelector('[aria-disabled="true"]'))).toBe(false);
  });

  it('ignores start chat controls hidden by ancestor display or visibility', () => {
    document.body.innerHTML = `
      <div style="display: none">
        <a data-e2e-start-button style="display: flex" href="/web/conversations/new">Hidden mobile</a>
      </div>
      <div style="visibility: hidden">
        <a data-e2e-start-button style="visibility: visible" href="/web/conversations/new">Hidden sidebar</a>
      </div>
      <a data-e2e-start-button href="/web/conversations/new">Visible</a>
    `;

    expect(findViableStartChatButtons(document)).toHaveLength(1);
    expect(assessStartChatCapabilities(document)[START_CHAT_CAPABILITY_IDS.entry].state)
      .toBe(CAPABILITY_SUPPORTED);
  });

  it('detects the start chat view from the new conversation path', () => {
    window.history.pushState({}, '', '/web/conversations/new');

    expect(isStartChatViewActive(document)).toBe(true);

    window.history.pushState({}, '', '/web/conversations');
  });

  it('detects the start chat view from the new conversation surface', () => {
    document.body.innerHTML = startChatNewConversationSurface;

    expect(isStartChatViewActive(document)).toBe(true);
  });

  it('returns false when the document has no location context', () => {
    const htmlDocument = document.implementation.createHTMLDocument('');

    expect(isStartChatViewActive(htmlDocument)).toBe(false);
  });

  it('detects native dialogs', () => {
    document.body.innerHTML = '<mat-dialog-container></mat-dialog-container>';

    expect(isNativeDialogOpen(document)).toBe(true);
  });

  it('opens start chat and waits for the new conversation view', async () => {
    document.body.innerHTML = startChatFabSurface;
    const startChatButton = document.querySelector(START_CHAT_SELECTORS.startChatFab);

    vi.spyOn(startChatButton, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML('beforeend', startChatNewConversationSurface);
    });

    const localThis = await openStartChat(document);

    expect(localThis).toEqual({ ok: true });
  });

  it('returns alreadyOpen when the new conversation view is active', async () => {
    document.body.innerHTML = `${startChatFabSurface}${startChatNewConversationSurface}`;
    const localThis = await openStartChat(document);

    expect(localThis).toEqual({ ok: true, alreadyOpen: true });
  });

  it('returns native-dialog-open when a dialog is visible', async () => {
    document.body.innerHTML = `${startChatFabSurface}<mat-dialog-container></mat-dialog-container>`;
    const localThis = await openStartChat(document);

    expect(localThis).toEqual({ ok: false, reason: 'native-dialog-open' });
  });

  it('returns start-chat-not-found when the control is missing', async () => {
    const localThis = await openStartChat(document);

    expect(localThis).toEqual({ ok: false, reason: 'start-chat-not-found' });
  });

  it('returns start-chat-ambiguous when multiple controls match', async () => {
    document.body.innerHTML = duplicateStartChatButtons;
    const localThis = await openStartChat(document);

    expect(localThis).toEqual({ ok: false, reason: 'start-chat-ambiguous' });
  });

  it('returns start-chat-timeout when the view never appears', async () => {
    document.body.innerHTML = startChatFabSurface;
    const localThis = await openStartChat(
      document,
      START_CHAT_SELECTORS,
      vi.fn(async () => {
        throw new Error('start-chat-timeout');
      })
    );

    expect(localThis).toEqual({ ok: false, reason: 'start-chat-timeout' });
  });

  it('blocks concurrent start chat requests', async () => {
    document.body.innerHTML = startChatFabSurface;

    let resolveWait;
    const waitPromise = new Promise((resolve) => {
      resolveWait = resolve;
    });
    const results = [];

    const first = openStartChat(
      document,
      START_CHAT_SELECTORS,
      () => waitPromise
    ).then((result) => {
      results.push(result);
    });
    await Promise.resolve();

    const second = openStartChat(document).then((result) => {
      results.push(result);
    });
    await Promise.resolve();

    expect(results).toEqual([{ ok: false, reason: 'action-in-progress' }]);

    resolveWait(true);
    await first;
    await second;
  });

  it('resolves waitForStartChatView when the surface appears', async () => {
    setTimeout(() => {
      document.body.innerHTML = startChatNewConversationSurface;
    }, 50);

    await expect(waitForStartChatView(document, START_CHAT_SELECTORS, 500)).resolves.toBe(true);
  });

  it('rejects waitForStartChatView when the surface never appears', async () => {
    await expect(waitForStartChatView(document, START_CHAT_SELECTORS, 100)).rejects.toThrow('start-chat-timeout');
  });

  it('returns success after a wait timeout when the view becomes active late', async () => {
    document.body.innerHTML = startChatFabSurface;
    const startChatButton = document.querySelector(START_CHAT_SELECTORS.startChatFab);

    vi.spyOn(startChatButton, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML('beforeend', startChatNewConversationSurface);
    });

    const localThis = await openStartChat(
      document,
      START_CHAT_SELECTORS,
      vi.fn(async () => {
        throw new Error('start-chat-timeout');
      })
    );

    expect(localThis).toEqual({ ok: true });
  });
});
