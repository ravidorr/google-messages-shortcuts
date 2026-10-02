import { isPaused } from '../shared/pause-preference.js';
import { openStartChat } from './adapters/start-chat-adapter.js';
import { SELECTORS } from './google-messages-dom.js';

export async function handleOpenStartChat(
  documentRoot = document,
  chromeApi = chrome,
  selectors = SELECTORS
) {
  if (await isPaused(chromeApi)) {
    return { ok: false, reason: 'extension-paused' };
  }

  return openStartChat(documentRoot, selectors);
}
