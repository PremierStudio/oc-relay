// @ts-nocheck
import { describe, expect, it } from "vitest";
import {
  HANDOFF_VERSION,
  buildHandoffEnvelope,
  parseHandoffEnvelope,
} from "./handoff.js";

const fixedNow = () => new Date("2026-08-26T12:00:00.000Z");

const validEnvelope = {
  version: HANDOFF_VERSION,
  createdAt: "2026-08-26T12:00:00.000Z",
  sourceHost: "laptop",
  repo: "github.com/itz4blitz/oc-relay",
  branch: "opencode/sample-session",
  worktreeName: "sample-session",
  session: { id: "ses_123", title: "sample session" },
  context: {
    summary: "Ops panel redesign, backend wired",
    done: ["schema migration"],
    left: ["dashboard polish", "e2e test"],
    decisions: ["Postgres over SQLite for ops events"],
  },
  refs: [{ label: "design", uri: "https://example.test/spec", detail: "v2 spec" }],
};

describe("parseHandoffEnvelope", () => {
  it("accepts a full envelope", () => {
    const r = parseHandoffEnvelope(validEnvelope);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.context.left).toEqual(["dashboard polish", "e2e test"]);
      expect(r.value.refs[0]?.label).toBe("design");
    }
  });

  it("accepts a minimal envelope without optionals", () => {
    const r = parseHandoffEnvelope({
      version: HANDOFF_VERSION,
      createdAt: "2026-08-26T12:00:00.000Z",
      sourceHost: "laptop",
      repo: "repo",
      branch: "b",
      worktreeName: "w",
      context: {},
    });
    expect(r.ok).toBe(true);
  });

  it.each([
    [{}, "version"],
    [
      { ...validEnvelope, version: "handoff.v0" },
      "version",
    ],
    [
      { ...validEnvelope, createdAt: "not-a-date" },
      "createdAt",
    ],
    [{ ...validEnvelope, createdAt: undefined }, "createdAt"],
    [{ ...validEnvelope, sourceHost: "" }, "sourceHost"],
    [{ ...validEnvelope, repo: 7 }, "repo"],
    [{ ...validEnvelope, branch: null }, "branch"],
    [{ ...validEnvelope, worktreeName: "" }, "worktreeName"],
    [{ ...validEnvelope, session: "x" }, "session"],
    [{ ...validEnvelope, session: { id: 5 } }, "session.id"],
    [null, ""],
    ["string", ""],
  ])("rejects %j reporting path %s", (input, path) => {
    const r = parseHandoffEnvelope(input);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.map((e) => e.path)).toContain(path as string);
    }
  });

  it("rejects bad context shapes and ref entries with precise paths", () => {
    const r = parseHandoffEnvelope({
      ...validEnvelope,
      context: { done: "all", left: [1] },
      refs: "not-an-array",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const paths = r.errors.map((e) => e.path);
      expect(paths).toContain("context.done");
      expect(paths).toContain("context.left");
      expect(paths).toContain("refs");
    }
  });

  it("rejects malformed individual ref entries with indexed paths", () => {
    const r = parseHandoffEnvelope({
      ...validEnvelope,
      refs: [{ label: "" }, { label: "ok", uri: 3 }, "junk"],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const paths = r.errors.map((e) => e.path);
      expect(paths).toContain("refs.0.label");
      expect(paths).toContain("refs.1.uri");
      expect(paths).toContain("refs.2");
    }
  });
});

describe("buildHandoffEnvelope", () => {
  it("normalizes absent collections to empty arrays and injects time", () => {
    const env = buildHandoffEnvelope({
      sourceHost: "laptop",
      repo: "repo",
      branch: "b",
      worktreeName: "w",
      context: {},
      now: fixedNow,
    });
    expect(env.createdAt).toBe("2026-08-26T12:00:00.000Z");
    expect(env.context.done).toEqual([]);
    expect(env.context.left).toEqual([]);
    expect(env.context.decisions).toEqual([]);
    expect(env.refs).toEqual([]);
  });

  it("round-trips through the parser", () => {
    const env = buildHandoffEnvelope({
      sourceHost: "build-server",
      repo: "SampleApp",
      branch: "opencode/ops-panel",
      worktreeName: "ops-panel",
      session: { id: "ses_9" },
      context: { summary: "s", done: ["d"], left: ["l"], decisions: ["dec"] },
      refs: [{ label: "archive", uri: "viking://user/justin/sessions" }],
      now: fixedNow,
    });
    const parsed = parseHandoffEnvelope(env);
    expect(parsed.ok).toBe(true);
  });

  it("throws when inputs could never form a valid envelope", () => {
    expect(() =>
      buildHandoffEnvelope({
        sourceHost: "laptop",
        repo: "repo",
        branch: "b",
        worktreeName: "w",
        context: {},
        refs: [{ label: "" }],
        now: fixedNow,
      }),
    ).toThrow(/invalid envelope/);
  });
});
