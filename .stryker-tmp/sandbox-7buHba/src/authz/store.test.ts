// @ts-nocheck
import { describe, expect, it } from "vitest";
import { memoryAuthzStore, purgeFinished } from "./store.js";
import type { AuthzRequest } from "./core.js";

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
});
