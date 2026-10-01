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
    markRead: UNASSIGNED_SHORTCUT_LABEL
  };
}

export async function getShortcutLabels(chromeApi = chrome) {
  const commands = await chromeApi.commands.getAll();

  return getConversationShortcutLabels(commands);
}

export function installShortcutLabelListener(chromeApi = chrome) {
  chromeApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== MESSAGE_GET_CONVERSATION_SHORTCUT_LABELS) {
      return false;
    }

    getShortcutLabels(chromeApi)
      .then(sendResponse)
      .catch(() => {
        sendResponse(getFallbackLabels());
      });

    return true;
  });
}
