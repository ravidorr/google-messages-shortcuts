import {
  getBrowserCommandLabelMap,
  getFallbackBrowserCommandLabelMap,
  MESSAGE_GET_BROWSER_COMMAND_LABELS
} from '../shared/browser-command-labels.js';
import {
  getConversationShortcutLabels,
  MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS,
  UNASSIGNED_SHORTCUT_LABEL
} from '../shared/shortcut-labels.js';

function getFallbackLabels() {
  return {
    archive: UNASSIGNED_SHORTCUT_LABEL,
    trash: UNASSIGNED_SHORTCUT_LABEL,
    markUnread: UNASSIGNED_SHORTCUT_LABEL,
    markRead: UNASSIGNED_SHORTCUT_LABEL,
    mute: UNASSIGNED_SHORTCUT_LABEL,
    unmute: UNASSIGNED_SHORTCUT_LABEL,
    blockReportSpam: UNASSIGNED_SHORTCUT_LABEL
  };
}

export async function getShortcutLabels(chromeApi = chrome) {
  const commands = await chromeApi.commands.getAll();

  return getConversationShortcutLabels(commands);
}

export async function getAllBrowserCommandLabels(chromeApi = chrome) {
  const commands = await chromeApi.commands.getAll();

  return getBrowserCommandLabelMap(commands);
}

export function installShortcutLabelListener(chromeApi = chrome) {
  chromeApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS) {
      getShortcutLabels(chromeApi)
        .then(sendResponse)
        .catch(() => {
          sendResponse(getFallbackLabels());
        });

      return true;
    }

    if (message?.type === MESSAGE_GET_BROWSER_COMMAND_LABELS) {
      getAllBrowserCommandLabels(chromeApi)
        .then(sendResponse)
        .catch(() => {
          sendResponse(getFallbackBrowserCommandLabelMap());
        });

      return true;
    }

    return false;
  });
}
