import { describe, expect, it, vi } from 'vitest';
import { handleOpenSpamBlocked } from '../../src/content/open-spam-blocked-action.js';
import * as spamBlockedAdapter from '../../src/content/adapters/spam-blocked-adapter.js';

describe('open-spam-blocked-action', () => {
  it('opens Spam and blocked with the supplied document and selectors when active', async () => {
    const localThis = { drawerTrigger: '[data-menu]' };
    const documentRoot = document.implementation.createHTMLDocument('test');
    vi.spyOn(spamBlockedAdapter, 'openSpamBlocked').mockResolvedValueOnce({ ok: true });

    const result = await handleOpenSpamBlocked(documentRoot, {
      storage: { local: { get: vi.fn(async () => ({})) } }
    }, localThis);

    expect(result).toEqual({ ok: true });
    expect(spamBlockedAdapter.openSpamBlocked).toHaveBeenCalledWith(documentRoot, localThis);
  });

  it('does not open Spam and blocked while the extension is paused', async () => {
    const localThis = await handleOpenSpamBlocked(document, {
      storage: { local: { get: vi.fn(async () => ({ extensionPaused: true })) } }
    });

    expect(localThis).toEqual({ ok: false, reason: 'extension-paused' });
    expect(spamBlockedAdapter.openSpamBlocked).not.toHaveBeenCalled();
  });
});
