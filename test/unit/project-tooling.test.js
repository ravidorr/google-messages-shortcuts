// @vitest-environment node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('../..', import.meta.url));

describe('project tooling', () => {
  it('does not retain Storybook dependencies, scripts, or configuration', async () => {
    const packageJson = JSON.parse(await readFile(path.join(projectRoot, 'package.json'), 'utf8'));

    expect(packageJson.scripts).not.toHaveProperty('storybook');
    expect(packageJson.scripts).not.toHaveProperty('build-storybook');
    expect(packageJson.devDependencies).not.toHaveProperty('storybook');
    expect(packageJson.devDependencies).not.toHaveProperty('@storybook/html-vite');

    const configurationFiles = [
      '.gitignore',
      '.stylelintrc.json',
      'design-system/README.md',
      'eslint.config.mjs',
      'vitest.config.ts'
    ];
    const configuration = await Promise.all(
      configurationFiles.map((file) => readFile(path.join(projectRoot, file), 'utf8'))
    );

    expect(configuration.join('\n').toLowerCase()).not.toContain('storybook');
  });
});
