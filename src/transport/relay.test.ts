import { describe, expect, it } from "vitest";
import type { HandoffEnvelope } from "./handoff.js";
import { buildHandoffEnvelope } from "./handoff.js";
import { RelayError, receiveHandoff, sendHandoff, HANDOFF_ANCHOR_RELPATH } from "./relay.js";
import type { ProcessPort } from "./git.js";

const fixedNow = () => new Date("2026-08-26T12:00:00.000Z");

function envelope(overrides: Partial<HandoffEnvelope> = {}): HandoffEnvelope {
  return {
    version: "handoff.v1",
    createdAt: "2026-08-26T12:00:00.000Z",
    sourceHost: "laptop",
    repo: "SampleApp",
    branch: "opencode/ops-panel",
    worktreeName: "ops-panel",
    session: { id: "ses_src", title: "sample session" },
    context: { done: [], left: ["ship it"], decisions: [] },
    refs: [],
    ...overrides,
  };
}

const passingGit: ProcessPort = { run: async () => ({ code: 0, stdout: "", stderr: "" }) };
const failingGit: ProcessPort = {
  run: async () => ({ code: 128, stdout: "", stderr: "fatal: not a repo\n" }),
};
const nullSink = { write: async () => undefined };

describe("sendHandoff", () => {
  const base = { envelope: envelope(), payload: {} };

  it("prefers sync-replay when events and target replay exist", async () => {
    const replayed: Array<{ sessionId: string; events: unknown[] }> = [];
    const r = await sendHandoff({
      ...base,
      payload: { events: [{ seq: 1 }, { seq: 2 }] },
      targetReplay: {
        replay: async (sessionId, events) => {
          replayed.push({ sessionId, events });
          return "ses_tgt";
        },
      },
    });
    expect(r).toEqual({
      strategy: "sync-replay",
      targetSessionId: "ses_tgt",
      eventCount: 2,
    });
    expect(replayed[0]?.sessionId).toBe("ses_src");
  });

  it("falls back to import when events are empty", async () => {
    const r = await sendHandoff({
      ...base,
      payload: { events: [], exportedJson: '{"exported":true}' },
      targetReplay: { replay: async () => "should-not-happen" },
      importer: { importExported: async (json) => (json === '{"exported":true}' ? "ses_imp" : "x") },
    });
    expect(r.strategy).toBe("import");
    expect(r.targetSessionId).toBe("ses_imp");
  });

  it("uses empty-string source id when the envelope carries no session", async () => {
    const sessionless = envelope();
    delete (sessionless as { session?: unknown }).session;
    let gotSource = "unset";
    const r = await sendHandoff({
      envelope: sessionless,
      payload: { events: [{ seq: 1 }] },
      targetReplay: {
        replay: async (sessionId) => {
          gotSource = sessionId;
          return "ses_t";
        },
      },
    });
    expect(gotSource).toBe("");
    expect(r.strategy).toBe("sync-replay");
  });

  it("throws RelayError when neither path is viable", async () => {
    for (const opts of [
      base,
      { ...base, payload: { events: [] } },
      { ...base, payload: { exportedJson: "{}" } },
      { ...base, payload: { events: [1] }, importer: { importExported: async () => "x" } },
    ]) {
      await expect(sendHandoff(opts)).rejects.toBeInstanceOf(RelayError);
    }
  });

  it("falls back to import when events are absent entirely", async () => {
    const r = await sendHandoff({
      ...base,
      payload: { exportedJson: '{"e":1}' },
      targetReplay: {
        replay: async () => {
          throw new Error("replay must not be called with absent events");
        },
      },
      importer: { importExported: async () => "ses_imp" },
    });
    expect(r.strategy).toBe("import");
    expect(r.targetSessionId).toBe("ses_imp");
  });
});

