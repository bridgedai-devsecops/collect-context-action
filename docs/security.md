# Security documentation (`collect-context-action`)

## Threat model

Workflow context can contain attacker-controlled strings (for example PR titles). Treat parsed JSON as untrusted.

## Secret handling

This action avoids printing secrets and applies conservative redaction, but it cannot prove absence of secrets in arbitrary payloads.

## PR / fork risk

Forked PR workflows may include malicious payloads in the event JSON; keep `include-event-payload` disabled unless required.

## Audit checklist

- [ ] `include-event-payload` only enabled when necessary
- [ ] Output directory is not world-writable on self-hosted runners
