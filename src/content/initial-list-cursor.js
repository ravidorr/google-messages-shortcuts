import { isPaused, PAUSE_STORAGE_KEY } from '../shared/pause-preference.js';
import { SELECTORS } from './google-messages-dom.js';
import { LIST_CURSOR_ROW_SELECTOR } from './list-cursor-highlight.js';
import { focusCursorByIdentity } from './list-navigation.js';
import {
  establishInitialListCursor,
  getCurrentCursorIdentity,
  isInboxListView
} from './page-navigation-actions.js';

const RETRY_DELAYS_MS = [0, 100, 250, 500, 1000, 2000, 4000];
const MUTATION_DEBOUNCE_MS = 50;

export function startInitialListCursorWatcher({
  documentRoot = document,
  chromeApi = globalThis.chrome,
  establishInitialCursor = establishInitialListCursor,
  locationRef = globalThis.location,
  windowRef = globalThis
} = {}) {
  let disconnected = false;
  let paused = false;
  let mutationDebounceId = null;
  const timeoutIds = new Set();

  async function refreshPausedState() {
    paused = await isPaused(chromeApi);
  }

  const pausedStateReady = refreshPausedState();

  async function attempt() {
    if (disconnected || paused || !isInboxListView(locationRef)) {
      return false;
    }

    await pausedStateReady;

    const identity = getCurrentCursorIdentity();
    const highlightedRow = documentRoot.querySelector(LIST_CURSOR_ROW_SELECTOR);

    if (identity && highlightedRow) {
      return true;
    }

    if (identity) {
      const restored = focusCursorByIdentity(documentRoot, identity, SELECTORS);

      return restored.ok;
    }

    const result = await establishInitialCursor(
      documentRoot,
      undefined,
      chromeApi,
      locationRef
    );

    return Boolean(result);
  }

  function scheduleDelayedAttempts() {
    for (const delay of RETRY_DELAYS_MS) {
      const timeoutId = windowRef.setTimeout(() => {
        timeoutIds.delete(timeoutId);
        void attempt();
      }, delay);

      timeoutIds.add(timeoutId);
    }
  }

  function handleDomChange() {
    if (disconnected || !isInboxListView(locationRef)) {
      return;
    }

    if (mutationDebounceId !== null) {
      windowRef.clearTimeout(mutationDebounceId);
    }

    mutationDebounceId = windowRef.setTimeout(() => {
      mutationDebounceId = null;
      void attempt();
    }, MUTATION_DEBOUNCE_MS);
  }

  const observer = new MutationObserver(handleDomChange);

  if (documentRoot.body) {
    observer.observe(documentRoot.body, {
      childList: true,
      subtree: true
    });
  }

  let lastPathname = locationRef.pathname;

  const handleNavigation = () => {
    lastPathname = locationRef.pathname;
    void attempt();
  };

  const handlePossiblePathnameChange = () => {
    if (locationRef.pathname === lastPathname) {
      return;
    }

    lastPathname = locationRef.pathname;
    void attempt();
  };

  const originalPushState = windowRef.history?.pushState?.bind(windowRef.history);
  const originalReplaceState = windowRef.history?.replaceState?.bind(windowRef.history);

  if (originalPushState) {
    windowRef.history.pushState = (...args) => {
      originalPushState(...args);
      handlePossiblePathnameChange();
    };
  }

  if (originalReplaceState) {
    windowRef.history.replaceState = (...args) => {
      originalReplaceState(...args);
      handlePossiblePathnameChange();
    };
  }

  windowRef.addEventListener('popstate', handleNavigation);
  windowRef.addEventListener('hashchange', handleNavigation);

  const handlePausePreferenceChange = (changes, areaName) => {
    if (areaName !== 'local' || !changes[PAUSE_STORAGE_KEY]) {
      return;
    }

    paused = changes[PAUSE_STORAGE_KEY].newValue === true;

    if (!paused) {
      void attempt();
    }
  };

  chromeApi.storage?.onChanged?.addListener(handlePausePreferenceChange);

  void pausedStateReady.then(() => {
    if (!disconnected) {
      scheduleDelayedAttempts();
    }
  });

  return () => {
    disconnected = true;
    observer.disconnect();

    if (mutationDebounceId !== null) {
      windowRef.clearTimeout(mutationDebounceId);
    }

    for (const timeoutId of timeoutIds) {
      windowRef.clearTimeout(timeoutId);
    }

    timeoutIds.clear();
    windowRef.removeEventListener('popstate', handleNavigation);
    windowRef.removeEventListener('hashchange', handleNavigation);
    chromeApi.storage?.onChanged?.removeListener(handlePausePreferenceChange);

    if (originalPushState) {
      windowRef.history.pushState = originalPushState;
    }

    if (originalReplaceState) {
      windowRef.history.replaceState = originalReplaceState;
    }
  };
}
