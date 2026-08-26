// @ts-nocheck
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fileAuthzStore, nodeAuthzCrypto } from "./node.js";

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), "oc-relay-authz-"));
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("nodeAuthzCrypto", () => {
  it("produces distinct ids and tokens", () => {
    expect(nodeAuthzCrypto.randomId()).not.toBe(nodeAuthzCrypto.randomId());
    expect(nodeAuthzCrypto.randomToken().length).toBeGreaterThanOrEqual(40);
  });

  it("exposes a numeric clock", () => {
    expect(typeof nodeAuthzCrypto.now()).toBe("number");
  });

  it("hashes deterministically without storing plaintext reversibly", () => {
    const h1 = nodeAuthzCrypto.hash("secret-token");
    const h2 = nodeAuthzCrypto.hash("secret-token");
    expect(h1).toBe(h2);
    expect(h1).not.toContain("secret-token");
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("fileAuthzStore", () => {
  it("reads an absent store as empty", async () => {
    const store = fileAuthzStore(join(dir, "absent-authz.json"));
    await expect(store.read()).resolves.toEqual([]);
  });

  it("writes pretty JSON and reads it back", async () => {
    const path = join(dir, "authz.json");
    const store = fileAuthzStore(path);
    const records = [
      {
        id: "abc123",
        action: "send",
        createdAt: 1,
        expiresAt: 2,
        tokenHash: "deadbeef",
        status: "approved" as const,
        approvedAt: 2,
      },
    ];
    await store.write(records);
    expect(await readFile(path, "utf8")).toContain('"tokenHash": "deadbeef"');
    await expect(store.read()).resolves.toEqual(records);
  });

  it("treats non-array documents as empty", async () => {
    const path = join(dir, "object-store.json");
    await writeFile(path, '{"targets":{}}', "utf8");
    await expect(fileAuthzStore(path).read()).resolves.toEqual([]);
  });

  it("rethrows non-ENOENT read errors (invalid JSON)", async () => {
    const path = join(dir, "broken.json");
    await writeFile(path, "{nope", "utf8");
    await expect(fileAuthzStore(path).read()).rejects.toBeInstanceOf(Error);
  });
});
