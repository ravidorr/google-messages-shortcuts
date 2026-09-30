import { isValidCommand } from '../shared/commands.js';

export function isGoogleMessagesUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url);

    return parsedUrl.hostname === 'messages.google.com';
  } catch (_error) {
    return false;
  }
}

export async function routeCommand(command, chromeApi = chrome) {
  if (!isValidCommand(command)) {
    return { ok: false, reason: 'invalid-command' };
  }

  const tabs = await chromeApi.tabs.query({
    active: true,
    lastFocusedWindow: true
  });

  const activeTab = tabs[0];

  if (!activeTab?.id) {
    return { ok: false, reason: 'no-active-tab' };
  }

  if (!isGoogleMessagesUrl(activeTab.url)) {
    return { ok: false, reason: 'not-google-messages-tab' };
  }

  try {
    await chromeApi.tabs.sendMessage(activeTab.id, { command });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: 'content-script-unavailable',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
