const MAX_RETURN_HISTORY = 20;

let returnHistory = [];

export function recordOpenedConversation(identity) {
  if (!identity) {
    return;
  }

  const lastIdentity = returnHistory[returnHistory.length - 1];

  if (lastIdentity === identity) {
    return;
  }

  returnHistory.push(identity);

  if (returnHistory.length > MAX_RETURN_HISTORY) {
    returnHistory = returnHistory.slice(-MAX_RETURN_HISTORY);
  }
}

export function peekPreviousConversationIdentity() {
  if (returnHistory.length < 2) {
    return null;
  }

  return returnHistory[returnHistory.length - 2];
}

export function consumePreviousConversationIdentity() {
  if (returnHistory.length < 2) {
    return null;
  }

  returnHistory.pop();

  return returnHistory[returnHistory.length - 1];
}

export function resetNavigationHistoryForTests() {
  returnHistory = [];
}
