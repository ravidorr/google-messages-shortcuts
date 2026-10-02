import { isPaused } from '../shared/pause-preference.js';
import { openArchivedModal } from './adapters/archived-adapter.js';
import { SELECTORS } from './google-messages-dom.js';

export async function handleOpenArchived(
  documentRoot = document,
  chromeApi = chrome,
  selectors = SELECTORS
) {
  if (await isPaused(chromeApi)) {
    return { ok: false, reason: 'extension-paused' };
  }

  return openArchivedModal(documentRoot, selectors);
}
