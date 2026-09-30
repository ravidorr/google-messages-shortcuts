import { execFileSync } from 'node:child_process';

export function canCommitOnBranch(branchName) {
  return branchName !== 'main';
}

function getCurrentBranch() {
  return execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
}

function preventMainCommit() {
  if (!canCommitOnBranch(getCurrentBranch())) {
    console.error(
      'Commit blocked: create a feature branch and merge it into main through a pull request.'
    );
    process.exit(1);
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  preventMainCommit();
}
