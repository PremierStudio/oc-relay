# Contributing

## The rules

1. **TDD is mandatory.** No production code lands without a test written first that fails
   without it. PRs must show red→green in CI or description.
2. **100% or documented exemption.** Coverage thresholds are 100/100/100 (lines/branches/
   functions) and CI fails below that. Mutation score must stay at 100% across all of
   `src/**/*.ts`. String literals are excluded from mutation
   (error messages are not behavior); everything else must survive. If a mutant survives
   because behavior genuinely doesn't matter, fix the code or add a scoped
   `// Stryker disable next-line <mutator>: <reason>` comment and record it in
   `TEST-MATRIX.md` § Stryker exemptions — those get audited.
3. **Conventional commits.** `feat:`, `fix:`, `docs:`, `test:`, `chore:` — semantic-release
   derives versions from them.
4. **Strict TS.** `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are on.
   Optional fields are absent, never `undefined`.
5. **Zero runtime deps in core paths.** Parsing/planning/provisioning logic must not add
   dependencies. Provider integrations may, behind interfaces.
6. **Windows matters.** Don't merge POSIX-only assumptions without a guard; CI covers all
   three OSes and that's not aspirational.
7. **Synthetic fixtures only.** Tests, fixtures, examples, docs, and smoke scripts must
   never contain real hostnames, tailnet names, Tailscale IPs, machine inventories,
   project codenames, or session titles. Use reserved/garbage domains
   (`.invalid`, `tailnet-example.ts.net`), documentation IP ranges (100.64.0.0/10,
   192.0.2.0/24), and invented names. Live network checks (`relay ping` against a real
   tailnet) are run by humans on purpose — never inside tests or CI.
8. **Slots are swappable.** Core may not name a vendor (Tailscale, Cloudflare,
   1Password, OpenViking…). Those are reference implementations behind interfaces in
   `src/discovery`, `src/provision`, `src/transport`. If an import path in core can
   answer "which vendor is this?", the architecture is broken.

## Dev loop

```sh
npm install
npm run check       # typecheck + tests + 100% coverage
npm run test:e2e    # real binary + real git, synthetic fixtures only
npm run mutate      # must report 100% before pushing domain changes
```
