# Security Policy

## Reporting a vulnerability

Use GitHub's private vulnerability reporting on this repository
(Security → Report a vulnerability). Do not open public issues for security reports.

## Threat model notes

oc-relay touches credentials and executes provisioning commands. Design commitments:

- Secret providers (1Password service account, sops+age, direnv, plain env) are the only
  sources of credential material. Resolved values are cached on disk at mode `0600` only,
  under an explicit user-configured cache path, and never written into the repo.
- The parser and planner are pure functions with zero runtime dependencies; they never
  perform I/O. All execution happens behind explicit `apply` commands.
- No telemetry. No network egress except to the secret provider and container runtime the
  user explicitly configures.
- Provisioning steps that mutate machine state require explicit consent in the agent flow
  (OpenCode permission prompts).
