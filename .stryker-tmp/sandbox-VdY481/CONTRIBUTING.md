# Contributing

## The rules

1. **TDD is mandatory.** No production code lands without a test written first that fails
   without it. PRs must show red→green in CI or description.
2. **100% or documented exemption.** Coverage thresholds are 100/100/100 (lines/branches/
   functions) and CI fails below that. Mutation score must stay at 100% on mutated globs
   (`src/index.ts`, `src/manifest/**`). String literals are excluded from mutation
   (error messages are not behavior); everything else must survive. If a mutant survives
   because behavior genuinely doesn't matter, fix the code or add a scoped
   `/* stryker-exempt: <reason> */` comment — those get audited.
3. **Conventional commits.** `feat:`, `fix:`, `docs:`, `test:`, `chore:` — semantic-release
   derives versions from them.
4. **Strict TS.** `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` are on.
   Optional fields are absent, never `undefined`.
5. **Zero runtime deps in core paths.** Parsing/planning/provisioning logic must not add
   dependencies. Provider integrations may, behind interfaces.
6. **Windows matters.** Don't merge POSIX-only assumptions without a guard; CI covers all
   three OSes and that's not aspirational.

## Dev loop

```sh
npm install
npm run check     # typecheck + tests + 100% coverage
npm run mutate    # must report 100% before pushing domain changes
```
