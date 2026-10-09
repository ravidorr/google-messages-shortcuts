// @vitest-environment node

import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatCoverageSummary,
  main as coverageSummaryMain
} from '../scripts/coverage-summary.mjs';
import {
  lintHtml,
  listHtmlFiles,
  main as lintHtmlMain
} from '../scripts/lint-html.mjs';

const originalArgv = process.argv;
const originalExitCode = process.exitCode;

afterEach(() => {
  process.argv = originalArgv;
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

describe('coverage summary', () => {
  it('reports a missing coverage file', () => {
    expect(formatCoverageSummary('missing.json', { exists: () => false }))
      .toContain('No coverage summary found');
  });

  it('renders passing and failing metrics', () => {
    const summary = formatCoverageSummary('coverage.json', {
      exists: () => true,
      readFile: () => JSON.stringify({
        total: {
          lines: { pct: 100, covered: 2, total: 2 },
          statements: { pct: 99, covered: 99, total: 100 },
          functions: { pct: 100, covered: 1, total: 1 },
          branches: { pct: 100, covered: 3, total: 3 }
        }
      })
    });

    expect(summary).toContain('| Lines | 100% | 2/2 | pass |');
    expect(summary).toContain('| Statements | 99% | 99/100 | FAIL (100% required) |');
  });

  it('runs as a callable command', () => {
    const logger = vi.spyOn(console, 'log').mockImplementation(() => {});
    coverageSummaryMain('missing.json');

    expect(logger).toHaveBeenCalledOnce();
  });
});

describe('HTML lint', () => {
  it('lists tracked and untracked HTML files', () => {
    const command = vi.fn(() => 'popup.html\ndesign-system/index.html\n');

    expect(listHtmlFiles(command)).toEqual(['popup.html', 'design-system/index.html']);
    expect(command).toHaveBeenCalledWith(
      'git',
      ['ls-files', '--cached', '--others', '--exclude-standard', '*.html'],
      { encoding: 'utf8' }
    );
  });

  it('succeeds without HTML files', () => {
    const logger = vi.fn();

    expect(lintHtml({ files: [], logger })).toBe(0);
    expect(logger).toHaveBeenCalledWith('lint-html: no HTML files, nothing to validate.');
  });

  it('returns the linter status and handles an absent status', () => {
    const spawn = vi.fn(() => ({ status: 2 }));
    expect(lintHtml({ files: ['popup.html'], spawn })).toBe(2);
    expect(spawn).toHaveBeenCalledWith(
      'npx',
      ['html-validate', 'popup.html'],
      { stdio: 'inherit' }
    );

    expect(lintHtml({ files: ['popup.html'], spawn: () => ({ status: null }) })).toBe(1);
  });

  it('runs the project HTML lint command', () => {
    lintHtmlMain();
    expect(process.exitCode).toBe(0);
  });
});

describe('utility script CLI entrypoints', () => {
  it('runs coverage summary and HTML lint scripts when invoked directly', async () => {
    const scriptPaths = [
      new URL('../scripts/coverage-summary.mjs', import.meta.url),
      new URL('../scripts/lint-html.mjs', import.meta.url)
    ];
    const logger = vi.spyOn(console, 'log').mockImplementation(() => {});

    for (const scriptUrl of scriptPaths) {
      process.argv = ['node', fileURLToPath(scriptUrl)];
      await import(`${scriptUrl.href}?run=${Date.now()}`);
    }

    expect(logger).toHaveBeenCalled();
    expect(process.exitCode).toBe(0);
  });
});
