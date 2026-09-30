import { describe, expect, it, vi } from 'vitest';
import { logRouteFailure } from '../../src/background/log-route-failure.js';

describe('logRouteFailure', () => {
  it('logs refresh guidance for unavailable content scripts', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logRouteFailure({ reason: 'content-script-unavailable' });

    expect(warnSpy).toHaveBeenCalledWith(
      '[Messages Shortcut Actions] Could not reach the Google Messages tab. Refresh the page and try again.'
    );
  });

  it('logs active-tab guidance for non-Messages tabs', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logRouteFailure({ reason: 'not-google-messages-tab' });

    expect(warnSpy).toHaveBeenCalledWith(
      '[Messages Shortcut Actions] Open Google Messages in the active tab before using a shortcut.'
    );
  });

  it('logs when no active tab exists', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logRouteFailure({ reason: 'no-active-tab' });

    expect(warnSpy).toHaveBeenCalledWith(
      '[Messages Shortcut Actions] No active tab is available for the shortcut.'
    );
  });
});
