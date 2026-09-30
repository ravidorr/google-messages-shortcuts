import { readFile } from 'node:fs/promises';

const METRICS = [
  ['Lines', 'lines'],
  ['Statements', 'statements'],
  ['Functions', 'functions'],
  ['Branches', 'branches']
];

function formatPercentage(percentage) {
  return Number.isFinite(percentage) ? `${percentage.toFixed(2)}%` : 'N/A';
}

export function formatCoverageReport(coverageSummary) {
  const rows = METRICS.map(([label, key]) => (
    `| ${label} | ${formatPercentage(coverageSummary.total?.[key]?.pct)} |`
  ));

  return [
    '## Code coverage',
    '',
    '| Metric | Coverage |',
    '| --- | ---: |',
    ...rows
  ].join('\n');
}

async function writeCoverageReport() {
  const summary = JSON.parse(await readFile('coverage/coverage-summary.json', 'utf8'));
  console.log(formatCoverageReport(summary));
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  writeCoverageReport().catch((error) => {
    console.error('Failed to format the coverage report.', error);
    process.exit(1);
  });
}
