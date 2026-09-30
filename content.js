import { runConversationAction } from './src/content/conversation-action.js';
import { installConversationShortcutPills } from './src/content/conversation-shortcut-pills.js';
import { handleCommand, installMessageListener } from './src/content/message-handler.js';

installMessageListener();
installConversationShortcutPills();

if (typeof globalThis !== 'undefined') {
  globalThis.MessagesShortcuts = {
    ...(globalThis.MessagesShortcuts || {}),
    handleCommand,
    runConversationAction
  };
}
