// @ts-nocheck
import { exec } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execHookRunner, fileConfigStore, fileManifestSource, listDir } from "./node.js";

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "oc-relay-test-"));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("fileManifestSource", () => {
  it("loads and parses the manifest at the given path", async () => {
    const path = join(dir, "manifest.json");
    await writeFile(path, JSON.stringify({ name: "proj" }), "utf8");
    await expect(fileManifestSource(path).load()).resolves.toEqual({ name: "proj" });
  });

  it("throws on missing file and invalid JSON", async () => {
    await expect(fileManifestSource(join(dir, "nope.json")).load()).rejects.toMatchObject({
      code: "ENOENT",
    });
    const bad = join(dir, "bad.json");
    await writeFile(bad, "{not json", "utf8");
    await expect(fileManifestSource(bad).load()).rejects.toBeInstanceOf(Error);
  });
});

describe("fileConfigStore", () => {
  it("reads an absent config as an empty document", async () => {
    await expect(fileConfigStore(join(dir, "absent.json")).read()).resolves.toEqual({});
  });

  it("writes pretty JSON atomically and reads it back", async () => {
    const path = join(dir, "deep", "a", "b", "opencode.json");
    const store = fileConfigStore(path);
    const doc = { mcpServers: { gh: { command: ["npx"] } }, nested: { a: 1 } };
    await store.write(doc);
    expect((await store.read())["mcpServers"]).toEqual(doc.mcpServers);
    const raw = await readFile(path, { encoding: "utf8" });
    expect(raw).toBe(`${JSON.stringify(doc, null, 2)}\n`);
    expect(await listDir(join(dir, "deep", "a", "b"))).toEqual(["opencode.json"]);
  });

  it("treats non-object configs (arrays, scalars, null) as empty", async () => {
    for (const content of ["[]", "42", '"s"', "null"]) {
      const path = join(dir, `scalar-${content}.json`);
      await writeFile(path, content, "utf8");
      await expect(fileConfigStore(path).read()).resolves.toEqual({});
    }
  });

  it("rethrows non-ENOENT read errors (e.g. invalid JSON)", async () => {
    const bad = join(dir, "corrupt-config.json");
    await writeFile(bad, "{oops", "utf8");
    await expect(fileConfigStore(bad).read()).rejects.toBeInstanceOf(Error);
  });
});

describe("execHookRunner", () => {
  it("resolves code 0, captures stdout, and respects cwd", async () => {
    const r = await execHookRunner(dir).run("pwd");
    expect(r.code).toBe(0);
    expect(r.command).toBe("pwd");
    expect(r.stdout.trim()).toBe(dir);
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
    expect(r.durationMs).toBeLessThan(10_000);
  });

  it("reports non-zero codes without throwing", async () => {
    const r = await execHookRunner().run("exit 3");
    expect(r.code).toBe(3);
  });

  it("maps spawn failures to non-zero (shell 127, or fallback 1)", async () => {
    const r = await execHookRunner().run("definitely-not-a-real-command-xyz");
    expect([1, 127]).toContain(r.code);
  });

  it("runs through a shell so arguments and pipes work", async () => {
    let out = "";
    await new Promise<void>((resolve) => {
      exec('echo one two | tr " " "-"', { cwd: dir }, (_err, stdout) => {
        out = stdout;
        resolve();
      });
    });
    expect(out.trim()).toBe("one-two");
  });

  it("falls back to code 1 when the process dies without an exit code (signal)", async () => {
    const r = await execHookRunner().run("kill -TERM $$");
    expect(r.code).not.toBe(0);
  });

  it("normalizes shell command-not-found (exit 127) to a numeric code", async () => {
    const r = await execHookRunner().run("definitely-not-a-real-command-xyz");
    expect(r.code).toBe(127);
  });

  it("listDir returns empty for a missing directory", async () => {
    await expect(listDir(join(dir, "does-not-exist"))).resolves.toEqual([]);
  });
});
