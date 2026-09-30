import { runConversationAction } from './src/content/conversation-action.js';
import { handleCommand, installMessageListener } from './src/content/message-handler.js';

installMessageListener();

if (typeof globalThis !== 'undefined') {
  globalThis.MessagesShortcuts = {
    ...(globalThis.MessagesShortcuts || {}),
    handleCommand,
    runConversationAction
  };
}
