// @vitest-environment node

import { accessSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BUILD_PATHS } from '../../scripts/build.js';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function readGitignorePatterns() {
  return readFileSync(path.join(projectDirectory, '.gitignore'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

function readMarkdownlintIgnores() {
  const configText = readFileSync(path.join(projectDirectory, '.markdownlint-cli2.jsonc'), 'utf8');
  const config = JSON.parse(configText.replace(/\/\/.*$/gm, ''));

  return config.ignores;
}

describe('agent AI tooling', () => {
  it('configures Chrome DevTools MCP for extension debugging without autoConnect', () => {
    const mcpConfig = JSON.parse(
      readFileSync(path.join(projectDirectory, '.cursor/mcp.json'), 'utf8')
    );
    const devtools = mcpConfig.mcpServers['chrome-devtools-mcp'];

    expect(devtools.command).toBe('npx');
    expect(devtools.args).toEqual([
      '-y',
      'chrome-devtools-mcp@latest',
      '--categoryExtensions'
    ]);
  });

  it('vendors the chrome-extensions skill with license notice', () => {
    expect(() => {
      accessSync(path.join(projectDirectory, '.agents/skills/chrome-extensions/SKILL.md'));
      accessSync(path.join(projectDirectory, '.agents/skills/chrome-extensions/LICENSE'));
      accessSync(path.join(projectDirectory, '.agents/skills/chrome-extensions/NOTICE.md'));
    }).not.toThrow();
  });

  it('documents store permissions and content script matches from the manifest', () => {
    const manifest = JSON.parse(readFileSync(path.join(projectDirectory, 'manifest.json'), 'utf8'));
    const storeDoc = readFileSync(path.join(projectDirectory, 'CHROMEWEBSTORE.md'), 'utf8');
    const contentScriptMatches = [
      ...new Set(manifest.content_scripts.flatMap((entry) => entry.matches))
    ];

    expect(storeDoc).toContain(manifest.name);
    for (const permission of manifest.permissions) {
      expect(storeDoc).toContain(`\`${permission}\``);
    }
    for (const matchPattern of contentScriptMatches) {
      expect(storeDoc).toContain(matchPattern);
    }
    expect(storeDoc).toContain('Do not include this file in the packaged extension ZIP');
  });

  it('keeps agent install paths and lint ignores configured', () => {
    const gitignore = readGitignorePatterns();
    const markdownlintIgnores = readMarkdownlintIgnores();
    const installScript = readFileSync(
      path.join(projectDirectory, 'scripts/install-agent-skills.sh'),
      'utf8'
    );

    expect(gitignore).toContain('.agents/skills/modern-web-guidance/');
    expect(gitignore.some((line) => line.includes('chrome-extensions'))).toBe(false);
    expect(markdownlintIgnores).toContain('.agents/skills/**');
    expect(markdownlintIgnores).toContain('CHROMEWEBSTORE.md');
    expect(installScript).toContain('#!/usr/bin/env sh');
    expect(installScript).toContain('set -eu');
    expect(installScript).toContain('modern-web-guidance@latest install');
  });

  it('does not ship store or agent metadata in the extension build output', () => {
    expect(BUILD_PATHS).not.toContain('CHROMEWEBSTORE.md');
    expect(BUILD_PATHS.some((entry) => entry.startsWith('.agents'))).toBe(false);
    expect(BUILD_PATHS.some((entry) => entry.startsWith('.cursor'))).toBe(false);
  });
});
