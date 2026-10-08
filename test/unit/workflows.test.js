// @vitest-environment node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

const workflowsDirectory = fileURLToPath(new URL('../../.github/workflows', import.meta.url));
const pinnedExternalActionPattern = /^[^/\s]+\/[^@\s]+@[0-9a-f]{40}(?:\s+#\s+v\d+(?:\.\d+)*)?$/;

async function readWorkflowFiles() {
  const entries = await readdir(workflowsDirectory);

  return Promise.all(entries
    .filter((entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'))
    .map(async (entry) => ({
      name: entry,
      content: await readFile(path.join(workflowsDirectory, entry), 'utf8')
    })));
}

function isExternalActionReference(actionUse) {
  return typeof actionUse === 'string'
    && !actionUse.startsWith('./')
    && !actionUse.startsWith('docker://');
}

function collectUsesFromSteps(steps, actionUses) {
  if (!Array.isArray(steps)) {
    return;
  }

  for (const step of steps) {
    if (step && typeof step === 'object' && 'uses' in step && isExternalActionReference(step.uses)) {
      actionUses.push(step.uses);
    }
  }
}

function collectUsesFromJobs(jobs, actionUses) {
  if (!jobs || typeof jobs !== 'object') {
    return;
  }

  for (const job of Object.values(jobs)) {
    if (!job || typeof job !== 'object') {
      continue;
    }

    if ('uses' in job && isExternalActionReference(job.uses)) {
      actionUses.push(job.uses);
    }

    collectUsesFromSteps(job.steps, actionUses);
  }
}

export function getActionUses(content) {
  const workflow = parseYaml(content);
  const actionUses = [];

  collectUsesFromJobs(workflow?.jobs, actionUses);

  return actionUses;
}

describe('GitHub workflow security', () => {
  it('collects step and job uses declarations from parsed YAML', () => {
    const localThis = {
      content: [
        'jobs:',
        '  report:',
        '    uses: owner/reusable-workflow@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        '    steps:',
        '      - uses: actions/checkout@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        '      - "uses": actions/setup-node@cccccccccccccccccccccccccccccccccccccccc',
        '      - { uses: actions/github-script@dddddddddddddddddddddddddddddddddddddddd }',
        '      - uses: ./scripts/local-action',
        '      - uses: docker://node:22'
      ].join('\n')
    };

    expect(getActionUses(localThis.content)).toEqual([
      'owner/reusable-workflow@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'actions/checkout@bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      'actions/setup-node@cccccccccccccccccccccccccccccccccccccccc',
      'actions/github-script@dddddddddddddddddddddddddddddddddddddddd'
    ]);
  });

  it('pins third-party actions to immutable commit SHAs', async () => {
    const workflows = await readWorkflowFiles();

    for (const workflow of workflows) {
      for (const actionUse of getActionUses(workflow.content)) {
        expect(actionUse, `${workflow.name} uses mutable action reference "${actionUse}"`).toMatch(
          pinnedExternalActionPattern
        );
      }
    }
  });

  it('skips coverage comment publication for fork pull requests', async () => {
    const workflows = await readWorkflowFiles();
    const coverageWorkflow = workflows.find(({ name }) => name === 'coverage-report.yml');

    expect(coverageWorkflow?.content).toContain(
      'if: github.event.pull_request.head.repo.full_name == github.repository'
    );
  });

  it('updates only the GitHub Actions coverage comment', async () => {
    const workflows = await readWorkflowFiles();
    const coverageWorkflow = workflows.find(({ name }) => name === 'coverage-report.yml');

    expect(coverageWorkflow?.content).toContain(
      "comment.user?.login === 'github-actions[bot]'"
    );
  });

  it('publishes only merged main pull requests through OIDC', async () => {
    const workflows = await readWorkflowFiles();
    const publishWorkflow = workflows.find(({ name }) => name === 'publish-chrome-web-store.yml');
    const publishWorkflowContent = publishWorkflow?.content ?? '';
    const publishWorkflowConfig = parseYaml(publishWorkflowContent);

    expect(publishWorkflowConfig?.on).toEqual({
      pull_request: {
        types: ['closed']
      }
    });
    expect(publishWorkflowConfig?.permissions).toEqual({
      contents: 'read',
      'id-token': 'write'
    });
    expect(publishWorkflowContent).toContain(
      "github.event.pull_request.merged == true && github.event.pull_request.base.ref == 'main'"
    );
    expect(publishWorkflowContent).toContain('GCP_WORKLOAD_IDENTITY_PROVIDER');
    expect(publishWorkflowContent).toContain('GCP_SERVICE_ACCOUNT');
    expect(publishWorkflowContent).toContain('CWS_PUBLISHER_ID');
    expect(publishWorkflowContent).toContain('CWS_EXTENSION_ID');
    expect(publishWorkflowContent).toContain('"publishType":"DEFAULT_PUBLISH"');
    expect(publishWorkflowContent).toContain('"skipReview":false');
    expect(publishWorkflowContent).toContain('"blockOnWarnings":true');
  });

  it('supersedes an active Chrome Web Store submission before uploading a new release', async () => {
    const workflows = await readWorkflowFiles();
    const publishWorkflow = workflows.find(({ name }) => name === 'publish-chrome-web-store.yml');
    const publishWorkflowContent = publishWorkflow?.content ?? '';

    expect(publishWorkflowContent).toContain('submittedItemRevisionStatus.state');
    expect(publishWorkflowContent).toContain('PENDING_REVIEW|STAGED');
    expect(publishWorkflowContent).toContain(':cancelSubmission');
  });

  it('validates release metadata in the version-bump workflow', async () => {
    const workflows = await readWorkflowFiles();
    const versionBumpWorkflow = workflows.find(({ name }) => name === 'version-bump.yml');

    expect(versionBumpWorkflow?.content).toContain(
      'node scripts/validate-release-metadata.js origin/${{ github.base_ref }}'
    );
  });
});
