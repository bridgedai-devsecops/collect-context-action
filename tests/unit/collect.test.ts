import { describe, expect, it } from 'vitest';
import { redactUnknown } from '../../src/index';

describe('collect-context-action', () => {
  it('redacts sensitive keys', () => {
    const out = redactUnknown({ github_token: 'x', nested: { apiKey: 'y' } }) as Record<string, unknown>;
    expect(out.github_token).toBe('[REDACTED_FIELD]');
  });

  it('redacts github-like string tokens', () => {
    const out = redactUnknown({ a: 'ghs_example' }) as Record<string, unknown>;
    expect(out.a).toBe('[REDACTED_STRING_TOKEN]');
  });
});
