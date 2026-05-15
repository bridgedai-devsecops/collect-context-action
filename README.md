# BridgedAI Collect Context (`bridgedai-devsecops/collect-context-action`)

## What this action does

Writes a conservative JSON snapshot of GitHub workflow context to disk for downstream evidence upload, with explicit redaction of sensitive fields.

## Why BridgedAI exists

BridgedAI correlates CI evidence into a trust graph; consistent context capture is required for reproducible audits.

## Quick start

```yaml
- uses: bridgedai-devsecops/collect-context-action@v1
  id: ctx
```

## Enterprise setup

- Pin semver tags and store output paths under a controlled directory (default `.bridgedai/`).

## Inputs / outputs

See `action.yml`.

## Required permissions

Typically `contents: read` (no secrets required).

## Failure modes

- Invalid JSON in `GITHUB_EVENT_PATH` when `include-event-payload=true`.

## Security model

GitHub context and payloads are treated as untrusted input; obvious secret patterns are redacted, but redaction is not a guarantee against all exfiltration paths.

## Versioning policy

semver + moving `vMAJOR`.

## Troubleshooting

If the event payload is missing, ensure `include-event-payload=false` or run on GitHub Actions (provides `GITHUB_EVENT_PATH`).

## Support / contact

Use your BridgedAI support channel.

