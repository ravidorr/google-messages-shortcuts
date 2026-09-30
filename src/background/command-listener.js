import { routeCommand } from './command-router.js';
import { logRouteFailure } from './log-route-failure.js';

export function handleCommandEvent(command, chromeApi = chrome) {
  return routeCommand(command, chromeApi)
    .then((result) => {
      if (!result.ok) {
        logRouteFailure(result);
      }

      return result;
    })
    .catch((error) => {
      console.warn('[Messages Shortcut Actions] Failed to route shortcut command.', error);

      return {
        ok: false,
        reason: 'route-error',
        error: error instanceof Error ? error.message : String(error)
      };
    });
}
