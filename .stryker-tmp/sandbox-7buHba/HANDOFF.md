# HANDOFF — mutation grind in progress

## State (exact)

- Tests: 397 passing · 100% line/branch/function coverage
- Stryker config FIXED this session: `mutator.excludedMutations` (old key was
  silently ignored) + `mutate: src/**/*.ts` (was only manifest+provision)
- Full-src truth: **1801 mutants, ~160 killed this session, ~171→~155 remain**
  (cli/handlers.ts was 71 → now 61; rest: dispatch ~28, authz/server ~13,
  cli/config ~10, transport/relay ~9, sync/tailscale/core ~9 each, small tails)

## Method that works (repeat per file)

1. Scoped fast run: `npx stryker run --mutate src/<file>.ts`
2. Dump diffs: `... | grep -A6 "\[Survived\]"`
3. Classify each:
   - **Loose assertion** (`toContain`, missing-field asserts) → strengthen to
     exact message equality / `toStrictEqual`
   - **Untested edge** (flag absent, wrong-typed input, boundary) → add test
   - **Equivalent/dead** (unreachable fallback, env-dependent) → delete code
4. Re-run scoped; move to next file when 0.

## Order (biggest first)

1. src/cli/handlers.ts (61) — mostly exact-message asserts in runSend/runReceive/authz
2. src/cli/dispatch.ts (~28) — usage/message literals need exact-match tests
3. src/authz/server.ts (~13) — HTTP status/response-body assertions per route
4. src/cli/config.ts (~10), transport/{relay,sync,handoff}.ts (~25 combined),
   discovery/tailscale.ts (~9), authz/core.ts (~9), tails of git/node/store/probe/claim

## Rules

- Synthetic fixtures ONLY (CONTRIBUTING rule 7)
- No live tailnet/network probes in tests or smokes — human-run only
- Delete equivalent-mutant code instead of chasing it
- After each file: full `npm run check` green before moving on

## Done after grind

- TEST-MATRIX.md (feature × scenario IDs)
- test/e2e/*.mjs harness running dist binary against temp fixtures
- docs/MANUAL-CHECKLIST.md for human-run items (real tailnet, phone QR)
