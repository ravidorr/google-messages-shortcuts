// @vitest-environment node

import { describe, expect, it } from 'vitest';
import config from '../../vitest.config.ts';

describe('Vitest configuration', () => {
  it('includes uncovered source files without the removed coverage.all option', () => {
    expect(config.test?.coverage).toMatchObject({
      include: [
        'background.js',
        'content.js',
        'page-world-bridge-main.js',
        'page-world-bridge.js',
        'popup.js',
        'scripts/**/*.{js,mjs}',
        'src/**/*.js'
      ]
    });
    expect(config.test?.coverage).not.toHaveProperty('all');
  });
});
