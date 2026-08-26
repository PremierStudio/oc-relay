import { describe, expect, it } from "vitest";
import type { ConfigStore, HookRunner, ManifestSource } from "./ports.js";
import { ManifestInvalidError } from "./ports.js";
import { apply, doctor, type EngineInput } from "./engine.js";
import type { ManageMode } from "./converge.js";

function memoryManifest(doc: unknown): ManifestSource {
  return { load: async () => doc };
}

function memoryStore(initial: Record<string, unknown> = {}): ConfigStore & {
  readonly doc: Record<string, unknown>;
  readonly writes: number;
} {
  const state = { doc: structuredClone(initial), writes: 0 };
  return {
    get doc() {
      return state.doc;
    },
    get writes() {
      return state.writes;
    },
    read: async () => structuredClone(state.doc),
    write: async (next) => {
      state.doc = structuredClone(next);
      state.writes += 1;
    },
  };
}

function scriptHooks(results: Record<string, number>): HookRunner {
  return {
    run: async (command: string) => ({
      command,
      code: results[command] ?? 0,
      durationMs: 1,
      stdout: `out:${command}`,
      stderr: "",
    }),
  };
}

const envWith = (vars: Record<string, string>) => (ref: string) => vars[ref];

const baseInput = (
  over: Partial<EngineInput> & { mode?: ManageMode },
): EngineInput & { mode: ManageMode } =>
  ({
    manifest: memoryManifest({ name: "proj" }),
    store: memoryStore(),
    hooks: scriptHooks({}),
    lookup: () => undefined,
    ...over,
  }) as EngineInput & { mode: ManageMode };

describe("doctor", () => {
  it("rejects with ManifestInvalidError carrying diagnostics", async () => {
    const manifest = memoryManifest({ nope: true });
    const err = await doctor(baseInput({ manifest })).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ManifestInvalidError);
    expect((err as ManifestInvalidError).diagnostics.length).toBeGreaterThan(0);
    expect((err as ManifestInvalidError).name).toBe("ManifestInvalidError");
    expect((err as ManifestInvalidError).message).toContain("invalid env manifest");
  });

  it("reports missing servers for an empty config", async () => {
    const manifest = memoryManifest({
      name: "proj",
      mcpServers: { github: { command: ["npx", "x"], secretRefs: { T: "op://t" } } },
    });
    const r = await doctor(baseInput({ manifest, lookup: envWith({ "op://t": "v" }) }));
    expect(r.manifestName).toBe("proj");
    expect(r.secretErrors).toEqual([]);
    expect(r.findings).toEqual([{ check: "mcp-server", name: "github", status: "missing" }]);
  });

  it("never prunes unknown servers in read-only mode", async () => {
    const manifest = memoryManifest({ name: "proj", mcpServers: { gh: { command: ["a"] } } });
    const store = memoryStore({
      mcpServers: { gh: { command: ["a"] }, rogue: { command: ["x"] } },
    });
    const r = await doctor(baseInput({ manifest, store }));
    expect(r.findings).toEqual([{ check: "mcp-server", name: "gh", status: "ok" }]);
  });

  it("reports ok against converged config and failed hooks distinctly", async () => {
    const manifest = memoryManifest({
      name: "proj",
      mcpServers: { gh: { command: ["a"] } },
      hooks: { doctor: ["check-disk", "check-broken"] },
    });
    const store = memoryStore({ mcpServers: { gh: { command: ["a"] } } });
    const r = await doctor(
      baseInput({ manifest, store, hooks: scriptHooks({ "check-broken": 3 }) }),
    );
    expect(r.findings).toEqual([
      { check: "mcp-server", name: "gh", status: "ok" },
      { check: "hook", name: "check-disk", status: "ok" },
      { check: "hook", name: "check-broken", status: "failed" },
    ]);
    expect(r.hooksRun.map((h) => h.command)).toEqual(["check-disk", "check-broken"]);
    r.hooksRun.forEach((h) => expect(h.durationMs).toBeLessThan(10_000));
  });

  it("surfaces unresolved secret refs without hiding healthy servers", async () => {
    const manifest = memoryManifest({
      name: "proj",
      mcpServers: {
        good: { command: ["a"] },
        bad: { command: ["b"], secretRefs: { K: "missing/ref" } },
      },
    });
    const r = await doctor(baseInput({ manifest, lookup: () => undefined }));
    expect(r.secretErrors).toEqual([
      { path: "mcpServers.bad.secretRefs.K", message: "unresolved secret ref: missing/ref" },
    ]);
    expect(r.findings).toEqual([{ check: "mcp-server", name: "good", status: "missing" }]);
  });
});

