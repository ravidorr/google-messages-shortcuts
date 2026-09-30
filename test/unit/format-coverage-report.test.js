import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatCoverageReport } from '../../scripts/format-coverage-report.js';

describe('formatCoverageReport', () => {
  it('formats all coverage metrics as a pull request report', () => {
    const report = formatCoverageReport({
      total: {
        branches: { pct: 93.69 },
        functions: { pct: 100 },
        lines: { pct: 96.23 },
        statements: { pct: 96.23 }
      },
      'src/example.js': {
        branches: { pct: 80 },
        functions: { pct: 75 },
        lines: { pct: 90 },
        statements: { pct: 85 }
      }
    });

    expect(report).toBe(`## Code coverage

| Metric | Coverage |
| --- | ---: |
| Lines | 96.23% |
| Statements | 96.23% |
| Functions | 100.00% |
| Branches | 93.69% |

<details>
<summary>Per-file coverage</summary>

| File | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: |
| \`src/example.js\` | 90.00% | 85.00% | 75.00% | 80.00% |

</details>`);
  });

  it('uses N/A when a coverage metric is unavailable', () => {
    expect(formatCoverageReport({ total: {} })).toContain('| Lines | N/A |');
  });

  it('sorts per-file coverage rows by path', () => {
    const report = formatCoverageReport({
      total: {},
      'src/zebra.js': { lines: { pct: 100 } },
      'src/alpha.js': { lines: { pct: 100 } }
    });

    expect(report.indexOf('src/alpha.js')).toBeLessThan(report.indexOf('src/zebra.js'));
  });

  it('formats absolute paths and non-finite per-file metrics', () => {
    const coverageFilePath = '/tmp/coverage/example.js';
    const report = formatCoverageReport({
      total: {
        branches: { pct: Number.NaN },
        functions: { pct: Number.POSITIVE_INFINITY },
        lines: { pct: Number.NEGATIVE_INFINITY },
        statements: { pct: undefined }
      },
      [coverageFilePath]: {
        branches: { pct: undefined },
        functions: { pct: Number.NaN },
        lines: { pct: Number.POSITIVE_INFINITY },
        statements: { pct: Number.NEGATIVE_INFINITY }
      }
    });

    expect(report).toContain('| Lines | N/A |');
    expect(report).toContain('| Statements | N/A |');
    expect(report).toContain('| Functions | N/A |');
    expect(report).toContain('| Branches | N/A |');
    expect(report).toContain(
      `| \`${path.relative(process.cwd(), coverageFilePath).replaceAll('\\', '/')}\` | N/A | N/A | N/A | N/A |`
    );
  });
});
