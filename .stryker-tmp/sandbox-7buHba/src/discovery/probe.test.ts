// @ts-nocheck
import { describe, expect, it } from "vitest";
import { probe } from "./probe.js";

describe("probe", () => {
  it("reports reachable with status and latency on any HTTP response", async () => {
    const fetchLike = async () => ({ ok: false, status: 404 });
    const r = await probe(fetchLike, "http://x", 500);
    expect(r.reachable).toBe(true);
    expect(r.status).toBe(404);
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("reports unreachable on connection failure", async () => {
    const fetchLike = async () => {
      throw new Error("ECONNREFUSED");
    };
    const r = await probe(fetchLike, "http://x", 500);
    expect(r.reachable).toBe(false);
    expect(r.status).toBeUndefined();
  });

  it("reports unreachable when the request aborts on timeout", async () => {
    const fetchLike = (_url: string, init?: { signal?: AbortSignal }) =>
      new Promise<{ ok: boolean; status: number }>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    const r = await probe(fetchLike, "http://slow", 50);
    expect(r.reachable).toBe(false);
    expect(r.latencyMs).toBeLessThan(2000);
  });
});
