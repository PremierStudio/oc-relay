import { describe, expect, it } from "vitest";
import { createTuiPlugin, selectedTarget, setupRelayTui, type TuiContext, type TuiLayer } from "./tui.js";
import type { RelayProc, RelayRunner } from "./run.js";
import type { ToastSpec } from "./gui.js";

function runner(handler: (args: string[], cwd: string) => RelayProc): RelayRunner {
  return async (args, cwd) => handler(args, cwd);
}

function install(
  ctx: TuiContext,
  run: RelayRunner = runner(() => ({ code: 0, stdout: "nas\thttp://n\t/r\n", stderr: "" })),
  cwd = "/proj",
): Promise<TuiLayer> {
  let layer: (() => TuiLayer) | undefined;
  const wrapped: TuiContext = {
    ...ctx,
    keymap: {
      layer: (fn) => {
        layer = fn;
        ctx.keymap.layer(fn);
      },
    },
  };
  return setupRelayTui(wrapped, { run, cwd }).then(() => {
    if (layer === undefined) throw new Error("keymap.layer was not registered");
    return layer();
  });
}

describe("setupRelayTui", () => {
  it("registers Relay: send session on the palette and /relay", async () => {
    const layer = await install({
      keymap: { layer: () => undefined },
      ui: {
        dialog: { select: async () => undefined, confirm: async () => undefined },
        toast: { show: () => undefined },
      },
    });
    expect(layer.mode).toBe("global");
    expect(layer.bindings).toEqual(["relay.send"]);
    expect(layer.commands).toEqual([
      expect.objectContaining({
        id: "relay.send",
        title: "Relay: send session",
        group: "Relay",
        palette: true,
        slash: { name: "relay" },
      }),
    ]);
  });

  it("picks a target, confirms steal, and toasts the target session id", async () => {
    const toasts: ToastSpec[] = [];
    const layer = await install(
      {
        keymap: { layer: () => undefined },
        ui: {
          dialog: {
            select: async (spec) => {
              expect(spec.title).toBe("Send session to");
              expect(spec.options[0]?.value).toBe("nas");
              return "nas";
            },
            confirm: async () => true,
          },
          toast: { show: (spec) => toasts.push(spec) },
          router: { current: () => ({ type: "session", sessionID: "ses_1" }) },
        },
      },
      runner((args, cwd) => {
        expect(cwd).toBe("/proj");
        if (args[0] === "targets") {
          return { code: 0, stdout: "nas\thttp://n\t/r\n", stderr: "" };
        }
        expect(args).toEqual(["send", "--target", "nas", "--session", "ses_1", "--steal"]);
        return {
          code: 0,
          stdout: "pushed via sync-replay → nas\ntarget session: ses_9\ndetached here: yes\n",
          stderr: "",
        };
      }),
    );
    await layer.commands[0]?.run();
    expect(toasts).toEqual([
      {
        title: "Relay",
        message: "nas has session ses_9. Detached here.",
        variant: "success",
      },
    ]);
  });

  it("accepts a select option object as well as a raw value", async () => {
    const sends: string[][] = [];
    const layer = await install(
      {
        keymap: { layer: () => undefined },
        ui: {
          dialog: {
            select: async () => ({ title: "nas", value: "nas" }),
            confirm: async () => false,
          },
          toast: { show: () => undefined },
        },
      },
      runner((args) => {
        sends.push(args);
        if (args[0] === "targets") return { code: 0, stdout: "nas\thttp://n\t/r\n", stderr: "" };
        return { code: 0, stdout: "pushed via x → nas\n", stderr: "" };
      }),
    );
    await layer.commands[0]?.run();
    expect(sends[1]).toEqual(["send", "--target", "nas"]);
  });

  it("reads a v1 route.current property and location.directory", async () => {
    const cwds: string[] = [];
    const layer = await install(
      {
        keymap: { layer: () => undefined },
        location: { directory: "/session-dir" },
        route: { current: { name: "session", params: { sessionID: "ses_v1" } } },
        ui: {
          dialog: {
            select: async () => "nas",
            confirm: async () => false,
          },
          toast: { show: () => undefined },
        },
      },
      runner((args, cwd) => {
        cwds.push(cwd);
        if (args[0] === "targets") return { code: 0, stdout: "nas\thttp://n\t/r\n", stderr: "" };
        expect(args).toContain("ses_v1");
        return { code: 0, stdout: "pushed via x → nas\n", stderr: "" };
      }),
    );
    await layer.commands[0]?.run();
    expect(cwds).toEqual(["/session-dir", "/session-dir"]);
  });

  it("treats a null select result as cancel", async () => {
    const sends: string[][] = [];
    const layer = await install(
      {
        keymap: { layer: () => undefined },
        ui: {
          dialog: { select: async () => null, confirm: async () => true },
          toast: { show: () => undefined },
        },
      },
      runner((args) => {
        sends.push(args);
        return { code: 0, stdout: "nas\thttp://n\t/r\n", stderr: "" };
      }),
    );
    await layer.commands[0]?.run();
    expect(sends).toEqual([["targets"]]);
  });

  it("treats an undefined select result as cancel when the fleet is non-empty", async () => {
    const sends: string[][] = [];
    const layer = await install(
      {
        keymap: { layer: () => undefined },
        ui: {
          dialog: { select: async () => undefined, confirm: async () => true },
          toast: { show: () => undefined },
        },
      },
      runner((args) => {
        sends.push(args);
        return { code: 0, stdout: "nas\thttp://n\t/r\n", stderr: "" };
      }),
    );
    await layer.commands[0]?.run();
    expect(sends).toEqual([["targets"]]);
  });
});

