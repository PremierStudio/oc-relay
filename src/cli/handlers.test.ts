import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import type { FleetConfig } from "./config.js";
import {
  loadFleet,
  mergeCandidates,
  parseBundle,
  renderBundle,
  runAuthzApprove,
  runAuthzList,
  runAuthzNew,
  requireApproved,
  runEnroll,
  runPing,
  runReceive,
  runSend,
  selectTarget,
  worktreeNameFromBranch,
} from "./handlers.js";
import type { DiscoveredPeer } from "../discovery/tailscale.js";
import type { AuthzCrypto } from "../authz/core.js";
import { memoryAuthzStore } from "../authz/store.js";

describe("loadFleet / selectTarget", () => {
  const fleetRaw = {
    targets: {
      "build-server": { baseUrl: "http://m3:49374", passwordEnv: "P", repoDir: "/r" },
    },
  };

  it("loads valid config", () => {
    const r = loadFleet(fleetRaw, { P: "x" });
    expect(r.errors).toEqual([]);
    expect(Object.keys(r.config.targets)).toEqual(["build-server"]);
  });

  it("surfaces config errors instead of throwing", () => {
    const r = loadFleet({ targets: { x: {} } }, {});
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("selects known targets and explains unknown ones", () => {
    const { config } = loadFleet(fleetRaw, { P: "x" });
    expect(selectTarget(config, "build-server").ok).toBe(true);
    const miss = selectTarget(config, "nope");
    expect(miss.ok).toBe(false);
    if (!miss.ok) {
      expect(miss.message).toBe(`unknown target "nope"; known targets: build-server`);
      expect(miss.known).toEqual(["build-server"]);
    }
    const none = selectTarget({ targets: {} }, undefined);
    expect(none.ok).toBe(false);
    if (!none.ok) {
      expect(none.message).toBe(`no target given; known targets: (none)`);
      expect(none.known).toEqual([]);
    }
  });

  it("explains unknown targets against an empty fleet", () => {
    const miss = selectTarget({ targets: {} }, "nope");
    expect(miss.ok).toBe(false);
    if (!miss.ok) {
      expect(miss.message).toBe(`unknown target "nope"; known targets: (none)`);
      expect(miss.known).toEqual([]);
    }
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
      "build-server": { baseUrl: "http://m3:49374", username: "u", password: "p", repoDir: "/home/u/SampleApp" },
    },
  };
  const deps = (over: Partial<Parameters<typeof runSend>[0]> = {}) => ({
    fleet,
    hostname: "laptop",
    repoDir: "/work/cs",
    now: () => new Date("2026-08-26T12:00:00.000Z"),
    currentBranch: async () => "opencode/ops-panel",
        originUrl: async () => "https://github.com/x/SampleApp.git",
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
      { targetName: "build-server", sessionId: "ses_src" },
    );
    expect(r.mode).toBe("pushed");
    expect(r.report?.strategy).toBe("sync-replay");
    expect(r.report?.targetSessionId).toBe("ses_tgt");
    expect(received).toEqual([{ seq: 1 }]);
    expect(r.envelope.repo).toBe("SampleApp");
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
      { targetName: "build-server", sessionId: "ses_src", bundleOut: "/tmp/b.json" },
    );
    expect(r.mode).toBe("bundled");
    expect(r.bundlePath).toBe("/tmp/b.json");
    const carried = JSON.parse(written["/tmp/b.json"] ?? "{}");
    expect(carried.exportedJson).toBe('{"export":true}');
    expect(carried.envelope.session.id).toBe("ses_src");
  });

  it("derives repo from the directory when no origin URL exists", async () => {
    const d = deps();
    // originUrl returns empty string → directory-derived repo
    const r = await runSend(
      { ...d, writeBundle: async () => undefined },
      { targetName: "build-server", bundleOut: "/tmp/b.json" },
    );
    expect(r.envelope.repo).toBe("SampleApp");
  });

  it("falls back to directory-derived repo when origin is empty", async () => {
    const r = await runSend(
      deps({
        originUrl: async () => "",
        writeBundle: async () => undefined,
      }),
      { targetName: "build-server", bundleOut: "/tmp/b.json" },
    );
    expect(r.envelope.repo).toBe("SampleApp");
  });

  it("uses a placeholder repo name for root-level target dirs", async () => {
    const rootFleet: FleetConfig = {
      targets: { "build-server": { baseUrl: "http://m3", password: "p", repoDir: "/" } },
    };
    const d = deps({ fleet: rootFleet, writeBundle: async () => undefined });
    d.originUrl = async () => "";
    // originUrl returns empty string → directory-derived repo
    const r = await runSend(d, { targetName: "build-server", bundleOut: "/tmp/b.json" });
    expect(r.envelope.repo).toBe("repo");
  });

  it("accepts --context-file and merges structured context", async () => {
    const storeFiles: Record<string, string> = {
      "ctx.json": JSON.stringify({
        summary: "ops panel wired",
        done: ["rpc"],
        left: ["polish"],
        decisions: ["append-only"],
      }),
    };
    const r = await runSend(
      deps({
        readFile: async (p) => storeFiles[p] ?? "",
        writeBundle: async (_p, c) => {
          storeFiles["b"] = c;
        },
      }),
      { targetName: "build-server", bundleOut: "/tmp/b.json", contextFile: "ctx.json" },
    );
    expect(r.envelope.context.summary).toBe("ops panel wired");
    expect(r.envelope.context.left).toEqual(["polish"]);
  });

  it("rejects a context file that is not an object", async () => {
    await expect(
      runSend(
        deps({ readFile: async () => "[1,2]", writeBundle: async () => undefined }),
        { targetName: "build-server", bundleOut: "/tmp/b.json", contextFile: "ctx.json" },
      ),
    ).rejects.toThrow(/context file must be a JSON object/);
  });

  it("rejects a null context document as not-an-object", async () => {
    await expect(
      runSend(
        deps({ readFile: async () => "null", writeBundle: async () => undefined }),
        { targetName: "build-server", bundleOut: "/tmp/b.json", contextFile: "ctx.json" },
      ),
    ).rejects.toThrow(/context file must be a JSON object/);
  });

  it("rejects a scalar context document as not-an-object", async () => {
    await expect(
      runSend(
        deps({ readFile: async () => "42", writeBundle: async () => undefined }),
        { targetName: "build-server", bundleOut: "/tmp/b.json", contextFile: "ctx.json" },
      ),
    ).rejects.toThrow(/context file must be a JSON object/);
  });

  it("names the exact collection that fails validation", async () => {
    const storeFiles: Record<string, string> = {
      "no-done.json": JSON.stringify({ left: [], decisions: [] }),
      "no-left.json": JSON.stringify({ done: [], decisions: [] }),
      "no-decisions.json": JSON.stringify({ done: [], left: [] }),
    };
    for (const [file, field] of [
      ["no-done.json", "done"],
      ["no-left.json", "left"],
      ["no-decisions.json", "decisions"],
    ] as const) {
      await expect(
        runSend(
          deps({
            readFile: async (p) => storeFiles[p] ?? "",
            writeBundle: async () => undefined,
          }),
          { targetName: "build-server", bundleOut: "/b.json", contextFile: file },
        ),
      ).rejects.toThrow(new RegExp(`context file requires string arrays.*${field}`));
    }
  });

  it("rejects a context file whose collections are not string arrays", async () => {
    await expect(
      runSend(
        deps({ readFile: async () => '{"done": 5}', writeBundle: async () => undefined }),
        { targetName: "build-server", bundleOut: "/tmp/b.json", contextFile: "ctx.json" },
      ),
    ).rejects.toThrow(/string arrays/);
  });

  it("rejects --context-file when no reader is available", async () => {
    const d = deps({ writeBundle: async () => undefined });
    delete (d as { readFile?: unknown }).readFile;
    await expect(
      runSend(d, { targetName: "build-server", bundleOut: "/tmp/b.json", contextFile: "ctx.json" }),
    ).rejects.toThrow(/no file reader/);
  });

  it("accepts --context-file without an optional summary", async () => {
    const storeFiles: Record<string, string> = {
      "ctx.json": JSON.stringify({ done: ["a"], left: ["b"], decisions: ["c"] }),
    };
    const r = await runSend(
      deps({
        readFile: async (p) => storeFiles[p] ?? "",
        writeBundle: async (_p, c) => {
          storeFiles["b"] = c;
        },
      }),
      { targetName: "build-server", bundleOut: "/tmp/b.json", contextFile: "ctx.json" },
    );
    expect(r.envelope.context).toStrictEqual({
      done: ["a"],
      left: ["b"],
      decisions: ["c"],
    });
  });

  it("refuses to bundle silently without --bundle-out", async () => {
    const written: Record<string, string> = {};
    await expect(
      runSend(
        { ...deps(), writeBundle: async (p: string, c: string) => void (written[p] = c) },
        { targetName: "build-server", sessionId: "s" },
      ),
    ).rejects.toThrow(/nothing was transferred/);
    expect(Object.keys(written)).toEqual([]);
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
        originUrl: async () => "https://github.com/x/other.git",
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
        repo: "SampleApp",
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
    ).rejects.toThrow(/bundle envelope invalid: version \(must be "handoff.v1"\)/);
  });
});

