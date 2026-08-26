// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  approveRecord,
  consumeRecord,
  isExpired,
  newRequest,
  type AuthzCrypto,
} from "./core.js";

/** Deterministic crypto: tokens/ids are counters, hash is order-sensitive hex. */
function fixedCrypto(): AuthzCrypto & { tick(ms: number): void } {
  let now = 1_000_000;
  let n = 0;
  return {
    now: () => now,
    tick: (ms: number) => {
      now += ms;
    },
    randomId: () => `id${++n}`,
    randomToken: () => `tok${++n}`,
    hash: (input) =>
      Array.from(input)
        .map((ch) => ch.charCodeAt(0).toString(16))
        .join("-"),
  };
}

const input = { action: "send", label: "move to desktop", ttlSeconds: 60 };

describe("newRequest", () => {
  it("mints a pending request with hashed token and default ttl", () => {
    const deps = fixedCrypto();
    const { record, approveToken } = newRequest(deps, { action: "send" });
    expect(record.id).toBe("id2"); // token is minted first
    expect(record.status).toBe("pending");
    expect(record.expiresAt - record.createdAt).toBe(300_000);
    expect(approveToken).toBe("tok1");
    expect(record.tokenHash).toBe(deps.hash("tok1"));
  });

  it("never stores the plaintext token", () => {
    const deps = fixedCrypto();
    const { record, approveToken } = newRequest(deps, input);
    expect(JSON.stringify(record)).not.toContain(approveToken);
  });

  it("honors explicit ttl and rejects non-positive ttl by falling back to default", () => {
    const deps = fixedCrypto();
    expect(newRequest(deps, { action: "a", ttlSeconds: 10 }).record.expiresAt).toBe(1_010_000);
    expect(newRequest(deps, { action: "a", ttlSeconds: 0 }).record.expiresAt).toBe(1_300_000);
    expect(newRequest(deps, { action: "a", ttlSeconds: -5 }).record.expiresAt).toBe(1_300_000);
  });

  it("refuses non-numeric ttl values instead of coercing them", () => {
    const deps = fixedCrypto();
    const bad = newRequest(deps, { action: "a", ttlSeconds: "0x10" as unknown as number });
    expect(bad.record.expiresAt).toBe(1_300_000);
  });  it("keeps an optional label when present", () => {
    const deps = fixedCrypto();
    const { record } = newRequest(deps, input);
    expect(record.label).toBe("move to desktop");
    expect(newRequest(deps, { action: "a" }).record).not.toHaveProperty("label");
  });
});

