# oc-relay — Final Vision

> **The work follows you. You approve; relay does everything else.**

A human interacts with relay through exactly two gestures:

1. **Scan/tap** — a QR or push notification on the phone
2. **Confirm** — biometric approve

Everything else — commits, pushes, session serialization, environment
provisioning, discovery, transport, trust — is relay's job.

---

## The five transports (never fight what exists)

| What moves | Transport | Why |
|---|---|---|
| Code | **git** (push/bundle) | Already the source of truth; relay never reinvents it |
| Sessions | **OC2 sync protocol** (`POST /sync/history`, `/sync/replay` → `{sessionID}`, `/sync/steal`) | Anomaly's own internal cross-machine transfer path; relay is its missing client. Fallback: `opencode export/import` (accepts share URLs) |
| Context/memory | **In-band handoff manifest** — structured JSON (summary · done/left · decisions · pointers) riding inside the payload, anchored as a file/ref in the target repo | Self-contained: zero external infra, works for every user |
| Environment | **`.opencode/env.json` + `relay apply`** | Declarative convergence: any machine → same env |
| Trust | **OC2 pair credentials + peer identity + phone biometrics** | Machines prove themselves; humans just approve |

## Dependency rule: core is minimal, adapters enhance

**Hard requirements — the complete list:**
- `git`
- An OpenCode 2 server (its API ships with every install)

That's it. Anyone with those two things gets 100% of relay's function.

**Adapters — optional, auto-detected, never gating:**

| Slot (interface) | Reference impl | Without it | Swap in your own |
|---|---|---|---|
| **Discovery** | Tailscale services | Manual host list | NetBird, mDNS, static YAML |
| **Reachability** | Mesh-private HTTPS | Direct HTTPS / LAN URL | Any VPN, SSH tunnel |
| **Secrets** | 1Password SA | `plain` env vars (already tiered in env.json) | sops+age, direnv, Vault |
| **ContextArchive** | OpenViking | In-band manifest + git history | Obsidian sync, Notion export, nothing |
| **Rendezvous** | CF Durable Object | Direct-only (both machines online) | Git remote as mailbox, self-hosted queue |

Same pattern as the env.json secret providers: the schema names the slot,
runtime probes for the capability, falls back cleanly. An adapter being
missing is a normal state, not an error.

**Stronger rule — slots are swappable, not just optional.** Each slot above
is an interface with (1) a reference implementation, (2) a zero-dependency
fallback, and (3) an open contract for user-supplied implementations.
Tailscale, Cloudflare, and OpenViking are first-party *examples* filling
slots — never names checked by core. If a user can serve the slot's
contract with something else, core cannot tell the difference.

## The topology

```
        ┌────────────── phone (the only UI you touch) ──────────────┐
        │   scan · approve · open any session from anywhere         │
        └──────────┬────────────────────────────────┬───────────────┘
                   │                                │
     Tailscale (private mesh)          HTTPS + Cloudflare Access (public door)
                   │                                │
   ┌───────────────┴────────────┐        ┌──────────┴──────────┐
   │ laptop    desktop   nas   │        │  CF Durable Object  │
   │  OC2      OC2       OC2    │        │  "cloud twin"       │
   │  └─────────┬───────────────┘        │  OC2-in-workerd     │
   │     git remote (shared)         │  · rendezvous queue │
   │                                 │  · session home away│
   └─────────────────────────────────┘  · fleet control plane│
                                             (SQLite + durable events)
```

### Where the Durable Object slots in (recovered context)

`@opencode-ai/sdk/workerd`: OpenCode v2 runs inside a DO — object SQLite is
the session store, durable events give eviction recovery, no local
filesystem/processes required. That makes the DO three things for relay:

1. **Rendezvous** — machines sleep; the DO never does. Handoff payloads queue
   there and drain when the target wakes. Kills the "both boxes online at
   once" requirement.
2. **Cloud twin** — a per-project OC2 living in the cloud. When every machine
   is shut, the session still runs; resume it from the phone browser.
3. **Public door** — real TLS + Cloudflare Access means the phone can reach a
   session from any network, and "authorization" becomes a CF one-time PIN +
   biometric instead of raw pair creds in a URL.

## The flows

*Flows below show the full-adapter configuration (your setup). Every
adapter-less path degrades per the table above — e.g. no Tailscale means a
pasted host:port instead of discovery; no 1Password means plain env vars.*

### Move work (machine → machine)
```
you: "move this to build-server"            (or tap /relay → pick from list)
relay: commit WIP → push branch
relay: export session event stream (sync/history)
relay: post offer to build-server's OC2 API (pair creds, via tailnet)
build-server: /sync/replay → session recreated
build-server: worktree created (branch opencode/<name>)
build-server: relay apply ← env.json (1Password SA resolves secrets silently)
phone: 🔔 "sample session is live on build-server" → tap → working
```
**Human effort: one sentence or one tap.**

### Join a new machine
Machine prints an enrollment QR (tailnet name + short-lived token).
Scan from phone → machine enters the fleet: pair creds exchanged,
env.json applied, appears in every future handoff picker.
**One scan, once, forever.**

### Authorize something sensitive
Instead of desktop-app approval popups (the 1Password spam problem):
requests surface as phone notifications → tap → biometric → done.
Audit trail lives in the fleet control plane.

### Work from anywhere
Open phone browser → DO cloud twin → the session is just there, with its
full environment, even with every machine powered off.

## Build order (each phase shippable alone)

| Phase | Deliverable | Gate |
|---|---|---|
| ✅ 0 | Manifest parser (types → validate → parse) | 100% cov · 100% mut |
| ✅ 1 | `relay doctor` / `relay apply` — idempotent env convergence (secrets slot + plain impl, MCP drift engine, atomic config writes, hooks) | same gates · e2e smoke ✓ |
| ✅ 2 | Transport lib: sync-protocol client + export/import fallback + worktree create + **in-band handoff manifest** (`handoff.v1`) | same gates · real-git smoke ✓ |
| ✅ 3 | `/handoff` command (`.opencode/command/`) + `relay` CLI (`send` / `receive` / `targets` / `doctor`) — E2E machine↔machine via bundle or direct push | demo ✓ |
| ✅ 4 | Discovery: `relay ping --all` enumerates tailnet peers (Tailscale slot); `relay enroll NAME` builds fleet entries from discovered peers — **opt-in, never auto-probed** | demo ✓ |
| ✅ 5 | Authorization layer (`src/authz/`): request/approve/consume lifecycle, hashed single-use tokens, claim URLs + QR adapter, approval HTTP server, `relay authz` CLI + `serve-approvals` | behaviorally tested · mutation sweep pending |
| Gate (all phases) | 100% line/branch/function coverage ✓ · mutation: manifest+provision 100% ✓ · full-src sweep **in progress** (~155 survivors — see HANDOFF.md) |
| 5 | Phone authorization surfaces (approvals, claim QRs) | demo |
| 6 | DO anchor: rendezvous queue, cloud twin, CF Access door | demo |

## Upstream story

We're not hacking around OpenCode — we're productizing the relay pattern
Anomaly built internally and never exposed. Contribution pitch: *"here's the
missing client for your own sync protocol, plus the stability contract you
never wrote."* Target: featured on the OC plugins page.