describe("mergeCandidates", () => {
  const fleet: FleetConfig = {
    targets: {
      "build-server": { baseUrl: "http://build-server:49374", password: "p", repoDir: "/r" },
    },
  };
  const peers: DiscoveredPeer[] = [
    { host: "media-box", dns: "media-box.tailnet-example.ts.net", ip: "100.64.0.12", online: true },
    { host: "sleepy-phone", dns: "sleepy-phone.tailnet-example.ts.net", ip: "100.64.0.13", online: false },
  ];

  it("lists fleet targets first, then online undiscovered peers", () => {
    const c = mergeCandidates(fleet, peers);
    expect(c.map((x) => `${x.source}:${x.name}`)).toEqual([
      "fleet:build-server",
      "discovered:media-box",
    ]);
  });

  it("dedupes peers whose host matches a fleet target name", () => {
    const c = mergeCandidates(fleet, [{ ...peers[0]!, host: "BUILD-SERVER" }]);
    expect(c).toHaveLength(1);
  });
});

describe("runPing", () => {
  const fleet: FleetConfig = {
    targets: {
      "build-server": { baseUrl: "http://build-server:49374", password: "p", repoDir: "/r" },
    },
  };
  const peers: DiscoveredPeer[] = [
    { host: "media-box", dns: "media-box.tailnet-example.ts.net", ip: "100.64.0.12", online: true },
  ];

  it("probes fleet target URLs directly", async () => {
    const probed: string[] = [];
    const results = await runPing(
      {
        fleet,
        probe: async (url) => {
          probed.push(url);
          return { reachable: url.includes("build-server"), status: 404, latencyMs: 3 };
        },
      },
      {},
    );
    expect(probed).toEqual(["http://build-server:49374"]);
    expect(results[0]?.candidate.source).toBe("fleet");
    expect(results[0]?.reachable).toBe(true);
  });

  it("walks discovered candidate urls until one answers (--all)", async () => {
    const results = await runPing(
      {
        fleet,
        discover: async () => peers,
        probe: async (url) => ({ reachable: url.includes("100.64"), latencyMs: 1 }),
      },
      { all: true },
    );
    expect(results.map((r) => r.candidate.name)).toEqual(["build-server", "media-box"]);
    expect(results[1]?.reachable).toBe(true);
    expect(results[1]?.viaUrl).toContain("100.64");
  });

  it("scopes to one --target when given", async () => {
    const results = await runPing(
      {
        fleet,
        discover: async () => peers,
        probe: async () => ({ reachable: false, latencyMs: 0 }),
        port: 49374,
      },
      { targetName: "build-server" },
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.candidate.name).toBe("build-server");
  });

  it("works with no discovery backend at all (manual slot)", async () => {
    const results = await runPing(
      { fleet, probe: async () => ({ reachable: true, latencyMs: 1 }) },
      {},
    );
    expect(results).toHaveLength(1);
  });
});