describe("apply", () => {
  const manifestWith = (servers: Record<string, unknown>, extra: object = {}) =>
    memoryManifest({ name: "proj", mcpServers: servers, ...extra });

  it("rejects on invalid manifests without touching the store", async () => {
    const store = memoryStore({});
    await expect(
      apply(baseInput({ manifest: memoryManifest({ name: "" }), store, mode: "manifest-only" })),
    ).rejects.toBeInstanceOf(ManifestInvalidError);
    expect(store.writes).toBe(0);
  });

  it("writes resolved servers into the config and reports applied actions", async () => {
    const manifest = manifestWith({
      github: { command: ["npx", "x"], secretRefs: { TOK: "op://t" } },
    });
    const store = memoryStore({ other: true });
    const r = await apply(
      baseInput({ manifest, store, lookup: envWith({ "op://t": "secret!" }), mode: "additive" }),
    );
    expect(r.applied).toEqual([{ kind: "add", name: "github" }]);
    expect(store.writes).toBe(1);
    expect((store.doc["mcpServers"] as Record<string, unknown>)["github"]).toStrictEqual({
      command: ["npx", "x"],
      env: { TOK: "secret!" },
    });
    expect(store.doc["other"]).toBe(true);
  });

  it("skips the write when everything already matches", async () => {
    const manifest = manifestWith({ gh: { command: ["a"] } });
    const store = memoryStore({ mcpServers: { gh: { command: ["a"] } } });
    const r = await apply(baseInput({ manifest, store, mode: "additive" }));
    expect(r.applied).toEqual([]);
    expect(r.findings[0]?.status).toBe("ok");
    expect(store.writes).toBe(0);
  });

  it("updates drifted entries in place, preserving unmanaged keys", async () => {
    const manifest = manifestWith({ gh: { command: ["new"] } });
    const store = memoryStore({
      mcpServers: { gh: { command: ["old"], disabled: true, note: "mine" } },
    });
    const r = await apply(baseInput({ manifest, store, mode: "additive" }));
    expect(r.applied).toEqual([{ kind: "update", name: "gh" }]);
    expect((store.doc["mcpServers"] as Record<string, unknown>)["gh"]).toStrictEqual({
      disabled: true,
      note: "mine",
      command: ["new"],
    });
  });

  it("additive mode leaves unknown servers untouched; manifest-only prunes them", async () => {
    const manifest = manifestWith({ mine: { command: ["a"] } });
    const observed: Record<string, unknown> = {
      mine: { command: ["a"] },
      rogue: { command: ["x"] },
    };

    const additive = await apply(
      baseInput({
        manifest,
        store: memoryStore({ mcpServers: structuredClone(observed) }),
        mode: "additive",
      }),
    );
    expect(additive.applied).toEqual([]);

    const pruning = memoryStore({ mcpServers: structuredClone(observed) });
    const pruned = await apply(baseInput({ manifest, store: pruning, mode: "manifest-only" }));
    expect(pruned.applied).toEqual([{ kind: "remove", name: "rogue" }]);
    expect(Object.keys(pruning.doc["mcpServers"] as Record<string, unknown>)).toEqual(["mine"]);
  });

  it("never prunes when the manifest has no mcpServers section at all", async () => {
    const manifest = memoryManifest({ name: "proj" });
    const store = memoryStore({ mcpServers: { rogue: { command: ["x"] } } });
    const r = await apply(baseInput({ manifest, store, mode: "manifest-only" }));
    expect(r.applied).toEqual([]);
    expect(store.writes).toBe(0);
  });

  it("treats a null mcpServers section as empty and converges onto it", async () => {
    const manifest = manifestWith({ gh: { command: ["a"] } });
    const store = memoryStore({ mcpServers: null });
    const r = await apply(baseInput({ manifest, store, mode: "manifest-only" }));
    expect(r.applied).toEqual([{ kind: "add", name: "gh" }]);
    expect(store.writes).toBe(1);
  });

  it("runs postCreate hooks only after a mutating write; none when unconfigured", async () => {
    const hooks = scriptHooks({});
    const clean = memoryStore({ mcpServers: { gh: { command: ["a"] } } });
    const quiet = await apply(
      baseInput({
        manifest: manifestWith({ gh: { command: ["a"] } }),
        store: clean,
        hooks,
        mode: "additive",
      }),
    );
    expect(quiet.hooksRun).toEqual([]);

    const dirty = memoryStore({});
    const changedNoHooks = await apply(
      baseInput({ manifest: manifestWith({ gh: { command: ["a"] } }), store: dirty, hooks, mode: "additive" }),
    );
    expect(changedNoHooks.applied).toEqual([{ kind: "add", name: "gh" }]);
    expect(changedNoHooks.hooksRun).toEqual([]);

    const dirtyWithHooks = memoryStore({});
    const changed = await apply(
      baseInput({
        manifest: manifestWith(
          { gh: { command: ["a"] } },
          { hooks: { postCreate: ["bin/setup"] } },
        ),
        store: dirtyWithHooks,
        hooks,
        mode: "additive",
      }),
    );
    expect(changed.applied).toEqual([{ kind: "add", name: "gh" }]);
    expect(changed.hooksRun.map((h) => h.command)).toEqual(["bin/setup"]);
    expect(changed.hooksRun[0]?.stdout).toBe("out:bin/setup");
  });
});