describe("approveRecord", () => {
  it("approves with the correct token while pending and unexpired", () => {
    const deps = fixedCrypto();
    const created = newRequest(deps, input);
    const r = approveRecord([created.record], deps, {
      id: created.record.id,
      token: created.approveToken,
    });
    expect(r.outcome).toBe("approved");
    expect(r.records[0]?.status).toBe("approved");
    expect(r.records[0]?.approvedAt).toBe(1_000_000);
  });

  it("rejects a wrong token as invalid-token without changing status", () => {
    const created = newRequest(fixedCrypto(), input);
    const deps = fixedCrypto();
    const r = approveRecord([created.record], deps, { id: created.record.id, token: "wrong" });
    expect(r.outcome).toBe("invalid-token");
    expect(r.records[0]?.status).toBe("pending");
  });

  it("reports expired instead of approving stale requests", () => {
    const deps = fixedCrypto();
    const created = newRequest(deps, input);
    deps.tick(61_000);
    const r = approveRecord([created.record], deps, {
      id: created.record.id,
      token: created.approveToken,
    });
    expect(r.outcome).toBe("expired");
  });

  it("refuses to re-approve an already approved request", () => {
    const deps = fixedCrypto();
    const created = newRequest(deps, input);
    const first = approveRecord([created.record], deps, {
      id: created.record.id,
      token: created.approveToken,
    });
    const second = approveRecord(first.records, deps, {
      id: created.record.id,
      token: created.approveToken,
    });
    expect(second.outcome).toBe("already-approved");
  });

  it("reports not-found for unknown ids", () => {
    const deps = fixedCrypto();
    expect(approveRecord([], deps, { id: "x", token: "t" }).outcome).toBe("not-found");
  });

  it("isExpired distinguishes boundary correctly", () => {
    const deps = fixedCrypto();
    const { record } = newRequest(deps, input);
    expect(isExpired(record, 1_060_000)).toBe(false);
    expect(isExpired(record, 1_060_001)).toBe(true);
  });

  it("preserves the records array through every non-mutating outcome", () => {
    const deps = fixedCrypto();
    const a = newRequest(deps, { action: "a" });
    const b = newRequest(deps, { action: "b", ttlSeconds: 60 });
    const stale = { ...b.record, expiresAt: 0 };
    const approved = approveRecord([a.record], deps, { id: a.record.id, token: a.approveToken });

    // not-found keeps input intact
    const nf = approveRecord([a.record], deps, { id: "ghost", token: "t" });
    expect(nf.records.map((r) => r.id)).toEqual([a.record.id]);

    // expired keeps input intact
    const exp = approveRecord([stale], deps, { id: stale.id, token: "t" });
    expect(exp.records.map((r) => r.id)).toEqual([stale.id]);

    // already-approved keeps input intact
    const again = approveRecord(approved.records, deps, {
      id: a.record.id,
      token: a.approveToken,
    });
    expect(again.records).toHaveLength(1);
    expect(again.records[0]?.status).toBe("approved");

    // consumeRecord non-mutating paths keep input intact
    const cnf = consumeRecord([a.record], deps, "ghost");
    expect(cnf.records.map((r) => r.id)).toEqual([a.record.id]);
    const pending = consumeRecord([a.record], deps, a.record.id);
    expect(pending.records.map((r) => r.id)).toEqual([a.record.id]);
    const cexp = consumeRecord([{ ...stale, status: "approved", approvedAt: 1_000_000 }], deps, stale.id);
    expect(cexp.outcome).toBe("expired");
    expect(cexp.records).toHaveLength(1);
  });

  it("consumes exactly the named record among several", () => {
    const deps = fixedCrypto();
    const first = newRequest(deps, { action: "a" });
    const second = newRequest(deps, { action: "b" });
    const records = [
      approveRecord([first.record], deps, { id: first.record.id, token: first.approveToken })
        .records[0]!,
      approveRecord([second.record], deps, { id: second.record.id, token: second.approveToken })
        .records[0]!,
    ];
    const r = consumeRecord(records, deps, second.record.id);
    expect(r.outcome).toBe("consumed");
    expect(r.records[0]?.status).toBe("approved");
    expect(r.records[1]?.status).toBe("consumed");
    expect(r.records).toHaveLength(2);
  });
});

describe("consumeRecord", () => {
  function approved() {
    const deps = fixedCrypto();
    const created = newRequest(deps, input);
    const r = approveRecord([created.record], deps, {
      id: created.record.id,
      token: created.approveToken,
    });
    return { deps, records: r.records, id: created.record.id };
  }

  it("consumes an approved request exactly once", () => {
    const { deps, records, id } = approved();
    const first = consumeRecord(records, deps, id);
    expect(first.outcome).toBe("consumed");
    expect(first.records[0]?.status).toBe("consumed");
    const second = consumeRecord(first.records, deps, id);
    expect(second.outcome).toBe("not-approved");
  });

  it("refuses to consume pending or unknown requests", async () => {
    const deps = fixedCrypto();
    const created = newRequest(deps, input);
    expect(consumeRecord([created.record], deps, created.record.id).outcome).toBe("not-approved");
    expect(consumeRecord([], deps, "ghost").outcome).toBe("not-found");
    await Promise.resolve();
  });

  it("refuses to consume after expiry even when approved earlier", () => {
    const { deps, records, id } = approved();
    deps.tick(120_000);
    expect(consumeRecord(records, deps, id).outcome).toBe("expired");
  });
});
