// @ts-nocheck
import { describe, expect, it } from "vitest";
import type { FleetConfig } from "./config.js";
import {
  loadFleet,
  parseBundle,
  renderBundle,
  runReceive,
  runSend,
  selectTarget,
  worktreeNameFromBranch,
} from "./handlers.js";
import { RelayError } from "../transport/relay.js";

describe("loadFleet / selectTarget", () => {
  const fleetRaw = {
    targets: {
      m3ultra: { baseUrl: "http://m3:49374", passwordEnv: "P", repoDir: "/r" },
    },
  };

  it("loads valid config", () => {
    const r = loadFleet(fleetRaw, { P: "x" });
    expect(r.errors).toEqual([]);
    expect(Object.keys(r.config.targets)).toEqual(["m3ultra"]);
  });

  it("surfaces config errors instead of throwing", () => {
    const r = loadFleet({ targets: { x: {} } }, {});
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("selects known targets and explains unknown ones", () => {
    const { config } = loadFleet(fleetRaw, { P: "x" });
    expect(selectTarget(config, "m3ultra").ok).toBe(true);
    const miss = selectTarget(config, "nope");
    expect(miss.ok).toBe(false);
    if (!miss.ok) expect(miss.message).toContain("known targets: m3ultra");
    const none = selectTarget({ targets: {} }, undefined);
    expect(none.ok).toBe(false);
    if (!none.ok) expect(none.message).toContain("(none)");
  });

  it("explains unknown targets against an empty fleet", () => {
    const miss = selectTarget({ targets: {} }, "nope");
    expect(miss.ok).toBe(false);
    if (!miss.ok) expect(miss.message).toContain("(none)");
  });
});

describe("worktreeNameFromBranch", () => {
  it("strips the opencode/ prefix and slugs", () => {
    expect(worktreeNameFromBranch("opencode/Ops Panel!")).toBe("ops-panel");
    expect(worktreeNameFromBranch("justin/plain-branch")).toBe("justin-plain-branch");
  });
});

describe("bundle render/parse", () => {
  it("round-trips envelope and payload", () => {
    const bundle = { envelope: { a: 1 }, events: [1, 2], exportedJson: "{}" };
    const parsed = parseBundle(JSON.parse(renderBundle(bundle)));
    expect(parsed.envelope).toEqual({ a: 1 });
    expect(parsed.payload.events).toEqual([1, 2]);
    expect(parsed.payload.exportedJson).toBe("{}");
  });

  it("tolerates empty bundles", () => {
    expect(parseBundle(undefined)).toEqual({ envelope: undefined, payload: {} });
  });
});

describe("runSend", () => {
  const fleet: FleetConfig = {
    targets: {
      m3ultra: { baseUrl: "http://m3:49374", username: "u", password: "p", repoDir: "/home/u/CareerStream" },
    },
  };
  const deps = (over: Partial<Parameters<typeof runSend>[0]> = {}) => ({
    fleet,
    hostname: "laptop",
    repoDir: "/work/cs",
    now: () => new Date("2026-08-26T12:00:00.000Z"),
    currentBranch: async () => "opencode/ops-panel",
    originUrl: async () => "https://github.com/x/CareerStream.git",
    ...over,
  });

  it("pushes via replay when the fast path is wired", async () => {
    let received: unknown = undefined;
    const r = await runSend(
      deps({
        sourceHistory: async () => [{ seq: 1 }],
        targetReplay: async (_s, events) => {
          received = events;
          return "ses_tgt";
        },
      }),
      { targetName: "m3ultra", sessionId: "ses_src" },
    );
    expect(r.mode).toBe("pushed");
    expect(r.report?.strategy).toBe("sync-replay");
    expect(r.report?.targetSessionId).toBe("ses_tgt");
    expect(received).toEqual([{ seq: 1 }]);
    expect(r.envelope.repo).toBe("CareerStream");
    expect(r.envelope.session?.id).toBe("ses_src");
  });

  it("bundles when no replay path exists and --bundle-out is given", async () => {
    const written: Record<string, string> = {};
    const r = await runSend(
      deps({
        localExport: async () => '{"export":true}',
        writeBundle: async (p, c) => {
          written[p] = c;
        },
      }),
      { targetName: "m3ultra", sessionId: "ses_src", bundleOut: "/tmp/b.json" },
    );
    expect(r.mode).toBe("bundled");
    expect(r.bundlePath).toBe("/tmp/b.json");
    const carried = JSON.parse(written["/tmp/b.json"] ?? "{}");
    expect(carried.exportedJson).toBe('{"export":true}');
    expect(carried.envelope.session.id).toBe("ses_src");
  });

  it("derives repo from the directory when no origin URL exists", async () => {
    const d = deps();
    delete (d as { originUrl?: unknown }).originUrl;
    const r = await runSend(
      { ...d, writeBundle: async () => undefined },
      { targetName: "m3ultra", bundleOut: "/tmp/b.json" },
    );
    expect(r.envelope.repo).toBe("CareerStream");
  });

  it("falls back to directory-derived repo when origin is empty", async () => {
    const r = await runSend(
      deps({
        originUrl: async () => "",
        writeBundle: async () => undefined,
      }),
      { targetName: "m3ultra", bundleOut: "/tmp/b.json" },
    );
    expect(r.envelope.repo).toBe("CareerStream");
  });

  it("uses a placeholder repo name for root-level target dirs", async () => {
    const rootFleet: FleetConfig = {
      targets: { m3ultra: { baseUrl: "http://m3", password: "p", repoDir: "/" } },
    };
    const r = await runSend(
      deps({ fleet: rootFleet, writeBundle: async () => undefined }),
      { targetName: "m3ultra", bundleOut: "/tmp/b.json" },
    );
    expect(r.envelope.repo).toBe("repo");
  });

  it("refuses to bundle silently without --bundle-out", async () => {
    await expect(runSend(deps(), { targetName: "m3ultra", sessionId: "s" })).rejects.toBeInstanceOf(
      RelayError,
    );
  });

  it("rejects unknown targets with the known list", async () => {
    await expect(runSend(deps(), { targetName: "nope" })).rejects.toThrow(/unknown target/);
  });
});

describe("runReceive", () => {
  const passingGit = { run: async () => ({ code: 0, stdout: "", stderr: "" }) };
  const store: Record<string, string> = {};
  const files = {
    write: async (path: string, contents: string) => {
      store[path] = contents;
    },
  };
  const readFile = async (path: string) =>
    store[path] ??
    (() => {
      throw new Error("missing");
    })();

  it("receives a bundle into a worktree with anchored context", async () => {
    const sent = await runSend(
      {
        fleet: {
          targets: { m3: { baseUrl: "http://m", repoDir: "/r", password: "p" } },
        },
        hostname: "laptop",
        repoDir: "/work",
        now: () => new Date("2026-08-26T12:00:00.000Z"),
        currentBranch: async () => "opencode/tag-fix",
        writeBundle: async (p, c) => {
          store[p] = c;
        },
      },
      { targetName: "m3", bundleOut: "bundle.json" },
    );
    void sent;

    const r = await runReceive(
      {
        git: passingGit,
        files,
        readFile,
      },
      { bundlePath: "bundle.json", into: "/target-repo" },
    );
    expect(r.branch).toBe("opencode/tag-fix");
    expect(r.directory).toBe("/target-repo/.worktrees/tag-fix");
    expect(r.anchorPath).toContain(".relay/handoff.json");
    expect(store[r.anchorPath]).toContain('"tag-fix"');
  });

  it("materializes carried exported JSON through the importer", async () => {
    store["with-export.json"] = JSON.stringify({
      envelope: {
        version: "handoff.v1",
        createdAt: "2026-08-26T12:00:00.000Z",
        sourceHost: "laptop",
        repo: "CareerStream",
        branch: "opencode/ops-panel",
        worktreeName: "ops-panel",
        session: { id: "ses_src" },
        context: {},
        refs: [],
      },
      events: [],
      exportedJson: '{"exported":true}',
    });
    const r = await runReceive(
      {
        git: passingGit,
        files,
        readFile,
        importer: { importExported: async (json) => (json === '{"exported":true}' ? "ses_imp" : "x") },
      },
      { bundlePath: "with-export.json", into: "/target-repo" },
    );
    expect(r.strategy).toBe("import");
    expect(r.targetSessionId).toBe("ses_imp");
  });

  it("rejects bundles whose envelope is invalid", async () => {
    store["bad.json"] = JSON.stringify({ envelope: { version: "nope" } });
    await expect(
      runReceive({ git: passingGit, files, readFile }, { bundlePath: "bad.json", into: "/t" }),
    ).rejects.toThrow(/bundle envelope invalid/);
  });
});