describe("selectedTarget", () => {
  it("only accepts non-empty strings or option.value strings", () => {
    expect(selectedTarget("")).toBeUndefined();
    expect(selectedTarget(1)).toBeUndefined();
    expect(selectedTarget({ value: 3 })).toBeUndefined();
    expect(selectedTarget({ value: "" })).toBeUndefined();
    expect(selectedTarget({ value: ["x"] })).toBeUndefined();
    expect(selectedTarget({ title: "nas" })).toBeUndefined();
  });
});

describe("createTuiPlugin", () => {
  it("exports id oc-relay.tui and wires setup", async () => {
    const plugin = createTuiPlugin(runner(() => ({ code: 0, stdout: "", stderr: "" })));
    expect(plugin.id).toBe("oc-relay.tui");
    let registered = false;
    await plugin.setup({
      keymap: { layer: () => { registered = true; } },
      ui: {
        dialog: { select: async () => undefined, confirm: async () => undefined },
        toast: { show: () => undefined },
      },
    });
    expect(registered).toBe(true);
  });

  it("default export is the TUI plugin", async () => {
    const plugin = (await import("./tui.js")).default;
    expect(plugin.id).toBe("oc-relay.tui");
    expect(typeof plugin.setup).toBe("function");
    let registered = false;
    await plugin.setup({
      keymap: {
        layer: () => {
          registered = true;
        },
      },
      ui: {
        dialog: { select: async () => undefined, confirm: async () => undefined },
        toast: { show: () => undefined },
      },
    });
    expect(registered).toBe(true);
  });

  it("runs the palette command with process.cwd as the plugin cwd", async () => {
    const cwds: string[] = [];
    const plugin = createTuiPlugin(
      runner((_args, cwd) => {
        cwds.push(cwd);
        return { code: 0, stdout: "", stderr: "" };
      }),
    );
    let layerFn: (() => TuiLayer) | undefined;
    await plugin.setup({
      keymap: {
        layer: (fn) => {
          layerFn = fn;
        },
      },
      ui: {
        dialog: { select: async () => undefined, confirm: async () => undefined },
        toast: { show: () => undefined },
      },
    });
    expect(layerFn).toBeDefined();
    await layerFn!().commands[0]?.run();
    expect(cwds).toEqual([process.cwd()]);
  });

  it("falls back to the plugin cwd when location.directory is empty", async () => {
    const cwds: string[] = [];
    const layer = await install(
      {
        keymap: { layer: () => undefined },
        location: { directory: "" },
        ui: {
          dialog: { select: async () => undefined, confirm: async () => undefined },
          toast: { show: () => undefined },
        },
      },
      runner((_args, cwd) => {
        cwds.push(cwd);
        return { code: 0, stdout: "", stderr: "" };
      }),
      "/proj",
    );
    await layer.commands[0]?.run();
    expect(cwds).toEqual(["/proj"]);
  });
});
