<div align="center">

# oc-relay

**The work follows you.**

Move your in-progress work — code, context, and your OpenCode session —
from laptop → desktop → build server with one command.
Even when the other machine is offline.

[![CI](https://github.com/PremierStudio/oc-relay/actions/workflows/ci.yml/badge.svg)](https://github.com/PremierStudio/oc-relay/actions/workflows/ci.yml)
![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![mutation score](https://img.shields.io/badge/mutation%20score-100%25-brightgreen)
![mutants](https://img.shields.io/badge/mutants%20killed-2008%20%2F%202008-blue)
![license](https://img.shields.io/badge/license-MIT-black)

**`relay send --target desktop`**

</div>

---

```
laptop $  relay send --target desktop --session ses_7f3 --context-file ctx.json

          packing   branch opencode/tag-fix (3 commits)
                    session ses_7f3 · done[2] · left[3] · decisions[1]
          ✓ pushed via sync-replay → desktop
          ✓ target session ses_9c2 · worktree ready


desktop $ cd ~/code/app/.worktrees/tag-fix && ls .relay/

          handoff.json   ← your notes, anchored in the repo
                            your branch, your commits, your session.
                            pick up exactly where you left off.
```

## The problem

You were deep in something on your laptop. Now you're at your desktop.

Your branch is there (git handles that). But your *context* isn't —
the half-formed thoughts, the "done / left / decisions" in your head,
and your OpenCode session that took twenty minutes of explaining to get
useful. So you re-explain. Every time. To every machine.

**relay ends that.** One command moves the whole session. The other
machine boots your worktree with your notes anchored inside the repo and
your session live.

## Three things move

| What | How | Survives offline |
|---|---|---|
| **Your code** | git branch + WIP commits | ✓ rides as a git-bundle sidecar next to the handoff file |
| **Your context** | a `done / left / decisions` memo | ✓ anchored to `.relay/handoff.json` in the repo — plain JSON, forever readable |
| **Your session** | OpenCode's sync protocol (fast path) | ✓ `opencode export`/`import` fallback carried in-band |

Both machines online? Direct push, instant. Target asleep? relay writes a
portable bundle — carry it over by any means, `relay receive` unpacks
worktree + commits + context + session.

## 60-second start

```sh
npm install -g oc-relay
```

Tell relay about your other machine once:

```jsonc
// ~/.config/oc-relay/fleet.json  (override: $RELAY_FLEET)
{ "targets": { "desktop": {
    "baseUrl": "http://desktop:49374",
    "username": "pair-user",
    "passwordEnv": "DESKTOP_RELAY_PASS",   // secrets live in env, never in files
    "repoDir": "~/code/myapp" } } }
```

Then, from inside your repo:

```sh
relay send --target desktop                      # code + context
relay send --target desktop --session ses_x      # + the live session
relay send --target desktop --context-file ctx.json
# target offline? a handoff.json + .bundle sidecar are written instead:
relay receive --bundle relay-bundle-*.json --into ~/code/myapp
```

Inside OpenCode, drop `.opencode/command/handoff.md` (ships in the
package) into your project and type `/handoff` — the agent walks the
same flow with you.

## Commands

| Command | What it does |
|---|---|
| `relay send` | Move work to a target — direct push, or bundle if unreachable |
| `relay receive` | Unpack a carried bundle: worktree, commits, context, session |
| `relay targets` | List your fleet |
| `relay ping [--all]` | Check reachability. `--all` adds tailnet peers — **strictly opt-in, never scans unless asked** |
| `relay enroll` | Add a machine to your fleet (auto-discovers its URL on your tailnet) |
| `relay doctor` / `relay apply` | Audit / converge this machine's env against `.opencode/env.json` |
| `relay authz new` | Mint a one-time approval — prints a claim URL + QR for your phone |
| `relay serve-approvals` | Run the phone-approval endpoint (loopback by default) |

## Security you don't have to think about

- **Secrets never touch disk.** Credentials resolve from env vars at use time.
- **Approvals are one-time.** Tokens are shown once, stored only as SHA-256
  hashes, valid for one tap and a TTL. A stolen link approves exactly
  nothing else, ever.
- **No ambient network scanning.** Discovery runs only when you pass
  `--all`. Privacy is the default, not a setting.
- **Atomic, locked state.** Concurrent relay processes can't corrupt or
  double-consume approvals; crashed locks self-heal.

## The receipts

Most tools ask you to trust the README. This one ships proof:

- **100% coverage** — every line, branch, and function, enforced in CI
- **2,008 mutants killed, 0 survivors** — an automated saboteur rewrote
  the code thousands of ways ("flip this check", "delete this guard");
  every single one was caught by a test. The three exemptions that exist
  are documented with reasons and audited.
- **22 end-to-end scenarios** drive the real binary with real git:
  offline transfers, phone approvals, corrupted configs, concurrent
  writes — [the whole map](TEST-MATRIX.md).
- **Synthetic fixtures only.** No test ever touches a real network,
  tailnet, or hostname. ([Why that matters](CONTRIBUTING.md#the-rules).)

```sh
npm run check       # typecheck + tests + 100% coverage gate
npm run test:e2e    # 22 scenarios against the real binary
npm run mutate      # the saboteur. 2,008 attempts, zero survivors.
```

## Built for OpenCode

relay is the missing client for OpenCode's own cross-machine sync
protocol — the same internal path their tools use, productized for
everyone, with the stability contract written down and mutation-tested.
Adapters are swappable slots (discovery, secrets, transport): Tailscale
is a *reference implementation*, never a hard dependency. If you have
git and an OpenCode server, you have 100% of relay.

We'd love to see this upstreamed or featured in the plugin ecosystem.

## Contributing

TDD-first, 100%-or-documented-exemption, three-OS CI. Start with
[CONTRIBUTING.md](CONTRIBUTING.md) and [TEST-MATRIX.md](TEST-MATRIX.md).

## License

[MIT](./LICENSE)