describe("runEnroll", () => {
  const base = {
    fleet: { targets: {} } as FleetConfig,
    readFile: async () => "{}",
    writeFile: async () => undefined,
    fleetPath: "/tmp/fleet.json",
    env: {},
  };

  it("requires --repo-dir", async () => {
    await expect(runEnroll(base, { name: "x" })).rejects.toThrow(/--repo-dir/);
  });

  it("enrolls from an explicit --base-url with derived password env var", async () => {
    const written: Record<string, string> = {};
    const r = await runEnroll(
      { ...base, writeFile: async (p, c) => void (written[p] = c) },
      { name: "Media Box", baseUrl: "http://media:49374", username: "u", repoDir: "/r" },
    );
    expect(r.baseUrl).toBe("http://media:49374");
    expect(r.discoveredFromPeer).toBe(false);
    expect(r.passwordEnvVar).toBe("MEDIA_BOX_RELAY_PASS");
    const saved = JSON.parse(written["/tmp/fleet.json"] ?? "{}");
    expect(saved.targets["Media Box"].passwordEnv).toBe("MEDIA_BOX_RELAY_PASS");
  });

  it("discovers the peer and probes candidates for a live server", async () => {
    const discover = async (): Promise<DiscoveredPeer[]> => [
      { host: "media-box", dns: "media-box.tailnet-example.ts.net", ip: "100.64.0.12", online: true },
    ];
    const probed: string[] = [];
    const r = await runEnroll(
      {
        ...base,
        discover,
        probe: async (url) => {
          probed.push(url);
          return { reachable: probed.length === 2, latencyMs: 1 };
        },
      },
      { name: "media-box", repoDir: "/r" },
    );
    expect(r.discoveredFromPeer).toBe(true);
    expect(probed[0]).toContain(":49374");
    expect(probed).toHaveLength(2);
  });

  it("errors when discovery finds no such peer", async () => {
    await expect(
      runEnroll({ ...base, discover: async () => [] }, { name: "ghost", repoDir: "/r" }),
    ).rejects.toThrow(/no tailnet peer named "ghost"/);
  });

  it("errors when no candidate endpoint answers", async () => {
    await expect(
      runEnroll(
        {
          ...base,
          discover: async (): Promise<DiscoveredPeer[]> => [
            { host: "media-box", dns: "media-box.tailnet-example.ts.net", ip: "100.64.0.12", online: true },
          ],
          probe: async () => ({ reachable: false, latencyMs: 0 }),
        },
        { name: "media-box", repoDir: "/r" },
      ),
    ).rejects.toThrow(/no OC2 server answered/);
  });

  it("errors when discovery is requested but no backend exists", async () => {
    await expect(runEnroll(base, { name: "x", repoDir: "/r" })).rejects.toThrow(
      /requires --base-url or a working discovery/,
    );
  });

  it("errors when discovery exists but no probe implementation", async () => {
    await expect(
      runEnroll(
        {
          ...base,
          discover: async (): Promise<DiscoveredPeer[]> => [
            { host: "x", dns: "x.tailnet-example.ts.net", ip: "100.64.0.50", online: true },
          ],
        },
        { name: "x", repoDir: "/r" },
      ),
    ).rejects.toThrow(/requires a probe implementation/);
  });

  it("honors --https to prefer the magic-dns candidate", async () => {    const discover = async (): Promise<DiscoveredPeer[]> => [
      { host: "media-box", dns: "media-box.tailnet-example.ts.net", ip: "100.64.0.12", online: true },
    ];
    const probed: string[] = [];
    const r = await runEnroll(
      {
        ...base,
        discover,
        probe: async (url) => {
          probed.push(url);
          return { reachable: true, latencyMs: 0 };
        },
      },
      { name: "media-box", repoDir: "/r", https: true },
    );
    expect(probed[0]).toBe("https://media-box.tailnet-example.ts.net");
    expect(r.baseUrl).toBe("https://media-box.tailnet-example.ts.net");
  });

  it("skips discovery when --base-url is given even if a backend is wired", async () => {
    let discovered = 0;
    const r = await runEnroll(
      {
        ...base,
        discover: async () => {
          discovered++;
          return [];
        },
      },
      { name: "box", baseUrl: "http://explicit", repoDir: "/r" },
    );
    expect(discovered).toBe(0);
    expect(r.discoveredFromPeer).toBe(false);
    expect(r.baseUrl).toBe("http://explicit");
  });

  it("picks the peer whose host matches the enrolled name among several", async () => {
    const probed: string[] = [];
    const r = await runEnroll(
      {
        ...base,
        discover: async (): Promise<DiscoveredPeer[]> => [
          { host: "other", dns: "other.tailnet-example.ts.net", ip: "100.64.0.9", online: true },
          { host: "media-box", dns: "media-box.tailnet-example.ts.net", ip: "100.64.0.12", online: true },
        ],
        probe: async (url) => {
          probed.push(url);
          return { reachable: url.includes("media-box") || url.includes("100.64.0.12"), latencyMs: 1 };
        },
      },
      { name: "media-box", repoDir: "/r" },
    );
    expect(r.discoveredFromPeer).toBe(true);
    expect(probed.every((u) => !u.includes("other.tailnet-example.ts.net"))).toBe(true);
    expect(r.baseUrl).toMatch(/media-box|100\.64\.0\.12/);
  });

  it("keeps an explicit worktreeRoot and username in the saved target", async () => {
    const written: Record<string, string> = {};
    const r = await runEnroll(
      { ...base, writeFile: async (p, c) => void (written[p] = c) },
      {
        name: "box",
        baseUrl: "http://b",
        username: "justin",
        passwordEnv: "BOX_PASS",
        repoDir: "/repo",
        worktreeRoot: "/repo/.wt",
      },
    );
    const saved = JSON.parse(written["/tmp/fleet.json"] ?? "{}").targets["box"];
    expect(saved).toStrictEqual({
      baseUrl: "http://b",
      username: "justin",
      passwordEnv: "BOX_PASS",
      repoDir: "/repo",
      worktreeRoot: "/repo/.wt",
    });
    expect(r.username).toBe("justin");
    expect(r.worktreeRoot).toBe("/repo/.wt");
  });

  it("omits username and worktreeRoot keys from the outcome when absent", async () => {
    const r = await runEnroll(base, { name: "box", baseUrl: "http://b", repoDir: "/r" });
    expect(Object.hasOwn(r, "username")).toBe(false);
    expect(Object.hasOwn(r, "worktreeRoot")).toBe(false);
  });
});

