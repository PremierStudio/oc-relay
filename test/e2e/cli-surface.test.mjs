/**
 * CLI-02 · exit codes and stdout/stderr contracts of the real binary for
 * the non-happy paths: usage, unknown verbs, and a missing manifest.
 */
import { describe, it } from "node:test";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { assert, runRelay, sandbox } from "./helpers.mjs";

describe("E2E CLI-02: binary surface contracts", () => {
  it("prints usage and exits 2 with no arguments", async () => {
    const r = await runRelay([]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /relay: no command given/);
    assert.match(r.stderr, /usage:/);
    assert.match(r.stderr, /relay send --target NAME/);
  });

  it("rejects unknown commands with exit 2", async () => {
    const r = await runRelay(["frobnicate"]);
    assert.equal(r.code, 2);
    assert.match(r.stderr, /unknown command: frobnicate/);
  });

  it("requires flags the usage text promises", async () => {
    const send = await runRelay(["send"]);
    assert.equal(send.code, 2);
    assert.match(send.stderr, /send requires --target/);
    const receive = await runRelay(["receive", "--bundle", "x.json"]);
    assert.equal(receive.code, 2);
    assert.match(receive.stderr, /receive requires --bundle and --into/);
  });

  it("doctor exits 1 with diagnostics for an invalid manifest", async () => {
    const t = sandbox();
    try {
      await mkdir(join(t.repo, ".opencode"), { recursive: true });
      await writeFile(join(t.repo, ".opencode", "env.json"), "{nope", "utf8");
      const r = await runRelay(["doctor", "--repo", t.repo], { env: t.env });
      assert.equal(r.code, 1);
      assert.match(r.stderr, /relay: .*not valid JSON/);
      assert.doesNotMatch(r.stderr, /at JSON\.parse/);
    } finally {
      t.cleanup();
    }
  });

  it("targets exits 2 with diagnostics for a corrupt fleet file", async () => {
    const t = sandbox();
    try {
      await mkdir(t.configDir, { recursive: true });
      await writeFile(t.fleetPath, "{broken", "utf8");
      const r = await runRelay(["targets"], { env: t.env });
      assert.equal(r.code, 2);
      assert.match(r.stderr, /not valid JSON/);
      assert.doesNotMatch(r.stderr, /SyntaxError/);
    } finally {
      t.cleanup();
    }
  });
});
