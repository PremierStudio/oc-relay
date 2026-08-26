import { describe, expect, it } from "vitest";
import { createServerPlugin, setupRelayServer, type ServerPluginCtx, type ServerTool } from "./server.js";
import type { RelayProc, RelayRunner } from "./run.js";

function runner(handler: (args: string[], cwd: string) => RelayProc): RelayRunner {
  return async (args, cwd) => handler(args, cwd);
}

async function toolsOf(
  run: RelayRunner,
  cwd = "/proj",
): Promise<ServerTool[]> {
  const tools: ServerTool[] = [];
  const ctx: ServerPluginCtx = {
    tool: {
      transform: async (cb) => {
        cb({ add: (tool) => tools.push(tool) });
      },
    },
  };
  await setupRelayServer(ctx, { run, cwd });
  return tools;
}

function named(tools: ServerTool[], name: string): ServerTool {
  const tool = tools.find((t) => t.name === name);
  if (tool === undefined) throw new Error(`missing tool ${name}`);
  return tool;
}

describe("setupRelayServer", () => {
  it("registers relay_targets and relay_send with the OpenCode tool schemas", async () => {
    const tools = await toolsOf(runner(() => ({ code: 0, stdout: "", stderr: "" })));
    expect(tools.map((t) => t.name)).toEqual(["relay_targets", "relay_send"]);
    expect(named(tools, "relay_targets").description).toContain("fleet");
    expect(named(tools, "relay_targets").input).toEqual({
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    });
    expect(named(tools, "relay_send").input).toEqual({
      type: "object",
      properties: {
        target: { type: "string", description: "Fleet target name from relay_targets" },
        session: { type: "string", description: "OpenCode session id to move" },
        steal: { type: "boolean", description: "Also detach the session from this machine" },
      },
      required: ["target"],
      additionalProperties: false,
    });
  });

  it("relay_targets returns the CLI listing", async () => {
    const tools = await toolsOf(
      runner((args, cwd) => {
        expect(args).toEqual(["targets"]);
        expect(cwd).toBe("/proj");
        return { code: 0, stdout: "nas\thttp://nas:1\t/a\n", stderr: "" };
      }),
    );
    await expect(named(tools, "relay_targets").execute({}, {})).resolves.toEqual({
      content: "nas\thttp://nas:1\t/a\n",
    });
  });

  it("relay_targets explains an empty fleet", async () => {
    const tools = await toolsOf(runner(() => ({ code: 0, stdout: "", stderr: "" })));
    await expect(named(tools, "relay_targets").execute({}, {})).resolves.toEqual({
      content: "No fleet targets. Run: relay enroll <name> --repo-dir <path>",
    });
  });

  it("relay_targets surfaces a CLI error", async () => {
    const tools = await toolsOf(runner(() => ({ code: 2, stdout: "", stderr: "bad fleet\n" })));
    await expect(named(tools, "relay_targets").execute({}, {})).resolves.toEqual({
      content: "bad fleet",
    });
  });

  it("relay_send runs steal and session flags and returns the CLI body", async () => {
    const tools = await toolsOf(
      runner((args) => {
        expect(args).toEqual(["send", "--target", "nas", "--session", "ses_1", "--steal"]);
        return { code: 0, stdout: "pushed via sync-replay → nas\ntarget session: ses_9\n", stderr: "" };
      }),
    );
    await expect(
      named(tools, "relay_send").execute({ target: "nas", session: "ses_1", steal: true }, {}),
    ).resolves.toEqual({
      content: "pushed via sync-replay → nas\ntarget session: ses_9\n",
    });
  });

  it("relay_send uses the tool directory when OpenCode provides one", async () => {
    const tools = await toolsOf(
      runner((args, cwd) => {
        expect(cwd).toBe("/session-dir");
        expect(args).toEqual(["send", "--target", "nas"]);
        return { code: 0, stdout: "pushed via sync-replay → nas\n", stderr: "" };
      }),
      "/proj",
    );
    await named(tools, "relay_send").execute({ target: "nas" }, { directory: "/session-dir" });
  });

  it("relay_send returns stderr when the CLI fails", async () => {
    const tools = await toolsOf(
      runner(() => ({ code: 2, stdout: "", stderr: "unknown target\n" })),
    );
    await expect(named(tools, "relay_send").execute({ target: "x" }, {})).resolves.toEqual({
      content: "unknown target",
    });
  });

  it("surfaces stdout when a CLI error has no stderr", async () => {
    const tools = await toolsOf(runner(() => ({ code: 1, stdout: "out-only\n", stderr: "" })));
    await expect(named(tools, "relay_targets").execute({}, {})).resolves.toEqual({
      content: "out-only",
    });
  });

  it("surfaces a fallback when a CLI error has empty streams", async () => {
    const tools = await toolsOf(runner(() => ({ code: 9, stdout: "", stderr: "" })));
    await expect(named(tools, "relay_targets").execute({}, {})).resolves.toEqual({
      content: "relay targets failed (9)",
    });
    await expect(named(tools, "relay_send").execute({ target: "n" }, {})).resolves.toEqual({
      content: "relay send failed (9)",
    });
  });

  it("omits steal unless the flag is exactly true", async () => {
    const seen: string[][] = [];
    const tools = await toolsOf(
      runner((args) => {
        seen.push(args);
        return { code: 0, stdout: "pushed via x → n\n", stderr: "" };
      }),
    );
    await named(tools, "relay_send").execute({ target: "n", steal: false }, {});
    await named(tools, "relay_send").execute({ target: "n" }, {});
    await named(tools, "relay_send").execute({ target: "n", session: ["ses_1"] }, {});
    await named(tools, "relay_send").execute(null, {});
    expect(seen).toEqual([
      ["send", "--target", "n"],
      ["send", "--target", "n"],
      ["send", "--target", "n"],
      ["send", "--target", ""],
    ]);
  });

  it("treats a missing target as an empty string and still invokes send", async () => {
    const seen: string[][] = [];
    const tools = await toolsOf(
      runner((args) => {
        seen.push(args);
        return { code: 0, stdout: "ok", stderr: "" };
      }),
    );
    await named(tools, "relay_send").execute({}, {});
    expect(seen).toEqual([["send", "--target", ""]]);
  });

  it("falls back to the plugin cwd when the tool directory is empty", async () => {
    const tools = await toolsOf(
      runner((_args, cwd) => {
        expect(cwd).toBe("/proj");
        return { code: 0, stdout: "n\thttp://n\t/r\n", stderr: "" };
      }),
      "/proj",
    );
    await named(tools, "relay_targets").execute({}, { directory: "" });
  });
});

