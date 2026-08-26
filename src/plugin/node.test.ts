import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRelayRunner, DEFAULT_RELAY_BIN, DEFAULT_RELAY_TIMEOUT_MS } from "./node.js";

describe("createRelayRunner", () => {
  it("defaults the binary name and timeout", () => {
    expect(DEFAULT_RELAY_BIN).toBe("relay");
    expect(DEFAULT_RELAY_TIMEOUT_MS).toBe(120_000);
    expect(typeof createRelayRunner()).toBe("function");
  });

  it("captures stdout, stderr, and a numeric exit code from the binary", async () => {
    const dir = await mkdtemp(join(tmpdir(), "oc-relay-plugin-"));
    try {
      const script = join(dir, "relay-stub.mjs");
      await writeFile(
        script,
        `process.stdout.write("out:" + process.argv.slice(2).join(",") + " cwd:" + process.cwd());
process.stderr.write("err");
process.exit(4);
`,
      );
      const proc = await createRelayRunner({ bin: process.execPath, timeoutMs: 5_000 })(
        [script, "a", "b"],
        dir,
      );
      expect(proc.code).toBe(4);
      expect(proc.stdout).toBe(`out:a,b cwd:${dir}`);
      expect(proc.stderr).toBe("err");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("treats a missing binary as exit 1", async () => {
    const proc = await createRelayRunner({
      bin: join(tmpdir(), "oc-relay-definitely-missing-bin"),
    })(["targets"], process.cwd());
    expect(proc.code).toBe(1);
    expect(proc.stdout).toBe("");
  });

  it("exits 0 when the binary succeeds", async () => {
    const dir = await mkdtemp(join(tmpdir(), "oc-relay-plugin-ok-"));
    try {
      const script = join(dir, "ok.mjs");
      await writeFile(script, "process.stdout.write('ok');");
      const proc = await createRelayRunner({ bin: process.execPath })([script], dir);
      expect(proc).toEqual({ code: 0, stdout: "ok", stderr: "" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("kills a hung binary when timeoutMs elapses", async () => {
    const dir = await mkdtemp(join(tmpdir(), "oc-relay-plugin-to-"));
    try {
      const script = join(dir, "hang.mjs");
      await writeFile(script, "setInterval(() => {}, 1000);");
      const proc = await createRelayRunner({ bin: process.execPath, timeoutMs: 80 })([script], dir);
      expect(proc.code).toBe(1);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
