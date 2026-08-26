import { describe, expect, it } from "vitest";
import type { ResolvedMcpServer } from "./mcp.js";
import { convergeMcpServers, type ObservedServers } from "./converge.js";

const gh: ResolvedMcpServer = {
  command: ["npx", "-y", "@modelcontextprotocol/server-github"],
  env: { GITHUB_PERSONAL_ACCESS_TOKEN: "tok" },
};

const lin: ResolvedMcpServer = {
  command: ["npx", "-y", "server-linear"],
  args: ["--verbose"],
};

describe("convergeMcpServers", () => {
  it("adds servers absent from observed state", () => {
    const r = convergeMcpServers({ github: gh }, {}, false);
    expect(r.findings).toEqual([{ check: "mcp-server", name: "github", status: "missing" }]);
    expect(r.errors).toEqual([]);
    expect(r.actions).toStrictEqual([
      { kind: "add", name: "github", entry: { command: gh.command, env: gh.env } },
    ]);
  });

  it("keeps matching entries and reports ok (with args present)", () => {
    const observed: ObservedServers = {
      l: { command: lin.command, args: [...(lin.args ?? [])] },
    };
    const r = convergeMcpServers({ l: lin }, observed, false);
    expect(r.findings).toEqual([{ check: "mcp-server", name: "l", status: "ok" }]);
    expect(r.actions).toEqual([{ kind: "keep", name: "l" }]);
  });

  it("matches regardless of env key order (multi-key)", () => {
    const desiredEnv = { A: "1", B: "2" };
    const observed: ObservedServers = {
      s: { command: ["c"], env: { B: "2", A: "1" } },
    };
    const r = convergeMcpServers(
      { s: { command: ["c"], env: desiredEnv } },
      observed,
      false,
    );
    expect(r.findings[0]?.status).toBe("ok");
  });

  it("flags drift when env keys or values differ at the same positions", () => {
    const observed: ObservedServers = {
      s: { command: ["c"], env: { Z: "9", Y: "8" } },
    };
    const r = convergeMcpServers(
      { s: { command: ["c"], env: { A: "1", B: "2" } } },
      observed,
      false,
    );
    expect(r.findings[0]?.status).toBe("drift");
  });

  it("flags drift when env has extra keys beyond the desired set", () => {
    const observed: ObservedServers = {
      s: { command: ["c"], env: { A: "1", B: "2", C: "3" } },
    };
    const r = convergeMcpServers(
      { s: { command: ["c"], env: { A: "1", B: "2" } } },
      observed,
      false,
    );
    expect(r.findings[0]?.status).toBe("drift");
  });

  it("treats nulls, arrays and primitives as missing", () => {
    for (const bad of [null, [1], "x", 42]) {
      const r = convergeMcpServers({ x: gh }, { x: bad }, false);
      expect(r.findings[0]?.status).toBe("missing");
      expect(r.actions[0]?.kind).toBe("add");
    }
  });

  it("flags drift when managed args/env are missing or wrong", () => {
    expect(
      convergeMcpServers({ l: lin }, { l: { command: lin.command } }, false).findings[0]?.status,
    ).toBe("drift");
    expect(
      convergeMcpServers(
        { l: lin },
        { l: { command: lin.command, args: ["--wrong"] } },
        false,
      ).findings[0]?.status,
    ).toBe("drift");
    expect(
      convergeMcpServers(
        { g: gh },
        { g: { command: gh.command, env: { GITHUB_PERSONAL_ACCESS_TOKEN: "wrong" } } },
        false,
      ).findings[0]?.status,
    ).toBe("drift");
  });

  it("flags drift when observed env is null or an array-like shape", () => {
    expect(
      convergeMcpServers({ g: gh }, { g: { command: gh.command, env: null } }, false).findings[0]
        ?.status,
    ).toBe("drift");
    expect(
      convergeMcpServers({ g: gh }, { g: { command: gh.command, env: {} } }, false).findings[0]
        ?.status,
    ).toBe("drift");
  });

  it("distinguishes arrays from objects and comma-ambiguity", () => {
    // desired single-arg vs observed split args: canonical must differ
    expect(
      convergeMcpServers(
        { l: { command: ["c"], args: ["ab"] } },
        { l: { command: ["c"], args: ["a", "b"] } },
        false,
      ).findings[0]?.status,
    ).toBe("drift");
    // desired env object with positional key vs observed array: differs
    expect(
      convergeMcpServers(
        { g: { command: ["c"], env: { "0": "v" } } },
        { g: { command: ["c"], env: ["v"] } },
        false,
      ).findings[0]?.status,
    ).toBe("drift");
  });

  it("treats absent managed fields as unconstrained (manifest omits → observed extras fine)", () => {
    const r = convergeMcpServers(
      { bare: { command: ["c"] } },
      { bare: { command: ["c"], args: ["--extra"], env: { WHATEVER: "1" } } },
      false,
    );
    expect(r.findings[0]?.status).toBe("ok");
    expect(r.actions).toEqual([{ kind: "keep", name: "bare" }]);
  });

  it("update entries preserve unmanaged keys and replace managed ones", () => {
    const observed: ObservedServers = {
      github: {
        command: ["stale"],
        disabled: true,
        note: "mine",
        env: { OLD: "1" },
        args: ["stale-flag"],
      },
    };
    const r = convergeMcpServers({ github: gh }, observed, false);
    expect(r.actions).toStrictEqual([
      {
        kind: "update",
        name: "github",
        entry: {
          disabled: true,
          note: "mine",
          command: gh.command,
          env: gh.env,
        },
      },
    ]);
  });

  it("update entries carry desired args when the manifest declares them", () => {
    const observed: ObservedServers = {
      l: { command: ["stale"], disabled: true },
    };
    const r = convergeMcpServers({ l: lin }, observed, false);
    expect(r.actions).toStrictEqual([
      {
        kind: "update",
        name: "l",
        entry: { disabled: true, command: lin.command, args: lin.args },
      },
    ]);
  });

  it("additive mode never removes unknown observed servers", () => {
    const r = convergeMcpServers({}, { rogue: { command: ["x"] } }, false);
    expect(r.findings).toEqual([]);
    expect(r.actions).toEqual([]);
  });

  it("pruneUnknown mode removes servers absent from the desired map", () => {
    const r = convergeMcpServers(
      { github: gh },
      { github: { ...gh, extra: true }, rogue: { command: ["x"] } },
      true,
    );
    expect(r.findings).toContainEqual({ check: "mcp-server", name: "rogue", status: "drift" });
    expect(r.actions).toEqual([
      { kind: "keep", name: "github" },
      { kind: "remove", name: "rogue" },
    ]);
  });
});
