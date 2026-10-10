// @vitest-environment node

import { accessSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

describe('agent AI tooling', () => {
  it('configures Chrome DevTools MCP for extension debugging', () => {
    const mcpConfig = JSON.parse(
      readFileSync(path.join(projectDirectory, '.cursor/mcp.json'), 'utf8')
    );
    const devtools = mcpConfig.mcpServers['chrome-devtools-mcp'];

    expect(devtools.command).toBe('npx');
    expect(devtools.args).toContain('--categoryExtensions');
    expect(devtools.args).toContain('--autoConnect');
  });

  it('vendors the chrome-extensions Modern Web Guidance skill', () => {
    expect(() => {
      accessSync(path.join(projectDirectory, '.agents/skills/chrome-extensions/SKILL.md'));
    }).not.toThrow();
  });

  it('documents store permissions that match the manifest', () => {
    const manifest = JSON.parse(readFileSync(path.join(projectDirectory, 'manifest.json'), 'utf8'));
    const storeDoc = readFileSync(path.join(projectDirectory, 'CHROMEWEBSTORE.md'), 'utf8');

    for (const permission of manifest.permissions) {
      expect(storeDoc).toContain(`\`${permission}\``);
    }

    expect(storeDoc).toContain('messages.google.com/web');
    expect(storeDoc).toContain('Do not include this file in the packaged extension ZIP');
  });
});
