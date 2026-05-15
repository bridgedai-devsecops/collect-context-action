import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { fail, getOptionalInput } from './lib/action-core';
import { getBooleanInput } from './lib/inputs';
import { setOutputs } from './lib/outputs';
import { appendJobSummary } from './lib/summary';
import { ConfigurationError } from './lib/errors';

const SENSITIVE_KEY_RE =
  /(token|secret|password|authorization|cookie|bearer|apikey|api_key|private[_-]?key|ssh[_-]?key|ghs_|ghp_|github[_-]?token)/i;

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_RE.test(key);
}

function redactValue(_key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    if (value.startsWith('ghs_') || value.startsWith('ghp_') || value.startsWith('github_pat_')) {
      return '[REDACTED_STRING_TOKEN]';
    }
    if (value.length > 2000) {
      return `[REDACTED_LARGE_STRING_LEN_${value.length}]`;
    }
  }
  return value;
}

export function redactUnknown(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (typeof input === 'string') return redactValue('string', input);
  if (typeof input === 'number' || typeof input === 'boolean') return input;
  if (Array.isArray(input)) return input.map((x) => redactUnknown(x));
  if (typeof input === 'object') {
    const o = input as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (isSensitiveKey(k)) {
        out[k] = '[REDACTED_FIELD]';
        continue;
      }
      out[k] = redactUnknown(v);
    }
    return out;
  }
  return '[REDACTED_UNSUPPORTED_TYPE]';
}

function safeGithubEnv(): Record<string, string> {
  const keys = [
    'GITHUB_ACTION',
    'GITHUB_ACTIONS',
    'GITHUB_ACTOR',
    'GITHUB_API_URL',
    'GITHUB_BASE_REF',
    'GITHUB_ENV',
    'GITHUB_EVENT_NAME',
    'GITHUB_JOB',
    'GITHUB_REF',
    'GITHUB_REF_NAME',
    'GITHUB_REF_TYPE',
    'GITHUB_REPOSITORY',
    'GITHUB_REPOSITORY_ID',
    'GITHUB_REPOSITORY_OWNER',
    'GITHUB_REPOSITORY_OWNER_ID',
    'GITHUB_RETENTION_DAYS',
    'GITHUB_RUN_ATTEMPT',
    'GITHUB_RUN_ID',
    'GITHUB_RUN_NUMBER',
    'GITHUB_SERVER_URL',
    'GITHUB_SHA',
    'GITHUB_WORKFLOW',
    'GITHUB_WORKFLOW_REF',
    'GITHUB_WORKFLOW_SHA',
    'RUNNER_ARCH',
    'RUNNER_ENVIRONMENT',
    'RUNNER_OS',
    'RUNNER_NAME',
  ];
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = String(process.env[k] ?? '');
    if (!v) continue;
    if (isSensitiveKey(k)) continue;
    out[k] = v;
  }
  return out;
}

export async function run(): Promise<void> {
  const outputFile = getOptionalInput('output-file') || '.bridgedai/context.json';
  const includePayload = getBooleanInput('include-event-payload', false);

  const eventPath = String(process.env.GITHUB_EVENT_PATH ?? '').trim();
  let event: unknown = undefined;
  if (includePayload) {
    if (!eventPath) {
      throw new ConfigurationError('include-event-payload=true requires GITHUB_EVENT_PATH');
    }
    const raw = await fs.promises.readFile(eventPath, 'utf8');
    try {
      event = JSON.parse(raw) as unknown;
    } catch {
      throw new ConfigurationError('Failed to parse GITHUB_EVENT_PATH JSON');
    }
  }

  const evidence = {
    kind: 'bridgedai.github.workflow_context/v1',
    collectedAt: new Date().toISOString(),
    github: safeGithubEnv(),
    event: includePayload ? redactUnknown(event) : undefined,
  };

  const absOut = path.resolve(outputFile);
  await fs.promises.mkdir(path.dirname(absOut), { recursive: true });
  const json = `${JSON.stringify(evidence, null, 2)}\n`;
  await fs.promises.writeFile(absOut, json, { encoding: 'utf8', mode: 0o644 });

  const digest = createHash('sha256').update(json, 'utf8').digest('hex');

  setOutputs({
    'context-file': absOut,
    'context-digest': digest,
  });

  await appendJobSummary(`## BridgedAI context evidence\n\n- **file**: \`${absOut}\`\n- **digest**: \`${digest}\`\n`);
}

if (process.env.VITEST !== 'true') {
  void run().catch((e) => {
    fail(e instanceof Error ? e : new Error(String(e)));
  });
}
