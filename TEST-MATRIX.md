# TEST-MATRIX — oc-relay verification map

Every feature maps to a scenario ID. Automated scenarios live in
`test/e2e/` (`npm run test:e2e`); unit/mutation coverage lives in
`src/**/*.test.ts` (`npm run check`, `npm run mutate`). Manual scenarios
live in [`docs/MANUAL-CHECKLIST.md`](docs/MANUAL-CHECKLIST.md) and are run
by a human on real hardware — never in CI.

## Layers

| Layer | Scope | Automated by |
|---|---|---|
| Unit | pure domain logic, injected ports | `npm run check` (100% cov) |
| Mutation | every `src/**/*.ts` mutant killed or exempted-with-reason | `npm run mutate` (100%) |
| E2E | real binary + real git + fake OC2/tailscale/opencode, loopback only | `npm run test:e2e` |
| Manual | real tailnet, real phones, real OpenCode | `docs/MANUAL-CHECKLIST.md` |

## Scenario matrix

| ID | Layer | File / test | Asserts |
|---|---|---|---|
| MANIFEST-01 | unit | `src/manifest/parse.test.ts` | env.json parsing + diagnostics |
| PROVISION-01 | unit | `src/provision/engine.test.ts`, `converge.test.ts`, `mcp.test.ts` | doctor/apply convergence, MCP drift, secret tiering |
| PROVISION-02 | unit | `src/provision/node.test.ts`, `slug.test.ts` | node adapters, slug rules |
| HANDOFF-01 | unit | `src/transport/handoff.test.ts` | `handoff.v1` build/parse, all diagnostic paths |
| HANDOFF-02 | unit | `src/transport/relay.test.ts` | send/receive strategies, anchor write, error wrapping, start points |
| SYNC-01 | unit | `src/transport/sync.test.ts` | OC2 client: auth, endpoints, steal, error mapping |
| SYNC-01 | **e2e** | `test/e2e/sync-authz.test.mjs` | binary pushes through a live fake OC2 (auth header, body, session id); `--steal` detaches on the source, no steal without the flag |
| GIT-01 | unit | `src/transport/git.test.ts` | worktree planning/creation |
| GIT-01 | **e2e** | `test/e2e/env-git.test.mjs` | bundle fallback: send offline → carry → receive → real worktree + anchor + context |
| WIP-01 | unit | `src/cli/handlers.test.ts` | sidecar creation contract, payload key, push-path skip, fetch + FETCH_HEAD branch, fetch failures |
| WIP-01 | **e2e** | `test/e2e/wip-import-authz.test.mjs` | offline branch commits reach the receiver's worktree (content + branch + anchor); missing sidecar fails loudly |
| IMPORT-01 | **e2e** | `test/e2e/wip-import-authz.test.mjs` | fake `opencode export`/`import` round-trip reports the new session id |
| OFFLINE-01 | e2e | `test/e2e/sync-authz.test.mjs` | offline target → bundle; export failure → loud error; fake `opencode` → exportedJson carried |
| ENV-01 | **e2e** | `test/e2e/env-git.test.mjs` | doctor red → apply → doctor green → idempotent second apply |
| DISC-01 | unit | `src/discovery/tailscale.test.ts`, `probe.test.ts` | status parsing, candidate URLs, probe timeout/cleanup |
| DISC-01 | **e2e** | `test/e2e/disc-pkg.test.mjs` | scoped ping never discovers; `--all` with fake `tailscale` discovers; enroll preserves fleet |
| AUTHZ-01 | unit | `src/authz/core.test.ts` | lifecycle outcomes, boundaries, record preservation |
| AUTHZ-01 | **e2e** | `test/e2e/sync-authz.test.mjs` | binary: new → list → wrong-token 403 → approve 200 → store never holds plaintext |
| AUTHZ-02 | unit | `src/authz/server.test.ts` | approval server: statuses, pending filter, EADDRINUSE, method guard, boundary expiry |
| AUTHZ-02 | **e2e** | `test/e2e/sync-authz.test.mjs` | spawned server + phone-style HTTP approve flow, hash never exposed |
| AUTHZ-03 | unit | `src/authz/store.test.ts`, `node.test.ts` | purge window boundaries, commit routing, serialization, lock breaking/defaults/contention |
| AUTHZ-03 | **e2e** | `test/e2e/wip-import-authz.test.mjs` | ten parallel CLI mints all persist through the locked file store |
| QR-01 | e2e | `test/e2e/wip-import-authz.test.mjs` | qrencode renders claim art; clean degradation without it |
| OFFLOAD-01 | unit | `src/cli/handlers.test.ts` | `--steal` fires only after a successful push, only when requested; never on the bundle path; degrades honestly when unwired |
| PKG-01 | e2e | `test/e2e/disc-pkg.test.mjs` | `dist/index.js` exposes every documented runtime export |
| PKG-02 | e2e | `test/e2e/pkg-install.test.mjs` | `npm pack` → clean consumer install → API import → `oc-relay/server` + `oc-relay/tui` → `.bin/relay` usage exit 2 |
| GUI-01 | unit | `src/plugin/*.test.ts` | palette send flow: target parse, picker, steal confirm, toast, TUI keymap, server tools |
| CLI-03 | e2e | `test/e2e/cli-surface.test.mjs` | `relay init` writes `.opencode/plugins/` server + TUI plugins |
| PKG-03 | manual | checklist §1 | installed tarball on real hardware (spot-check) |
| FLEET-01 | unit | `src/cli/config.test.ts` | fleet parsing, env expansion, credential resolution |
| CLI-01 | unit | `src/cli/dispatch.test.ts` | argv parsing for every verb, exact shapes |
| CLI-02 | e2e | `test/e2e/cli-surface.test.mjs` + all e2e files | exit codes and stdout contracts: usage (2), unknown verb (2), missing flags (2), invalid manifest JSON (1, no stack), corrupt fleet JSON (2, no stack) |
| REAL-TAILNET | manual | checklist §5 | discovery/enrollment against the real tailnet |
| REAL-PHONE | manual | checklist §6 | QR scan, approve, consume on real hardware |
| REAL-TRANSFER | manual | checklist §4 | two real machines, session + branch + context |

## Stryker exemptions (audited)

| Location | Mutator | Reason |
|---|---|---|
| `src/cli/dispatch.ts` serve-approvals + ping port parse | ConditionalExpression | `parseInt(undefined)` is `NaN`; the undefined guard is defensive typing, behaviorally invisible |
| `src/cli/handlers.ts` enroll target username/worktreeRoot | ConditionalExpression | absent-vs-`undefined` is invisible after `JSON.stringify`; guard exists for `exactOptionalPropertyTypes` only |
| `src/cli/handlers.ts` declarative-environment agents arm | ConditionalExpression | the filesystem snapshot never produces agents today — arm kept for future agent sources |
| `src/envrelay/snapshot.ts` slug dash-trim regex | Regex | trimming variants are cosmetically equivalent for all reachable inputs (JSON keys are non-empty) |
| `src/envrelay/snapshot.ts` readJson catch body | BlockStatement | emptied catch falls through to the same implicit `undefined` |
| `src/envrelay/snapshot.ts` isPlainObject typeof arm | ConditionalExpression | with the arm removed, every JSON-reachable root yields `undefined` on property access and is skipped downstream — equivalent |
