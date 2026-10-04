import { runCapabilitySelfTest } from './src/content/adapters/capability-self-test.js';
import { runConversationAction } from './src/content/conversation-action.js';
import {
  installConversationShortcutPills,
  resetConversationShortcutPillInstallationsForTests
} from './src/content/conversation-shortcut-pills.js';
import { resetActionFeedbackForTests } from './src/content/action-feedback.js';
import {
  installKeyboardController,
  resetKeyboardControllerInstallationsForTests
} from './src/content/keyboard-controller.js';
import { handleCommand, installMessageListener } from './src/content/message-handler.js';
import { resetCommandPaletteForTests } from './src/content/command-palette.js';
import {
  establishInitialListCursor,
  resetPageNavigationStateForTests
} from './src/content/page-navigation-actions.js';
import { resetNavigationFeedbackForTests } from './src/content/navigation-feedback.js';
import { resetNavigationHistoryForTests } from './src/content/navigation-history.js';
import { resetShortcutHelpForTests } from './src/content/shortcut-help-overlay.js';
import {
  installArchivedFab,
  resetArchivedFabInstallationsForTests
} from './src/content/navigation-fab.js';
import {
  installNavigationFabShortcutBadges,
  resetNavigationFabShortcutBadgeInstallationsForTests
} from './src/content/navigation-fab-shortcut-badges.js';
import {
  installSpamBlockedFab,
  resetSpamBlockedFabInstallationsForTests
} from './src/content/spam-blocked-fab.js';
import {
  createDefaultPageWorldBridgeHandlers,
  installPageWorldBridgeHost
} from './src/content/page-world-bridge-host.js';

const disconnectMessageListener = installMessageListener();
const disconnectKeyboardController = installKeyboardController();
const disconnectPills = installConversationShortcutPills();
const disconnectArchivedFab = installArchivedFab();
const disconnectSpamBlockedFab = installSpamBlockedFab();
const disconnectNavigationFabShortcutBadges = installNavigationFabShortcutBadges();
const disconnectPageWorldBridge = installPageWorldBridgeHost(
  document,
  createDefaultPageWorldBridgeHandlers({
    runCapabilitySelfTest
  })
);

export function resetContentScriptForTests() {
  disconnectMessageListener();
  disconnectKeyboardController();
  disconnectPills();
  disconnectArchivedFab();
  disconnectSpamBlockedFab();
  disconnectNavigationFabShortcutBadges();
  disconnectPageWorldBridge();
  resetConversationShortcutPillInstallationsForTests();
  resetArchivedFabInstallationsForTests();
  resetSpamBlockedFabInstallationsForTests();
  resetNavigationFabShortcutBadgeInstallationsForTests();
  resetActionFeedbackForTests();
  resetKeyboardControllerInstallationsForTests();
  resetCommandPaletteForTests();
  resetShortcutHelpForTests();
  resetNavigationFeedbackForTests();
  resetNavigationHistoryForTests();
  resetPageNavigationStateForTests();
}

globalThis.MessagesShortcuts = {
  ...(globalThis.MessagesShortcuts || {}),
  handleCommand,
  runConversationAction,
  runCapabilitySelfTest,
  establishInitialListCursor
};
