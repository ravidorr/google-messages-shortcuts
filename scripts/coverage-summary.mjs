import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MARKER = '<!-- coverage-report -->';

export function formatCoverageSummary(file = 'coverage/coverage-summary.json', {
  exists = existsSync,
  readFile = readFileSync
} = {}) {
  if (!exists(file)) {
    return `${MARKER}\n### Coverage\n\nNo coverage summary found at \`${file}\`. The tests may have failed before coverage was collected.`;
  }

  const { total } = JSON.parse(readFile(file, 'utf8'));
  const metrics = [
    ['Lines', total.lines],
    ['Statements', total.statements],
    ['Functions', total.functions],
    ['Branches', total.branches]
  ];
  const rows = metrics.map(([name, metric]) => `| ${name} | ${metric.pct}% | ${metric.covered}/${metric.total} | ${metric.pct === 100 ? 'pass' : 'FAIL (100% required)'} |`);

  return [MARKER, '### Coverage', '', '| Metric | Coverage | Covered | Status |', '| --- | --- | --- | --- |', ...rows, ''].join('\n');
}

export function main(file = process.argv[2]) {
  console.log(formatCoverageSummary(file));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
