// @ts-nocheck
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { gitPort, nodeFileSink, binaryProcessPort } from "./node.js";

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "oc-relay-tx-"));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("nodeFileSink", () => {
  it("creates parent directories and writes contents", async () => {
    const path = join(dir, "a", "b", "handoff.json");
    await nodeFileSink().write(path, '{"ok":true}');
    const raw = await readFile(path, "utf8");
    expect(JSON.parse(raw).ok).toBe(true);
  });
});

describe("gitPort", () => {
  it("executes git and reports success inside a repo", async () => {
    await new Promise<void>((resolve) =>
      execFile("git", ["init", "-q"], { cwd: dir }, () => resolve()),
    );
    const r = await gitPort(dir).run(["status"]);
    expect(r.code).toBe(0);
  });

  it("reports non-zero for failures outside repos", async () => {
    const outside = await mkdtemp(join(tmpdir(), "oc-relay-nogit-"));
    try {
      const r = await gitPort(outside).run(["status"]);
      expect(r.code).not.toBe(0);
      expect(r.stderr.length).toBeGreaterThan(0);
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it("normalizes spawn failure of the binary (string ENOENT) to code 1", async () => {
    const port = binaryProcessPort("definitely-not-git-xyz");
    const r = await port.run(["status"]);
    expect(r.code).toBe(1);
  });
});
