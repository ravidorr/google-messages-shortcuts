import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function listHtmlFiles(command = execFileSync) {
  return command('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.html'], {
    encoding: 'utf8'
  })
    .split('\n')
    .filter((file) => file && !file.startsWith('.claude/'));
}

export function lintHtml({
  files = listHtmlFiles(),
  spawn = spawnSync,
  logger = console.log
} = {}) {
  if (files.length === 0) {
    logger('lint-html: no HTML files, nothing to validate.');
    return 0;
  }

  return spawn('npx', ['html-validate', ...files], { stdio: 'inherit' }).status ?? 1;
}

export function main() {
  process.exitCode = lintHtml();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
