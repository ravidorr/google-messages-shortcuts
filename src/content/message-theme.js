export const MESSAGE_THEME_ATTRIBUTE = 'data-messages-shortcuts-theme';
export const MESSAGE_THEME_LIGHT = 'light';
export const MESSAGE_THEME_DARK = 'dark';

function parseOpaqueCssColor(color) {
  const value = String(color ?? '').trim().toLowerCase();
  const hexMatch = value.match(/^#([\da-f]{3}|[\da-f]{6})$/);

  if (hexMatch) {
    const hex = hexMatch[1].length === 3
      ? [...hexMatch[1]].map((channel) => channel.repeat(2)).join('')
      : hexMatch[1];

    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16)
    ];
  }

  const rgbMatch = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);

  if (rgbMatch) {
    const channels = rgbMatch.slice(1).map(Number);

    return channels.every((channel) => channel >= 0 && channel <= 255) ? channels : null;
  }

  const rgbaMatch = value.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(1(?:\.0+)?)\s*\)$/
  );

  if (!rgbaMatch) {
    return null;
  }

  const channels = rgbaMatch.slice(1, 4).map(Number);

  return channels.every((channel) => channel >= 0 && channel <= 255) ? channels : null;
}

function toLinearChannel(channel) {
  const normalized = channel / 255;

  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function classifyMessageTheme(color) {
  const channels = parseOpaqueCssColor(color);

  if (!channels) {
    return MESSAGE_THEME_LIGHT;
  }

  const [red, green, blue] = channels;
  const luminance = (0.2126 * toLinearChannel(red))
    + (0.7152 * toLinearChannel(green))
    + (0.0722 * toLinearChannel(blue));

  return luminance < 0.5 ? MESSAGE_THEME_DARK : MESSAGE_THEME_LIGHT;
}

export function syncMessageTheme(element) {
  if (!element) {
    return MESSAGE_THEME_LIGHT;
  }

  const getComputedStyle = element.ownerDocument?.defaultView?.getComputedStyle;
  let current = element.parentElement;

  while (current && current.nodeType === 1) {
    const backgroundColor = getComputedStyle?.(current)?.backgroundColor;

    if (parseOpaqueCssColor(backgroundColor)) {
      const theme = classifyMessageTheme(backgroundColor);

      element.setAttribute(MESSAGE_THEME_ATTRIBUTE, theme);
      return theme;
    }

    current = current.parentElement;
  }

  element.setAttribute(MESSAGE_THEME_ATTRIBUTE, MESSAGE_THEME_LIGHT);
  return MESSAGE_THEME_LIGHT;
}