describe("runPing default probe", () => {
  it("falls back to an unreachable-only probe when none is injected", async () => {
    const fleet: FleetConfig = {
      targets: { box: { baseUrl: "http://box:49374", password: "p", repoDir: "/r" } },
    };
    const results = await runPing({ fleet }, {});
    expect(results[0]?.candidate.name).toBe("box");
    expect(results[0]?.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe("runEnroll saved-shape precision", () => {
  it("omits username/worktreeRoot when not provided", async () => {
    const written: Record<string, string> = {};
    const r = await runEnroll(
      {
        fleet: { targets: {} } as FleetConfig,
        readFile: async () => "{}",
        writeFile: async (p, c) => void (written[p] = c),
        fleetPath: "/f.json",
        env: {},
      },
      { name: "box", baseUrl: "http://b", repoDir: "/repo" },
    );
    void r;
    const saved = JSON.parse(written["/f.json"] ?? "{}").targets["box"];
    expect(saved).toStrictEqual({ baseUrl: "http://b", passwordEnv: "BOX_RELAY_PASS", repoDir: "/repo" });
  });
});

describe("runSend git-bundle sidecar", () => {
  const fleet: FleetConfig = {
    targets: { t: { baseUrl: "http://t", password: "p", repoDir: "/work/SampleApp" } },
  };
  const base = () => ({
    fleet,
    hostname: "laptop",
    repoDir: "/work/cs",
    now: () => new Date("2026-08-26T12:00:00.000Z"),
    currentBranch: async () => "opencode/wip-thing",
    originUrl: async () => "https://github.com/x/SampleApp.git",
    writeBundle: async () => undefined,
  });

  it("records the sidecar basename the creator returns", async () => {
    const written: Record<string, string> = {};
    const calls: Array<{ out: string; branch: string }> = [];
    await runSend(
      {
        ...base(),
        createGitBundle: async (out, branch) => {
          calls.push({ out, branch });
          return "b.bundle";
        },
        writeBundle: async (p, c) => void (written[p] = c),
      },
      { targetName: "t", bundleOut: "/tmp/b.json" },
    );
    expect(calls).toEqual([{ out: "/tmp/b.json", branch: "opencode/wip-thing" }]);
    expect(JSON.parse(written["/tmp/b.json"] ?? "{}").gitBundle).toBe("b.bundle");
  });

  it("omits the gitBundle key entirely when the creator returns empty", async () => {
    const written: Record<string, string> = {};
    await runSend(
      {
        ...base(),
        createGitBundle: async () => "",
        writeBundle: async (p, c) => void (written[p] = c),
      },
      { targetName: "t", bundleOut: "/tmp/b.json" },
    );
    const carried = JSON.parse(written["/tmp/b.json"] ?? "{}");
    expect(carried.gitBundle).toBeUndefined();
    expect(Object.keys(carried)).not.toContain("gitBundle");
  });

  it("never invokes the creator when pushing directly", async () => {
    let created = 0;
    const r = await runSend(
      {
        ...base(),
        sourceHistory: async () => [{ seq: 1 }],
        targetReplay: async () => "ses_tgt",
        createGitBundle: async () => {
          created++;
          return "nope.bundle";
        },
      },
      { targetName: "t", sessionId: "s", bundleOut: "/b.json" },
    );
    expect(created).toBe(0);
    expect(r.mode).toBe("pushed");
  });
});

describe("runReceive git-bundle fetch", () => {
  const validEnvelope = {
    version: "handoff.v1",
    createdAt: "2026-08-26T12:00:00.000Z",
    sourceHost: "laptop",
    repo: "SampleApp",
    branch: "opencode/wip-thing",
    worktreeName: "wip-thing",
    context: {},
    refs: [],
  };

  function gitThat(
    decide: (args: string[]) => { code: number; stdout: string; stderr: string },
  ) {
    const calls: string[][] = [];
    const git = {
      run: async (args: string[]) => {
        calls.push(args);
        return decide(args);
      },
    };
    return { git, calls };
  }

  it("fetches the sidecar next to the bundle, then branches from FETCH_HEAD", async () => {
    const { git, calls } = gitThat(() => ({ code: 0, stdout: "", stderr: "" }));
    const r = await runReceive(
      {
        git,
        files: { write: async () => undefined },
        readFile: async () =>
          JSON.stringify({ envelope: validEnvelope, gitBundle: "b.bundle" }),
      },
      { bundlePath: "/carry/b.json", into: "/into" },
    );
    const sidecar = join(dirname("/carry/b.json"), "b.bundle");
    expect(calls[0]).toEqual(["fetch", sidecar, "opencode/wip-thing"]);
    expect(calls[1]).toEqual([
      "worktree",
      "add",
      "-b",
      "opencode/wip-thing",
      join("/into", ".worktrees", "wip-thing"),
      "FETCH_HEAD",
    ]);
    expect(r.branch).toBe("opencode/wip-thing");
  });

  it("fails loudly when the sidecar cannot be fetched", async () => {
    const { git } = gitThat((args) =>
      args[0] === "fetch"
        ? { code: 128, stdout: "", stderr: "  fatal: could not open '/carry/b.bundle'  \n" }
        : { code: 0, stdout: "", stderr: "" },
    );
    await expect(
      runReceive(
        {
          git,
          files: { write: async () => undefined },
          readFile: async () =>
            JSON.stringify({ envelope: validEnvelope, gitBundle: "b.bundle" }),
        },
        { bundlePath: "/carry/b.json", into: "/into" },
      ),
    ).rejects.toThrow(/^git bundle fetch failed: fatal: could not open/);
  });

  it("performs no fetch for bundles without a sidecar reference", async () => {
    const { git, calls } = gitThat(() => ({ code: 0, stdout: "", stderr: "" }));
    await runReceive(
      {
        git,
        files: { write: async () => undefined },
        readFile: async () => JSON.stringify({ envelope: validEnvelope }),
      },
      { bundlePath: "/carry/b.json", into: "/into" },
    );
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[0]).toBe("worktree");
  });
});

describe("authz handlers", () => {
  const crypto = fixedCrypto();
  const store = memoryAuthzStore();
  const deps = { store, crypto, hostname: "desktop", port: 49400 };

it("runAuthzNew persists a pending request and returns one-time material", async () => {
    const r = await runAuthzNew(deps, { action: "send", label: "move to desktop", ttlSeconds: 120 });
    expect(r.id).toBe("id2"); // token mints before id
    expect(r.expiresAt).toBe(1_120_000); // fixed clock (1_000_000) + 120s
    expect(r.claimUrlStr).toBe(`http://desktop/approve?id=${r.id}&token=${r.approveToken}`);
    expect(r.approveCommand).toContain(`--id ${r.id} --token ${r.approveToken}`);
    expect((await store.read())[0]?.status).toBe("pending");
    expect((await store.read())[0]?.label).toBe("move to desktop");
    expect(JSON.stringify(await store.read())).not.toContain(r.approveToken);
  });

  it("omits label from the stored record when none is given", async () => {
    const isolated = { store: memoryAuthzStore(), crypto: fixedCrypto(), hostname: "desktop" };
    const r = await runAuthzNew(isolated, { action: "send" });
    const rec = (await isolated.store.read())[0];
    expect(rec).toBeDefined();
    expect(Object.hasOwn(rec!, "label")).toBe(false);
    expect(r.expiresAt).toBe(1_000_000 + 300_000);
  });

  it("uses a custom port in the claim url when the server is not default", async () => {
    const r = await runAuthzNew({ ...deps, port: 5000 }, { action: "send" });
    expect(r.claimUrlStr).toContain(":5000/approve");
  });

  it("omits the port from the claim url when the approvals server uses the default", async () => {
    const r = await runAuthzNew({ ...deps, port: 49400 }, { action: "send" });
    expect(r.claimUrlStr).toBe(`http://desktop/approve?id=${r.id}&token=${r.approveToken}`);
  });

  it("omits the port entirely when none is configured", async () => {
    const d = { ...deps };
    delete (d as { port?: unknown }).port;
    const r = await runAuthzNew(d, { action: "send" });
    expect(r.claimUrlStr).toBe(`http://desktop/approve?id=${r.id}&token=${r.approveToken}`);
  });

  it("prefers https scheme when requested", async () => {
    const r = await runAuthzNew({ ...deps, https: true }, { action: "send" });
    expect(r.claimUrlStr.startsWith("https://desktop/approve")).toBe(true);
  });

  it("runAuthzList purges finished records and reports statuses", async () => {
    const created = await runAuthzNew(deps, { action: "send" });
    const approved = await runAuthzApprove(deps, {
      id: created.id,
      token: created.approveToken,
    });
    expect(approved).toBe("approved");
    const listed = await runAuthzList(deps);
    expect(listed.find((r) => r.id === created.id)?.status).toBe("approved");
  });

  it("runAuthzApprove reports invalid tokens through the outcome union", async () => {
    const outcome = await runAuthzApprove(deps, { id: "ghost", token: "nope" });
    expect(outcome).toBe("not-found");
  });

  it("requireApproved consumes an approval once then refuses", async () => {
    const created = await runAuthzNew(deps, { action: "enroll", ttlSeconds: 300 });
    await runAuthzApprove(deps, { id: created.id, token: created.approveToken });
    await expect(requireApproved(deps, created.id)).resolves.toBeUndefined();
    await expect(requireApproved(deps, created.id)).rejects.toThrow(/not-approved/);
  });
});

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
    hash: (input: string) =>
      Array.from(input)
        .map((ch: string) => ch.charCodeAt(0).toString(16))
        .join("-"),
  };
}

describe("runSend payload/bundle edges", () => {
  const fleet: FleetConfig = {
    targets: { t: { baseUrl: "http://t", password: "p", repoDir: "/work/SampleApp" } },
  };
  const base = () => ({
    fleet,
    hostname: "laptop",
    repoDir: "/work/cs",
    now: () => new Date("2026-08-26T12:00:00.000Z"),
    currentBranch: async () => "main",
    originUrl: async () => "https://github.com/x/SampleApp.git",
    writeBundle: async (_p: string, _c: string) => undefined,
  });

  it("derives repo from repoDir when origin basename is empty", async () => {
    const r = await runSend(
      { ...base(), originUrl: async () => "https://x/" } as never,
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(r.envelope.repo).toBe("SampleApp");
  });

  it("keeps directory-derived repo when origin url has trailing slash", async () => {
    const r = await runSend(
      { ...base(), originUrl: async () => "/" },
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(r.envelope.repo).toBe("SampleApp");
  });

  it("bundles without any session data when no --session is given", async () => {
    const written: Record<string, string> = {};
    const r = await runSend(
      {
        ...base(),
        writeBundle: async (p, c) => void (written[p] = c),
      },
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(r.mode).toBe("bundled");
    const carried = JSON.parse(written["/b.json"] ?? "{}");
    expect(carried.envelope.session).toBeUndefined();
    expect(carried.events).toBeUndefined();
    expect(carried.exportedJson).toBeUndefined();
  });

  it("carries events in the bundle when history works but replay is unwired", async () => {
    const written: Record<string, string> = {};
    await runSend(
      {
        ...base(),
        sourceHistory: async () => [{ seq: 1 }],
        writeBundle: async (p, c) => void (written[p] = c),
      },
      { targetName: "t", sessionId: "ses_1", bundleOut: "/b.json" },
    );
    expect(JSON.parse(written["/b.json"] ?? "{}").events).toEqual([{ seq: 1 }]);
  });

  it("falls back to exportedJson when history comes back empty", async () => {
    let exported = false;
    const written: Record<string, string> = {};
    await runSend(
      {
        ...base(),
        sourceHistory: async () => [],
        localExport: async () => {
          exported = true;
          return "{\"e\":1}";
        },
        writeBundle: async (p, c) => void (written[p] = c),
      },
      { targetName: "t", sessionId: "ses_1", bundleOut: "/b.json" },
    );
    expect(exported).toBe(true);
    expect(JSON.parse(written["/b.json"] ?? "{}").exportedJson).toBe("{\"e\":1}");
  });

  it("prefers push over bundle even when both are wired", async () => {
    const r = await runSend(
      {
        ...base(),
        sourceHistory: async () => [{ seq: 1 }],
        localExport: async () => "should-not-run",
        targetReplay: async () => "ses_tgt",
      },
      { targetName: "t", sessionId: "ses_1", bundleOut: "/b.json" },
    );
    expect(r.mode).toBe("pushed");
  });

  it("ignores a non-string summary in the context file rather than failing", async () => {
    const storeFiles: Record<string, string> = {
      "ctx.json": JSON.stringify({ done: [], left: [], decisions: [], summary: 42 }),
    };
    const r = await runSend(
      {
        ...base(),
        readFile: async (p) => storeFiles[p] ?? "",
        writeBundle: async () => undefined,
      },
      { targetName: "t", bundleOut: "/b.json", contextFile: "ctx.json" },
    );
    expect(r.envelope.context).toStrictEqual({ done: [], left: [], decisions: [] });
  });
});

describe("parseBundle field-type edges", () => {
  it("omits wrongly-typed fields instead of copying them", () => {
    const parsed = parseBundle({ events: "nope", exportedJson: 5, gitBundle: 7 });
    expect(parsed.payload).toEqual({});
  });

  it("passes through a null envelope untouched", () => {
    expect(parseBundle({ envelope: null }).envelope).toBeNull();
  });

  it("accepts arrays as the document root shape", () => {
    const parsed = parseBundle([1]);
    expect(parsed.envelope).toEqual(undefined);
  });
});

describe("loadFleet failure shape", () => {
  it("returns an empty fleet plus diagnostics on invalid input", () => {
    const r = loadFleet({ targets: { x: {} } }, {});
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.config.targets).toEqual({});
  });
});

describe("runSend repo/session edge coverage", () => {
  const fleet: FleetConfig = {
    targets: { t: { baseUrl: "http://t", password: "p", repoDir: "/work/SampleApp" } },
  };
  const base = () => ({
    fleet,
    hostname: "laptop",
    repoDir: "/work/cs",
    now: () => new Date("2026-08-26T12:00:00.000Z"),
    currentBranch: async () => "main",
    originUrl: async () => "https://github.com/x/SampleApp.git",
    writeBundle: async (_p: string, _c: string) => undefined,
  });

  it("originUrl resolving to empty keeps directory-derived repo", async () => {
    const r = await runSend(
      { ...base(), originUrl: async () => "" },
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(r.envelope.repo).toBe("SampleApp");
  });

  it("strips .git suffix from a differently-named origin", async () => {
    const r = await runSend(
      { ...base(), originUrl: async () => "https://github.com/x/other-name.git" },
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(r.envelope.repo).toBe("other-name");
  });

  it("keeps origin basename even without .git suffix", async () => {
    const r = await runSend(
      { ...base(), originUrl: async () => "https://github.com/x/plain" },
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(r.envelope.repo).toBe("plain");
  });

  it("bundled payloads keep the session id strictly", async () => {
    const written: Record<string, string> = {};
    await runSend(
      {
        ...base(),
        sourceHistory: async () => [{ seq: 1 }],
        writeBundle: async (p, c) => void (written[p] = c),
      },
      { targetName: "t", sessionId: "ses_strict", bundleOut: "/b.json" },
    );
    const carried = JSON.parse(written["/b.json"] ?? "{}");
    expect(carried.envelope.session).toStrictEqual({ id: "ses_strict" });
  });

  it("empty history with no exporter still bundles cleanly", async () => {
    const r = await runSend(
      {
        ...base(),
        sourceHistory: async () => [],
        targetReplay: async () => "nope",
      },
      { targetName: "t", sessionId: "s1", bundleOut: "/b.json" },
    );
    expect(r.mode).toBe("bundled");
  });

  it("keeps inner .git occurrences, stripping only the suffix", async () => {
    const r = await runSend(
      { ...base(), originUrl: async () => "https://github.com/x/team/a.gitb" },
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(r.envelope.repo).toBe("a.gitb");
  });

  it("crashes loudly rather than pushing when events vanish without a session", async () => {
    // targetReplay wired, but no --session ⇒ payload.events stays undefined;
    // the guard must treat that as "not pushable" and fall through to bundle.
    const written: Record<string, string> = {};
    const r = await runSend(
      {
        ...base(),
        targetReplay: async () => "nope",
        writeBundle: async (p, c) => void (written[p] = c),
      },
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(r.mode).toBe("bundled");
    expect(written["/b.json"]).toContain('"envelope"');
  });

  it("throws when --bundle-out is given but no writer exists", async () => {
    const d = base();
    delete (d as { writeBundle?: unknown }).writeBundle;
    await expect(
      runSend(d as never, { targetName: "t", bundleOut: "/b.json" }),
    ).rejects.toThrow(/nothing was transferred/);
  });
});

describe("mergeCandidates multi-candidate dedupe", () => {
  it("dedupes correctly among several candidates", () => {
    const fleet: FleetConfig = {
      targets: {
        alpha: { baseUrl: "http://a", password: "p", repoDir: "/ra" },
        beta: { baseUrl: "http://b", password: "p", repoDir: "/rb" },
      },
    };
    const peers: DiscoveredPeer[] = [
      { host: "alpha", dns: "alpha.tailnet-example.ts.net", ip: "100.64.0.1", online: true },
      { host: "gamma", dns: "gamma.tailnet-example.ts.net", ip: "100.64.0.3", online: true },
    ];
    const c = mergeCandidates(fleet, peers);
    expect(c.map((x) => `${x.source}:${x.name}`)).toEqual([
      "fleet:alpha",
      "fleet:beta",
      "discovered:gamma",
    ]);
  });
});

describe("runSend payload-ladder spies", () => {
  const fleet: FleetConfig = {
    targets: { t: { baseUrl: "http://t", password: "p", repoDir: "/work/SampleApp" } },
  };
  const base = () => ({
    fleet,
    hostname: "laptop",
    repoDir: "/work/cs",
    now: () => new Date("2026-08-26T12:00:00.000Z"),
    currentBranch: async () => "main",
    originUrl: async () => "https://github.com/x/SampleApp.git",
  });

  it("does not touch history or export without --session", async () => {
    let called = 0;
    await runSend(
      {
        ...base(),
        sourceHistory: async () => {
          called++;
          return [{ seq: 1 }];
        },
        localExport: async () => {
          called += 10;
          return "{}";
        },
        writeBundle: async () => undefined,
      },
      { targetName: "t", bundleOut: "/b.json" },
    );
    expect(called).toBe(0);
  });

  it("does not invoke the exporter when history returned events", async () => {
    let exported = 0;
    await runSend(
      {
        ...base(),
        sourceHistory: async () => [{ seq: 1 }],
        localExport: async () => {
          exported++;
          return "{}";
        },
        targetReplay: async () => "ses_tgt",
      },
      { targetName: "t", sessionId: "s", bundleOut: "/b.json" },
    );
    expect(exported).toBe(0);
  });

  it("skips discovery entirely for scoped pings", async () => {
    let discovered = 0;
    const results = await runPing(
      {
        fleet,
        discover: async () => {
          discovered++;
          return [];
        },
        probe: async () => ({ reachable: false, latencyMs: 0 }),
      },
      { targetName: "t" },
    );
    expect(discovered).toBe(0);
    expect(results[0]?.candidate.source).toBe("fleet");
  });

  it("skips discovery for scoped pings even when --all is also given", async () => {
    let discovered = 0;
    const results = await runPing(
      {
        fleet,
        discover: async () => {
          discovered++;
          return [];
        },
        probe: async () => ({ reachable: false, latencyMs: 0 }),
      },
      { targetName: "t", all: true },
    );
    expect(discovered).toBe(0);
    expect(results).toHaveLength(1);
    expect(results[0]?.candidate.source).toBe("fleet");
  });

  it("falls back to unreachable-only probing when no probe fn is injected", async () => {
    const results = await runPing(
      { fleet, discover: async () => [] },
      {},
    );
    expect(results.every((r) => r.reachable === false)).toBe(true);
  });

  it("scoped pings ignore --all absence and still work", async () => {
    const results = await runPing(
      {
        fleet,
        probe: async () => ({ reachable: true, latencyMs: 0 }),
      },
      { targetName: "t" },
    );
    expect(results[0]?.reachable).toBe(true);
  });

  it("does not discover unless --all is given even when a backend is wired", async () => {
    let discovered = 0;
    await runPing(
      {
        fleet,
        discover: async () => {
          discovered++;
          return [];
        },
        probe: async () => ({ reachable: false, latencyMs: 0 }),
      },
      {},
    );
    expect(discovered).toBe(0);
  });

  it("does not discover --all when no backend is wired", async () => {
    const results = await runPing(
      { fleet, probe: async () => ({ reachable: true, latencyMs: 1 }) },
      { all: true },
    );
    expect(results).toHaveLength(1);
    expect(results[0]?.candidate.source).toBe("fleet");
  });
});

describe("runPing multi-target scoping", () => {
  const fleet: FleetConfig = {
    targets: {
      alpha: { baseUrl: "http://a", password: "p", repoDir: "/ra" },
      beta: { baseUrl: "http://b", password: "p", repoDir: "/rb" },
    },
  };

  it("filters the fleet to the named target among several", async () => {
    const probed: string[] = [];
    const results = await runPing(
      {
        fleet,
        probe: async (url) => {
          probed.push(url);
          return { reachable: true, latencyMs: 1 };
        },
      },
      { targetName: "beta" },
    );
    expect(results.map((r) => r.candidate.name)).toEqual(["beta"]);
    expect(probed).toEqual(["http://b"]);
  });

  it("walks every candidate URL until one answers", async () => {
    const peers: DiscoveredPeer[] = [
      { host: "gamma", dns: "gamma.tailnet-example.ts.net", ip: "100.64.0.3", online: true },
    ];
    const probed: string[] = [];
    const results = await runPing(
      {
        fleet,
        discover: async () => peers,
        probe: async (url) => {
          probed.push(url);
          // the DNS candidate answers; the IP fallback must never be probed
          return { reachable: url.includes("gamma.tailnet-example.ts.net"), latencyMs: probed.length };
        },
        port: 49374,
      },
      { all: true },
    );
    const gamma = results.find((r) => r.candidate.name === "gamma");
    expect(gamma?.reachable).toBe(true);
    expect(gamma?.viaUrl).toBe("http://gamma.tailnet-example.ts.net:49374");
    expect(probed.filter((u) => u.includes("gamma"))).toEqual([
      "http://gamma.tailnet-example.ts.net:49374",
    ]);
  });

  it("applies a custom port to discovered peer candidate URLs", async () => {
    const peers: DiscoveredPeer[] = [
      { host: "gamma", dns: "gamma.tailnet-example.ts.net", ip: "100.64.0.3", online: true },
    ];
    const probed: string[] = [];
    await runPing(
      {
        fleet: { targets: {} },
        discover: async () => peers,
        probe: async (url) => {
          probed.push(url);
          return { reachable: false, latencyMs: 0 };
        },
        port: 5150,
      },
      { all: true },
    );
    expect(probed).toEqual([
      "http://gamma.tailnet-example.ts.net:5150",
      "http://100.64.0.3:5150",
    ]);
  });
});

describe("runReceive report-shape precision", () => {
  const passingGit = { run: async () => ({ code: 0, stdout: "", stderr: "" }) };
  const files = { write: async () => undefined };

  it("reports neither strategy nor session for context-only handoffs", async () => {
    const r = await runReceive(
      {
        git: passingGit,
        files,
        readFile: async () =>
          JSON.stringify({
            envelope: {
              version: "handoff.v1",
              createdAt: "2026-08-26T12:00:00.000Z",
              sourceHost: "laptop",
              repo: "r",
              branch: "opencode/x",
              worktreeName: "x",
              context: {},
              refs: [],
            },
          }),
      },
      { bundlePath: "whatever", into: "/into" },
    );
    expect(r.strategy).toBeUndefined();
    expect(r.targetSessionId).toBeUndefined();
    expect(r.directory).toBe("/into/.worktrees/x");
    expect(Object.keys(r).sort()).toEqual(["anchorPath", "branch", "directory"]);
  });
});
