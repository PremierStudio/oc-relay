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
| Environments | `relay doctor` / `relay apply` | Agent-driven provisioning: MCP servers via headless secret providers (1Password service accounts, sops+age, direnv, plain), docker compose per worktree, post-create hooks. Composes with `.devcontainer/` when present. |
| Handoff | `/relay/handoff` | Interactive multiple-choice relay of sessions/worktrees between machines. Payload rides on git by default; fast path via OpenCode's sync protocol; OpenViking optional. |
| Discovery | automatic | Targets discovered as Tailscale **services** (`tailscale serve` + identity headers), not raw machines. |

## Status

🚧 Scaffolding — Layer 1 (env manifest) in development TDD-first.

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
# target offline? a bundle file is written instead — carry it, then:
relay receive --bundle relay-bundle-*.json --into ~/SampleApp
```

Inside OpenCode: drop `.opencode/command/handoff.md` into your project and
type `/handoff` — the agent walks the same flow for you.

## License

[MIT](./LICENSE)
