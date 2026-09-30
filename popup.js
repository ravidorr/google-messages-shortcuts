import { initializePopup } from './src/popup/init-popup.js';

initializePopup().catch((error) => {
  console.warn('[Messages Shortcut Actions] Failed to initialize popup.', error);
});
