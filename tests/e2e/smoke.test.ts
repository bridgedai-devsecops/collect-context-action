import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as core from '@actions/core';
import { run } from '../../src/index';

describe('collect-context-action e2e', () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
    vi.restoreAllMocks();
  });

  it('writes context file', async () => {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'bdai-ctx-'));
    const outFile = path.join(dir, 'ctx.json');
    process.env.GITHUB_REPOSITORY = 'org/repo';
    process.env.GITHUB_SHA = 'abc';
    process.env.GITHUB_RUN_ID = '123';
    delete process.env.GITHUB_EVENT_PATH;

    vi.spyOn(core, 'setOutput').mockImplementation(() => {});
    vi.spyOn(core, 'getInput').mockImplementation((name: string) => {
      if (name === 'output-file') return outFile;
      if (name === 'include-event-payload') return 'false';
      return '';
    });

    await run();
    const txt = await fs.promises.readFile(outFile, 'utf8');
    expect(txt).toContain('bridgedai.github.workflow_context/v1');
  });
});
