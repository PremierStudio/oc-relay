# oc-relay

**Declarative environments + cross-machine session relay for [OpenCode](https://opencode.ai).**

One manifest provisions any machine. One command moves your work.

```jsonc
// .opencode/env.json — commit it. Every machine converges to this.
{
  "name": "my-project",
  "secrets": { "provider": "onepassword", "onepassword": { "vault": "agent-mcp", "tokenFile": "~/.config/op/mcp-sa.token" } },
  "compose": { "files": ["docker-compose.yml"], "project": "${repo}-${worktreeSlug}" },
  "mcpServers": {
    "github": {
      "command": ["npx", "-y", "@modelcontextprotocol/server-github"],
      "secretRefs": { "GITHUB_PERSONAL_ACCESS_TOKEN": "op://agent-mcp/github-pat/token" }
    }
  }
}
```

## What it does

| Layer | Command | Description |
|---|---|---|
| Environments | `relay doctor` / `relay apply` | Agent-driven provisioning: MCP servers via secret providers (plain env today; 1Password/sops adapters are slots), post-create/doctor hooks. |
| Handoff | `relay send` / `relay receive` + `/handoff` command | Move sessions, worktree context, and WIP commits between machines. Fast path via OpenCode's sync protocol; offline fallback to a portable JSON bundle + git-bundle sidecar. |
| Discovery | `relay ping` / `relay enroll` | Fleet targets from `~/.config/oc-relay/fleet.json`; optional tailnet peer discovery — strictly opt-in per invocation (`--all`). |
| Authorization | `relay authz` / `relay serve-approvals` | Single-use hashed-token approvals with claim URLs for phone taps. |

## Status

Phases 0–5 implemented and gated: 100% line/branch/function coverage,
100% mutation score, an asserting E2E suite (`npm run test:e2e`) over the
real binary with real git and fake OC2/tailscale surfaces, and a manual
checklist ([`docs/MANUAL-CHECKLIST.md`](docs/MANUAL-CHECKLIST.md)) for
real-tailnet and real-phone validation. Code transport in bundles is
context+session today (git carries the branch); richer WIP transport is
roadmap. See [`VISION.md`](VISION.md) and [`TEST-MATRIX.md`](TEST-MATRIX.md).

## Quality gates

- 100% line/branch/function coverage (CI-enforced)
- 100% mutation score on domain logic (StrykerJS, CI-enforced)
- Strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- CI matrix: macOS / Linux / Windows
- Zero runtime dependencies for core parsing/provisioning logic

## Development

```sh
npm install
npm run check     # typecheck + 100% coverage gate
npm run mutate    # StrykerJS mutation testing (breaks below 100%)
npm run build     # tsup ESM + dts
```

## Quickstart

```sh
# 1. Declare your environment (commit this)
.opencode/env.json

# 2. Audit a machine against it
relay doctor --repo ~/SampleApp

# 3. Tell relay about your other machine
~/.config/oc-relay/fleet.json
{ "targets": { "build-server": {
    "baseUrl": "http://build-server:49374",
    "username": "pair-user",
    "passwordEnv": "PEER_RELAY_PASS",
    "repoDir": "/home/u/SampleApp" } } }

# 4. Send the session + branch over
relay send --target build-server --session ses_xxx --context-file ctx.json
# target offline? a bundle file plus a .bundle sidecar (your branch's WIP
# commits) are written — carry both, then:
relay receive --bundle relay-bundle-*.json --into ~/SampleApp
```

Inside OpenCode: drop `.opencode/command/handoff.md` into your project and
type `/handoff` — the agent walks the same flow for you.

## License

[MIT](./LICENSE)