describe("createServerPlugin", () => {
  it("default export is the OpenCode server plugin", async () => {
    const plugin = (await import("./server.js")).default;
    expect(plugin.id).toBe("oc-relay");
    expect(plugin.tui).toBe(true);
    expect(typeof plugin.setup).toBe("function");
    const tools: string[] = [];
    await plugin.setup({
      tool: {
        transform: async (cb) => {
          cb({ add: (tool) => tools.push(tool.name) });
        },
      },
    });
    expect(tools).toEqual(["relay_targets", "relay_send"]);
  });

  it("exports id oc-relay with tui enabled and wires setup", async () => {
    const plugin = createServerPlugin(runner(() => ({ code: 0, stdout: "n\thttp://n\t/r\n", stderr: "" })));
    expect(plugin.id).toBe("oc-relay");
    expect(plugin.tui).toBe(true);
    const tools: string[] = [];
    await plugin.setup({
      tool: {
        transform: async (cb) => {
          cb({ add: (tool) => tools.push(tool.name) });
        },
      },
    });
    expect(tools).toEqual(["relay_targets", "relay_send"]);
  });

  it("runs registered tools with process.cwd as the plugin cwd", async () => {
    const cwds: string[] = [];
    const plugin = createServerPlugin(
      runner((_args, cwd) => {
        cwds.push(cwd);
        return { code: 0, stdout: "n\thttp://n\t/r\n", stderr: "" };
      }),
    );
    let listed: { name: string; execute: (args: unknown, ctx: { directory?: string }) => Promise<unknown> }[] = [];
    await plugin.setup({
      tool: {
        transform: async (cb) => {
          cb({
            add: (tool) => {
              listed.push(tool);
            },
          });
        },
      },
    });
    const targets = listed.find((t) => t.name === "relay_targets");
    expect(targets).toBeDefined();
    await targets!.execute({}, {});
    expect(cwds).toEqual([process.cwd()]);
  });
});