describe("receiveHandoff", () => {
  const base = { envelope: envelope(), git: passingGit, repoDir: "/r", files: nullSink };

  it("creates the worktree and anchors the envelope", async () => {
    const written: Array<[string, string]> = [];
    const r = await receiveHandoff({
      ...base,
      worktreeRoot: "/wt",
      files: {
        write: async (path, contents) => {
          written.push([path, contents]);
        },
      },
    });
    expect(r.branch).toBe("opencode/ops-panel");
    expect(r.directory).toBe("/wt/ops-panel");
    expect(r.anchorPath).toBe(`/wt/ops-panel/${HANDOFF_ANCHOR_RELPATH}`);
    expect(written[0]?.[0]).toBe(r.anchorPath);
    expect(JSON.parse(written[0]?.[1] ?? "{}").worktreeName).toBe("ops-panel");
    expect(r.targetSessionId).toBeUndefined();
  });

  it("materializes via fast path: pull history from source, replay locally", async () => {
    const pulled: string[] = [];
    const replayed: string[] = [];
    const r = await receiveHandoff({
      ...base,
      sourceHistory: {
        fetchHistory: async (id) => {
          pulled.push(id);
          return [{ seq: 1 }];
        },
      },
      localReplay: {
        replay: async (_sessionId, events) => {
          replayed.push(String(events.length));
          return "ses_local";
        },
      },
    });
    expect(pulled).toEqual(["ses_src"]);
    expect(r.strategy).toBe("sync-replay");
    expect(r.targetSessionId).toBe("ses_local");
  });

  it("skips empty history and falls through to carried export JSON", async () => {
    const r = await receiveHandoff({
      ...base,
      sourceHistory: { fetchHistory: async () => [] },
      localReplay: { replay: async () => "nope" },
      importedJson: '{"e":1}',
      importer: { importExported: async () => "ses_imported" },
    });
    expect(r.strategy).toBe("import");
    expect(r.targetSessionId).toBe("ses_imported");
  });

  it("ignores empty-string carried JSON", async () => {
    const r = await receiveHandoff({
      ...base,
      importedJson: "",
      importer: { importExported: async () => "should-not-happen" },
    });
    expect(r.targetSessionId).toBeUndefined();
    expect(r.strategy).toBeUndefined();
  });

  it("ignores carried JSON when no importer is configured", async () => {
    const r = await receiveHandoff({
      ...base,
      importedJson: '{"e":1}',
      sourceHistory: { fetchHistory: async () => [] },
    });
    expect(r.targetSessionId).toBeUndefined();
    expect(r.strategy).toBeUndefined();
  });

  it("wraps git failures in RelayError with stderr detail", async () => {
    const err = await receiveHandoff({ ...base, git: failingGit }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(RelayError);
    expect((err as RelayError).message).toContain("not a repo");
  });

  it("trims surrounding whitespace from git stderr in the wrapped message", async () => {
    const padded: ProcessPort = {
      run: async () => ({ code: 128, stdout: "", stderr: "  fatal: padded failure  \n" }),
    };
    await expect(receiveHandoff({ ...base, git: padded })).rejects.toThrow(
      /^worktree creation failed: fatal: padded failure$/,
    );
  });

  it("propagates unexpected (non-GitError) failures unwrapped", async () => {
    const boom = new Error("disk gone");
    const err = await receiveHandoff({
      ...base,
      git: {
        run: async () => {
          throw boom;
        },
      },
    }).catch((e: unknown) => e);
    expect(err).toBe(boom);
  });

  it("does no session work when the envelope carries no session id", async () => {
    let pulled = false;
    const sessionless = envelope();
    delete (sessionless as { session?: unknown }).session;
    const r = await receiveHandoff({
      ...base,
      envelope: sessionless,
      sourceHistory: {
        fetchHistory: async () => {
          pulled = true;
          return [1];
        },
      },
      localReplay: {
        replay: async () => {
          pulled = true;
          return "nope";
        },
      },
    });
    expect(pulled).toBe(false);
    expect(r.targetSessionId).toBeUndefined();
  });

  it("does not replay when only one half of the fast path is wired", async () => {
    // sourceHistory without localReplay: history must not even be pulled.
    let pulled = false;
    const a = await receiveHandoff({
      ...base,
      sourceHistory: {
        fetchHistory: async () => {
          pulled = true;
          return [{ seq: 1 }];
        },
      },
    });
    expect(pulled).toBe(false);
    expect(a.targetSessionId).toBeUndefined();

    // localReplay without sourceHistory: nothing to pull, must not crash.
    const b = await receiveHandoff({
      ...base,
      localReplay: { replay: async () => "should-not-happen" },
    });
    expect(b.targetSessionId).toBeUndefined();
  });

  it("does not consult the importer when no exported JSON was carried", async () => {
    let imported = false;
    const r = await receiveHandoff({
      ...base,
      importer: {
        importExported: async () => {
          imported = true;
          return "x";
        },
      },
    });
    expect(imported).toBe(false);
    expect(r.targetSessionId).toBeUndefined();
  });

  it("starts the worktree branch from a provided start point", async () => {
    const calls: string[][] = [];
    const git: ProcessPort = {
      run: async (args) => {
        calls.push(args);
        return { code: 0, stdout: "", stderr: "" };
      },
    };
    await receiveHandoff({ ...base, git, startPoint: "FETCH_HEAD" });
    expect(calls[0]).toEqual([
      "worktree",
      "add",
      "-b",
      "opencode/ops-panel",
      "/r/.worktrees/ops-panel",
      "FETCH_HEAD",
    ]);
  });

  it("round-trips a built envelope through anchor contents", async () => {    const built = buildHandoffEnvelope({
      sourceHost: "laptop",
      repo: "WidgetCo",
      branch: "opencode/tagfix",
      worktreeName: "tagfix",
      context: { left: ["merge"] },
      now: fixedNow,
    });
    let anchored = "";
    await receiveHandoff({
      envelope: built,
      git: passingGit,
      repoDir: "/r",
      files: {
        write: async (_p, c) => {
          anchored = c;
        },
      },
    });
    expect(JSON.parse(anchored).context.left).toEqual(["merge"]);
  });
});
