import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assessSpamBlockedCapabilities,
  findSpamBlockedDrawerEntries,
  getSpamBlockedDialog,
  isSpamBlockedDialogOpen,
  openSpamBlocked,
  SPAM_BLOCKED_CAPABILITY_IDS
} from '../../src/content/adapters/spam-blocked-adapter.js';
import {
  CAPABILITY_SUPPORTED,
  CAPABILITY_UNAVAILABLE,
  CAPABILITY_UNSAFE
} from '../../src/content/adapters/capability-states.js';

describe('spam-blocked-adapter', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finds only visible, enabled drawer entries with the exact text or aria label', () => {
    document.body.innerHTML = `
      <aside>
        <button>  Spam &amp; blocked  </button>
        <button aria-label="Spam & blocked"></button>
        <button hidden>Spam &amp; blocked</button>
        <button disabled>Spam &amp; blocked</button>
        <button aria-hidden="true">Spam &amp; blocked</button>
        <button aria-disabled="true">Spam &amp; blocked</button>
        <button style="display: none">Spam &amp; blocked</button>
      </aside>
      <mat-dialog-container><button>Spam &amp; blocked</button></mat-dialog-container>
    `;

    expect(findSpamBlockedDrawerEntries(document)).toHaveLength(2);
  });

  it('recognizes exactly one matching Spam and blocked dialog', () => {
    document.body.innerHTML = '<mat-dialog-container><h2> Spam & blocked </h2></mat-dialog-container>';

    expect(getSpamBlockedDialog(document)).toBe(document.querySelector('mat-dialog-container'));
    expect(isSpamBlockedDialogOpen(document)).toBe(true);

    document.body.insertAdjacentHTML(
      'beforeend',
      '<mat-dialog-container><h3>Spam & blocked</h3></mat-dialog-container>'
    );

    expect(getSpamBlockedDialog(document)).toBeNull();
    expect(isSpamBlockedDialogOpen(document)).toBe(false);
  });

  it('reports unavailable, unsafe, and supported drawer capabilities', () => {
    let localThis = assessSpamBlockedCapabilities(document)[SPAM_BLOCKED_CAPABILITY_IDS.entry];
    expect(localThis.state).toBe(CAPABILITY_UNAVAILABLE);
    expect(localThis.evidenceSource).toBe('dom-query');

    document.body.innerHTML = '<aside><button>Spam & blocked</button><button>Spam & blocked</button></aside>';
    localThis = assessSpamBlockedCapabilities(document)[SPAM_BLOCKED_CAPABILITY_IDS.entry];
    expect(localThis.state).toBe(CAPABILITY_UNSAFE);

    document.body.innerHTML = '<aside><button>Spam & blocked</button></aside>';
    localThis = assessSpamBlockedCapabilities(document)[SPAM_BLOCKED_CAPABILITY_IDS.entry];
    expect(localThis).toMatchObject({
      state: CAPABILITY_SUPPORTED,
      evidenceSource: 'dom-query-fallback'
    });
  });

  it('does not interact when the destination is already open', async () => {
    document.body.innerHTML = `
      <mat-dialog-container><h1>Spam & blocked</h1></mat-dialog-container>
      <button aria-label="Main menu">Menu</button>
    `;
    const localThis = document.querySelector('button');
    vi.spyOn(localThis, 'click');

    await expect(openSpamBlocked(document)).resolves.toEqual({ ok: true, alreadyOpen: true });
    expect(localThis.click).not.toHaveBeenCalled();
  });

  it('fails closed for missing or ambiguous drawer triggers', async () => {
    await expect(openSpamBlocked(document)).resolves.toEqual({
      ok: false,
      reason: 'spam-blocked-drawer-trigger-not-found'
    });

    document.body.innerHTML = `
      <button aria-label="Main menu">A</button>
      <button aria-label="Main menu">B</button>
    `;
    await expect(openSpamBlocked(document)).resolves.toEqual({
      ok: false,
      reason: 'spam-blocked-drawer-trigger-ambiguous'
    });
  });

  it('fails when a drawer entry is absent or ambiguous after opening the drawer', async () => {
    document.body.innerHTML = '<button aria-label="Main menu">Menu</button>';
    const localThis = vi.fn(async () => {});

    await expect(openSpamBlocked(document, undefined, { timeoutMs: 0, delayFn: localThis })).resolves
      .toEqual({ ok: false, reason: 'spam-blocked-entry-not-found' });
    expect(localThis).toHaveBeenCalledWith(100);

    document.body.innerHTML = `
      <button aria-label="Main menu">Menu</button>
      <aside><button>Spam & blocked</button><button>Spam & blocked</button></aside>
    `;
    await expect(openSpamBlocked(document, undefined, { delayFn: async () => {} })).resolves
      .toEqual({ ok: false, reason: 'spam-blocked-entry-ambiguous' });
  });

  it('opens the entry after it appears and reports a dialog timeout when it never opens', async () => {
    document.body.innerHTML = '<button aria-label="Main menu">Menu</button><aside></aside>';
    const localThis = document.querySelector('[aria-label="Main menu"]');
    localThis.addEventListener('click', () => {
      document.querySelector('aside').innerHTML = '<button>Spam & blocked</button>';
    });

    await expect(openSpamBlocked(document, undefined, { timeoutMs: 100, delayFn: async () => {} }))
      .resolves.toEqual({ ok: false, reason: 'spam-blocked-dialog-timeout' });

    expect(document.querySelector('aside button')).toBeTruthy();
  });

  it('opens the matching entry and waits for its destination dialog', async () => {
    document.body.innerHTML = `
      <button aria-label="Main menu">Menu</button>
      <aside><button>Spam & blocked</button></aside>
    `;
    const localThis = document.querySelector('aside button');
    vi.spyOn(localThis, 'click').mockImplementation(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        '<mat-dialog-container><h2>Spam & blocked</h2></mat-dialog-container>'
      );
    });

    await expect(openSpamBlocked(document, undefined, { delayFn: async () => {} })).resolves
      .toEqual({ ok: true });
    expect(localThis.click).toHaveBeenCalledTimes(1);
  });

  it('uses its default delay while waiting for the destination dialog', async () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <button aria-label="Main menu">Menu</button>
      <aside><button>Spam & blocked</button></aside>
    `;

    const localThis = openSpamBlocked(document, undefined, { timeoutMs: 100 });
    await vi.advanceTimersByTimeAsync(100);

    await expect(localThis).resolves.toEqual({
      ok: false,
      reason: 'spam-blocked-dialog-timeout'
    });
    vi.useRealTimers();
  });
});
