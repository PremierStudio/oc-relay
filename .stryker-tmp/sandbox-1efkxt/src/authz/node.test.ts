// @ts-nocheck
import { mkdtemp, mkdir, readFile, rm, stat, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fileAuthzStore, nodeAuthzCrypto } from "./node.js";
import type { AuthzRequest } from "./core.js";

const record = (id: string): AuthzRequest => ({
  id,
  action: "send",
  createdAt: 1,
  expiresAt: 2,
  tokenHash: `hash-${id}`,
  status: "pending",
});

const exists = async (path: string): Promise<boolean> => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

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
    const path = join(dir, "nested", "deeper", "authz.json");
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

describe("fileAuthzStore update (lock + atomic write)", () => {
  const fastSleep = () => Promise.resolve();

  it("applies updates and leaves no lock or tmp residue", async () => {
    const path = join(dir, "upd.json");
    const store = fileAuthzStore(path, { sleep: fastSleep });
    await store.update?.(async (records) => [...records, record("u1")]);
    await store.update?.((records) => [...records, record("u2")]);
    expect((await store.read()).map((r) => r.id)).toEqual(["u1", "u2"]);
    expect(await exists(`${path}.lock`)).toBe(false);
    expect(await exists(`${path}.tmp`)).toBe(false);
  });

  it("keeps every record across concurrent updates", async () => {
    const path = join(dir, "concurrent.json");
    // Real timing: each mutation holds the lock briefly; the default
    // 40 × 25ms budget comfortably outlives the whole serialized batch.
    const store = fileAuthzStore(path);
    await Promise.all(
      Array.from({ length: 25 }, (_, i) =>
        store.update?.(async (records) => {
          await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 3)));
          return [...records, record(`c${i}`)];
        }),
      ),
    );
    expect((await store.read())).toHaveLength(25);
  });

  it("breaks a stale lock after the configured attempts at the given delay", async () => {
    const path = join(dir, "stale.json");
    await writeFile(`${path}.lock`, "", "utf8");
    const delays: number[] = [];
    const store = fileAuthzStore(path, {
      maxLockAttempts: 3,
      lockDelayMs: 7,
      sleep: async (ms) => {
        delays.push(ms);
      },
    });
    await store.update?.((records) => records);
    // attempts 1 and 2 sleep; attempt 3 breaks the stale lock.
    expect(delays).toEqual([7, 7]);
    expect((await store.read())).toEqual([]);
  });

  it("uses the documented defaults: 40 attempts at 25ms", async () => {
    const path = join(dir, "defaults.json");
    await writeFile(`${path}.lock`, "", "utf8");
    const delays: number[] = [];
    const store = fileAuthzStore(path, {
      sleep: async (ms) => {
        delays.push(ms);
      },
    });
    await store.update?.((records) => records);
    expect(delays).toHaveLength(39);
    expect(delays.every((ms) => ms === 25)).toBe(true);
  });

  it("exercises the real default sleeper between attempts", async () => {
    const path = join(dir, "real-sleep.json");
    await writeFile(`${path}.lock`, "", "utf8");
    const store = fileAuthzStore(path, { maxLockAttempts: 2 });
    await store.update?.((records) => records);
    expect(await exists(`${path}.lock`)).toBe(false);
  });

  it("throws contention when the lock cannot be broken", async () => {
    const path = join(dir, "unbreakable.json");
    const lockAsDir = `${path}.lock`;
    await mkdir(lockAsDir);
    await writeFile(join(lockAsDir, "inner"), "x", "utf8");
    const store = fileAuthzStore(path, { maxLockAttempts: 1, sleep: fastSleep });
    await expect(store.update?.((records) => records)).rejects.toThrow(/lock contention/);
    await rm(lockAsDir, { recursive: true, force: true });
  });

  it("swallows best-effort lock cleanup failures after a successful body", async () => {
    const path = join(dir, "cleanup-fail.json");
    const store = fileAuthzStore(path, { sleep: fastSleep });
    await store.update?.(async (records) => {
      // swap the held lock file for an unremovable non-empty directory
      await rm(`${path}.lock`, { force: true });
      await mkdir(`${path}.lock`);
      await writeFile(join(`${path}.lock`, "inner"), "x", "utf8");
      return records;
    });
    // the update resolved despite the finally-rm failing on the directory
    expect(await exists(`${path}.lock`)).toBe(true);
    await rm(`${path}.lock`, { recursive: true, force: true });
  });

  it("propagates non-EEXIST lock errors untouched", async () => {
    // A read-only parent makes open(wx) fail with EACCES — a genuinely
    // non-lock failure that must surface as-is, not as contention.
    const ro = join(dir, "readonly-dir");
    await mkdir(ro, { recursive: true });
    await writeFile(join(ro, "keeper"), "x", "utf8");
    await chmod(ro, 0o555);
    try {
      const store = fileAuthzStore(join(ro, "x.json"), { sleep: fastSleep });
      const err = await store
        .update?.((records) => records)
        .then(
          () => null,
          (e: unknown) => e,
        );
      expect((err as NodeJS.ErrnoException)?.code).toBe("EACCES");
    } finally {
      await chmod(ro, 0o755);
    }
  });

  it("writes atomically: plain write also leaves no tmp residue", async () => {
    const path = join(dir, "atomic-write.json");
    const store = fileAuthzStore(path);
    await store.write([record("w1")]);
    expect(await exists(`${path}.tmp`)).toBe(false);
    expect(await readFile(path, "utf8")).toContain('"tokenHash": "hash-w1"');
  });
});
