# MANUAL-CHECKLIST — oc-relay human validation

Run this on real hardware after every release candidate. Automated suites
(`npm run check`, `npm run mutate`, `npm run test:e2e`) must be green
first. Record evidence per run; a scenario that cannot be tested is a
**blocker**, not a pass.

## Run metadata

| Field | Value |
|---|---|
| Release/tarball SHA | |
| Operator | |
| Date | |
| OS + Node version (each machine) | |
| OpenCode version (each machine) | |
| Tailscale version + tailnet name | *(redact the real name from artifacts)* |

## Safety rules

- Use a scratch tailnet/test repos only; never production credentials.
- Passwords live in env vars (`*_RELAY_PASS`), never in fleet.json.
- After the run: stop `serve-approvals`, delete scratch fleet entries,
  worktrees, and repos; revoke any test tokens.

## 1. Installed artifact (PKG-03)

> Automated by `test/e2e/pkg-install.test.mjs` (PKG-02). Spot-check on real hardware:

- [ ] `npm pack` → install the tarball into an empty dir; `require`/`import`
      of `oc-relay` resolves and exposes the documented exports.
- [ ] `.bin/relay` is executable and `relay` with no args prints usage, exit 2.
- [ ] The packaged files include the `/handoff` command asset
      (`.opencode/command/handoff.md`).

## 2. Environment convergence (ENV-01, real secret provider)

- [ ] `relay doctor --repo <repo>` on a fresh clone reports drift, exit 1.
- [ ] With the real secret provider configured, `relay apply` resolves
      secrets without prompting and writes opencode.json.
- [ ] Second `relay apply` is a no-op ("nothing to change").
- [ ] `relay doctor` is now green, exit 0.

## 3. Fleet + discovery (FLEET-01, DISC-01)

- [ ] `relay targets` lists the configured fleet.
- [ ] `relay ping` (no flags) touches only fleet targets — verify in the
      OC2 server logs that no other peer was contacted.
- [ ] `relay ping --all` enumerates real tailnet peers, marks reachable
      ones with `●`.
- [ ] `relay enroll <name> --repo-dir …` discovers the peer, probes
      candidates, writes the fleet entry, and preserves existing entries.
- [ ] Enrolling a name that is not a peer fails with the exact error.

## 4. Two-machine transfer (REAL-TRANSFER, SYNC/GIT-01)

- [ ] **Direct push**: `relay send --target <t> --session <id>` with both
      machines online → target OC2 shows the replayed session; worktree
      exists on the target; `.relay/handoff.json` anchored.
- [ ] **Offline target**: target blocked/off → send writes a JSON bundle
      **and a `.bundle` sidecar** carrying the branch's WIP commits; carry
      both, and `relay receive` recreates the worktree on the exact branch
      with the WIP content and anchored context.
- [ ] **Context file**: `--context-file ctx.json` summary/done/left/
      decisions survive into the anchor verbatim.
- [ ] **Export fallback**: no self server but `opencode` on PATH → bundle
      carries exportedJson; receive runs `opencode import` and reports the
      new session id.
- [ ] Wrong/absent `--target` fails with the known-targets list.

## 5. Trust & authorization (AUTHZ, REAL-PHONE)

- [ ] `relay authz new` prints request id, expiry, claim URL, and the
      token exactly once — with QR art when `qrencode` is installed, plain
      URL otherwise.
- [ ] The store file contains only the token **hash** (inspect it).
- [ ] `relay serve-approvals` starts, prints its URL, survives until
      SIGINT, and shuts down cleanly.
- [ ] Phone opens the claim URL over the real transport (tailscale serve
      or equivalent): wrong token → 403; right token → approved; second
      tap → already-approved.
- [ ] `relay authz approve --id … --token …` matches the HTTP path.
- [ ] Gated consume works exactly once (`requireApproved`).
- [ ] Restarting `serve-approvals` preserves pending state.
- [ ] A request past its TTL returns expired (410).

## 6. Resilience

- [ ] `serve-approvals` on a taken port fails loudly with EADDRINUSE.
- [ ] Killing the process mid-flow leaves no partial fleet.json.
- [ ] Corrupt fleet.json → `relay targets`/`send` fail with diagnostics,
      not a stack trace.
- [ ] Parallel `relay authz new` invocations all persist (locked store).
- [ ] No plaintext token appears in logs, `ps`, or the store file.

## Sign-off

| Scenario | Expected | Actual | Evidence (path/link) | Pass/Blocker |
|---|---|---|---|---|
| | | | | |
