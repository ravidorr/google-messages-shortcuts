export const POLL_INTERVAL_MS = 50;

function normalizeText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function elementMatchesText(element, text) {
  if (!text) {
    return true;
  }

  const elementText = normalizeText(element.textContent || '');

  return elementText === normalizeText(text);
}

function findMatchingElement(documentRoot, selector, text) {
  const elements = documentRoot.querySelectorAll(selector);

  for (const element of elements) {
    if (elementMatchesText(element, text)) {
      return element;
    }
  }

  return null;
}

export function waitForElement(documentRoot, selector, text, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const poll = () => {
      const element = findMatchingElement(documentRoot, selector, text);

      if (element) {
        resolve(element);

        return;
      }

      if (Date.now() - startedAt >= timeout) {
        reject(new Error(`Timed out waiting for selector "${selector}" with text "${text || ''}"`));

        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
  });
}

export function waitForSelector(documentRoot, selector, timeout = 1000) {
  return waitForElement(documentRoot, selector, null, timeout);
}
