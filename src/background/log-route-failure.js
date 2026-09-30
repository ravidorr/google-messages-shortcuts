export function logRouteFailure(result) {
  if (result.reason === 'content-script-unavailable') {
    console.warn(
      '[Messages Shortcut Actions] Could not reach the Google Messages tab. Refresh the page and try again.'
    );

    return;
  }

  if (result.reason === 'not-google-messages-tab') {
    console.warn(
      '[Messages Shortcut Actions] Open Google Messages in the active tab before using a shortcut.'
    );

    return;
  }

  if (result.reason === 'no-active-tab') {
    console.warn('[Messages Shortcut Actions] No active tab is available for the shortcut.');
  }
}
