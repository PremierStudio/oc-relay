import { describe, expect, it } from "vitest";
import { commit, memoryAuthzStore, purgeFinished } from "./store.js";
import type { AuthzRequest, AuthzStore } from "./index.js";

const record = (over: Partial<AuthzRequest>): AuthzRequest => ({
  id: "r1",
  action: "send",
  createdAt: 0,
  expiresAt: 60_000,
  tokenHash: "hash",
  status: "pending",
  ...over,
});

describe("memoryAuthzStore", () => {
  it("round-trips records and isolates writes from callers", async () => {
    const store = memoryAuthzStore();
    const original = [record({ id: "a" })];
    await store.write(original);
    original.pop();
    expect((await store.read()).map((r) => r.id)).toEqual(["a"]);
  });

  it("starts empty", async () => {
    expect(await memoryAuthzStore().read()).toEqual([]);
  });

  it("serializes concurrent updates without losing any", async () => {
    const store = memoryAuthzStore();
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        store.update?.(async (records) => {
          await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 4)));
          return [...records, record({ id: `r${i}` })];
        }),
      ),
    );
    expect((await store.read())).toHaveLength(20);
  });
});

describe("commit", () => {
  it("routes through store.update when provided and skips plain write", async () => {
    const inner = memoryAuthzStore();
    const calls: string[] = [];
    const store: AuthzStore = {
      read: inner.read,
      write: async (next) => {
        calls.push("write");
        await inner.write(next);
      },
      update: async (mutate) => {
        calls.push("update");
        await inner.update?.(mutate);
      },
    };
    const result = await commit(store, (records) => ({
      records: [...records, record({ id: "n1" })],
      result: records.length,
    }));
    expect(result).toBe(0);
    expect(calls).toEqual(["update"]);
    expect((await inner.read()).map((r) => r.id)).toEqual(["n1"]);
  });

  it("falls back to read + write when the store has no update", async () => {
    const inner = memoryAuthzStore([record({ id: "a" })]);
    const calls: string[] = [];
    const store: AuthzStore = {
      read: inner.read,
      write: async (next) => {
        calls.push("write");
        await inner.write(next);
      },
    };
    const result = await commit(store, (records) => ({
      records: [],
      result: records[0]?.id,
    }));
    expect(result).toBe("a");
    expect(calls).toEqual(["write"]);
    expect(await inner.read()).toEqual([]);
  });
});

describe("purgeFinished", () => {
  it("keeps pending/approved and recently consumed records", () => {
    const now = 1_000_000;
    const records = [
      record({ id: "pending" }),
      record({ id: "approved", status: "approved", approvedAt: 900_000 }),
      record({ id: "fresh-consumed", status: "consumed", approvedAt: now - 1000 }),
      record({ id: "old-consumed", status: "consumed", approvedAt: now - 7_200_000 }),
    ];
    const kept = purgeFinished(records, now).map((r) => r.id);
    expect(kept).toEqual(["pending", "approved", "fresh-consumed"]);
  });

  it("falls back to expiresAt when a consumed record lacks approvedAt", () => {
    const now = 1_000_000;
    const kept = purgeFinished(
      [
        record({ id: "recent", status: "consumed", expiresAt: now - 10 }),
        record({ id: "ancient", status: "consumed", expiresAt: now - 7_200_010 }),
      ],
      now,
    );
    expect(kept.map((r) => r.id)).toEqual(["recent"]);
  });

  it("drops consumed records at exactly the retention boundary", () => {
    const now = 1_000_000;
    const kept = purgeFinished(
      [record({ id: "edge", status: "consumed", approvedAt: now - 3_600_000 })],
      now,
    );
    expect(kept).toEqual([]);
  });

  it("retains expired pending records instead of purging them", () => {
    const now = 1_000_000;
    const kept = purgeFinished(
      [record({ id: "stale-pending", expiresAt: now - 9_999_999 })],
      now,
    );
    expect(kept.map((r) => r.id)).toEqual(["stale-pending"]);
  });
});
