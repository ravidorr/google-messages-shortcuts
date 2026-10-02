import { isPaused } from '../shared/pause-preference.js';
import { openSpamBlocked } from './adapters/spam-blocked-adapter.js';
import { SELECTORS } from './google-messages-dom.js';

export async function handleOpenSpamBlocked(
  documentRoot = document,
  chromeApi = chrome,
  selectors = SELECTORS
) {
  if (await isPaused(chromeApi)) {
    return { ok: false, reason: 'extension-paused' };
  }

  return openSpamBlocked(documentRoot, selectors);
}
