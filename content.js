import { runConversationAction } from './src/content/conversation-action.js';
import {
  installConversationShortcutPills,
  resetConversationShortcutPillInstallationsForTests
} from './src/content/conversation-shortcut-pills.js';
import { handleCommand, installMessageListener } from './src/content/message-handler.js';

const disconnectMessageListener = installMessageListener();
const disconnectPills = installConversationShortcutPills();

export function resetContentScriptForTests() {
  disconnectMessageListener();
  disconnectPills();
  resetConversationShortcutPillInstallationsForTests();
}

globalThis.MessagesShortcuts = {
  ...(globalThis.MessagesShortcuts || {}),
  handleCommand,
  runConversationAction
};
