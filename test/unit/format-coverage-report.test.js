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
});
