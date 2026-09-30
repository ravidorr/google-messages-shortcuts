import { readFile } from 'node:fs/promises';
import path from 'node:path';

const METRICS = [
  ['Lines', 'lines'],
  ['Statements', 'statements'],
  ['Functions', 'functions'],
  ['Branches', 'branches']
];

function formatPercentage(percentage) {
  return Number.isFinite(percentage) ? `${percentage.toFixed(2)}%` : 'N/A';
}

function formatFilePath(filePath) {
  const relativePath = path.isAbsolute(filePath) ? path.relative(process.cwd(), filePath) : filePath;

  return relativePath.replaceAll('\\', '/');
}

export function formatCoverageReport(coverageSummary) {
  const totalRows = METRICS.map(([label, key]) => (
    `| ${label} | ${formatPercentage(coverageSummary.total?.[key]?.pct)} |`
  ));
  const fileRows = Object.entries(coverageSummary)
    .filter(([filePath]) => filePath !== 'total')
    .sort(([firstFilePath], [secondFilePath]) => firstFilePath.localeCompare(secondFilePath))
    .map(([filePath, coverage]) => (
      `| \`${formatFilePath(filePath)}\` | ${formatPercentage(coverage.lines?.pct)} | ${formatPercentage(coverage.statements?.pct)} | ${formatPercentage(coverage.functions?.pct)} | ${formatPercentage(coverage.branches?.pct)} |`
    ));

  return [
    '## Code coverage',
    '',
    '| Metric | Coverage |',
    '| --- | ---: |',
    ...totalRows,
    '',
    '<details>',
    '<summary>Per-file coverage</summary>',
    '',
    '| File | Lines | Statements | Functions | Branches |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...fileRows,
    '',
    '</details>'
  ].join('\n');
}

async function writeCoverageReport() {
  const summary = JSON.parse(await readFile('coverage/coverage-summary.json', 'utf8'));
  console.log(formatCoverageReport(summary));
}

export const cliExecutionPromise = process.argv[1] === new URL(import.meta.url).pathname
  ? writeCoverageReport().catch((error) => {
    console.error('Failed to format the coverage report.', error);
    process.exit(1);
  })
  : undefined;
