// @ts-nocheck
import { describe, expect, it } from "vitest";
import { approveRecord, consumeRecord, newRequest, type AuthzCrypto } from "./core.js";
import { memoryAuthzStore } from "./store.js";
import { boundUrl, startApprovalServer } from "./server.js";

describe("boundUrl", () => {
  it("uses the bound port from an AddressInfo-shaped object", () => {
    expect(boundUrl("127.0.0.1", { port: 53210 }, 0)).toBe("http://127.0.0.1:53210");
  });

  it("falls back for null/string addresses", () => {
    expect(boundUrl("h", null, 80)).toBe("http://h:80");
    expect(boundUrl("h", "/pipe.sock", 80)).toBe("http://h:80");
  });
});

function fixedCrypto(): AuthzCrypto {
  let now = 1_000_000;
  let n = 0;
  return {
    now: () => now,
    randomId: () => `id${++n}`,
    randomToken: () => `tok${++n}`,
    hash: (s) => Array.from(s).map((c) => c.charCodeAt(0).toString(16)).join("-"),
  };
}

describe("approval server", () => {
  it("approves a pending request through GET /approve", async () => {
    const crypto = fixedCrypto();
    const store = memoryAuthzStore();
    const created = newRequest(crypto, { action: "send" });
    await store.write([created.record]);
    const { server, url } = await startApprovalServer({ store, crypto });

    const res = await fetch(`${url}/approve?id=${created.record.id}&token=${created.approveToken}`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("approved ✓");
    expect((await store.read())[0]?.status).toBe("approved");
    server.close();
  });

  it("answers 403 on token mismatch and 404 on unknown ids", async () => {
    const crypto = fixedCrypto();
    const created = newRequest(crypto, { action: "send" });
    const store = memoryAuthzStore([created.record]);
    const { server, url } = await startApprovalServer({ store, crypto });

    const bad = await fetch(`${url}/approve?id=${created.record.id}&token=nope`);
    expect(bad.status).toBe(403);
    const ghost = await fetch(`${url}/approve?id=ghost&token=tok`);
    expect(ghost.status).toBe(404);
    server.close();
  });

  it("answers 410 for expired requests and 200-already for double taps", async () => {
    // expired
    const expiredCrypto: AuthzCrypto = { ...fixedCrypto(), now: () => 9_000_000 };
    const stale = newRequest(fixedCrypto(), { action: "send", ttlSeconds: 60 });
    const storeA = memoryAuthzStore([stale.record]);
    const s1 = await startApprovalServer({ store: storeA, crypto: expiredCrypto });
    const expiredRes = await fetch(`${s1.url}/approve?id=${stale.record.id}&token=${stale.approveToken}`);
    expect(expiredRes.status).toBe(410);
    s1.server.close();

    // double approve → second returns 200 with "already approved"
    const crypto = fixedCrypto();
    const created = newRequest(crypto, { action: "send" });
    const storeB = memoryAuthzStore([created.record]);
    const s2 = await startApprovalServer({ store: storeB, crypto });
    const first = await fetch(`${s2.url}/approve?id=${created.record.id}&token=${created.approveToken}`);
    expect(first.status).toBe(200);
    const second = await fetch(`${s2.url}/approve?id=${created.record.id}&token=${created.approveToken}`);
    expect(second.status).toBe(200);
    expect(await second.text()).toBe("already approved");
    s2.server.close();
  });

  it("lists pending requests without leaking the token hash", async () => {
    const crypto = fixedCrypto();
    const created = newRequest(crypto, { action: "enroll", label: "add box" });
    const store = memoryAuthzStore([created.record]);
    const { server, url } = await startApprovalServer({ store, crypto });

    const res = await fetch(`${url}/pending`);
    expect(res.status).toBe(200);
    const body = JSON.parse(await res.text()) as Array<Record<string, unknown>>;
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe(created.record.id);
    expect(JSON.stringify(body)).not.toContain(created.record.tokenHash);
    server.close();
  });

  it("rejects missing params and unknown paths", async () => {
    const { server, url } = await startApprovalServer({ store: memoryAuthzStore(), crypto: fixedCrypto() });
    const noParams = await fetch(`${url}/approve`);
    expect(noParams.status).toBe(400);
    const notFound = await fetch(`${url}/whatever`);
    expect(notFound.status).toBe(404);
    server.close();
  });

  it("end-to-end: approve then consume via the same store", async () => {
    const crypto = fixedCrypto();
    const store = memoryAuthzStore();
    const created = newRequest(crypto, { action: "send" });
    await store.write([created.record]);
    const { server, url } = await startApprovalServer({ store, crypto });

    await fetch(`${url}/approve?id=${created.record.id}&token=${created.approveToken}`);
    const consume = consumeRecord(await store.read(), crypto, created.record.id);
    expect(consume.outcome).toBe("consumed");
    await store.write(consume.records);

    // second tap: already consumed → approving again is a no-op outcome
    const again = approveRecord(await store.read(), crypto, {
      id: created.record.id,
      token: created.approveToken,
    });
    expect(again.outcome).toBe("already-approved");
    server.close();
  });
});
